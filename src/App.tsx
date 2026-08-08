import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from '@/store/StoreContext';
import LandingPage from '@/pages/LandingPage';
import EmergencyPage from '@/pages/EmergencyPage';
import HospitalDashboard from '@/pages/HospitalDashboard';
import CaseDetail from '@/pages/CaseDetail';
import AboutPage from '@/pages/AboutPage';
import SafetyPage from '@/pages/SafetyPage';
import MapPage from '@/pages/MapPage';
import DoctorConsultation from '@/pages/DoctorConsultation';
import VoiceHealthAnalysis from '@/pages/VoiceHealthAnalysis';
import PharmacyPage from '@/pages/PharmacyPage';
import RentalsPage from '@/pages/RentalsPage';
import AdminPage from '@/pages/AdminPage';
import UserLoginPage from '@/pages/UserLoginPage';
import UserDashboardPage from '@/pages/UserDashboardPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
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
          <Route path="/consult" element={<DoctorConsultation />} />
          <Route path="/voice-analysis" element={<VoiceHealthAnalysis />} />
          <Route path="/pharmacy" element={<PharmacyPage />} />
          <Route path="/rentals" element={<RentalsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<UserLoginPage />} />
          <Route path="/user-dashboard" element={<UserDashboardPage />} />
          <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
        </Routes>
        <SOSButton />
      </BrowserRouter>
    </StoreProvider>
  );
}
