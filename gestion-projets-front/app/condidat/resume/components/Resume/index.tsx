"use client";
import { useState, useMemo } from "react";
import  { createContext, useContext} from 'react';
import { ResumeIframeCSR } from "@/condidat/resume/components/Resume/ResumeIFrame";
import { ResumePDF } from "@/condidat/resume/components/Resume/ResumePDF";
import {
  ResumeControlBarCSR,
  ResumeControlBarBorder,
} from "@/condidat/resume/components/Resume/ResumeControlBar";
import { FlexboxSpacer } from "@/condidat/resume/components/FlexboxSpacer";
import { useAppSelector } from "@/condidat/resume/lib/redux/hooks";
import { selectResume } from "@/condidat/resume/lib/redux/resumeSlice";
import { selectSettings } from "@/condidat/resume/lib/redux/settingsSlice";
import { DEBUG_RESUME_PDF_FLAG } from "@/condidat/resume/lib/constants";
import {
  useRegisterReactPDFFont,
  useRegisterReactPDFHyphenationCallback,
} from "@/condidat/resume/components/fonts/hooks";
import { NonEnglishFontsCSSLazyLoader } from "@/condidat/resume/components/fonts/NonEnglishFontsCSSLoader";

const DocumentContext = createContext(null);
export const Resume = ({
  imageUrl,
  postId,

}: {
  imageUrl: string;
  postId:string;
 
}) => {
  const [scale, setScale] = useState(0.8);
  const resume = useAppSelector(selectResume);
  const settings = useAppSelector(selectSettings);
  
  const document = useMemo(
    () => <ResumePDF resume={resume} settings={settings}  isPDF={true} imageUrl={imageUrl} />,
    [resume, settings,imageUrl]
  );

  useRegisterReactPDFFont();
  useRegisterReactPDFHyphenationCallback(settings.fontFamily);

  return (
    <>

      <NonEnglishFontsCSSLazyLoader />
      <div className="relative flex justify-center md:justify-start">
        <FlexboxSpacer maxWidth={50} className="hidden md:block" />
        <div className="relative">
          <section className="h-[calc(100vh-var(--top-nav-bar-height)-var(--resume-control-bar-height))] overflow-hidden md:p-[var(--resume-padding)]">
            <ResumeIframeCSR
              documentSize={settings.documentSize}
              scale={scale}
              enablePDFViewer={DEBUG_RESUME_PDF_FLAG}
            >

              <ResumePDF
                resume={resume}
                settings={settings}
                isPDF={DEBUG_RESUME_PDF_FLAG}
                imageUrl={imageUrl}
              />
            </ResumeIframeCSR>
          </section>
          <ResumeControlBarCSR
            scale={scale}
            setScale={setScale}
            documentSize={settings.documentSize}
            document={document}
            fileName={resume.profile.name + " - Resume"}
            postId={postId}
          />
        </div>
        <ResumeControlBarBorder />
      </div>


    </>
  );
};
export const useDocument = () => useContext(DocumentContext);