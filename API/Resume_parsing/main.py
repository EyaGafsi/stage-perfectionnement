import base64
import io
import re
from datetime import datetime
from typing import List

import pdfplumber
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="CV Parser API",
    description="Parse un CV en PDF (base64) et retourne les informations structurées",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# MODÈLES
# ============================================

class CVRequest(BaseModel):
    file_base64: str
    filename: str = "cv.pdf"

class SkillsDetail(BaseModel):
    technical: List[str] = []
    languages: List[str] = []
    soft: List[str] = []
    tools: List[str] = []
    all: List[str] = []

class CVResponse(BaseModel):
    filename: str
    language: str
    experience: str
    education: str
    years_experience: float
    years_education: float
    level: str
    skills: SkillsDetail

# ============================================
# DICTIONNAIRES DE SKILLS
# ============================================

TECHNICAL_SKILLS = {
    "python","java","javascript","typescript","c++","c#","php","ruby","swift","kotlin",
    "go","golang","rust","scala","matlab","perl","bash","shell","powershell","dart",
    "html","css","react","reactjs","vue","vuejs","angular","svelte","nextjs","nuxt",
    "jquery","bootstrap","tailwind","tailwindcss","sass","scss","webpack","vite","redux","graphql",
    "nodejs","node.js","express","fastapi","django","flask","spring","springboot","laravel",
    "rails","asp.net","dotnet",".net","nestjs","symfony",
    "sql","mysql","postgresql","postgres","mongodb","redis","sqlite","oracle","cassandra",
    "elasticsearch","dynamodb","firebase","mariadb","influxdb",
    "aws","azure","gcp","google cloud","docker","kubernetes","k8s","terraform","ansible",
    "jenkins","nginx","apache","linux","ubuntu","unix",
    "machine learning","deep learning","nlp","computer vision","tensorflow","pytorch","keras",
    "scikit-learn","sklearn","pandas","numpy","scipy","matplotlib","spark","hadoop",
    "airflow","mlflow","huggingface","langchain","openai","llm","data science","big data",
    "tableau","power bi","dbt","etl",
    "android","ios","react native","flutter","xamarin","ionic",
    "rest","restful","api","microservices","graphql","grpc","oauth","jwt","ci/cd",
    "agile","scrum","kanban","tdd","bdd","mvc","mvvm","solid","design patterns",
}

LANGUAGE_SKILLS = {
    "anglais","français","arabe","espagnol","allemand","italien","portugais","russe",
    "chinois","japonais","coréen","turc","néerlandais","hindi","polonais",
    "english","french","arabic","spanish","german","italian","portuguese","russian",
    "chinese","japanese","korean","turkish","dutch",
}

SOFT_SKILLS = {
    "communication","leadership","travail en équipe","teamwork","autonomie","adaptabilité",
    "adaptability","créativité","creativity","problem solving","résolution de problèmes",
    "organisation","gestion du temps","time management","rigueur","analytical","proactif",
    "proactive","polyvalent","curiosité","curiosity","empathie","empathy","négociation",
    "negotiation","management","coaching","mentoring","mentorat","esprit d'équipe",
}

TOOLS_SKILLS = {
    "vscode","vs code","visual studio","intellij","pycharm","webstorm","eclipse","vim",
    "git","github","gitlab","bitbucket","svn",
    "jira","confluence","trello","notion","asana","monday","slack","teams","zoom",
    "figma","adobe xd","sketch","photoshop","illustrator","canva","zeplin",
    "jest","pytest","selenium","cypress","postman","junit","mocha",
    "excel","word","powerpoint","office 365","microsoft office","sap","salesforce","wordpress",
}

# ============================================
# PARSER
# ============================================

