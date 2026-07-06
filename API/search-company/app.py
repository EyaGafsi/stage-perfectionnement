import os
import threading
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uuid
import sys

# =========================
# LOAD ENV
# =========================

load_dotenv()

HF_SPACE_URL = os.getenv(
    "HF_SPACE_URL",
    "https://themedworld-searchcompay.hf.space"
)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# =========================
# IMPORT OSINT ENGINE
# =========================

sys.path.insert(0, os.path.dirname(__file__))

try:
    # Import des fonctions internes pour un contrôle fin de la progression
    from app import (
        build_context,
        find_company_domain,
        get_company_social_links,
        scrape_company_info,
        get_company_ddgs_info,
        find_employees,
        discover_emails_found_only,
        format_result,
        parse_target_roles,
        set_stop_event,
        clear_stop_event,
        is_stopped,
    )
    import json
    OSINT_MODE = "local"
    print("✅ OSINT engine importé localement depuis app.py")
except ImportError as e:
    print(f"⚠️  Import local échoué ({e}), fallback Gradio client")
    from gradio_client import Client
    _gradio_client = Client(HF_SPACE_URL)
    OSINT_MODE = "gradio"
    print(f"⚠️  OSINT engine via Gradio client : {HF_SPACE_URL}")

# =========================
# APP
# =========================

app = FastAPI(title="OSINT API Gateway")

# =========================
# CORS MIDDLEWARE
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://localhost:3000",
        FRONTEND_URL,
        "https://search-company-xc9u.onrender.com",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# =========================
# SESSION MANAGEMENT
# =========================

class OSINTSession:
    def __init__(self):
        self.progress  = 0.0
        self.status    = "idle"
        self.result    = None
        self.logs      = []
        self.stop_flag = False
        self.lock      = threading.Lock()

sessions: Dict[str, OSINTSession] = {}

def get_or_create_session(session_id: str) -> OSINTSession:
    if session_id not in sessions:
        sessions[session_id] = OSINTSession()
    return sessions[session_id]

# =========================
# MODELS
# =========================

class OSINTRequest(BaseModel):
    company_name:   str
    company_handle: str
    country_name:   str = "Tunisia"
    country_iso:    str = "TN"
    target_roles:   str = ""
    session_id:     Optional[str] = None

class ProgressResponse(BaseModel):
    session_id: str
    progress:   float
    status:     str
    logs:       list
    result:     Optional[Dict[str, Any]] = None

class StopResponse(BaseModel):
    session_id: str
    message:    str
    status:     str
    result:     Optional[Dict[str, Any]] = None

# =========================
# HELPER : mise à jour progression
# =========================

def _update(session_id: str, progress: float,
            log_msg: str = "", status: str = "running"):
    session = get_or_create_session(session_id)
    with session.lock:
        session.progress = round(min(progress, 100.0), 1)
        session.status   = status
        if log_msg:
            session.logs.append(log_msg)
            print(f"[{session_id[:8]}] {progress:.0f}% — {log_msg}")

# =========================
# CŒUR : orchestration avec vraie progression
# =========================

