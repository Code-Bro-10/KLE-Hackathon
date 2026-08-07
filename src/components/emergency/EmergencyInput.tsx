import { useState, useRef, useEffect } from 'react';
import { Mic, Send, Phone, Camera, Image, Trash2, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/StoreContext';
import { useTranslation } from 'react-i18next';

interface Props {
  onAnalyze: (text: string, transcript: string, photoUrl: string | null) => void;
  isAnalyzing: boolean;
}

export default function EmergencyInput({ onAnalyze, isAnalyzing }: Props) {
  const { language } = useStore();
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const recognitionRef = useRef<unknown>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    if (isCameraActive) {
      stopCamera();
      return;
    }
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setIsCameraActive(false);
      alert('Could not access camera. Try uploading an image instead.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPhotoUrl(dataUrl);
    }
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    return () => {
      // Clean up camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleVoice = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback: simulate voice input
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        const sample = 'Severe chest pain and tightness, pain radiating down the left arm, shortness of breath';
        setText(sample);
      }, 2500);
      return;
    }

    if (isListening) {
      (recognitionRef.current as { stop: () => void } | null)?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new (SpeechRecognition as { new (): ISpeechRecognition })();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setText(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleSubmit = () => {
    if ((text.trim() || photoUrl) && !isAnalyzing) {
      onAnalyze(text.trim() || 'Photo Attachment Triage', text.trim() || 'Photo Attachment Triage', photoUrl);
    }
  };

  const quickPrompts = [
    'Chest pain and shortness of breath',
    'Child is choking on food',
    'Severe burn from hot water',
    'Possible broken arm after a fall',
  ];

  return (
    <div className="max-w-2xl mx-auto px-6">
      <AnimatePresence mode="wait">
        <motion.div
          key="input"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emergency-soft mb-6">
              <span className="w-2 h-2 rounded-full bg-emergency live-dot" />
              <span className="text-sm font-medium text-emergency">{t('triageActive')}</span>
            </div>
            <h1 className="heading-section mb-4">{t('whatsHappening')}</h1>
            <p className="body-text max-w-md mx-auto">
              {t('describeSymptoms')}
            </p>
          </div>

          <div className="card p-8 mb-6">
            <textarea
              className="textarea-field"
              placeholder={t('placeholder')}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isAnalyzing}
              autoFocus
            />

            {/* Live Camera Stream Panel */}
            {isCameraActive && (
              <div className="mt-4 p-4 bg-surface rounded-2xl border border-border/60 relative">
                <video ref={videoRef} autoPlay playsInline className="w-full h-48 rounded-xl object-cover" />
                <div className="flex gap-2 mt-3 justify-center">
                  <button
                    onClick={capturePhoto}
                    className="px-4 py-2 bg-emergency text-white text-xs font-semibold rounded-full hover:opacity-90 transition-all flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Capture Photo
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 bg-text-secondary text-white text-xs font-semibold rounded-full hover:opacity-90 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Uploaded/Captured Image Preview */}
            {photoUrl && (
              <div className="mt-4 flex items-center gap-3 p-3 bg-surface rounded-2xl border border-border/60">
                <img src={photoUrl} className="w-16 h-16 rounded-xl object-cover border border-border" alt="Incident preview" />
                <div>
                  <span className="text-xs font-semibold text-text-primary block">Emergency Photo Attached</span>
                  <span className="text-[10px] text-text-secondary">Will be sent to AI for triage</span>
                </div>
                <button
                  onClick={() => setPhotoUrl(null)}
                  className="ml-auto w-8 h-8 rounded-full bg-emergency-soft flex items-center justify-center text-emergency hover:bg-emergency hover:text-white transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mt-6">
              {/* Voice Button */}
              <button
                onClick={handleVoice}
                title="Voice Recording"
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isListening ? 'bg-emergency text-white mic-pulse' : 'bg-surface text-text-secondary hover:bg-emergency-soft hover:text-emergency'
                }`}
              >
                <Mic className="w-6 h-6" strokeWidth={2} />
              </button>

              {/* Camera Button */}
              <button
                onClick={startCamera}
                title="Take Photo"
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isCameraActive ? 'bg-emergency text-white' : 'bg-surface text-text-secondary hover:bg-emergency-soft hover:text-emergency'
                }`}
              >
                <Camera className="w-6 h-6" strokeWidth={2} />
              </button>

              {/* File Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload Photo"
                className="w-14 h-14 rounded-full bg-surface text-text-secondary flex items-center justify-center hover:bg-emergency-soft hover:text-emergency transition-all"
              >
                <Image className="w-6 h-6" strokeWidth={2} />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              <button
                onClick={handleSubmit}
                disabled={(!text.trim() && !photoUrl) || isAnalyzing}
                className="btn-emergency h-14 px-8 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
              >
                <Send className="w-5 h-5" strokeWidth={2} />
                {t('analyzeNow')}
              </button>
            </div>

            {isListening && (
              <p className="text-center text-sm text-emergency mt-4 font-medium animate-pulse">Listening... speak clearly</p>
            )}
          </div>

          <div className="mb-8">
            <p className="text-sm text-text-muted text-center mb-3">{t('tryExample')}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setText(prompt)}
                  className="px-4 py-2 rounded-full bg-surface text-sm text-text-secondary hover:bg-surface-blue hover:text-medical transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <a href={`tel:${t('emergencyNumber')}`} className="inline-flex items-center gap-2 text-emergency font-semibold hover:underline">
              <Phone className="w-5 h-5" strokeWidth={2.5} />
              {t('callDirectly')}
            </a>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

interface ISpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: (event: ISpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: () => void;
}

interface ISpeechRecognitionEvent {
  results: { 0: { transcript: string } }[];
}
