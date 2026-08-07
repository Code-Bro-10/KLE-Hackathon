import { Phone, Mic, Brain, Building2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Phone,
      title: t('step1Title'),
      description: t('step1Desc'),
      color: 'bg-emergency-soft text-emergency',
    },
    {
      icon: Mic,
      title: t('step2Title'),
      description: t('step2Desc'),
      color: 'bg-blue-50 text-medical',
    },
    {
      icon: Brain,
      title: t('step3Title'),
      description: t('step3Desc'),
      color: 'bg-amber-50 text-urgent',
    },
    {
      icon: Building2,
      title: t('step4Title'),
      description: t('step4Desc'),
      color: 'bg-green-50 text-stable',
    },
  ];

  return (
    <section className="section-padding-normal bg-background">
      <div className="container-main">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 rounded-full bg-surface text-sm font-medium text-text-secondary mb-4">
            {t('howItWorksSub')}
          </div>
          <h2 className="heading-section mb-4">
            {t('howItWorksTitle')}
          </h2>
          <p className="body-text max-w-lg mx-auto">
            ResQ guides you through the critical first minutes of any medical emergency with calm, clear, AI-driven instructions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.title} className="relative">
              <div className="card p-8 h-full flex flex-col">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${step.color}`}>
                  <step.icon className="w-7 h-7" strokeWidth={2} />
                </div>
                <div className="text-sm font-semibold text-text-muted mb-2">STEP {i + 1}</div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">{step.title}</h3>
                <p className="text-text-secondary text-[15px] leading-relaxed flex-1">{step.description}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-3 z-10 w-6 h-6 rounded-full bg-background border border-border items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-text-muted" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
