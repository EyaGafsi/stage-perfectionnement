'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

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
  createdAt?: string;
  updatedAt?: string;
  applicants?: Applicant[];
  applicantsCount?: number;
  matchedApplicantsCount?: number;
  score?: number;
};

const LEVEL_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'Junior':        { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-400' },
  'Intermédiaire': { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-400'   },
  'Senior/Expert': { bg: 'bg-violet-50',   text: 'text-violet-700',  dot: 'bg-violet-400'  },
};

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 6;
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'applicants'>('date');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_NEST_API_URL || '';

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('access_token') || localStorage.getItem('token')
          : null;
        const res = await fetch(`${base}/posts`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erreur API ${res.status}: ${text}`);
        }
        const data: Post[] = await res.json();
        setPosts(data);
      } catch (err: any) {
        setError(err.message || 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [base]);

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette offre ? Cette action est irréversible.')) return;
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('access_token') || localStorage.getItem('token')
      : null;
    if (!token) { alert('Vous devez être connecté.'); return; }
    const prev = posts;
    setDeletingId(id);
    setPosts(p => p.filter(x => x._id !== id));
    try {
      const res = await fetch(`${base}/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setPosts(prev);
        const text = await res.text();
        throw new Error(`Erreur suppression ${res.status}: ${text}`);
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = posts.filter(p => {
      if (q) {
        const inTitle    = p.title?.toLowerCase().includes(q);
        const inDesc     = p.description?.toLowerCase().includes(q);
        const inKeywords = (p.keywords || []).some(k => k.toLowerCase().includes(q));
        const inSkills   = (p.requiredSkills || []).some(s => s.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inKeywords && !inSkills) return false;
      }
      if (filterLevel !== 'all' && p.requiredLevel !== filterLevel) return false;
      return true;
    });
    if (sortBy === 'score')      list = [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    else if (sortBy === 'applicants') list = [...list].sort((a, b) => (b.applicantsCount ?? 0) - (a.applicantsCount ?? 0));
    else list = [...list].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  }, [posts, query, sortBy, filterLevel]);

  const total  = filtered.length;
  const pages  = Math.max(1, Math.ceil(total / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <>
      {/* ── Global styles injected once ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .posts-root { font-family: 'Plus Jakarta Sans', sans-serif; }

        /* Teal gradient accent bar */
        .accent-bar {
          background: linear-gradient(90deg, #0d9488 0%, #06b6d4 50%, #22d3ee 100%);
        }

        /* Card hover shimmer */
        .post-card {
          position: relative;
          overflow: hidden;
          transition: box-shadow .25s ease, transform .2s ease;
        }
        .post-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(20,184,166,.04) 0%, transparent 60%);
          opacity: 0;
          transition: opacity .25s ease;
          pointer-events: none;
        }
        .post-card:hover {
          box-shadow: 0 8px 32px -4px rgba(13,148,136,.13), 0 2px 8px -2px rgba(13,148,136,.08);
          transform: translateY(-2px);
        }
        .post-card:hover::before { opacity: 1; }

        /* Score ring */
        .score-ring {
          background: conic-gradient(#0d9488 0%, #22d3ee 100%);
          border-radius: 50%;
        }

        /* Pill buttons */
        .pill-btn {
          transition: background .15s, color .15s, transform .1s;
        }
        .pill-btn:active { transform: scale(.96); }

        /* Search focus glow */
        .search-input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(20,184,166,.2);
          border-color: #14b8a6;
        }

        /* Scrollbar thin */
        .posts-scroll::-webkit-scrollbar { width: 4px; }
        .posts-scroll::-webkit-scrollbar-thumb { background: #99f6e4; border-radius: 4px; }
      `}</style>

      <div className="posts-root min-h-screen bg-gradient-to-br from-teal-50/60 via-cyan-50/40 to-white">

        {/* ── Decorative top accent ── */}
        <div className="accent-bar h-1 w-full" />

        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8">

          {/* ── Header ── */}
          <header className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {/* Eyebrow */}
                <span className="inline-flex items-center gap-1.5 text-[11px] font-700 uppercase tracking-widest text-teal-600 mb-2">
                  <span className="w-4 h-px bg-teal-400" />
                  Recrutement
                </span>
                <h1 className="text-[26px] sm:text-3xl font-extrabold text-slate-800 leading-tight">
                  Offres d'emploi
                </h1>
                <p className="mt-1 text-sm text-slate-400 font-medium">
                  {loading ? (
                    <span className="animate-pulse">Chargement…</span>
                  ) : (
                    <>{total} offre{total !== 1 ? 's' : ''} disponible{total !== 1 ? 's' : ''}</>
                  )}
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={() => router.push('/Dashboard/RH/postslist/createpost')}
                className="pill-btn self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg shadow-teal-200"
                style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)' }}
              >
                <span className="text-lg leading-none">＋</span>
                Créer une offre
              </button>
            </div>

            {/* Stats ribbon */}
            {!loading && posts.length > 0 && (
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: 'Total offres',    value: posts.length,   color: 'text-teal-700',  bg: 'bg-teal-50  border-teal-100' },
                  { label: 'Candidatures',    value: posts.reduce((s, p) => s + (p.applicantsCount ?? p.applicants?.length ?? 0), 0), color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-100' },
                  { label: 'Offres actives',  value: posts.filter(p => p.isActive).length, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
                ].map(stat => (
                  <div key={stat.label} className={`rounded-xl border px-3 py-2.5 text-center ${stat.bg}`}>
                    <p className={`text-xl sm:text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </header>

          {/* ── Filters ── */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-400 text-base">🔍</span>
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1); }}
                placeholder="Titre, compétence, mot-clé…"
                className="search-input w-full border border-slate-200 bg-white rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-700 placeholder-slate-400"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* Level filter */}
              <select
                value={filterLevel}
                onChange={e => { setFilterLevel(e.target.value); setPage(1); }}
                className="search-input border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-sm text-slate-700 cursor-pointer"
              >
                <option value="all">Tous niveaux</option>
                <option value="Junior">Junior</option>
                <option value="Intermédiaire">Intermédiaire</option>
                <option value="Senior/Expert">Senior / Expert</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="search-input border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-sm text-slate-700 cursor-pointer"
              >
                <option value="date">Par date</option>
                <option value="score">Par score</option>
                <option value="applicants">Par candidats</option>
              </select>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {loading && (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-36 rounded-2xl bg-gradient-to-r from-slate-100 to-slate-50 animate-pulse" />
              ))}
            </div>
          )}

          {/* ── Empty ── */}
          {!loading && pageItems.length === 0 && (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">🔎</div>
              <p className="text-slate-500 font-medium">Aucune offre trouvée.</p>
              <p className="text-slate-400 text-sm mt-1">Essayez d'élargir vos filtres.</p>
            </div>
          )}

          {/* ── Cards ── */}
          <div className="space-y-4">
            {pageItems.map(post => {
              const level  = post.requiredLevel;
              const lvlStyle = level ? (LEVEL_STYLES[level] ?? { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' }) : null;
              const candidatCount = post.applicantsCount ?? post.applicants?.length ?? 0;
              const scoreVal = post.score ?? 0;

              return (
                <article key={post._id} className="post-card bg-white rounded-2xl border border-slate-100 shadow-sm">

                  {/* Thin teal left border accent */}
                  <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-gradient-to-b from-teal-400 to-cyan-300" />

                  <div className="pl-5 pr-4 pt-4 pb-3">

                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">

                        {/* Title + badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h2 className="text-[15px] font-bold text-slate-800 leading-snug">{post.title}</h2>

                          {lvlStyle && level && (
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${lvlStyle.bg} ${lvlStyle.text} border-transparent`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${lvlStyle.dot}`} />
                              {level}
                            </span>
                          )}

                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${post.isActive ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                            {post.isActive ? '● Actif' : '● Inactif'}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {post.description}
                        </p>

                        {/* Meta row */}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 font-medium">
                          {(post.minYearsExperience !== undefined || post.maxYearsExperience !== undefined) && (
                            <span className="flex items-center gap-1">
                              <span>💼</span>
                              {post.minYearsExperience ?? 0}{post.maxYearsExperience ? `–${post.maxYearsExperience}` : '+'} ans exp.
                            </span>
                          )}
                          {post.minYearsEducation !== undefined && post.minYearsEducation > 0 && (
                            <span className="flex items-center gap-1">
                              <span>🎓</span> Formation {post.minYearsEducation}+ ans
                            </span>
                          )}
                          {/* ── Candidate count — inline, no button ── */}
                          <span className="flex items-center gap-1 text-teal-600 font-semibold">
                            <span>👤</span>
                            {candidatCount} candidat{candidatCount !== 1 ? 's' : ''}
                            {(post.matchedApplicantsCount ?? 0) > 0 && (
                              <span className="ml-1 text-emerald-500">· {post.matchedApplicantsCount} ≥ 70%</span>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>📅</span>
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString('fr-FR') : '—'}
                          </span>
                        </div>

                        {/* Skills */}
                        {(post.requiredSkills?.length ?? 0) > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {post.requiredSkills!.slice(0, 4).map((s, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium border border-red-100">
                                {s}
                              </span>
                            ))}
                            {post.preferredSkills?.slice(0, 3).map((s, i) => (
                              <span key={`p-${i}`} className="text-[10px] px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded-full font-medium border border-cyan-100">
                                {s}
                              </span>
                            ))}
                            {(post.requiredSkills!.length > 4) && (
                              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">
                                +{post.requiredSkills!.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Score bubble */}
                      <div className="shrink-0 flex flex-col items-center gap-0.5">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-extrabold text-white shadow-md"
                          style={{ background: 'linear-gradient(135deg, #0d9488 0%, #22d3ee 100%)' }}>
                          {scoreVal}
                        </div>
                        <span className="text-[9px] text-slate-400 font-medium">score</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="mt-3 mb-2.5 h-px bg-gradient-to-r from-teal-50 via-slate-100 to-transparent" />

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => router.push(`/Dashboard/RH/postslist/${post._id}/details`)}
                        className="pill-btn px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #0d9488, #06b6d4)' }}
                      >
                        Détails
                      </button>
                {/* <button
                        onClick={() => router.push(`/Dashboard/RH/postslist/${post._id}/applicants`)}
                        className="pill-btn px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-100 hover:bg-teal-100"
                      >
                        Candidats
                      </button>*/}
                      <button
                        onClick={() => router.push(`/Dashboard/RH/postslist/${post._id}/editpost`)}
                        className="pill-btn px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(post._id)}
                        disabled={deletingId === post._id}
                        className="pill-btn ml-auto px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 disabled:opacity-40"
                      >
                        {deletingId === post._id ? '…' : 'Supprimer'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          {!loading && total > perPage && (
            <div className="mt-8 flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">
                {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} sur {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="pill-btn w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 text-sm font-bold flex items-center justify-center disabled:opacity-30 hover:border-teal-300 hover:text-teal-600"
                >
                  ‹
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`pill-btn w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all
                      ${n === page
                        ? 'text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:text-teal-600'
                      }`}
                    style={n === page ? { background: 'linear-gradient(135deg, #0d9488, #06b6d4)' } : {}}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="pill-btn w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 text-sm font-bold flex items-center justify-center disabled:opacity-30 hover:border-teal-300 hover:text-teal-600"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}