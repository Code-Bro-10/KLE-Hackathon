import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from '@/store/StoreContext';
import LandingPage from '@/pages/LandingPage';
import EmergencyPage from '@/pages/EmergencyPage';
import HospitalDashboard from '@/pages/HospitalDashboard';
import CaseDetail from '@/pages/CaseDetail';
import AboutPage from '@/pages/AboutPage';
import SafetyPage from '@/pages/SafetyPage';
import MapPage from '@/pages/MapPage';
import SOSButton from '@/components/emergency/SOSButton';

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/emergency" element={<EmergencyPage />} />
          <Route path="/dashboard" element={<HospitalDashboard />} />
          <Route path="/case/:id" element={<CaseDetail />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/map" element={<MapPage />} />
        </Routes>
        <SOSButton />
      </BrowserRouter>
    </StoreProvider>
  );
}
