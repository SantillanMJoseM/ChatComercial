export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startSpeechRecognition({ onResult, onError, onEnd }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    onError && onError(new Error('SpeechRecognition no soportado'));
    return null;
  }
  const rec = new SR();
  rec.lang = 'es-AR';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => {
    const text = e.results?.[0]?.[0]?.transcript || '';
    onResult && onResult(text);
  };
  rec.onerror = (e) => onError && onError(e);
  rec.onend = () => onEnd && onEnd();
  rec.start();
  return rec;
}