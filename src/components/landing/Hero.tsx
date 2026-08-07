import { Link } from 'react-router-dom';
import { Phone, ArrowRight, ShieldCheck, Activity, Zap, Clock } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero pt-32 pb-20">
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-emergency/10 blur-3xl orb-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-medical/10 blur-3xl orb-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-urgent/5 blur-3xl orb-float" style={{ animationDelay: '0.8s' }} />

      <div className="container-main relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-border mb-8 slide-up">
          <span className="w-2 h-2 rounded-full bg-emergency live-dot" />
          <span className="text-sm font-medium text-text-secondary">AI-Powered Emergency Triage</span>
        </div>

        <h1 className="heading-display mb-6 slide-up" style={{ animationDelay: '0.1s' }}>
          Every second<br />counts in an emergency.
        </h1>

        <p className="body-text max-w-xl mx-auto mb-10 slide-up" style={{ animationDelay: '0.2s' }}>
          Describe what's happening. Get instant AI-guided first aid, urgency assessment,
          and live directions to the nearest available emergency room.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 slide-up" style={{ animationDelay: '0.3s' }}>
          <Link
            to="/emergency"
            className="btn-emergency h-16 px-10 flex items-center gap-3 text-lg"
          >
            <Phone className="w-5 h-5" strokeWidth={2.5} />
            Start Emergency Triage
          </Link>
          <Link
            to="/dashboard"
            className="btn-secondary h-16 px-8 flex items-center gap-2 text-lg"
          >
            Hospital Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-20 slide-up" style={{ animationDelay: '0.4s' }}>
          {[
            { icon: Zap, value: '< 3 sec', label: 'AI Analysis', color: 'text-emergency' },
            { icon: ShieldCheck, value: '14+', label: 'Conditions Covered', color: 'text-medical' },
            { icon: Clock, value: '24/7', label: 'Always Available', color: 'text-urgent' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <stat.icon className={`w-7 h-7 mb-2 ${stat.color}`} strokeWidth={2} />
              <div className="text-2xl font-semibold text-text-primary">{stat.value}</div>
              <div className="text-sm text-text-secondary">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
