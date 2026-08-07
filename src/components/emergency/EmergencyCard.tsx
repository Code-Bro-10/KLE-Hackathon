import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, ShieldCheck, Phone, ShieldAlert, Activity, Heart, Thermometer, Droplets } from 'lucide-react';
import type { Condition } from '@/types';
import { useStore } from '@/store/StoreContext';

const urgencyConfig = {
  critical: { label: 'Critical', color: 'text-emergency', bg: 'bg-emergency-soft', border: 'border-emergency' },
  urgent: { label: 'Urgent', color: 'text-urgent', bg: 'bg-amber-50', border: 'border-urgent' },
  moderate: { label: 'Moderate', color: 'text-moderate', bg: 'bg-yellow-50', border: 'border-moderate' },
  lower: { label: 'Lower', color: 'text-stable', bg: 'bg-green-50', border: 'border-stable' },
};

const getDemoVitals = (urgency: string) => {
  switch (urgency) {
    case 'critical':
      return { hr: 118, bp: '90/60', spo2: 91, temp: 98.6, status: 'Critical Hypoxia & Tachycardia' };
    case 'urgent':
      return { hr: 102, bp: '138/88', spo2: 94, temp: 99.2, status: 'Elevated Stress Vitals' };
    case 'moderate':
      return { hr: 88, bp: '122/82', spo2: 97, temp: 101.8, status: 'Moderate Pyrexia (Fever)' };
    case 'lower':
    default:
      return { hr: 72, bp: '118/76', spo2: 99, temp: 98.4, status: 'Stable Normal Vitals' };
  }
};

interface Props {
  condition: Condition;
  caseId: string;
  onFindHospital: () => void;
}

