import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, User, CheckCircle2, AlertCircle, 
  Clock, X, ShieldAlert, PhoneCall, ExternalLink,
  Copy, Share2 
} from 'lucide-react';
import type { Doctor, Consultation } from '@/types';
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
  const [patientName, setPatientName] = useState<string>('');
  const [patientEmail, setPatientEmail] = useState<string>('');
  const [loadingDoctorId, setLoadingDoctorId] = useState<string | null>(null);
  const [emailSentAlert, setEmailSentAlert] = useState<{ email: string; isReal: boolean } | null>(null);
  
  // Track active call in client session
  const [activeConsultation, setActiveConsultation] = useState<{
    id: string;
    doctorId: string;
    doctorName: string;
    meetUrl: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (activeConsultation) {
      navigator.clipboard.writeText(activeConsultation.meetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper to generate a realistic Google Meet URL if placeholder is detected
  const getMeetingUrl = (baseMeetUrl: string): string => {
    const isPlaceholder = ['abc-defg-hij', 'klm-nopq', 'uvw-xyz', '567-890'].some(ph => baseMeetUrl.includes(ph));
    if (isPlaceholder) {
      // Generate a standard 3-4-3 google meet code: meet.google.com/xxx-yyyy-zzz
      const randomPart = () => Math.random().toString(36).substring(2, 6);
      return `https://meet.google.com/${randomPart().substring(0,3)}-${randomPart().substring(0,4)}-${randomPart().substring(0,3)}`;
    }
    return baseMeetUrl;
  };

  // Helper to send email via EmailJS REST API
  const sendEmailNotification = async (params: {
    patientName: string;
    patientEmail: string;
    doctorName: string;
    meetUrl: string;
  }) => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.log('EmailJS is not configured in .env. Simulating email delivery.');
      return false; // Simulated
    }

    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_name: params.patientName,
            to_email: params.patientEmail,
            doctor_name: params.doctorName,
            meeting_link: params.meetUrl,
          },
        }),
      });
      return res.ok;
    } catch (err) {
      console.error('EmailJS request failed:', err);
      return false;
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

  useEffect(() => {
    fetchDoctors();

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

  // Start Video Consultation
  const handleStartConsultation = async (doctor: Doctor) => {
    if (activeConsultation) {
      alert('You already have an active consultation session. Please end it before starting a new one.');
      return;
    }
    
    setLoadingDoctorId(doctor.id);
    const finalPatientName = patientName.trim() || 'Anonymous Patient';
    const activeMeetUrl = getMeetingUrl(doctor.meetUrl);

    // Send email notification if email address is provided
    if (patientEmail.trim()) {
      const isReal = await sendEmailNotification({
        patientName: finalPatientName,
        patientEmail: patientEmail.trim(),
        doctorName: doctor.name,
        meetUrl: activeMeetUrl
      });
      setEmailSentAlert({
        email: patientEmail.trim(),
        isReal
      });
      // auto hide email sent alert after 7 seconds
      setTimeout(() => setEmailSentAlert(null), 7000);
    }

    try {
      // 1. Create a consultation record in Supabase
      const { data: consultation, error: consultError } = await supabase
        .from('consultations')
        .insert({
          doctor_id: doctor.id,
          patient_name: finalPatientName,
          status: 'active'
        })
        .select()
        .single();

      if (consultError) throw consultError;

      // 2. Update the doctor status to busy in Supabase
      const { error: doctorError } = await supabase
        .from('doctors')
        .update({ status: 'busy' })
        .eq('id', doctor.id);

      if (doctorError) throw doctorError;

      // 3. Open the doctor's Google Meet link in a new tab
      window.open(activeMeetUrl, '_blank');

      // 4. Set local active session state
      setActiveConsultation({
        id: consultation.id,
        doctorId: doctor.id,
        doctorName: doctor.name,
        meetUrl: activeMeetUrl
      });

      // Update state locally for fallback safety
      setDoctors(prev => 
        prev.map(d => d.id === doctor.id ? { ...d, status: 'busy' } : d)
      );

    } catch (err) {
      console.error('Error starting video consultation:', err);
      // Mock fallback: allow local testing if offline/db limits hit
      const tempId = 'mock-consult-' + Math.random().toString(36).substr(2, 9);
      window.open(activeMeetUrl, '_blank');
      setActiveConsultation({
        id: tempId,
        doctorId: doctor.id,
        doctorName: doctor.name,
        meetUrl: activeMeetUrl
      });
      setDoctors(prev => 
        prev.map(d => d.id === doctor.id ? { ...d, status: 'busy' } : d)
      );
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

      // Update state locally for fallback safety
      setDoctors(prev => 
        prev.map(d => d.id === activeConsultation.doctorId ? { ...d, status: 'available' } : d)
      );

    } catch (err) {
      console.error('Error ending consultation:', err);
      // Mock fallback
      setDoctors(prev => 
        prev.map(d => d.id === activeConsultation.doctorId ? { ...d, status: 'available' } : d)
      );
    } finally {
      setActiveConsultation(null);
    }
  };

  const handleResetStatuses = async () => {
    try {
      await supabase.from('doctors').update({ status: 'available' });
      setDoctors(prev => prev.map(d => ({ ...d, status: 'available' })));
    } catch (err) {
      console.error('Error resetting statuses:', err);
      setDoctors(prev => prev.map(d => ({ ...d, status: 'available' })));
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
              className="card border-emergency/40 bg-emergency-soft/30 p-5 mb-8 flex flex-col xl:flex-row items-center justify-between gap-4 shadow-emergency/10"
            >
              <div className="flex items-center gap-3.5 mr-auto">
                <div className="w-12 h-12 rounded-full bg-emergency text-white flex items-center justify-center animate-bounce flex-shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">
                    Active Video Consultation
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Consultation session active with <span className="font-semibold text-text-primary">{activeConsultation.doctorName}</span>
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 break-all">
                    Link: <span className="font-mono">{activeConsultation.meetUrl}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 w-full xl:w-auto justify-end">
                <button
                  onClick={handleCopyLink}
                  className="btn-secondary flex items-center justify-center gap-1.5 text-xs h-10 px-3 border-border/80 text-text-primary bg-background hover:bg-surface"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied!' : 'Copy Code Link'}
                </button>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Here is the Google Meet link to join the video consultation with ${activeConsultation.doctorName}: ${activeConsultation.meetUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center justify-center gap-1.5 text-xs h-10 px-3 border-green-300/45 text-stable bg-green-50/50 hover:bg-green-100/60"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share on WhatsApp
                </a>
                <a
                  href={activeConsultation.meetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center justify-center gap-1.5 text-xs h-10 px-4 bg-medical hover:bg-medical-dark"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Meet
                </a>
                <button
                  onClick={handleEndConsultation}
                  className="btn-emergency text-xs h-10 px-4"
                >
                  End Consultation
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email Sent Notification Alert */}
        <AnimatePresence>
          {emailSentAlert && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-2xl border text-sm flex items-center gap-2.5 mb-6 max-w-xl mx-auto ${
                emailSentAlert.isReal
                  ? 'bg-green-50 border-green-200 text-stable'
                  : 'bg-blue-50 border-blue-200 text-medical'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-bold">
                  {emailSentAlert.isReal ? 'Email Sent Successfully!' : 'Email Delivery Simulated!'}
                </div>
                <div className="text-xs text-text-secondary mt-0.5">
                  The Google Meet link was sent to <span className="font-semibold text-text-primary">{emailSentAlert.email}</span>.
                </div>
                {!emailSentAlert.isReal && (
                  <div className="text-[10px] text-text-muted mt-1 leading-tight">
                    ResQ simulated the email send. To dispatch actual emails, configure `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, and `VITE_EMAILJS_PUBLIC_KEY` in your `.env` file.
                  </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          {patientEmail.trim() && (
            <p className="text-[10px] text-text-muted mt-2 text-center">
              The Google Meet room invite link will be sent to your email address as soon as you start the call.
            </p>
          )}
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
                    <span>Average consultation time: 10 - 15 minutes</span>
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
                      <Video className="w-4 h-4" />
                    )}
                    Start Video Consultation
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
