'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

// ── Types ────────────────────────────────────────────────────

type Applicant = {
  name: string;
  email: string;
  phone?: string;
  cvLink?: string;
  level?: string;
  skills?: string[];
  years_experience?: number;
  years_education?: number;
  experienceScore?: number;
  educationScore?: number;
  skillsScore?: number;
  levelScore?: number;
  score?: number;
  cvParsingStatus?: string;
  appliedAt?: string;
};

type Post = {
  _id: string;
  title: string;
  description: string;
  experienceDescription?: string;
  minYearsExperience?: number;
  maxYearsExperience?: number;
  educationDescription?: string;
  minYearsEducation?: number;
  requiredSkills?: string[];
  preferredSkills?: string[];
  skillsDescription?: string;
  requiredLevel?: string;
  levelDescription?: string;
  keywords?: string[];
  tags?: string[];
  isActive?: boolean;
  createdById?: string;
  companyId?: string;
  score?: number;
  applicants?: Applicant[];
  applicantsCount?: number;
  matchedApplicantsCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

type UserSummary = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

// ── Global Styles ─────────────────────────────────────────────

const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

:root {
  --t50:  #f0fdfa;
  --t100: #ccfbf1;
  --t200: #99f6e4;
  --t300: #5eead4;
  --t400: #2dd4bf;
  --t500: #14b8a6;
  --t600: #0d9488;
  --t700: #0f766e;
  --c400: #22d3ee;
  --c500: #06b6d4;
  --glass: rgba(255,255,255,0.75);
  --gborder: rgba(20,184,166,0.15);
  --text: #0f172a;
  --muted: #64748b;
  --light: #94a3b8;
  --surface: #f8fafc;
}

.pd-root {
  font-family: 'Sora', sans-serif;
  min-height: 100vh;
  background: linear-gradient(145deg, #f0fdfa 0%, #e0f2fe 45%, #f0fdf4 80%, #fafafa 100%);
  position: relative;
}
.pd-root::before {
  content: '';
  position: fixed; top: -100px; right: -100px;
  width: 380px; height: 380px;
  background: radial-gradient(circle, rgba(45,212,191,0.18) 0%, transparent 70%);
  border-radius: 50%; pointer-events: none; z-index: 0;
}
.pd-root::after {
  content: '';
  position: fixed; bottom: -60px; left: -60px;
  width: 280px; height: 280px;
  background: radial-gradient(circle, rgba(34,211,238,0.14) 0%, transparent 70%);
  border-radius: 50%; pointer-events: none; z-index: 0;
}

.pd-inner {
  position: relative; z-index: 1;
  max-width: 780px;
  margin: 0 auto;
  padding: 28px 16px 56px;
}
@media (min-width: 640px) { .pd-inner { padding: 40px 24px 64px; } }

/* Back button */
.pd-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600;
  color: var(--t600);
  background: white;
  border: 1.5px solid var(--t200);
  padding: 7px 14px; border-radius: 100px;
  cursor: pointer; text-decoration: none;
  margin-bottom: 20px;
  transition: all 0.2s;
}
.pd-back:hover { background: var(--t50); border-color: var(--t300); }

/* Card */
.card {
  background: var(--glass);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1.5px solid var(--gborder);
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(20,184,166,0.07), 0 1px 4px rgba(0,0,0,0.04);
  margin-bottom: 14px;
  overflow: hidden;
}
.card-pad { padding: 20px; }
@media (min-width: 480px) { .card-pad { padding: 24px; } }

/* Section header */
.sec-title {
  font-size: 13px; font-weight: 700;
  color: var(--t700);
  letter-spacing: 0.3px;
  margin: 0 0 14px;
  display: flex; align-items: center; gap: 6px;
}

/* Divider */
.div { height: 1px; background: linear-gradient(90deg, transparent, var(--t100), transparent); margin: 16px 0; }

/* ── Header card ── */
.hdr-row { display: flex; align-items: flex-start; gap: 16px; }
.hdr-left { flex: 1; min-width: 0; }
.hdr-right { shrink: 0; text-align: center; }

.post-title {
  font-size: 20px; font-weight: 800;
  color: var(--text);
  line-height: 1.2; margin: 0 0 8px;
}
@media (min-width: 480px) { .post-title { font-size: 23px; } }

.badge-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 8px; }

