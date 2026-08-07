import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import EmergencyInput from '@/components/emergency/EmergencyInput';
import AnalysisAnimation from '@/components/emergency/AnalysisAnimation';
import EmergencyCard from '@/components/emergency/EmergencyCard';
import FirstAidGuide from '@/components/emergency/FirstAidGuide';
import HospitalFinder from '@/components/emergency/HospitalFinder';
import Navigation from '@/components/Navigation';
import { analyzeSymptoms } from '@/data/conditions';
import { analyzeSymptomsWithGemini } from '@/services/gemini';
import { generateCaseId } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/StoreContext';
import type { Condition } from '@/types';

type Stage = 'input' | 'analyzing' | 'result';

export default function EmergencyPage() {
  const [stage, setStage] = useState<Stage>('input');
  const [condition, setCondition] = useState<Condition | null>(null);
  const [caseId] = useState(generateCaseId());
  const [showFirstAid, setShowFirstAid] = useState(false);
  const [showHospitals, setShowHospitals] = useState(false);
  const navigate = useNavigate();
  const { setCurrentCase, addCase } = useStore();

  const handleAnalyze = async (text: string, transcript: string, photoUrl: string | null) => {
    setStage('analyzing');
    
    // We add a minimum 1.5s delay to let the animation play and feel professional
    const animPromise = new Promise((resolve) => setTimeout(resolve, 1500));
    
    try {
      const [result] = await Promise.all([
        analyzeSymptomsWithGemini(text, photoUrl),
        animPromise
      ]);
      setCondition(result);
      setStage('result');
      persistCase(result, text, transcript, photoUrl);
    } catch (error) {
      console.warn('Gemini analysis failed, falling back to keyword matching:', error);
      // Wait for the remaining animation time if necessary
      await animPromise;
      const result = analyzeSymptoms(text);
      setCondition(result);
      setStage('result');
      persistCase(result, text, transcript, photoUrl);
    }
  };

  const persistCase = async (cond: Condition, symptoms: string, transcript: string, photoUrl: string | null) => {
    const row = {
      case_id: caseId,
      symptoms,
      voice_transcript: transcript,
      condition_name: cond.name,
      urgency_level: cond.urgency,
      confidence: cond.confidence,
      recommended_actions: cond.recommendedActions,
      first_aid_steps: cond.firstAid,
      warnings: cond.warnings,
      status: 'active',
    };
    try {
      const { data, error } = await supabase.from('emergency_cases').insert(row).select().single();
      if (!error && data) {
        const newCase = {
          id: data.id as string,
          caseId: data.case_id as string,
          symptoms: data.symptoms as string,
          voiceTranscript: data.voice_transcript as string,
          conditionName: data.condition_name as string,
          urgencyLevel: data.urgency_level as 'critical' | 'urgent' | 'moderate' | 'lower',
          confidence: Number(data.confidence),
          recommendedActions: data.recommended_actions as string[],
          firstAidSteps: data.first_aid_steps as string[],
          warnings: data.warnings as string[],
          hospitalId: data.hospital_id as string | null,
          status: data.status as 'active' | 'acknowledged' | 'resolved',
          patientName: data.patient_name as string,
          patientAge: data.patient_age as number | null,
          location: data.location as string,
          createdAt: data.created_at as string,
          updatedAt: data.updated_at as string,
          photoUrl: photoUrl,
        };
        addCase(newCase);
        setCurrentCase(newCase);
      }
    } catch {
      // offline fallback
      const offlineCase = {
        id: 'offline-' + caseId,
        caseId,
        symptoms,
        voiceTranscript: transcript,
        conditionName: cond.name,
        urgencyLevel: cond.urgency,
        confidence: cond.confidence,
        recommendedActions: cond.recommendedActions,
        firstAidSteps: cond.firstAid,
        warnings: cond.warnings,
        hospitalId: null,
        status: 'active' as const,
        patientName: '',
        patientAge: null,
        location: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        photoUrl,
      };
      addCase(offlineCase);
      setCurrentCase(offlineCase);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stage]);

  return (
    <div className="min-h-screen bg-surface pt-24 pb-20">
      <Navigation />

      <AnimatePresence mode="wait">
        {stage === 'input' && (
          <EmergencyInput key="input" onAnalyze={handleAnalyze} isAnalyzing={false} />
        )}
        {stage === 'analyzing' && <AnalysisAnimation key="analyzing" />}
        {stage === 'result' && condition && (
          <div key="result">
            <EmergencyCard
              condition={condition}
              caseId={caseId}
              onFindHospital={() => setShowHospitals(true)}
            />

            <div className="max-w-2xl mx-auto px-6 mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowFirstAid((s) => !s)}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                {showFirstAid ? 'Hide' : 'Show'} First Aid Guide
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                Start Over
              </button>
            </div>

            {showFirstAid && <FirstAidGuide condition={condition} />}
            {showHospitals && <HospitalFinder />}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
