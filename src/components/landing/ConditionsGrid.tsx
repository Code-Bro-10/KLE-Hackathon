import { motion } from 'framer-motion';
import { Heart, Brain, Wind, Bone, Droplet, Flame, Activity, AlertCircle, Baby, Thermometer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ConditionsGrid() {
  const { t } = useTranslation();

  const conditions = [
    { icon: Heart, name: t('heartAttack'), color: 'text-emergency', bg: 'bg-emergency-soft' },
    { icon: Brain, name: t('stroke'), color: 'text-emergency', bg: 'bg-emergency-soft' },
    { icon: Wind, name: t('anaphylaxis'), color: 'text-emergency', bg: 'bg-emergency-soft' },
    { icon: Droplet, name: t('severeBleeding'), color: 'text-emergency', bg: 'bg-emergency-soft' },
    { icon: Activity, name: t('choking'), color: 'text-emergency', bg: 'bg-emergency-soft' },
    { icon: Flame, name: t('severeBurns'), color: 'text-urgent', bg: 'bg-amber-50' },
    { icon: Bone, name: t('fractures'), color: 'text-urgent', bg: 'bg-amber-50' },
    { icon: AlertCircle, name: t('seizures'), color: 'text-urgent', bg: 'bg-amber-50' },
    { icon: Wind, name: t('asthmaAttack'), color: 'text-urgent', bg: 'bg-amber-50' },
    { icon: Thermometer, name: t('highFever'), color: 'text-moderate', bg: 'bg-yellow-50' },
    { icon: Baby, name: t('pediatric'), color: 'text-medical', bg: 'bg-blue-50' },
    { icon: Activity, name: t('allergicReaction'), color: 'text-moderate', bg: 'bg-yellow-50' },
  ];

  return (
    <section className="section-padding-normal bg-surface">
      <div className="container-main">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 rounded-full bg-background text-sm font-medium text-text-secondary mb-4">
            {t('coverageSub')}
          </div>
          <h2 className="heading-section mb-4">
            {t('coverageTitle')}
          </h2>
          <p className="body-text max-w-lg mx-auto">
            {t('coverageDesc')}
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
