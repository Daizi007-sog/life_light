'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDailyBackground } from '@/lib/useDailyBackground';
import { DailyBackgroundContext } from '@/lib/DailyBackgroundContext';

const BRAND = '#000000';
const NAV_ITEMS = [
  { path: '/home', label: '首页', icon: 'book' },
  { path: '/records', label: '记录', icon: 'list' },
  { path: '/prayer', label: '祷告', icon: 'star' },
  { path: '/profile', label: '我的', icon: 'person' },
];

function NavIcon({ icon, active }) {
  const color = BRAND;
  const opacity = active ? 1 : 0.6;
  const size = 24;
  if (icon === 'book') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity }}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    );
  }
  if (icon === 'list') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity }}>
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    );
  }
  if (icon === 'star') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity }}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }
  if (icon === 'person') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity }}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }
  return null;
}

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const { url: bgUrl, refresh, flashing } = useDailyBackground();
  const isHome = pathname === '/home';

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: '#030424',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isHome && bgUrl && !flashing && (
        <div
          key={bgUrl}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
      {isHome && bgUrl && !flashing && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            background: 'linear-gradient(to top, rgba(3,4,36,0.95) 0%, rgba(3,4,36,0.5) 40%, rgba(3,4,36,0) 70%)',
          }}
        />
      )}
      {(!isHome || !bgUrl || flashing) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60%',
            background: 'radial-gradient(circle at 50% -20%, #1a1a3a 0%, #030424 100%)',
            zIndex: 0,
          }}
        />
      )}
      <DailyBackgroundContext.Provider value={{ refresh }}>
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </DailyBackgroundContext.Provider>
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'max(64px, calc(64px + env(safe-area-inset-bottom)))',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingBottom: 'env(safe-area-inset-bottom)',
          zIndex: 100,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '8px 12px',
                color: BRAND,
                opacity: active ? 1 : 0.4,
                transition: 'opacity 0.2s',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <NavIcon icon={item.icon} active={active} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, fontFamily: '"PingFang SC", sans-serif' }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
