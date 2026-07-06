"use client";

import Image from "next/image";
import {
  Github, Linkedin, Mail, MapPin, GraduationCap, Code2, Database,
  Brain, Network, Sparkles, Server, ScanSearch, Image as ImageIcon,
  BarChart2, Briefcase, Layers, Cpu, Users, ChevronRight,
  Award, Target, Boxes,
} from "lucide-react";
import Link from "next/link";

// ─── Data ─────────────────────────────────────────────────────────────────────

const KEYWORDS = [
  "Multi-tenant", "Machine Learning", "NLP", "Embeddings", "Microservices",
  "FastAPI", "NestJS", "Scoring", "OSINT", "IA Générative", "Power BI", "Fine-tuning",
];

const STACK = [
  { label: "Frontend",      value: "Next.js",                       icon: <Code2 size={16} /> },
  { label: "Backend",       value: "NestJS",                        icon: <Server size={16} /> },
  { label: "Microservices", value: "12 services FastAPI",           icon: <Boxes size={16} /> },
  { label: "Déploiement",   value: "Render & Hugging Face Spaces",  icon: <Cpu size={16} /> },
  { label: "Bases de données", value: "PostgreSQL & MongoDB",       icon: <Database size={16} /> },
  { label: "BI",            value: "Power BI",                      icon: <BarChart2 size={16} /> },
];

const MODULES = [
  {
    icon: <Briefcase size={18} />,
    title: "Gestion de projets multi-domaines",
    desc: "Pilotage des projets IT, Call Center et Marketing depuis une seule plateforme.",
  },
  {
    icon: <Target size={18} />,
    title: "Scoring automatique des employés",
    desc: "Évaluation par règles métier déterministes, sans subjectivité.",
  },
  {
    icon: <BarChart2 size={18} />,
    title: "Analyse statistique des départs RH",
    desc: "Compréhension des facteurs de turnover par l'analyse de données.",
  },
  {
    icon: <Brain size={18} />,
    title: "Estimation durées & coûts (ML)",
    desc: "Prédiction des délais et budgets projets par Machine Learning.",
  },
  {
    icon: <Users size={18} />,
    title: "Recrutement intelligent",
    desc: "Matching candidats / postes par embeddings sémantiques.",
  },
  {
    icon: <ScanSearch size={18} />,
    title: "Scraping OSINT vérifié",
    desc: "Collecte d'informations avec vérification par CrossEncoder.",
  },
  {
    icon: <Network size={18} />,
    title: "Recommandation d'industries",
    desc: "Suggestions sectorielles via Sentence-Transformer fine-tuné.",
  },
  {
    icon: <ImageIcon size={18} />,
    title: "Génération d'images marketing",
    desc: "Création visuelle par GPT-2 et FLUX.1-schnell.",
  },
];

// ─── Avatar (next/image — remplace PHOTO_URL par ton lien) ─────────────────────

const PHOTO_URL = "https://res.cloudinary.com/dbzweuzla/image/upload/v1754434531/wsdsgdrexnh0jtzipvet.jpg";

function Avatar() {
  return (
    <div className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-[2rem] flex-shrink-0">
      <div className="absolute -inset-2 rounded-[2.4rem] bg-gradient-to-br from-teal-300 via-cyan-300 to-teal-200 opacity-70 blur-lg" />
      <div className="relative w-full h-full rounded-[2rem] overflow-hidden border-[5px] border-white shadow-2xl shadow-teal-900/20">
        <Image
          src={PHOTO_URL}
          alt="Trai Mohamed Amin"
          fill
          sizes="(max-width: 640px) 128px, 176px"
          className="object-cover"
          priority
        />
      </div>
      <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-white border-4 border-teal-50 flex items-center justify-center shadow-md">
        <Sparkles size={14} className="text-teal-500" />
      </div>
    </div>
  );
}

// ─── Reusable bits ──────────────────────────────────────────────────────────────

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center text-[11px] sm:text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
      {children}
    </span>
  );
}

