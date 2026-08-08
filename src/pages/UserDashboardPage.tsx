import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Activity, Map, Video, PhoneCall, Store, Truck, 
  LogOut, User, Sparkles, Clock, MapPin, HeartPulse
} from 'lucide-react';
import NavigationBar from '@/components/Navigation';

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('resq-active-user-name') || 'Guest Patient';
  const userEmail = localStorage.getItem('resq-active-user-email') || '';

  const handleLogout = () => {
    localStorage.removeItem('resq-active-user-name');
    localStorage.removeItem('resq-active-user-email');
    localStorage.removeItem('resq-active-user-role');
    navigate('/');
  };

  const services = [
    {
      title: 'Medical Equipment For Rent',
      desc: 'Rent short-term care equipment: oxygen concentrators, hospital beds, and wheelchairs nearby.',
      icon: Truck,
      to: '/rentals',
      color: 'bg-cyan-50 text-cyan-600 border-cyan-100 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-900/30',
      badge: 'Equipment Leases'
    },
    {
      title: 'Efficient Ambulance Booking',
      desc: 'Dispatch nearest medical responders and access immediate SOS call dispatcher commands.',
      icon: Truck,
      to: '/ambulance',
      color: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
      badge: 'Emergency Booking'
    },
    {
      title: 'Online Medicine Support',
      desc: 'Discover pharmacy stock levels, check pricing, and order critical medicines with live delivery tracking.',
      icon: Store,
      to: '/pharmacy',
      color: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
      badge: 'Online Pharmacy'
    },
    {
      title: 'Video Consultation',
      desc: 'Send requests to certified medical specialists and get Google Meet / Jitsi codes instantly.',
      icon: Video,
      to: '/consult',
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30',
      badge: 'Telehealth'
    },
    {
      title: 'Nearby Hospitals',
      desc: 'Locate trauma care centers and hospitals within 2km, 5km, 10km, or 20km search radius.',
      icon: Map,
      to: '/map',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
      badge: 'Trauma Locator'
    },
    {
      title: 'AI Health Assistant',
      desc: 'Symptom guidance, first aid information, and multimodal injury image analysis via Gemini.',
      icon: Sparkles,
      to: '/emergency',
      color: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
      badge: 'Gemini AI'
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 flex flex-col justify-between">
      <NavigationBar />

      <div className="container-main max-w-5xl w-full mx-auto px-6 py-6 flex-1">
        
        {/* Welcome Banner */}
        <div className="card p-6 md:p-8 border border-border shadow-card mb-8 relative overflow-hidden bg-gradient-to-r from-surface-blue/20 to-transparent">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-medical/5 blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-medical-soft text-medical flex items-center justify-center border border-medical/10">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Welcome Back, {userName}!</h1>
                <p className="text-xs text-text-secondary mt-1">{userEmail || 'Active ResQ Patient Portal Profile'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn-secondary h-10 px-4 rounded-full flex items-center gap-1.5 text-xs text-emergency hover:bg-emergency-soft/20 border border-emergency/10 self-start md:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          </div>
        </div>

        {/* Services Sorted Grid */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-text-primary mb-1">Your Patient Services</h2>
          <p className="text-xs text-text-secondary mb-6">Select a category below to access coordinates routing, consultations, and AI diagnostics.</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((srv, idx) => {
              const Icon = srv.icon;
              return (
                <motion.div
                  key={srv.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  onClick={() => navigate(srv.to)}
                  className="card p-6 border border-border hover:shadow-card hover:border-medical/40 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${srv.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase bg-surface text-text-secondary border border-border/60">
                        {srv.badge}
                      </span>
                    </div>
                    
                    <h3 className="text-base font-bold text-text-primary mb-2 group-hover:text-medical transition-colors">
                      {srv.title}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed mb-4">
                      {srv.desc}
                    </p>
                  </div>
                  
                  <div className="text-[10px] font-bold text-medical flex items-center gap-1 mt-2">
                    Open Service Console &rarr;
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
