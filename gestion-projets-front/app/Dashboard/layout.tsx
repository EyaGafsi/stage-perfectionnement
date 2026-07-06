"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

type UserRole =
  | "super_admin" | "admin_company" | "manager" | "project_manager"
  | "call_center_manager" | "sales_manager" | "marketing_manager"
  | "quality_manager" | "hr_manager" | "agent_telepro" | "commercial"
  | "marketing_agent" | "qualite_agent" | "tech_support" | "member";

type User = {
  fullname: string;
  role: UserRole;
};

const allowedRoles: UserRole[] = [
  "super_admin", "admin_company", "manager", "project_manager",
  "call_center_manager", "sales_manager", "marketing_manager",
  "quality_manager", "hr_manager", "agent_telepro", "commercial",
  "marketing_agent", "qualite_agent", "tech_support", "member",
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Auth check
    const token = localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser: User = JSON.parse(userStr);
      if (!allowedRoles.includes(parsedUser.role)) {
        router.push("/unauthorized");
        return;
      }
      setIsAuthorized(true);
    } catch {
      localStorage.clear();
      router.push("/login");
    }

    // Responsive detection
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [router]);

  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">

      {/* Sidebar — desktop only, hidden on mobile */}
      {!isMobile && <Sidebar />}

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">

        {/* Header — handles mobile nav drawer internally */}
        <Header isMobile={isMobile} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}