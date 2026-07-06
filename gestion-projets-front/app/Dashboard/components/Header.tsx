"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";

type User = {
  fullname: string;
  role: string;
};

const ROLE_META: Record<string, { badgeBg: string; badgeText: string; dot: string; avatarBg: string; label: string }> = {
  super_admin:         { badgeBg: "bg-violet-50",  badgeText: "text-violet-700", dot: "bg-violet-500", avatarBg: "bg-violet-600", label: "Super Admin" },
  admin_company:       { badgeBg: "bg-blue-50",    badgeText: "text-blue-700",   dot: "bg-blue-500",   avatarBg: "bg-blue-600",   label: "Admin Société" },
  manager:             { badgeBg: "bg-emerald-50", badgeText: "text-emerald-700",dot: "bg-emerald-500",avatarBg: "bg-emerald-600",label: "Manager" },
  project_manager:     { badgeBg: "bg-amber-50",   badgeText: "text-amber-700",  dot: "bg-amber-500",  avatarBg: "bg-amber-500",  label: "Chef de Projet" },
  call_center_manager: { badgeBg: "bg-cyan-50",    badgeText: "text-cyan-700",   dot: "bg-cyan-500",   avatarBg: "bg-cyan-600",   label: "Mgr Centre Appel" },
  sales_manager:       { badgeBg: "bg-rose-50",    badgeText: "text-rose-700",   dot: "bg-rose-500",   avatarBg: "bg-rose-600",   label: "Mgr Commercial" },
  marketing_manager:   { badgeBg: "bg-orange-50",  badgeText: "text-orange-700", dot: "bg-orange-500", avatarBg: "bg-orange-500", label: "Mgr Marketing" },
  quality_manager:     { badgeBg: "bg-green-50",   badgeText: "text-green-700",  dot: "bg-green-500",  avatarBg: "bg-green-600",  label: "Mgr Qualité" },
  hr_manager:          { badgeBg: "bg-purple-50",  badgeText: "text-purple-700", dot: "bg-purple-500", avatarBg: "bg-purple-600", label: "Mgr RH" },
  agent_telepro:       { badgeBg: "bg-cyan-50",    badgeText: "text-cyan-700",   dot: "bg-cyan-500",   avatarBg: "bg-cyan-500",   label: "Agent Télépro" },
  commercial:          { badgeBg: "bg-amber-50",   badgeText: "text-amber-700",  dot: "bg-amber-500",  avatarBg: "bg-amber-500",  label: "Commercial" },
  marketing_agent:     { badgeBg: "bg-orange-50",  badgeText: "text-orange-700", dot: "bg-orange-500", avatarBg: "bg-orange-500", label: "Agent Marketing" },
  qualite_agent:       { badgeBg: "bg-green-50",   badgeText: "text-green-700",  dot: "bg-green-500",  avatarBg: "bg-green-500",  label: "Agent Qualité" },
  tech_support:        { badgeBg: "bg-indigo-50",  badgeText: "text-indigo-700", dot: "bg-indigo-500", avatarBg: "bg-indigo-600", label: "Support Tech" },
  member:              { badgeBg: "bg-slate-100",  badgeText: "text-slate-600",  dot: "bg-slate-400",  avatarBg: "bg-slate-500",  label: "Membre" },
};

// Mobile nav menu items per role (same structure as sidebar)
import { MENU_BY_ROLE } from "./menuConfig";

interface HeaderProps {
  isMobile: boolean;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export default function Header({ isMobile }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const meta = ROLE_META[user?.role || ""] || ROLE_META["member"];
  const initials = user?.fullname
    ? user.fullname.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  // Build grouped menu for mobile drawer
  const menu = user?.role ? (MENU_BY_ROLE[user.role] || []) : [];
  const grouped: { section: string | null; items: any[] }[] = [];
  let curSection: string | null = null;
  let curItems: any[] = [];
  menu.forEach((item: any) => {
    if (item.section && item.section !== curSection) {
      if (curItems.length) grouped.push({ section: curSection, items: curItems });
      curSection = item.section;
      curItems = [item];
    } else {
      curItems.push(item);
    }
  });
  if (curItems.length) grouped.push({ section: curSection, items: curItems });

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-slate-100 shadow-sm">

        {/* LEFT */}
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          {isMobile && (
            <button
              onClick={() => setMobileNavOpen(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu size={20} />
            </button>
          )}

          <div>
            <span className="text-[15px] font-semibold text-slate-800 tracking-tight">
              Espace Administration
            </span>
            {!isMobile && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="text-[11px] text-slate-400 tracking-wide">Système opérationnel</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — user menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${meta.avatarBg}`}>
              {initials}
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-[13px] font-semibold text-slate-800 leading-none">{user?.fullname || "Utilisateur"}</span>
              <span className={`text-[11px] font-medium mt-0.5 ${meta.badgeText}`}>{meta.label}</span>
            </div>
            <ChevronDown size={15} className="text-slate-400 hidden sm:block" />
          </button>

          {userMenuOpen && (
            <>
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[12px] font-bold text-white ${meta.avatarBg}`}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800">{user?.fullname || "Utilisateur"}</p>
                    <p className={`text-[11px] font-medium mt-0.5 ${meta.badgeText}`}>{meta.label}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut size={15} />
                  Déconnexion
                </button>
              </div>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
            </>
          )}
        </div>
      </header>

      {/* ─── Mobile Navigation Drawer ─── */}
      {isMobile && (
        <>
          {/* Overlay */}
          {mobileNavOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
          )}

          {/* Drawer */}
          <div
            className={`
              fixed top-0 left-0 z-50 h-screen w-72 bg-white flex flex-col
              border-r border-slate-100 shadow-2xl
              transition-transform duration-300 ease-in-out
              ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <p className="text-[14px] font-bold text-slate-800">Admin Panel</p>
                <span className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.badgeBg} ${meta.badgeText}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
              {grouped.map((group, gi) => (
                <div key={gi}>
                  {group.section && (
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 px-2 mb-2">
                      {group.section}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {group.items.map((item: any) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileNavOpen(false)}
                          className={`
                            flex items-center px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all
                            ${isActive
                              ? "bg-blue-600 text-white"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }
                          `}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-slate-100 p-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut size={16} />
                Déconnexion
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}