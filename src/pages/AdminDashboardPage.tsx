import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Users, Stethoscope, Store, Truck, LayoutDashboard, 
  Settings, LogOut, CheckCircle2, XCircle, Plus, Edit, Trash2, 
  Search, ShieldAlert, BarChart3, Package, Calendar, HeartPulse, DollarSign,
  Bell, ExternalLink, Clock, Loader2
} from 'lucide-react';
import NavigationBar from '@/components/Navigation';
import { supabase } from '@/lib/supabase';
import type { Appointment } from '@/types';

// Mock values for visual analytics charts
const ANALYTICS_DATA = {
  monthlyRevenue: [
    { month: 'Jan', amount: 45000 },
    { month: 'Feb', amount: 52000 },
    { month: 'Mar', amount: 49000 },
    { month: 'Apr', amount: 63000 },
    { month: 'May', amount: 58000 },
    { month: 'Jun', amount: 71000 },
  ],
  occupancyStats: [
    { hospital: 'KLES Prabhakar Kore', beds: 95, color: 'bg-medical' },
    { hospital: 'BIMS Institute', beds: 160, color: 'bg-emerald-500' },
    { hospital: 'Lakeview Goaves', beds: 38, color: 'bg-amber-500' },
    { hospital: 'Arihant Clinic', beds: 30, color: 'bg-urgent' },
  ]
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'doctors' | 'equipment' | 'pharmacies' | 'hospitals' | 'ambulances'>('analytics');
  
  // Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isDbOnline, setIsDbOnline] = useState(false);

  // ── Realtime appointment notification state ──────────────────
  const [incomingAppt, setIncomingAppt] = useState<Appointment | null>(null);
  const [apptNotifQueue, setApptNotifQueue] = useState<Appointment[]>([]);
  const apptChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const [acceptingConsultId, setAcceptingConsultId] = useState<string | null>(null);

  // Form States (Generic Add dialogs)
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<'doctor' | 'equipment' | 'vendor' | 'hospital' | 'ambulance'>('doctor');

  // Input states for form submissions
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('General Physician');
  const [docMeet, setDocMeet] = useState('https://meet.google.com/abc-defg-hij');
  
  const [eqName, setEqName] = useState('');
  const [eqPrice, setEqPrice] = useState('');
  const [eqQty, setEqQty] = useState('');

  const [venName, setVenName] = useState('');
  const [venPhone, setVenPhone] = useState('');
  const [venAddress, setVenAddress] = useState('');

  const [hosName, setHosName] = useState('');
  const [hosBeds, setHosBeds] = useState('');
  const [hosPhone, setHosPhone] = useState('');

  const [ambDriver, setAmbDriver] = useState('');
  const [ambPhone, setAmbPhone] = useState('');
  const [ambPlate, setAmbPlate] = useState('');

  const loadAllAdminData = async () => {
    try {
      // 1. Fetch Orders
      const { data: dbOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (dbOrders) setOrders(dbOrders);

      // 2. Fetch Doctors
      const { data: dbDocs } = await supabase.from('doctors').select('*');
      if (dbDocs) setDoctors(dbDocs);

      // 3. Fetch Equipment Items
      const { data: dbEq } = await supabase.from('equipment_items').select('*');
      if (dbEq) setEquipment(dbEq);

      // 4. Fetch Vendors
      const { data: dbVendors } = await supabase.from('equipment_vendors').select('*');
      if (dbVendors) setVendors(dbVendors);

      // 5. Fetch Hospitals
      const { data: dbHospitals } = await supabase.from('hospital_cases').select('*');
      if (dbHospitals) setHospitals(dbHospitals);

      // 6. Fetch Ambulances
      const { data: dbAmbs } = await supabase.from('ambulances').select('*');
      if (dbAmbs) setAmbulances(dbAmbs);

      // 7. Fetch Consultations
      const { data: dbConsults } = await supabase.from('consultations').select('*').order('created_at', { ascending: false });
      if (dbConsults) {
        setConsultations(dbConsults);
      } else {
        setConsultations([
          { id: 'c-1', doctor_name: 'Dr. James Wilson', patient_name: 'Patient Mansi', status: 'pending', created_at: new Date().toISOString() }
        ]);
      }

      setIsDbOnline(true);
    } catch (err) {
      console.warn('DB error, using fallback configurations:', err);
      setConsultations([
        { id: 'c-1', doctor_name: 'Dr. James Wilson', patient_name: 'Patient Mansi', status: 'pending', created_at: new Date().toISOString() }
      ]);
      setIsDbOnline(false);
    }
  };

  useEffect(() => {
    const userRole = localStorage.getItem('resq-active-user-role') || 'user';
    if (userRole === 'user') {
      navigate('/user-dashboard');
      return;
    }

    loadAllAdminData();
    setupAppointmentsRealtime();

    // ── BroadcastChannel: receive from patient tab ────────────
    const bc = new BroadcastChannel('resq-consultations');
    bcRef.current = bc;
    bc.onmessage = (event) => {
      const msg = event.data;
      console.log('[Admin] BroadcastChannel message:', msg);
      if (msg.type === 'NEW_CONSULTATION') {
        const consult = msg.consultation;
        playNotificationBeep();
        setConsultations(prev => [consult, ...prev.filter(c => c.id !== consult.id)]);
        setApptNotifQueue(prev => [...prev, consult]);
      }
    };

    return () => {
      if (apptChannelRef.current) supabase.removeChannel(apptChannelRef.current);
      bc.close();
      bcRef.current = null;
    };
  }, []);

  // Show next notification from queue whenever current one is dismissed
  useEffect(() => {
    if (!incomingAppt && apptNotifQueue.length > 0) {
      setIncomingAppt(apptNotifQueue[0]);
      setApptNotifQueue(prev => prev.slice(1));
    }
  }, [incomingAppt, apptNotifQueue]);

  // ── Notification beep ─────────────────────────────────────────
  const playNotificationBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch (_) {}
  };

  // ── Supabase Realtime: Listen for new pending appointments ────
  const setupAppointmentsRealtime = () => {
    if (apptChannelRef.current) supabase.removeChannel(apptChannelRef.current);

    const channel = supabase
      .channel('admin-consultations-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'consultations' },
        (payload) => {
          const consult = payload.new as any;
          console.log('[Admin] Supabase: New consultation received:', consult);
          if (consult.status === 'pending') {
            playNotificationBeep();
            setConsultations(prev => [consult, ...prev.filter(c => c.id !== consult.id)]);
            setApptNotifQueue(prev => [...prev, consult]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'consultations' },
        (payload) => {
          const consult = payload.new as any;
          setConsultations(prev => prev.map(c => c.id === consult.id ? consult : c));
          if (incomingAppt?.id === consult.id) setIncomingAppt(consult);
        }
      )
      .subscribe((status) => {
        console.log('[Admin] Supabase consultations realtime status:', status);
      });

    apptChannelRef.current = channel;
  };

  const loadAppointments = async () => {
    // Left as no-op since loadAllAdminData handles fetching consultations
  };

  // Update order status trigger
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      
      // Sync in localStorage orders if fallback exists
      const localOrders = localStorage.getItem('resq-medicine-orders');
      if (localOrders) {
        const parsed = JSON.parse(localOrders);
        const updated = parsed.map((o: any) => o.id === orderId ? { ...o, status: newStatus } : o);
        localStorage.setItem('resq-medicine-orders', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleApproveConsultation = async (consult: any) => {
    setAcceptingConsultId(consult.id);
    try {
      // 1. Invoke Supabase Edge Function to create Google Meet space
      const { data, error } = await supabase.functions.invoke('create-meet-space', {
        body: {
          consultation_id: consult.id,
          doctor_id: consult.doctor_id
        }
      });

      if (error || !data || !data.meet_link) {
        throw new Error(error?.message || 'Failed to create Google Meet space.');
      }

      // 2. Set doctor status to busy in database
      await supabase.from('doctors').update({ status: 'busy' }).eq('id', consult.doctor_id);

      // 3. Update local state
      const updatedConsult = { 
        ...consult, 
        status: 'accepted' as const, 
        meet_link: data.meet_link, 
        meet_status: 'created' 
      };
      setConsultations(prev => prev.map(c => c.id === consult.id ? updatedConsult : c));

      // Broadcast to patient tab via BroadcastChannel fallback
      if (bcRef.current) {
        bcRef.current.postMessage({
          type: 'APPOINTMENT_UPDATED',
          appointment: {
            id: consult.id,
            status: 'accepted',
            meet_link: data.meet_link
          }
        });
      }

      alert(`Consultation approved! Google Meet link generated successfully.`);
    } catch (err: any) {
      console.error('Error invoking Edge Function:', err);
      
      const isNetworkError = err.message?.includes('Failed to send a request') || err.message?.includes('fetch');
      
      if (isNetworkError) {
        const confirmMock = confirm(
          `Supabase Edge Function is unreachable or has not been deployed yet.\n\n` +
          `To deploy it to your remote Supabase project, run:\n` +
          `supabase functions deploy create-meet-space\n\n` +
          `Would you like to fallback to a mock Google Meet URL for local testing?`
        );
        
        if (confirmMock) {
          const mockMeetLink = `https://meet.google.com/abc-defg-hij`;
          
          try {
            // Update database row directly to bypass Edge Function call
            await supabase
              .from('consultations')
              .update({
                status: 'accepted',
                meet_link: mockMeetLink,
                meet_status: 'created',
                meeting_created_at: new Date().toISOString()
              })
              .eq('id', consult.id);

            await supabase.from('doctors').update({ status: 'busy' }).eq('id', consult.doctor_id);

            const updatedMockConsult = {
              ...consult,
              status: 'accepted' as const,
              meet_link: mockMeetLink,
              meet_status: 'created'
            };
            setConsultations(prev => prev.map(c => c.id === consult.id ? updatedMockConsult : c));

            if (bcRef.current) {
              bcRef.current.postMessage({
                type: 'APPOINTMENT_UPDATED',
                appointment: {
                  id: consult.id,
                  status: 'accepted',
                  meet_link: mockMeetLink
                }
              });
            }
            return;
          } catch (dbErr: any) {
            alert(`Fallback failed: ${dbErr.message}`);
          }
        }
      } else {
        alert(`Failed to approve consultation: ${err.message || err}`);
      }
    } finally {
      setAcceptingConsultId(null);
    }
  };

  const handleRejectConsultation = async (consultId: string) => {
    try {
      await supabase.from('consultations').update({ status: 'rejected' }).eq('id', consultId);
      setConsultations(prev => prev.map(c => c.id === consultId ? { ...c, status: 'rejected' } : c));
      
      // Broadcast to patient tab via BroadcastChannel fallback
      if (bcRef.current) {
        bcRef.current.postMessage({
          type: 'APPOINTMENT_UPDATED',
          appointment: {
            id: consultId,
            status: 'rejected'
          }
        });
      }
    } catch (err) {
      console.error('Error rejecting consultation:', err);
      setConsultations(prev => prev.map(c => c.id === consultId ? { ...c, status: 'rejected' } : c));
    }
  };

  // ── Accept appointment (Alias for popup support) ─────────────
  const handleAcceptAppointment = async (appt: any) => {
    setIncomingAppt(null);
    await handleApproveConsultation(appt);
  };

  // ── Reject appointment (Alias for popup support) ─────────────
  const handleRejectAppointment = async (appt: any) => {
    setIncomingAppt(null);
    await handleRejectConsultation(appt.id);
  };

  // Generic Submit for additions
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formType === 'doctor') {
        const { error } = await supabase.from('doctors').insert({
          name: docName,
          specialty: docSpecialty,
          meet_url: docMeet,
          status: 'available',
          avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'
        });
        if (!error) loadAllAdminData();
      } else if (formType === 'equipment') {
        const { error } = await supabase.from('equipment_items').insert({
          name: eqName,
          category: 'Concentrator',
          price_per_day: parseFloat(eqPrice) || 500,
          quantity_available: parseInt(eqQty) || 1,
          vendor_id: 'a1a4f6d7-8910-1112-1314-151617181920'
        });
        if (!error) loadAllAdminData();
      } else if (formType === 'vendor') {
        const { error } = await supabase.from('equipment_vendors').insert({
          name: venName,
          phone: venPhone,
          address: venAddress,
          latitude: 15.8497,
          longitude: 74.4977
        });
        if (!error) loadAllAdminData();
      } else if (formType === 'hospital') {
        const { error } = await supabase.from('hospital_cases').insert({
          name: hosName,
          total_beds: parseInt(hosBeds) || 100,
          available_beds: parseInt(hosBeds) || 50,
          phone: hosPhone,
          er_status: 'open'
        });
        if (!error) loadAllAdminData();
      } else if (formType === 'ambulance') {
        const { error } = await supabase.from('ambulances').insert({
          driver_name: ambDriver,
          phone: ambPhone,
          vehicle_number: ambPlate,
          status: 'available',
          type: 'bls',
          latitude: 15.8497,
          longitude: 74.4977
        });
        if (!error) loadAllAdminData();
      }
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Total summary computed values
  const stats = useMemo(() => {
    return {
      revenue: orders.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0) + 12400,
      activeDoctors: doctors.filter(d => d.status === 'available').length,
      pendingOrders: orders.filter(o => o.status === 'Pending').length,
      ambulancesCount: ambulances.length || 5
    };
  }, [orders, doctors, ambulances]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 flex flex-col justify-between">
      <NavigationBar />

      {/* ── Realtime Appointment Notification Popup ─────────────── */}
      <AnimatePresence>
        {incomingAppt && (
          <motion.div
            key={incomingAppt.id}
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed top-24 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] shadow-2xl rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-medical px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-white animate-bounce" />
                <span className="text-sm font-bold text-white">New Consultation Request</span>
              </div>
              <button
                onClick={() => setIncomingAppt(null)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="bg-white dark:bg-surface p-4 border border-medical/20 border-t-0 rounded-b-2xl">
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-text-muted flex-shrink-0" />
                  <span className="font-semibold text-text-primary">{incomingAppt.patient_name}</span>
                </div>
                {incomingAppt.patient_email && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="w-4 h-4 flex-shrink-0" />
                    <span>{incomingAppt.patient_email}</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-text-secondary leading-relaxed">
                    <span className="font-medium text-text-primary">Symptoms: </span>
                    {incomingAppt.symptoms}
                  </p>
                </div>
                <div className="text-[10px] text-text-muted">
                  Received {new Date(incomingAppt.created_at).toLocaleTimeString()}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptAppointment(incomingAppt)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold h-9 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                </button>
                <button
                  onClick={() => handleRejectAppointment(incomingAppt)}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold h-9 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>

              {/* Queue counter */}
              {apptNotifQueue.length > 0 && (
                <p className="text-[10px] text-text-muted text-center mt-2">
                  +{apptNotifQueue.length} more request{apptNotifQueue.length > 1 ? 's' : ''} in queue
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container-main max-w-7xl w-full mx-auto px-6 flex-1">
        
        {/* Top Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
              Master Admin Command Center
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Admin console workspace for ResQ inventories, orders, ambulance bookings, doctors, and hospitals.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFormType('doctor');
                setShowAddForm(true);
              }}
              className="btn-primary !h-10 px-4 text-xs flex items-center gap-1.5 rounded-full"
            >
              <Plus className="w-3.5 h-3.5" /> Add Doctor
            </button>
            <button
              onClick={() => {
                setFormType('equipment');
                setShowAddForm(true);
              }}
              className="btn-secondary !h-10 px-4 text-xs flex items-center gap-1.5 rounded-full"
            >
              <Plus className="w-3.5 h-3.5" /> Add Equipment
            </button>
          </div>
        </div>

        {/* Dashboard Grid Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sticky Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="card p-4 space-y-1 sticky top-28 border border-border">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block px-3 mb-2">
                Operations Menu
              </span>
              {[
                { id: 'analytics', icon: BarChart3, label: 'Control Analytics' },
                { id: 'orders', icon: Package, label: 'Medicine Orders' },
                { id: 'doctors', icon: Stethoscope, label: 'Doctor Listings' },
                { id: 'equipment', icon: Truck, label: 'Rentals Equipment' },
                { id: 'pharmacies', icon: Store, label: 'Participating Vendors' },
                { id: 'hospitals', icon: HeartPulse, label: 'Hospitals Registry' },
                { id: 'ambulances', icon: Truck, label: 'Ambulance Fleets' },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full py-2.5 px-3.5 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-2.5 ${
                      activeTab === tab.id
                        ? 'bg-medical text-white shadow-sm'
                        : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
              
              <button
                onClick={() => {
                  localStorage.removeItem('resq-admin-logged-in');
                  localStorage.removeItem('resq-active-user-name');
                  localStorage.removeItem('resq-active-user-email');
                  localStorage.removeItem('resq-active-user-role');
                  navigate('/');
                }}
                className="w-full py-2.5 px-3.5 mt-4 rounded-xl text-left text-xs font-bold text-emergency hover:bg-emergency-soft/20 border border-emergency/10 transition-all flex items-center gap-2.5"
              >
                <LogOut className="w-4 h-4" />
                Sign Out Console
              </button>
            </div>
          </div>

          {/* Main Workspace Content Area */}
          <div className="lg:col-span-3">

            {/* TAB 1: ANALYTICS PANEL */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Stats Summary Grid Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Revenue', value: `₹${stats.revenue.toLocaleString()}`, desc: 'Rentals + Medicines', icon: DollarSign, color: 'text-medical' },
                    { label: 'Active Doctors', value: stats.activeDoctors, desc: 'Available for call', icon: Stethoscope, color: 'text-indigo-500' },
                    { label: 'Pending Orders', value: stats.pendingOrders, desc: 'Zepto order queues', icon: Package, color: 'text-amber-500' },
                    { label: 'Active Fleet', value: stats.ambulancesCount, desc: 'Ambulances ready', icon: Truck, color: 'text-emerald-500' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="card p-5 border border-border flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{item.label}</span>
                          <Icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <h4 className="text-xl font-extrabold text-text-primary font-mono">{item.value}</h4>
                        <p className="text-[10px] text-text-muted mt-1">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Apple-style Interactive Chart Graphs */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Revenue Growth Graph */}
                  <div className="card p-6 border border-border">
                    <h3 className="text-sm font-bold text-text-primary mb-1 flex items-center gap-1.5">
                      <BarChart3 className="w-4.5 h-4.5 text-medical" /> Platform Revenue Track
                    </h3>
                    <p className="text-[10px] text-text-secondary mb-6">Aggregate monthly consult fees and equipment leases in INR.</p>
                    
                    <div className="flex items-end justify-between h-48 pt-4 border-b border-border/80 pr-2">
                      {ANALYTICS_DATA.monthlyRevenue.map((d) => (
                        <div key={d.month} className="flex flex-col items-center gap-2 group cursor-pointer">
                          <span className="text-[9px] font-mono text-medical opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                            ₹{d.amount / 1000}k
                          </span>
                          <div 
                            style={{ height: `${(d.amount / 75000) * 120}px` }}
                            className="w-8 rounded-t-lg bg-gradient-to-t from-medical-soft/40 to-medical group-hover:to-medical-dark transition-all duration-300"
                          />
                          <span className="text-[10px] font-bold text-text-secondary">{d.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bed Occupancy charts */}
                  <div className="card p-6 border border-border">
                    <h3 className="text-sm font-bold text-text-primary mb-1 flex items-center gap-1.5">
                      <HeartPulse className="w-4.5 h-4.5 text-emerald-500" /> ER Capacity & Bed Allocation
                    </h3>
                    <p className="text-[10px] text-text-secondary mb-6">Occupied and critical bed ratios across cooperating trauma centers.</p>
                    
                    <div className="space-y-4">
                      {ANALYTICS_DATA.occupancyStats.map((item) => (
                        <div key={item.hospital}>
                          <div className="flex justify-between text-xs mb-1 font-semibold text-text-primary">
                            <span>{item.hospital}</span>
                            <span className="font-mono">{item.beds} / 250 Beds</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-surface border border-border/60 overflow-hidden">
                            <div 
                              style={{ width: `${(item.beds / 250) * 100}%` }}
                              className={`h-full rounded-full ${item.color}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MEDICINE ORDERS LIST */}
            {activeTab === 'orders' && (
              <div className="card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text-primary">Active Medicine Orders</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-urgent border border-amber-200 text-[10px] font-bold">
                    {orders.length} orders total
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface/50 border-b border-border text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                        <th className="py-3 px-5">Order ID</th>
                        <th className="py-3 px-5">Customer Email</th>
                        <th className="py-3 px-5">Total Cost</th>
                        <th className="py-3 px-5 text-center">Status</th>
                        <th className="py-3 px-5 text-center">Change Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-text-secondary text-xs">
                            No active orders placed yet. Place medicine requests on the Medicine Finder page.
                          </td>
                        </tr>
                      ) : (
                        orders.map((o) => (
                          <tr key={o.id} className="border-b border-border/40 hover:bg-surface/30">
                            <td className="py-3 px-5 font-mono text-xs text-text-primary font-bold">
                              #{o.id.substring(0,8)}
                            </td>
                            <td className="py-3 px-5 text-xs text-text-secondary">
                              {o.user_email}
                            </td>
                            <td className="py-3 px-5 text-xs font-bold text-medical font-mono">
                              ₹{o.total}
                            </td>
                            <td className="py-3 px-5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                o.status === 'Pending' ? 'bg-amber-50 text-urgent border border-amber-200' :
                                o.status === 'Accepted' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                                o.status === 'Delivered' ? 'bg-green-50 text-stable border border-green-200' :
                                'bg-blue-50 text-medical border border-blue-200'
                              }`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="py-3 px-5 text-center">
                              <select
                                value={o.status}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                className="text-xs bg-surface border border-border rounded-lg py-1 px-2 font-bold focus:outline-none cursor-pointer"
                              >
                                {['Pending', 'Accepted', 'Packed', 'Out For Delivery', 'Delivered'].map((status) => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: DOCTORS REGISTRY */}
            {activeTab === 'doctors' && (
              <div className="card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text-primary">Cooperating Specialist Doctors</h3>
                  <span className="text-[10px] text-text-secondary font-semibold">Total Registry count: {doctors.length}</span>
                </div>
                <div className="p-4 grid md:grid-cols-2 gap-4">
                  {doctors.map((d) => (
                    <div key={d.id} className="p-4 rounded-xl border border-border bg-surface flex items-center gap-3 justify-between">
                      <div className="flex items-center gap-3">
                        <img src={d.avatarUrl || d.avatar_url} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <h4 className="text-xs font-bold text-text-primary">{d.name}</h4>
                          <p className="text-[10px] text-text-secondary">{d.specialty}</p>
                          <span className="text-[9px] font-mono text-text-muted break-all mt-0.5 block">{d.meetUrl || d.meet_url}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        d.status === 'available' ? 'bg-green-50 text-stable' : 'bg-red-50 text-emergency'
                      }`}>
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Active Consultation Requests */}
                <div className="mt-8 border-t border-border/60 pt-6">
                  <h3 className="text-sm font-bold text-text-primary mb-4 px-2">Telehealth Consultation Requests</h3>
                  <div className="rounded-2xl border border-border overflow-hidden bg-background">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface/50 border-b border-border text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                          <th className="py-3 px-5">Doctor Target</th>
                          <th className="py-3 px-5">Patient Name</th>
                          <th className="py-3 px-5 text-center">Status</th>
                          <th className="py-3 px-5 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consultations.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-text-secondary text-xs">
                              No pending consultations.
                            </td>
                          </tr>
                        ) : (
                          consultations.map((c) => {
                            const doctorObj = doctors.find(d => d.id === c.doctor_id);
                            const doctorName = doctorObj ? doctorObj.name : (c.doctor_name || 'Specialist');
                            const isAccepting = acceptingConsultId === c.id;

                            return (
                              <tr key={c.id} className="border-b border-border/40 hover:bg-surface/30">
                                <td className="py-3 px-5 text-xs text-text-primary font-bold">
                                  {doctorName}
                                </td>
                                <td className="py-3 px-5 text-xs text-text-secondary">
                                  {c.patient_name}
                                </td>
                                <td className="py-3 px-5 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                    c.status === 'pending' ? 'bg-amber-50 text-urgent border border-amber-200' :
                                    c.status === 'accepted' || c.status === 'active' ? 'bg-green-50 text-stable border border-green-200' :
                                    c.status === 'rejected' ? 'bg-red-50 text-emergency border border-red-200' :
                                    'bg-gray-100 text-text-secondary border border-gray-200'
                                  }`}>
                                    {c.status}
                                  </span>
                                </td>
                                <td className="py-3 px-5 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {c.status === 'pending' && (
                                      <>
                                        <button
                                          onClick={() => handleApproveConsultation(c)}
                                          disabled={isAccepting}
                                          className="p-1.5 rounded-lg bg-green-50 text-stable hover:bg-stable hover:text-white transition-all disabled:opacity-40"
                                          title="Accept & Create Google Meet"
                                        >
                                          {isAccepting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                          )}
                                        </button>
                                        <button
                                          onClick={() => handleRejectConsultation(c.id)}
                                          disabled={isAccepting}
                                          className="p-1.5 rounded-lg bg-red-50 text-emergency hover:bg-emergency hover:text-white transition-all disabled:opacity-40"
                                          title="Reject Request"
                                        >
                                          <XCircle className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}

                                    {(c.status === 'accepted' || c.status === 'active') && c.meet_link && (
                                      <a
                                        href={c.meet_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold transition-all"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" /> Join Google Meet
                                      </a>
                                    )}

                                    {c.status === 'rejected' && (
                                      <span className="text-[10px] text-red-500 font-semibold">Rejected</span>
                                    )}

                                    {c.status === 'completed' && (
                                      <span className="text-[10px] text-text-muted">Completed</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: RENTALS EQUIPMENT */}
            {activeTab === 'equipment' && (
              <div className="card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text-primary">Medical Equipment Inventory</h3>
                  <span className="text-[10px] text-text-secondary font-semibold">Total count: {equipment.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface/50 border-b border-border text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                        <th className="py-3 px-5">Equipment Name</th>
                        <th className="py-3 px-5">Category</th>
                        <th className="py-3 px-5 text-center">Daily Rent</th>
                        <th className="py-3 px-5 text-center">Stock Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipment.map((eq) => (
                        <tr key={eq.id} className="border-b border-border/40">
                          <td className="py-3 px-5 text-xs font-bold text-text-primary">{eq.name}</td>
                          <td className="py-3 px-5 text-xs text-text-secondary">{eq.category}</td>
                          <td className="py-3 px-5 text-center text-xs font-bold text-medical font-mono">₹{eq.price_per_day || eq.price}</td>
                          <td className="py-3 px-5 text-center text-xs font-bold text-text-primary">{eq.quantity_available || eq.stock} units</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: VENDORS */}
            {activeTab === 'pharmacies' && (
              <div className="card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-surface">
                  <h3 className="text-sm font-bold text-text-primary">Registered Shop Vendors</h3>
                </div>
                <div className="p-4 grid md:grid-cols-2 gap-4">
                  {vendors.map((v) => (
                    <div key={v.id} className="p-4 rounded-xl border border-border bg-surface">
                      <h4 className="text-xs font-bold text-text-primary">{v.name}</h4>
                      <p className="text-[10px] text-text-secondary mt-1">{v.address}</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">Phone: {v.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: HOSPITALS */}
            {activeTab === 'hospitals' && (
              <div className="card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-surface">
                  <h3 className="text-sm font-bold text-text-primary">Cooperating Hospitals</h3>
                </div>
                <div className="p-4 grid md:grid-cols-2 gap-4">
                  {hospitals.map((h) => (
                    <div key={h.id} className="p-4 rounded-xl border border-border bg-surface">
                      <h4 className="text-xs font-bold text-text-primary">{h.name}</h4>
                      <p className="text-[10px] text-text-secondary mt-1">{h.address || 'Belgaum Region'}</p>
                      <div className="flex justify-between mt-3 text-[10px] font-bold text-medical">
                        <span>Total Beds: {h.total_beds}</span>
                        <span className="text-stable">Available: {h.available_beds}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 7: AMBULANCES */}
            {activeTab === 'ambulances' && (
              <div className="card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-surface">
                  <h3 className="text-sm font-bold text-text-primary">Ambulance Fleets</h3>
                </div>
                <div className="p-4 grid md:grid-cols-2 gap-4">
                  {ambulances.map((a) => (
                    <div key={a.id} className="p-4 rounded-xl border border-border bg-surface flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-text-primary">{a.driver_name || a.driverName}</h4>
                        <p className="text-[10px] text-text-secondary mt-0.5">Vehicle: {a.vehicle_number || a.vehicleNumber}</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">Contact: {a.phone}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        a.status === 'available' ? 'bg-green-50 text-stable' : 'bg-red-50 text-emergency'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Floating Dialog Form Overlay for Additions */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-6">
          <div className="card p-6 max-w-md w-full border border-border relative">
            <h3 className="text-lg font-bold text-text-primary mb-4">
              Add New Registry Entry
            </h3>
            
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {formType === 'doctor' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase">Doctor Name</label>
                    <input type="text" required value={docName} onChange={e => setDocName(e.target.value)} placeholder="Dr. John Doe" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase">Specialty</label>
                    <input type="text" required value={docSpecialty} onChange={e => setDocSpecialty(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase">Google Meet Link</label>
                    <input type="url" required value={docMeet} onChange={e => setDocMeet(e.target.value)} className="input-field" />
                  </div>
                </>
              )}

              {formType === 'equipment' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase">Equipment Name</label>
                    <input type="text" required value={eqName} onChange={e => setEqName(e.target.value)} placeholder="Oxygen Concentrator" className="input-field" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase">Rent / Day</label>
                      <input type="number" required value={eqPrice} onChange={e => setEqPrice(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase">Quantity</label>
                      <input type="number" required value={eqQty} onChange={e => setEqQty(e.target.value)} className="input-field" />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4 border-t border-border/60">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
