'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

// ─── IT Field Options ─────────────────────────────────────────────────────────

export const IT_OPTIONS = {
  programmingLanguages: [
    'C#','Dart','Elixir','Go','Java','JavaScript','Kotlin','PHP','Python',
    'Python|C++','Python|PyTorch','Python|R','Ruby','Rust','Scala','Solidity',
    'Solidity|JavaScript','Swift','TypeScript','TypeScript|NodeJS','TypeScript|Python',
  ],
  framework: [
    'ASP.NET','ASP.NET Core','Angular','Django','Django REST','Express','FastAPI',
    'Fastify','Flask','Flutter','Gin','GraphQL','Hapi','Hibernate','Ionic','Jersey',
    'Koa','Laravel','Micro','Micronaut','NestJS','Next.js','Nuxt','NuxtJS','Phoenix',
    'Play','React','React Native','Rails','Remix','Rocket','Sanic','Spring','Spring Boot',
    'Spring Cloud','Spring MVC','Svelte','SvelteKit','Symfony','TensorFlow','Vapor',
    'Vert.x','Vue','WebAPI','gRPC','iOS SDK',
  ],
  database: [
    'Cassandra','CoreData','CosmosDB','DB2','DynamoDB','Elasticsearch','FaunaDB',
    'Firebase','Firestore','IPFS','InfluxDB','MariaDB','MongoDB','MySQL','Neo4j',
    'Oracle','Oracle DB','PostgreSQL','Redis','SQL Server','SQLite','SurrealDB',
    'TimescaleDB',
  ],
  serverDetails: [
    'AWS','AWS Amplify','AWS EC2','AWS ECS','AWS Fargate','AWS Lambda','AWS RDS',
    'Azure','Azure App Service','Azure Kubernetes','Desktop App','DigitalOcean',
    'Docker','Firebase','GCP','GCP GKE','Google Cloud Run','Heroku','IBM Cloud',
    'Kubernetes','Local','Mobile','Netlify','On-Premise','OpenShift','Vercel',
  ],
  architecture: [
    'Decentralized','Event-Driven','Hexagonal','Microservices','Mobile','Monolith',
    'Monolithic','N-Tier','Reactive','Serverless',
  ],
  apiIntegration: [
    'AMQP','GraphQL','Local API','MQTT','REST','SOAP','SSE','Web3','WebSocket','gRPC',
  ],
  securityRequirements: [
    'API Key','Argon2','Auth0','Azure AD','Basic','Bcrypt','Clerk','Cognito',
    'Devise','Encryption','Firebase Auth','IAM','JWT','OAuth2','SSL/TLS','mTLS',
  ],
  devOpsRequirements: [
    'Ansible','Azure DevOps','CI/CD','CircleCI','Cloud Build','Docker','GitHub Actions',
    'GitLab CI','Helm','Heroku','Jenkins','Kubernetes','Serverless Framework',
    'Terraform','Vercel','Xcode Cloud',
  ],
  priority: ['Low','Medium','High'],
  businessImpact: ['Low','Normal','Important','Critical'],
  complexity: ['Low','Medium','High'],
  teamSize: ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','18'],
};

export type MultiKey =
  | 'programmingLanguages' | 'framework' | 'database' | 'serverDetails'
  | 'architecture' | 'apiIntegration' | 'securityRequirements' | 'devOpsRequirements';

export type SingleKey = 'priority' | 'businessImpact' | 'complexity' | 'teamSize';

// ─── MultiSelectField ─────────────────────────────────────────────────────────

