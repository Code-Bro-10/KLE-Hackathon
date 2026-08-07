import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, BedDouble, Navigation, CheckCircle2, AlertCircle, XCircle, Compass, Timer } from 'lucide-react';
import type { Hospital } from '@/types';
import { useStore } from '@/store/StoreContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const statusConfig = {
  open: { label: 'ER Open', color: 'text-stable', bg: 'bg-green-50', dot: 'bg-stable', icon: CheckCircle2 },
  limited: { label: 'Limited', color: 'text-urgent', bg: 'bg-amber-50', dot: 'bg-urgent', icon: AlertCircle },
  full: { label: 'At Capacity', color: 'text-emergency', bg: 'bg-emergency-soft', dot: 'bg-emergency', icon: XCircle },
};

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

// Custom Leaflet user icon (Blue pulse pin)
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

// Custom Leaflet hospital icon (Marker in matching ER status color)
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

export default function HospitalFinder() {
  const { hospitals } = useStore();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'enabled' | 'denied' | 'error'>('idle');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

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
        setLocationStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    requestLiveLocation();
  }, []);

  const computedHospitals = useMemo(() => {
    return hospitals.map((h) => {
      const distance = userLocation && h.lat && h.lng
        ? getHaversineDistance(userLocation.lat, userLocation.lng, h.lat, h.lng)
        : h.distanceKm;

      const calculatedDistance = parseFloat(distance.toFixed(1));
      const travelTimeMin = Math.round(calculatedDistance * 2.5); // ~24 km/h traffic speed (2.5 min/km)
      const totalTimeMin = h.waitTimeMin + travelTimeMin;

      return {
        ...h,
        calculatedDistance,
        isLiveDistance: !!userLocation,
        travelTimeMin,
        totalTimeMin,
      };
    });
  }, [hospitals, userLocation]);

  const sorted = useMemo(() => {
    // Sort by Total Time to Care (Transit + ER Wait)
    return [...computedHospitals].sort((a, b) => a.totalTimeMin - b.totalTimeMin);
  }, [computedHospitals]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!mapRef.current) return;

    // Center map initially around general Belgaum area
    mapInstance.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([15.8497, 74.4977], 12);

    // Apply CartoDB Positron clean map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(mapInstance.current);

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update markers and coordinates dynamically
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Focus map view
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Your Location</b>', { closeButton: false });
      markersRef.current.push(userMarker);
    } else if (sorted.length > 0 && sorted[0].lat && sorted[0].lng) {
      map.setView([sorted[0].lat, sorted[0].lng], 12);
    }

    // Add hospital pins
    sorted.forEach((hospital) => {
      if (hospital.lat && hospital.lng) {
        const bedsText = `${hospital.availableBeds}/${hospital.totalBeds} beds`;
        const popupContent = `
          <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 150px;">
            <div style="font-weight: 600; font-size: 13px; margin-bottom: 2px; color: #1D1D1F;">${hospital.name}</div>
            <div style="font-size: 11px; color: #707074; margin-bottom: 6px;">${hospital.address}</div>
            <div style="display: flex; gap: 8px; font-size: 10px; font-weight: 500; color: #1D1D1F;">
              <span>Beds: ${bedsText}</span>
              <span>Wait: ~${hospital.waitTimeMin} min</span>
            </div>
          </div>
        `;

        const m = L.marker([hospital.lat, hospital.lng], { icon: hospitalIcon(hospital.erStatus) })
          .addTo(map)
          .bindPopup(popupContent);
        markersRef.current.push(m);
      }
    });
  }, [userLocation, sorted]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-6 mt-8"
    >
      <div className="text-center mb-6">
        <h2 className="heading-card mb-2">Nearest Emergency Rooms</h2>
        <p className="text-text-secondary">Real-time availability and wait times</p>
      </div>

      {/* Geolocation Status Indicator */}
      <div className="flex justify-center mb-6">
        {locationStatus === 'detecting' && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-medical text-xs font-semibold">
            <Compass className="w-3.5 h-3.5 animate-spin" />
            Detecting live location...
          </div>
        )}
        {locationStatus === 'enabled' && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-stable text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5 text-stable" />
            Sorting by live distance
          </div>
        )}
        {(locationStatus === 'denied' || locationStatus === 'error') && (
          <button
            onClick={requestLiveLocation}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-urgent hover:bg-amber-100 transition-colors text-xs font-semibold"
          >
            <Compass className="w-3.5 h-3.5" />
            Location permission disabled. Tap to enable live sorting.
          </button>
        )}
      </div>

      {/* Live Leaflet Map Container */}
      <div className="rounded-lg h-64 mb-8 relative border border-border shadow-sm overflow-hidden z-0">
        <div ref={mapRef} className="w-full h-full" />
        <div className="absolute bottom-4 left-4 card-float px-4 py-2 text-sm font-medium text-text-primary flex items-center gap-1.5 z-[1000]">
          <span className="w-2 h-2 rounded-full bg-stable live-dot" />
          Belgaum Area
        </div>
      </div>

      {/* Hospital cards */}
      <div className="space-y-4">
        {sorted.map((hospital, i) => (
          <HospitalRow key={hospital.id} hospital={hospital} index={i} userLocation={userLocation} />
        ))}
      </div>
    </motion.div>
  );
}

