import Navigation from '@/components/Navigation';
import Hero from '@/components/landing/Hero';
import HowItWorks from '@/components/landing/HowItWorks';
import ConditionsGrid from '@/components/landing/ConditionsGrid';
import DemoSection from '@/components/landing/DemoSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <HowItWorks />
      <ConditionsGrid />
      <DemoSection />
      <CTASection />
      <Footer />
    </div>
  );
}