def run_osint_background(session_id: str, data: OSINTRequest):
    """
    Reproduit exactement la logique de run_osint_with_session (app.py)
    en mettant à jour session.progress à chaque étape réelle.

    Étapes et pourcentages :
      0 %  → init
      5 %  → domaine officiel
     15 %  → réseaux sociaux
     25 %  → scraping site + DDGS
     40 %  → recherche employés (LinkedIn)
     60 %  → emails (par employé, interpolé 60→95 %)
     95 %  → finalisation
    100 %  → terminé
    """
    session = get_or_create_session(session_id)
    with session.lock:
        session.status    = "running"
        session.progress  = 0.0
        session.logs      = []
        session.stop_flag = False
        session.result    = None

    result      = {"company": {}, "employees": []}
    target_roles = parse_target_roles(data.target_roles)
    clear_stop_event(session_id)

    def stopped() -> bool:
        return is_stopped(session_id)

    try:
        _update(session_id, 2, f"🔍 OSINT : {data.company_name} ({data.country_name})")

        # ── 1. Contexte ──────────────────────────────────── 5 %
        _update(session_id, 5, "🔧 Construction du contexte...")
        handle_alt, full_matches = build_context(
            data.company_name, data.company_handle,
            data.country_name, data.country_iso,
        )
        _update(session_id, 5, f"   Variantes : {handle_alt[:4]}")
        if target_roles:
            _update(session_id, 5, f"🎯 Rôles ciblés : {', '.join(target_roles)}")
        if stopped(): raise InterruptedError()

        # ── 2. Domaine officiel ───────────────────────────  5 → 15 %
        _update(session_id, 8, "🌐 Recherche du domaine officiel...")
        company_domain = find_company_domain(
            data.company_name, data.company_handle,
            handle_alt, session_id=session_id,
        )
        _update(session_id, 15, f"🌐 Domaine : {company_domain or 'Non trouvé'}")
        if stopped(): raise InterruptedError()

        # ── 3. Réseaux sociaux ────────────────────────────  15 → 25 %
        _update(session_id, 18, "📱 Recherche des réseaux sociaux...")
        social_links = get_company_social_links(
            data.company_name, data.company_handle,
            handle_alt, session_id=session_id,
        )
        _update(session_id, 25, f"📱 Réseaux trouvés : {list(social_links.keys()) or 'aucun'}")
        if social_links.get("linkedin"):
            _update(session_id, 25, f"   LinkedIn : {social_links['linkedin']}")
        if stopped(): raise InterruptedError()

        # ── 4. Scraping site + DDGS ───────────────────────  25 → 40 %
        _update(session_id, 28, "🕷️  Scraping du site officiel...")
        site_info = scrape_company_info(company_domain, session_id=session_id)

        _update(session_id, 34, "🔎 Collecte DDGS (emails, téléphones)...")
        ddgs_info = get_company_ddgs_info(
            data.company_name, data.company_handle,
            data.country_name, session_id=session_id,
        )
        _update(session_id, 40, f"📧 Emails société : {len(site_info['emails'] + ddgs_info['emails'])}")

        result["company"] = {
            "name"        : data.company_name,
            "handle"      : data.company_handle,
            "domain"      : company_domain,
            "social_links": social_links,
            "emails"      : list(dict.fromkeys(site_info["emails"] + ddgs_info["emails"])),
            "phones"      : list(dict.fromkeys(site_info["phones"] + ddgs_info["phones"])),
            "address"     : site_info["address"] or ddgs_info.get("address", ""),
            "description" : site_info["description"],
        }
        if stopped(): raise InterruptedError()

        # ── 5. Employés LinkedIn ──────────────────────────  40 → 60 %
        _update(session_id, 42, "👥 Recherche des employés (filtre strict)...")
        employees = find_employees(
            data.company_name, data.company_handle,
            data.country_name, handle_alt, full_matches,
            target_roles=target_roles, session_id=session_id,
        )
        result["employees"] = employees
        pc = sum(1 for e in employees if e.get("source") == "people_page")
        _update(
            session_id, 60,
            f"✅ {len(employees)} employé(s) "
            f"({pc} via /people, {len(employees)-pc} via DDGS)",
        )
        if stopped(): raise InterruptedError()

        # ── 6. Emails employés ────────────────────────────  60 → 95 %
        total = len(employees)
        _update(session_id, 60, "📧 Recherche des emails (stratégie multi-sources)...")

        for i, emp in enumerate(employees):
            if stopped(): raise InterruptedError()

            # Progression interpolée : 60 % + fraction × 35 %
            pct = 60.0 + (i / max(total, 1)) * 35.0
            _update(session_id, pct, f"   → {emp['name']}...")

            emp["emails"] = discover_emails_found_only(
                emp["name"], company_domain,
                data.company_name, data.company_handle,
                profile_url=emp.get("profile_url", ""),
                session_id=session_id,
            )

        # ── 7. Finalisation ───────────────────────────────  95 → 100 %
        _update(session_id, 95, "📝 Formatage des résultats...")
        markdown, json_str = format_result(result, False, target_roles)

        # Résumé final dans les logs
        total_emails = sum(len(e.get("emails", [])) for e in employees)
        _update(session_id, 98, f"📊 Résumé : {len(employees)} employés · {total_emails} emails")

        with session.lock:
            session.result = {
                "success"          : True,
                "partial"          : False,
                "input"            : data.model_dump(),
                "logs"             : session.logs,
                "results_markdown" : markdown,
                "results_json"     : json_str,
                "message"          : "Recherche complétée avec succès",
            }
            session.progress = 100.0
            session.status   = "completed"
            session.logs.append("✅ OSINT terminé avec succès !")

        print(f"✅ Complété — session {session_id}")

    except InterruptedError:
        print(f"⏸️  Arrêté — session {session_id}")
        markdown, json_str = format_result(result, True, target_roles)
        with session.lock:
            session.result = {
                "success"          : False,
                "partial"          : True,
                "input"            : data.model_dump(),
                "logs"             : session.logs,
                "results_markdown" : markdown,
                "results_json"     : json_str,
                "message"          : "Recherche arrêtée — résultats partiels disponibles",
            }
            session.status = "stopped"
            session.logs.append("🛑 Arrêté — résultats partiels sauvegardés")

    except Exception as e:
        print(f"❌ Session {session_id} erreur : {e}")
        with session.lock:
            if session.status != "stopped":
                session.status = "error"
                session.logs.append(f"❌ Erreur : {str(e)}")
                session.result = {
                    "success"          : False,
                    "partial"          : False,
                    "input"            : data.model_dump(),
                    "logs"             : session.logs,
                    "error"            : str(e),
                    "results_markdown" : "",
                    "results_json"     : "{}",
                    "message"          : "Une erreur s'est produite",
                }


