import { Link } from 'react-router-dom';
import { Phone, ArrowRight, Activity } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="section-padding-normal bg-background">
      <div className="container-main">
        <div className="card-showcase p-12 md:p-20 text-center relative overflow-hidden gradient-medical">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-emergency/10 blur-3xl orb-glow" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-medical/10 blur-3xl orb-glow" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-full bg-emergency flex items-center justify-center mx-auto mb-8 shadow-emergency">
              <Activity className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="heading-section mb-4">Don\u2019t wait for an<br />emergency to prepare.</h2>
            <p className="body-text max-w-lg mx-auto mb-10">
              Bookmark ResQ now. When seconds matter, you\u2019ll have instant access to life-saving guidance right in your pocket.
            </p>
            <Link to="/emergency" className="btn-emergency h-16 px-10 inline-flex items-center gap-3 text-lg">
              <Phone className="w-5 h-5" strokeWidth={2.5} />
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
