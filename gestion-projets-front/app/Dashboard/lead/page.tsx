// app/leads/page.tsx
import LeadsPage from "@/component/leadlist"; // adapte le chemin selon ton projet

export const metadata = {
  title: "Leads",
  description: "Tous les leads",
};

export default function LeadsListPage() {
  return <LeadsPage />;
}
