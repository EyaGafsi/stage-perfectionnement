"use client";
import { Provider } from "react-redux";
import { store } from "@/condidat/resume/lib/redux/store";
import { ResumeForm } from "@/condidat/resume/components/ResumeForm";
import { Resume } from "@/condidat/resume/components/Resume";
import { ResumeDropzone } from "@/condidat/resume/components/importimg";
import { useState } from "react";

import { useRouter, useParams } from 'next/navigation';
export default function Create() {
    const params = useParams();
    const [imageUrl, setImageUrl] = useState("");
    const postId = params?.id as string;

  const handleImageUrlChange = (newImageUrl: string) => {
    setImageUrl(newImageUrl); // Met à jour l'URL de l'image
  };
  return (
    <Provider store={store}>
      <main className="relative h-full w-full overflow-hidden bg-gray-50">
        <div className="grid grid-cols-3 md:grid-cols-6">
          <div className="col-span-3"> <ResumeDropzone onFileUrlChange={setImageUrl}  />
            <ResumeForm imageUrl={imageUrl} />
          </div>
          <div className="col-span-3">
            <Resume imageUrl={imageUrl} postId={postId}/>
          </div>
        </div>
      </main>
    </Provider>
  );
}