function MultiSelectField({
  label,
  fieldKey,
  selected,
  onChange,
  readOnly = false,
}: {
  label: string;
  fieldKey: MultiKey;
  selected: string[];
  onChange: (vals: string[]) => void;
  readOnly?: boolean;
}) {
  const [search, setSearch] = useState('');
  const options = IT_OPTIONS[fieldKey];
  const filtered = search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  function toggle(val: string) {
    if (readOnly) return;
    if (selected.includes(val)) onChange(selected.filter(v => v !== val));
    else onChange([...selected, val]);
  }

  if (readOnly) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1 text-slate-600">{label}</label>
        <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[2.5rem]">
          {selected.length === 0 ? (
            <span className="text-xs text-slate-400 self-center">—</span>
          ) : (
            selected.map(v => (
              <span key={v} className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-medium">
                {v}
              </span>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-slate-700">{label}</label>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selected.map(v => (
            <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
              {v}
              <button type="button" onClick={() => toggle(v)} className="hover:text-indigo-600">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher..."
        className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <div className="max-h-36 overflow-y-auto border border-slate-200 rounded p-2 flex flex-wrap gap-1 bg-slate-50">
        {filtered.length === 0 && <span className="text-xs text-slate-400">Aucun résultat</span>}
        {filtered.map(opt => {
          const isSel = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-2 py-0.5 rounded-full border text-xs font-medium transition-colors ${
                isSel
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:text-indigo-600'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SingleSelectField ────────────────────────────────────────────────────────

function SingleSelectField({
  label,
  fieldKey,
  selected,
  onChange,
  readOnly = false,
}: {
  label: string;
  fieldKey: SingleKey;
  selected: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
}) {
  if (readOnly) {
    return (
      <div>
        <label className="block text-sm font-medium mb-2 text-slate-600">{label}</label>
        <div className="flex flex-wrap gap-2">
          {IT_OPTIONS[fieldKey].map(opt => (
            <span
              key={opt}
              className={`px-3 py-1 rounded-full border text-sm font-medium ${
                selected === opt
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              {opt}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-slate-700">{label}</label>
      <div className="flex flex-wrap gap-2">
        {IT_OPTIONS[fieldKey].map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt === selected ? '' : opt)}
            className={`px-3 py-1 rounded-full border text-sm font-medium transition-colors ${
              selected === opt
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main ITDomainForm ────────────────────────────────────────────────────────

export type ITDomainFormProps = {
  domainForm: Record<string, any>;
  setDomainForm: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  readOnly?: boolean;
  computedTeamSize?: string; // for PM auto-calculated
  isPM?: boolean;
};

export default function ITDomainForm({
  domainForm,
  setDomainForm,
  readOnly = false,
  computedTeamSize,
  isPM = false,
}: ITDomainFormProps) {
  function getMulti(key: string): string[] {
    const val = domainForm[key];
    if (!val) return [];
    return String(val).split('|').map(s => s.trim()).filter(Boolean);
  }

  function setMulti(key: string, vals: string[]) {
    setDomainForm(f => ({ ...f, [key]: vals.join('|') }));
  }

  function getSingle(key: string): string {
    return domainForm[key] ?? '';
  }

  function setSingle(key: string, val: string) {
    setDomainForm(f => ({ ...f, [key]: val }));
  }

  return (
    <div className="space-y-6">
      {/* Stack technique */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b pb-1 mb-4">
          Stack technique
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <MultiSelectField
            label="Programming Languages"
            fieldKey="programmingLanguages"
            selected={getMulti('programmingLanguages')}
            onChange={v => setMulti('programmingLanguages', v)}
            readOnly={readOnly}
          />
          <MultiSelectField
            label="Framework"
            fieldKey="framework"
            selected={getMulti('framework')}
            onChange={v => setMulti('framework', v)}
            readOnly={readOnly}
          />
          <MultiSelectField
            label="Database"
            fieldKey="database"
            selected={getMulti('database')}
            onChange={v => setMulti('database', v)}
            readOnly={readOnly}
          />
          <MultiSelectField
            label="Server Details"
            fieldKey="serverDetails"
            selected={getMulti('serverDetails')}
            onChange={v => setMulti('serverDetails', v)}
            readOnly={readOnly}
          />
          <MultiSelectField
            label="Architecture"
            fieldKey="architecture"
            selected={getMulti('architecture')}
            onChange={v => setMulti('architecture', v)}
            readOnly={readOnly}
          />
          <MultiSelectField
            label="API Integration"
            fieldKey="apiIntegration"
            selected={getMulti('apiIntegration')}
            onChange={v => setMulti('apiIntegration', v)}
            readOnly={readOnly}
          />
          <MultiSelectField
            label="Security Requirements"
            fieldKey="securityRequirements"
            selected={getMulti('securityRequirements')}
            onChange={v => setMulti('securityRequirements', v)}
            readOnly={readOnly}
          />
          <MultiSelectField
            label="DevOps Requirements"
            fieldKey="devOpsRequirements"
            selected={getMulti('devOpsRequirements')}
            onChange={v => setMulti('devOpsRequirements', v)}
            readOnly={readOnly}
          />
        </div>
      </div>

      {/* Planification */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b pb-1 mb-4">
          Planification & estimation
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SingleSelectField
            label="Priority"
            fieldKey="priority"
            selected={getSingle('priority')}
            onChange={v => setSingle('priority', v)}
            readOnly={readOnly}
          />
          <SingleSelectField
            label="Business Impact"
            fieldKey="businessImpact"
            selected={getSingle('businessImpact')}
            onChange={v => setSingle('businessImpact', v)}
            readOnly={readOnly}
          />
          <SingleSelectField
            label="Complexity"
            fieldKey="complexity"
            selected={getSingle('complexity')}
            onChange={v => setSingle('complexity', v)}
            readOnly={readOnly}
          />

          {/* Team Size */}
          {isPM && computedTeamSize !== undefined ? (
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">
                Team Size
                <span className="ml-2 text-xs text-indigo-500 font-normal">(calculé automatiquement)</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-300 text-sm font-semibold w-fit">
                  {computedTeamSize}
                </div>
                <span className="text-xs text-slate-400">= nombre de membres sélectionnés</span>
              </div>
            </div>
          ) : (
            <SingleSelectField
              label="Team Size"
              fieldKey="teamSize"
              selected={String(domainForm.teamSize ?? '')}
              onChange={v => setDomainForm(f => ({ ...f, teamSize: v ? Number(v) : '' }))}
              readOnly={readOnly}
            />
          )}
        </div>
      </div>

      {/* Modules & livrables */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b pb-1 mb-4">
          Modules & livrables
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'keyDeliverables', label: 'Key Deliverables', placeholder: 'API v1, Frontend v1...', type: 'input' },
            { key: 'dependencies',    label: 'Dependencies',     placeholder: 'Autres projets ou services...', type: 'input' },
            { key: 'risks',           label: 'Risks',            placeholder: 'Retard, bug critique...', type: 'input' },
          ].map(({ key, label, placeholder }) =>
            readOnly ? (
              <div key={key}>
                <label className="block text-sm font-medium mb-1 text-slate-600">{label}</label>
                <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 min-h-[2.375rem]">
                  {domainForm[key] || <span className="text-slate-400">—</span>}
                </div>
              </div>
            ) : (
              <div key={key}>
                <label className="block text-sm font-medium mb-1 text-slate-700">{label}</label>
                <input
                  type="text"
                  value={domainForm[key] ?? ''}
                  onChange={e => setDomainForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            )
          )}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 text-slate-700">Additional Notes</label>
            {readOnly ? (
              <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 min-h-[5rem] whitespace-pre-wrap">
                {domainForm.additionalNotes || <span className="text-slate-400">—</span>}
              </div>
            ) : (
              <textarea
                rows={3}
                value={domainForm.additionalNotes ?? ''}
                onChange={e => setDomainForm(f => ({ ...f, additionalNotes: e.target.value }))}
                placeholder="Remarques, liens docs..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}