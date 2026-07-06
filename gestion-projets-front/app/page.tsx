'use client';
import Header from './component/header';
import Link from 'next/link';
import {
  ArrowRight,
  Users,
  Target,
  Mail,
  Phone,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Rocket,
  Brain,
  Workflow,
  ChevronRight,
  Activity,
  Database,
  Globe,
} from 'lucide-react';

export default function Home() {
  return (
    <div
      className="relative min-h-screen bg-white text-slate-800 overflow-hidden"
      style={{ fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}
    >

      {/* ── BACKGROUND ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Soft teal top-right radial */}
        <div
          className="absolute -top-40 -right-40 w-[800px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.10) 0%, rgba(6,182,212,0.05) 45%, transparent 70%)' }}
        />
        {/* Soft blue bottom-left */}
        <div
          className="absolute -bottom-40 -left-40 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)' }}
        />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(14,165,233,0.12) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #0ea5e9 30%, #14b8a6 65%, transparent 100%)' }}
        />
      </div>

      {/* ── HEADER ── */}
      <Header />

      <main className="relative z-10">

        {/* ══════════════════════════════════
            HERO
        ══════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-36 pb-28">

          {/* Badge */}
          <div className="flex justify-center mb-10">
            <div
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs font-semibold tracking-wider uppercase"
              style={{
                borderColor: 'rgba(14,165,233,0.3)',
                background: 'rgba(14,165,233,0.07)',
                color: '#0284c7',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Plateforme IA de nouvelle génération
            </div>
          </div>

          {/* Headline */}
          <div className="text-center mb-8">
            <h1
              style={{
                fontSize: 'clamp(2.8rem, 6.5vw, 5.5rem)',
                fontWeight: 800,
                lineHeight: 1.06,
                letterSpacing: '-0.03em',
                fontFamily: "'Bricolage Grotesque', 'DM Sans', system-ui, sans-serif",
              }}
            >
              <span style={{ color: '#0f172a' }}>Pilotez votre</span>
              <br />
              <span
                style={{
                  background: 'linear-gradient(130deg, #0ea5e9 0%, #14b8a6 55%, #06b6d4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                entreprise
              </span>
              <br />
              <span style={{ color: '#0f172a' }}>avec l&apos;IA</span>
            </h1>
          </div>

          <p
            className="text-center text-lg max-w-2xl mx-auto mb-12"
            style={{ color: '#64748b', lineHeight: 1.75 }}
          >
            Centralisez la gestion de projets, les ressources humaines et le marketing
            en une seule plateforme propulsée par l&apos;intelligence artificielle.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/login">
              <button
                className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-sm transition-all duration-300 hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
                  color: 'white',
                  boxShadow: '0 4px 24px rgba(14,165,233,0.25)',
                }}
              >
                <Rocket className="w-4 h-4" />
                Accéder à la plateforme
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
            <Link href="/condidat">
              <button
                className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-slate-50"
                style={{
                  border: '1.5px solid rgba(14,165,233,0.3)',
                  color: '#0ea5e9',
                  background: 'white',
                }}
              >
                <Users className="w-4 h-4" />
                Espace Candidat
                <ChevronRight className="w-4 h-4 opacity-60" />
              </button>
            </Link>
          </div>

          {/* Trust indicators — no fake numbers */}
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: <Shield className="w-4 h-4" />, label: 'Données sécurisées' },
              { icon: <Zap className="w-4 h-4" />, label: 'Support 24/7' },
              { icon: <Globe className="w-4 h-4" />, label: 'Disponible partout' },
              { icon: <Activity className="w-4 h-4" />, label: 'Temps réel' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2" style={{ color: '#64748b' }}>
                <span style={{ color: '#0ea5e9' }}>{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════
            FEATURE CARDS
        ══════════════════════════════════ */}
        <section
          className="max-w-7xl mx-auto px-6 lg:px-8 py-20 border-t"
          style={{ borderColor: 'rgba(14,165,233,0.12)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1" style={{ background: 'rgba(14,165,233,0.2)' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#0ea5e9' }}>
              Modules intelligents
            </span>
            <div className="h-px flex-1" style={{ background: 'rgba(14,165,233,0.2)' }} />
          </div>
          <h2
            className="text-center text-4xl font-black mb-3 tracking-tight"
            style={{
              fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
              color: '#0f172a',
            }}
          >
            Une plateforme{' '}
            <span
              style={{
                background: 'linear-gradient(130deg, #0ea5e9, #14b8a6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              complète
            </span>
          </h2>
          <p className="text-center mb-14 text-base" style={{ color: '#94a3b8' }}>
            Tout ce dont vous avez besoin pour gérer votre entreprise efficacement
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <Brain className="w-5 h-5" />,
                title: 'IA & Projets',
                desc: 'Planification intelligente et automatisée de vos projets complexes.',
                accent: '#0ea5e9',
                accentBg: 'rgba(14,165,233,0.07)',
                accentBorder: 'rgba(14,165,233,0.18)',
              },
              {
                icon: <Workflow className="w-5 h-5" />,
                title: 'RH & Talents',
                desc: 'Matching avancé des compétences et gestion des équipes.',
                accent: '#14b8a6',
                accentBg: 'rgba(20,184,166,0.07)',
                accentBorder: 'rgba(20,184,166,0.18)',
              },
              {
                icon: <Target className="w-5 h-5" />,
                title: 'Marketing',
                desc: 'Analyses prédictives et campagnes ciblées en temps réel.',
                accent: '#06b6d4',
                accentBg: 'rgba(6,182,212,0.07)',
                accentBorder: 'rgba(6,182,212,0.18)',
              },
              {
                icon: <BarChart3 className="w-5 h-5" />,
                title: 'Analytiques',
                desc: 'KPIs et tableaux de bord dynamiques en temps réel.',
                accent: '#0284c7',
                accentBg: 'rgba(2,132,199,0.07)',
                accentBorder: 'rgba(2,132,199,0.18)',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg"
                style={{
                  background: 'white',
                  border: '1.5px solid rgba(14,165,233,0.12)',
                  boxShadow: '0 1px 6px rgba(14,165,233,0.06)',
                }}
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at top left, ${f.accentBg}, transparent 70%)` }}
                />
                <div className="relative">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: f.accentBg, border: `1.5px solid ${f.accentBorder}`, color: f.accent }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-base mb-2" style={{ color: '#0f172a' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════
            AVANTAGES
        ══════════════════════════════════ */}
        <section
          className="max-w-7xl mx-auto px-6 lg:px-8 py-20 border-t"
          style={{ borderColor: 'rgba(14,165,233,0.12)' }}
        >
          <div className="grid lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Activity className="w-6 h-6" />,
                title: 'Gestion Budgétaire',
                desc: "Suivez et optimisez vos budgets avec des prévisions précises basées sur vos données historiques et l'IA.",
                accent: '#0ea5e9',
                tag: 'Finances',
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: 'Recrutement Intelligent',
                desc: 'Identifiez les meilleurs talents grâce à des algorithmes de matching avancés adaptés à vos besoins.',
                accent: '#14b8a6',
                tag: 'RH',
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: 'Sécurité des Données',
                desc: 'Vos informations sont protégées avec les plus hauts standards de sécurité et de confidentialité.',
                accent: '#06b6d4',
                tag: 'Sécurité',
              },
            ].map((a, i) => (
              <div
                key={i}
                className="group relative p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{
                  background: 'white',
                  border: '1.5px solid rgba(14,165,233,0.12)',
                  boxShadow: '0 1px 6px rgba(14,165,233,0.05)',
                }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                    style={{
                      background: `${a.accent}12`,
                      color: a.accent,
                      border: `1.5px solid ${a.accent}28`,
                    }}
                  >
                    {a.icon}
                  </div>
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{
                      background: `${a.accent}10`,
                      color: a.accent,
                      border: `1px solid ${a.accent}25`,
                    }}
                  >
                    {a.tag}
                  </span>
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{
                    color: '#0f172a',
                    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                  }}
                >
                  {a.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{a.desc}</p>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold" style={{ color: a.accent }}>
                  En savoir plus <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════
            CONTACT CTA
        ══════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-28">
          <div
            className="relative overflow-hidden rounded-3xl p-14 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(20,184,166,0.08) 50%, rgba(6,182,212,0.05) 100%)',
              border: '1.5px solid rgba(14,165,233,0.2)',
            }}
          >
            {/* Corner decorations */}
            <div
              className="absolute top-0 left-0 w-40 h-40 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)',
                transform: 'translate(-30%, -30%)',
              }}
            />
            <div
              className="absolute bottom-0 right-0 w-48 h-48 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)',
                transform: 'translate(30%, 30%)',
              }}
            />
            <div className="relative z-10">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
                style={{
                  background: 'rgba(14,165,233,0.1)',
                  border: '1px solid rgba(14,165,233,0.25)',
                  color: '#0284c7',
                }}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Support réactif 24/7
              </div>
              <h2
                className="text-4xl font-black mb-4 tracking-tight"
                style={{
                  color: '#0f172a',
                  fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                }}
              >
                Prêt à transformer<br />votre entreprise ?
              </h2>
              <p className="mb-10 max-w-xl mx-auto text-base leading-relaxed" style={{ color: '#64748b' }}>
                Notre équipe est disponible pour répondre à toutes vos questions
                et vous accompagner dans votre transformation digitale.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:mohamedamintrai@gmail.com"
                  className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(14,165,233,0.2)',
                  }}
                >
                  <Mail className="w-4 h-4" />
                  mohamedamintrai@gmail.com
                </a>
                <a
                  href="tel:+21627799518"
                  className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-slate-50"
                  style={{
                    background: 'white',
                    border: '1.5px solid rgba(14,165,233,0.25)',
                    color: '#0ea5e9',
                  }}
                >
                  <Phone className="w-4 h-4" />
                  +216 27 799 518
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer
        className="border-t py-8"
        style={{ borderColor: 'rgba(14,165,233,0.12)', background: '#f8fafc' }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)' }}
            >
              <Database className="w-4 h-4 text-white" />
            </div>
            <span
              className="font-black tracking-tight text-lg"
              style={{
                color: '#0f172a',
                fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
              }}
            >
              DataPilot
            </span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
            © 2026 DataPilot — Réalisé au sein de 3LM Solutions
          </p>
          <div className="flex items-center gap-6">
            {['Confidentialité', 'CGU', 'Contact'].map((l) => (
              <a
                key={l}
                href="#"
                className="text-xs font-medium transition-colors duration-200"
                style={{ color: '#94a3b8' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0ea5e9')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}