# =========================
# FALLBACK GRADIO (mode non-local)
# =========================

def run_osint_background_gradio(session_id: str, data: OSINTRequest):
    """
    Fallback quand app.py n'est pas disponible localement.
    Appelle la Gradio App avec le bon endpoint.
    """
    session = get_or_create_session(session_id)
    with session.lock:
        session.status    = "running"
        session.progress  = 0.0
        session.logs      = []
        session.stop_flag = False

    # Étapes simulées affichées pendant l'attente Gradio
    SIMULATED_STEPS = [
        (5,  "🔧 Construction du contexte..."),
        (10, "🌐 Recherche du domaine officiel..."),
        (20, "📱 Réseaux sociaux..."),
        (30, "🕷️  Scraping site officiel..."),
        (45, "👥 Recherche des employés..."),
        (65, "📧 Recherche des emails..."),
        (85, "📝 Finalisation..."),
    ]

    import time

    # Thread de progression simulée (s'arrête quand l'appel Gradio termine)
    done_event = threading.Event()

    def _simulate():
        for pct, msg in SIMULATED_STEPS:
            if done_event.wait(timeout=4):
                break
            _update(session_id, pct, msg)

    sim_thread = threading.Thread(target=_simulate, daemon=True)
    sim_thread.start()

    try:
        # ✅ CORRECTION : appel CORRECT au Gradio avec target_roles_str
        logs_str, markdown, json_str = _gradio_client.predict(
            company_name=data.company_name,
            company_handle=data.company_handle,
            country_name=data.country_name,
            country_iso=data.country_iso,
            target_roles_str=data.target_roles,  # ✅ AVEC _str SUFFIX
            api_name="/run_osint",
        )
        
        done_event.set()

        logs_list = logs_str.split("\n") if isinstance(logs_str, str) else logs_str
        with session.lock:
            session.result = {
                "success"          : True,
                "partial"          : False,
                "input"            : data.model_dump(),
                "logs"             : logs_list,
                "results_markdown" : markdown,
                "results_json"     : json_str,
                "message"          : "Recherche complétée avec succès",
            }
            session.progress = 100.0
            session.status   = "completed"
            session.logs     = logs_list
            session.logs.append("✅ OSINT terminé !")

    except Exception as e:
        done_event.set()
        print(f"❌ Erreur Gradio : {e}")
        with session.lock:
            session.status = "error"
            session.logs.append(f"❌ Erreur Gradio : {str(e)}")
            session.result = {
                "success"          : False,
                "partial"          : False,
                "input"            : data.model_dump(),
                "logs"             : session.logs,
                "error"            : str(e),
                "results_markdown" : "",
                "results_json"     : "{}",
                "message"          : "Une erreur s'est produite lors de l'appel Gradio",
            }


# =========================
# DISPATCHER
# =========================

def dispatch_background(session_id: str, data: OSINTRequest):
    if OSINT_MODE == "local":
        run_osint_background(session_id, data)
    else:
        run_osint_background_gradio(session_id, data)


# =========================
# API 1 : TEST SANS AUTH
# =========================

