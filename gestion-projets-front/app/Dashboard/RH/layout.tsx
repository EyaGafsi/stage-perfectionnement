"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      router.push("/login");
      return;
    }

    const role = JSON.parse(user).role;
    if (role !== "hr_manager" ) {
      router.push("/unauthorized");
    }
  }, [router]);

  return (

        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
  );
}
