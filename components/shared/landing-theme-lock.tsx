'use client';

import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';

/**
 * When the user is on the landing (or any non-/app) route, force light theme
 * so only /app has dark mode. Theme toggle stays only in the app header.
 */
export function LandingThemeLock() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const isApp = pathname?.startsWith('/app');
    if (!isApp && theme !== 'light') {
      setTheme('light');
    }
  }, [pathname, theme, setTheme]);

  return null;
}
