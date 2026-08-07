import { motion } from 'framer-motion';
import { Heart, Wind, Droplet, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { Condition } from '@/types';

interface Props {
  condition: Condition;
}

export default function FirstAidGuide({ condition }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto px-6 mt-8"
    >
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emergency-soft flex items-center justify-center">
            <Heart className="w-6 h-6 text-emergency" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">First Aid Guide</h2>
            <p className="text-text-secondary text-sm">Follow these steps for {condition.name}</p>
          </div>
        </div>

        <div className="space-y-4">
          {condition.firstAid.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex gap-4 p-4 rounded-2xl bg-surface hover:bg-surface-blue transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emergency text-white font-semibold flex items-center justify-center">
                {i + 1}
              </div>
              <div className="flex-1 pt-1.5">
                <p className="text-text-primary leading-relaxed">{step}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-stable flex-shrink-0 mt-2" />
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-blue-50 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-medical flex-shrink-0 mt-0.5" />
          <p className="text-sm text-text-secondary">
            These steps are a guide. If symptoms worsen or don\u2019t improve, call 911 or go to the nearest ER immediately.
          </p>
        </div>

        <div className="mt-4 flex gap-3 text-sm text-text-muted">
          <span className="flex items-center gap-1"><Droplet className="w-4 h-4" /> Stay calm</span>
          <span className="flex items-center gap-1"><Wind className="w-4 h-4" /> Monitor breathing</span>
          <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> Check pulse</span>
        </div>
      </div>
    </motion.div>
  );
}
