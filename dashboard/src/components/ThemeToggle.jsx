import React, { useEffect, useState } from 'react';

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState (
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    return (

        <button onClick={() => setIsDark(!isDark)}
        className="p-3 rounded-xl bg-ctp-light-surface0 dark:bg-ctp-dark-surface0 border-2 border-ctp-light-surface1 dark:border-ctp-dark-surface1 hover:scale-110 transition-all duration-300 shadow-lg group"
        aria-label="Toggle Theme">
            {isDark ? (

                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-ctp-dark-yellow group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>

            ) : (
                
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-ctp-light-yellow group-hover:rotate-90 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>

            )}
        </button>
    );
}
