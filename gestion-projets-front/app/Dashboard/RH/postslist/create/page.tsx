'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type RequiredLevel = 'Junior' | 'Intermédiaire' | 'Senior/Expert';

type CreatePostForm = {
  title: string;
  description: string;
  experienceDescription: string;
  minYearsExperience: string;
  maxYearsExperience: string;
  educationDescription: string;
  minYearsEducation: string;
  requiredSkills: string;
  preferredSkills: string;
  skillsDescription: string;
  requiredLevel: RequiredLevel;
  levelDescription: string;
  keywords: string;
  tags: string;
  isActive: boolean;
};

const INITIAL: CreatePostForm = {
  title: '', description: '', experienceDescription: '',
  minYearsExperience: '', maxYearsExperience: '',
  educationDescription: '', minYearsEducation: '',
  requiredSkills: '', preferredSkills: '', skillsDescription: '',
  requiredLevel: 'Junior', levelDescription: '',
  keywords: '', tags: '', isActive: true,
};

const LEVELS: { value: RequiredLevel; abbr: string; desc: string }[] = [
  { value: 'Junior',        abbr: 'JR', desc: '0–2 ans' },
  { value: 'Intermédiaire', abbr: 'MD', desc: '3–5 ans' },
  { value: 'Senior/Expert', abbr: 'SR', desc: '6+ ans'  },
];

const parseList = (val: string): string[] =>
  val.split(',').map(s => s.trim()).filter(Boolean);

