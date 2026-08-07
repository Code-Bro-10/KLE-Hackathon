import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Clock, AlertCircle, CheckCircle2, BedDouble, Phone, Search, Filter, TrendingUp, ArrowRight } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useStore } from '@/store/StoreContext';
import { formatTimeAgo } from '@/lib/utils';
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

export default function HospitalDashboard() {
  const { cases, hospitals, loadCases } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'critical' | 'urgent' | 'moderate' | 'lower'>('all');

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesSearch =
        c.caseId.toLowerCase().includes(search.toLowerCase()) ||
        c.conditionName.toLowerCase().includes(search.toLowerCase()) ||
        c.symptoms.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || c.urgencyLevel === filter;
      return matchesSearch && matchesFilter;
    });
  }, [cases, search, filter]);

  const stats = useMemo(() => {
    const active = cases.filter((c) => c.status === 'active').length;
    const critical = cases.filter((c) => c.urgencyLevel === 'critical').length;
    const acknowledged = cases.filter((c) => c.status === 'acknowledged').length;
    const resolved = cases.filter((c) => c.status === 'resolved').length;
    return { active, critical, acknowledged, resolved, total: cases.length };
  }, [cases]);

  const handleUpdateStatus = async (caseId: string, status: EmergencyCase['status']) => {
    try {
      await supabase.from('emergency_cases').update({ status, updated_at: new Date().toISOString() }).eq('id', caseId);
      loadCases();
    } catch {
      // offline
    }
  };

  return (
    <div className="min-h-screen bg-surface pt-24 pb-20">
      <Navigation />

      <div className="container-main">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-card mb-2">Hospital Dashboard</h1>
          <p className="text-text-secondary">Monitor incoming emergency cases and hospital capacity in real time.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Cases', value: stats.active, icon: AlertCircle, color: 'text-emergency', bg: 'bg-emergency-soft' },
            { label: 'Critical', value: stats.critical, icon: Activity, color: 'text-emergency', bg: 'bg-emergency-soft' },
            { label: 'Acknowledged', value: stats.acknowledged, icon: CheckCircle2, color: 'text-medical', bg: 'bg-blue-50' },
            { label: 'Total Cases', value: stats.total, icon: TrendingUp, color: 'text-text-primary', bg: 'bg-surface' },
          ].map((stat) => (
            <div key={stat.label} className="card p-6">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} strokeWidth={2} />
              </div>
              <div className="text-3xl font-semibold text-text-primary mb-1">{stat.value}</div>
              <div className="text-sm text-text-secondary">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Hospital capacity overview */}
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-medical" /> Hospital Capacity
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hospitals.map((h) => {
              const pct = h.totalBeds > 0 ? Math.round((h.availableBeds / h.totalBeds) * 100) : 0;
              return (
                <div key={h.id} className="p-4 rounded-2xl bg-surface">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary text-sm">{h.name}</span>
                    <span className={`text-xs font-semibold ${pct > 40 ? 'text-stable' : pct > 15 ? 'text-urgent' : 'text-emergency'}`}>
                      {h.erStatus === 'open' ? 'Open' : h.erStatus === 'limited' ? 'Limited' : 'Full'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-background overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full ${pct > 40 ? 'bg-stable' : pct > 15 ? 'bg-urgent' : 'bg-emergency'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>{h.availableBeds}/{h.totalBeds} beds</span>
                    <span>~{h.waitTimeMin} min wait</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cases */}
        <div className="card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Activity className="w-5 h-5 text-emergency" /> Emergency Cases
            </h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="input-field !h-10 pl-9 text-sm w-48"
                  placeholder="Search cases..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="input-field !h-10 text-sm w-36"
              >
                <option value="all">All Priority</option>
                <option value="critical">Critical</option>
                <option value="urgent">Urgent</option>
                <option value="moderate">Moderate</option>
                <option value="lower">Lower</option>
              </select>
            </div>
          </div>

          {filteredCases.length === 0 ? (
            <div className="text-center py-16">
              <Activity className="w-12 h-12 text-text-muted mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-text-secondary mb-2">No emergency cases yet.</p>
              <p className="text-sm text-text-muted">Cases will appear here when users start a triage session.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCases.map((c, i) => {
                const ucfg = urgencyConfig[c.urgencyLevel];
                const scfg = statusConfig[c.status];
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-5 rounded-2xl border ${ucfg.border} ${ucfg.bg} hover:shadow-sm transition-shadow cursor-pointer`}
                    onClick={() => navigate(`/case/${c.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold ${ucfg.color} uppercase tracking-wide`}>{ucfg.label}</span>
                          <span className="text-xs text-text-muted">•</span>
                          <span className="text-xs text-text-muted font-mono">{c.caseId}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary">{c.conditionName || 'Unknown condition'}</h3>
                        <p className="text-sm text-text-secondary mt-1 line-clamp-1">{c.symptoms}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${scfg.bg} ${scfg.color}`}>{scfg.label}</span>
                        <span className="text-xs text-text-muted">{formatTimeAgo(c.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5">
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-medical" /> {c.confidence}% confidence
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {new Date(c.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {c.status === 'active' && (
                          <button
                            onClick={() => handleUpdateStatus(c.id, 'acknowledged')}
                            className="px-3 py-1.5 rounded-full bg-medical text-white text-xs font-semibold hover:opacity-90"
                          >
                            Acknowledge
                          </button>
                        )}
                        {c.status !== 'resolved' && (
                          <button
                            onClick={() => handleUpdateStatus(c.id, 'resolved')}
                            className="px-3 py-1.5 rounded-full bg-stable text-white text-xs font-semibold hover:opacity-90"
                          >
                            Resolve
                          </button>
                        )}
                        <ArrowRight className="w-4 h-4 text-text-muted" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
