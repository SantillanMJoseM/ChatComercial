import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Mic, Send, Brain, MicOff } from 'lucide-react';
import Button from '../components/ui/Button';
import { isSpeechRecognitionSupported, startSpeechRecognition } from '../utils/speech';

function parseRule(text) {
  const t = text.toLowerCase();
  if (t.includes('punto')) return { category: 'tono', rule_prompt: text };
  if (t.includes('subi') || t.includes('subieron') || t.includes('%')) return { category: 'precios', rule_prompt: text };
  if (t.includes('abre') || t.includes('horario') || t.includes('s[aá]bado')) return { category: 'horarios', rule_prompt: text };
  if (t.includes('emoji') || t.includes('reacci')) return { category: 'tono', rule_prompt: text };
  return { category: 'general', rule_prompt: text };
}

export default function TrainingPage() {
  const { rules, createRule, deleteRule } = useApp();
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hola, soy el entrenador. Decime qué querés que aprenda y lo guardo como regla.' },
  ]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages(m => [...m, { sender: 'admin', text }]);
    setInput('');
    const rule = parseRule(text);
    await createRule(rule);
    setTimeout(() => {
      setMessages(m => [...m, { sender: 'bot', text: `Entendido. Guardé la regla en categoría "${rule.category}": "${rule.rule_prompt}". La aplicaré en el chat principal.` }]);
    }, 500);
  };

  const toggleListen = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    if (!isSpeechRecognitionSupported()) {
      alert('El navegador no soporta reconocimiento de voz. Escribí la instrucción.');
      return;
    }
    setListening(true);
    recognitionRef.current = startSpeechRecognition({
      onResult: (text) => setInput(text),
      onError: () => setListening(false),
      onEnd: () => setListening(false),
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Brain/> Entrenamiento IA</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 flex flex-col h-[70vh]">
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {messages.map((m,i) => (
              <div key={i} className={`flex ${m.sender==='admin'?'justify-end':'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.sender==='admin'?'bg-indigo-100 text-indigo-900':'bg-slate-100 text-slate-800'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-100 flex items-center gap-2">
            <button onClick={toggleListen} className={`p-2 rounded-full ${listening?'bg-red-500 text-white':'text-slate-500 hover:text-indigo-600'}`}>
              {listening ? <MicOff size={20}/> : <Mic size={20}/>}
            </button>
            <input className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-sm" placeholder="Ej: Las ventanas de línea Módena subieron un 10%"
              value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send();}} />
            <button onClick={send} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700"><Send size={18}/></button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 overflow-auto">
          <h3 className="font-semibold text-slate-700 mb-3">Reglas aprendidas</h3>
          <div className="space-y-2">
            {rules.map(r => (
              <div key={r.id} className="bg-slate-50 rounded-xl p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-indigo-600">{r.category}</span>
                  <button onClick={()=>deleteRule(r.id)} className="text-xs text-red-500">✕</button>
                </div>
                <div className="text-slate-700">{r.rule_prompt}</div>
              </div>
            ))}
            {rules.length===0 && <div className="text-sm text-slate-400">Sin reglas aún.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}