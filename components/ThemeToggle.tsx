'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Éviter les erreurs d'hydratation
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative p-1 w-10 h-10 rounded-full bg-card border border-card hover:bg-hover transition-all duration-300 flex items-center justify-center shadow-custom"
      title={isDark ? 'Basculer en mode clair' : 'Basculer en mode sombre'}
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11,4V2c0-0.55,0.45-1,1-1s1,0.45,1,1v2c0,0.55-0.45,1-1,1S11,4.55,11,4z M18.36,7.05l1.41-1.42c0.39-0.39,0.39-1.02,0-1.41 c-0.39-0.39-1.02-0.39-1.41,0l-1.41,1.42c-0.39,0.39-0.39,1.02,0,1.41C17.34,7.44,17.97,7.44,18.36,7.05z M22,11h-2 c-0.55,0-1,0.45-1,1s0.45,1,1,1h2c0.55,0,1-0.45,1-1S22.55,11,22,11z M12,19c-0.55,0-1,0.45-1,1v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2 C13,19.45,12.55,19,12,19z M5.64,7.05L4.22,5.64c-0.39-0.39-0.39-1.03,0-1.41s1.03-0.39,1.41,0l1.41,1.41 c0.39,0.39,0.39,1.03,0,1.41S6.02,7.44,5.64,7.05z M16.95,16.95c-0.39,0.39-0.39,1.03,0,1.41l1.41,1.41c0.39,0.39,1.03,0.39,1.41,0 c0.39-0.39,0.39-1.03,0-1.41l-1.41-1.41C17.98,16.56,17.34,16.56,16.95,16.95z M2,13h2c0.55,0,1-0.45,1-1s-0.45-1-1-1H2 c-0.55,0-1,0.45-1,1S1.45,13,2,13z M5.64,19.78l1.41-1.41c0.39-0.39,0.39-1.03,0-1.41s-1.03-0.39-1.41,0l-1.41,1.41 c-0.39,0.39-0.39,1.03,0,1.41C4.61,20.17,5.25,20.17,5.64,19.78z M12,6c-3.31,0-6,2.69-6,6s2.69,6,6,6s6-2.69,6-6S15.31,6,12,6z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
          <path d="M283.211 512c78.962 0 151.079-35.925 198.857-94.792 7.068-8.708-.639-21.43-11.562-19.35-124.203 23.654-238.262-71.576-238.262-196.954 0-72.222 38.662-138.635 101.498-174.394 9.686-5.512 7.25-20.197-3.756-22.23A258.156 258.156 0 0 0 283.211 0c-141.309 0-256 114.511-256 256 0 141.309 114.511 256 256 256z" />
        </svg>
      )}
    </button>
  );
}