interface HospitalRowProps {
  hospital: Hospital & { 
    calculatedDistance: number; 
    isLiveDistance: boolean;
    travelTimeMin: number;
    totalTimeMin: number;
  };
  index: number;
  userLocation: { lat: number; lng: number } | null;
}

function HospitalRow({ hospital, index, userLocation }: HospitalRowProps) {
  const cfg = statusConfig[hospital.erStatus];
  const bedPct = hospital.totalBeds > 0 ? Math.round((hospital.availableBeds / hospital.totalBeds) * 100) : 0;

  // Generate directions URL, dynamically incorporating user's coordinates if location is enabled
  const directionsUrl = userLocation
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${encodeURIComponent(hospital.address)}`
    : `https://maps.google.com/?q=${encodeURIComponent(hospital.address)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {index === 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emergency text-white text-xs font-semibold">FASTEST CARE</span>
            )}
            <h3 className="text-xl font-semibold text-text-primary">{hospital.name}</h3>
          </div>
          <p className="text-text-secondary text-sm flex items-center gap-1">
            <MapPin className="w-4 h-4" /> {hospital.address}
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.color} text-sm font-semibold flex items-center gap-1.5`}>
          <span className={`w-2 h-2 rounded-full ${cfg.dot} live-dot`} />
          {cfg.label}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-medical" />
          <div>
            <div className="text-xs text-text-muted flex items-center gap-1">
              Distance 
              {hospital.isLiveDistance && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-stable animate-ping" />
              )}
            </div>
            <div className="font-semibold text-text-primary flex items-baseline gap-1">
              {hospital.calculatedDistance} km
            </div>
            <div className="text-[10px] text-text-muted">~{hospital.travelTimeMin} min transit</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-urgent" />
          <div>
            <div className="text-xs text-text-muted">ER Wait</div>
            <div className="font-semibold text-text-primary">~{hospital.waitTimeMin} min</div>
            <div className="text-[10px] text-text-muted">Hospital wait time</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-emergency animate-pulse" />
          <div>
            <div className="text-xs text-text-muted">Total Time</div>
            <div className="font-semibold text-emergency">~{hospital.totalTimeMin} min</div>
            <div className="text-[10px] text-text-muted">Transit + ER Wait</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BedDouble className="w-5 h-5 text-stable" />
          <div>
            <div className="text-xs text-text-muted">Beds</div>
            <div className="font-semibold text-text-primary">{hospital.availableBeds}/{hospital.totalBeds}</div>
            <div className="text-[10px] text-text-muted">Available beds</div>
          </div>
        </div>
      </div>

      {/* Bed availability bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>Bed availability</span>
          <span>{bedPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-surface overflow-hidden">
          <div
            className={`h-full rounded-full ${bedPct > 40 ? 'bg-stable' : bedPct > 15 ? 'bg-urgent' : 'bg-emergency'}`}
            style={{ width: `${bedPct}%` }}
          />
        </div>
      </div>

      {/* Departments */}
      <div className="flex flex-wrap gap-2">
        {hospital.departments.map((dept) => (
          <span key={dept} className="px-3 py-1 rounded-full bg-surface text-sm text-text-secondary">
            {dept}
          </span>
        ))}
      </div>

      <div className="mt-4 flex gap-3">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
        >
          <Navigation className="w-4 h-4" />
          Get Directions
        </a>
        <a href={`tel:${hospital.emergencyPhone}`} className="btn-secondary flex items-center justify-center gap-2 text-sm px-6">
          <Phone className="w-4 h-4 text-emergency" />
          ER Line
        </a>
      </div>
    </motion.div>
  );
}
