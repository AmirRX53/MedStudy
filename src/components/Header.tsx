import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { readStoredData, replaceStoredData, clearStoredData, validateStoredData } from '../lib/storage';
import { seedDemoData } from '../lib/seedData';
import type { AccentColor } from '../types';

const navItems = [
  { key: 'home' as const, path: '/' },
  { key: 'subjects' as const, path: '/subjects' },
  { key: 'diseases' as const, path: '/diseases' },
  { key: 'flashcards' as const, path: '/flashcards' },
  { key: 'practice' as const, path: '/practice' },
  { key: 'statistics' as const, path: '/statistics' },
];

const accentColors: AccentColor[] = ['blue', 'green', 'purple', 'red', 'orange', 'teal'];
const accentColorHex: Record<AccentColor, string> = {
  blue: '#3b82f6',
  green: '#10b981',
  purple: '#8b5cf6',
  red: '#ef4444',
  orange: '#f97316',
  teal: '#14b8a6',
};

export function Header() {
  const { t, language, setLanguage } = useLanguage();
  const accentLabels: Record<AccentColor, string> = {
    blue: t('accentBlue'),
    green: t('accentGreen'),
    purple: t('accentPurple'),
    red: t('accentRed'),
    orange: t('accentOrange'),
    teal: t('accentTeal'),
  };
  const { theme, accentColor, setTheme, setAccentColor } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-left">
          <span className="app-logo">🏥</span>
          <h1 className="app-title">{t('appTitle')}</h1>
        </div>

        <nav className="header-nav">
          {navItems.map(item => (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end={item.path === '/'}
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>

        <div className="header-right">
          <button
            className="lang-toggle"
            onClick={() => setLanguage(language === 'en' ? 'fa' : 'en')}
            title={language === 'en' ? t('switchToPersian') : t('switchToEnglish')}
          >
            {language === 'en' ? 'فا' : 'EN'}
          </button>

          <div className="settings-wrapper" ref={settingsRef}>
            <button
              className="settings-btn"
              onClick={() => setSettingsOpen(!settingsOpen)}
              title={t('settings')}
            >
              ⚙️
            </button>

            {settingsOpen && (
              <div className="settings-dropdown">
                <div className="settings-section">
                  <label className="settings-label">{t('theme')}</label>
                  <div className="settings-row">
                    <button
                      className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                      onClick={() => setTheme('light')}
                    >
                      ☀️ {t('light')}
                    </button>
                    <button
                      className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                      onClick={() => setTheme('dark')}
                    >
                      🌙 {t('dark')}
                    </button>
                  </div>
                </div>

                <div className="settings-section">
                  <label className="settings-label">{t('accentColor')}</label>
                  <div className="settings-row accent-row">
                    {accentColors.map(color => (
                      <button
                        key={color}
                        className={`accent-btn ${accentColor === color ? 'active' : ''}`}
                        style={{ backgroundColor: accentColorHex[color] }}
                        onClick={() => setAccentColor(color)}
                        title={accentLabels[color]}
                      />
                    ))}
                  </div>
                </div>

                <div className="settings-section">
                  <label className="settings-label">{t('language')}</label>
                  <div className="settings-row">
                    <button
                      className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                      onClick={() => setLanguage('en')}
                    >
                      🇬🇧 {t('english')}
                    </button>
                    <button
                      className={`lang-btn ${language === 'fa' ? 'active' : ''}`}
                      onClick={() => setLanguage('fa')}
                    >
                      🇮🇷 {t('persian')}
                    </button>
                  </div>
                </div>

                {/* ─── Data Management ──────────────────────────────────── */}
                <div className="settings-section settings-data-section">
                  <label className="settings-label">{t('dataManagement')}</label>
                  <div className="settings-data-actions">
                    <button
                      className="btn btn-ghost btn-sm settings-data-btn"
                      onClick={() => {
                        // Export all data
                        const data = readStoredData();
                        data['medstudy-theme'] = theme;
                        data['medstudy-accent'] = accentColor;
                        data['medstudy-lang'] = language;

                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `medstudy-backup-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      📤 {t('exportData')}
                    </button>

                    <button
                      className="btn btn-ghost btn-sm settings-data-btn"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = async (ev) => {
                            try {
                              const data: unknown = JSON.parse(ev.target?.result as string);
                              if (!validateStoredData(data)) throw new Error('Invalid backup structure');
                              await replaceStoredData(data);
                              alert(t('dataImported'));
                              window.location.reload();
                            } catch {
                              alert(t('importError'));
                            }
                          };
                          reader.readAsText(file);
                        };
                        input.click();
                      }}
                    >
                      📥 {t('importData')}
                    </button>

                    <button
                      className="btn btn-ghost btn-sm settings-data-btn settings-data-danger"
                      onClick={() => {
                        if (!confirm(t('confirmDeleteAll'))) return;
                        void clearStoredData().then(() => window.location.reload()).catch(() => alert(t('importError')));
                      }}
                    >
                      🗑️ {t('deleteAllData')}
                    </button>

                    <button
                      className="btn btn-ghost btn-sm settings-data-btn"
                      onClick={() => {
                        if (!confirm(t('confirmLoadSample'))) return;
                        seedDemoData();
                        window.location.reload();
                      }}
                    >
                      🧪 {t('loadSampleData')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
