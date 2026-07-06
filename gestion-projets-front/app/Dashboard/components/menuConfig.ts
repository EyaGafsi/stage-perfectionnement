// menuConfig.ts — shared navigation structure used by Header (mobile) and Sidebar (desktop)

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN_COMPANY = "admin_company",
  MANAGER = "manager",
  PROJECT_MANAGER = "project_manager",
  CALL_CENTER_MANAGER = "call_center_manager",
  SALES_MANAGER = "sales_manager",
  MARKETING_MANAGER = "marketing_manager",
  QUALITY_MANAGER = "quality_manager",
  HR_MANAGER = "hr_manager",
  AGENT_TELEPRO = "agent_telepro",
  COMMERCIAL = "commercial",
  MARKETING_AGENT = "marketing_agent",
  QUALITE_AGENT = "qualite_agent",
  TECH_SUPPORT = "tech_support",
  MEMBER = "member",
}

export interface MenuItem {
  href: string;
  label: string;
  section?: string;
}

export const MENU_BY_ROLE: Record<string, MenuItem[]> = {
  [UserRole.SUPER_ADMIN]: [
    { href: "/Dashboard",                label: "Dashboard",              section: "Principal" },
    { href: "/Dashboard/users",          label: "Utilisateurs",           section: "Gestion" },
    { href: "/Dashboard/users/create",   label: "Ajouter Utilisateur" },
    { href: "/Dashboard/companies",      label: "Sociétés" },
    { href: "/Dashboard/companies/create", label: "Ajouter Société" },
    //{ href: "/Dashboard/projects",       label: "Projets" },
    //{ href: "/Dashboard/lead",           label: "Liste des Leads"},
    { href: "/Dashboard/commerciale",    label: "Recherche Société" ,        section: "Commercial" },
  ],
  [UserRole.ADMIN_COMPANY]: [
    { href: "/Dashboard",                label: "Dashboard",              section: "Principal" },
    { href: "/Dashboard/users",          label: "Utilisateurs",           section: "Gestion" },
    { href: "/Dashboard/users/create",   label: "Ajouter Utilisateur" },
    //{ href: "/Dashboard/projects",       label: "Projets" },
   // { href: "/Dashboard/lead",           label: "Liste des Leads",        section: "Commercial" },
    { href: "/Dashboard/commerciale",    label: "Recherche Société" ,        section: "Commercial" },
  ],
  [UserRole.MANAGER]: [
    { href: "/Dashboard",                      label: "Dashboard",           section: "Principal" },
    { href: "/Dashboard/project/create",       label: "Créer un Projet",     section: "Projets" },
    { href: "/Dashboard/project",              label: "Mes Projets" },
    { href: "/Dashboard/project/projectsStats",label: "Statistiques" },
    { href: "/Dashboard/users",                label: "Utilisateurs",        section: "Équipe" },
    { href: "/Dashboard/users/create",         label: "Ajouter Utilisateur" },
  ],
  [UserRole.PROJECT_MANAGER]: [
    { href: "/Dashboard",                      label: "Dashboard",           section: "Principal" },
    { href: "/Dashboard/project",              label: "Mes Projets",         section: "Projets" },
    { href: "/Dashboard/project/projectsStats",label: "Statistiques" },
    { href: "/Dashboard/users",                label: "Utilisateurs",        section: "Équipe" },
    { href: "/Dashboard/users/create",         label: "Ajouter Utilisateur" },
  ],
  [UserRole.CALL_CENTER_MANAGER]: [
    { href: "/Dashboard",              label: "Dashboard",           section: "Principal" },
    { href: "/Dashboard/agents",       label: "Agents",              section: "Centre d'Appel" },
    { href: "/Dashboard/users",        label: "Utilisateurs" },
    { href: "/Dashboard/users/create", label: "Ajouter Utilisateur" },
  ],
  [UserRole.SALES_MANAGER]: [
    { href: "/Dashboard", label: "Dashboard", section: "Principal" },
  ],
  [UserRole.MARKETING_MANAGER]: [
    { href: "/Dashboard/marketing", label: "Hub Marketing", section: "Marketing" },
  ],
  [UserRole.QUALITY_MANAGER]: [
    { href: "/Dashboard", label: "Dashboard", section: "Principal" },
  ],
  [UserRole.HR_MANAGER]: [
    { href: "/Dashboard/RH/postslist",        label: "Offres d'Emploi",       section: "Recrutement" },
    { href: "/Dashboard/RH/postslist/create", label: "Ajouter une Offre" },
    { href: "/Dashboard/users/create",        label: "Ajouter Utilisateur",   section: "Employés" },
    { href: "/Dashboard/users",               label: "Utilisateurs" },
    { href: "/Dashboard/RH/membersStat",      label: "Performance Employés" },
    { href: "/Dashboard/RH/causesexit",       label: "Analyse des Départs" },
  ],
  [UserRole.AGENT_TELEPRO]: [
    { href: "/Dashboard", label: "Mes Appels", section: "Appels" },
  ],
  [UserRole.COMMERCIAL]: [
    { href: "/Dashboard/commerciale",                       label: "Recherche Société",         section: "Prospection" },
    { href: "/Dashboard/commerciale/recomandationindistry", label: "Recommandation Industries" },
  ],
  [UserRole.MARKETING_AGENT]: [
    { href: "/Dashboard/marketing", label: "Génération d'Images", section: "Marketing" },
  ],
  [UserRole.QUALITE_AGENT]: [
    { href: "/Dashboard", label: "Contrôles Qualité", section: "Qualité" },
  ],
  [UserRole.TECH_SUPPORT]: [
    { href: "/Dashboard", label: "Tickets Support", section: "Support" },
  ],
  [UserRole.MEMBER]: [
    { href: "/Dashboard",                          label: "Dashboard",      section: "Principal" },
    { href: "/Dashboard/project/memberproject",    label: "Mes Projets",    section: "Projets" },
    { href: "/Dashboard/memberperformance",        label: "Ma Performance" },
  ],
};