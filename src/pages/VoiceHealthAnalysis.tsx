import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Play, Square, RefreshCw, Activity, 
  AlertCircle, ShieldCheck, Heart, Info, ArrowRight, 
  AlertOctagon, Phone, UserCheck, Stethoscope, Compass
} from 'lucide-react';
import NavigationBar from '@/components/Navigation';
import { analyzeVoiceSymptomsWithGemini } from '@/services/gemini';
import type { VoiceHealthReport } from '@/types';

// Speech recognition Web Speech API Interfaces
interface ISpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: (event: ISpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: any) => void;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [key: number]: {
      0: { transcript: string };
      isFinal: boolean;
    };
  };
}

export default function VoiceHealthAnalysis() {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'en-US' | 'hi-IN' | 'mr-IN'>('en-US');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<VoiceHealthReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // Check microphone permissions
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permissionStatus) => {
        setMicPermission(permissionStatus.state);
        permissionStatus.onchange = () => {
          setMicPermission(permissionStatus.state);
        };
      });
    }
  }, []);

  // Web Speech API Recording Toggle
  const handleToggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Web Speech Recognition API is not supported in this browser. Please try Google Chrome.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    setError(null);
    try {
      const recognition = new SpeechRecognition() as ISpeechRecognition;
      recognition.lang = selectedLang;
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) {
          setText((prev) => {
            // Avoid repeating identical segments
            if (prev.endsWith(finalTranscript.trim())) return prev;
            return prev ? `${prev} ${finalTranscript.trim()}` : finalTranscript.trim();
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        if (e.error === 'not-allowed') {
          setMicPermission('denied');
          setError('Microphone access was denied. Please allow microphone permission in your browser settings.');
        } else {
          setError(`Speech recognition error: ${e.error}`);
        }
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setMicPermission('granted');
    } catch (err: any) {
      setError(`Failed to start speech recognition: ${err.message}`);
      setIsListening(false);
    }
  };

  const handleClearText = () => {
    setText('');
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please record or type symptoms first before analyzing.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setReport(null);

    try {
      const result = await analyzeVoiceSymptomsWithGemini(
        text.trim(),
        selectedLang === 'en-US' ? 'English' : selectedLang === 'hi-IN' ? 'Hindi' : 'Marathi'
      );
      setReport(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during Gemini analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Severity style configuration mappings
  const severityConfigs = {
    Low: { color: 'text-stable border-green-200/50 bg-green-50/50 dark:bg-green-950/20', dot: 'bg-stable' },
    Moderate: { color: 'text-urgent border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20', dot: 'bg-urgent' },
    High: { color: 'text-emergency border-orange-200/50 bg-orange-50/50 dark:bg-orange-950/20', dot: 'bg-emergency' },
    Critical: { color: 'text-emergency border-red-200/50 bg-red-50/50 dark:bg-red-950/20 animate-pulse', dot: 'bg-emergency' }
  };

  const currentSeverityConfig = report ? severityConfigs[report.severity] : null;

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <NavigationBar />

      <div className="container-main max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-medical-soft text-medical mb-4">
            <Mic className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-semibold">ResQ Diagnostics Portal</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-3">
            Voice Health Analysis
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto text-sm md:text-base">
            Speak your symptoms naturally in English, Hindi, or Marathi. ResQ AI will transcribe and deliver a structured health analysis.
          </p>
        </div>

        {/* Console Box Card */}
        <div className="card p-6 md:p-8 mb-8 shadow-sm border border-border/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className={`w-3.5 h-3.5 rounded-full ${isListening ? 'bg-emergency animate-ping' : 'bg-text-muted'}`} />
              <span className="text-sm font-semibold text-text-primary">
                {isListening ? 'Recording Symptoms...' : 'Microphone Status: Ready'}
              </span>
            </div>

            {/* Language Selector Selector */}
            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-border/60">
              <Compass className="w-3.5 h-3.5 text-text-secondary" />
              <select
                value={selectedLang}
                onChange={(e) => {
                  setSelectedLang(e.target.value as any);
                  if (isListening && recognitionRef.current) {
                    recognitionRef.current.stop();
                    setIsListening(false);
                  }
                }}
                className="bg-transparent text-text-secondary text-xs font-bold focus:outline-none cursor-pointer pr-1"
                disabled={isListening}
              >
                <option value="en-US">English (US)</option>
                <option value="hi-IN">हिन्दी (Hindi)</option>
                <option value="mr-IN">मराठी (Marathi)</option>
              </select>
            </div>
          </div>

          {/* Recording interface area */}
          <div className="flex flex-col items-center justify-center gap-6 py-6 border-b border-border/50 mb-6">
            {/* Record button container */}
            <div className="relative">
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1.4, opacity: [0.15, 0.35, 0.15] }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute inset-0 bg-emergency rounded-full z-0"
                  />
                )}
              </AnimatePresence>
              <button
                onClick={handleToggleListening}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md ${
                  isListening
                    ? 'bg-emergency hover:bg-emergency-dark text-white ring-4 ring-emergency/20'
                    : 'bg-medical hover:bg-medical-dark text-white ring-4 ring-medical/20'
                }`}
                title={isListening ? 'Stop Recording' : 'Start Recording'}
              >
                {isListening ? (
                  <Square className="w-7 h-7 fill-white" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>

            {/* Audio Pulse Waveform (Visual simulation when recording) */}
            {isListening ? (
              <div className="flex items-center gap-1 h-8 px-4">
                {[...Array(9)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: [8, 28, 8],
                    }}
                    transition={{
                      duration: 0.8 + i * 0.1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-1 rounded-full bg-emergency"
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted">
                {micPermission === 'denied'
                  ? 'Microphone blocked. Check browser address bar to allow permissions.'
                  : 'Click the microphone button to start recording.'}
              </p>
            )}
          </div>

          {/* Textarea for symptoms transcription */}
          <div className="mb-6">
            <label className="block text-[10px] font-bold text-text-secondary mb-2 uppercase tracking-wider">
              Recorded Symptoms Transcript
            </label>
            <textarea
              className="textarea-field font-normal text-sm"
              rows={4}
              placeholder="Your transcribed speech will appear here. Feel free to edit or type details manually..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleClearText}
              disabled={!text || isAnalyzing}
              className="btn-secondary !h-11 px-5 flex items-center justify-center gap-1.5 text-xs disabled:opacity-40"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear Transcript
            </button>
            <button
              onClick={handleAnalyze}
              disabled={!text.trim() || isAnalyzing || isListening}
              className="btn-primary !h-11 px-8 flex items-center justify-center gap-2 text-xs bg-medical hover:bg-medical-dark disabled:opacity-40"
            >
              {isAnalyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing Symptoms...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" /> Analyze Symptoms
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl border border-emergency/20 bg-emergency-soft/30 text-emergency text-sm flex items-start gap-2.5 mb-8"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error:</span> {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gemini Loading Skeleton Placeholder */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="card p-6 animate-pulse">
                <div className="h-4 bg-border rounded-lg w-1/3 mb-4" />
                <div className="h-3 bg-border rounded-lg w-full mb-2.5" />
                <div className="h-3 bg-border rounded-lg w-5/6" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6 animate-pulse h-40" />
                <div className="card p-6 animate-pulse h-40" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Analysis Results Display */}
        <AnimatePresence>
          {report && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Emergency Banner Alert Card */}
              {(report.severity === 'Critical' || report.ambulance_required) && (
                <div className="card border-emergency/40 bg-emergency-soft/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-emergency/5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-emergency text-white flex items-center justify-center animate-bounce flex-shrink-0">
                      <AlertOctagon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">
                        Emergency Symptoms Detected
                      </h3>
                      <p className="text-sm text-text-secondary mt-0.5 leading-relaxed">
                        Emergency symptoms detected. Seek immediate medical assistance. {report.reason}
                      </p>
                    </div>
                  </div>
                  <a
                    href="tel:112"
                    className="btn-emergency h-12 px-6 flex items-center justify-center gap-2 text-sm flex-shrink-0"
                  >
                    <Phone className="w-4 h-4" /> Call Helpline 112
                  </a>
                </div>
              )}

              {/* Main Summary Section */}
              <div className="card p-6 md:p-8">
                <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-medical" /> Symptoms Summary
                </h3>
                <p className="text-text-secondary leading-relaxed text-sm md:text-base">
                  {report.summary}
                </p>
              </div>

              {/* Grid Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Severity Badge Card */}
                <div className="card p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">Severity Level</h4>
                    <div className="flex items-center gap-2">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${currentSeverityConfig?.color} flex items-center gap-2`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${currentSeverityConfig?.dot}`} />
                        {report.severity}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary mt-4 leading-relaxed">
                    {report.reason}
                  </p>
                </div>

                {/* Recommended Specialist Department Card */}
                <div className="card p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">Recommended Specialist</h4>
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-medical-soft text-medical flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <span className="text-lg font-bold text-text-primary">
                        {report.recommended_specialist}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary mt-4">
                    ResQ recommends consulting a {report.recommended_specialist} specialist regarding these symptoms.
                  </p>
                </div>

                {/* Possible Conditions Card */}
                <div className="card p-6 md:col-span-2">
                  <h4 className="text-xs font-bold text-text-muted mb-4 uppercase tracking-wider">Possible Conditions (Projections)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {report.possible_conditions.map((condition) => (
                      <div key={condition.name} className="p-4 rounded-xl bg-surface border border-border/50 flex items-center justify-between">
                        <div className="font-semibold text-text-primary text-sm">{condition.name}</div>
                        <div className="text-xs font-mono font-bold text-medical bg-medical-soft px-2.5 py-0.5 rounded-full">
                          {condition.probability}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* First Aid Steps Card */}
                <div className="card p-6 md:p-8 md:col-span-2">
                  <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2 border-b border-border/50 pb-3">
                    <Heart className="w-5 h-5 text-emergency animate-pulse" /> Emergency First Aid
                  </h3>
                  <ol className="space-y-3.5">
                    {report.first_aid.map((step, idx) => (
                      <li key={idx} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emergency-soft text-emergency font-bold text-xs flex items-center justify-center mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-text-primary leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Next Steps List Card */}
                <div className="card p-6 md:p-8 md:col-span-2">
                  <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2 border-b border-border/50 pb-3">
                    <UserCheck className="w-5 h-5 text-stable" /> Next Action Steps
                  </h3>
                  <ul className="space-y-3">
                    {report.next_steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-text-primary">
                        <ArrowRight className="w-4 h-4 text-text-secondary mt-1 flex-shrink-0" />
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Disclaimer Info Warning Card */}
              <div className="p-4 rounded-2xl border border-border bg-surface text-center">
                <div className="flex items-center justify-center gap-2 text-text-muted text-xs">
                  <Info className="w-4 h-4 text-text-secondary" />
                  <span className="font-semibold text-text-secondary">{report.disclaimer}</span>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