export default function EmergencyCard({ condition, caseId, onFindHospital }: Props) {
  const cfg = urgencyConfig[condition.urgency];
  const { currentCase, setCurrentCase } = useStore();
  const vitals = getDemoVitals(condition.urgency);

  const handleSaveCase = () => {
    setCurrentCase({
      id: currentCase?.id || '',
      caseId,
      symptoms: currentCase?.symptoms || '',
      voiceTranscript: currentCase?.voiceTranscript || '',
      conditionName: condition.name,
      urgencyLevel: condition.urgency,
      confidence: condition.confidence,
      recommendedActions: condition.recommendedActions,
      firstAidSteps: condition.firstAid,
      warnings: condition.warnings,
      hospitalId: null,
      status: 'active',
      patientName: '',
      patientAge: null,
      location: '',
      createdAt: currentCase?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photoUrl: currentCase?.photoUrl || null,
    });
    onFindHospital();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto px-6"
    >
      <div className="card overflow-hidden relative">
        {/* Demo Disclaimer Banner */}
        <div className="bg-amber-500 text-white text-center py-2 px-4 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 z-10 relative">
          <ShieldAlert className="w-3.5 h-3.5" />
          AI-Generated Emergency Assessment (Demo Triage)
        </div>
        {/* Header */}
        <div className={`${cfg.bg} px-8 py-6 border-b ${cfg.border}/20`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-semibold ${cfg.color} uppercase tracking-wide`}>{cfg.label} Priority</span>
            <span className="text-sm text-text-muted font-mono">{caseId}</span>
          </div>
          <h2 className="text-3xl font-semibold text-text-primary mb-2">{condition.name}</h2>
          <p className="text-text-secondary">{condition.description}</p>
        </div>

        {/* Attached Photo Display */}
        {currentCase?.photoUrl && (
          <div className="px-8 py-5 border-b border-border bg-surface/50 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Attached Incident Photo</span>
            <img src={currentCase.photoUrl} className="max-h-64 rounded-2xl object-cover w-full border border-border" alt="Emergency capture" />
          </div>
        )}

        {/* Confidence */}
        <div className="px-8 py-6 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-medical" strokeWidth={2} />
              <span className="font-medium text-text-primary">AI Confidence</span>
            </div>
            <span className="text-2xl font-semibold text-text-primary">{condition.confidence}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${condition.confidence}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full rounded-full bg-medical"
            />
          </div>
        </div>

        {/* Digital Patient Twin (Demo) */}
        <div className="px-8 py-6 border-b border-border bg-surface-blue/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
              <Activity className="w-5 h-5 text-emergency animate-pulse" />
              Digital Patient Twin (Demo Prediction)
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-text-secondary text-[9px] font-bold uppercase tracking-wider">
              Simulation
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mb-4 leading-relaxed">
            AI-predicted physiological state profile based on reported symptoms and emergency urgency projection.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {/* Heart Rate */}
            <div className="p-3 bg-white rounded-xl border border-border/60 shadow-sm">
              <div className="flex items-center gap-1 text-[10px] text-text-secondary mb-1">
                <Heart className="w-3 h-3 text-emergency animate-pulse" />
                Heart Rate
              </div>
              <div className="text-sm font-bold text-text-primary">
                {vitals.hr} <span className="text-[9px] text-text-secondary font-normal">bpm</span>
              </div>
            </div>
            
            {/* Blood Pressure */}
            <div className="p-3 bg-white rounded-xl border border-border/60 shadow-sm">
              <div className="flex items-center gap-1 text-[10px] text-text-secondary mb-1">
                <Activity className="w-3 h-3 text-medical" />
                Blood Pressure
              </div>
              <div className="text-sm font-bold text-text-primary">
                {vitals.bp} <span className="text-[9px] text-text-secondary font-normal font-sans">mmHg</span>
              </div>
            </div>

            {/* SpO2 */}
            <div className="p-3 bg-white rounded-xl border border-border/60 shadow-sm">
              <div className="flex items-center gap-1 text-[10px] text-text-secondary mb-1">
                <Droplets className="w-3 h-3 text-blue-500 animate-bounce" />
                Oxygen (SpO2)
              </div>
              <div className="text-sm font-bold text-text-primary">
                {vitals.spo2}%
              </div>
            </div>

            {/* Temp */}
            <div className="p-3 bg-white rounded-xl border border-border/60 shadow-sm">
              <div className="flex items-center gap-1 text-[10px] text-text-secondary mb-1">
                <Thermometer className="w-3 h-3 text-urgent" />
                Body Temp
              </div>
              <div className="text-sm font-bold text-text-primary">
                {vitals.temp}°F
              </div>
            </div>
          </div>

          {/* ECG pulsing wave animation */}
          <div className="p-3 bg-dark text-emerald-500 rounded-2xl border border-white/5 flex items-center justify-between overflow-hidden relative h-14">
            <div className="z-10 relative">
              <div className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest font-mono">Live Telemetry (Simulated)</div>
              <div className="text-[11px] font-mono font-bold leading-none mt-1">{vitals.status}</div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-40 opacity-70">
              <svg viewBox="0 0 100 30" className="w-full h-8 text-emerald-500">
                <path
                  d="M0 15 L25 15 L28 5 L31 25 L34 13 L37 17 L40 15 L100 15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray="100"
                  strokeDashoffset="0"
                  style={{
                    animation: 'ecgLoop 1.5s linear infinite',
                  }}
                />
              </svg>
              <style>{`
                @keyframes ecgLoop {
                  0% { stroke-dashoffset: 100; }
                  100% { stroke-dashoffset: 0; }
                }
              `}</style>
            </div>
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="px-8 py-6 border-b border-border">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary mb-4">
            <ShieldCheck className="w-5 h-5 text-medical" strokeWidth={2} />
            Recommended Actions
          </h3>
          <ol className="space-y-3">
            {condition.recommendedActions.map((action, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex gap-3"
              >
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-medical/10 text-medical text-sm font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-text-primary leading-relaxed pt-0.5">{action}</span>
              </motion.li>
            ))}
          </ol>
        </div>

        {/* Warnings */}
        {condition.warnings.length > 0 && (
          <div className="px-8 py-6 border-b border-border bg-amber-50/50">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-urgent mb-4">
              <AlertTriangle className="w-5 h-5" strokeWidth={2} />
              Important Warnings
            </h3>
            <ul className="space-y-2">
              {condition.warnings.map((warning, i) => (
                <li key={i} className="flex gap-3 text-text-primary">
                  <span className="text-urgent font-bold">•</span>
                  <span className="leading-relaxed">{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="px-8 py-6 flex flex-col sm:flex-row gap-3">
          <button onClick={handleSaveCase} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Phone className="w-5 h-5" />
            Find Nearest Hospital
          </button>
          <a href="tel:911" className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <Phone className="w-5 h-5 text-emergency" />
            Call 911
          </a>
        </div>
      </div>
    </motion.div>
  );
}
