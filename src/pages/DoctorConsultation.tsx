import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, User, CheckCircle2, AlertCircle, 
  Clock, X, ShieldAlert, PhoneCall, ExternalLink,
  Copy, Share2, MessageSquare, Loader2
} from 'lucide-react';
import type { Doctor } from '@/types';
import { supabase } from '@/lib/supabase';
import NavigationBar from '@/components/Navigation';

// Seeded fallbacks for offline development
const mockDoctors: Doctor[] = [
  {
    id: 'd1',
    name: 'Dr. Sarah Jenkins',
    specialty: 'Cardiologist',
    status: 'available',
    meetUrl: 'https://meet.google.com/abc-defg-hij',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'd2',
    name: 'Dr. David Chen',
    specialty: 'Neurologist',
    status: 'available',
    meetUrl: 'https://meet.google.com/klm-nopq-rst',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'd3',
    name: 'Dr. Aisha Rahman',
    specialty: 'Pediatrician',
    status: 'busy',
    meetUrl: 'https://meet.google.com/uvw-xyz1-234',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'd4',
    name: 'Dr. James Wilson',
    specialty: 'Trauma Specialist',
    status: 'offline',
    meetUrl: 'https://meet.google.com/567-890a-bcd',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300'
  }
];

export default function DoctorConsultation() {
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);
  const [patientName, setPatientName] = useState<string>(() => localStorage.getItem('resq-active-user-name') || '');
  const [patientEmail, setPatientEmail] = useState<string>(() => localStorage.getItem('resq-active-user-email') || '');
  const [symptoms, setSymptoms] = useState<string>('');
  const [loadingDoctorId, setLoadingDoctorId] = useState<string | null>(null);
  
  // Track active call in client session
  const [activeConsultation, setActiveConsultation] = useState<{
    id: string;
    doctorId: string;
    doctorName: string;
    meetUrl: string;
    status: 'pending' | 'accepted' | 'rejected' | 'active' | 'completed';
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (activeConsultation && activeConsultation.meetUrl) {
      navigator.clipboard.writeText(activeConsultation.meetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Fetch doctors list from Supabase
  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('name', { ascending: true });
      
      let finalDoctors = mockDoctors;
      if (!error && data && data.length > 0) {
        finalDoctors = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          specialty: d.specialty,
          status: d.status as Doctor['status'],
          meetUrl: d.meet_url,
          avatarUrl: d.avatar_url,
          createdAt: d.created_at
        }));
      }

      // Merge local storage registered doctors
      const localRegistered = localStorage.getItem('resq-registered-doctors');
      if (localRegistered) {
        const parsed = JSON.parse(localRegistered);
        finalDoctors = [...finalDoctors, ...parsed];
      }

      setDoctors(finalDoctors);
    } catch (err) {
      console.warn('Could not fetch doctors from database, using offline mocks:', err);
      const localRegistered = localStorage.getItem('resq-registered-doctors');
      if (localRegistered) {
        const parsed = JSON.parse(localRegistered);
        setDoctors([...mockDoctors, ...parsed]);
      }
    }
  };

  // Restore consultation session from localStorage on mount
  useEffect(() => {
    fetchDoctors();

    const activeId = localStorage.getItem('resq-active-consultation-id');
    if (activeId) {
      const restoreSession = async () => {
        try {
          const { data, error } = await supabase
            .from('consultations')
            .select('*')
            .eq('id', activeId)
            .single();

          if (!error && data && data.status !== 'completed' && data.status !== 'rejected') {
            // Find doctor details from database or fallback name
            let docName = 'Specialist';
            const { data: docData } = await supabase.from('doctors').select('name').eq('id', data.doctor_id).single();
            if (docData) docName = docData.name;

            setActiveConsultation({
              id: data.id,
              doctorId: data.doctor_id,
              doctorName: docName,
              meetUrl: data.meet_link || '',
              status: data.status
            });
            // Subscribe to this active consultation updates
            subscribeToConsultation(data.id);
          } else {
            localStorage.removeItem('resq-active-consultation-id');
          }
        } catch (err) {
          console.warn('Failed to restore active consultation session:', err);
        }
      };
      restoreSession();
    }

    // Subscribe to Realtime status updates for doctors
    const channel = supabase
      .channel('realtime-doctors-status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'doctors' },
        (payload) => {
          console.log('Realtime change received for doctors:', payload);
          const updated = payload.new as any;
          if (updated && updated.id) {
            setDoctors((prev) =>
              prev.map((d) => 
                d.id === updated.id 
                  ? { 
                      ...d, 
                      name: updated.name,
                      specialty: updated.specialty,
                      status: updated.status as Doctor['status'],
                      meetUrl: updated.meet_url,
                      avatarUrl: updated.avatar_url
                    } 
                  : d
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Real-time listener for consultation changes
  const subscribeToConsultation = (id: string) => {
    const channel = supabase
      .channel(`consultation-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'consultations', filter: `id=eq.${id}` },
        (payload) => {
          console.log('Realtime update for consultation:', payload.new);
          const updated = payload.new as any;
          if (updated) {
            setActiveConsultation(prev => {
              if (prev && prev.id === updated.id) {
                return {
                  ...prev,
                  status: updated.status,
                  meetUrl: updated.meet_link || ''
                };
              }
              return prev;
            });
            
            if (updated.status === 'completed' || updated.status === 'rejected') {
              localStorage.removeItem('resq-active-consultation-id');
              // Delay removal slightly so user can see rejection alert
              if (updated.status === 'completed') {
                setActiveConsultation(null);
              }
            }
          }
        }
      )
      .subscribe();

    return channel;
  };

  // Start Consultation request (Patient Side)
  const handleStartConsultation = async (doctor: Doctor) => {
    if (activeConsultation) {
      alert('You already have a consultation session. Please end it before starting a new one.');
      return;
    }
    
    setLoadingDoctorId(doctor.id);
    const finalPatientName = patientName.trim() || 'Anonymous Patient';
    const finalPatientEmail = patientEmail.trim() || 'anonymous@resq.com';
    const finalSymptoms = symptoms.trim() || 'General video consultation request.';

    try {
      // 1. Create a consultation record in Supabase with status = 'pending'
      const { data: consultation, error: consultError } = await supabase
        .from('consultations')
        .insert({
          doctor_id: doctor.id,
          patient_name: finalPatientName,
          patient_email: finalPatientEmail,
          symptoms: finalSymptoms,
          status: 'pending'
        })
        .select()
        .single();

      if (consultError) throw consultError;

      // 2. Set active session states
      localStorage.setItem('resq-active-consultation-id', consultation.id);
      setActiveConsultation({
        id: consultation.id,
        doctorId: doctor.id,
        doctorName: doctor.name,
        meetUrl: '',
        status: 'pending'
      });

      // 3. Subscribe to updates for this consultation
      subscribeToConsultation(consultation.id);

      // 4. Broadcast to admin tab via BroadcastChannel fallback
      const bc = new BroadcastChannel('resq-consultations');
      bc.postMessage({
        type: 'NEW_CONSULTATION',
        consultation: consultation
      });
      bc.close();

    } catch (err) {
      console.error('Error starting video consultation:', err);
      alert('Failed to request consultation. Please ensure database tables and RLS are set up.');
    } finally {
      setLoadingDoctorId(null);
    }
  };

  // End Video Consultation
  const handleEndConsultation = async () => {
    if (!activeConsultation) return;

    try {
      // 1. Update consultation to completed in Supabase
      await supabase
        .from('consultations')
        .update({ 
          status: 'completed', 
          ended_at: new Date().toISOString() 
        })
        .eq('id', activeConsultation.id);

      // 2. Change doctor status back to available in Supabase
      await supabase
        .from('doctors')
        .update({ status: 'available' })
        .eq('id', activeConsultation.doctorId);

      // Update state locally
      setDoctors(prev => 
        prev.map(d => d.id === activeConsultation.doctorId ? { ...d, status: 'available' } : d)
      );

    } catch (err) {
      console.error('Error ending consultation:', err);
    } finally {
      localStorage.removeItem('resq-active-consultation-id');
      setActiveConsultation(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface pt-24 pb-16">
      <NavigationBar />

      <div className="container-main max-w-5xl">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-medical-soft text-medical mb-4">
            <Video className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-semibold">ResQ Telehealth Portal</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-3">
            On-Demand Video Consultations
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto text-sm md:text-base">
            Instantly connect with certified medical specialists via video call for real-time guidance and medical support.
          </p>
        </div>

        {/* Active Consultation Alert Banner */}
        <AnimatePresence>
          {activeConsultation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className={`card p-5 mb-8 flex flex-col xl:flex-row items-center justify-between gap-4 shadow-lg ${
                activeConsultation.status === 'rejected' ? 'border-red-200 bg-red-50/50' : 
                activeConsultation.status === 'accepted' || activeConsultation.status === 'active' ? 'border-green-200 bg-green-50/50' : 
                'border-amber-200 bg-amber-50/50'
              }`}
            >
              <div className="flex items-center gap-3.5 mr-auto">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activeConsultation.status === 'rejected' ? 'bg-red-500 text-white' :
                  activeConsultation.status === 'accepted' || activeConsultation.status === 'active' ? 'bg-green-500 text-white animate-pulse' :
                  'bg-amber-500 text-white animate-bounce'
                }`}>
                  {activeConsultation.status === 'rejected' ? <X className="w-5 h-5" /> : <PhoneCall className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">
                    {activeConsultation.status === 'rejected' ? 'Consultation Request Rejected' :
                     activeConsultation.status === 'accepted' || activeConsultation.status === 'active' ? 'Consultation Accepted' :
                     'Consultation Request Sent'}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {activeConsultation.status === 'rejected' ? `Doctor is currently unavailable. Please choose another doctor.` :
                     activeConsultation.status === 'accepted' || activeConsultation.status === 'active' ? 'Doctor is ready. Click below to join the video call.' :
                     `Waiting for ${activeConsultation.doctorName} to accept your request...`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 w-full xl:w-auto justify-end">
                {activeConsultation.status === 'pending' && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-100/50 px-3 py-1.5 rounded-xl border border-amber-200">
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-amber-600" />
                    <span>Awaiting response</span>
                  </div>
                )}

                {(activeConsultation.status === 'accepted' || activeConsultation.status === 'active') && activeConsultation.meetUrl && (
                  <>
                    <button
                      onClick={handleCopyLink}
                      className="btn-secondary flex items-center justify-center gap-1.5 text-xs h-10 px-3 border-border/80 text-text-primary bg-background hover:bg-surface"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied ? 'Copied!' : 'Copy Code Link'}
                    </button>
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Here is the Google Meet link to join the video consultation: ${activeConsultation.meetUrl}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary flex items-center justify-center gap-1.5 text-xs h-10 px-3 border-green-300/45 text-stable bg-green-50/50 hover:bg-green-100/60"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </a>
                    <a
                      href={activeConsultation.meetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary flex items-center justify-center gap-1.5 text-xs h-10 px-4 bg-green-600 hover:bg-green-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Join Video Consultation
                    </a>
                  </>
                )}

                {activeConsultation.status === 'rejected' ? (
                  <button
                    onClick={() => {
                      localStorage.removeItem('resq-active-consultation-id');
                      setActiveConsultation(null);
                    }}
                    className="btn-secondary text-xs h-10 px-4"
                  >
                    Select Another Doctor
                  </button>
                ) : (
                  <button
                    onClick={handleEndConsultation}
                    className="btn-emergency text-xs h-10 px-4"
                  >
                    Cancel Consultation
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Patient Name & Email Input Card */}
        <div className="card p-6 mb-8 max-w-xl mx-auto">
          <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-medical" /> Consultation Patient Profile
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Patient Name</label>
              <input
                type="text"
                placeholder="Patient Name (Optional)"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                disabled={!!activeConsultation}
                className="input-field text-sm disabled:bg-surface-blue/10 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Patient Email</label>
              <input
                type="email"
                placeholder="Email to send code (Optional)"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                disabled={!!activeConsultation}
                className="input-field text-sm disabled:bg-surface-blue/10 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Reason for Consultation / Symptoms</label>
            <textarea
              placeholder="Describe your symptoms or medical concern..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              disabled={!!activeConsultation}
              rows={3}
              className="textarea-field text-sm resize-none disabled:bg-surface-blue/10 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map((doctor) => {
            const statusConfig = {
              available: { label: 'Available', dotColor: 'bg-stable', badgeClass: 'bg-green-50 text-stable border-green-200/50' },
              busy: { label: 'Busy', dotColor: 'bg-emergency', badgeClass: 'bg-emergency-soft text-emergency border-red-200/50' },
              offline: { label: 'Offline', dotColor: 'bg-text-secondary', badgeClass: 'bg-surface text-text-secondary border-border/80' }
            }[doctor.status];

            return (
              <motion.div
                key={doctor.id}
                layout
                className="card p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4">
                    {/* Doctor Avatar */}
                    <div className="relative">
                      <img
                        src={doctor.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'}
                        alt={doctor.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-border"
                      />
                      {/* Live Status indicator */}
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusConfig.dotColor} live-dot`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.badgeClass}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-text-primary">{doctor.name}</h3>
                      <p className="text-sm font-semibold text-medical mt-0.5">{doctor.specialty}</p>
                    </div>
                  </div>

                  {/* Specialty details info block */}
                  <div className="mt-5 p-3 rounded-xl bg-surface border border-border/60 text-xs text-text-secondary flex items-center gap-2">
                    <Clock className="w-4 h-4 text-text-muted" />
                    <span>Average response time: 2 - 5 minutes</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 flex gap-3">
                  <button
                    onClick={() => handleStartConsultation(doctor)}
                    disabled={doctor.status !== 'available' || !!activeConsultation || loadingDoctorId !== null}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 h-11 text-sm disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    {loadingDoctorId === doctor.id ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Video className="w-4 h-4" />
                        Request Consultation
                      </>
                    )}
                  </button>
                  <a
                    href={`tel:112`}
                    className="btn-secondary h-11 px-4 flex items-center justify-center"
                    title="Call Emergency Services"
                  >
                    <ShieldAlert className="w-4.5 h-4.5 text-emergency" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
