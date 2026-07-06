'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-lg shadow-lg shadow-slate-200/20 py-2'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 transition-all duration-300 group-hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl opacity-10 group-hover:opacity-20 transition-opacity" />
              <Image
                src="/logo.png"
                alt="DataPilot Logo"
                width={48}
                height={48}
                className="object-contain w-full h-full relative z-10"
                priority
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              DataPilot
            </span>
          </Link>

          {/* NAV DESKTOP */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/condidat"
              className="relative group px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2 text-slate-700 group-hover:text-indigo-600">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Offres d'emploi
              </span>
              <span className="absolute inset-0 bg-indigo-50 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300" />
            </Link>

            <Link
              href="/aboutus"
              className="relative group px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300"
            >
              <span className="relative z-10 text-slate-700 group-hover:text-indigo-600">
                À propos
              </span>
              <span className="absolute inset-0 bg-slate-50 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300" />
            </Link>

            <div className="w-px h-6 bg-slate-200 mx-2" />

            <Link
              href="/login"
              className="relative group px-6 py-2.5 rounded-lg overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center gap-2 text-white text-sm font-semibold">
                Se connecter
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          </div>

          {/* BURGER MOBILE */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-5 h-5 relative">
              <span className={`absolute w-5 h-0.5 bg-slate-600 transform transition-all duration-300 ${
                isMobileMenuOpen ? 'rotate-45 top-2.5' : 'top-0'
              }`} />
              <span className={`absolute w-5 h-0.5 bg-slate-600 top-2 transition-all duration-300 ${
                isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
              }`} />
              <span className={`absolute w-5 h-0.5 bg-slate-600 transform transition-all duration-300 ${
                isMobileMenuOpen ? '-rotate-45 top-2.5' : 'top-4'
              }`} />
            </div>
          </button>
        </div>
      </div>

      {/* MENU MOBILE */}
      <div className={`md:hidden transition-all duration-300 ${
        isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      } overflow-hidden`}>
        <div className="px-4 py-4 space-y-1 bg-white/95 backdrop-blur-lg border-t border-slate-100">
          <Link
            href="/condidat"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-indigo-600 bg-indigo-50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            Offres d'emploi
          </Link>
          <Link
            href="/about"
            className="block px-4 py-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            À propos
          </Link>
          <div className="pt-2">
            <Link
              href="/login"
              className="block w-full text-center px-4 py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;