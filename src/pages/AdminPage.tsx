import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  UserCheck, ShieldAlert, Store, Stethoscope, Truck, 
  MapPin, Phone, Lock, Eye, EyeOff, CheckCircle2, UserPlus, LogIn
} from 'lucide-react';
import NavigationBar from '@/components/Navigation';
import { supabase } from '@/lib/supabase';

type ProviderType = 'pharmacy' | 'doctor' | 'ambulance' | 'equipment';

export default function AdminPage() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [providerType, setProviderType] = useState<ProviderType>('pharmacy');

  // Common Inputs
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pharmacy / Equipment Vendor Fields
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('15.8497');
  const [longitude, setLongitude] = useState('74.4977');

  // Doctor Fields
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('General Physician');
  const [meetUrl, setMeetUrl] = useState('https://meet.google.com/abc-defg-hij');

  // Ambulance Fields
  const [driverName, setDriverName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [ambulanceType, setAmbulanceType] = useState<'bls' | 'als' | 'icu'>('bls');

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const latVal = parseFloat(latitude) || 15.8497;
    const lngVal = parseFloat(longitude) || 74.4977;
    const mockId = `reg-${Date.now()}`;

    try {
      if (authMode === 'signup') {
        if (providerType === 'pharmacy') {
          if (!shopName.trim() || !address.trim() || !phone) throw new Error('Fill in all fields');
          
          // Write to DB
          let dbId = mockId;
          try {
            const { data, error } = await supabase.from('medical_stores').insert({
              name: shopName.trim(),
              phone,
              latitude: latVal,
              longitude: lngVal,
              address: address.trim(),
            }).select().single();
            if (error) throw error;
            if (data) dbId = data.id;
          } catch (dbErr) {
            console.warn('DB Insert failed, using offline fallback:', dbErr);
          }

          // Write to LocalStorage fallback
          const newStore = { id: dbId, name: shopName.trim(), phone, latitude: latVal, longitude: lngVal, address: address.trim() };
          const stored = localStorage.getItem('resq-registered-stores');
          const list = stored ? JSON.parse(stored) : [];
          list.push(newStore);
          localStorage.setItem('resq-registered-stores', JSON.stringify(list));

          localStorage.setItem('resq-active-store-id', dbId);
          setStatusMessage({ type: 'success', text: 'Pharmacy registered successfully! Redirecting...' });
          setTimeout(() => navigate('/pharmacy'), 1500);

        } else if (providerType === 'doctor') {
          if (!doctorName.trim() || !specialty.trim() || !meetUrl.trim()) throw new Error('Fill in all fields');

          let dbId = mockId;
          try {
            const { data, error } = await supabase.from('doctors').insert({
              name: doctorName.trim(),
              specialty: specialty.trim(),
              meet_url: meetUrl.trim(),
              status: 'available',
              avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
            }).select().single();
            if (error) throw error;
            if (data) dbId = data.id;
          } catch (dbErr) {
            console.warn('DB Insert failed, using offline fallback:', dbErr);
          }

          const newDoctor = { 
            id: dbId, 
            name: doctorName.trim(), 
            specialty: specialty.trim(), 
            meetUrl: meetUrl.trim(),
            status: 'available',
            avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'
          };
          const stored = localStorage.getItem('resq-registered-doctors');
          const list = stored ? JSON.parse(stored) : [];
          list.push(newDoctor);
          localStorage.setItem('resq-registered-doctors', JSON.stringify(list));

          setStatusMessage({ type: 'success', text: 'Doctor profile registered successfully! Redirecting...' });
          setTimeout(() => navigate('/consult'), 1500);

        } else if (providerType === 'ambulance') {
          if (!driverName.trim() || !vehicleNumber.trim() || !phone) throw new Error('Fill in all fields');

          let dbId = mockId;
          try {
            const { data, error } = await supabase.from('ambulances').insert({
              driver_name: driverName.trim(),
              vehicle_number: vehicleNumber.trim(),
              phone,
              latitude: latVal,
              longitude: lngVal,
              status: 'available',
              type: ambulanceType,
            }).select().single();
            if (error) throw error;
            if (data) dbId = data.id;
          } catch (dbErr) {
            console.warn('DB Insert failed, using offline fallback:', dbErr);
          }

          const newAmbulance = {
            id: dbId,
            driverName: driverName.trim(),
            vehicleNumber: vehicleNumber.trim(),
            phone,
            latitude: latVal,
            longitude: lngVal,
            status: 'available',
            type: ambulanceType,
          };
          const stored = localStorage.getItem('resq-registered-ambulances');
          const list = stored ? JSON.parse(stored) : [];
          list.push(newAmbulance);
          localStorage.setItem('resq-registered-ambulances', JSON.stringify(list));

          setStatusMessage({ type: 'success', text: 'Ambulance service registered successfully! Redirecting...' });
          setTimeout(() => navigate('/map'), 1500);

        } else if (providerType === 'equipment') {
          if (!shopName.trim() || !address.trim() || !phone) throw new Error('Fill in all fields');

          let dbId = mockId;
          try {
            const { data, error } = await supabase.from('equipment_vendors').insert({
              name: shopName.trim(),
              phone,
              latitude: latVal,
              longitude: lngVal,
              address: address.trim(),
              rating: 4.8,
            }).select().single();
            if (error) throw error;
            if (data) dbId = data.id;
          } catch (dbErr) {
            console.warn('DB Insert failed, using offline fallback:', dbErr);
          }

          const newVendor = { id: dbId, name: shopName.trim(), phone, latitude: latVal, longitude: lngVal, address: address.trim(), rating: 4.8 };
          const stored = localStorage.getItem('resq-registered-vendors');
          const list = stored ? JSON.parse(stored) : [];
          list.push(newVendor);
          localStorage.setItem('resq-registered-vendors', JSON.stringify(list));

          localStorage.setItem('resq-active-vendor-id', dbId);
          setStatusMessage({ type: 'success', text: 'Rental Store registered successfully! Redirecting...' });
          setTimeout(() => navigate('/rentals'), 1500);
        }
      } else {
        // Log in flow simulator
        if (!phone || !password) throw new Error('Enter phone/name and credentials password');
        
        setStatusMessage({ type: 'success', text: 'Authentication successful! Redirecting to Console...' });
        
        setTimeout(() => {
          if (providerType === 'doctor') navigate('/consult');
          else if (providerType === 'pharmacy') navigate('/pharmacy');
          else if (providerType === 'equipment') navigate('/rentals');
          else navigate('/map');
        }, 1200);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Authentication action failed. Try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 flex flex-col justify-between">
      <NavigationBar />

      <div className="container-main max-w-md w-full mx-auto px-6 py-8">
        
        {/* Card portal */}
        <div className="card p-6 md:p-8 border border-border shadow-card relative overflow-hidden">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-medical-soft text-medical flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">
              {authMode === 'login' ? 'Provider Login' : 'Provider Sign Up'}
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Access the ResQ Emergency Ecosystem consoles.
            </p>

            {/* Login / Sign Up tab buttons */}
            <div className="flex bg-surface rounded-lg p-1 mt-6 border border-border">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setStatusMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  authMode === 'login'
                    ? 'bg-background text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" /> Login
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setStatusMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  authMode === 'signup'
                    ? 'bg-background text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Sign Up
              </button>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Provider Type selector */}
            <div>
              <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
                Select Service Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'pharmacy', icon: Store, label: 'Pharmacy' },
                  { id: 'doctor', icon: Stethoscope, label: 'Doctor' },
                  { id: 'ambulance', icon: Truck, label: 'Ambulance' },
                  { id: 'equipment', icon: Truck, label: 'Equipment' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setProviderType(item.id as ProviderType)}
                      className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                        providerType === item.id
                          ? 'border-medical bg-medical-soft/20 text-medical'
                          : 'border-border bg-surface text-text-secondary hover:bg-surface-blue/20'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom fields for Sign Up Mode */}
            {authMode === 'signup' && (
              <>
                {/* Pharmacy / Equipment Provider */}
                {(providerType === 'pharmacy' || providerType === 'equipment') && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Shop Name</label>
                      <input
                        type="text"
                        required
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="e.g. Belgaum Drug House"
                        className="input-field text-xs font-normal"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Address</label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Maratha Mandir Road, Belgaum"
                        className="input-field text-xs font-normal"
                      />
                    </div>
                  </>
                )}

                {/* Doctor Fields */}
                {providerType === 'doctor' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Doctor Name</label>
                      <input
                        type="text"
                        required
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        placeholder="e.g. Dr. John Doe"
                        className="input-field text-xs font-normal"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Specialty</label>
                      <select
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        className="input-field text-xs font-semibold cursor-pointer"
                      >
                        {['General Physician', 'Cardiologist', 'Pediatrician', 'Trauma Specialist', 'Orthopedic'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Google Meet Link</label>
                      <input
                        type="url"
                        required
                        value={meetUrl}
                        onChange={(e) => setMeetUrl(e.target.value)}
                        className="input-field text-xs font-normal font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Ambulance Fields */}
                {providerType === 'ambulance' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Driver Name</label>
                      <input
                        type="text"
                        required
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="e.g. Amit Deshpande"
                        className="input-field text-xs font-normal"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Vehicle Number</label>
                        <input
                          type="text"
                          required
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value)}
                          placeholder="e.g. KA-22-M-1234"
                          className="input-field text-xs font-normal uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Ambulance Type</label>
                        <select
                          value={ambulanceType}
                          onChange={(e) => setAmbulanceType(e.target.value as any)}
                          className="input-field text-xs font-semibold cursor-pointer"
                        >
                          <option value="bls">Basic (BLS)</option>
                          <option value="als">Advanced (ALS)</option>
                          <option value="icu">ICU Ambulance</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Location Coordinates fields for Geolocations */}
                {(providerType === 'pharmacy' || providerType === 'ambulance' || providerType === 'equipment') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Latitude</label>
                      <input
                        type="text"
                        required
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        className="input-field text-xs font-normal font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Longitude</label>
                      <input
                        type="text"
                        required
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        className="input-field text-xs font-normal font-mono"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Standard login fields */}
            <div>
              <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
                {authMode === 'login' ? 'Phone / Username' : 'Contact Phone'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter contact number"
                  className="input-field pl-10 text-xs font-normal"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Password / Security Code</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 text-xs font-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Status alerts */}
            {statusMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                statusMessage.type === 'success' ? 'bg-green-50 text-stable border border-green-200' : 'bg-red-50 text-emergency border border-red-200'
              }`}>
                {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <ShieldAlert className="w-4 h-4 flex-shrink-0" />}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary h-12 rounded-full font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : authMode === 'login' ? (
                'Log In to Console'
              ) : (
                'Register & Setup Console'
              )}
            </button>

          </form>

        </div>

      </div>
    </div>
  );
}
