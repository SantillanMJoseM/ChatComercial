import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Phone, Send, Mic, MicOff, Image as ImageIcon, Bot, User as UserIcon, Sparkles, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '../components/ui/Button';
import { generateBotReply, generateDraft, shouldCloseConversation, isOutOfHours } from '../utils/ai';
import { money } from '../utils/format';

export default function ChatPage() {
  const { customers, conversations, messages, createConversation, updateConversation, addMessage, updateMessage, settings, products, rules, createOrder, statuses } = useApp();
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [input, setInput] = useState('');
  const [senderMode, setSenderMode] = useState('customer'); // customer | operator
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const selectedConv = conversations.find(c => c.id === selectedConvId);
  const selectedCustomer = selectedConv ? customers.find(c => c.id === selectedConv.customerId) : null;
  const convMessages = messages.filter(m => m.conversation_id === selectedConvId).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convMessages.length, selectedConvId]);

  const selectConversation = (conv) => setSelectedConvId(conv.id);

  const newConversationForCustomer = async (cust) => {
    const conv = await createConversation(cust.id);
    setSelectedConvId(conv.id);
  };

  const sendText = async (text, sender, type = 'text', extra = {}) => {
    if (!selectedConv) return;
    const msg = await addMessage({
      conversation_id: selectedConv.id,
      sender,
      contentType: type,
      text,
      contentUrl: extra.url || null,
      reaction: null,
      ...extra,
    });

    // Auto mode logic
    const botAllowed = settings?.globalBotEnabled !== false && selectedCustomer?.botEnabled !== false;
    if (selectedConv.mode === 'auto' && sender === 'user' && botAllowed) {
      // close naturally?
      if (shouldCloseConversation(text) && type === 'text') {
        await updateMessage(msg.id, { reaction: '👍' });
        return;
      }
      // bot reply
      setTimeout(async () => {
        const reply = generateBotReply({
          text, messages: convMessages.concat(msg), rules, settings, customer: selectedCustomer, products,
        });
        if (reply === null) {
          await updateMessage(msg.id, { reaction: '👍' });
        } else {
          await addMessage({
            conversation_id: selectedConv.id,
            sender: 'bot',
            contentType: 'text',
            text: reply,
            contentUrl: null,
            reaction: null,
          });
        }
      }, 700);
    }

    if (selectedConv.mode === 'auto' && sender === 'operator') {
      // switch to manual
      await updateConversation(selectedConv.id, { mode: 'manual' });
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text && !recording) return;
    if (text) {
      const sender = senderMode === 'customer' ? 'user' : 'operator';
      await sendText(text, sender);
      setInput('');
    }
  };

  const handleGenerateDraft = () => {
    const lastUser = [...convMessages].reverse().find(m => m.sender === 'user');
    const draft = generateDraft({
      text: lastUser?.text || '',
      messages: convMessages,
      rules, settings, customer: selectedCustomer, products,
    });
    setInput(draft);
    setSenderMode('operator');
  };

  const handleToggleMode = async () => {
    if (!selectedConv) return;
    await updateConversation(selectedConv.id, { mode: selectedConv.mode === 'auto' ? 'manual' : 'auto' });
  };

  // Audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const sender = senderMode === 'customer' ? 'user' : 'operator';
        await sendText('', sender, 'audio', { url });
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (e) {
      alert('No se pudo acceder al micrófono');
    }
  };
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const sender = senderMode === 'customer' ? 'user' : 'operator';
    await sendText(file.name, sender, 'image', { url });
    e.target.value = '';
  };

  const handleCreateOrderFromChat = async () => {
    if (!selectedCustomer) return;
    const firstStatus = statuses[0]?.id;
    await createOrder({
      customerId: selectedCustomer.id,
      statusId: firstStatus,
      source: 'Chat WhatsApp',
      notes: 'Pedido creado desde conversación',
      total: 0,
    }, []);
    alert('Pedido creado (vacío). Editalo en Pedidos.');
  };

  const mode = selectedConv?.mode || 'auto';

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4">
      {/* Conversations list */}
      <div className="w-80 bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Conversaciones</h3>
        </div>
        <div className="p-2 border-b border-slate-100">
          <select className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm" onChange={e => {
            const cust = customers.find(c=>c.id===e.target.value);
            if (cust) newConversationForCustomer(cust);
            e.target.value = '';
          }}>
            <option value="">+ Nueva conversación</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-auto">
          {conversations.map(conv => {
            const cust = customers.find(c=>c.id===conv.customerId);
            const last = messages.filter(m=>m.conversation_id===conv.id).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)).pop();
            return (
              <button key={conv.id} onClick={()=>selectConversation(conv)}
                className={`w-full text-left p-3 border-b border-slate-50 hover:bg-slate-50 transition ${selectedConvId===conv.id?'bg-indigo-50':''}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-slate-800">{cust?.name || 'Cliente'}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${conv.mode==='auto'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{conv.mode}</span>
                </div>
                <div className="text-xs text-slate-400 truncate mt-1">{last?.text || (last?.contentType==='audio'?'🎤 Audio':last?.contentType==='image'?'📷 Imagen':'')}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden">
        {selectedConv ? (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-600 text-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"><Phone size={18}/></div>
                <div>
                  <div className="font-semibold">{selectedCustomer?.name}</div>
                  <div className="text-xs opacity-80">{selectedCustomer?.phone}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleToggleMode} className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full text-xs">
                  {mode === 'auto' ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>} {mode === 'auto' ? 'Auto' : 'Manual'}
                </button>
                <Button size="sm" variant="secondary" onClick={handleCreateOrderFromChat}>Crear pedido</Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-3 bg-slate-50">
              {convMessages.map(m => {
                const isUser = m.sender === 'user';
                const isBot = m.sender === 'bot';
                const isOp = m.sender === 'operator';
                return (
                  <div key={m.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      isUser ? 'bg-white text-slate-800 rounded-tl-none' :
                      isBot ? 'bg-emerald-100 text-emerald-900 rounded-tr-none' :
                      'bg-indigo-100 text-indigo-900 rounded-tr-none'
                    }`}>
                      {m.contentType === 'audio' && m.contentUrl && (
                        <audio controls src={m.contentUrl} className="w-48" />
                      )}
                      {m.contentType === 'image' && m.contentUrl && (
                        <img src={m.contentUrl} alt={m.text} className="rounded-lg max-h-40" />
                      )}
                      {m.text && <div>{m.text}</div>}
                      {m.reaction && <div className="text-xs mt-1">{m.reaction}</div>}
                      <div className="text-[10px] opacity-50 mt-1 text-right">{new Date(m.createdAt).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-slate-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-500">Enviar como:</span>
                <button onClick={()=>setSenderMode('customer')} className={`text-xs px-2 py-1 rounded-full ${senderMode==='customer'?'bg-emerald-600 text-white':'bg-slate-100'}`}>Cliente</button>
                <button onClick={()=>setSenderMode('operator')} className={`text-xs px-2 py-1 rounded-full ${senderMode==='operator'?'bg-indigo-600 text-white':'bg-slate-100'}`}>Operador</button>
                {mode === 'manual' && (
                  <Button size="sm" variant="secondary" onClick={handleGenerateDraft}><Sparkles size={14}/> Generar borrador IA</Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-indigo-600"><ImageIcon size={20}/></button>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
                <button
                  onClick={recording ? stopRecording : startRecording}
                  className={`p-2 rounded-full ${recording ? 'bg-red-500 text-white' : 'text-slate-500 hover:text-indigo-600'}`}>
                  {recording ? <MicOff size={20}/> : <Mic size={20}/>}
                </button>
                <input
                  className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Escribí un mensaje..."
                  value={input}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter') handleSend(); }}
                />
                <button onClick={handleSend} className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700"><Send size={18}/></button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">Seleccioná una conversación</div>
        )}
      </div>
    </div>
  );
}