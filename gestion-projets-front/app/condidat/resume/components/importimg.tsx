// components/ResumeDropzone.tsx
"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cx } from "@/condidat/resume/lib/cx";

const addPdfSrc = "/assets/add-pdf.svg"; // utiliser le chemin public/ sans import SVG

const defaultFileState = {
  name: "",
  size: 0,
  fileUrl: "",
};

type Props = {
  onFileUrlChange: (fileUrl: string) => void;
  onBlobReady?: (blob: Blob, filename?: string) => void;
  className?: string;
};

export const ResumeDropzone: React.FC<Props> = ({ onFileUrlChange, onBlobReady, className }) => {
  const [file, setFile] = useState(defaultFileState);
  const [isHoveredOnDropzone, setIsHoveredOnDropzone] = useState(false);

  useEffect(() => {
    onFileUrlChange(file.fileUrl);
    return () => {
      if (file.fileUrl) URL.revokeObjectURL(file.fileUrl);
    };
  }, [file.fileUrl, onFileUrlChange]);

  const hasFile = Boolean(file.name);

  const setNewFile = (newFile: File) => {
    if (file.fileUrl) URL.revokeObjectURL(file.fileUrl);
    const fileUrl = URL.createObjectURL(newFile);
    setFile({ name: newFile.name, size: newFile.size, fileUrl });
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const newFile = event.dataTransfer.files?.[0];
    if (!newFile) return;
    setNewFile(newFile);
    setIsHoveredOnDropzone(false);
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = event.target.files?.[0];
    if (!newFile) return;
    setNewFile(newFile);
  };

  const onRemove = () => {
    if (file.fileUrl) URL.revokeObjectURL(file.fileUrl);
    setFile(defaultFileState);
    onFileUrlChange("");
  };

  async function getBlobFromUrl(url: string): Promise<Blob> {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Impossible de récupérer le blob depuis l'URL");
    return await res.blob();
  }

  const handleGetBlob = async () => {
    try {
      if (!file.fileUrl) {
        console.warn("Aucun fichier sélectionné");
        return;
      }
      const blob = await getBlobFromUrl(file.fileUrl);
      if (onBlobReady) onBlobReady(blob, file.name);

      // preview optionnel (ouvre dans un nouvel onglet)
      const previewUrl = URL.createObjectURL(blob);
      window.open(previewUrl);
      setTimeout(() => URL.revokeObjectURL(previewUrl), 5000);
    } catch (err) {
      console.error("Erreur lors de la récupération du blob :", err);
    }
  };

  return (
    <div
      className={cx(
        "flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 py-6",
        isHoveredOnDropzone && "border-sky-400",
        className
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setIsHoveredOnDropzone(true);
      }}
      onDragLeave={() => setIsHoveredOnDropzone(false)}
      onDrop={onDrop}
    >
      <div className="text-center w-full max-w-md">
        <div className="mx-auto h-14 w-14 relative">
          <Image src={addPdfSrc} alt="Add file" fill style={{ objectFit: "contain" }} priority />
        </div>

        {!hasFile ? (
          <p className="pt-3 text-gray-700 text-lg font-semibold">Browse your file or drop it here</p>
        ) : (
          <div className="flex items-center justify-center gap-3 pt-3">
            <div className="pl-2 font-semibold text-gray-900">
              {file.name} - {getFileSizeString(file.size)}
            </div>
            <button
              type="button"
              className="outline-theme-blue rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              title="Remove file"
              onClick={onRemove}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        )}

        <div className="pt-4">
          {!hasFile ? (
            <label
              className={cx(
                "cursor-pointer rounded-full px-6 pb-2.5 pt-2 font-semibold shadow-sm border",
                "bg-white"
              )}
            >
              Browse file
              <input
                type="file"
                accept="image/*,.pdf,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={onInputChange}
              />
            </label>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <button type="button" className="btn-primary" onClick={handleGetBlob}>
                Obtenir Blob (preview)
              </button>
              <button type="button" className="btn-secondary" onClick={onRemove}>
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeDropzone;

/* Helpers */
const getFileSizeString = (fileSizeB: number) => {
  const fileSizeKB = fileSizeB / 1024;
  const fileSizeMB = fileSizeKB / 1024;
  if (fileSizeKB < 1000) {
    return fileSizeKB.toPrecision(3) + " KB";
  } else {
    return fileSizeMB.toPrecision(3) + " MB";
  }
};
