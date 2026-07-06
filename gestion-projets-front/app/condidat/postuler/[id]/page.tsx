'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const CV_PARSER_URL = 'https://resume-parsing-jfns.onrender.com';
const SCORING_URL = process.env.NEXT_PUBLIC_SCORING_URL || 'https://concditascore.onrender.com';
const NEST_URL = process.env.NEXT_PUBLIC_NEST_API_URL || '';

// ============================================================
// TYPES
// ============================================================

interface ParsedSkills {
  technical: string[];
  languages: string[];
  soft: string[];
  tools: string[];
  all: string[];
}

interface ParsedCV {
  filename: string;
  language: string;
  experience: string;
  education: string;
  years_experience: number;
  years_education: number;
  level: string;
  skills: ParsedSkills;
}

interface ScoreBreakdown {
  score: number;
  semantic_similarity?: number;
  years_score?: number;
  cv_years?: number;
  required_years?: number;
  required_matched?: string[];
  required_total?: number;
  required_ratio?: number;
  preferred_matched?: string[];
  preferred_total?: number;
  preferred_ratio?: number;
  cv_skills?: string[];
  required_level?: string;
  candidate_level?: string;
}

interface ScoreResult {
  job_title: string;
  final_score: number;
  breakdown: {
    experience: ScoreBreakdown;
    education: ScoreBreakdown;
    skills: ScoreBreakdown;
    level: ScoreBreakdown;
    global_semantic: ScoreBreakdown;
  };
}

type Step = 'form' | 'parsing' | 'confirm' | 'scoring' | 'done';

