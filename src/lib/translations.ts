export type Language = 'en' | 'hi' | 'kn' | 'es';

export interface TranslationDict {
  home: string;
  about: string;
  safety: string;
  hospital: string;
  emergency: string;
  triageActive: string;
  whatsHappening: string;
  describeSymptoms: string;
  placeholder: string;
  analyzeNow: string;
  tryExample: string;
  callDirectly: string;
  emergencyNumber: string;
}

export const translations: Record<Language, TranslationDict> = {
  en: {
    home: 'Home',
    about: 'About',
    safety: 'Safety',
    hospital: 'Hospital',
    emergency: 'Emergency',
    triageActive: 'Emergency Triage Active',
    whatsHappening: "What's happening?",
    describeSymptoms: "Describe the symptoms you're seeing. Be as specific as you can. ResQ will analyze and guide you instantly.",
    placeholder: "e.g., My friend has severe chest pain and can't catch their breath...",
    analyzeNow: 'Analyze Now',
    tryExample: 'Or try a quick example:',
    callDirectly: 'Call 112 directly',
    emergencyNumber: '112',
  },
  hi: {
    home: 'होम',
    about: 'हमारे बारे में',
    safety: 'सुरक्षा',
    hospital: 'अस्पताल',
    emergency: 'आपातकालीन',
    triageActive: 'आपातकालीन ट्राइएज सक्रिय है',
    whatsHappening: 'क्या हो रहा है?',
    describeSymptoms: 'उन लक्षणों का वर्णन करें जिन्हें आप देख रहे हैं। जितना हो सके विशिष्ट रहें। ResQ तुरंत विश्लेषण और मार्गदर्शन करेगा।',
    placeholder: 'जैसे, मेरे दोस्त को छाती में तेज दर्द है और वह सांस नहीं ले पा रहा है...',
    analyzeNow: 'अभी विश्लेषण करें',
    tryExample: 'या एक त्वरित उदाहरण आज़माएं:',
    callDirectly: 'सीधे 112 पर कॉल करें',
    emergencyNumber: '112',
  },
  kn: {
    home: 'ಮನೆ',
    about: 'ನಮ್ಮ ಬಗ್ಗೆ',
    safety: 'ಸುರಕ್ಷತೆ',
    hospital: 'ಆಸ್ಪತ್ರೆ',
    emergency: 'ತುರ್ತು',
    triageActive: 'ತುರ್ತು ಟ್ರಯೇಜ್ ಸಕ್ರಿಯವಾಗಿದೆ',
    whatsHappening: 'ಏನಾಗುತ್ತಿದೆ?',
    describeSymptoms: 'ನೀವು ನೋಡುತ್ತಿರುವ ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ. ಸಾಧ್ಯವಾದಷ್ಟು ನಿರ್ದಿಷ್ಟವಾಗಿರಿ. ResQ ತಕ್ಷಣವೇ ವಿಶ್ಲೇಷಿಸುತ್ತದೆ ಮತ್ತು ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತದೆ.',
    placeholder: 'ಉದಾಹರಣೆಗೆ, ನನ್ನ ಸ್ನೇಹಿತನಿಗೆ ತೀವ್ರವಾದ ಎದೆ ನೋವು ಇದೆ ಮತ್ತು ಉಸಿರಾಡಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ...',
    analyzeNow: 'ಈಗ ವಿಶ್ಲೇಷಿಸಿ',
    tryExample: 'ಅಥವಾ ತ್ವರಿತ ಉದಾಹರಣೆಯನ್ನು ಪ್ರಯತ್ನಿಸಿ:',
    callDirectly: 'ನೇರವಾಗಿ 112 ಗೆ ಕರೆ ಮಾಡಿ',
    emergencyNumber: '112',
  },
  es: {
    home: 'Inicio',
    about: 'Nosotros',
    safety: 'Seguridad',
    hospital: 'Hospital',
    emergency: 'Emergencia',
    triageActive: 'Triaje de Emergencia Activo',
    whatsHappening: '¿Qué está pasando?',
    describeSymptoms: 'Describa los síntomas que está observando. Sea lo más específico posible. ResQ analizará y lo guiará al instante.',
    placeholder: 'ej., Mi amigo tiene un dolor de pecho severo y no puede respirar...',
    analyzeNow: 'Analizar Ahora',
    tryExample: 'O pruebe un ejemplo rápido:',
    callDirectly: 'Llamar al 112 directamente',
    emergencyNumber: '112',
  },
};
