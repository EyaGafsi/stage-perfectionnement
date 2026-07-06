"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSetDefaultScale } from "@/condidat/resume/components/Resume/hooks";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  CheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { usePDF } from "@react-pdf/renderer";
import dynamic from "next/dynamic";

const ResumeControlBar = ({
  scale,
  setScale,
  documentSize,
  document,
  fileName,
  postId,
}: {
  scale: number;
  setScale: (scale: number) => void;
  documentSize: string;
  document: JSX.Element;
  fileName: string;
  postId: string;
}) => {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  const { scaleOnResize, setScaleOnResize } = useSetDefaultScale({
    setScale,
    documentSize,
  });

  const [instance, update] = usePDF({ document });

  // Hook to update pdf when document changes
  useEffect(() => {
    // Attendre que le PDF soit mis à jour
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      update();
    }, 100);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [update, document]);

  // Fonction pour exporter en blob et naviguer vers la page de candidature
  const handleExportAndApply = async () => {
    try {
      setIsExporting(true);

      // Forcer une mise à jour du PDF avant d'exporter
      await new Promise((resolve) => {
        setTimeout(() => {
          update();
          resolve(null);
        }, 100);
      });

      // Attendre que le blob soit disponible
      await new Promise((resolve) => {
        const checkBlob = setInterval(() => {
          if (instance.blob) {
            clearInterval(checkBlob);
            resolve(null);
          }
        }, 50);

        // Timeout après 5 secondes
        setTimeout(() => {
          clearInterval(checkBlob);
          resolve(null);
        }, 5000);
      });

      if (!instance.blob) {
        throw new Error("Impossible de générer le PDF");
      }

      // Créer un blob URL
      const blobUrl = URL.createObjectURL(instance.blob);

      // Stocker dans localStorage
      localStorage.setItem("resumeBlobUrl", blobUrl);
      localStorage.setItem("resumeFileName", fileName);

      setExportSuccess(true);

      // Naviguer vers la page de candidature
      if (postId) {
        setTimeout(() => {
          router.push(`/condidat/postuler/${postId}`);
        }, 500);
      } else {
        throw new Error(
          "Erreur : ID de poste manquant. Veuillez accéder à cette page depuis une offre d'emploi."
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'export :", error);
      alert("Erreur lors de la génération du CV");
      setIsExporting(false);
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 flex h-[var(--resume-control-bar-height)] items-center justify-center px-[var(--resume-padding)] text-gray-600 lg:justify-between bg-white border-t">
      <div className="flex items-center gap-2">
        <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.01}
          value={scale}
          onChange={(e) => {
            setScaleOnResize(false);
            setScale(Number(e.target.value));
          }}
        />
        <div className="w-10">{`${Math.round(scale * 100)}%`}</div>
        <label className="hidden items-center gap-1 lg:flex">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4"
            checked={scaleOnResize}
            onChange={() => setScaleOnResize((prev) => !prev)}
          />
          <span className="select-none">Autoscale</span>
        </label>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Bouton Télécharger */}
        <a
          className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-0.5 hover:bg-gray-100 transition-colors"
          href={instance.url!}
          download={fileName}
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          <span className="whitespace-nowrap text-sm">Télécharger</span>
        </a>

        {/* Bouton Postuler (export et navigate) */}
        {postId && (
          <button
            onClick={handleExportAndApply}
            disabled={isExporting || !instance.blob}
            className={`flex items-center gap-1 rounded-md px-3 py-0.5 font-medium transition-all whitespace-nowrap text-sm ${
              exportSuccess
                ? "bg-green-500 text-white border border-green-600"
                : "bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 disabled:opacity-50"
            }`}
          >
            {exportSuccess ? (
              <>
                <CheckIcon className="h-4 w-4" />
                <span>CV préparé</span>
              </>
            ) : isExporting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                <span>Préparation...</span>
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="h-4 w-4" />
                <span>Postuler</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Load ResumeControlBar client side since it uses usePDF, which is a web specific API
 */
export const ResumeControlBarCSR = dynamic(
  () => Promise.resolve(ResumeControlBar),
  {
    ssr: false,
  }
);

export const ResumeControlBarBorder = () => (
  <div className="absolute bottom-[var(--resume-control-bar-height)] w-full border-t-2 bg-gray-50" />
);