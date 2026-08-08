import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Phone, LayoutDashboard, Info, ShieldCheck, Globe, Map, Video, Sun, Moon, Store, Truck, UserCheck } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useTranslation } from 'react-i18next';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useStore();
  const { t } = useTranslation();

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('resq-theme', 'dark');
      setThemeState('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('resq-theme', 'light');
      setThemeState('light');
    }
  };

  const links = [
    { to: '/', label: t('home'), icon: Activity },
    { to: '/map', label: t('map'), icon: Map },
    { to: '/consult', label: t('consult'), icon: Video },
    { to: '/pharmacy', label: t('pharmacy'), icon: Store },
    { to: '/rentals', label: t('rentals'), icon: Truck },
    { to: '/login', label: 'Login / Portal', icon: UserCheck },
    { to: '/about', label: t('about'), icon: Info },
    { to: '/safety', label: t('safety'), icon: ShieldCheck },
    { to: '/admin-dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/dashboard', label: t('hospital'), icon: LayoutDashboard },
  ];

  const userRole = localStorage.getItem('resq-active-user-role') || 'user';
  const visibleLinks = links.filter(link => {
    // Hide admin dashboard and hospital capacity portals for non-admin patient accounts
    if (userRole === 'user') {
      return !['/admin-dashboard', '/dashboard'].includes(link.to);
    }
    return true;
  });

  return (
    <nav className="nav-pill flex items-center gap-1">
      <Link to="/" className="flex items-center gap-2 pr-4 mr-1 border-r border-border/60">
        <div className="w-9 h-9 rounded-full bg-emergency flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-semibold text-text-primary text-lg tracking-tight">ResQ</span>
      </Link>

      <div className="hidden md:flex items-center gap-1 mr-2">
        {visibleLinks.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                active ? 'bg-text-primary text-background' : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Language Selector Pill */}
      <div className="relative flex items-center gap-1 bg-surface px-3 py-1 rounded-full border border-border/40 hover:bg-surface-blue transition-colors mr-1 h-10">
        <Globe className="w-3.5 h-3.5 text-text-secondary" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-transparent text-text-secondary text-[11px] font-bold focus:outline-none cursor-pointer pr-1"
        >
          <option value="en">English (EN)</option>
          <option value="hi">हिंदी (HI)</option>
          <option value="mr">मराठी (MR)</option>
          <option value="kn">ಕನ್ನಡ (KN)</option>
          <option value="ta">தமிழ் (TA)</option>
          <option value="te">తెలుగు (TE)</option>
          <option value="ml">മലയാളം (ML)</option>
          <option value="gu">ગુજરાતી (GU)</option>
          <option value="bn">বাংলা (BN)</option>
          <option value="pa">ਪੰਜਾਬੀ (PA)</option>
        </select>
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="w-10 h-10 rounded-full bg-surface border border-border/40 flex items-center justify-center text-text-secondary hover:bg-surface-blue hover:text-text-primary transition-colors mr-1"
        title="Toggle dark/light mode"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
      </button>

      <button
        onClick={() => navigate('/emergency')}
        className="ml-1 md:ml-2 h-12 px-5 rounded-full bg-emergency text-white font-semibold text-sm flex items-center gap-2 shadow-emergency hover:scale-105 transition-transform"
      >
        <Phone className="w-4 h-4" strokeWidth={2.5} />
        <span className="hidden sm:inline">{t('emergency')}</span>
      </button>
    </nav>
  );
}