export default function CreatePostPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreatePostForm>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const base = process.env.NEXT_PUBLIC_NEST_API_URL || '';
  const set = (field: keyof CreatePostForm, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim())       return setError('Le titre est requis.');
    if (!form.description.trim()) return setError('La description est requise.');
    if (!form.requiredLevel)      return setError('Le niveau requis est obligatoire.');

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('access_token') || localStorage.getItem('token')
      : null;
    if (!token) { setError('Vous devez être connecté.'); return; }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      experienceDescription: form.experienceDescription.trim() || undefined,
      minYearsExperience: form.minYearsExperience ? Number(form.minYearsExperience) : undefined,
      maxYearsExperience: form.maxYearsExperience ? Number(form.maxYearsExperience) : undefined,
      educationDescription: form.educationDescription.trim() || undefined,
      minYearsEducation: form.minYearsEducation ? Number(form.minYearsEducation) : undefined,
      requiredSkills: parseList(form.requiredSkills),
      preferredSkills: parseList(form.preferredSkills),
      skillsDescription: form.skillsDescription.trim() || undefined,
      requiredLevel: form.requiredLevel,
      levelDescription: form.levelDescription.trim() || undefined,
      keywords: parseList(form.keywords),
      tags: parseList(form.tags),
      isActive: form.isActive,
    };

    setLoading(true);
    try {
      const res = await fetch(`${base}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur ${res.status}: ${text}`);
      }
      setSuccess(true);
      setTimeout(() => router.push('/Dashboard/RH/postslist'), 1400);
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .create-root { font-family: 'Plus Jakarta Sans', sans-serif; }

        .accent-bar { background: linear-gradient(90deg, #0d9488 0%, #06b6d4 50%, #22d3ee 100%); }

        .teal-input {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1e293b;
          background: #fff;
          transition: border-color .2s, box-shadow .2s;
          outline: none;
        }
        .teal-input::placeholder { color: #94a3b8; }
        .teal-input:focus {
          border-color: #14b8a6;
          box-shadow: 0 0 0 3px rgba(20,184,166,.15);
        }

        .section-card {
          background: #fff;
          border: 1.5px solid #f0fdfa;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 12px -3px rgba(13,148,136,.07);
          position: relative;
          overflow: hidden;
        }
        .section-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #0d9488, #22d3ee);
          border-radius: 16px 16px 0 0;
        }

        .level-btn {
          flex: 1;
          min-width: 0;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 8px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          background: #fff;
          cursor: pointer;
          transition: all .2s;
          text-align: center;
        }
        .level-btn:hover { border-color: #5eead4; color: #0d9488; background: #f0fdfa; }
        .level-btn.active {
          background: linear-gradient(135deg, #0d9488, #06b6d4);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 4px 12px -2px rgba(13,148,136,.35);
        }

        .submit-btn {
          background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 13px 24px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity .2s, transform .15s, box-shadow .2s;
          box-shadow: 0 4px 16px -3px rgba(13,148,136,.4);
          width: 100%;
        }
        .submit-btn:hover:not(:disabled) {
          opacity: .92;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px -3px rgba(13,148,136,.5);
        }
        .submit-btn:active:not(:disabled) { transform: scale(.98); }
        .submit-btn:disabled { opacity: .55; cursor: not-allowed; }

        .cancel-btn {
          background: #fff;
          color: #64748b;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 13px 24px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all .2s;
          width: 100%;
        }
        .cancel-btn:hover { border-color: #94a3b8; background: #f8fafc; color: #334155; }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #0d9488;
          background: #f0fdfa;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          cursor: pointer;
          transition: background .15s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .back-btn:hover { background: #ccfbf1; }

        .toggle-track {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }
        .toggle-track input { display: none; }
        .toggle-visual {
          width: 38px; height: 22px;
          border-radius: 99px;
          background: #cbd5e1;
          transition: background .2s;
          position: relative;
          flex-shrink: 0;
        }
        .toggle-visual::after {
          content: '';
          position: absolute;
          top: 3px; left: 3px;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,.2);
          transition: transform .2s;
        }
        .toggle-track input:checked ~ .toggle-visual {
          background: linear-gradient(135deg, #0d9488, #06b6d4);
        }
        .toggle-track input:checked ~ .toggle-visual::after { transform: translateX(16px); }

        .progress-step {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
        }
        .progress-step.done { color: #0d9488; }
        .step-dot {
          width: 22px; height: 22px;
          border-radius: 50%;
          border: 2px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700;
          flex-shrink: 0;
          transition: all .2s;
        }
        .progress-step.done .step-dot {
          background: linear-gradient(135deg, #0d9488, #06b6d4);
          border-color: transparent;
          color: #fff;
        }
        .step-line { flex: 1; height: 1.5px; background: #e2e8f0; min-width: 12px; }
        .step-line.done { background: linear-gradient(90deg, #0d9488, #22d3ee); }
      `}</style>

      <div className="create-root min-h-screen bg-gradient-to-br from-teal-50/60 via-cyan-50/40 to-white">
        <div className="accent-bar h-1 w-full" />

        <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 sm:py-8 pb-16">

          {/* ── Header ── */}
          <div className="mb-6">
            <button className="back-btn mb-4" onClick={() => router.back()}>
              &larr; Retour
            </button>

            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-teal-600 mb-1">
                  <span className="w-4 h-px bg-teal-400" />
                  Recrutement
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 leading-tight">
                  Nouvelle offre
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Remplissez les critères pour activer le matching automatique des candidats.
                </p>
              </div>
            </div>

            {/* Progress steps */}
            <div className="mt-5 flex items-center gap-1">
              {[
                { label: 'Général', n: 1 },
                { label: 'Niveau',  n: 2 },
                { label: 'Expér.', n: 3 },
                { label: 'Skills',  n: 4 },
                { label: 'Tags',    n: 5 },
              ].map((s, i, arr) => (
                <React.Fragment key={s.n}>
                  <div className={`progress-step ${form.title && form.description ? 'done' : ''}`} style={{ flexShrink: 0 }}>
                    <span className="step-dot">{s.n}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < arr.length - 1 && <span className="step-line flex-1" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ── Feedback ── */}
          {success && (
            <div className="mb-5 p-4 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl text-sm font-semibold flex items-center gap-2">
              Offre créée avec succès ! Redirection…
            </div>
          )}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-start gap-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── 1. Infos générales ── */}
            <div className="section-card">
              <SectionTitle label="01" title="Informations générales" />

              <div className="space-y-3 mt-4">
                <Field label="Titre du poste *">
                  <input
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    placeholder="ex: Développeur Full Stack NestJS"
                    className="teal-input"
                    required
                  />
                </Field>

                <Field label="Description *">
                  <textarea
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    placeholder="Description générale du poste..."
                    rows={4}
                    className="teal-input"
                    style={{ resize: 'vertical', minHeight: '90px' }}
                    required
                  />
                </Field>

                {/* Toggle isActive */}
                <div className="pt-1">
                  <label className="toggle-track">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => set('isActive', e.target.checked)}
                    />
                    <span className="toggle-visual" />
                    <span className="text-[13px] font-semibold text-slate-700">
                      Offre {form.isActive ? <span className="text-teal-600">active</span> : <span className="text-slate-400">inactive</span>}
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      {form.isActive ? '— visible publiquement' : '— masquée'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* ── 2. Niveau ── */}
            <div className="section-card">
              <SectionTitle label="02" title="Niveau requis" />

              <div className="mt-4 space-y-3">
                <Field label="Sélectionnez un niveau *">
                  <div className="flex gap-2">
                    {LEVELS.map(lvl => (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() => set('requiredLevel', lvl.value)}
                        className={`level-btn ${form.requiredLevel === lvl.value ? 'active' : ''}`}
                      >
                        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 4 }}>{lvl.abbr}</div>
                        <div>{lvl.value}</div>
                        <div style={{ fontSize: 10, opacity: .75, marginTop: 2 }}>{lvl.desc}</div>
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Description du niveau" hint="optionnel">
                  <input
                    value={form.levelDescription}
                    onChange={e => set('levelDescription', e.target.value)}
                    placeholder="ex: Professionnel capable de gérer une équipe"
                    className="teal-input"
                  />
                </Field>
              </div>
            </div>

            {/* ── 3. Expérience ── */}
            <div className="section-card">
              <SectionTitle label="03" title="Expérience professionnelle" />

              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Années min.">
                    <input
                      type="number" min={0}
                      value={form.minYearsExperience}
                      onChange={e => set('minYearsExperience', e.target.value)}
                      placeholder="0"
                      className="teal-input"
                    />
                  </Field>
                  <Field label="Années max.">
                    <input
                      type="number" min={0}
                      value={form.maxYearsExperience}
                      onChange={e => set('maxYearsExperience', e.target.value)}
                      placeholder="—"
                      className="teal-input"
                    />
                  </Field>
                </div>

                <Field label="Description" hint="optionnel">
                  <textarea
                    value={form.experienceDescription}
                    onChange={e => set('experienceDescription', e.target.value)}
                    placeholder="ex: Expérience en développement backend avec Python"
                    rows={2}
                    className="teal-input"
                    style={{ resize: 'vertical' }}
                  />
                </Field>
              </div>
            </div>

            {/* ── 4. Formation ── */}
            <div className="section-card">
              <SectionTitle label="04" title="Formation" />

              <div className="mt-4 space-y-3">
                <Field label="Années de formation min.">
                  <input
                    type="number" min={0}
                    value={form.minYearsEducation}
                    onChange={e => set('minYearsEducation', e.target.value)}
                    placeholder="0"
                    className="teal-input"
                  />
                </Field>
                <Field label="Description" hint="optionnel">
                  <textarea
                    value={form.educationDescription}
                    onChange={e => set('educationDescription', e.target.value)}
                    placeholder="ex: Master Informatique ou équivalent"
                    rows={2}
                    className="teal-input"
                    style={{ resize: 'vertical' }}
                  />
                </Field>
              </div>
            </div>

            {/* ── 5. Compétences ── */}
            <div className="section-card">
              <SectionTitle label="05" title="Compétences" />

              <div className="mt-4 space-y-3">
                <Field label="Compétences obligatoires" hint="séparées par des virgules">
                  <input
                    value={form.requiredSkills}
                    onChange={e => set('requiredSkills', e.target.value)}
                    placeholder="ex: NestJS, MongoDB, Docker"
                    className="teal-input"
                  />
                  <TagPreview value={form.requiredSkills} color="red" />
                </Field>

                <Field label="Compétences appréciées" hint="séparées par des virgules">
                  <input
                    value={form.preferredSkills}
                    onChange={e => set('preferredSkills', e.target.value)}
                    placeholder="ex: Kubernetes, AWS, Redis"
                    className="teal-input"
                  />
                  <TagPreview value={form.preferredSkills} color="cyan" />
                </Field>

                <Field label="Description des compétences" hint="optionnel">
                  <textarea
                    value={form.skillsDescription}
                    onChange={e => set('skillsDescription', e.target.value)}
                    placeholder="ex: Maîtrise des frameworks backend modernes"
                    rows={2}
                    className="teal-input"
                    style={{ resize: 'vertical' }}
                  />
                </Field>
              </div>
            </div>

            {/* ── 6. Tags & Keywords ── */}
            <div className="section-card">
              <SectionTitle label="06" title="Tags & Mots-clés" />

              <div className="mt-4 space-y-3">
                <Field label="Mots-clés" hint="séparés par des virgules">
                  <input
                    value={form.keywords}
                    onChange={e => set('keywords', e.target.value)}
                    placeholder="ex: backend, API, microservices"
                    className="teal-input"
                  />
                  <TagPreview value={form.keywords} color="violet" />
                </Field>

                <Field label="Tags" hint="séparés par des virgules">
                  <input
                    value={form.tags}
                    onChange={e => set('tags', e.target.value)}
                    placeholder="ex: Remote, CDI, Urgent"
                    className="teal-input"
                  />
                  <TagPreview value={form.tags} color="emerald" />
                </Field>
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="cancel-btn"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="submit-btn"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Création en cours…
                  </span>
                ) : success ? 'Offre créée !' : 'Créer l\'offre'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}

/* ── Sub-components ─────────────────────────────────── */

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 10, fontWeight: 800,
        color: '#0d9488', letterSpacing: '0.08em',
        background: '#f0fdfa', border: '1.5px solid #99f6e4',
        borderRadius: 6, padding: '2px 7px',
      }}>
        {label}
      </span>
      <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
        {title}
      </h2>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {label}
        {hint && <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 4 }}>— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

const TAG_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  red:     { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
  cyan:    { bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  violet:  { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
  emerald: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
};

function TagPreview({ value, color }: { value: string; color: keyof typeof TAG_COLORS }) {
  const items = value.split(',').map(s => s.trim()).filter(Boolean);
  if (!items.length) return null;
  const c = TAG_COLORS[color];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
      {items.map((item, i) => (
        <span key={i} style={{
          fontSize: 10, fontWeight: 600,
          padding: '2px 8px', borderRadius: 99,
          background: c.bg, color: c.color,
          border: `1px solid ${c.border}`,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          {item}
        </span>
      ))}
    </div>
  );
}