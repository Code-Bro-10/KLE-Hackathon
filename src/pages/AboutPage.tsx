import { motion } from 'framer-motion';
import { Brain, ShieldCheck, Heart, Zap, Eye, Lock, Target, Users, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/landing/Footer';

const features = [
  { icon: Zap, title: 'Instant Triage', desc: 'AI analyzes symptoms in under 3 seconds and identifies the likely condition with a confidence score.' },
  { icon: ShieldCheck, title: 'Guided First Aid', desc: 'Step-by-step instructions for over 14 medical emergencies, from cardiac arrest to minor cuts.' },
  { icon: Brain, title: 'Voice & Text Input', desc: 'Speak naturally or type your symptoms — ResQ understands both, perfect when your hands are full.' },
  { icon: Heart, title: 'Live ER Routing', desc: 'Real-time hospital availability, bed counts, and wait times so you go where help is ready.' },
  { icon: Eye, title: 'Condition Recognition', desc: 'Trained on a wide range of emergencies including cardiac, stroke, anaphylaxis, trauma, and pediatric.' },
  { icon: Lock, title: 'Private & Secure', desc: 'Your triage sessions are stored securely and only shared with the hospital you choose.' },
];

const values = [
  { icon: Target, title: 'Every Second Counts', desc: 'In an emergency, minutes can mean the difference between life and death. We optimize for speed.' },
  { icon: Users, title: 'For Everyone', desc: 'No medical training required. ResQ speaks plain English and guides anyone through a crisis.' },
  { icon: Activity, title: 'Always On', desc: 'Available 24/7, 365 days a year. When you need help, ResQ is ready.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="pt-40 pb-20 gradient-hero relative overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-emergency/10 blur-3xl orb-float" />
        <div className="container-main relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-block px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-border mb-6">
              <span className="text-sm font-medium text-text-secondary">About ResQ</span>
            </div>
            <h1 className="heading-display mb-6">AI that saves lives<br />when seconds matter.</h1>
            <p className="body-text max-w-xl mx-auto">
              ResQ was built to bridge the critical gap between an emergency happening and professional help arriving.
              We turn panic into clear, actionable guidance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="section-padding-normal bg-background">
        <div className="container-main max-w-3xl text-center">
          <h2 className="heading-section mb-6">Our Mission</h2>
          <p className="text-xl text-text-secondary leading-relaxed">
            Over 300,000 people die each year from medical emergencies where bystanders didn\u2019t know what to do.
            ResQ exists to change that. By putting expert-level triage and first-aid guidance in everyone\u2019s pocket,
            we empower ordinary people to act decisively in extraordinary moments.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding-normal bg-surface">
        <div className="container-main">
          <div className="text-center mb-16">
            <h2 className="heading-section mb-4">What makes ResQ different</h2>
            <p className="body-text max-w-lg mx-auto">Built for real emergencies, not just demos.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card p-8"
              >
                <div className="w-14 h-14 rounded-2xl bg-emergency-soft flex items-center justify-center mb-5">
                  <f.icon className="w-7 h-7 text-emergency" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">{f.title}</h3>
                <p className="text-text-secondary leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding-normal section-dark text-white">
        <div className="container-main">
          <div className="text-center mb-16">
            <h2 className="heading-section text-white mb-4">What we believe</h2>
            <p className="text-white/60 text-lg max-w-lg mx-auto">The principles that guide every decision we make.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-dark-card rounded-lg p-8 border border-white/5"
              >
                <div className="w-14 h-14 rounded-2xl bg-emergency/20 flex items-center justify-center mb-5">
                  <v.icon className="w-7 h-7 text-emergency" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{v.title}</h3>
                <p className="text-white/60 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding-normal bg-background">
        <div className="container-main text-center">
          <h2 className="heading-section mb-4">Ready to feel prepared?</h2>
          <p className="body-text max-w-lg mx-auto mb-8">Try ResQ now — no signup required.</p>
          <Link to="/emergency" className="btn-emergency h-16 px-10 inline-flex items-center gap-3 text-lg">
            Start Emergency Triage <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
