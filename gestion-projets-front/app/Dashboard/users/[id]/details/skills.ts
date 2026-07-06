// ─── member-skills.types.ts ──────────────────────────────────────────────────
// Ajouter ces types dans votre fichier de types existant (ou importer depuis ici)

export type RepoProvider = "github" | "gitlab" | "bitbucket" | "other";

export interface RepoLink {
  url: string;
  provider: RepoProvider; // auto-détecté à l'affichage
  label?: string;         // optionnel : alias lisible
}

// ── IT skills ────────────────────────────────────────────────────────────────
export interface ITSkills {
  // Profils de code versionné (GitHub / GitLab / Bitbucket auto-détectés)
  repoLinks: RepoLink[];

  // Stack technique libre (ex: ["React", "NestJS", "PostgreSQL"])
  techStack: string[];

  // Langages de programmation avec niveau (1–5)
  languages: { name: string; level: 1 | 2 | 3 | 4 | 5 }[];

  // Méthodologies maîtrisées
  methodologies: string[]; // ex: ["Scrum", "Kanban", "SAFe"]

  // Certifications techniques
  certifications: { name: string; issuer?: string; year?: number }[];

  // Niveau global développeur
  devLevel: "junior" | "mid" | "senior" | "lead" | "expert" | null;

  // Soft skills techniques
  softSkills: string[]; // ex: ["Code review", "Mentoring", "Documentation"]
}

// ── Marketing skills ─────────────────────────────────────────────────────────
export interface MarketingSkills {
  // Outils maîtrisés
  tools: string[]; // ex: ["Canva", "HubSpot", "Google Ads", "Figma"]

  // Canaux maîtrisés
  channels: string[]; // ex: ["SEO", "Email", "Social Media", "Paid Ads"]

  // Langues parlées/écrites pour les campagnes
  languages: { name: string; level: "A1"|"A2"|"B1"|"B2"|"C1"|"C2"|"native" }[];

  // Certifications
  certifications: { name: string; issuer?: string; year?: number }[];

  // Domaines de spécialité
  specialties: string[]; // ex: ["Growth hacking", "Branding", "Copywriting"]

  // Soft skills
  softSkills: string[];
}

// ── Call Center skills ────────────────────────────────────────────────────────
export interface CallCenterSkills {
  // Logiciels CRM / téléphonie maîtrisés
  crm: string[];       // ex: ["Salesforce", "HubSpot", "Zoho"]
  telephony: string[]; // ex: ["Genesys", "Aircall", "3CX", "RingCentral"]

  // Scripts / types d'appels maîtrisés
  scriptTypes: string[]; // ex: ["Prise de RDV", "Rétention", "SAV"]

  // Langues parlées (avec niveau)
  languages: { name: string; level: "A1"|"A2"|"B1"|"B2"|"C1"|"C2"|"native" }[];

  // Certifications (COPC, ISO, etc.)
  certifications: { name: string; issuer?: string; year?: number }[];

  // Soft skills opérationnels
  softSkills: string[]; // ex: ["Empathie", "Gestion du stress", "Écoute active"]

  // KPIs personnels cibles
  targetKpis: { label: string; value: string }[]; // ex: [{label:"TMC cible", value:"4min"}]
}

// ── Profil complet skills d'un membre ────────────────────────────────────────
export interface MemberSkillsProfile {
  memberId: number;
  it?: ITSkills | null;
  marketing?: MarketingSkills | null;
  callCenter?: CallCenterSkills | null;
  updatedAt?: string | null;
}

// ── Payload PATCH vers /member-profiles/:id/skills ───────────────────────────
// (adapter selon votre DTO backend)
export type SkillsPatchPayload = Partial<MemberSkillsProfile>;