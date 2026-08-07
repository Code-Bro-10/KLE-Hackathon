import { motion } from 'framer-motion';
import { Activity, Clock, MapPin, Heart, ShieldCheck, Brain } from 'lucide-react';

export default function DemoSection() {
  return (
    <section className="section-padding-normal section-dark text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-emergency/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-medical/10 blur-3xl" />

      <div className="container-main relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 rounded-full bg-white/10 text-sm font-medium text-white/80 mb-4">
            See It In Action
          </div>
          <h2 className="heading-section text-white mb-4">A clear head in a<br />critical moment.</h2>
          <p className="text-white/60 text-lg max-w-lg mx-auto">
            Watch how ResQ turns a frightening situation into a calm, guided response.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              icon: Brain,
              title: 'Instant Analysis',
              desc: 'AI identifies the condition and urgency in under 3 seconds.',
              stat: '92% confidence',
            },
            {
              icon: Heart,
              title: 'Step-by-Step Aid',
              desc: 'Clear, numbered first-aid instructions you can follow in real time.',
              stat: '5 steps shown',
            },
            {
              icon: MapPin,
              title: 'Live ER Routing',
              desc: 'Nearest available emergency room with bed and wait-time status.',
              stat: '1.9 km away',
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="bg-dark-card rounded-lg p-8 border border-white/5"
            >
              <div className="w-14 h-14 rounded-2xl bg-emergency/20 flex items-center justify-center mb-6">
                <card.icon className="w-7 h-7 text-emergency" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-semibold mb-3">{card.title}</h3>
              <p className="text-white/60 mb-6 text-[15px] leading-relaxed">{card.desc}</p>
              <div className="flex items-center gap-2 text-sm text-emergency font-medium">
                <Clock className="w-4 h-4" />
                {card.stat}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-3 text-white/80">
            <ShieldCheck className="w-5 h-5 text-stable" />
            <span className="text-sm">ResQ is a guide, not a replacement for professional medical care. Always call 112 when in doubt.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
