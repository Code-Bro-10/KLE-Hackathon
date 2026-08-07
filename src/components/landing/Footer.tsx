import { Activity, Phone, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-dark text-white py-16">
      <div className="container-main">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-emergency flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-lg tracking-tight">ResQ</span>
            </div>
            <p className="text-white/60 max-w-sm leading-relaxed">
              AI-powered emergency triage and first-aid guidance. Every second counts — ResQ helps you make them count.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-white/60">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/emergency" className="hover:text-white transition-colors">Emergency Triage</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Hospital Dashboard</Link></li>
              <li><Link to="/safety" className="hover:text-white transition-colors">Safety Tips</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Emergency</h4>
            <ul className="space-y-3 text-white/60">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> 911</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> support@resq.app</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Springfield, USA</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">
            ResQ is a guide, not a replacement for professional medical care. Always call 911 in a real emergency.
          </p>
          <p className="text-white/40 text-sm">© 2024 ResQ AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
