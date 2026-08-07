export type UrgencyLevel = 'critical' | 'urgent' | 'moderate' | 'lower';

export interface Condition {
  id: string;
  name: string;
  urgency: UrgencyLevel;
  confidence: number;
  description: string;
  recommendedActions: string[];
  firstAid: string[];
  warnings: string[];
  relatedConditions?: string[];
}

export interface EmergencyCase {
  id: string;
  caseId: string;
  symptoms: string;
  voiceTranscript: string;
  conditionName: string;
  urgencyLevel: UrgencyLevel;
  confidence: number;
  recommendedActions: string[];
  firstAidSteps: string[];
  warnings: string[];
  hospitalId: string | null;
  status: 'active' | 'acknowledged' | 'resolved';
  patientName: string;
  patientAge: number | null;
  location: string;
  createdAt: string;
  updatedAt: string;
  photoUrl?: string | null;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  emergencyPhone: string;
  distanceKm: number;
  departments: string[];
  availableBeds: number;
  totalBeds: number;
  erStatus: 'open' | 'limited' | 'full';
  waitTimeMin: number;
  specialties: string[];
  lat: number | null;
  lng: number | null;
}
