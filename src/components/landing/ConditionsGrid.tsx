import { motion } from 'framer-motion';
import { Heart, Brain, Wind, Bone, Droplet, Flame, Activity, AlertCircle, Baby, Thermometer } from 'lucide-react';

const conditions = [
  { icon: Heart, name: 'Heart Attack', color: 'text-emergency', bg: 'bg-emergency-soft' },
  { icon: Brain, name: 'Stroke', color: 'text-emergency', bg: 'bg-emergency-soft' },
  { icon: Wind, name: 'Anaphylaxis', color: 'text-emergency', bg: 'bg-emergency-soft' },
  { icon: Droplet, name: 'Severe Bleeding', color: 'text-emergency', bg: 'bg-emergency-soft' },
  { icon: Activity, name: 'Choking', color: 'text-emergency', bg: 'bg-emergency-soft' },
  { icon: Flame, name: 'Severe Burns', color: 'text-urgent', bg: 'bg-amber-50' },
  { icon: Bone, name: 'Fractures', color: 'text-urgent', bg: 'bg-amber-50' },
  { icon: AlertCircle, name: 'Seizures', color: 'text-urgent', bg: 'bg-amber-50' },
  { icon: Wind, name: 'Asthma Attack', color: 'text-urgent', bg: 'bg-amber-50' },
  { icon: Thermometer, name: 'High Fever', color: 'text-moderate', bg: 'bg-yellow-50' },
  { icon: Baby, name: 'Pediatric', color: 'text-medical', bg: 'bg-blue-50' },
  { icon: Activity, name: 'Allergic Reaction', color: 'text-moderate', bg: 'bg-yellow-50' },
];

export default function ConditionsGrid() {
  return (
    <section className="section-padding-normal bg-surface">
      <div className="container-main">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 rounded-full bg-background text-sm font-medium text-text-secondary mb-4">
            Coverage
          </div>
          <h2 className="heading-section mb-4">Trained on dozens of<br />real emergencies.</h2>
          <p className="body-text max-w-lg mx-auto">
            From life-threatening cardiac events to everyday injuries, ResQ recognizes and guides you through a wide range of conditions.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {conditions.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
              className="card-small p-6 bg-background flex items-center gap-4 hover:shadow-card transition-shadow"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${c.bg}`}>
                <c.icon className={`w-6 h-6 ${c.color}`} strokeWidth={2} />
              </div>
              <span className="font-medium text-text-primary">{c.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
