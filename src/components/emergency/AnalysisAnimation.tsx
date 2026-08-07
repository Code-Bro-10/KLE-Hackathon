import { motion } from 'framer-motion';
import { Brain, Stethoscope, Activity, ShieldCheck } from 'lucide-react';

const stages = [
  { icon: Brain, label: 'Understanding symptoms', delay: 0 },
  { icon: Stethoscope, label: 'Identifying condition', delay: 0.8 },
  { icon: Activity, label: 'Assessing urgency level', delay: 1.6 },
  { icon: ShieldCheck, label: 'Preparing first-aid steps', delay: 2.4 },
];

export default function AnalysisAnimation() {
  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-emergency/20 ring-pulse" />
          <div className="absolute inset-0 rounded-full bg-emergency/20 ring-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute inset-0 rounded-full bg-emergency flex items-center justify-center">
            <Brain className="w-14 h-14 text-white" strokeWidth={2} />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-text-primary mb-2">Analyzing...</h2>
        <p className="text-text-secondary">ResQ AI is assessing the situation</p>
      </div>

      <div className="space-y-4">
        {stages.map((stage, i) => (
          <motion.div
            key={stage.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: [0, 1, 1, 0.5], x: 0 }}
            transition={{ delay: stage.delay, duration: 0.8, times: [0, 0.3, 0.7, 1] }}
            className="flex items-center gap-4 card-small p-4 bg-surface"
          >
            <div className="w-10 h-10 rounded-xl bg-emergency-soft flex items-center justify-center">
              <stage.icon className="w-5 h-5 text-emergency" strokeWidth={2} />
            </div>
            <span className="text-text-primary font-medium">{stage.label}</span>
            <span className="ml-auto text-sm text-text-muted">{i + 1}/4</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
