"use client";
import { useState } from "react";
import {
  useAppSelector,
  useSaveStateToLocalStorageOnChange,
  useSetInitialStore,
} from "@/condidat/resume/lib/redux/hooks";
import { ShowForm, selectFormsOrder } from "@/condidat/resume/lib/redux/settingsSlice";
import { ProfileForm } from "@/condidat/resume/components/ResumeForm/ProfileForm";
import { WorkExperiencesForm } from "@/condidat/resume/components/ResumeForm/WorkExperiencesForm";
import { EducationsForm } from "@/condidat/resume/components/ResumeForm/EducationsForm";
import { ProjectsForm } from "@/condidat/resume/components/ResumeForm/ProjectsForm";
import { SkillsForm } from "@/condidat/resume/components/ResumeForm/SkillsForm";
import { ThemeForm } from "@/condidat/resume/components/ResumeForm/ThemeForm";
import { CustomForm } from "@/condidat/resume/components/ResumeForm/CustomForm";
import { FlexboxSpacer } from "@/condidat/resume/components/FlexboxSpacer";
import { cx } from "@/condidat/resume/lib/cx";

const formTypeToComponent: { [type in ShowForm]: () => JSX.Element } = {
  workExperiences: WorkExperiencesForm,
  educations: EducationsForm,
  projects: ProjectsForm,
  skills: SkillsForm,
  custom: CustomForm,
};

export const ResumeForm = ({
  imageUrl,

}: {
  imageUrl: string;
 
}) => {
  useSetInitialStore();
  useSaveStateToLocalStorageOnChange();

  const formsOrder = useAppSelector(selectFormsOrder);
  const [isHover, setIsHover] = useState(false);

  return (
    <div
      className={cx(
        "flex justify-center scrollbar-thin scrollbar-track-gray-100 md:h-[calc(100vh-var(--top-nav-bar-height))] md:justify-end md:overflow-y-scroll",
        isHover ? "scrollbar-thumb-gray-200" : "scrollbar-thumb-gray-100"
      )}
      onMouseOver={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <section className="flex max-w-2xl flex-col gap-8 p-[var(--resume-padding)]">
        <ProfileForm />
        {formsOrder.map((form) => {
          const Component = formTypeToComponent[form];
          return <Component key={form} />;
        })}
        <ThemeForm />
        <br />
      </section>
      <FlexboxSpacer maxWidth={50} className="hidden md:block" />
    </div>
  );
};
