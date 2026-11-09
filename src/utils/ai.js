import { money } from './format';

const GRATITUDE = /(gracias|muchas gracias|perfecto|genial|ok|👍|😊|excelente)/i;
const GREETING = /(hola|buenos|buenas|hey)/i;

export function isOutOfHours(settings) {
  if (settings?.outOfHours) return true;
  if (!settings?.weeklySchedule) return !!settings?.outOfHours;
  const now = new Date();
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const day = days[now.getDay()];
  const cfg = settings.weeklySchedule[day];
  if (!cfg) return !!settings?.outOfHours;
  if (!cfg.enabled) return true;
  const mins = now.getHours()*60 + now.getMinutes();
  const [sh,sm] = cfg.start.split(':').map(Number);
  const [eh,em] = cfg.end.split(':').map(Number);
  const start = sh*60+sm, end = eh*60+em;
  return mins < start || mins > end;
}

export function shouldCloseConversation(text) {
  const t = (text || '').trim();
  if (!t) return true;
  if (GRATITUDE.test(t) && t.length < 40) return true;
  // sticker/emoji only
  if (/^[\p{Emoji}\s]+$/u.test(t)) return true;
  return false;
}

function tone(text, settings) {
  let t = text;
  if (settings?.toneRules?.noOpeningQuestionMark) t = t.replace(/¿/g, '');
  if (settings?.toneRules?.noFinalPeriod) t = t.replace(/\.\s*$/g, '').replace(/\.\s*(?=[A-ZÁÉÍÓÚ])/g, ' ');
  return t;
}

export function generateBotReply({ text, messages, rules, settings, customer, products, mode }) {
  if (isOutOfHours(settings)) {
    return tone('Estamos fuera de horario por ahora Te respondemos en el próximo turno', settings);
  }

  // apply knowledge rules by keyword
  const lower = (text || '').toLowerCase();
  const applicableRules = (rules || []).filter(r => {
    const rp = (r.rule_prompt || '').toLowerCase();
    // crude: if any word from rule appears in message or rule category matches
    return rp.split(/\s+/).some(w => w.length > 4 && lower.includes(w));
  });
  // if a rule directly states a correction, we still generate contextual reply

  if (shouldCloseConversation(text)) return null; // no text, reaction instead

  if (GREETING.test(text)) {
    const name = customer?.name ? ` ${customer.name}` : '';
    return tone(`Hola${name} en qué te puedo ayudar`, settings);
  }

  if (/precio|cu[aá]nto|valor|costo/i.test(text)) {
    const list = (products || []).slice(0,5).map(p => `${p.name} ${money(p.price)}`).join(', ');
    const relevantRules = (rules || []).filter(r => /precio|subi|aument|costo/i.test(r.rule_prompt || ''));
    const extra = relevantRules.length ? ` ${relevantRules[0].rule_prompt}` : '';
    return tone(`Te paso algunos precios ${list}${extra}. Decime cuál te interesa`, settings);
  }

  if (/ventana|abertura|puerta|modena|m[oó]dena/i.test(text)) {
    return tone('Para cotizar la abertura necesito medidas ancho x alto, línea de aluminio y tipo de vidrio', settings);
  }

  if (/horario|abren|cierran|s[aá]bado|domingo/i.test(text)) {
    return tone('Atendemos de lunes a viernes de 9 a 18 y sábados de 9 a 13', settings);
  }

  if (/stock|disponib/i.test(text)) {
    const avail = (products || []).filter(p => (p.stock||0) > 0).length;
    return tone(`Tenemos ${avail} productos con stock disponible. Decime cuál buscás`, settings);
  }

  // default echo/help
  const lastBot = [...(messages||[])].reverse().find(m => m.sender === 'bot');
  if (applicableRules.length) {
    const r = applicableRules[0].rule_prompt;
    return tone(`Entendido. ${r}. ¿En qué más te ayudo?`.replace('¿',''), settings);
  }
  return tone('Perfecto, contame un poco más para ayudarte mejor', settings);
}

export function generateDraft({ text, messages, rules, settings, customer, products }) {
  const reply = generateBotReply({ text: text || 'cliente consulta', messages, rules, settings, customer, products });
  if (!reply) return '👍';
  return reply;
}