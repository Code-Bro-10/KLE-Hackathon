import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Phone, Clock, BedDouble, Navigation, 
  CheckCircle2, AlertCircle, Compass, Truck, 
  Map as MapIcon, Sliders, ChevronRight, X, ShieldAlert 
} from 'lucide-react';
import type { Hospital } from '@/types';
import { useStore } from '@/store/StoreContext';
import NavigationBar from '@/components/Navigation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Haversine formula to compute distance between coordinates in Kilometers
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
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

// Custom user pulsing marker
const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 24px; height: 24px; background: rgba(10, 132, 255, 0.4); border-radius: 50%; animation: ringPulse 2s ease-out infinite;"></div>
      <div style="position: absolute; width: 12px; height: 12px; background: #0A84FF; border: 2px solid white; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Custom hospital pins in ER status colors
const hospitalIcon = (erStatus: 'open' | 'limited' | 'full') => {
  const color = erStatus === 'open' ? '#30D158' : erStatus === 'limited' ? '#FF9F0A' : '#FF453A';
  return L.divIcon({
    className: 'custom-hospital-marker',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 12px; height: 4px; border-radius: 50%; bottom: 0; left: 10px; background: rgba(0,0,0,0.2); transform: scaleX(1.5);"></div>
        <div style="color: ${color}; position: absolute; top: 0; cursor: pointer;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

// Custom ambulance moving icon
const ambulanceIcon = L.divIcon({
  className: 'custom-ambulance-marker',
  html: `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #FF3B30; border: 2px solid white; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3); animation: ringPulse 1.5s ease-out infinite;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
        <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

type BookingStage = 'idle' | 'requesting' | 'confirmed' | 'arrived';

export default function MapPage() {
  const { hospitals } = useStore();
  const [maxDistance, setMaxDistance] = useState<number>(5); // default 5km
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  
  // Default coordinate in Belgaum center
  const defaultUserLocation = { lat: 15.8500, lng: 74.5080 };
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(defaultUserLocation);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'enabled' | 'error'>('idle');

  // Ambulance booking state
  const [bookingStage, setBookingStage] = useState<BookingStage>('idle');
  const [ambulanceType, setAmbulanceType] = useState<'bls' | 'als' | 'icu'>('bls');
  const [driverInfo, setDriverInfo] = useState<{ name: string; phone: string; vehicle: string } | null>(null);
  const [eta, setEta] = useState<number>(0);

  // Map references
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const hospitalMarkersRef = useRef<L.Marker[]>([]);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  const requestLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus('enabled');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationStatus('error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    requestLiveLocation();
  }, []);

  // Compute live hospital distances
  const computedHospitals = useMemo(() => {
    return hospitals.map((h) => {
      const distance = getHaversineDistance(userLocation.lat, userLocation.lng, h.lat || defaultUserLocation.lat, h.lng || defaultUserLocation.lng);
      const calculatedDistance = parseFloat(distance.toFixed(1));
      const travelTimeMin = Math.round(calculatedDistance * 2.5); // 2.5 min/km transit
      const totalTimeMin = h.waitTimeMin + travelTimeMin;

      return {
        ...h,
        calculatedDistance,
        travelTimeMin,
        totalTimeMin,
      };
    });
  }, [hospitals, userLocation]);

  // Filter hospitals within range
  const filteredHospitals = useMemo(() => {
    return computedHospitals
      .filter((h) => h.calculatedDistance <= maxDistance)
      .sort((a, b) => a.calculatedDistance - b.calculatedDistance);
  }, [computedHospitals, maxDistance]);

  // Setup Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;

    mapInstance.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([userLocation.lat, userLocation.lng], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(mapInstance.current);

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

    // Initial User Marker
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(mapInstance.current)
      .bindPopup('<b>Your Location</b>', { closeButton: false });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update user location dynamically
  useEffect(() => {
    if (mapInstance.current && userMarkerRef.current) {
      mapInstance.current.setView([userLocation.lat, userLocation.lng], 13);
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  // Update hospital pins based on filtering
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Clear old hospital pins
    hospitalMarkersRef.current.forEach((m) => m.remove());
    hospitalMarkersRef.current = [];

    // Add new ones
    filteredHospitals.forEach((h) => {
      if (h.lat && h.lng) {
        const marker = L.marker([h.lat, h.lng], { icon: hospitalIcon(h.erStatus) })
          .addTo(map)
          .on('click', () => {
            setSelectedHospital(h);
          });
        
        const popupContent = `
          <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 140px;">
            <div style="font-weight: 600; font-size: 13px; color: #1D1D1F;">${h.name}</div>
            <div style="font-size: 11px; color: #707074; margin-top: 2px;">${h.calculatedDistance} km away</div>
          </div>
        `;
        marker.bindPopup(popupContent, { closeButton: false });
        hospitalMarkersRef.current.push(marker);
      }
    });
  }, [filteredHospitals]);

  // Handle ambulance booking animation flow
  const handleBookAmbulance = () => {
    if (!selectedHospital) return;
    setBookingStage('requesting');

    setTimeout(() => {
      setBookingStage('confirmed');
      setDriverInfo({
        name: 'Ramesh Kumar',
        phone: '+91 98450 12345',
        vehicle: 'KA-22-EM-1108',
      });
      setEta(Math.max(3, Math.round(selectedHospital.distanceKm * 2)));

      // Trigger tracking animation on the Leaflet Map
      animateAmbulanceRoute();
    }, 2500);
  };

  const animateAmbulanceRoute = () => {
    const map = mapInstance.current;
    const destLat = selectedHospital?.lat;
    const destLng = selectedHospital?.lng;

    if (!map || !destLat || !destLng) return;

    // Clear previous elements
    if (ambulanceMarkerRef.current) ambulanceMarkerRef.current.remove();
    if (routeLineRef.current) routeLineRef.current.remove();

    // Create route line (dashed line between hospital and user)
    const points: [number, number][] = [
      [destLat, destLng],
      [userLocation.lat, userLocation.lng]
    ];
    routeLineRef.current = L.polyline(points, {
      color: '#FF3B30',
      dashArray: '8, 8',
      weight: 3,
      opacity: 0.8
    }).addTo(map);

    // Create moving ambulance marker
    ambulanceMarkerRef.current = L.marker([destLat, destLng], { icon: ambulanceIcon }).addTo(map);

    // Animate marker along the line (15 seconds total)
    const duration = 12000; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Interpolate coordinates
      const currentLat = destLat + (userLocation.lat - destLat) * progress;
      const currentLng = destLng + (userLocation.lng - destLng) * progress;

      if (ambulanceMarkerRef.current) {
        ambulanceMarkerRef.current.setLatLng([currentLat, currentLng]);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation finished
        setBookingStage('arrived');
        setEta(0);
        if (ambulanceMarkerRef.current) {
          ambulanceMarkerRef.current.bindPopup('<b>Ambulance Arrived!</b>', { closeButton: false }).openPopup();
        }
      }
    };

    requestAnimationFrame(animate);
  };

  const resetBooking = () => {
    setBookingStage('idle');
    setDriverInfo(null);
    setSelectedHospital(null);

    // Clear map animations
    if (ambulanceMarkerRef.current) {
      ambulanceMarkerRef.current.remove();
      ambulanceMarkerRef.current = null;
    }
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 flex flex-col">
      <NavigationBar />

      <div className="container-main flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Controls & List */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Header & Filter Card */}
          <div className="card p-6">
            <h1 className="text-2xl font-bold text-text-primary mb-2 flex items-center gap-2">
              <MapIcon className="w-6 h-6 text-medical" /> Emergency Map
            </h1>
            <p className="text-text-secondary text-sm mb-6">
              Locate emergency trauma centers and dispatch ambulances in real-time.
            </p>

            {/* Distance Slider */}
            <div>
              <div className="flex items-center justify-between text-sm font-semibold text-text-primary mb-3">
                <span className="flex items-center gap-1"><Sliders className="w-4 h-4 text-text-secondary" /> Radius Distance</span>
                <span className="text-medical font-bold">{maxDistance} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={maxDistance}
                onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-medical focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>1 km</span>
                <span>5 km</span>
                <span>10 km</span>
              </div>
            </div>
          </div>

          {/* Booking / Details Panel */}
          <div className="card p-6 flex-1 flex flex-col min-h-[300px]">
            <AnimatePresence mode="wait">
              
              {/* Stage: Idle / Booking Form */}
              {bookingStage === 'idle' && (
                <motion.div 
                  key="booking-idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col"
                >
                  <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-emergency" /> Book an Ambulance
                  </h2>

                  {/* Destination Selector */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-text-secondary mb-2">DESTINATION HOSPITAL</label>
                    <select
                      className="input-field text-sm"
                      value={selectedHospital?.id || ''}
                      onChange={(e) => {
                        const hosp = filteredHospitals.find(h => h.id === e.target.value);
                        setSelectedHospital(hosp || null);
                      }}
                    >
                      <option value="">-- Choose Hospital --</option>
                      {filteredHospitals.map(h => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.calculatedDistance} km)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ambulance Type Selector */}
                  <div className="mb-6">
                    <label className="block text-xs font-semibold text-text-secondary mb-2">AMBULANCE TYPE</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'bls', label: 'BLS', desc: 'Basic care' },
                        { id: 'als', label: 'ALS', desc: 'Oxygen/Paramedic' },
                        { id: 'icu', label: 'ICU', desc: 'Full ventilator' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setAmbulanceType(t.id as any)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            ambulanceType === t.id 
                              ? 'border-medical bg-surface-blue text-medical' 
                              : 'border-border bg-background text-text-secondary hover:bg-surface'
                          }`}
                        >
                          <div className="text-sm font-bold">{t.label}</div>
                          <div className="text-[10px] opacity-80 leading-tight mt-1">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hospital Details Preview if selected */}
                  {selectedHospital && (
                    <div className="p-4 rounded-xl bg-surface border border-border mb-6">
                      <h4 className="text-xs font-bold text-text-primary mb-1 uppercase tracking-wider">Hospital Selected</h4>
                      <p className="text-sm font-semibold text-text-primary">{selectedHospital.name}</p>
                      <div className="flex gap-4 mt-2 text-xs text-text-secondary">
                        <span className="flex items-center gap-0.5"><Clock className="w-3.5 h-3.5 text-urgent" /> {selectedHospital.waitTimeMin}m wait</span>
                        <span className="flex items-center gap-0.5"><BedDouble className="w-3.5 h-3.5 text-stable" /> {selectedHospital.availableBeds} beds</span>
                      </div>
                    </div>
                  )}

                  <button
                    disabled={!selectedHospital}
                    onClick={handleBookAmbulance}
                    className="btn-emergency mt-auto w-full flex items-center justify-center gap-2 h-12"
                  >
                    <Truck className="w-5 h-5" />
                    Request Emergency Ambulance
                  </button>
                </motion.div>
              )}

              {/* Stage: Requesting / Searching */}
              {bookingStage === 'requesting' && (
                <motion.div
                  key="booking-requesting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center py-10"
                >
                  <div className="w-16 h-16 rounded-full bg-emergency-soft flex items-center justify-center mb-6 animate-pulse">
                    <Truck className="w-8 h-8 text-emergency animate-bounce" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">Connecting with Ambulance...</h3>
                  <p className="text-sm text-text-secondary max-w-[240px]">
                    Matching with the closest emergency responder in your location.
                  </p>
                </motion.div>
              )}

              {/* Stage: Confirmed / Driver En-route */}
              {bookingStage === 'confirmed' && (
                <motion.div
                  key="booking-confirmed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-stable text-xs font-semibold self-start mb-4">
                    <CheckCircle2 className="w-3.5 h-3.5 text-stable" />
                    Ambulance Confirmed
                  </div>

                  <h3 className="text-xl font-bold text-text-primary mb-1">Ambulance is En-Route</h3>
                  <p className="text-sm text-text-secondary mb-6 flex items-center gap-1">
                    ETA: <span className="text-emergency font-bold">~{eta} minutes</span> ({selectedHospital?.calculatedDistance} km transit)
                  </p>

                  {/* Driver Profile */}
                  {driverInfo && (
                    <div className="p-4 rounded-xl bg-surface border border-border mb-6">
                      <div className="text-[10px] font-bold text-text-muted mb-3 uppercase tracking-wider">Assigned Driver</div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-sm font-bold text-text-primary">{driverInfo.name}</div>
                          <div className="text-xs text-text-muted">Vehicle No: {driverInfo.vehicle}</div>
                        </div>
                        <a 
                          href={`tel:${driverInfo.phone}`}
                          className="w-10 h-10 rounded-full bg-medical-soft text-medical flex items-center justify-center hover:bg-medical hover:text-white transition-all"
                        >
                          <Phone className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Safety Advice */}
                  <div className="p-4 rounded-xl bg-yellow-50 border border-amber-200/50 text-urgent text-xs flex gap-2.5 mb-6">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <div className="font-bold mb-0.5">While you wait:</div>
                      Keep the patient warm and seated. Prepare clear path for the responders.
                    </div>
                  </div>

                  <button
                    onClick={resetBooking}
                    className="btn-secondary w-full flex items-center justify-center gap-2 h-12 text-sm text-emergency border-emergency/30 hover:bg-emergency-soft"
                  >
                    <X className="w-4 h-4" /> Cancel Request
                  </button>
                </motion.div>
              )}

              {/* Stage: Arrived */}
              {bookingStage === 'arrived' && (
                <motion.div
                  key="booking-arrived"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center py-10"
                >
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-stable" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Ambulance Has Arrived!</h3>
                  <p className="text-sm text-text-secondary max-w-[240px] mb-8">
                    The medical responders have reached your location. Please proceed to the vehicle.
                  </p>
                  <button
                    onClick={resetBooking}
                    className="btn-primary w-full h-12"
                  >
                    Complete Triage
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Map & Hospitals List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Map Container */}
          <div className="rounded-2xl h-[350px] relative border border-border shadow-sm overflow-hidden z-0 bg-background">
            <div ref={mapRef} className="w-full h-full" />
            <div className="absolute top-4 left-4 z-[1000] flex gap-2">
              <div className="card-float px-4 py-2 text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-stable live-dot" />
                Belgaum Area Triage
              </div>
              
              {locationStatus === 'detecting' && (
                <div className="card-float px-3 py-2 text-xs font-semibold text-medical flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 animate-spin" /> Detecting Location
                </div>
              )}
              {locationStatus === 'enabled' && (
                <div className="card-float px-3 py-2 text-xs font-semibold text-stable flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> GPS Active
                </div>
              )}
            </div>
          </div>

          {/* Hospitals List */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">
                Hospitals Within Radius ({filteredHospitals.length})
              </h3>
              <span className="text-xs text-text-muted">Sorted by nearest</span>
            </div>

            {filteredHospitals.length === 0 ? (
              <div className="text-center py-10">
                <AlertCircle className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary text-sm">No hospitals found within {maxDistance} km.</p>
                <p className="text-xs text-text-muted mt-1">Try expanding the search radius slider.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 max-h-[300px] overflow-y-auto pr-2">
                {filteredHospitals.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHospital(h)}
                    className={`py-4 flex items-center justify-between cursor-pointer transition-all hover:bg-surface-blue/20 px-2 rounded-xl ${
                      selectedHospital?.id === h.id ? 'bg-surface-blue/30 border-l-4 border-medical' : ''
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm text-text-primary">{h.name}</div>
                      <div className="text-xs text-text-secondary mt-0.5">{h.address}</div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
                        <span>{h.calculatedDistance} km away</span>
                        <span>•</span>
                        <span>{h.waitTimeMin} mins wait</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        h.erStatus === 'open' ? 'bg-stable' : h.erStatus === 'limited' ? 'bg-urgent' : 'bg-emergency'
                      }`} />
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