function SectionTitle({
  eyebrow, title, icon,
}: { eyebrow: string; title: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-teal-500">{icon}</span>}
        <span className="text-[11px] font-bold uppercase tracking-widest text-teal-500">{eyebrow}</span>
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 via-white to-white">

      {/* ══ HERO ══ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-10 w-40 h-40 rounded-full bg-white/5 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2 blur-2xl" />

        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-14 pb-16 sm:pt-20 sm:pb-24">
          <div className="flex items-center gap-2 mb-6 justify-center sm:justify-start">
            <Sparkles size={15} className="text-cyan-100" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-100">À propos</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 text-center sm:text-left">
            <Avatar />

            <div className="flex-1">
              <h1 className="text-[26px] sm:text-4xl font-black text-white tracking-tight leading-tight">
                Trai Mohamed Amin
              </h1>
              <p className="text-cyan-100 text-sm sm:text-base font-semibold mt-1">
                Data Scientist & Développeur Web
              </p>
              <p className="text-teal-50 text-sm sm:text-base mt-2 max-w-xl">
                Conception et développement de <strong className="text-white">DataPilote</strong>, une
                plateforme intelligente multi-sociétés, réalisée dans le cadre d'un projet de fin
                d'études chez 3LM Solutions.
              </p>

              <div className="flex flex-wrap gap-2 mt-5 justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full bg-white/15 text-white border border-white/20">
                  <GraduationCap size={13} /> Projet de fin d'études
                </span>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full bg-white/15 text-white border border-white/20">
                  <MapPin size={13} /> 3LM Solutions
                </span>
              </div>

              {/* Liens sociaux — à personnaliser */}
              <div className="flex gap-2.5 mt-5 justify-center sm:justify-start">
                <a href="#" aria-label="GitHub" className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-colors">
                  <Github size={16} />
                </a>
                <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-colors">
                  <Linkedin size={16} />
                </a>
                <a href="#" aria-label="Email" className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-colors">
                  <Mail size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Vague de transition */}
        <svg className="block w-full text-white" viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none">
          <path d="M0 40C240 10 480 0 720 12C960 24 1200 56 1440 40V60H0V40Z" fill="currentColor" />
        </svg>
      </div>

      {/* ══ CONTENT ══ */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 -mt-2 pb-20 space-y-10">

        {/* ── Résumé du projet ── */}
        <section className="bg-white rounded-3xl border border-teal-100 shadow-sm p-6 sm:p-8 -mt-4 sm:-mt-8 relative">
          <SectionTitle eyebrow="Le projet" title="DataPilote" icon={<Layers size={16} />} />
          <p className="text-[14px] sm:text-[15px] text-slate-600 leading-relaxed">
            Dans le cadre de la transformation digitale des entreprises, ce projet présente
            la conception et le développement de <strong className="text-slate-800">DataPilote</strong>,
            une plateforme intelligente multi-sociétés réalisée au sein de 3LM Solutions. La plateforme
            repose sur une architecture <strong className="text-slate-800">multi-tenant</strong> combinant
            un frontend Next.js, un backend NestJS et douze microservices FastAPI déployés sur Render et
            Hugging Face Spaces, avec deux bases de données complémentaires : PostgreSQL et MongoDB.
          </p>
          <p className="text-[14px] sm:text-[15px] text-slate-600 leading-relaxed mt-3">
            Elle intègre sept modules fonctionnels couvrant la gestion de projets, le scoring RH,
            l'analyse de données, le Machine Learning prédictif, le recrutement intelligent, l'OSINT,
            la recommandation sectorielle et la génération d'images marketing par IA générative. Une
            intégration <strong className="text-slate-800">Power BI</strong> complète la plateforme
            pour l'analyse décisionnelle avancée.
          </p>

          <div className="flex flex-wrap gap-2 mt-6">
            {KEYWORDS.map(k => <Pill key={k}>{k}</Pill>)}
          </div>
        </section>

        {/* ── Stack technique ── */}
        <section>
          <SectionTitle eyebrow="Architecture" title="Stack technique" icon={<Cpu size={16} />} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {STACK.map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-teal-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:border-teal-200 transition-all">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-teal-500">{s.label}</p>
                  <p className="text-[13px] font-bold text-slate-800 truncate">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Modules fonctionnels ── */}
        <section>
          <SectionTitle eyebrow="Fonctionnalités" title="Sept modules intelligents" icon={<Boxes size={16} />} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MODULES.map(m => (
              <div key={m.title} className="bg-white rounded-2xl border border-teal-100 shadow-sm p-4 sm:p-5 hover:shadow-md hover:-translate-y-0.5 hover:border-teal-200 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm shadow-teal-200">
                    {m.icon}
                  </div>
                  <div>
                    <p className="text-[13.5px] font-bold text-slate-800 leading-snug">{m.title}</p>
                    <p className="text-[12.5px] text-slate-500 mt-1 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bandeau final ── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 p-7 sm:p-9 text-center shadow-xl shadow-teal-200/50">
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative">
            <Award size={26} className="text-cyan-100 mx-auto mb-3" />
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              Un projet de fin d'études au service de la décision
            </h3>
            <p className="text-teal-50 text-[13.5px] max-w-xl mx-auto leading-relaxed">
              DataPilote combine ingénierie logicielle, intelligence artificielle et analyse
              décisionnelle pour outiller la transformation digitale des entreprises multi-sociétés.
            </p>
         <Link
  href="/login"
  className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 bg-white text-teal-700 rounded-xl text-[13px] font-bold hover:bg-teal-50 transition-colors shadow-sm"
>
  Découvrir le projet <ChevronRight size={14} />
</Link>
          </div>
        </section>
      </div>
    </div>
  );
}