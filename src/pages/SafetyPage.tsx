import { motion } from 'framer-motion';
import { Phone, Heart, Brain, Wind, Flame, Droplet, Bone, AlertCircle, Baby, ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/landing/Footer';

const emergencyTips = [
  { icon: Phone, title: 'Call 911 First', desc: 'In any life-threatening emergency, call 911 before doing anything else. ResQ is a guide, not a replacement.', color: 'text-emergency', bg: 'bg-emergency-soft' },
  { icon: Heart, title: 'Know CPR', desc: 'Hands-only CPR: push hard and fast in the center of the chest at 100-120 beats per minute until help arrives.', color: 'text-emergency', bg: 'bg-emergency-soft' },
  { icon: Brain, title: 'Recognize Stroke (FAST)', desc: 'Face drooping, Arm weakness, Speech difficulty, Time to call 911. Every minute matters.', color: 'text-emergency', bg: 'bg-emergency-soft' },
  { icon: Wind, title: 'Choking: Heimlich', desc: '5 back blows, then 5 abdominal thrusts. Repeat until the object is expelled or the person goes limp.', color: 'text-urgent', bg: 'bg-amber-50' },
  { icon: Droplet, title: 'Stop Bleeding', desc: 'Apply firm, direct pressure with a clean cloth. Don\u2019t lift to check — add layers if blood soaks through.', color: 'text-emergency', bg: 'bg-emergency-soft' },
  { icon: Flame, title: 'Cool Burns', desc: 'Run cool (not cold) water over the burn for 20 minutes. Never use ice, butter, or ointments.', color: 'text-urgent', bg: 'bg-amber-50' },
  { icon: Bone, title: 'Suspected Fracture', desc: 'Don\u2019t move the limb. Immobilize with a splint and apply ice wrapped in cloth. Keep the person still.', color: 'text-urgent', bg: 'bg-amber-50' },
  { icon: AlertCircle, title: 'Seizure Safety', desc: 'Clear the area, cushion the head, turn them on their side after. Never put anything in their mouth.', color: 'text-urgent', bg: 'bg-amber-50' },
  { icon: Baby, title: 'Child Emergencies', desc: 'Children aren\u2019t small adults. Use pediatric doses and techniques. Call poison control at 1-800-222-1222.', color: 'text-medical', bg: 'bg-blue-50' },
];

const kitItems = [
  'Adhesive bandages (assorted sizes)', 'Sterile gauze pads', 'Medical tape', 'Antiseptic wipes',
  'Antibiotic ointment', 'Pain relievers (paracetamol & ibuprofen)', 'Tweezers', 'Scissors',
  'Disposable gloves', 'Digital thermometer', 'Instant cold packs', 'Elastic bandage (ACE wrap)',
  'First aid manual', 'Emergency contact list', 'EpiPen (if prescribed)', 'Inhaler (if prescribed)',
];

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero */}
      <section className="pt-40 pb-20 gradient-medical relative overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-medical/10 blur-3xl orb-float" />
        <div className="container-main relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-border mb-6">
              <ShieldCheck className="w-4 h-4 text-medical" />
              <span className="text-sm font-medium text-text-secondary">Safety & Preparedness</span>
            </div>
            <h1 className="heading-display mb-6">Be ready before<br />the emergency.</h1>
            <p className="body-text max-w-xl mx-auto">
              The best time to learn first aid is before you need it. Review these essential tips and build your emergency kit today.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Emergency tips */}
      <section className="section-padding-normal bg-white">
        <div className="container-main">
          <div className="text-center mb-16">
            <h2 className="heading-section mb-4">Essential emergency tips</h2>
            <p className="body-text max-w-lg mx-auto">Quick-reference guidance for the most common life-threatening situations.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {emergencyTips.map((tip, i) => (
              <motion.div
                key={tip.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="card p-8"
              >
                <div className={`w-14 h-14 rounded-2xl ${tip.bg} flex items-center justify-center mb-5`}>
                  <tip.icon className={`w-7 h-7 ${tip.color}`} strokeWidth={2} />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">{tip.title}</h3>
                <p className="text-text-secondary leading-relaxed">{tip.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency kit checklist */}
      <section className="section-padding-normal bg-surface">
        <div className="container-main max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="heading-section mb-4">Build your emergency kit</h2>
            <p className="body-text max-w-lg mx-auto">A well-stocked first aid kit is essential for every home and car.</p>
          </div>
          <div className="card p-8">
            <div className="grid md:grid-cols-2 gap-3">
              {kitItems.map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-stable/20 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-stable" />
                  </div>
                  <span className="text-text-primary">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Important numbers */}
      <section className="section-padding-normal bg-white">
        <div className="container-main max-w-3xl text-center">
          <h2 className="heading-section mb-4">Save these numbers</h2>
          <p className="body-text mb-12 max-w-lg mx-auto">Add these to your phone\u2019s contacts today.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: 'Emergency', number: '911', desc: 'Fire, Police, Ambulance' },
              { name: 'Poison Control', number: '1-800-222-1222', desc: '24/7 poison emergency' },
              { name: 'Crisis Line', number: '988', desc: 'Mental health crisis' },
            ].map((contact) => (
              <a
                key={contact.name}
                href={`tel:${contact.number}`}
                className="card p-6 text-left hover:shadow-card transition-shadow"
              >
                <div className="w-12 h-12 rounded-2xl bg-emergency-soft flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-emergency" strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-text-primary mb-1">{contact.name}</h3>
                <div className="text-2xl font-semibold text-emergency mb-1">{contact.number}</div>
                <p className="text-sm text-text-secondary">{contact.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding-normal section-dark text-white">
        <div className="container-main text-center">
          <Zap className="w-12 h-12 text-emergency mx-auto mb-6" />
          <h2 className="heading-section text-white mb-4">Don\u2019t wait for an emergency.</h2>
          <p className="text-white/60 text-lg max-w-lg mx-auto mb-8">Try ResQ now and see how fast AI triage can be.</p>
          <Link to="/emergency" className="btn-emergency h-16 px-10 inline-flex items-center gap-3 text-lg">
            Start Emergency Triage <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
