import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { EmergencyCase, Hospital } from '@/types';
import { supabase } from '@/lib/supabase';
import { mockHospitals } from '@/data/hospitals';

interface StoreContextType {
  currentCase: EmergencyCase | null;
  cases: EmergencyCase[];
  hospitals: Hospital[];
  setCurrentCase: (c: EmergencyCase | null) => void;
  addCase: (c: EmergencyCase) => void;
  updateCase: (id: string, updates: Partial<EmergencyCase>) => void;
  loadCases: () => Promise<void>;
  loadHospitals: () => Promise<void>;
  language: string;
  setLanguage: (lang: string) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentCase, setCurrentCase] = useState<EmergencyCase | null>(null);
  const [cases, setCases] = useState<EmergencyCase[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>(mockHospitals);
  const [language, setLanguageState] = useState<string>(() => localStorage.getItem('resq-lang') || 'en');

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('resq-lang', lang);
  };

  const loadHospitals = async () => {
    try {
      const { data, error } = await supabase
        .from('hospital_cases')
        .select('*')
        .order('distance_km', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        const mapped: Hospital[] = data.map((h: Record<string, unknown>) => ({
          id: h.id as string,
          name: h.name as string,
          address: h.address as string,
          phone: h.phone as string,
          emergencyPhone: h.emergency_phone as string,
          distanceKm: Number(h.distance_km),
          departments: h.departments as string[],
          availableBeds: h.available_beds as number,
          totalBeds: h.total_beds as number,
          erStatus: h.er_status as Hospital['erStatus'],
          waitTimeMin: h.wait_time_min as number,
          specialties: h.specialties as string[],
          lat: h.lat as number | null,
          lng: h.lng as number | null,
        }));
        setHospitals(mapped);
      }
    } catch {
      setHospitals(mockHospitals);
    }
  };

  const loadCases = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_cases')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const mapped: EmergencyCase[] = data.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          caseId: c.case_id as string,
          symptoms: c.symptoms as string,
          voiceTranscript: c.voice_transcript as string,
          conditionName: c.condition_name as string,
          urgencyLevel: c.urgency_level as EmergencyCase['urgencyLevel'],
          confidence: Number(c.confidence),
          recommendedActions: c.recommended_actions as string[],
          firstAidSteps: c.first_aid_steps as string[],
          warnings: c.warnings as string[],
          hospitalId: c.hospital_id as string | null,
          status: c.status as EmergencyCase['status'],
          patientName: c.patient_name as string,
          patientAge: c.patient_age as number | null,
          location: c.location as string,
          createdAt: c.created_at as string,
          updatedAt: c.updated_at as string,
        }));
        setCases(mapped);
      }
    } catch {
      // empty cases is fine
    }
  };

  const addCase = (c: EmergencyCase) => {
    setCases((prev) => [c, ...prev]);
  };

  const updateCase = (id: string, updates: Partial<EmergencyCase>) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  useEffect(() => {
    loadHospitals();
    loadCases();
  }, []);

  return (
    <StoreContext.Provider
      value={{ currentCase, cases, hospitals, setCurrentCase, addCase, updateCase, loadCases, loadHospitals, language, setLanguage }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
