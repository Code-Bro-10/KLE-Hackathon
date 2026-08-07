import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, ShieldCheck, TrendingUp, Clock, Phone, CheckCircle2, Activity, BedDouble, MapPin } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useStore } from '@/store/StoreContext';
import { formatTimeAgo, formatDate, formatTime } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { EmergencyCase } from '@/types';

const urgencyConfig = {
  critical: { label: 'Critical', color: 'text-emergency', bg: 'bg-emergency-soft', border: 'border-emergency/30' },
  urgent: { label: 'Urgent', color: 'text-urgent', bg: 'bg-amber-50', border: 'border-urgent/30' },
  moderate: { label: 'Moderate', color: 'text-moderate', bg: 'bg-yellow-50', border: 'border-moderate/30' },
  lower: { label: 'Lower', color: 'text-stable', bg: 'bg-green-50', border: 'border-stable/30' },
};

const statusConfig = {
  active: { label: 'Active', color: 'text-emergency', bg: 'bg-emergency-soft' },
  acknowledged: { label: 'Acknowledged', color: 'text-medical', bg: 'bg-blue-50' },
  resolved: { label: 'Resolved', color: 'text-stable', bg: 'bg-green-50' },
};

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases, hospitals, loadCases } = useStore();
  const caseData = cases.find((c) => c.id === id);

  if (!caseData) {
    return (
      <div className="min-h-screen bg-surface pt-24 pb-20">
        <Navigation />
        <div className="container-main text-center py-20">
          <Activity className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Case not found</h2>
          <p className="text-text-secondary mb-6">This case may have been removed or never existed.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const ucfg = urgencyConfig[caseData.urgencyLevel];
  const scfg = statusConfig[caseData.status];
  const assignedHospital = hospitals.find((h) => h.id === caseData.hospitalId);

  const handleUpdateStatus = async (status: EmergencyCase['status']) => {
    try {
      await supabase.from('emergency_cases').update({ status, updated_at: new Date().toISOString() }).eq('id', caseData.id);
      loadCases();
    } catch {
      // offline
    }
  };

  return (
    <div className="min-h-screen bg-surface pt-24 pb-20">
      <Navigation />
      <div className="container-main max-w-3xl">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="card overflow-hidden">
            {/* Header */}
            <div className={`${ucfg.bg} px-8 py-6 border-b ${ucfg.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${ucfg.color} uppercase tracking-wide`}>{ucfg.label}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${scfg.bg} ${scfg.color}`}>{scfg.label}</span>
                </div>
                <span className="text-sm text-text-muted font-mono">{caseData.caseId}</span>
              </div>
              <h1 className="text-3xl font-semibold text-text-primary mb-2">{caseData.conditionName || 'Unknown condition'}</h1>
              <p className="text-text-secondary">{caseData.symptoms}</p>
            </div>

            {/* Meta info */}
            <div className="px-8 py-6 border-b border-border grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-text-muted mb-1">Confidence</div>
                <div className="flex items-center gap-1 font-semibold text-text-primary">
                  <TrendingUp className="w-4 h-4 text-medical" /> {caseData.confidence}%
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">Reported</div>
                <div className="flex items-center gap-1 font-semibold text-text-primary">
                  <Clock className="w-4 h-4 text-urgent" /> {formatTimeAgo(caseData.createdAt)}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">Date</div>
                <div className="font-semibold text-text-primary">{formatDate(caseData.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">Time</div>
                <div className="font-semibold text-text-primary">{formatTime(caseData.createdAt)}</div>
              </div>
            </div>

            {/* Recommended actions */}
            {caseData.recommendedActions.length > 0 && (
              <div className="px-8 py-6 border-b border-border">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary mb-4">
                  <ShieldCheck className="w-5 h-5 text-medical" /> Recommended Actions
                </h3>
                <ol className="space-y-2">
                  {caseData.recommendedActions.map((action, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-medical/10 text-medical text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                      <span className="text-text-primary leading-relaxed">{action}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* First aid */}
            {caseData.firstAidSteps.length > 0 && (
              <div className="px-8 py-6 border-b border-border">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary mb-4">
                  <Activity className="w-5 h-5 text-emergency" /> First Aid Steps
                </h3>
                <ol className="space-y-2">
                  {caseData.firstAidSteps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emergency/10 text-emergency text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                      <span className="text-text-primary leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Warnings */}
            {caseData.warnings.length > 0 && (
              <div className="px-8 py-6 border-b border-border bg-amber-50/50">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-urgent mb-4">
                  <AlertTriangle className="w-5 h-5" /> Warnings
                </h3>
                <ul className="space-y-2">
                  {caseData.warnings.map((w, i) => (
                    <li key={i} className="flex gap-2 text-text-primary">
                      <span className="text-urgent font-bold">•</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Assigned hospital */}
            {assignedHospital && (
              <div className="px-8 py-6 border-b border-border">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary mb-4">
                  <MapPin className="w-5 h-5 text-medical" /> Assigned Hospital
                </h3>
                <div className="p-4 rounded-2xl bg-surface">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-text-primary">{assignedHospital.name}</span>
                    <span className="text-sm text-text-secondary">{assignedHospital.distanceKm} km</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-secondary">
                    <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" /> {assignedHospital.availableBeds} beds</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> ~{assignedHospital.waitTimeMin} min</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-8 py-6 flex flex-col sm:flex-row gap-3">
              {caseData.status === 'active' && (
                <button onClick={() => handleUpdateStatus('acknowledged')} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Acknowledge Case
                </button>
              )}
              {caseData.status !== 'resolved' && (
                <button onClick={() => handleUpdateStatus('resolved')} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-stable" /> Mark Resolved
                </button>
              )}
              <a href="tel:112" className="btn-secondary flex items-center justify-center gap-2 px-6">
                <Phone className="w-5 h-5 text-emergency" /> 112
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
