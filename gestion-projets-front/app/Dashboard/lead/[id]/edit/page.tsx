"use client";

import { useParams } from "next/navigation";
import EditLeadPage from "@/component/editlead";

export default function EditLeadWrapper() {
  const { id } = useParams();

  return (
    <div className="p-8">
      <EditLeadPage leadId={id as string} />
    </div>
  );
}