@app.post("/predict-osint-test")
def predict_osint_test(data: OSINTRequest):
    """Appel synchrone sans authentification — pour les tests."""
    print(f"🧪 TEST : {data.company_name}")
    sid = str(uuid.uuid4())
    try:
        if OSINT_MODE == "local":
            from app import run_osint_with_session
            logs_str, markdown, json_str = run_osint_with_session(
                company_name     = data.company_name,
                company_handle   = data.company_handle,
                country_name     = data.country_name,
                country_iso      = data.country_iso,
                session_id       = sid,
                target_roles_str = data.target_roles,
            )
        else:
            # ✅ CORRECTION : appel CORRECT au Gradio avec target_roles_str
            logs_str, markdown, json_str = _gradio_client.predict(
                company_name=data.company_name,
                company_handle=data.company_handle,
                country_name=data.country_name,
                country_iso=data.country_iso,
                target_roles_str=data.target_roles,  # ✅ AVEC _str SUFFIX
                api_name="/run_osint",
            )

        return {
            "success"          : True,
            "input"            : data.model_dump(),
            "logs"             : logs_str,
            "results_markdown" : markdown,
            "results_json"     : json_str,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================
# API 2 : LANCER OSINT ASYNC
# =========================

@app.post("/predict-osint")
def predict_osint(data: OSINTRequest, background_tasks: BackgroundTasks):
    """Lance une recherche OSINT de manière asynchrone."""
    session_id = data.session_id or str(uuid.uuid4())
    get_or_create_session(session_id)
    background_tasks.add_task(dispatch_background, session_id, data)
    print(f"🚀 Session {session_id} lancée : {data.company_name}")
    return {
        "session_id"   : session_id,
        "message"      : "Recherche lancée",
        "status"       : "running",
        "progress_url" : f"/progress/{session_id}",
    }

# =========================
# API 3 : PROGRESSION
# =========================

@app.get("/progress/{session_id}", response_model=ProgressResponse)
def get_progress(session_id: str):
    session = get_or_create_session(session_id)
    with session.lock:
        return ProgressResponse(
            session_id = session_id,
            progress   = session.progress,
            status     = session.status,
            logs       = session.logs,
            result     = session.result,
        )

# =========================
# API 4 : ARRÊTER
# =========================

@app.post("/stop/{session_id}", response_model=StopResponse)
def stop_osint_search(session_id: str):
    session = get_or_create_session(session_id)
    with session.lock:
        if session.status not in ["running", "idle"]:
            return StopResponse(
                session_id = session_id,
                message    = f"Impossible d'arrêter — statut actuel : {session.status}",
                status     = session.status,
                result     = session.result,
            )
        session.stop_flag = True
        session.logs.append("🛑 Arrêt demandé...")

    if OSINT_MODE == "local":
        set_stop_event(session_id)

    print(f"⏹️  Arrêt demandé pour session {session_id}")
    return StopResponse(
        session_id = session_id,
        message    = "Arrêt en cours — résultats partiels sauvegardés à la fin de l'étape courante",
        status     = "stopping",
        result     = None,
    )

# =========================
# API 5 : NETTOYER SESSION
# =========================

@app.delete("/session/{session_id}")
def clear_session(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    session = sessions[session_id]
    with session.lock:
        if session.status in ["completed", "stopped", "error"]:
            del sessions[session_id]
            return {"message": "Session supprimée"}
        raise HTTPException(
            status_code=400,
            detail=f"Impossible de supprimer — statut : {session.status}",
        )

# =========================
# API 6 : HEALTH CHECK
# =========================

@app.get("/health")
def health():
    return {
        "status"          : "ok",
        "message"         : "OSINT API Gateway is running",
        "osint_mode"      : OSINT_MODE,
        "active_sessions" : len(sessions),
        "timestamp"       : datetime.now().isoformat(),
    }

# =========================
# API 7 : DEBUG — TOUTES SESSIONS
# =========================

@app.get("/sessions")
def get_all_sessions():
    return {
        "total_sessions": len(sessions),
        "sessions": {
            sid: {
                "status"    : s.status,
                "progress"  : s.progress,
                "logs_count": len(s.logs),
                "has_result": s.result is not None,
                "stop_flag" : s.stop_flag,
            }
            for sid, s in sessions.items()
        },
    }

# =========================
# API 8 : DEBUG — DÉTAILS SESSION
# =========================

@app.get("/session/{session_id}")
def get_session_details(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    session = sessions[session_id]
    with session.lock:
        return {
            "session_id": session_id,
            "status"    : session.status,
            "progress"  : session.progress,
            "logs"      : session.logs,
            "result"    : session.result,
            "stop_flag" : session.stop_flag,
        }

# =========================
# OPTIONS (preflight CORS)
# =========================

@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return {}

# =========================
# ROOT
# =========================

@app.get("/")
def root():
    return {
        "app"       : "OSINT API Gateway",
        "version"   : "3.0.1",
        "osint_mode": OSINT_MODE,
        "endpoints" : {
            "health"          : "GET    /health",
            "sessions_debug"  : "GET    /sessions",
            "session_details" : "GET    /session/{session_id}",
            "predict"         : "POST   /predict-osint",
            "predict_test"    : "POST   /predict-osint-test",
            "progress"        : "GET    /progress/{session_id}",
            "stop"            : "POST   /stop/{session_id}",
            "clear"           : "DELETE /session/{session_id}",
        },
    }

# =========================
# ERROR HANDLERS
# =========================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

# =========================
# STARTUP / SHUTDOWN
# =========================

@app.on_event("startup")
async def startup_event():
    print("🚀 OSINT API Gateway v3.0.1 démarrée")
    print(f"📡 Mode : {OSINT_MODE}")
    if OSINT_MODE == "gradio":
        print(f"   🔗 Gradio URL: {HF_SPACE_URL}")

@app.on_event("shutdown")
async def shutdown_event():
    print("🛑 OSINT API Gateway arrêtée")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)