.badge {
  font-size: 11px; font-weight: 600;
  padding: 3px 10px; border-radius: 100px; border: 1.5px solid;
}
.badge-teal   { background: var(--t50);  color: var(--t700); border-color: var(--t200); }
.badge-green  { background: #f0fdf4;     color: #15803d;     border-color: #bbf7d0; }
.badge-yellow { background: #fffbeb;     color: #b45309;     border-color: #fde68a; }
.badge-purple { background: #faf5ff;     color: #7e22ce;     border-color: #e9d5ff; }
.badge-red    { background: #fff1f2;     color: #be123c;     border-color: #fecdd3; }
.badge-blue   { background: #eff6ff;     color: #1d4ed8;     border-color: #bfdbfe; }
.badge-slate  { background: #f1f5f9;     color: #475569;     border-color: #e2e8f0; }
.badge-active   { background: #ecfdf5; color: #059669; border-color: #a7f3d0; }
.badge-inactive { background: #fff1f2;  color: #e11d48; border-color: #fecdd3; }

.meta-text { font-size: 11.5px; color: var(--light); margin: 0 0 10px; }

/* Creator */
.creator { display: flex; align-items: center; gap: 8px; }
.creator-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, var(--t400), var(--c500));
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: white; flex-shrink: 0;
}
.creator-name { font-size: 12.5px; font-weight: 600; color: var(--text); }
.creator-role { font-size: 11px; color: var(--light); }

/* Score hero (header) */
.score-hero-sm {
  background: linear-gradient(135deg, var(--t50), #e0f2fe);
  border: 1.5px solid var(--t100);
  border-radius: 16px;
  padding: 14px 18px;
  text-align: center;
  min-width: 90px;
}
.score-hero-sm-num {
  font-size: 36px; font-weight: 800;
  background: linear-gradient(135deg, var(--t700), #0891b2);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  line-height: 1;
}
.score-hero-sm-label { font-size: 10px; color: var(--muted); font-weight: 500; margin-top: 2px; }
.score-hero-sm-count { font-size: 11.5px; color: var(--t600); font-weight: 600; margin-top: 4px; }

/* Action buttons */
.action-row {
  display: flex; gap: 8px; flex-wrap: wrap;
  margin-top: 16px; padding-top: 16px;
  border-top: 1.5px solid var(--t100);
}
.btn-edit {
  padding: 9px 18px; font-size: 13px; font-weight: 600;
  font-family: 'Sora', sans-serif;
  background: white; border: 1.5px solid var(--t200);
  color: var(--t700); border-radius: 12px; cursor: pointer;
  transition: all 0.2s;
}
.btn-edit:hover { background: var(--t50); border-color: var(--t300); }
.btn-del {
  padding: 9px 18px; font-size: 13px; font-weight: 600;
  font-family: 'Sora', sans-serif;
  background: #fff1f2; border: 1.5px solid #fecdd3;
  color: #e11d48; border-radius: 12px; cursor: pointer;
  transition: all 0.2s;
}
.btn-del:hover:not(:disabled) { background: #ffe4e6; }
.btn-del:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Criteria grid ── */
.crit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
@media (min-width: 480px) { .crit-grid { gap: 16px; } }

.crit-tile {
  background: linear-gradient(135deg, var(--t50), rgba(224,242,254,0.5));
  border: 1.5px solid var(--t100);
  border-radius: 14px; padding: 12px 14px;
}
.crit-label {
  font-size: 9.5px; font-weight: 700; letter-spacing: 1px;
  text-transform: uppercase; color: var(--t600); margin-bottom: 5px;
}
.crit-value { font-size: 15px; font-weight: 700; color: var(--t700); }
.crit-sub   { font-size: 11px; color: var(--muted); margin-top: 3px; line-height: 1.4; }

.skills-section { margin-top: 4px; }
.skills-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.8px;
  text-transform: uppercase; color: var(--muted); margin-bottom: 7px;
}
.chips { display: flex; flex-wrap: wrap; gap: 5px; }
.chip {
  font-size: 11px; font-weight: 500;
  padding: 3px 10px; border-radius: 100px; border: 1.5px solid;
}

/* ── Applicants ── */
.applicants-hdr {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 8px; margin-bottom: 16px;
}
.matched-badge {
  font-size: 11px; font-weight: 600;
  background: linear-gradient(135deg, var(--t50), #ecfdf5);
  border: 1.5px solid var(--t200);
  color: var(--t700);
  padding: 4px 12px; border-radius: 100px;
}

.applicant-item {
  border: 1.5px solid var(--t100);
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 10px;
  background: rgba(255,255,255,0.8);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.applicant-item:hover { border-color: var(--t300); box-shadow: 0 2px 12px rgba(20,184,166,0.08); }

.applicant-row {
  display: flex; align-items: center; gap: 10px; padding: 12px 14px;
}
@media (min-width: 480px) { .applicant-row { gap: 14px; padding: 14px 18px; } }

.ap-avatar {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--t300), var(--c400));
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: white;
}
.ap-main { flex: 1; min-width: 0; }
.ap-name { font-size: 13.5px; font-weight: 700; color: var(--text); }
.ap-meta { font-size: 11px; color: var(--muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ap-skills { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.ap-skill-chip {
  font-size: 10.5px; font-weight: 500; color: var(--t700);
  background: var(--t50); border: 1px solid var(--t100);
  padding: 2px 8px; border-radius: 100px;
}
.ap-more { font-size: 10.5px; color: var(--light); align-self: center; }

.ap-score-col { text-align: center; flex-shrink: 0; }
.ap-score-num { font-size: 24px; font-weight: 800; line-height: 1; }
.ap-score-label { font-size: 9.5px; color: var(--light); }

.ap-actions { display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; }
.ap-btn {
  font-size: 11px; font-weight: 600; font-family: 'Sora', sans-serif;
  padding: 5px 10px; border-radius: 9px; cursor: pointer;
  transition: all 0.15s; white-space: nowrap; text-align: center;
}
.ap-btn-outline {
  background: white; border: 1.5px solid var(--t200); color: var(--t700);
}
.ap-btn-outline:hover { background: var(--t50); }
.ap-btn-cv {
  background: linear-gradient(135deg, var(--t500), var(--c500));
  border: none; color: white; text-decoration: none; display: inline-block;
}
.ap-btn-cv:hover { opacity: 0.88; }
.ap-btn-remove {
  background: #fff1f2; border: 1.5px solid #fecdd3; color: #e11d48;
}
.ap-btn-remove:hover:not(:disabled) { background: #ffe4e6; }
.ap-btn-remove:disabled { opacity: 0.5; cursor: not-allowed; }

/* Expanded scores */
.ap-expanded {
  border-top: 1.5px solid var(--t100);
  background: linear-gradient(135deg, var(--t50), rgba(224,242,254,0.3));
  padding: 14px 18px;
}
.ap-expanded-title {
  font-size: 10px; font-weight: 700; letter-spacing: 0.8px;
  text-transform: uppercase; color: var(--t600); margin-bottom: 10px;
}
.score-bar-row { margin-bottom: 8px; }
.score-bar-labels {
  display: flex; justify-content: space-between;
  font-size: 11px; color: var(--muted); margin-bottom: 3px;
}
.score-bar-val { font-weight: 600; color: var(--text); }
.score-bar-track { height: 5px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.score-bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
.sbf-teal  { background: linear-gradient(90deg, var(--t400), var(--t500)); }
.sbf-amber { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
.sbf-red   { background: linear-gradient(90deg, #fb7185, #e11d48); }

.ap-total-row {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 10px; border-top: 1.5px solid var(--t100); margin-top: 4px;
}
.ap-total-label { font-size: 11.5px; color: var(--muted); }
.ap-total-val   { font-size: 16px; font-weight: 800; }

.ap-date { font-size: 10.5px; color: var(--light); margin-top: 8px; }

/* Empty state */
.empty-state {
  text-align: center; padding: 40px 20px;
  color: var(--light); font-size: 13px;
}
.empty-icon { font-size: 36px; display: block; margin-bottom: 8px; }

/* Loading / error */
.full-center {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  font-family: 'Sora', sans-serif; font-size: 13px; color: var(--muted);
}

/* Pondération */
.ponder-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;
}
.ponder-row {
  display: flex; justify-content: space-between; align-items: center;
  background: white; border: 1.5px solid var(--t100);
  border-radius: 10px; padding: 6px 10px;
  font-size: 11.5px;
}
.ponder-key { color: var(--muted); }
.ponder-val { font-weight: 700; color: var(--t700); }
`;

// ── Helpers ──────────────────────────────────────────────────

const initials = (name?: string) => {
  if (!name) return 'U';
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
};

const levelBadge = (level?: string) => {
  if (!level) return 'badge-slate';
  if (level === 'Junior') return 'badge-green';
  if (level === 'Intermédiaire') return 'badge-yellow';
  return 'badge-purple';
};

const statusColor = (s?: string) => {
  if (s === 'success') return '#059669';
  if (s === 'pending') return '#d97706';
  return '#e11d48';
};

function ScoreBar({ label, value }: { label: string; value?: number }) {
  const v = value ?? 0;
  const cls = v >= 70 ? 'sbf-teal' : v >= 40 ? 'sbf-amber' : 'sbf-red';
  const col = v >= 70 ? '#0d9488' : v >= 40 ? '#d97706' : '#e11d48';
  return (
    <div className="score-bar-row">
      <div className="score-bar-labels">
        <span>{label}</span>
        <span className="score-bar-val" style={{ color: col }}>{v}</span>
      </div>
      <div className="score-bar-track">
        <div className={`score-bar-fill ${cls}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function PostDetailPage() {
  const params = useParams() as { id?: string };
  const id = params?.id ?? '';
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [creator, setCreator] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [expandedApplicant, setExpandedApplicant] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_NEST_API_URL || '';
  const getToken = () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token') || localStorage.getItem('token')
      : null;

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      setLoading(true); setError(null);
      try {
        const token = getToken();
        const res = await fetch(`${base}/posts/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`Erreur API ${res.status}`);
        const data: Post = await res.json();
        setPost(data);
        if (data.createdById) {
          try {
            const uRes = await fetch(`${base}/users/${encodeURIComponent(data.createdById)}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const u = uRes.ok ? await uRes.json() : null;
            setCreator(u
              ? { id: u._id ?? u.id, name: u.name ?? u.fullName ?? u.email, email: u.email, role: u.role }
              : { id: data.createdById });
          } catch { setCreator({ id: data.createdById }); }
        }
      } catch (err: any) { setError(err.message || 'Erreur inconnue'); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [id, base]);

  const handleDeletePost = async () => {
    if (!confirm('Voulez-vous vraiment supprimer cette offre ?')) return;
    const token = getToken();
    if (!token) { alert('Vous devez être connecté.'); return; }
    setDeleting(true);
    try {
      const res = await fetch(`${base}/posts/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      router.push('/Dashboard/RH/postslist');
    } catch (err: any) { alert(err.message); }
    finally { setDeleting(false); }
  };

  const handleDeleteApplicant = async (email: string) => {
    if (!confirm(`Supprimer le candidat ${email} ?`)) return;
    const token = getToken();
    if (!token) { alert('Vous devez être connecté.'); return; }
    setDeletingEmail(email);
    try {
      const res = await fetch(`${base}/posts/${id}/applicants/${encodeURIComponent(email)}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const updated = await fetch(`${base}/posts/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }).then(r => r.json());
      setPost(updated);
    } catch (err: any) { alert(err.message); }
    finally { setDeletingEmail(null); }
  };

  if (loading) return <div className="full-center" style={{ fontFamily: 'Sora, sans-serif' }}>Chargement…</div>;
  if (error) return (
    <div className="full-center" style={{ fontFamily: 'Sora, sans-serif' }}>
      <div style={{ background: '#fff1f2', border: '1.5px solid #fecdd3', color: '#e11d48', borderRadius: 14, padding: '16px 24px', fontSize: 13 }}>⚠️ {error}</div>
    </div>
  );
  if (!post) return <div className="full-center" style={{ fontFamily: 'Sora, sans-serif' }}>Offre introuvable.</div>;

  const applicants = post.applicants ?? [];
  const sorted = [...applicants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <div className="pd-root">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="pd-inner">

        {/* Back */}
        <button className="pd-back" onClick={() => router.back()}>← Retour</button>

        {/* ── Header card ── */}
        <div className="card">
          <div className="card-pad">
            <div className="hdr-row">
              <div className="hdr-left">
                <h1 className="post-title">{post.title}</h1>
                <div className="badge-row">
                  {post.requiredLevel && (
                    <span className={`badge ${levelBadge(post.requiredLevel)}`}>{post.requiredLevel}</span>
                  )}
                  <span className={`badge ${post.isActive ? 'badge-active' : 'badge-inactive'}`}>
                    {post.isActive ? '● Actif' : '● Inactif'}
                  </span>
                </div>
                <p className="meta-text">
                  Créé le {post.createdAt ? new Date(post.createdAt).toLocaleDateString('fr-FR') : '—'}
                  {post.updatedAt && ` · Modifié le ${new Date(post.updatedAt).toLocaleDateString('fr-FR')}`}
                </p>
                {creator && (
                  <div className="creator">
                    <div className="creator-avatar">{initials(creator.name ?? creator.email)}</div>
                    <div>
                      <div className="creator-name">{creator.name ?? `User ${creator.id}`}</div>
                      {creator.role && <div className="creator-role">{creator.role}</div>}
                    </div>
                  </div>
                )}
              </div>

              {/* Score */}
              <div className="score-hero-sm">
                <div className="score-hero-sm-num">{post.score ?? 0}</div>
                <div className="score-hero-sm-label">score moyen</div>
                <div className="score-hero-sm-count">{post.applicantsCount ?? applicants.length} candidat(s)</div>
                {(post.matchedApplicantsCount ?? 0) > 0 && (
                  <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 3 }}>
                    {post.matchedApplicantsCount} ≥ 70%
                  </div>
                )}
              </div>
            </div>

            <div className="action-row">
              <button className="btn-edit" onClick={() => router.push(`/Dashboard/RH/postslist/${id}/editpost`)}>
                ✏️ Modifier
              </button>
              <button className="btn-del" onClick={handleDeletePost} disabled={deleting}>
                {deleting ? 'Suppression…' : '🗑 Supprimer'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="card">
          <div className="card-pad">
            <p className="sec-title">📋 Description</p>
            <p style={{ fontSize: 13.5, color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.7, margin: 0 }}>
              {post.description}
            </p>
            {(post.tags?.length ?? 0) > 0 && (
              <div className="chips" style={{ marginTop: 12 }}>
                {post.tags!.map((t, i) => <span key={i} className="chip badge-green">{t}</span>)}
              </div>
            )}
          </div>
        </div>

        {/* ── Critères ── */}
        <div className="card">
          <div className="card-pad">
            <p className="sec-title">🎯 Critères de matching</p>

            <div className="crit-grid">
              <div className="crit-tile">
                <div className="crit-label">Niveau</div>
                <div className="crit-value">{post.requiredLevel || '—'}</div>
                {post.levelDescription && <div className="crit-sub">{post.levelDescription}</div>}
              </div>
              <div className="crit-tile">
                <div className="crit-label">Expérience</div>
                <div className="crit-value">
                  {post.minYearsExperience ?? 0}{post.maxYearsExperience ? `–${post.maxYearsExperience}` : '+'} ans
                </div>
                {post.experienceDescription && <div className="crit-sub">{post.experienceDescription}</div>}
              </div>
              <div className="crit-tile">
                <div className="crit-label">Formation</div>
                <div className="crit-value">{post.minYearsEducation ?? 0}+ ans</div>
                {post.educationDescription && <div className="crit-sub">{post.educationDescription}</div>}
              </div>
              <div className="crit-tile">
                <div className="crit-label">Pondération</div>
                <div style={{ marginTop: 4 }}>
                  {[['Skills','40%'],['Exp.','25%'],['Niveau','20%'],['Form.','15%']].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#475569', marginBottom:2 }}>
                      <span>{k}</span><span style={{ fontWeight:700, color:'#0f766e' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {(post.requiredSkills?.length ?? 0) > 0 && (
              <div className="skills-section">
                <div className="skills-label">Compétences obligatoires</div>
                <div className="chips">
                  {post.requiredSkills!.map((s, i) => <span key={i} className="chip badge-red">{s}</span>)}
                </div>
              </div>
            )}
            {(post.preferredSkills?.length ?? 0) > 0 && (
              <div className="skills-section" style={{ marginTop: 12 }}>
                <div className="skills-label">Compétences appréciées</div>
                <div className="chips">
                  {post.preferredSkills!.map((s, i) => <span key={i} className="chip badge-blue">{s}</span>)}
                </div>
                {post.skillsDescription && <p style={{ fontSize: 11.5, color: '#64748b', marginTop: 6 }}>{post.skillsDescription}</p>}
              </div>
            )}
            {(post.keywords?.length ?? 0) > 0 && (
              <div className="skills-section" style={{ marginTop: 12 }}>
                <div className="skills-label">Mots-clés</div>
                <div className="chips">
                  {post.keywords!.map((k, i) => <span key={i} className="chip badge-purple">{k}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Candidats ── */}
        <div className="card">
          <div className="card-pad">
            <div className="applicants-hdr">
              <p className="sec-title" style={{ margin: 0 }}>👥 Candidats ({applicants.length})</p>
              {(post.matchedApplicantsCount ?? 0) > 0 && (
                <span className="matched-badge">✓ {post.matchedApplicantsCount} candidat(s) ≥ 70</span>
              )}
            </div>

            {applicants.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🕊</span>
                Aucun candidat pour le moment.
              </div>
            ) : (
              sorted.map(a => {
                const isExp = expandedApplicant === a.email;
                const score = a.score ?? 0;
                const scoreCol = score >= 70 ? '#0d9488' : score >= 40 ? '#d97706' : '#e11d48';

                return (
                  <div key={a.email} className="applicant-item">
                    <div className="applicant-row">
                      <div className="ap-avatar">{initials(a.name)}</div>

                      <div className="ap-main">
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                          <span className="ap-name">{a.name}</span>
                          {a.level && <span className={`badge ${levelBadge(a.level)}`} style={{ fontSize: 10 }}>{a.level}</span>}
                          {a.cvParsingStatus && (
                            <span style={{ fontSize: 10.5, fontWeight: 600, color: statusColor(a.cvParsingStatus) }}>
                              ● {a.cvParsingStatus}
                            </span>
                          )}
                        </div>
                        <div className="ap-meta">
                          {a.email}
                          {a.phone && ` · ${a.phone}`}
                          {a.years_experience !== undefined && ` · ${a.years_experience} ans`}
                        </div>
                        {(a.skills?.length ?? 0) > 0 && (
                          <div className="ap-skills">
                            {a.skills!.slice(0, 4).map((s, i) => <span key={i} className="ap-skill-chip">{s}</span>)}
                            {a.skills!.length > 4 && <span className="ap-more">+{a.skills!.length - 4}</span>}
                          </div>
                        )}
                      </div>

                      <div className="ap-score-col">
                        <div className="ap-score-num" style={{ color: scoreCol }}>{score}</div>
                        <div className="ap-score-label">/ 100</div>
                      </div>

                      <div className="ap-actions">
                        <button className="ap-btn ap-btn-outline" onClick={() => setExpandedApplicant(isExp ? null : a.email)}>
                          {isExp ? '▲' : '▼'}
                        </button>
                        {a.cvLink && (
                          <a className="ap-btn ap-btn-cv" href={a.cvLink} target="_blank" rel="noreferrer">CV</a>
                        )}
                        <button
                          className="ap-btn ap-btn-remove"
                          onClick={() => handleDeleteApplicant(a.email)}
                          disabled={deletingEmail === a.email}
                        >
                          {deletingEmail === a.email ? '…' : '✕'}
                        </button>
                      </div>
                    </div>

                    {isExp && (
                      <div className="ap-expanded">
                        <div className="ap-expanded-title">Détail des scores</div>
                        <ScoreBar label="Compétences (40%)" value={a.skillsScore} />
                        <ScoreBar label="Expérience (25%)" value={a.experienceScore} />
                        <ScoreBar label="Niveau (20%)" value={a.levelScore} />
                        <ScoreBar label="Formation (15%)" value={a.educationScore} />
                        <div className="ap-total-row">
                          <span className="ap-total-label">Score total pondéré</span>
                          <span className="ap-total-val" style={{ color: scoreCol }}>{score} / 100</span>
                        </div>
                        {a.appliedAt && (
                          <div className="ap-date">
                            Postulé le {new Date(a.appliedAt).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}