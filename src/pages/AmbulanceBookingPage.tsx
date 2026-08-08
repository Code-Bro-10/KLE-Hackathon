import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, Truck, MapPin, Compass, ShieldAlert, HeartPulse, Clock, Activity
} from 'lucide-react';
import NavigationBar from '@/components/Navigation';
import { supabase } from '@/lib/supabase';

// Helper to compute distance in km
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fallback baseline mock ambulance crews
const MOCK_AMBULANCES = [
  { id: 'amb-1', driver_name: 'Amit Deshpande', phone: '+918312473777', latitude: 15.8520, longitude: 74.5030, type: 'als', status: 'available', hospital_name: 'KLES Prabhakar Kore Hospital' },
  { id: 'amb-2', driver_name: 'Suhas Kulkarni', phone: '+919988776655', latitude: 15.8610, longitude: 74.5090, type: 'icu', status: 'available', hospital_name: 'BIMS Institute' },
  { id: 'amb-3', driver_name: 'Vinayak Patil', phone: '+919448112233', latitude: 15.8420, longitude: 74.4980, type: 'bls', status: 'available', hospital_name: 'Lakeview Goaves Hospital' }
];

export default function AmbulanceBookingPage() {
  const [ambulances, setAmbulances] = useState<any[]>(MOCK_AMBULANCES);
  const [usingFallback, setUsingFallback] = useState(false);

  // Retrieve user GPS coordinates saved during login/signup
  const userLat = parseFloat(localStorage.getItem('resq-user-latitude') || '15.8497');
  const userLng = parseFloat(localStorage.getItem('resq-user-longitude') || '74.4977');
  const userCity = localStorage.getItem('resq-user-city') || 'Belgaum';
  const userState = localStorage.getItem('resq-user-state') || 'Karnataka';

  const loadAmbulances = async () => {
    try {
      const { data, error } = await supabase.from('ambulances').select('*');
      if (!error && data && data.length > 0) {
        setAmbulances(data);
        setUsingFallback(false);
      } else {
        setUsingFallback(true);
      }
    } catch (err) {
      console.warn('Database error, using fallback:', err);
      setUsingFallback(true);
    }
  };

  useEffect(() => {
    loadAmbulances();
  }, []);

  // Compute distances and sort by nearest
  const sortedAmbulances = useMemo(() => {
    return ambulances.map((amb) => {
      const distance = getHaversineDistance(userLat, userLng, amb.latitude, amb.longitude);
      // Average ETA: 3 minutes per KM + base 3 minutes wait time
      const eta = Math.ceil(distance * 3 + 3);

      return {
        ...amb,
        distance: parseFloat(distance.toFixed(1)),
        eta
      };
    }).sort((a, b) => a.distance - b.distance);
  }, [ambulances, userLat, userLng]);

  const nearestAmbulance = sortedAmbulances[0] || null;

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 flex flex-col justify-between">
      <NavigationBar />

      <div className="container-main max-w-2xl w-full mx-auto px-6 flex-1 py-4">
        
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 mb-4">
            <HeartPulse className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-semibold">Emergency Dispatch Portal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            Efficient Ambulance Booking
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Dispatching nearest medical crews using active GPS: <span className="font-bold text-text-primary">{userLat.toFixed(4)}, {userLng.toFixed(4)} ({userCity}, {userState})</span>
          </p>
        </div>

        {/* SOS Action Card */}
        <div className="card p-6 md:p-8 border border-red-200/50 dark:border-red-900/30 shadow-emergency/5 relative overflow-hidden bg-gradient-to-b from-red-50/10 to-transparent text-center mb-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-red-500/5 blur-3xl" />
          
          <h2 className="text-base font-bold text-text-primary mb-2">Emergency Quick Dial</h2>
          <p className="text-xs text-text-secondary mb-8 max-w-sm mx-auto">
            Click the button below to connect with the nearest dispatcher immediately.
          </p>

          {/* Huge emergency button */}
          <a
            href={nearestAmbulance ? `tel:${nearestAmbulance.phone}` : 'tel:112'}
            className="w-36 h-36 md:w-40 md:h-40 rounded-full bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center gap-2 mx-auto shadow-lg shadow-red-600/30 hover:scale-105 transition-all duration-300 relative group cursor-pointer border-4 border-white dark:border-dark"
          >
            <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75 group-hover:animate-none" />
            <Phone className="w-8 h-8" />
            <span className="font-extrabold text-sm tracking-widest uppercase">Call</span>
            <span className="text-[10px] font-bold opacity-80">Ambulance</span>
          </a>

          {/* Nearest ambulance details */}
          {nearestAmbulance && (
            <div className="mt-8 pt-6 border-t border-border/60 grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider block">Nearest Dispatch</span>
                <span className="text-xs font-bold text-text-primary mt-1 block">{nearestAmbulance.driver_name || nearestAmbulance.driverName}</span>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider block">Distance</span>
                <span className="text-xs font-bold text-text-primary mt-1 block">{nearestAmbulance.distance} KM</span>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider block">Estimated ETA</span>
                <span className="text-xs font-bold text-stable mt-1 block">{nearestAmbulance.eta} Minutes</span>
              </div>
            </div>
          )}
        </div>

        {/* Nearby Ambulance Fleet List */}
        <div>
          <h3 className="text-sm font-bold text-text-primary mb-4 px-2 uppercase tracking-wider">
            Available Emergency Fleets
          </h3>
          
          <div className="space-y-3">
            {sortedAmbulances.map((amb, idx) => (
              <div 
                key={amb.id}
                className="card p-4 border border-border flex items-center justify-between hover:border-red-200/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 flex items-center justify-center border border-red-100/30">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">{amb.driver_name || amb.driverName}</h4>
                    <p className="text-[10px] text-text-secondary mt-0.5">{amb.hospital_name || 'Emergency Trauma Center'}</p>
                    <span className="text-[9px] font-bold text-text-muted mt-1 inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {amb.distance} KM &bull; <Clock className="w-3 h-3" /> {amb.eta} mins ETA
                    </span>
                  </div>
                </div>

                <a 
                  href={`tel:${amb.phone}`}
                  className="btn-primary !h-9 px-3 text-xs flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Driver
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
