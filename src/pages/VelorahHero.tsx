import { useEffect } from 'react';

export default function VelorahHero() {
  // Load Google Fonts dynamically on mount
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="w-full min-h-screen relative overflow-hidden bg-[hsl(201,100%,13%)] flex flex-col justify-between velorah-container select-none">
      
      {/* Dynamic Scoped Stylesheet */}
      <style>{`
        .velorah-container {
          --background: 201 100% 13%;
          --foreground: 0 0% 100%;
          --muted-foreground: 240 4% 66%;
          
          font-family: 'Inter', sans-serif;
          background-color: hsl(201, 100%, 13%);
          color: hsl(0, 0%, 100%);
        }

        .liquid-glass {
          background: rgba(255, 255, 255, 0.01);
          background-blend-mode: luminosity;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: none;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
        }

        .liquid-glass::before {
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

        @keyframes fade-rise {
          from { opacity: 0; transform: translateY(24px); }
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

      {/* Fullscreen Background Loop Video */}
      <video 
        className="absolute inset-0 w-full h-full object-cover z-0" 
        autoPlay 
        loop 
        muted 
        playsInline 
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
      />

      {/* Navigation Bar */}
      <header className="relative z-10 w-full">
        <div className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
          {/* Logo */}
          <div 
            className="text-3xl tracking-tight text-white font-normal select-none"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Velorah<sup className="text-xs">®</sup>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-white transition-colors">
              Home
            </a>
            {['Studio', 'About', 'Journal', 'Reach Us'].map((link) => (
              <a 
                key={link} 
                href="#" 
                className="text-sm font-medium text-[hsl(240,4%,66%)] hover:text-white transition-colors"
              >
                {link}
              </a>
            ))}
          </nav>

          {/* CTA Action */}
          <button className="liquid-glass rounded-full px-6 py-2.5 text-sm text-white font-medium hover:scale-[1.03] transition-transform duration-300 cursor-pointer">
            Begin Journey
          </button>
        </div>
      </header>

      {/* Hero Section Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 max-w-7xl mx-auto py-[90px]">
        {/* H1 Heading */}
        <h1 
          className="text-5xl sm:text-7xl md:text-8xl text-white font-normal tracking-[-2.46px] leading-[0.95] max-w-5xl animate-fade-rise select-none"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Where <em className="not-italic text-[hsl(240,4%,66%)]">dreams</em> rise <em className="not-italic text-[hsl(240,4%,66%)]">through the silence.</em>
        </h1>

        {/* Subtext */}
        <p className="text-[hsl(240,4%,66%)] text-base sm:text-lg max-w-2xl mt-8 leading-relaxed animate-fade-rise-delay font-normal">
          We're designing tools for deep thinkers, bold creators, and quiet rebels. Amid the chaos, we build digital spaces for sharp focus and inspired work.
        </p>

        {/* Hero CTA Button */}
        <button className="liquid-glass rounded-full px-14 py-5 text-base text-white font-medium mt-12 hover:scale-[1.03] transition-transform duration-300 animate-fade-rise-delay-2 cursor-pointer">
          Begin Journey
        </button>
      </main>

      {/* Scoped footer spacing to match single-page centering */}
      <footer className="relative z-10 py-6 text-center text-[10px] text-[hsl(240,4%,40%)] select-none">
        © {new Date().getFullYear()} Velorah Studio. All rights reserved.
      </footer>
    </div>
  );
}
