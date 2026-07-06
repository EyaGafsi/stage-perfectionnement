"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { MENU_BY_ROLE } from "./menuConfig";

const ROLE_META: Record<string, { badgeBg: string; badgeText: string; dot: string; avatarBg: string; avatarText: string; label: string }> = {
  super_admin:         { avatarBg: "bg-violet-600", avatarText: "text-white", badgeBg: "bg-violet-50",  badgeText: "text-violet-700", dot: "bg-violet-500", label: "Super Admin" },
  admin_company:       { avatarBg: "bg-blue-600",   avatarText: "text-white", badgeBg: "bg-blue-50",    badgeText: "text-blue-700",   dot: "bg-blue-500",   label: "Admin Société" },
  manager:             { avatarBg: "bg-emerald-600",avatarText: "text-white", badgeBg: "bg-emerald-50", badgeText: "text-emerald-700",dot: "bg-emerald-500",label: "Manager" },
  project_manager:     { avatarBg: "bg-amber-500",  avatarText: "text-white", badgeBg: "bg-amber-50",   badgeText: "text-amber-700",  dot: "bg-amber-500",  label: "Chef de Projet" },
  call_center_manager: { avatarBg: "bg-cyan-600",   avatarText: "text-white", badgeBg: "bg-cyan-50",    badgeText: "text-cyan-700",   dot: "bg-cyan-500",   label: "Mgr Centre Appel" },
  sales_manager:       { avatarBg: "bg-rose-600",   avatarText: "text-white", badgeBg: "bg-rose-50",    badgeText: "text-rose-700",   dot: "bg-rose-500",   label: "Mgr Commercial" },
  marketing_manager:   { avatarBg: "bg-orange-500", avatarText: "text-white", badgeBg: "bg-orange-50",  badgeText: "text-orange-700", dot: "bg-orange-500", label: "Mgr Marketing" },
  quality_manager:     { avatarBg: "bg-green-600",  avatarText: "text-white", badgeBg: "bg-green-50",   badgeText: "text-green-700",  dot: "bg-green-500",  label: "Mgr Qualité" },
  hr_manager:          { avatarBg: "bg-purple-600", avatarText: "text-white", badgeBg: "bg-purple-50",  badgeText: "text-purple-700", dot: "bg-purple-500", label: "Mgr RH" },
  agent_telepro:       { avatarBg: "bg-cyan-500",   avatarText: "text-white", badgeBg: "bg-cyan-50",    badgeText: "text-cyan-700",   dot: "bg-cyan-500",   label: "Agent Télépro" },
  commercial:          { avatarBg: "bg-amber-500",  avatarText: "text-white", badgeBg: "bg-amber-50",   badgeText: "text-amber-700",  dot: "bg-amber-500",  label: "Commercial" },
  marketing_agent:     { avatarBg: "bg-orange-500", avatarText: "text-white", badgeBg: "bg-orange-50",  badgeText: "text-orange-700", dot: "bg-orange-500", label: "Agent Marketing" },
  qualite_agent:       { avatarBg: "bg-green-500",  avatarText: "text-white", badgeBg: "bg-green-50",   badgeText: "text-green-700",  dot: "bg-green-500",  label: "Agent Qualité" },
  tech_support:        { avatarBg: "bg-indigo-600", avatarText: "text-white", badgeBg: "bg-indigo-50",  badgeText: "text-indigo-700", dot: "bg-indigo-500", label: "Support Tech" },
  member:              { avatarBg: "bg-slate-500",  avatarText: "text-white", badgeBg: "bg-slate-100",  badgeText: "text-slate-600",  dot: "bg-slate-400",  label: "Membre" },
};

// Sidebar is desktop-only — no mobile props needed
export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
  }, []);

  const logout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (!currentUser?.role) return null;

  const menu = MENU_BY_ROLE[currentUser.role] || [];
  const meta = ROLE_META[currentUser.role] || ROLE_META["member"];
  const initials = currentUser?.fullname
    ? currentUser.fullname.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  // Group by section
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
    <aside
      className={`
        relative flex flex-col h-screen bg-white border-r border-slate-100
        flex-shrink-0 transition-[width] duration-300 ease-in-out
        ${open ? "w-56" : "w-16"}
      `}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="
          absolute -right-3.5 top-8 z-10
          w-7 h-7 rounded-full bg-white border border-slate-200
          flex items-center justify-center shadow-sm
          text-slate-400 hover:text-blue-600 hover:border-blue-300
          transition-all duration-200
        "
      >
        {open ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
      </button>

      {/* Brand */}
      <div className={`flex items-center py-4 border-b border-slate-100 ${open ? "px-4 gap-3" : "px-3 justify-center"}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${meta.avatarBg}`}>
          {initials}
        </div>
        {open && (
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-slate-800 leading-none truncate">Admin Panel</p>
            <span className={`inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${meta.badgeBg} ${meta.badgeText}`}>
              <span className={`w-1 h-1 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        {grouped.map((group, gi) => (
          <div key={gi}>
            {group.section && open && (
              <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400 px-2 mb-1.5">
                {group.section}
              </p>
            )}
            {group.section && !open && <div className="h-1" />}

            <div className="space-y-0.5">
              {group.items.map((item: any) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={!open ? item.label : undefined}
                    className={`
                      flex items-center rounded-lg text-[13px] font-medium transition-all duration-150
                      ${open ? "px-3 py-2" : "justify-center px-2 py-2.5"}
                      ${isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }
                    `}
                  >
                    {open ? (
                      <span className="truncate">{item.label}</span>
                    ) : (
                      // Collapsed: show 2-letter abbreviation
                      <span className={`text-[10px] font-bold ${isActive ? "text-white" : "text-slate-500"}`}>
                        {item.label.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-2 space-y-1">
        {open && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className={`w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${meta.avatarBg} ${meta.avatarText}`}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-slate-800 truncate leading-none">
                {currentUser.fullname || "Utilisateur"}
              </p>
              <p className={`text-[10px] mt-0.5 truncate font-medium ${meta.badgeText}`}>{meta.label}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          title={!open ? "Déconnexion" : undefined}
          className={`
            w-full flex items-center rounded-lg px-3 py-2.5
            text-[13px] font-medium text-slate-500
            hover:bg-red-50 hover:text-red-600 transition-all duration-150
            ${open ? "gap-2.5" : "justify-center"}
          `}
        >
          <LogOut size={15} />
          {open && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}