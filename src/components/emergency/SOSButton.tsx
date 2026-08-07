import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, XCircle, MapPin, ShieldAlert, PhoneCall } from 'lucide-react';

export default function SOSButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isDispatched, setIsDispatched] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'failed'>('idle');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Request location when SOS modal opens
  const fetchLocationForSOS = () => {
    if (!navigator.geolocation) {
      setLocationStatus('failed');
      return;
    }
    setLocationStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus('success');
      },
      (error) => {
        console.error('SOS Geolocation error:', error);
        setLocationStatus('failed');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleOpen = () => {
    setIsOpen(true);
    setCountdown(5);
    setIsDispatched(false);
    setCoords(null);
    fetchLocationForSOS();
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsOpen(false);
  };

  // Countdown timer logic
  useEffect(() => {
    if (isOpen && countdown > 0 && !isDispatched) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && !isDispatched) {
      setIsDispatched(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, countdown, isDispatched]);

  return (
    <>
      {/* Floating SOS Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-emergency text-white flex flex-col items-center justify-center shadow-emergency hover:scale-105 active:scale-95 transition-all z-50 select-none group"
      >
        <span className="absolute inset-0 rounded-full bg-emergency/30 animate-ping group-hover:animate-none" />
        <AlertOctagon className="w-5 h-5 text-white animate-bounce mb-0.5" strokeWidth={2.5} />
        <span className="text-[10px] font-black tracking-wider">SOS</span>
      </button>

      {/* SOS Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white max-w-md w-full rounded-3xl p-8 border border-emergency/20 text-center shadow-card relative overflow-hidden"
            >
              {/* Background emergency strobe glow */}
              <div className={`absolute inset-0 opacity-5 pointer-events-none transition-colors duration-300 ${isDispatched ? 'bg-red-600 animate-pulse' : 'bg-amber-500'}`} />

              {!isDispatched ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-emergency-soft flex items-center justify-center mx-auto mb-6 relative">
                    <div className="absolute inset-0 rounded-full bg-emergency/10 animate-ping" />
                    <ShieldAlert className="w-10 h-10 text-emergency animate-pulse" strokeWidth={2} />
                  </div>

                  <h2 className="text-2xl font-bold text-text-primary mb-2">TRIGGERING EMERGENCY SOS</h2>
                  <p className="text-text-secondary text-sm mb-8 px-4">
                    Alerting emergency services with your coordinates in...
                  </p>

                  {/* Big countdown number */}
                  <div className="w-32 h-32 rounded-full border-4 border-emergency/20 flex items-center justify-center mx-auto mb-8 bg-emergency-soft">
                    <span className="text-6xl font-black text-emergency animate-pulse">{countdown}</span>
                  </div>

                  <button
                    onClick={handleCancel}
                    className="w-full h-14 rounded-full bg-text-primary text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-black transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    CANCEL SOS
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6 relative">
                    <PhoneCall className="w-10 h-10 text-stable" strokeWidth={2} />
                  </div>

                  <h2 className="text-2xl font-bold text-emerald-800 mb-2">SOS ALERTS DISPATCHED!</h2>
                  <p className="text-text-secondary text-sm mb-6 px-4">
                    Ambulance and nearby first responders are being directed to your location.
                  </p>

                  {/* GPS Coordinates panel */}
                  <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col items-center gap-2 mb-8">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      Live Location Info
                    </div>
                    {locationStatus === 'fetching' && (
                      <span className="text-xs text-text-muted animate-pulse">Retrieving GPS coordinates...</span>
                    )}
                    {locationStatus === 'success' && coords && (
                      <div className="font-mono text-sm text-text-primary">
                        Lat: {coords.lat.toFixed(6)} <br />
                        Lng: {coords.lng.toFixed(6)}
                      </div>
                    )}
                    {locationStatus === 'failed' && (
                      <span className="text-xs text-emergency font-semibold">Location unavailable (using default Belgaum area)</span>
                    )}
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full h-14 rounded-full bg-emerald-600 text-white font-bold text-base hover:bg-emerald-700 transition-colors"
                  >
                    Dismiss Alert
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
