'use client';
// ─── SprintDatePicker.tsx ─────────────────────────────────────────────────────
// Un date-picker qui n'affiche QUE les dates comprises dans [minDate, maxDate].
// Utilise trois <select> (jour / mois / année) pour garantir qu'aucune date
// hors bornes ne peut être choisie, peu importe le navigateur.

import React, { useMemo, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface SprintDatePickerProps {
  /** Valeur actuelle au format YYYY-MM-DD (ou null/undefined) */
  value:      string | null | undefined;
  /** Borne inférieure au format YYYY-MM-DD */
  minDate?:   string;
  /** Borne supérieure au format YYYY-MM-DD */
  maxDate?:   string;
  /** Callback appelé avec la nouvelle valeur YYYY-MM-DD, ou null si effacé */
  onChange:   (val: string | null) => void;
  /** Classe CSS supplémentaire (ex: classe d'erreur) */
  className?: string;
  disabled?:  boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

/** Parse YYYY-MM-DD → { y, m, d } ou null */
const parseYMD = (s: string | null | undefined) => {
  if (!s) return null;
  const parts = s.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10); // 1-based
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return { y, m, d };
};

/** Nombre de jours dans un mois donné */
const daysInMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate(); // month est 1-based → new Date(y, m, 0) = dernier jour

/** Formate en YYYY-MM-DD */
const toYMD = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// ── Composant ──────────────────────────────────────────────────────────────────

export const SprintDatePicker: React.FC<SprintDatePickerProps> = ({
  value,
  minDate,
  maxDate,
  onChange,
  className = '',
  disabled = false,
}) => {
  const min = useMemo(() => parseYMD(minDate), [minDate]);
  const max = useMemo(() => parseYMD(maxDate), [maxDate]);
  const cur = useMemo(() => parseYMD(value),   [value]);

  // ── Si la valeur courante sort des bornes après un changement de sprint,
  //    on la réinitialise automatiquement ──────────────────────────────────────
  useEffect(() => {
    if (!cur || !minDate || !maxDate) return;
    const curStr = toYMD(cur.y, cur.m, cur.d);
    if (curStr < minDate || curStr > maxDate) {
      onChange(null);
    }
  }, [minDate, maxDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Plage d'années disponibles ────────────────────────────────────────────
  const years = useMemo(() => {
    if (!min || !max) return [];
    const arr: number[] = [];
    for (let y = min.y; y <= max.y; y++) arr.push(y);
    return arr;
  }, [min, max]);

  // ── Mois disponibles pour l'année sélectionnée ────────────────────────────
  const months = useMemo(() => {
    if (!min || !max || !cur) return Array.from({ length: 12 }, (_, i) => i + 1);
    const arr: number[] = [];
    for (let m = 1; m <= 12; m++) {
      // Le mois est valide si au moins un de ses jours est dans [min, max]
      const firstDay = toYMD(cur.y, m, 1);
      const lastDay  = toYMD(cur.y, m, daysInMonth(cur.y, m));
      const mMin = toYMD(min.y, min.m, min.d);
      const mMax = toYMD(max.y, max.m, max.d);
      if (firstDay <= mMax && lastDay >= mMin) arr.push(m);
    }
    return arr;
  }, [min, max, cur?.y]);

  // ── Jours disponibles pour l'année + mois sélectionnés ───────────────────
  const days = useMemo(() => {
    if (!min || !max || !cur) return Array.from({ length: 31 }, (_, i) => i + 1);
    const total = daysInMonth(cur.y, cur.m);
    const arr: number[] = [];
    const mMin = toYMD(min.y, min.m, min.d);
    const mMax = toYMD(max.y, max.m, max.d);
    for (let d = 1; d <= total; d++) {
      const dayStr = toYMD(cur.y, cur.m, d);
      if (dayStr >= mMin && dayStr <= mMax) arr.push(d);
    }
    return arr;
  }, [min, max, cur?.y, cur?.m]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleYear = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = parseInt(e.target.value, 10);
    if (!cur) {
      // Pas encore de date → on prend le premier mois/jour valide
      const firstMonth = months[0] ?? 1;
      const firstDay   = days[0]   ?? 1;
      onChange(toYMD(y, firstMonth, firstDay));
      return;
    }
    // Garder mois et jour si toujours valides, sinon les clamp
    const newMonths = getValidMonths(y, min, max);
    const m = newMonths.includes(cur.m) ? cur.m : (newMonths[0] ?? 1);
    const newDays = getValidDays(y, m, min, max);
    const d = newDays.includes(cur.d) ? cur.d : (newDays[0] ?? 1);
    onChange(toYMD(y, m, d));
  };

  const handleMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value, 10);
    const y = cur?.y ?? (min?.y ?? new Date().getFullYear());
    const newDays = getValidDays(y, m, min, max);
    const d = cur && newDays.includes(cur.d) ? cur.d : (newDays[0] ?? 1);
    onChange(toYMD(y, m, d));
  };

  const handleDay = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const d = parseInt(e.target.value, 10);
    const y = cur?.y ?? (min?.y ?? new Date().getFullYear());
    const m = cur?.m ?? (min?.m ?? 1);
    onChange(toYMD(y, m, d));
  };

  // ── Styles identiques au design token du formulaire ───────────────────────
  const selectBase = [
    'rounded-xl border border-teal-100 bg-white/80',
    'px-2.5 py-2.5 text-sm text-slate-700 appearance-none',
    'focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400',
    'transition-all duration-200 shadow-sm hover:border-teal-300',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'pr-7', // espace pour la flèche
  ].join(' ');

  const errorSelectBase = selectBase
    .replace('border-teal-100', 'border-amber-300')
    .replace('bg-white/80', 'bg-amber-50/50')
    .replace('focus:ring-teal-400/50 focus:border-teal-400', 'focus:ring-amber-400/50 focus:border-amber-400')
    .replace('hover:border-teal-300', 'hover:border-amber-400');

  const isError = className.includes('inputError');
  const sel     = isError ? errorSelectBase : selectBase;

  // ── Pas de bornes → input natif de secours ────────────────────────────────
  if (!min || !max) {
    return (
      <input
        type="date"
        className={`w-full ${sel} ${className}`}
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || null)}
      />
    );
  }

  const placeholder = !cur;

  return (
    <div className={`flex gap-1.5 ${className}`}>

      {/* ── Jour ──────────────────────────────────────────────────────── */}
      <div className="relative flex-1 min-w-0">
        <select
          className={`w-full ${sel}`}
          value={cur?.d ?? ''}
          disabled={disabled}
          onChange={handleDay}
        >
          {placeholder && <option value="" disabled>JJ</option>}
          {days.map((d) => (
            <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-teal-400 pointer-events-none"
        />
      </div>

      {/* ── Mois ──────────────────────────────────────────────────────── */}
      <div className="relative flex-[1.6] min-w-0">
        <select
          className={`w-full ${sel}`}
          value={cur?.m ?? ''}
          disabled={disabled}
          onChange={handleMonth}
        >
          {placeholder && <option value="" disabled>Mois</option>}
          {months.map((m) => (
            <option key={m} value={m}>{MONTHS_FR[m - 1]}</option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-teal-400 pointer-events-none"
        />
      </div>

      {/* ── Année ─────────────────────────────────────────────────────── */}
      <div className="relative flex-[1.2] min-w-0">
        <select
          className={`w-full ${sel}`}
          value={cur?.y ?? ''}
          disabled={disabled}
          onChange={handleYear}
        >
          {placeholder && <option value="" disabled>AAAA</option>}
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-teal-400 pointer-events-none"
        />
      </div>
    </div>
  );
};

// ── Helpers internes (réutilisés dans les handlers) ────────────────────────────

function getValidMonths(
  year: number,
  min:  { y: number; m: number; d: number } | null,
  max:  { y: number; m: number; d: number } | null,
): number[] {
  const arr: number[] = [];
  const mMin = min ? toYMD(min.y, min.m, min.d) : '0000-00-00';
  const mMax = max ? toYMD(max.y, max.m, max.d) : '9999-12-31';
  for (let m = 1; m <= 12; m++) {
    const firstDay = toYMD(year, m, 1);
    const lastDay  = toYMD(year, m, daysInMonth(year, m));
    if (firstDay <= mMax && lastDay >= mMin) arr.push(m);
  }
  return arr;
}

function getValidDays(
  year:  number,
  month: number,
  min:   { y: number; m: number; d: number } | null,
  max:   { y: number; m: number; d: number } | null,
): number[] {
  const total = daysInMonth(year, month);
  const arr: number[] = [];
  const mMin = min ? toYMD(min.y, min.m, min.d) : '0000-00-00';
  const mMax = max ? toYMD(max.y, max.m, max.d) : '9999-12-31';
  for (let d = 1; d <= total; d++) {
    const dayStr = toYMD(year, month, d);
    if (dayStr >= mMin && dayStr <= mMax) arr.push(d);
  }
  return arr;
}