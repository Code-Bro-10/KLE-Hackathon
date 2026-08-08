import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, Search, Phone, MapPin, Activity, CheckCircle2, 
  Compass, ShieldAlert, Clock, Plus, Trash2, Edit, X, 
  ExternalLink, MessageSquare, AlertCircle, ShoppingBag, 
  Calendar, FileText, Upload, Star, ClipboardCheck, ArrowRight
} from 'lucide-react';
import NavigationBar from '@/components/Navigation';
import { supabase } from '@/lib/supabase';
import { suggestEquipmentWithGemini } from '@/services/gemini';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Haversine distance formula (Belgaum baseline)
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

// Leaflet markers styles
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

const vendorIcon = L.divIcon({
  className: 'custom-vendor-marker',
  html: `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 12px; height: 4px; border-radius: 50%; bottom: 0; left: 10px; background: rgba(0,0,0,0.2); transform: scaleX(1.5);"></div>
      <div style="color: #FF9F0A; position: absolute; top: 0; cursor: pointer;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Mock Fallback Database Arrays
const MOCK_VENDORS = [
  { id: 'vendor-1', name: 'Belgaum Healthcare Rentals', phone: '+919876543210', latitude: 15.8520, longitude: 74.5030, address: 'Maratha Mandir Road, Belgaum, Karnataka', rating: 4.8 },
  { id: 'vendor-2', name: 'KLES Medical Equipment Supplies', phone: '+919988776655', latitude: 15.8610, longitude: 74.5090, address: 'Nehru Nagar, Belgaum, Karnataka', rating: 4.9 },
  { id: 'vendor-3', name: 'Goaves Surgical Rentals', phone: '+919448112233', latitude: 15.8420, longitude: 74.4980, address: 'Goaves Circle, Belgaum, Karnataka', rating: 4.6 },
];

const MOCK_EQUIPMENT = [
  { id: 'item-1', vendor_id: 'vendor-1', name: 'Standard Ergonomic Wheelchair', category: 'Wheelchair', price_per_day: 150.0, deposit: 2000.0, quantity_available: 4, delivery_available: true, image_url: 'https://images.unsplash.com/photo-1579684389782-64d84b5e905d?auto=format&fit=crop&q=80&w=300' },
  { id: 'item-2', vendor_id: 'vendor-1', name: '5L Portable Oxygen Concentrator', category: 'Concentrator', price_per_day: 800.0, deposit: 10000.0, quantity_available: 2, delivery_available: true, image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=300' },
  { id: 'item-3', vendor_id: 'vendor-1', name: 'Adjustable Height Walker', category: 'Walker', price_per_day: 50.0, deposit: 500.0, quantity_available: 8, delivery_available: true, image_url: 'https://images.unsplash.com/photo-1579684389782-64d84b5e905d?auto=format&fit=crop&q=80&w=300' },

  { id: 'item-4', vendor_id: 'vendor-2', name: 'Semi-Fowler Hospital Bed', category: 'Bed', price_per_day: 500.0, deposit: 15000.0, quantity_available: 3, delivery_available: true, image_url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=300' },
  { id: 'item-5', vendor_id: 'vendor-2', name: '10L Double Flow Oxygen Concentrator', category: 'Concentrator', price_per_day: 1200.0, deposit: 15000.0, quantity_available: 1, delivery_available: true, image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=300' },
  { id: 'item-6', vendor_id: 'vendor-2', name: 'Aluminium Underarm Crutches', category: 'Crutches', price_per_day: 30.0, deposit: 300.0, quantity_available: 12, delivery_available: false, image_url: 'https://images.unsplash.com/photo-1579684389782-64d84b5e905d?auto=format&fit=crop&q=80&w=300' },
  { id: 'item-7', vendor_id: 'vendor-2', name: 'Auto-CPAP Therapy Machine', category: 'CPAP', price_per_day: 400.0, deposit: 8000.0, quantity_available: 2, delivery_available: true, image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=300' },

  { id: 'item-8', vendor_id: 'vendor-3', name: 'Standard Ergonomic Wheelchair', category: 'Wheelchair', price_per_day: 140.0, deposit: 1500.0, quantity_available: 2, delivery_available: true, image_url: 'https://images.unsplash.com/photo-1579684389782-64d84b5e905d?auto=format&fit=crop&q=80&w=300' },
  { id: 'item-9', vendor_id: 'vendor-3', name: 'Aluminium Underarm Crutches', category: 'Crutches', price_per_day: 25.0, deposit: 250.0, quantity_available: 6, delivery_available: true, image_url: 'https://images.unsplash.com/photo-1579684389782-64d84b5e905d?auto=format&fit=crop&q=80&w=300' },
  { id: 'item-10', vendor_id: 'vendor-3', name: 'Medical Oxygen Cylinder (B-Type)', category: 'Cylinder', price_per_day: 250.0, deposit: 2500.0, quantity_available: 5, delivery_available: true, image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=300' },
];

const MOCK_BOOKINGS = [
  { id: 'bk-1', equipment_id: 'item-1', patient_name: 'Amit Patel', start_date: '2026-08-10', end_date: '2026-08-15', status: 'pending', total_price: 2750.0 },
  { id: 'bk-2', equipment_id: 'item-4', patient_name: 'Suresh Kumar', start_date: '2026-08-08', end_date: '2026-08-20', status: 'approved', total_price: 21000.0 },
];

export default function RentalsPage() {
  const [activeTab, setActiveTab] = useState<'search' | 'dashboard'>('search');
  const [searchCategory, setSearchCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Geolocation Coordinate states
  const defaultUserLocation = { lat: 15.8497, lng: 74.4977 };
  const [userLocation] = useState(defaultUserLocation);

  // DB vs Local Fallback states
  const [vendors, setVendors] = useState<any[]>(MOCK_VENDORS);
  const [equipment, setEquipment] = useState<any[]>(MOCK_EQUIPMENT);
  const [bookings, setBookings] = useState<any[]>(MOCK_BOOKINGS);
  const [usingFallback, setUsingFallback] = useState(false);

  // Gemini Vision prescription scanner states
  const [scanNotes, setScanNotes] = useState('');
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ suggestion: string; items: string[]; rationale: string } | null>(null);

  // Booking details configuration drawer states
  const [bookingItem, setBookingItem] = useState<any | null>(null);
  const [patientName, setPatientName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [optDelivery, setOptDelivery] = useState(true);
  const [confirmedReceipt, setConfirmedReceipt] = useState<any | null>(null);

  // Dashboard Vendor Management CRUD States
  const [selectedVendorId, setSelectedVendorId] = useState('vendor-1');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Wheelchair');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDeposit, setNewItemDeposit] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemDelivery, setNewItemDelivery] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingDepositId, setEditingDepositId] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Fetch tables and setup real-time subscription
  const loadData = async () => {
    let currentVendors = MOCK_VENDORS;
    let currentEquipment = MOCK_EQUIPMENT;
    let currentBookings = MOCK_BOOKINGS;
    let isDbOnline = false;

    try {
      const { data: dbVendors, error: vErr } = await supabase.from('equipment_vendors').select('*');
      const { data: dbItems, error: iErr } = await supabase.from('equipment_items').select('*');
      const { data: dbBookings, error: bErr } = await supabase.from('equipment_bookings').select('*');

      if (!vErr && !iErr && !bErr && dbVendors && dbItems && dbBookings && dbVendors.length > 0) {
        currentVendors = dbVendors;
        currentEquipment = dbItems;
        currentBookings = dbBookings;
        isDbOnline = true;
      }
    } catch (err) {
      console.warn('Supabase offline or tables missing, using fallbacks:', err);
    }

    // Merge registered vendors from localStorage
    const localVendors = localStorage.getItem('resq-registered-vendors');
    if (localVendors) {
      const parsedVendors = JSON.parse(localVendors);
      currentVendors = [...currentVendors, ...parsedVendors];
    }

    setVendors(currentVendors);
    setEquipment(currentEquipment);
    setBookings(currentBookings);
    setUsingFallback(!isDbOnline);

    // Auto-select active logged in vendor if applicable
    const activeVendorId = localStorage.getItem('resq-active-vendor-id');
    if (activeVendorId && currentVendors.find(v => v.id === activeVendorId)) {
      setSelectedVendorId(activeVendorId);
    } else if (currentVendors.length > 0) {
      setSelectedVendorId(currentVendors[0].id);
    }
  };

  useEffect(() => {
    loadData();

    const itemsSub = supabase
      .channel('equipment-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment_items' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment_bookings' }, () => loadData())
      .subscribe();

    return () => {
      supabase.removeChannel(itemsSub);
    };
  }, []);

  // Handle Prescription Image Scan input
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScanImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanPrescription = async () => {
    if (!scanNotes.trim() && !scanImage) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      const result = await suggestEquipmentWithGemini(scanNotes.trim() || 'Scanned Prescription Attachment', scanImage);
      setScanResult(result);

      // Auto-set the category filters to the first recommended item category
      if (result.items.length > 0) {
        setSearchCategory(result.items[0]);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Prescription analysis failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  // User search matching list
  const searchResults = useMemo(() => {
    return equipment.map((item) => {
      const vendor = vendors.find((v) => v.id === item.vendor_id);
      const distance = vendor
        ? getHaversineDistance(userLocation.lat, userLocation.lng, vendor.latitude, vendor.longitude)
        : 99.9;

      return {
        ...item,
        vendorName: vendor ? vendor.name : 'Unknown Shop',
        phone: vendor ? vendor.phone : '',
        address: vendor ? vendor.address : '',
        rating: vendor ? vendor.rating : 4.5,
        lat: vendor ? vendor.latitude : 0,
        lng: vendor ? vendor.longitude : 0,
        calculatedDistance: parseFloat(distance.toFixed(1)),
      };
    }).filter((item) => {
      const matchesCategory = searchCategory === 'All' || item.category === searchCategory;
      const matchesQuery = !searchQuery.trim() || item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    }).sort((a, b) => a.calculatedDistance - b.calculatedDistance);
  }, [equipment, vendors, searchCategory, searchQuery, userLocation]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (activeTab !== 'search' || !mapRef.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    mapInstance.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([userLocation.lat, userLocation.lng], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(mapInstance.current);

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(mapInstance.current)
      .bindPopup('<b>Your Location</b>', { closeButton: false });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [activeTab]);

  // Update Leaflet markers on filter/search change
  useEffect(() => {
    if (activeTab !== 'search' || !mapInstance.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const pinnedVendorIds = new Set<string>();

    searchResults.forEach((item) => {
      if (pinnedVendorIds.has(item.vendor_id)) return;
      pinnedVendorIds.add(item.vendor_id);

      if (item.lat && item.lng && mapInstance.current) {
        const marker = L.marker([item.lat, item.lng], { icon: vendorIcon })
          .addTo(mapInstance.current)
          .bindPopup(
            `<b>${item.vendorName}</b><br/>${item.name}<br/>Rent: ₹${item.price_per_day}/day`,
            { closeButton: false }
          );
        markersRef.current.push(marker);
      }
    });

    if (searchResults.length > 0 && mapInstance.current) {
      const coords = searchResults.map((r) => [r.lat, r.lng] as [number, number]);
      coords.push([userLocation.lat, userLocation.lng]);
      const bounds = L.latLngBounds(coords);
      mapInstance.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [searchResults, activeTab]);

  // Dynamic booking receipt calculator
  const computedReceipt = useMemo(() => {
    if (!bookingItem || !startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const rentalTotal = days * bookingItem.price_per_day;
    const deposit = bookingItem.deposit;
    const deliveryFee = optDelivery && bookingItem.delivery_available ? 250 : 0;
    const grandTotal = rentalTotal + deposit + deliveryFee;

    return {
      days,
      rentalTotal,
      deposit,
      deliveryFee,
      grandTotal,
    };
  }, [bookingItem, startDate, endDate, optDelivery]);

  const handleConfirmBooking = async () => {
    if (!bookingItem || !patientName.trim() || !startDate || !endDate || !computedReceipt) return;

    const bookingRow = {
      equipment_id: bookingItem.id,
      patient_name: patientName.trim(),
      start_date: startDate,
      end_date: endDate,
      status: 'pending',
      total_price: computedReceipt.grandTotal,
    };

    if (usingFallback) {
      const newBk = {
        id: `mock-bk-${Date.now()}`,
        ...bookingRow,
      };
      setBookings((prev) => [...prev, newBk]);
      setConfirmedReceipt({
        ...newBk,
        itemName: bookingItem.name,
        vendorName: bookingItem.vendorName,
        receipt: computedReceipt,
      });
    } else {
      try {
        const { data, error } = await supabase.from('equipment_bookings').insert(bookingRow).select().single();
        if (!error && data) {
          setConfirmedReceipt({
            ...data,
            itemName: bookingItem.name,
            vendorName: bookingItem.vendorName,
            receipt: computedReceipt,
          });
          loadData();
        }
      } catch (err) {
        console.error(err);
      }
    }

    setBookingItem(null);
    setPatientName('');
    setStartDate('');
    setEndDate('');
  };

  // Vendor Owner console selector CRUD triggers
  const dashboardItems = useMemo(() => {
    return equipment.filter((e) => e.vendor_id === selectedVendorId);
  }, [equipment, selectedVendorId]);

  const dashboardBookings = useMemo(() => {
    const vendorMeds = equipment.filter((e) => e.vendor_id === selectedVendorId).map((e) => e.id);
    return bookings.map((b) => {
      const item = equipment.find((e) => e.id === b.equipment_id);
      return {
        ...b,
        itemName: item ? item.name : 'Medical Supply',
        vendorId: item ? item.vendor_id : null,
      };
    }).filter((b) => b.vendorId === selectedVendorId);
  }, [bookings, equipment, selectedVendorId]);

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice || !newItemDeposit) return;

    const priceNum = parseFloat(newItemPrice);
    const depositNum = parseFloat(newItemDeposit);
    const qtyInt = parseInt(newItemQty) || 1;

    const equipRow = {
      vendor_id: selectedVendorId,
      name: newItemName.trim(),
      category: newItemCategory,
      price_per_day: priceNum,
      deposit: depositNum,
      quantity_available: qtyInt,
      delivery_available: newItemDelivery,
      image_url: 'https://images.unsplash.com/photo-1579684389782-64d84b5e905d?auto=format&fit=crop&q=80&w=300',
    };

    if (usingFallback) {
      const mockId = `mock-eq-${Date.now()}`;
      setEquipment((prev) => [...prev, { id: mockId, ...equipRow }]);
    } else {
      try {
        await supabase.from('equipment_items').insert(equipRow);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }

    setNewItemName('');
    setNewItemPrice('');
    setNewItemDeposit('');
    setNewItemQty('1');
    setShowAddForm(false);
  };

  const handleUpdatePrice = async (id: string, price_per_day: number) => {
    if (usingFallback) {
      setEquipment((prev) => prev.map((e) => (e.id === id ? { ...e, price_per_day } : e)));
    } else {
      try {
        await supabase.from('equipment_items').update({ price_per_day }).eq('id', id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateDeposit = async (id: string, deposit: number) => {
    if (usingFallback) {
      setEquipment((prev) => prev.map((e) => (e.id === id ? { ...e, deposit } : e)));
    } else {
      try {
        await supabase.from('equipment_items').update({ deposit }).eq('id', id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateQty = async (id: string, quantity_available: number) => {
    if (usingFallback) {
      setEquipment((prev) => prev.map((e) => (e.id === id ? { ...e, quantity_available } : e)));
    } else {
      try {
        await supabase.from('equipment_items').update({ quantity_available }).eq('id', id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (usingFallback) {
      setEquipment((prev) => prev.filter((e) => e.id !== id));
    } else {
      try {
        await supabase.from('equipment_items').delete().eq('id', id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (usingFallback) {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    } else {
      try {
        await supabase.from('equipment_bookings').update({ status }).eq('id', id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <NavigationBar />

      <div className="container-main max-w-5xl">
        {/* Header Block */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-medical-soft text-medical mb-4">
            <Truck className="w-4 h-4" />
            <span className="text-sm font-semibold">Medical Equipment Rentals</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-3">
            Rent Medical Equipment Nearby
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto text-sm md:text-base font-normal">
            Locate and rent wheelchairs, oxygen concentrators, hospital beds, and crutches near you instantly. Scan prescriptions for recommendations.
          </p>

          {/* Navigation Toggles */}
          {localStorage.getItem('resq-active-user-role') !== 'user' && (
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setActiveTab('search')}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm ${
                  activeTab === 'search'
                    ? 'bg-medical text-white'
                    : 'bg-surface border border-border/60 text-text-secondary hover:bg-surface-blue'
                }`}
              >
                Find Equipment
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm ${
                  activeTab === 'dashboard'
                    ? 'bg-medical text-white'
                    : 'bg-surface border border-border/60 text-text-secondary hover:bg-surface-blue'
                }`}
              >
                Vendor Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: FIND & BOOK */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            
            {/* AI Prescription Recommendation Block */}
            <div className="card p-6 border-medical/20 bg-medical-soft/10">
              <h3 className="text-base font-bold text-text-primary mb-1.5 flex items-center gap-2">
                <FileText className="w-5 h-5 text-medical" /> Scan Prescription / Report for Equipment Suggestions
              </h3>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                Upload a doctor's report, note, or prescription. Our AI suggests required tools (e.g. crutches, wheelchair) instantly.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Prescription text input */}
                <div className="md:col-span-2">
                  <textarea
                    rows={2}
                    value={scanNotes}
                    onChange={(e) => setScanNotes(e.target.value)}
                    placeholder="Describe symptoms/injuries (e.g. 'Patient has an ankle fracture' or 'Oxygen level fell to 88%')"
                    className="textarea-field text-xs font-normal"
                  />
                </div>
                {/* File Upload details */}
                <div className="md:col-span-1 flex flex-col justify-between gap-3">
                  <div className="relative border border-dashed border-border rounded-xl bg-background hover:bg-surface-blue/20 transition-all flex flex-col items-center justify-center py-2 h-14 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="w-4 h-4 text-text-muted mb-0.5" />
                    <span className="text-[10px] text-text-secondary font-semibold">
                      {scanImage ? 'Image Selected' : 'Upload Report Image'}
                    </span>
                  </div>
                  <button
                    onClick={handleScanPrescription}
                    disabled={isScanning || (!scanNotes.trim() && !scanImage)}
                    className="btn-primary !h-10 text-xs w-full flex items-center justify-center gap-2"
                  >
                    {isScanning ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Report'
                    )}
                  </button>
                </div>
              </div>

              {/* Scan Results rendering */}
              <AnimatePresence>
                {scanResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 border border-border/80 bg-background rounded-2xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary">AI Suggestion: {scanResult.suggestion}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-[10px] font-bold text-urgent border border-amber-200/50 uppercase tracking-wide">
                        AI Recommended
                      </span>
                    </div>
                    <p className="text-text-secondary leading-relaxed">{scanResult.rationale}</p>
                    <div className="flex flex-wrap gap-2 pt-1.5 items-center">
                      <span className="font-semibold text-text-muted">Target Filter:</span>
                      {scanResult.items.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSearchCategory(cat)}
                          className="px-2.5 py-0.5 rounded-full bg-medical-soft text-medical font-bold hover:underline"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Category filter list buttons */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
              {['All', 'Wheelchair', 'Concentrator', 'Cylinder', 'Bed', 'Walker', 'Crutches', 'CPAP'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSearchCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all border ${
                    searchCategory === cat
                      ? 'bg-medical text-white border-medical'
                      : 'bg-surface text-text-secondary border-border hover:bg-surface-blue'
                  }`}
                >
                  {cat === 'All' ? 'All Categories' : cat}
                </button>
              ))}
            </div>

            {/* Grid Search & Map Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Side: Results List */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search equipment..."
                    className="input-field pl-10 !h-10 text-xs font-normal"
                  />
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[500px] scrollbar-hide">
                  {searchResults.length === 0 ? (
                    <div className="card p-8 text-center text-text-secondary flex flex-col items-center justify-center border border-dashed border-border">
                      <ShoppingBag className="w-10 h-10 text-text-muted mb-3" />
                      <p className="text-sm font-semibold">No equipment available</p>
                      <p className="text-xs text-text-muted mt-1">Try changing categories or search query inputs.</p>
                    </div>
                  ) : (
                    searchResults.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-4 flex flex-col hover:shadow-sm border border-border/50 transition-shadow"
                      >
                        <div className="flex gap-3 mb-3">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-16 h-16 rounded-xl object-cover border border-border"
                          />
                          <div className="flex-1">
                            <h4 className="font-bold text-text-primary text-sm leading-snug">{item.name}</h4>
                            <span className="text-[10px] text-text-muted bg-surface px-2 py-0.5 rounded-full border border-border mt-1 inline-block font-semibold">
                              {item.category}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-text-secondary font-bold flex items-center gap-0.5">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {item.rating}
                              </span>
                              <span className="text-[10px] text-text-muted font-normal">• {item.vendorName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Pricing details and specs */}
                        <div className="grid grid-cols-2 gap-2 bg-surface p-2.5 rounded-xl border border-border/40 mb-3 text-xs">
                          <div>
                            <span className="text-[9px] text-text-secondary block">RENT PER DAY</span>
                            <span className="font-bold text-medical font-mono">₹{item.price_per_day}/day</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-text-secondary block">REFUNDABLE DEPOSIT</span>
                            <span className="font-bold text-text-primary font-mono">₹{item.deposit}</span>
                          </div>
                        </div>

                        {/* Info details */}
                        <div className="flex items-center justify-between text-[10px] text-text-muted mb-3.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {item.calculatedDistance} km
                          </span>
                          <span>
                            {item.quantity_available > 0 ? `🟢 Available: ${item.quantity_available}` : '🔴 Out of stock'}
                          </span>
                          <span>
                            {item.delivery_available ? '📦 Delivery' : '🏪 Self-pickup'}
                          </span>
                        </div>

                        {/* Booking buttons triggers */}
                        <button
                          disabled={item.quantity_available === 0}
                          onClick={() => setBookingItem(item)}
                          className="btn-primary !h-9 text-xs w-full flex items-center justify-center gap-1.5"
                        >
                          Book Rental
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Side: Map */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl h-[450px] lg:h-[620px] relative border border-border shadow-sm overflow-hidden z-0 bg-background">
                  <div ref={mapRef} className="w-full h-full" />
                  <div className="absolute top-4 left-4 z-[1000] flex gap-2">
                    <div className="card-float px-4 py-2 text-xs font-semibold text-text-primary flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-stable live-dot" />
                      Medical Store Partners
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: VENDOR CONSOLE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="card p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 pb-6 mb-6">
              <div>
                <h3 className="text-xl font-bold text-text-primary">
                  Rental Equipment Supplier Dashboard
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Manage medical tool catalog, modify lease rates, deposits, and approve or reject user booking requests.
                </p>
              </div>

              {/* Vendor select selector */}
              <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-xl border border-border">
                <Store className="w-4 h-4 text-text-secondary" />
                <select
                  value={selectedVendorId}
                  onChange={(e) => {
                    setSelectedVendorId(e.target.value);
                    setShowAddForm(false);
                    setEditingItemId(null);
                    setEditingPriceId(null);
                    setEditingDepositId(null);
                  }}
                  className="bg-transparent text-text-primary font-bold text-sm focus:outline-none cursor-pointer"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dashboard Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Manage Form catalog */}
              <div className="lg:col-span-1">
                <div className="p-5 rounded-2xl bg-surface border border-border">
                  <h4 className="font-bold text-text-primary text-base mb-4 flex items-center justify-between">
                    <span>Manage Inventory</span>
                    {!showAddForm && (
                      <button
                        onClick={() => {
                          setShowAddForm(true);
                          setEditingItemId(null);
                        }}
                        className="p-1.5 rounded-lg bg-medical-soft text-medical hover:bg-medical hover:text-white transition-all animate-pulse"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </h4>

                  {showAddForm ? (
                    <form onSubmit={handleAddEquipment} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Item Name</label>
                        <input
                          type="text"
                          required
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder="e.g. Standard Folding Wheelchair"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Category</label>
                        <select
                          value={newItemCategory}
                          onChange={(e) => setNewItemCategory(e.target.value)}
                          className="input-field cursor-pointer font-semibold"
                        >
                          {['Wheelchair', 'Concentrator', 'Cylinder', 'Bed', 'Walker', 'Crutches', 'CPAP'].map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Rent Per Day</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={newItemPrice}
                            onChange={(e) => setNewItemPrice(e.target.value)}
                            placeholder="₹ Price"
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Deposit</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={newItemDeposit}
                            onChange={(e) => setNewItemDeposit(e.target.value)}
                            placeholder="₹ Deposit"
                            className="input-field"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Total Quantity</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={newItemQty}
                            onChange={(e) => setNewItemQty(e.target.value)}
                            className="input-field"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <input
                            type="checkbox"
                            id="delivery-opt"
                            checked={newItemDelivery}
                            onChange={(e) => setNewItemDelivery(e.target.checked)}
                            className="w-4 h-4 text-medical rounded"
                          />
                          <label htmlFor="delivery-opt" className="text-xs text-text-primary font-semibold select-none">
                            Home Delivery
                          </label>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="flex-1 btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 btn-primary"
                        >
                          Save Item
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-6 text-text-secondary text-sm">
                      <Truck className="w-12 h-12 text-text-muted mx-auto mb-3" />
                      <p>Select your store, click <span className="font-semibold text-medical inline-flex items-center gap-0.5"><Plus className="w-3.5 h-3.5"/> Add</span>, and manage your rentals catalog.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Manage Equipment items catalog and active booking lists */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Booking Requests Manager */}
                <div className="rounded-2xl border border-border p-4 bg-surface/50">
                  <h4 className="font-bold text-text-primary text-base mb-4 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-medical" /> Rental Booking Requests
                  </h4>
                  <div className="space-y-3">
                    {dashboardBookings.length === 0 ? (
                      <p className="text-xs text-text-secondary text-center py-6">No booking requests found.</p>
                    ) : (
                      dashboardBookings.map((b) => (
                        <div key={b.id} className="p-4 rounded-xl border border-border bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-text-primary text-sm">{b.itemName}</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                b.status === 'approved' ? 'bg-green-50 text-stable' : b.status === 'rejected' ? 'bg-red-50 text-emergency' : 'bg-amber-50 text-urgent'
                              }`}>
                                {b.status}
                              </span>
                            </div>
                            <div className="text-xs text-text-secondary mt-1.5 space-y-0.5">
                              <div>Renter: <span className="font-semibold text-text-primary">{b.patient_name}</span></div>
                              <div>Dates: <span className="font-mono">{b.start_date} to {b.end_date}</span></div>
                              <div>Receipt Total: <span className="font-mono font-bold text-medical">₹{b.total_price}</span></div>
                            </div>
                          </div>

                          {/* Approval Controls */}
                          {b.status === 'pending' && (
                            <div className="flex gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'rejected')}
                                className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg border border-emergency/35 text-emergency text-xs font-semibold hover:bg-emergency-soft transition-all"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'approved')}
                                className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-stable text-white text-xs font-semibold hover:bg-stable-dark transition-all"
                              >
                                Approve
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Catalog Table */}
                <div className="rounded-2xl border border-border overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface border-b border-border text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                        <th className="py-4 px-6">Equipment Name</th>
                        <th className="py-4 px-6 text-center">Rent/Day</th>
                        <th className="py-4 px-6 text-center">Deposit</th>
                        <th className="py-4 px-6 text-center">Qty Available</th>
                        <th className="py-4 px-6 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-text-secondary text-sm">
                            No catalog items found. Add items to list them for rent.
                          </td>
                        </tr>
                      ) : (
                        dashboardItems.map((e) => (
                          <tr key={e.id} className="border-b border-border/50 hover:bg-surface-blue/10 transition-colors text-xs">
                            <td className="py-4 px-6">
                              <div className="font-bold text-text-primary text-sm">{e.name}</div>
                              <div className="text-[10px] text-text-muted mt-0.5">
                                {e.quantity_available > 0 ? '🟢 Active listing' : '🔴 Out of stock warning'}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              {editingPriceId === e.id ? (
                                <input
                                  type="number"
                                  defaultValue={e.price_per_day}
                                  step="5"
                                  onBlur={(evt) => {
                                    handleUpdatePrice(e.id, parseFloat(evt.target.value) || e.price_per_day);
                                    setEditingPriceId(null);
                                  }}
                                  onKeyDown={(evt) => {
                                    if (evt.key === 'Enter') {
                                      handleUpdatePrice(e.id, parseFloat((evt.target as HTMLInputElement).value) || e.price_per_day);
                                      setEditingPriceId(null);
                                    }
                                  }}
                                  className="w-16 h-8 text-center text-xs font-mono border border-border bg-background rounded-lg text-text-primary focus:outline-none focus:border-medical"
                                  autoFocus
                                />
                              ) : (
                                <button
                                  onClick={() => setEditingPriceId(e.id)}
                                  className="font-mono text-sm font-bold text-text-primary hover:text-medical transition-colors"
                                  title="Click to Edit Price"
                                >
                                  ₹{e.price_per_day}
                                </button>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center">
                              {editingDepositId === e.id ? (
                                <input
                                  type="number"
                                  defaultValue={e.deposit}
                                  step="50"
                                  onBlur={(evt) => {
                                    handleUpdateDeposit(e.id, parseFloat(evt.target.value) || e.deposit);
                                    setEditingDepositId(null);
                                  }}
                                  onKeyDown={(evt) => {
                                    if (evt.key === 'Enter') {
                                      handleUpdateDeposit(e.id, parseFloat((evt.target as HTMLInputElement).value) || e.deposit);
                                      setEditingDepositId(null);
                                    }
                                  }}
                                  className="w-16 h-8 text-center text-xs font-mono border border-border bg-background rounded-lg text-text-primary focus:outline-none focus:border-medical"
                                  autoFocus
                                />
                              ) : (
                                <button
                                  onClick={() => setEditingDepositId(e.id)}
                                  className="font-mono text-sm font-bold text-text-primary hover:text-medical transition-colors"
                                  title="Click to Edit Deposit"
                                >
                                  ₹{e.deposit}
                                </button>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleUpdateQty(e.id, Math.max(0, e.quantity_available - 1))}
                                  className="w-7 h-7 rounded-lg bg-surface border border-border hover:bg-surface-blue flex items-center justify-center text-text-secondary font-bold text-sm"
                                >
                                  -
                                </button>
                                <span className="w-10 font-bold font-mono text-text-primary text-sm">
                                  {e.quantity_available}
                                </span>
                                <button
                                  onClick={() => handleUpdateQty(e.id, e.quantity_available + 1)}
                                  className="w-7 h-7 rounded-lg bg-surface border border-border hover:bg-surface-blue flex items-center justify-center text-text-secondary font-bold text-sm"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingPriceId(e.id);
                                    setEditingDepositId(e.id);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-text-secondary transition-all"
                                  title="Edit Item Info"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEquipment(e.id)}
                                  className="p-1.5 rounded-lg bg-red-50 hover:bg-emergency-soft text-emergency transition-all"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          </div>
        )}
      </div>

      {/* Booking Config Drawer Overlay */}
      <AnimatePresence>
        {bookingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card bg-background max-w-md w-full p-6 md:p-8 border border-border shadow-card relative overflow-hidden"
            >
              <button
                onClick={() => setBookingItem(null)}
                className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-medical" /> Book Rental: {bookingItem.name}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Patient / Renter Name</label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter full name"
                    className="input-field text-xs font-normal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="input-field text-xs font-normal cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="input-field text-xs font-normal cursor-pointer"
                    />
                  </div>
                </div>

                {bookingItem.delivery_available && (
                  <div className="flex items-center gap-2 py-2">
                    <input
                      type="checkbox"
                      id="opt-delivery"
                      checked={optDelivery}
                      onChange={(e) => setOptDelivery(e.target.checked)}
                      className="w-4 h-4 text-medical rounded"
                    />
                    <label htmlFor="opt-delivery" className="text-xs text-text-primary font-semibold select-none">
                      Opt-in for home delivery (Additional ₹250 fee)
                    </label>
                  </div>
                )}

                {/* Digital Receipt breakdown panel */}
                {computedReceipt && (
                  <div className="p-4 rounded-xl bg-surface border border-border text-xs space-y-2">
                    <h4 className="font-bold text-text-primary uppercase tracking-wider text-[10px] mb-2">Rental Receipt Summary</h4>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Duration:</span>
                      <span className="font-bold text-text-primary">{computedReceipt.days} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Rental Total (₹{bookingItem.price_per_day}/day):</span>
                      <span className="font-semibold text-text-primary font-mono">₹{computedReceipt.rentalTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Security Deposit (Refundable):</span>
                      <span className="font-semibold text-text-primary font-mono">₹{computedReceipt.deposit}</span>
                    </div>
                    {optDelivery && bookingItem.delivery_available && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Home Delivery Charge:</span>
                        <span className="font-semibold text-text-primary font-mono">₹{computedReceipt.deliveryFee}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-border pt-2 font-bold text-sm">
                      <span className="text-text-primary">Grand Total:</span>
                      <span className="text-medical font-mono">₹{computedReceipt.grandTotal}</span>
                    </div>
                  </div>
                )}

                <button
                  disabled={!patientName.trim() || !startDate || !endDate || !computedReceipt}
                  onClick={handleConfirmBooking}
                  className="w-full btn-primary h-12 rounded-full font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  Confirm Booking Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmed Receipt popup modal */}
      <AnimatePresence>
        {confirmedReceipt && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card bg-background max-w-sm w-full p-6 md:p-8 border border-border text-center shadow-card relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-10 h-10 text-stable" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Booking Requested!</h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-6">
                Your request to lease <b>{confirmedReceipt.itemName}</b> from <b>{confirmedReceipt.vendorName}</b> is pending. Check status updates in your console.
              </p>

              {/* Printable receipt */}
              <div className="p-4 rounded-2xl bg-surface border border-dashed border-border/80 text-left text-xs mb-6 space-y-1.5 font-mono">
                <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest text-center border-b border-border/60 pb-2 mb-2">ResQ Digital Receipt</div>
                <div>ID: {confirmedReceipt.id}</div>
                <div>Renter: {confirmedReceipt.patient_name}</div>
                <div>Start: {confirmedReceipt.start_date}</div>
                <div>End: {confirmedReceipt.end_date}</div>
                <div className="border-t border-border/50 pt-2 font-bold flex justify-between">
                  <span>Grand Total:</span>
                  <span className="text-medical">₹{confirmedReceipt.total_price}</span>
                </div>
              </div>

              <button
                onClick={() => setConfirmedReceipt(null)}
                className="w-full btn-primary h-12 rounded-full font-bold"
              >
                Dismiss Receipt
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
