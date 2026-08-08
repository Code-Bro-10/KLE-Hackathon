import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, ArrowRight, ShieldCheck, Activity, Zap, Clock, Sparkles, Video, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Hero() {
  const { t } = useTranslation();
  const [activeModule, setActiveModule] = useState<number>(0);

  // Load Google Font Instrument Serif dynamically
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const modulesInfo = [
    {
      id: 0,
      title: 'Gemini AI Vision',
      desc: 'Instant wound and injury scanner using advanced multimodal models for quick field guidance.',
      icon: Sparkles,
      color: 'border-emergency/30 text-emergency bg-emergency/5'
    },
    {
      id: 1,
      title: 'Voice Pathology',
      desc: 'Analyze voice recordings for cardiac and respiratory symptoms with clinical indicators.',
      icon: Activity,
      color: 'border-medical/30 text-medical bg-medical/5'
    },
    {
      id: 2,
      title: 'Meet Spaces',
      desc: 'Launch real-time encrypted physician video consultation spaces in one click.',
      icon: Video,
      color: 'border-indigo-400/30 text-indigo-400 bg-indigo-500/5'
    }
  ];

  return (
    <section className="relative min-h-screen flex flex-col justify-between overflow-hidden pt-32 pb-16 velorah-hero dark:bg-[hsl(201,100%,13%)] select-none">
      
      {/* Liquid Glass and Scoped CSS Styles */}
      <style>{`
        .velorah-hero {
          font-family: 'Inter', sans-serif;
        }

        .liquid-glass-btn {
          background: rgba(255, 255, 255, 0.02);
          background-blend-mode: luminosity;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: none;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15);
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .liquid-glass-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.4px;
          background: linear-gradient(180deg,
            rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%,
            rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
            rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .liquid-glass-card {
          background: rgba(255, 255, 255, 0.015);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05), 
                      0 10px 40px rgba(0, 0, 0, 0.2);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .liquid-glass-card:hover, .liquid-glass-card.active {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15), 
                      0 15px 50px rgba(0, 0, 0, 0.3);
          transform: translateY(-4px) scale(1.02);
        }

        @keyframes fade-rise {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-rise { 
          animation: fade-rise 0.8s ease-out both; 
        }
        
        .animate-fade-rise-delay { 
          animation: fade-rise 0.8s ease-out 0.2s both; 
        }
        
        .animate-fade-rise-delay-2 { 
          animation: fade-rise 0.8s ease-out 0.4s both; 
        }
      `}</style>

      {/* Fullscreen Cinematic Looping Background Video */}
      <video 
        className="absolute inset-0 w-full h-full object-cover z-0" 
        autoPlay 
        loop 
        muted 
        playsInline 
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
      />

      {/* Dark Subtle Ambient Overlay to preserve text readability */}
      <div className="absolute inset-0 bg-black/35 z-[1]" />

      <div className="container-main relative z-10 text-center flex-1 flex flex-col items-center justify-center px-6 max-w-7xl mx-auto">
        {/* Urgent Live Broadcast Pulse Dot */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-btn mb-8 animate-fade-rise">
          <span className="w-2 h-2 rounded-full bg-emergency live-dot" />
          <span className="text-xs font-bold tracking-wider text-white uppercase">{t('heroSub')}</span>
        </div>

        {/* Cinematic H1 Display Text */}
        <h1 
          className="text-5xl sm:text-7xl md:text-8xl text-white font-normal tracking-[-2.46px] leading-[0.95] max-w-5xl animate-fade-rise select-none mb-6"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Where <em className="not-italic text-[hsl(240,4%,75%)]">intelligence</em> meets <em className="not-italic text-[hsl(240,4%,75%)]">the heartbeat.</em>
        </h1>

        {/* Supporting Subtext */}
        <p className="text-[hsl(240,4%,80%)] text-sm sm:text-base max-w-2xl mt-4 leading-relaxed animate-fade-rise-delay font-medium">
          {t('heroDesc')}
        </p>

        {/* Hero Interactive CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-10 animate-fade-rise-delay-2 w-full max-w-lg">
          <Link
            to="/emergency"
            className="w-full sm:w-auto h-14 px-8 rounded-full bg-emergency text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emergency/25 hover:scale-[1.03] transition-transform duration-300 cursor-pointer"
          >
            <Phone className="w-4.5 h-4.5 animate-pulse" strokeWidth={2.5} />
            {t('startTriage')}
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto h-14 px-8 rounded-full liquid-glass-btn text-white font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.03] transition-transform duration-300 cursor-pointer"
          >
            {t('hospitalDashboard')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Interactive Glass Cards Overlay */}
      <div className="relative z-10 container-main max-w-5xl mx-auto px-6 mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-rise-delay-2">
        {modulesInfo.map((mod) => {
          const Icon = mod.icon;
          const isActive = activeModule === mod.id;
          return (
            <div
              key={mod.id}
              onMouseEnter={() => setActiveModule(mod.id)}
              className={`liquid-glass-card rounded-2xl p-5 cursor-pointer text-left ${isActive ? 'active' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${mod.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {isActive && (
                  <span className="text-[8px] font-extrabold uppercase bg-white/20 text-white tracking-widest px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">{mod.title}</h3>
              <p className="text-[11px] text-[hsl(240,4%,75%)] leading-relaxed">{mod.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Bottom overlay space */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-[2]" />
    </section>
  );
}