class CVParser:
    def __init__(self):
        now = datetime.now()
        self.current_year = now.year
        self.current_month = now.month

    def extract_text(self, file_bytes: bytes) -> str:
        text = ""
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                content = page.extract_text()
                if content:
                    text += content + "\n"
        return text

    def detect_language(self, text: str) -> str:
        french_words = ['expérience', 'formation', 'diplôme', 'compétences', 'entreprise']
        return 'fr' if any(w in text.lower() for w in french_words) else 'en'

    def extract_section(self, text: str, start_keywords: list, end_keywords: list = None) -> str:
        text_lower = text.lower()
        start_index = -1
        for keyword in start_keywords:
            idx = text_lower.find(keyword.lower())
            if idx != -1:
                start_index = idx
                break
        if start_index == -1:
            return ""
        if end_keywords is None:
            end_keywords = ['contact', 'certifications']
        end_index = len(text)
        for keyword in end_keywords:
            idx = text_lower.find(keyword.lower(), start_index + 10)
            if idx != -1 and idx < end_index:
                end_index = idx
        section = text[start_index:end_index]
        lines = section.split('\n')
        if lines:
            lines = lines[1:]
        return '\n'.join(lines).strip()

    def find_in_text(self, skill_set: set, source: str) -> set:
        found = set()
        source_lower = source.lower()
        for skill in skill_set:
            pattern = r'(?<![a-zA-Z0-9])' + re.escape(skill) + r'(?![a-zA-Z0-9])'
            if re.search(pattern, source_lower, re.IGNORECASE):
                found.add(skill)
        return found

    def extract_skills(self, text: str) -> dict:
        skills_section = self.extract_section(
            text,
            start_keywords=['compétences','competences','skills','technologies',
                            'stack technique','technical skills','outils','tools','expertise'],
            end_keywords=['experience','expérience','education','formation',
                          'certifications','contact','projets','projects','langues']
        )
        search_text = (skills_section + "\n" + text) if skills_section else text

        found_technical = self.find_in_text(TECHNICAL_SKILLS, search_text)
        found_languages = self.find_in_text(LANGUAGE_SKILLS, text)
        found_soft      = self.find_in_text(SOFT_SKILLS, text)
        found_tools     = self.find_in_text(TOOLS_SKILLS, search_text)

        # Dédupliquer : priorité technical > tools > soft
        found_tools -= found_technical
        found_soft  -= found_technical
        found_soft  -= found_tools

        def cap(s: str) -> str:
            upper = {'sql','html','css','api','aws','gcp','nlp','llm','tdd','bdd',
                     'mvc','mvvm','jwt','xml','json','yaml','rest','grpc','k8s','etl','dbt','php'}
            return s.upper() if s.lower() in upper else s.title()

        technical_list = sorted([cap(s) for s in found_technical])
        languages_list = sorted([cap(s) for s in found_languages])
        soft_list      = sorted([cap(s) for s in found_soft])
        tools_list     = sorted([cap(s) for s in found_tools])
        all_list       = sorted(set(technical_list + tools_list))

        return {
            "technical": technical_list,
            "languages": languages_list,
            "soft":      soft_list,
            "tools":     tools_list,
            "all":       all_list,
        }

    def extract_years_experience(self, text: str) -> float:
        total_months = 0
        p1 = r'du\s+(\d{1,2})/(\d{1,2})/(20\d{2})\s+au\s+(\d{1,2})/(\d{1,2})/(20\d{2})'
        for m in re.findall(p1, text, re.IGNORECASE):
            try:
                _, sm, sy, _, em, ey = [int(x) for x in m]
                total_months += max(0, (ey-sy)*12+(em-sm))
            except: pass

        p2 = (r'(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre'
              r'|january|february|march|april|may|june|july|august|september|october|november|december)'
              r'\s+(20\d{2})\s*[-–—]\s*'
              r'(?:present|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre'
              r'|january|february|march|april|may|june|july|august|september|october|november|december)?\s*(20\d{2})?')
        for sy, ey_str in re.findall(p2, text, re.IGNORECASE):
            ey = self.current_year if not ey_str else int(ey_str)
            total_months += max(0, ey - int(sy)) * 12

        for sy, ey in re.findall(r'(20\d{2})\s*[-–—]\s*(20\d{2}|present)', text, re.IGNORECASE):
            end = self.current_year if ey.lower()=='present' else int(ey)
            total_months += max(0, end - int(sy)) * 12

        for sy, ey in re.findall(r'de\s+(20\d{2})\s+(?:à|a|to)\s+(20\d{2})', text, re.IGNORECASE):
            total_months += max(0, int(ey)-int(sy)) * 12

        return round(total_months/12, 1) if total_months > 0 else 0.0

    def extract_years_education(self, text: str) -> float:
        total_months = 0
        for sy, ey in re.findall(r'de\s+(20\d{2})\s+(?:à|a|to)\s+(20\d{2})', text, re.IGNORECASE):
            total_months += max(0, int(ey)-int(sy)) * 12
        if total_months > 0: return round(total_months/12, 1)

        p = (r'(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre'
             r'|january|february|march|april|may|june|july|august|september|october|november|december)'
             r'\s+(20\d{2})\s*[-–—]\s*'
             r'(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre'
             r'|january|february|march|april|may|june|july|august|september|october|november|december)'
             r'\s+(20\d{2})')
        for sy, ey in re.findall(p, text, re.IGNORECASE):
            total_months += max(0, int(ey)-int(sy)) * 12
        if total_months > 0: return round(total_months/12, 1)

        for sy, ey in re.findall(r'(20\d{2})\s*[-–—]\s*(20\d{2})', text, re.IGNORECASE):
            total_months += max(0, int(ey)-int(sy)) * 12
        if total_months > 0: return round(total_months/12, 1)

        pf = r'du\s+(\d{1,2})/(\d{1,2})/(20\d{2})\s+au\s+(\d{1,2})/(\d{1,2})/(20\d{2})'
        for m in re.findall(pf, text, re.IGNORECASE):
            try:
                _, sm, sy, _, em, ey = [int(x) for x in m]
                total_months += max(0, (ey-sy)*12+(em-sm))
            except: pass

        return round(total_months/12, 1) if total_months > 0 else 0.0

    def estimate_level(self, years_exp: float) -> str:
        if years_exp < 2:   return "Junior"
        elif years_exp < 5: return "Intermédiaire"
        else:               return "Senior/Expert"

    def parse(self, file_bytes: bytes) -> dict:
        text = self.extract_text(file_bytes)
        language = self.detect_language(text)

        experience_text = self.extract_section(
            text,
            start_keywords=['experience','expérience','work experience','emploi'],
            end_keywords=['education','formation','certifications']
        )
        education_text = self.extract_section(
            text,
            start_keywords=['education','formation','academic','études','diplôme'],
            end_keywords=['certifications','contact']
        )

        years_exp = self.extract_years_experience(experience_text)
        years_edu = self.extract_years_education(education_text)
        level     = self.estimate_level(years_exp)
        skills    = self.extract_skills(text)

        return {
            "language":         language,
            "experience":       experience_text[:1500],
            "education":        education_text[:1000],
            "years_experience": years_exp,
            "years_education":  years_edu,
            "level":            level,
            "skills":           skills,
        }

# ============================================
# ENDPOINTS
# ============================================

@app.get("/")
def root():
    return {"message": "CV Parser API v2 — POST /parse"}

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}

@app.post("/parse", response_model=CVResponse)
def parse_cv(request: CVRequest):
    try:
        b64 = request.file_base64
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        file_bytes = base64.b64decode(b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Base64 invalide: {str(e)}")

    if not file_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Le fichier n'est pas un PDF valide")

    try:
        parser = CVParser()
        result = parser.parse(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur de parsing: {str(e)}")

    return CVResponse(filename=request.filename, **result)