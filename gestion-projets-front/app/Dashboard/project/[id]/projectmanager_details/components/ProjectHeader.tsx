'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

type Props = {
  projectId?: number;
  projectName?: string;
  companyName?: string;
  domain?: string;
  isPM: boolean;
};

export default function ProjectHeader({ projectId, projectName, companyName, domain, isPM }: Props) {
  let listName = 'sprints';
  let pathName = 'sprintslist';

  if (domain === 'Marketing') {
    listName = 'campagnes';
    pathName = 'sprintmarketinglist';
  } else if (domain === 'CallCenter') {
    listName = 'tickets';
    pathName = 'sprintcallcenterlist';
  }

  // Si c'est le PM, on peut le rediriger vers projectsta (uniquement si sprintslist, sinon il n'y en a pas pour le moment)
  const hrefProject = (isPM && pathName === 'sprintslist')
    ? `/Dashboard/project/${projectId}/${pathName}/projectsta`
    : `/Dashboard/project/${projectId}/${pathName}`;

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold">{projectName}</h1>
        <p className="text-sm text-slate-500 mt-1">
          #{projectId} • {companyName || '—'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/Dashboard" className="text-sm text-slate-600 hover:underline">
          ← Retour
        </Link>
        <Link
          href={hrefProject}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl text-sm font-semibold hover:bg-indigo-600 transition"
        >
          Accéder aux {listName} <ArrowUpRight size={16} />
        </Link>
      </div>
    </div>
  );
}