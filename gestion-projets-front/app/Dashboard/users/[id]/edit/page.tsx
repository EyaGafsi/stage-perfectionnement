"use client";

import EditUserPage from "@/component/edituser";
import { useParams , useRouter} from "next/navigation";
import MemberProfileForm from "@/component/profilmember";

export default function EditUserPagePage() {
  const params = useParams();
  const router=useRouter()
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <div className="p-10">
      <EditUserPage id={id} />

    </div>
  );
}