// ============================================================
// GLOBAL STYLES (injected once)
// ============================================================

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  :root {
    --teal-50:  #f0fdfa;
    --teal-100: #ccfbf1;
    --teal-200: #99f6e4;
    --teal-300: #5eead4;
    --teal-400: #2dd4bf;
    --teal-500: #14b8a6;
    --teal-600: #0d9488;
    --teal-700: #0f766e;
    --cyan-400: #22d3ee;
    --cyan-500: #06b6d4;
    --mint:     #e0fdf4;
    --glass:    rgba(255,255,255,0.72);
    --glass-border: rgba(20,184,166,0.18);
  }

  .apply-root * { box-sizing: border-box; }

  .apply-root {
    font-family: 'Sora', sans-serif;
    min-height: 100vh;
    background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 40%, #f0fdf4 80%, #fefce8 100%);
    position: relative;
    overflow-x: hidden;
  }

  /* Decorative blobs */
  .apply-root::before {
    content: '';
    position: fixed;
    top: -120px; right: -120px;
    width: 420px; height: 420px;
    background: radial-gradient(circle, rgba(45,212,191,0.22) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
  }
  .apply-root::after {
    content: '';
    position: fixed;
    bottom: -80px; left: -80px;
    width: 320px; height: 320px;
    background: radial-gradient(circle, rgba(34,211,238,0.18) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
  }

  .apply-inner {
    position: relative; z-index: 1;
    max-width: 640px;
    margin: 0 auto;
    padding: 48px 20px 60px;
  }

  /* ── Header ── */
  .apply-header {
    text-align: center;
    margin-bottom: 36px;
  }
  .apply-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(90deg, var(--teal-500), var(--cyan-500));
    color: white;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 100px;
    margin-bottom: 14px;
  }
  .apply-title {
    font-size: 32px;
    font-weight: 800;
    background: linear-gradient(135deg, #0f766e, #0891b2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 6px;
    line-height: 1.15;
  }
  .apply-subtitle {
    font-size: 13px;
    color: #64748b;
    margin: 0;
    font-weight: 400;
  }

  /* ── Step Bar ── */
  .step-bar {
    display: flex;
    align-items: center;
    margin-bottom: 32px;
    padding: 0 4px;
  }
  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }
  .step-dot {
    width: 38px; height: 38px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
    border: 2.5px solid;
    transition: all 0.35s ease;
    position: relative;
  }
  .step-dot-done {
    background: linear-gradient(135deg, var(--teal-400), var(--teal-500));
    border-color: var(--teal-500);
    color: white;
    box-shadow: 0 0 0 4px rgba(20,184,166,0.15);
  }
  .step-dot-active {
    background: white;
    border-color: var(--teal-500);
    color: var(--teal-600);
    box-shadow: 0 0 0 5px rgba(20,184,166,0.12), 0 4px 12px rgba(20,184,166,0.2);
  }
  .step-dot-inactive {
    background: #f8fafc;
    border-color: #e2e8f0;
    color: #94a3b8;
  }
  .step-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
    display: none;
  }
  @media (min-width: 480px) { .step-label { display: block; } }
  .step-label-done   { color: var(--teal-600); }
  .step-label-active { color: var(--teal-600); }
  .step-label-inactive { color: #94a3b8; }
  .step-line {
    flex: 1;
    height: 2.5px;
    margin: 0 6px;
    margin-bottom: 18px;
    border-radius: 2px;
    transition: all 0.5s ease;
  }
  .step-line-done   { background: linear-gradient(90deg, var(--teal-400), var(--teal-500)); }
  .step-line-inactive { background: #e2e8f0; }

  /* ── Card ── */
  .apply-card {
    background: var(--glass);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1.5px solid var(--glass-border);
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(20,184,166,0.08), 0 2px 8px rgba(0,0,0,0.04);
    overflow: hidden;
  }

  /* ── Error banner ── */
  .error-banner {
    margin: 20px 24px 0;
    padding: 12px 16px;
    background: #fff1f2;
    border: 1.5px solid #fecdd3;
    color: #e11d48;
    border-radius: 14px;
    font-size: 13px;
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  /* ── Section padding ── */
  .card-body { padding: 32px; }

  .section-title {
    font-size: 17px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 4px;
  }
  .section-sub {
    font-size: 12.5px;
    color: #64748b;
    margin: 0 0 22px;
  }

  /* ── Inputs ── */
  .field-group { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }

  .inp {
    width: 100%;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    padding: 13px 16px;
    font-size: 13.5px;
    font-family: 'Sora', sans-serif;
    color: #0f172a;
    background: rgba(255,255,255,0.85);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .inp::placeholder { color: #94a3b8; }
  .inp:focus {
    border-color: var(--teal-400);
    box-shadow: 0 0 0 3px rgba(45,212,191,0.15);
    background: white;
  }

  /* ── Upload zone ── */
  .upload-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 8px;
  }
  .upload-label { font-size: 12.5px; font-weight: 700; color: #475569; }
  .upload-link {
    font-size: 11.5px; font-weight: 600;
    color: var(--teal-600);
    background: var(--teal-50);
    border: 1px solid var(--teal-200);
    padding: 4px 10px; border-radius: 100px;
    cursor: pointer; text-decoration: none;
    transition: background 0.2s;
  }
  .upload-link:hover { background: var(--teal-100); }

  .upload-zone {
    display: block; width: 100%;
    border: 2px dashed var(--teal-200);
    border-radius: 16px;
    padding: 28px 20px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    background: rgba(240,253,250,0.5);
  }
  .upload-zone:hover { border-color: var(--teal-400); background: var(--teal-50); }
  .upload-zone-icon { font-size: 28px; display: block; margin-bottom: 6px; }
  .upload-zone-text { font-size: 12.5px; color: #64748b; }
  .upload-zone-selected { font-size: 13px; font-weight: 600; color: var(--teal-700); }

  .upload-success {
    padding: 14px 18px;
    background: linear-gradient(135deg, #f0fdf4, #e0fdf4);
    border: 1.5px solid var(--teal-200);
    border-radius: 14px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .upload-success-text { font-size: 13px; font-weight: 600; color: var(--teal-700); display: flex; align-items: center; gap: 8px; }
  .upload-success-change { font-size: 11.5px; color: var(--teal-600); cursor: pointer; }
  .upload-success-change:hover { text-decoration: underline; }

  /* ── Buttons ── */
  .btn-primary {
    width: 100%;
    background: linear-gradient(135deg, var(--teal-500) 0%, var(--cyan-500) 100%);
    color: white;
    border: none;
    border-radius: 14px;
    padding: 14px 24px;
    font-size: 14px;
    font-weight: 700;
    font-family: 'Sora', sans-serif;
    cursor: pointer;
    transition: all 0.25s;
    box-shadow: 0 4px 16px rgba(20,184,166,0.3);
    letter-spacing: 0.3px;
    margin-top: 8px;
  }
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(20,184,166,0.4);
  }
  .btn-primary:active:not(:disabled) { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .btn-secondary {
    flex: 1;
    background: white;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    padding: 13px 20px;
    font-size: 13.5px;
    font-weight: 600;
    font-family: 'Sora', sans-serif;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }

  .btn-row { display: flex; gap: 10px; }

  /* ── Loader ── */
  .loader-wrap {
    padding: 64px 32px;
    display: flex; flex-direction: column; align-items: center; gap: 20px;
  }
  .loader-ring {
    position: relative; width: 68px; height: 68px;
  }
  .loader-ring-track {
    position: absolute; inset: 0;
    border-radius: 50%;
    border: 4px solid;
  }
  .loader-ring-teal   { border-color: rgba(45,212,191,0.15); }
  .loader-ring-spin   { border-color: transparent; border-top-color: var(--teal-500); animation: spin 0.8s linear infinite; }
  .loader-ring-amber  { border-color: rgba(251,191,36,0.15); }
  .loader-ring-amber-spin { border-color: transparent; border-top-color: #f59e0b; animation: spin 0.8s linear infinite; }
  .loader-icon {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loader-msg { font-size: 14px; font-weight: 600; color: #334155; }
  .loader-sub { font-size: 12px; color: #94a3b8; }

  /* ── Confirm step ── */
  .stats-grid {
    display: grid; grid-template-columns: repeat(3,1fr); gap: 10px;
    margin-bottom: 22px;
  }
  .stat-tile {
    background: linear-gradient(135deg, var(--teal-50), rgba(224,242,254,0.6));
    border: 1.5px solid var(--teal-100);
    border-radius: 16px;
    padding: 14px 10px;
    text-align: center;
  }
  .stat-tile-label { font-size: 10.5px; font-weight: 700; color: var(--teal-600); letter-spacing: 0.5px; text-transform: uppercase; }
  .stat-tile-value { font-size: 18px; font-weight: 800; color: #0f766e; margin-top: 4px; }

  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
  .form-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 16px; }
  .field-label { font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; }

  select.inp {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 36px;
  }

  textarea.inp { resize: none; line-height: 1.6; font-family: 'DM Mono', monospace; font-size: 12px; }

  /* Skills */
  .skills-wrap {
    display: flex; flex-wrap: wrap; gap: 6px;
    max-height: 140px; overflow-y: auto;
    padding: 4px 2px;
  }
  .skills-wrap::-webkit-scrollbar { width: 4px; }
  .skills-wrap::-webkit-scrollbar-track { background: transparent; }
  .skills-wrap::-webkit-scrollbar-thumb { background: var(--teal-200); border-radius: 2px; }

  .skill-chip {
    display: inline-flex; align-items: center; gap: 5px;
    background: white;
    border: 1.5px solid var(--teal-100);
    color: #0f766e;
    font-size: 11.5px; font-weight: 500;
    padding: 4px 10px; border-radius: 100px;
    transition: all 0.15s;
  }
  .skill-chip:hover { border-color: var(--teal-300); background: var(--teal-50); }
  .skill-chip-remove {
    background: none; border: none; cursor: pointer;
    color: #94a3b8; font-size: 14px; line-height: 1;
    padding: 0; margin-left: 2px;
    display: flex; align-items: center;
  }
  .skill-chip-remove:hover { color: #e11d48; }

  /* ── Score cards ── */
  .score-hero {
    background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%);
    border: 1.5px solid var(--teal-100);
    border-radius: 20px;
    padding: 28px 20px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .score-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 0%, rgba(45,212,191,0.12) 0%, transparent 70%);
  }
  .score-hero-label { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--teal-600); margin-bottom: 8px; position: relative; }
  .score-hero-number {
    font-size: 72px; font-weight: 800; line-height: 1;
    position: relative;
    background: linear-gradient(135deg, #0f766e, #0891b2);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .score-hero-number-amber { background: linear-gradient(135deg, #d97706, #ea580c) !important; }
  .score-hero-number-rose  { background: linear-gradient(135deg, #e11d48, #dc2626) !important; }
  .score-hero-badge {
    display: inline-flex; align-items: center; gap: 5px;
    margin-top: 10px; position: relative;
    font-size: 12.5px; font-weight: 600; color: #475569;
  }

  .score-breakdown-title {
    font-size: 11px; font-weight: 700; letter-spacing: 1.2px;
    text-transform: uppercase; color: #64748b;
    margin: 0 0 12px;
  }
  .score-cards-grid { display: flex; flex-direction: column; gap: 8px; }

  .score-card {
    border-radius: 14px;
    border: 1.5px solid;
    padding: 12px 16px;
  }
  .sc-teal  { background: linear-gradient(135deg, #f0fdfa, #e0fdf4); border-color: var(--teal-100); }
  .sc-amber { background: linear-gradient(135deg, #fffbeb, #fef3c7); border-color: #fde68a; }
  .sc-rose  { background: linear-gradient(135deg, #fff1f2, #ffe4e6); border-color: #fecdd3; }

  .sc-row { display: flex; justify-content: space-between; align-items: center; }
  .sc-label { font-size: 12.5px; font-weight: 600; color: #334155; }
  .sc-score { font-size: 20px; font-weight: 800; }
  .sc-score-teal  { color: var(--teal-600); }
  .sc-score-amber { color: #d97706; }
  .sc-score-rose  { color: #e11d48; }
  .sc-detail { font-size: 11px; color: #64748b; margin-top: 3px; }
  .sc-bar { margin-top: 8px; height: 4px; border-radius: 4px; background: #e2e8f0; overflow: hidden; }
  .sc-bar-fill { height: 100%; border-radius: 4px; transition: width 0.7s ease; }
  .sc-bar-teal  { background: linear-gradient(90deg, var(--teal-400), var(--teal-500)); }
  .sc-bar-amber { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
  .sc-bar-rose  { background: linear-gradient(90deg, #fb7185, #e11d48); }

  /* Skills matched */
  .matched-wrap { display: flex; flex-wrap: gap; gap: 6px; flex-wrap: wrap; }
  .skill-badge-matched {
    display: inline-flex; align-items: center; gap: 4px;
    background: linear-gradient(135deg, var(--teal-50), #e0f2fe);
    border: 1.5px solid var(--teal-200);
    color: var(--teal-700);
    font-size: 11.5px; font-weight: 600;
    padding: 4px 11px; border-radius: 100px;
  }

  /* Success banner */
  .success-banner {
    background: linear-gradient(135deg, #f0fdf4, #e0fdf4);
    border: 1.5px solid var(--teal-200);
    border-radius: 16px;
    padding: 20px;
    text-align: center;
    position: relative; overflow: hidden;
  }
  .success-banner::before {
    content: '';
    position: absolute; top: -40px; right: -40px;
    width: 120px; height: 120px;
    background: radial-gradient(circle, rgba(45,212,191,0.15) 0%, transparent 70%);
    border-radius: 50%;
  }
  .success-title { font-size: 15px; font-weight: 700; color: #0f766e; margin-bottom: 4px; }
  .success-sub   { font-size: 12px; color: #0d9488; }

  .cv-link {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 600;
    color: var(--teal-600); text-decoration: none;
    padding: 8px 14px;
    background: var(--teal-50); border: 1.5px solid var(--teal-200);
    border-radius: 100px;
    transition: all 0.2s;
  }
  .cv-link:hover { background: var(--teal-100); color: var(--teal-700); }

  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--teal-100), transparent);
    margin: 4px 0;
  }
`;

// ============================================================
// STEP INDICATOR
// ============================================================

const stepDefs = ['Infos', 'Analyse', 'Confirmer', 'Score', 'Envoyé'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="step-bar">
      {stepDefs.map((label, i) => (
        <React.Fragment key={i}>
          <div className="step-item">
            <div className={`step-dot ${i < current ? 'step-dot-done' : i === current ? 'step-dot-active' : 'step-dot-inactive'}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`step-label ${i < current ? 'step-label-done' : i === current ? 'step-label-active' : 'step-label-inactive'}`}>
              {label}
            </span>
          </div>
          {i < stepDefs.length - 1 && (
            <div className={`step-line ${i < current ? 'step-line-done' : 'step-line-inactive'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================
// SCORE CARD
// ============================================================

function ScoreCard({ label, score, detail }: { label: string; score: number; detail?: string }) {
  const tier = score >= 75 ? 'teal' : score >= 50 ? 'amber' : 'rose';
  return (
    <div className={`score-card sc-${tier}`}>
      <div className="sc-row">
        <span className="sc-label">{label}</span>
        <span className={`sc-score sc-score-${tier}`}>{score.toFixed(0)}%</span>
      </div>
      {detail && <p className="sc-detail">{detail}</p>}
      <div className="sc-bar">
        <div className={`sc-bar-fill sc-bar-${tier}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ApplyPage() {
  const params = useParams();
  const postId = params?.id as string;
  const router = useRouter();

  const [step, setStep] = useState<Step>('form');
  const stepIndex = ['form', 'parsing', 'confirm', 'scoring', 'done'].indexOf(step);

  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [file, setFile] = useState<File | null>(null);
  const [resumeBlob, setResumeBlob] = useState<Blob | null>(null);

  const [parsedCV, setParsedCV] = useState<ParsedCV | null>(null);
  const [editedCV, setEditedCV] = useState<ParsedCV | null>(null);

  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [cvLink, setCvLink] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');

  useEffect(() => {
    const checkBlob = async () => {
      try {
        const blobUrl = localStorage.getItem('resumeBlobUrl');
        if (blobUrl) {
          const res = await fetch(blobUrl);
          if (res.ok) setResumeBlob(await res.blob());
        }
      } catch {}
    };
    checkBlob();
  }, []);

  const validateFile = (f: File | Blob): string | null => {
    if (!['application/pdf', 'application/octet-stream'].includes(f.type) && !(f instanceof Blob))
      return 'Seuls les fichiers PDF sont acceptés';
    if (f.size > MAX_FILE_SIZE) return 'Fichier trop volumineux (max 15 Mo)';
    return null;
  };

  const toBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const b64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const handleParseCV = async () => {
    setError(null);
    if (!formData.name || !formData.email) { setError('Veuillez remplir nom et email'); return; }
    const cvFile = resumeBlob || file;
    if (!cvFile) { setError('Veuillez joindre un CV en PDF'); return; }
    const fileErr = validateFile(cvFile);
    if (fileErr) { setError(fileErr); return; }
    setStep('parsing');
    setLoadingMsg('Analyse de votre CV en cours…');
    try {
      const b64 = await toBase64(cvFile);
      const res = await fetch(`${CV_PARSER_URL}/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_base64: b64, filename: (file as File)?.name || 'cv.pdf' }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Erreur lors de l'analyse du CV"); }
      const raw = await res.json();
      const normalizeSkills = (s: any): ParsedSkills => {
        if (!s) return { technical: [], languages: [], soft: [], tools: [], all: [] };
        if (Array.isArray(s)) return { technical: s, languages: [], soft: [], tools: [], all: s };
        return {
          technical: Array.isArray(s.technical) ? s.technical : [],
          languages: Array.isArray(s.languages) ? s.languages : [],
          soft: Array.isArray(s.soft) ? s.soft : [],
          tools: Array.isArray(s.tools) ? s.tools : [],
          all: Array.isArray(s.all) ? s.all : [...(Array.isArray(s.technical) ? s.technical : []), ...(Array.isArray(s.tools) ? s.tools : [])],
        };
      };
      const data: ParsedCV = { ...raw, skills: normalizeSkills(raw.skills) };
      setParsedCV(data);
      setEditedCV(JSON.parse(JSON.stringify(data)));
      setStep('confirm');
    } catch (e: any) { setError(e.message); setStep('form'); }
  };

  const handleConfirmAndScore = async () => {
    if (!editedCV) return;
    setError(null);
    setStep('scoring');
    const cvFile = resumeBlob || file;
    try {
      setLoadingMsg('Récupération des détails du poste…');
      const postRes = await fetch(`${NEST_URL}/posts/${postId}`);
      if (!postRes.ok) throw new Error('Impossible de récupérer le poste');
      const post = await postRes.json();

      setLoadingMsg('Upload du CV…');
      const uploadData = new FormData();
      uploadData.append('file', cvFile!, 'resume.pdf');
      uploadData.append('postId', postId);
      uploadData.append('name', formData.name);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadData });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.error || 'Erreur upload CV');
      const uploadedCvLink: string = uploadJson.secure_url;
      setCvLink(uploadedCvLink);

      setLoadingMsg('Calcul du score de compatibilité…');
      const scorePayload = {
        job_title: post.title,
        job_description: post.description,
        job_experience_description: post.experienceDescription || '',
        job_education_description: post.educationDescription || '',
        job_skills_description: post.skillsDescription || '',
        job_required_skills: post.requiredSkills || [],
        job_preferred_skills: post.preferredSkills || [],
        job_keywords: post.keywords || [],
        job_required_level: post.requiredLevel || 'Junior',
        job_min_years_experience: post.minYearsExperience || 0,
        job_min_years_education: post.minYearsEducation || 0,
        cv: {
          experience_text: editedCV.experience,
          education_text: editedCV.education,
          years_experience: editedCV.years_experience,
          years_education: editedCV.years_education,
          skills: editedCV.skills.all,
          technical_skills: editedCV.skills.technical,
          level: editedCV.level,
        },
      };
      const scoreRes = await fetch(`${SCORING_URL}/score`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scorePayload),
      });
      const scoreJson: ScoreResult = await scoreRes.json();
      if (!scoreRes.ok) throw new Error((scoreJson as any).detail || 'Erreur scoring');
      setScoreResult(scoreJson);

      setLoadingMsg('Enregistrement de la candidature…');
      const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v * 100) / 100));
      const b = scoreJson.breakdown ?? null;
      const expScore    = clamp(b?.experience?.score   ?? scoreJson.final_score ?? 0);
      const eduScore    = clamp(b?.education?.score    ?? scoreJson.final_score ?? 0);
      const skillsScore = clamp(b?.skills?.score       ?? scoreJson.final_score ?? 0);
      const levelScore  = clamp(b?.level?.score        ?? 100);
      const finalScore  = clamp(scoreJson.final_score  ?? (scoreJson as any).final_score_percent ?? 0);
      const rawPhone = formData.phone;
      const phoneStr = typeof rawPhone === 'string' ? rawPhone : (rawPhone as any)?.phone ?? undefined;

      const applyBody = {
        name: formData.name, email: formData.email, phone: phoneStr || undefined,
        cvLink: uploadedCvLink,
        experience_text: editedCV.experience, education_text: editedCV.education,
        years_experience: editedCV.years_experience, years_education: editedCV.years_education,
        skills: editedCV.skills.all, level: editedCV.level,
        experienceScore: expScore, educationScore: eduScore,
        skillsScore, levelScore, score: finalScore,
        cvParsingStatus: 'success',
      };

      const applyRes = await fetch(`${NEST_URL}/posts/${postId}/apply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applyBody),
      });
      const applyJson = await applyRes.json();
      if (!applyRes.ok) {
        const msg = Array.isArray(applyJson.message) ? applyJson.message.join(', ') : applyJson.message || 'Erreur envoi candidature';
        throw new Error(msg);
      }
      localStorage.removeItem('resumeBlobUrl');
      localStorage.removeItem('resumeFileName');
      setStep('done');
    } catch (e: any) { setError(e.message); setStep('confirm'); }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="apply-root">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <div className="apply-inner">

        {/* Header */}
        <div className="apply-header">
          <div className="apply-eyebrow">
            <span>✦</span> Candidature
          </div>
          <h1 className="apply-title">Postuler à l&apos;offre</h1>
          <p className="apply-subtitle">Processus guidé · Analyse IA de votre profil</p>
        </div>

        {/* Step bar */}
        <StepBar current={stepIndex} />

        {/* Card */}
        <div className="apply-card">

          {/* Error banner */}
          {error && (
            <div className="error-banner">
              <span style={{ fontSize: 16, lineHeight: 1, marginTop: 1 }}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── FORM ── */}
          {step === 'form' && (
            <div className="card-body">
              <p className="section-title">Vos informations</p>
              <p className="section-sub">Quelques données pour identifier votre candidature</p>

              <div className="field-group">
                <input
                  className="inp" type="text" placeholder="Nom complet *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <input
                  className="inp" type="email" placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <input
                  className="inp" type="tel" placeholder="Téléphone (optionnel)"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="divider" style={{ marginBottom: 20 }} />

              {/* CV Upload */}
              <div>
                <div className="upload-header">
                  <span className="upload-label">📎 CV au format PDF *</span>
                  {!resumeBlob && (
                    <span className="upload-link" onClick={() => router.push(`/condidat/postuler/${postId}/resume-builder`)}>
                      ✏️ Créer mon CV
                    </span>
                  )}
                </div>

                {resumeBlob ? (
                  <div className="upload-success">
                    <span className="upload-success-text">
                      <span style={{ fontSize: 20 }}>✅</span> CV créé détecté
                    </span>
                    <span className="upload-success-change"
                      onClick={() => { setResumeBlob(null); setFile(null); localStorage.removeItem('resumeBlobUrl'); }}>
                      Changer
                    </span>
                  </div>
                ) : (
                  <label className="upload-zone">
                    <input type="file" accept=".pdf,application/pdf" style={{ display: 'none' }}
                      onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    {file ? (
                      <span className="upload-zone-selected">📄 {file.name}</span>
                    ) : (
                      <>
                        <span className="upload-zone-icon">☁</span>
                        <span className="upload-zone-text">Glissez votre PDF ou cliquez pour parcourir</span>
                      </>
                    )}
                  </label>
                )}
              </div>

              <button
                className="btn-primary"
                onClick={handleParseCV}
                disabled={!formData.name || !formData.email || (!file && !resumeBlob)}
              >
                Analyser mon CV →
              </button>
            </div>
          )}

          {/* ── PARSING ── */}
          {step === 'parsing' && (
            <div className="loader-wrap">
              <div className="loader-ring">
                <div className="loader-ring-track loader-ring-teal" />
                <div className="loader-ring-track loader-ring-spin" />
                <div className="loader-icon">📄</div>
              </div>
              <p className="loader-msg">{loadingMsg}</p>
              <p className="loader-sub">Extraction du texte, compétences et expériences…</p>
            </div>
          )}

          {/* ── CONFIRM ── */}
          {step === 'confirm' && editedCV && (
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <p className="section-title">Vérifiez votre profil</p>
              <p className="section-sub">Corrigez si l'IA a mal extrait une information</p>

              {/* Stats */}
              <div className="stats-grid">
                <div className="stat-tile">
                  <div className="stat-tile-label">Expérience</div>
                  <div className="stat-tile-value">{editedCV.years_experience} ans</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile-label">Formation</div>
                  <div className="stat-tile-value">{editedCV.years_education} ans</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile-label">Niveau</div>
                  <div className="stat-tile-value" style={{ fontSize: 13 }}>{editedCV.level}</div>
                </div>
              </div>

              {/* Years editable */}
              <div className="form-row">
                <div className="form-field">
                  <label className="field-label">Années d&apos;expérience</label>
                  <input className="inp" type="number" step="0.5" min="0"
                    value={editedCV.years_experience}
                    onChange={(e) => setEditedCV({ ...editedCV, years_experience: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="form-field">
                  <label className="field-label">Années de formation</label>
                  <input className="inp" type="number" step="0.5" min="0"
                    value={editedCV.years_education}
                    onChange={(e) => setEditedCV({ ...editedCV, years_education: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="form-field">
                <label className="field-label">Niveau</label>
                <select className="inp" value={editedCV.level}
                  onChange={(e) => setEditedCV({ ...editedCV, level: e.target.value })}>
                  <option>Junior</option>
                  <option>Intermédiaire</option>
                  <option>Senior/Expert</option>
                </select>
              </div>

              {/* Skills */}
              <div className="form-field">
                <label className="field-label">Compétences détectées ({editedCV.skills.all.length})</label>
                <div className="skills-wrap">
                  {editedCV.skills.all.map((s) => (
                    <span key={s} className="skill-chip">
                      {s}
                      <button className="skill-chip-remove"
                        onClick={() => setEditedCV({ ...editedCV, skills: { ...editedCV.skills, all: editedCV.skills.all.filter((x) => x !== s) } })}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div className="form-field">
                <label className="field-label">Expérience (extrait)</label>
                <textarea className="inp" rows={4}
                  value={editedCV.experience}
                  onChange={(e) => setEditedCV({ ...editedCV, experience: e.target.value })} />
              </div>

              {/* Education */}
              <div className="form-field">
                <label className="field-label">Formation (extrait)</label>
                <textarea className="inp" rows={3}
                  value={editedCV.education}
                  onChange={(e) => setEditedCV({ ...editedCV, education: e.target.value })} />
              </div>

              <div className="btn-row" style={{ marginTop: 8 }}>
                <button className="btn-secondary" onClick={() => setStep('form')}>← Retour</button>
                <button className="btn-primary" style={{ flex: 1, marginTop: 0 }} onClick={handleConfirmAndScore}>
                  Confirmer &amp; Envoyer →
                </button>
              </div>
            </div>
          )}

          {/* ── SCORING ── */}
          {step === 'scoring' && (
            <div className="loader-wrap">
              <div className="loader-ring">
                <div className="loader-ring-track loader-ring-amber" />
                <div className="loader-ring-track loader-ring-amber-spin" />
                <div className="loader-icon">⚡</div>
              </div>
              <p className="loader-msg">{loadingMsg}</p>
              <p className="loader-sub">Analyse sémantique et matching des compétences…</p>
            </div>
          )}

          {/* ── DONE ── */}
          {step === 'done' && scoreResult && (
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Score hero */}
              <div className="score-hero">
                <p className="score-hero-label">Score de compatibilité</p>
                <p className={`score-hero-number ${scoreResult.final_score < 75 && scoreResult.final_score >= 50 ? 'score-hero-number-amber' : scoreResult.final_score < 50 ? 'score-hero-number-rose' : ''}`}>
                  {scoreResult.final_score.toFixed(0)}
                  <span style={{ fontSize: 32, fontWeight: 600 }}>%</span>
                </p>
                <p className="score-hero-badge">
                  {scoreResult.final_score >= 75 ? '🎉 Excellent profil pour ce poste' : scoreResult.final_score >= 50 ? '👍 Bon potentiel' : '💪 Profil partiel'}
                </p>
              </div>

              {/* Breakdown */}
              <div>
                <p className="score-breakdown-title">Détail des scores</p>
                <div className="score-cards-grid">
                  <ScoreCard label="Expérience (35%)" score={scoreResult.breakdown.experience.score}
                    detail={`${scoreResult.breakdown.experience.cv_years} ans / ${scoreResult.breakdown.experience.required_years} ans requis`} />
                  <ScoreCard label="Formation (20%)" score={scoreResult.breakdown.education.score}
                    detail={`${scoreResult.breakdown.education.cv_years} ans / ${scoreResult.breakdown.education.required_years} ans requis`} />
                  <ScoreCard label="Compétences (30%)" score={scoreResult.breakdown.skills.score}
                    detail={`${scoreResult.breakdown.skills.required_matched?.length ?? 0}/${scoreResult.breakdown.skills.required_total ?? 0} skills requis`} />
                  <ScoreCard label="Niveau (15%)" score={scoreResult.breakdown.level.score}
                    detail={`${scoreResult.breakdown.level.candidate_level} / requis : ${scoreResult.breakdown.level.required_level}`} />
                </div>
              </div>

              {/* Matched skills */}
              {(scoreResult.breakdown.skills.required_matched?.length ?? 0) > 0 && (
                <div>
                  <p className="score-breakdown-title">Skills matchés</p>
                  <div className="matched-wrap">
                    {scoreResult.breakdown.skills.required_matched!.map((s) => (
                      <span key={s} className="skill-badge-matched">✓ {s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* CV link */}
              {cvLink && (
                <a className="cv-link" href={cvLink} target="_blank" rel="noopener noreferrer">
                  📄 Voir le CV uploadé
                </a>
              )}

              {/* Success */}
              <div className="success-banner">
                <p className="success-title">✅ Candidature envoyée avec succès !</p>
                <p className="success-sub">Vous recevrez une réponse par email sous peu</p>
              </div>

              <button className="btn-secondary" style={{ width: '100%' }} onClick={() => router.push('/')}>
                ← Retour à l&apos;accueil
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}