'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';

// ── Hooks ──
import { useAuth }        from './components/Useauth';
import { useProjectData } from './components/Useprojectdata';

// ── Sub-components ──
import ProjectHeader    from './components/ProjectHeader';
import AlertBanner      from './components/Alertbanner';
import ProjectInfoSection from './components/Projectinfosection';
import MembersSection   from './components/Memberssection';
import DomainSection    from './components/Domainsection';
import DomainRawPreview from './components/Domainrawpreview';

export default function ProjectEditPage() {
  const params    = useParams() as { id?: string };
  const projectId = params?.id;
 
  const {
    isAdmin,
    isManager,
    isProjectManager,
    canEditProjectInfo,
    canEditMembers,
    canEditDomainDetails,
    canSeeDomainDetails,
    canSeeRawPreview,
  } = useAuth();
 
  const {
    data, loading, usersLoading,
    savingProject, savingDomain, addingMembers,
    error, actionMsg,
    name,            setName,
    description,     setDescription,
    status,          setStatus,
    domain,          setDomain,
    startDate,       setStartDate,
    endDate,         setEndDate,
    projectManagerId, setProjectManagerId,
    domainForm,      setDomainForm,
    memberUsers,           // role=member only
    projectManagerUsers,   // role=project_manager only
    userSearch,      setUserSearch,
    selectedUserIds, setSelectedUserIds,
    dateError,
    teamSize,
    loadAll,
    saveProject,
    saveDomainDetails,
    addSelectedMembers,
    toggleSelectUser,
    resetDomainForm,
    resetMembers,
  } = useProjectData(projectId);
 
  useEffect(() => { if (projectId) loadAll(); }, [projectId]);
 
  if (!projectId) return <div className="p-6">Identifiant du projet manquant.</div>;
  if (loading)    return <div className="p-6 text-center text-slate-500">Chargement...</div>;
 
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
 
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <ProjectHeader
        projectId={data?.project.id}
        projectName={data?.project.name}
        companyName={data?.project.company?.name}
        domain={data?.project.domain}
        isPM={isProjectManager}
      />
 
      {/* ── Alerts ───────────────────────────────────────────────────────── */}
      <AlertBanner error={error} actionMsg={actionMsg} />
 
      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — Informations du projet
          · admin / manager  → visible + editable
          · manager          → PM field is read-only (canEditProjectManager=false)
          · project_manager  → visible + fully read-only
          · others           → hidden
      ══════════════════════════════════════════════════════════════════ */}
      <ProjectInfoSection
        canEdit={canEditProjectInfo}
        canEditProjectManager={isAdmin || isManager}   
        name={name}                       setName={setName}
        description={description}         setDescription={setDescription}
        domain={domain}                   setDomain={setDomain}
        status={status}                   setStatus={setStatus}
        startDate={startDate}             setStartDate={setStartDate}
        endDate={endDate}                 setEndDate={setEndDate}
        projectManagerId={projectManagerId}
        setProjectManagerId={setProjectManagerId}
        projectManagerUsers={projectManagerUsers}
        projectMeta={data?.project ?? null}
        dateError={dateError}
        saving={savingProject}
        onSave={saveProject}
        onCancel={loadAll}
      />
 
      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — Membres du projet
          · admin / manager / PM → can add members (role=member filtered)
          · others               → read-only list
      ══════════════════════════════════════════════════════════════════ */}
      <MembersSection
        canEdit={canEditMembers}
        assignedTo={data?.project.assignedTo ?? []}
        users={memberUsers}
        usersLoading={usersLoading}
        userSearch={userSearch}
        setUserSearch={setUserSearch}
        selectedUserIds={selectedUserIds}
        toggleSelectUser={toggleSelectUser}
        setSelectedUserIds={setSelectedUserIds}
        addingMembers={addingMembers}
        onAddMembers={addSelectedMembers}
        onReset={resetMembers}
        teamSize={teamSize}
      />
 
      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — Détails domaine
          · admin / PM    → editable
          · manager       → read-only (canEdit=false)
          · others        → hidden
      ══════════════════════════════════════════════════════════════════ */}
      {canSeeDomainDetails && (
        <DomainSection
          domain={domain}
          domainForm={domainForm}
          setDomainForm={setDomainForm}
          canEdit={canEditDomainDetails}
          teamSize={teamSize}
          saving={savingDomain}
          onSave={saveDomainDetails}
          onCancel={resetDomainForm}
        />
      )}
 
      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — Raw JSON preview  (admin / PM only)
      ══════════════════════════════════════════════════════════════════ */}
      {canSeeRawPreview && (
        <DomainRawPreview domainDetails={data?.domainDetails} />
      )}
 
    </div>
  );
}