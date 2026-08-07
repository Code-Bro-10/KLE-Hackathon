import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Phone, LayoutDashboard, Info, ShieldCheck, Globe, Map } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { translations, type Language } from '@/lib/translations';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useStore();

  const t = translations[language as Language] || translations.en;

  const links = [
    { to: '/', label: t.home, icon: Activity },
    { to: '/map', label: t.map, icon: Map },
    { to: '/about', label: t.about, icon: Info },
    { to: '/safety', label: t.safety, icon: ShieldCheck },
    { to: '/dashboard', label: t.hospital, icon: LayoutDashboard },
  ];

  return (
    <nav className="nav-pill flex items-center gap-1">
      <Link to="/" className="flex items-center gap-2 pr-4 mr-1 border-r border-border/60">
        <div className="w-9 h-9 rounded-full bg-emergency flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-semibold text-text-primary text-lg tracking-tight">ResQ</span>
      </Link>

      <div className="hidden md:flex items-center gap-1 mr-2">
        {links.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                active ? 'bg-text-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface'
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
          <option value="en">EN</option>
          <option value="hi">हिंदी</option>
          <option value="kn">ಕನ್ನಡ</option>
          <option value="es">ESP</option>
        </select>
      </div>

      <button
        onClick={() => navigate('/emergency')}
        className="ml-1 md:ml-2 h-12 px-5 rounded-full bg-emergency text-white font-semibold text-sm flex items-center gap-2 shadow-emergency hover:scale-105 transition-transform"
      >
        <Phone className="w-4 h-4" strokeWidth={2.5} />
        <span className="hidden sm:inline">{t.emergency}</span>
      </button>
    </nav>
  );
}
