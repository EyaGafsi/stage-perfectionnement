'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────

type Post = {
  _id: string;
  title: string;
  description: string;
  requiredLevel?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  minYearsExperience?: number;
  maxYearsExperience?: number;
  minYearsEducation?: number;
  tags?: string[];
  keywords?: string[];
  isActive?: boolean;
  applicantsCount?: number;
  createdAt?: string;
};

// ── Helpers ──────────────────────────────────────────────────

const LEVEL_COLOR: Record<string, string> = {
  Junior: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermédiaire: 'bg-amber-50 text-amber-700 border-amber-200',
  'Senior/Expert': 'bg-violet-50 text-violet-700 border-violet-200',
};

const LEVEL_DOT: Record<string, string> = {
  Junior: 'bg-emerald-400',
  Intermédiaire: 'bg-amber-400',
  'Senior/Expert': 'bg-violet-400',
};

function SkillPill({
  children,
  variant = 'required',
}: {
  children: React.ReactNode;
  variant?: 'required' | 'preferred';
}) {
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all duration-200 ${
        variant === 'required'
          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
      }`}
    >
      {children}
    </span>
  );
}

// ── Card ─────────────────────────────────────────────────────

function PostCard({ post }: { post: Post }) {
  const level = post.requiredLevel;
  const expMin = post.minYearsExperience ?? 0;
  const expMax = post.maxYearsExperience;
  const expLabel = expMax ? `${expMin}–${expMax} ans` : `${expMin}+ ans`;
  const required = post.requiredSkills ?? [];
  const preferred = post.preferredSkills ?? [];
  const visibleRequired = required.slice(0, 3);
  const visiblePreferred = preferred.slice(0, 2);
  const extraRequired = required.length - 3;
  const extraPreferred = preferred.length - 2;

  return (
    <article className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-teal-300 hover:shadow-xl transition-all duration-300">
      {/* Hover accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-5 md:p-6">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {level && (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                    LEVEL_COLOR[level] ?? 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${LEVEL_DOT[level] ?? 'bg-gray-400'}`}
                  />
                  {level}
                </span>
              )}
              {post.isActive ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Actif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-semibold bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  Clôturé
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-teal-700 transition-colors duration-200 line-clamp-2">
              {post.title}
            </h2>
          </div>

          {/* Exp badge */}
          <div className="shrink-0 text-right bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-2.5">
            <div className="text-xs text-gray-600 font-semibold mb-1">Expérience</div>
            <div className="text-base font-bold text-teal-700">{expLabel}</div>
            {post.minYearsEducation !== undefined && (
              <div className="text-xs text-gray-500 mt-1">
                Forma. {post.minYearsEducation}+ ans
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-4">
          {post.description}
        </p>

        {/* Skills Section */}
        {(required.length > 0 || preferred.length > 0) && (
          <div className="mb-4">
            {required.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-700 mb-2">Compétences requises:</p>
                <div className="flex flex-wrap gap-1.5">
                  {visibleRequired.map((s, i) => (
                    <SkillPill key={`r-${i}`} variant="required">
                      {s}
                    </SkillPill>
                  ))}
                  {extraRequired > 0 && (
                    <span className="text-xs font-semibold text-gray-500 self-center bg-gray-100 px-2.5 py-1 rounded-lg">
                      +{extraRequired}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {preferred.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Préférées:</p>
                <div className="flex flex-wrap gap-1.5">
                  {visiblePreferred.map((s, i) => (
                    <SkillPill key={`p-${i}`} variant="preferred">
                      {s}
                    </SkillPill>
                  ))}
                  {extraPreferred > 0 && (
                    <span className="text-xs font-semibold text-gray-500 self-center bg-gray-100 px-2.5 py-1 rounded-lg">
                      +{extraPreferred}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {(post.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags!.slice(0, 3).map((t, i) => (
              <span
                key={i}
                className="text-xs bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 px-2.5 py-1 rounded-lg border border-teal-200 font-medium"
              >
                #{t}
              </span>
            ))}
            {(post.tags?.length ?? 0) > 3 && (
              <span className="text-xs text-gray-500 self-center">+{(post.tags?.length ?? 0) - 3}</span>
            )}
          </div>
        )}

        {/* Keywords */}
        {(post.keywords?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.keywords!.slice(0, 2).map((k, i) => (
              <span
                key={i}
                className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg font-medium"
              >
                {k}
              </span>
            ))}
            {(post.keywords?.length ?? 0) > 2 && (
              <span className="text-xs text-gray-500 self-center">+{(post.keywords?.length ?? 0) - 2}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-4 border-t border-gray-200 gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
            {post.applicantsCount !== undefined && (
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {post.applicantsCount} candidat{post.applicantsCount !== 1 ? 's' : ''}
              </span>
            )}
            {post.createdAt && (
              <span className="text-gray-400">
                {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>

          {post.isActive ? (
            <Link
              href={`/condidat/postuler/${post._id}`}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-bold rounded-lg hover:from-teal-600 hover:to-cyan-600 active:scale-95 transition-all duration-150 shadow-md hover:shadow-lg hover:shadow-teal-200"
            >
              Postuler
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          ) : (
            <button className="w-full md:w-auto px-5 py-2.5 bg-gray-100 text-gray-400 text-sm font-semibold rounded-lg cursor-not-allowed border border-gray-200">
              Clôturé
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Skeleton ─────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="space-y-2 flex-1">
          <div className="h-2.5 bg-gray-200 rounded-full w-1/3" />
          <div className="h-4 bg-gray-200 rounded-full w-2/3" />
        </div>
        <div className="h-10 w-20 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-3 bg-gray-200 rounded-full w-full mb-1.5" />
      <div className="h-3 bg-gray-200 rounded-full w-4/5 mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 bg-gray-200 rounded-lg" />
        <div className="h-6 w-20 bg-gray-200 rounded-lg" />
        <div className="h-6 w-14 bg-gray-200 rounded-lg" />
      </div>
      <div className="flex flex-col md:flex-row justify-between pt-4 border-t border-gray-200 gap-3">
        <div className="h-3 w-24 bg-gray-200 rounded-full" />
        <div className="h-9 w-full md:w-32 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function OffresPubliquesPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'closed'>('active');

  const base = process.env.NEXT_PUBLIC_NEST_API_URL || '';

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${base}/posts`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : (data.data ?? []));
      } catch (err: any) {
        setError(err.message || 'Impossible de charger les offres.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [base]);

  const levels = Array.from(
    new Set(posts.map(p => p.requiredLevel).filter(Boolean))
  ) as string[];

  const filtered = posts.filter(p => {
    if (filterActive === 'active' && !p.isActive) return false;
    if (filterActive === 'closed' && p.isActive) return false;
    if (filterLevel && p.requiredLevel !== filterLevel) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.requiredSkills?.some(s => s.toLowerCase().includes(q)) ||
        p.tags?.some(t => t.toLowerCase().includes(q)) ||
        p.keywords?.some(k => k.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activeCount = posts.filter(p => p.isActive).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">

      {/* ── Hero ── */}
      <div className="relative bg-white border-b border-gray-200 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#e0f2fe_0%,_transparent_60%)] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-300 text-teal-700 text-xs font-bold px-4 py-2 rounded-full mb-5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            {activeCount} offre{activeCount !== 1 ? 's' : ''} disponible{activeCount !== 1 ? 's' : ''}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Découvrez votre{' '}
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              prochaine opportunité
            </span>
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto font-medium">
            Explorez nos offres d'emploi et postulez en quelques minutes. Trouvez le rôle idéal pour votre carrière.
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Titre, compétence, tag..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
            />
          </div>

          {/* Level filter */}
          {levels.length > 0 && (
            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all w-full md:w-auto"
            >
              <option value="">Tous les niveaux</option>
              {levels.map(l => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          )}

          {/* Active filter */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-full md:w-auto">
            {(['all', 'active', 'closed'] as const).map(v => (
              <button
                key={v}
                onClick={() => setFilterActive(v)}
                className={`text-xs font-bold px-3 py-2 rounded-md transition-all duration-150 ${
                  filterActive === v
                    ? 'bg-white text-teal-700 shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                {v === 'all' ? 'Tout' : v === 'active' ? 'Actives' : 'Clôturées'}
              </button>
            ))}
          </div>

          <span className="text-xs font-semibold text-gray-600 md:ml-auto">
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-12">
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-red-600 text-base font-semibold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2.5 text-sm font-bold border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-all"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-600 text-lg font-semibold mb-2">Aucune offre trouvée</p>
            <p className="text-gray-500 text-sm mb-8">Aucune offre ne correspond à vos critères de recherche.</p>
            <button
              onClick={() => { setSearch(''); setFilterLevel(''); setFilterActive('all'); }}
              className="px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filtered.map(post => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}