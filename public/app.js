/* ═══════════════════════════════════════════════════════════
   COSA AI — منطق الواجهة (لا يوجد أي مفتاح API هنا أبداً)
   ═══════════════════════════════════════════════════════════ */
'use strict';

// ── الأيقونات (Lucide — SVG مضمّن، بلا اعتماد خارجي) ──────
const ICONS = {
  'sparkles': '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  'mic': '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
  'audio-lines': '<path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/>',
  'history': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  'settings': '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  'crown': '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>',
  'plus': '<path d="M5 12h14"/><path d="M12 5v14"/>',
  'paperclip': '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  'arrow-up': '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'square': '<rect width="14" height="14" x="5" y="5" rx="2"/>',
  'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'check': '<path d="M20 6 9 17l-5-5"/>',
  'copy': '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  'volume-2': '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>',
  'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'thumbs-up': '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
  'thumbs-down': '<path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>',
  'trash-2': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  'message-square': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  'square-pen': '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>',
  'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  'key': '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
  'wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
  'credit-card': '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  'palette': '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  'database': '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
  'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  'image': '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  'book-open': '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  'calculator': '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
  'code': '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
  'lightbulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  'align-left': '<path d="M15 12H3"/><path d="M17 18H3"/><path d="M21 6H3"/>',
  'languages': '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>'
};
function ico(name) {
  return '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
}
// تحويل كل عنصر يحمل data-ico إلى أيقونة
document.querySelectorAll('[data-ico]').forEach(el => el.insertAdjacentHTML('afterbegin', ico(el.dataset.ico)));

// ── الحالة العامة ─────────────────────────────────────────
const S = {
  token: localStorage.getItem('cosa_token') || null,
  user: null,
  config: null,
  chatId: null,
  streaming: false,
  abort: null,
  pendingImage: null,
  pendingFile: null,
  theme: localStorage.getItem('cosa_theme') || 'dark',
  ttsRate: parseFloat(localStorage.getItem('cosa_tts_rate') || '1'),
  sttLang: localStorage.getItem('cosa_stt_lang') || 'ar',
  fontSize: localStorage.getItem('cosa_font') || '13',
  adminMode: false
};

let deviceId = localStorage.getItem('cosa_device');
if (!deviceId) {
  deviceId = 'd' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem('cosa_device', deviceId);
}

const $ = id => document.getElementById(id);

// ── API helper ────────────────────────────────────────────
async function api(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (S.token) headers['Authorization'] = 'Bearer ' + S.token;
  else headers['x-device-id'] = deviceId;
  if (opts.json) { headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(opts.json); }
  const r = await fetch(path, { ...opts, headers });
  let data = null;
  try { data = await r.json(); } catch (_) {}
  if (!r.ok) {
    const err = new Error((data && data.error) || 'خطأ في الخادم');
    err.status = r.status; err.data = data;
    throw err;
  }
  return data;
}
function authHeaders() {
  const h = {};
  if (S.token) h['Authorization'] = 'Bearer ' + S.token;
  else h['x-device-id'] = deviceId;
  return h;
}

// ── Toast ─────────────────────────────────────────────────
let toastTimer;
function toast(msg, ms = 2500) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

// ── Markdown آمن (مع التعقيم ضد XSS) ─────────────────────
function renderMarkdown(text) {
  if (window.marked && window.DOMPurify) {
    return DOMPurify.sanitize(marked.parse(text), { USE_PROFILES: { html: true } });
  }
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
function plainForSpeech(md) {
  return md
    .replace(/```[\s\S]*?```/g, ' كود برمجي ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/[#*_>|]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// ── حالة الاتصال ──────────────────────────────────────────
function setStatus(online) {
  $('statusDot').classList.toggle('off', !online);
  $('statusText').textContent = online ? 'متصل الآن' : 'لا يوجد اتصال';
}
window.addEventListener('online', () => { setStatus(true); toast('عاد الاتصال'); });
window.addEventListener('offline', () => setStatus(false));

// ── المظهر (داكن افتراضياً) ───────────────────────────────
function applyTheme() {
  const dark = S.theme === 'dark';
  document.documentElement.setAttribute('data-theme', S.theme);
  // في الوضع الداكن تظهر الشمس (للتحويل للفاتح) وفي الفاتح يظهر القمر
  $('themeBtn').innerHTML = ico(dark ? 'sun' : 'moon');
  $('setDark').checked = dark;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = dark ? '#07070d' : '#f3f3fa';
}
function setTheme(t) {
  S.theme = t;
  localStorage.setItem('cosa_theme', t);
  applyTheme();
}
$('themeBtn').addEventListener('click', () => setTheme(S.theme === 'dark' ? 'light' : 'dark'));

// ── العداد ────────────────────────────────────────────────
function updateCounter() {
  if (!S.user || !S.config) return;
  const pro = S.user.plan === 'pro';
  const limit = Math.max(1, Number(pro ? S.config.proLimit : S.config.freeLimit) || 1);
  const used = Math.max(0, Math.min(limit, Number(S.user.usedToday) || 0));
  const remaining = limit - used;
  $('counterBox').classList.toggle('pro', pro);
  $('counterLabel').innerHTML = pro ? ico('crown') + ' COSA AI Pro' : 'المتبقي اليوم';
  $('counterText').textContent = remaining + ' / ' + limit;
  $('progressBar').style.width = (pro ? 100 : Math.round((remaining / limit) * 100)) + '%';
}

// ── رسالة ترحيبية متغيرة ──────────────────────────────────
const WELCOMES = [
  'مرحباً بك في COSA AI',
  'أهلاً! كيف أساعدك اليوم؟',
  'جاهز للإبداع؟ لنبدأ',
  'اسألني أي شيء…',
  'يومك أذكى مع COSA AI'
];
$('welcomeTitle').innerHTML = '<span class="gradient-text">' + WELCOMES[new Date().getDate() % WELCOMES.length] + '</span>';

// ── الاقتراحات الذكية ─────────────────────────────────────
const SUGGESTIONS = [
  { icon: 'book-open', c: '#8b6bff', title: 'شرح درس', desc: 'افهم أي موضوع بسهولة', prompt: 'اشرح لي هذا الدرس بطريقة سهلة ومبسطة مع أمثلة' },
  { icon: 'calculator', c: '#4d9bff', title: 'الرياضيات', desc: 'حل المسائل خطوة بخطوة', prompt: 'ساعدني في حل مسألة رياضية خطوة بخطوة' },
  { icon: 'code', c: '#36c77a', title: 'البرمجة', desc: 'اكتب وصحح الأكواد', prompt: 'ساعدني في كتابة كود برمجي مع شرح' },
  { icon: 'lightbulb', c: '#f5b942', title: 'أفكار جديدة', desc: 'حوّل أفكارك إلى مشاريع', prompt: 'اعطني فكرة إبداعية لمشروع جيد وخطوات تنفيذه' },
  { icon: 'align-left', c: '#f06ad0', title: 'تلخيص', desc: 'اختصر النصوص بسرعة', prompt: 'لخص لي النص التالي بشكل واضح ومنظم' },
  { icon: 'languages', c: '#2ec4d6', title: 'اللغات', desc: 'تعلم وترجم وتدرّب', prompt: 'ساعدني على تعلم لغة جديدة بخطة بسيطة' }
];
$('suggestions').innerHTML = SUGGESTIONS.map((s, i) =>
  `<button class="suggestion" data-i="${i}" style="--c:${s.c}"><div class="s-icon">${ico(s.icon)}</div><strong>${s.title}</strong><span>${s.desc}</span></button>`
).join('');
$('suggestions').addEventListener('click', e => {
  const btn = e.target.closest('.suggestion');
  if (btn) sendMessage(SUGGESTIONS[+btn.dataset.i].prompt);
});

// ── بناء عناصر المحادثة ───────────────────────────────────
// المستخدم: وسم «أنت» فقط. الذكاء الاصطناعي: شعار + «COSA AI» فقط.
function metaHtml(role) {
  return role === 'ai'
    ? `<div class="msg-meta"><span class="meta-ico">${ico('sparkles')}</span><span class="meta-name">COSA AI</span></div>`
    : '<div class="msg-meta"><span class="meta-name">أنت</span></div>';
}
function aiShell() {
  const el = document.createElement('div');
  el.className = 'message ai';
  el.dataset.role = 'ai';
  el.dataset.text = '';
  el.innerHTML = metaHtml('ai') + '<div class="bubble"></div><div class="msg-actions"></div>';
  return el;
}

function messageEl(role, text, extra) {
  const el = document.createElement('div');
  el.className = 'message ' + role;
  el.innerHTML = metaHtml(role) + '<div class="bubble"></div><div class="msg-actions"></div>';
  const bubble = el.querySelector('.bubble');
  if (extra && extra.image) {
    const img = document.createElement('img');
    img.src = extra.image; img.alt = 'مرفق';
    bubble.appendChild(img);
  }
  if (role === 'ai' && text) {
    bubble.innerHTML = renderMarkdown(text);
  } else if (text) {
    const d = document.createElement('div');
    d.textContent = text;
    bubble.appendChild(d);
  }
  el.dataset.text = text || '';
  el.dataset.role = role;
  addMsgActions(el);
  return el;
}

function editMessage(el) {
  $('messageInput').value = el.dataset.text || '';
  $('messageInput').dispatchEvent(new Event('input'));
  $('messageInput').focus();
  const next = el.nextElementSibling;           // نأخذه قبل حذف العنصر
  if (next && next.dataset && next.dataset.role === 'ai') next.remove();
  el.remove();
}

function addMsgActions(el) {
  const bar = el.querySelector('.msg-actions');
  if (!bar || bar.dataset.built) return;
  bar.dataset.built = '1';
  const role = el.dataset.role;
  const text = () => el.dataset.text || '';

  if (role === 'ai') {
    bar.appendChild(mkAct('copy', 'نسخ', () => {
      navigator.clipboard.writeText(text()).then(() => toast('تم النسخ')).catch(() => toast('تعذر النسخ'));
    }));
    bar.appendChild(mkAct('volume-2', 'قراءة', btn => speak(text(), btn)));
    if (S.user && S.user.plan === 'pro') bar.appendChild(mkAct('refresh-cw', 'إعادة توليد', () => regenerate(el)));
    bar.appendChild(mkAct('thumbs-up', '', btn => rate(btn), 'أعجبني'));
    bar.appendChild(mkAct('thumbs-down', '', btn => rate(btn), 'لم يعجبني'));
  } else {
    bar.appendChild(mkAct('square-pen', 'تعديل', () => editMessage(el)));
  }
}
function mkAct(icon, label, fn, title) {
  const b = document.createElement('button');
  b.className = 'msg-act';
  b.innerHTML = ico(icon) + (label ? '<span>' + label + '</span>' : '');
  b.title = title || label;
  b.setAttribute('aria-label', title || label);
  b.addEventListener('click', e => { e.stopPropagation(); fn(b); });
  return b;
}
function rate(btn) {
  btn.classList.toggle('on');
  toast(btn.classList.contains('on') ? 'شكراً لتقييمك' : 'تم إلغاء التقييم');
}

// ── النطق (Text-to-Speech عبر المتصفح) ────────────────────
let speaking = false;
function speak(md, btn) {
  if (speaking) { speechSynthesis.cancel(); speaking = false; if (btn) btn.classList.remove('on'); return; }
  const text = plainForSpeech(md);
  if (!text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = /[\u0600-\u06FF]/.test(text) ? 'ar-MA' : 'en-US';
  u.rate = S.ttsRate;
  const voices = speechSynthesis.getVoices();
  const arVoice = voices.find(v => v.lang && v.lang.startsWith('ar'));
  if (arVoice) u.voice = arVoice;
  u.onend = u.onerror = () => { speaking = false; if (btn) btn.classList.remove('on'); };
  speaking = true;
  if (btn) btn.classList.add('on');
  speechSynthesis.speak(u);
}

// ── الإرسال مع Streaming ──────────────────────────────────
const chatEl = $('chat'), welcomeEl = $('welcome'), inputEl = $('messageInput'), sendBtn = $('sendBtn');

// زر الإرسال يظهر عند وجود نص/مرفق، ويتحول إلى «إيقاف» أثناء التوليد
function syncSend() {
  const has = !!(inputEl.value.trim() || S.pendingImage || S.pendingFile);
  const show = S.streaming || has;
  sendBtn.classList.toggle('show', show);
  sendBtn.classList.toggle('stop', S.streaming);
  sendBtn.innerHTML = ico(S.streaming ? 'square' : 'arrow-up');
  sendBtn.title = S.streaming ? 'إيقاف' : 'إرسال';
  sendBtn.setAttribute('aria-label', sendBtn.title);
}
function resizeInput() {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(Math.max(inputEl.scrollHeight, 44), 140) + 'px';
}

function showTyping() {
  const t = document.createElement('div');
  t.className = 'message ai'; t.id = 'typing';
  t.innerHTML = metaHtml('ai') + '<div class="bubble typing"><i></i><i></i><i></i></div>';
  chatEl.appendChild(t);
  scrollBottom();
}
function removeTyping() { const t = $('typing'); if (t) t.remove(); }
function scrollBottom(smooth = true) {
  window.scrollTo({ top: document.body.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
}

function enterChat() {
  welcomeEl.style.display = 'none';
  chatEl.classList.add('active');
}

async function sendMessage(customText) {
  if (S.streaming) return;
  const text = (customText != null ? customText : inputEl.value).trim();
  if (!text && !S.pendingImage && !S.pendingFile) return;
  if (!S.user) { await loadMe(); }

  enterChat();

  let finalText = text;
  const attachmentImg = S.pendingImage;
  if (S.pendingFile) {
    finalText = (text ? text + '\n\n' : '') + 'ملف: ' + S.pendingFile.name + '\n\n' + S.pendingFile.text;
  }

  chatEl.appendChild(messageEl('user', finalText, { image: attachmentImg }));

  inputEl.value = ''; resizeInput();
  clearAttachment();
  await doStream({ content: finalText, image: attachmentImg });
}

async function regenerate(aiEl) {
  if (S.streaming) return;
  const msgs = [...chatEl.querySelectorAll('.message.user')];
  const lastUser = msgs[msgs.length - 1];
  if (!lastUser) return toast('لا يوجد سؤال سابق');
  aiEl.remove();
  await doStream({ content: lastUser.dataset.text, image: null });
}

async function doStream({ content, image }) {
  S.streaming = true;
  syncSend();
  showTyping();
  S.abort = new AbortController();

  let aiEl = null, bubble = null, streamText = '';

  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: S.chatId, content, model: null, image }),
      signal: S.abort.signal
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      removeTyping();
      if (err.error === 'limit') {
        chatEl.appendChild(messageEl('ai', '**استهلكت حصتك اليومية المجانية.**\n\nرقِّ إلى **COSA AI Pro** لمتابعة المحادثة بدون انقطاع.'));
        setTimeout(openPro, 1200);
      } else if (r.status === 403) {
        chatEl.appendChild(messageEl('ai', err.error || 'هذه الميزة متاحة لمشتركي Pro فقط.'));
        setTimeout(openPro, 1200);
      } else {
        chatEl.appendChild(messageEl('ai', err.error || 'تعذر الإجابة الآن، حاول لاحقاً.'));
      }
      scrollBottom();
      return;
    }

    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '', started = false, done = false;

    while (!done) {
      const { value, done: d } = await reader.read();
      if (d) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';
      for (const block of parts) {
        const lines = block.split('\n');
        let event = 'message', dataLine = '';
        for (const ln of lines) {
          if (ln.startsWith('event:')) event = ln.slice(6).trim();
          else if (ln.startsWith('data:')) dataLine += ln.slice(5).trim();
        }
        if (!dataLine) continue;
        let payload; try { payload = JSON.parse(dataLine); } catch (_) { continue; }

        if (event === 'meta') {
          S.chatId = payload.chatId;
          if (S.user) S.user.usedToday = payload.used;
          updateCounter();
        } else if (event === 'error') {
          toast(payload.error || 'خطأ');
        } else if (event === 'done') {
          done = true;
        } else if (payload.delta) {
          if (!started) {
            started = true; removeTyping();
            aiEl = aiShell();
            bubble = aiEl.querySelector('.bubble');
            chatEl.appendChild(aiEl);
          }
          streamText += payload.delta;
          aiEl.dataset.text = streamText;
          bubble.innerHTML = renderMarkdown(streamText) + '<span class="cursor"></span>';
          if (window.innerHeight + window.scrollY > document.body.scrollHeight - 220) scrollBottom(false);
        }
      }
    }

    if (!started) {
      removeTyping();
      chatEl.appendChild(messageEl('ai', 'لم يصل رد، حاول مرة أخرى.'));
    } else {
      bubble.innerHTML = renderMarkdown(streamText);
      addMsgActions(aiEl);
      scrollBottom();
    }
  } catch (e) {
    removeTyping();
    if (e.name === 'AbortError') {
      if (bubble && streamText) {
        bubble.innerHTML = renderMarkdown(streamText + ' …');
        addMsgActions(aiEl);
      }
      toast('تم إيقاف التوليد');
    } else {
      chatEl.appendChild(messageEl('ai', 'خطأ في الاتصال بالخادم.'));
      scrollBottom();
    }
  } finally {
    S.streaming = false;
    S.abort = null;
    syncSend();
    refreshChatList();
  }
}

sendBtn.addEventListener('click', () => {
  if (S.streaming && S.abort) { S.abort.abort(); return; }
  sendMessage();
});
inputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
inputEl.addEventListener('input', () => { resizeInput(); syncSend(); });

// ── المرفقات (صور + ملفات) ────────────────────────────────
$('attachBtn').addEventListener('click', () => $('fileInput').click());
$('fileInput').addEventListener('change', async () => {
  const file = $('fileInput').files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) { toast('الحد الأقصى 8MB'); $('fileInput').value = ''; return; }

  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const max = 1568;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale; canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        S.pendingImage = canvas.toDataURL('image/jpeg', 0.85);
        showChip('image', file.name);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    if (!S.user || S.user.plan !== 'pro') {
      toast('تحليل الملفات للمشتركين Pro');
      $('fileInput').value = '';
      return;
    }
    toast('جارِ قراءة الملف…');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/extract', { method: 'POST', headers: authHeaders(), body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'تعذر القراءة');
      S.pendingFile = { name: data.name, text: data.text };
      showChip('file-text', data.name);
    } catch (e) {
      toast(e.message);
    }
  }
  $('fileInput').value = '';
});
function showChip(icon, name) {
  const chip = $('fileChip');
  chip.querySelector('.chip-ico').innerHTML = ico(icon);
  $('fileChipName').textContent = name;
  chip.classList.remove('hidden');
  syncSend();
}
function clearAttachment() {
  S.pendingImage = null; S.pendingFile = null;
  $('fileChip').classList.add('hidden');
  syncSend();
}
$('fileChipRemove').addEventListener('click', clearAttachment);

// ── الميكروفون (تسجيل → Whisper على الخادم) ───────────────
let mediaRecorder = null, audioChunks = [];
$('micBtn').addEventListener('click', async () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') { mediaRecorder.stop(); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return toast('الميكروفون غير مدعوم في هذا المتصفح');
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      $('micBtn').classList.remove('recording');
      await transcribe(new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' }));
    };
    mediaRecorder.start();
    $('micBtn').classList.add('recording');
    toast('جارِ التسجيل… اضغط مرة أخرى للإيقاف');
  } catch (e) {
    toast('تم رفض إذن الميكروفون');
  }
});
async function transcribe(blob) {
  toast('جارِ تحويل الكلام إلى نص…');
  try {
    const fd = new FormData();
    fd.append('audio', blob, 'voice.webm');
    fd.append('language', S.sttLang);
    const r = await fetch('/api/stt', { method: 'POST', headers: authHeaders(), body: fd });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'تعذر التعرف');
    if (data.text) {
      inputEl.value = (inputEl.value ? inputEl.value + ' ' : '') + data.text;
      inputEl.dispatchEvent(new Event('input'));
      inputEl.focus();
      toast('تم التحويل — راجع النص ثم أرسل');
    } else toast('لم يتم التقاط كلام واضح');
  } catch (e) {
    toast(e.message);
  }
}
// ═══════ السجل، الحسابات، Pro، الإعدادات، الصوت، الإدارة ═══════

// ── سجل المحادثات ─────────────────────────────────────────
function openDrawer() { $('historyDrawer').classList.add('show'); $('drawerOverlay').classList.add('show'); refreshChatList(); }
function closeDrawer() { $('historyDrawer').classList.remove('show'); $('drawerOverlay').classList.remove('show'); }
$('historyBtn').addEventListener('click', openDrawer);
$('closeDrawer').addEventListener('click', closeDrawer);
$('drawerOverlay').addEventListener('click', closeDrawer);
$('chatSearch').addEventListener('input', () => refreshChatList($('chatSearch').value.trim()));

async function refreshChatList(filter) {
  if (!S.user) return;
  try {
    const { chats } = await api('/api/chats');
    const list = $('chatList');
    const shown = filter ? chats.filter(c => c.title.includes(filter)) : chats;
    if (!shown.length) {
      list.innerHTML = '<div class="empty-note">لا توجد محادثات' + (filter ? ' مطابقة' : '') + '</div>';
      return;
    }
    list.innerHTML = shown.map(c => `
      <div class="chat-item ${c.id === S.chatId ? 'active' : ''}" data-id="${c.id}">
        ${ico('message-square')}
        <div style="flex:1;min-width:0">
          <div class="t">${escapeHtml(c.title)}</div>
          <div class="d">${new Date(c.updatedAt).toLocaleDateString('ar-MA')} · ${c.messageCount} رسالة</div>
        </div>
        <button class="del" data-del="${c.id}" title="حذف" aria-label="حذف">${ico('trash-2')}</button>
      </div>`).join('');
  } catch (_) {}
}

$('chatList').addEventListener('click', async e => {
  const delBtn = e.target.closest('[data-del]');
  if (delBtn) {
    e.stopPropagation();
    if (!confirm('حذف هذه المحادثة نهائياً؟')) return;
    try { await api('/api/chats/' + delBtn.dataset.del, { method: 'DELETE' }); refreshChatList(); } catch (_) {}
    return;
  }
  const item = e.target.closest('.chat-item');
  if (!item) return;
  await loadChat(item.dataset.id);
  closeDrawer();
});

async function loadChat(id) {
  try {
    const { chat } = await api('/api/chats/' + id);
    S.chatId = chat.id;
    chatEl.innerHTML = '';
    enterChat();
    for (const m of chat.messages) {
      chatEl.appendChild(messageEl(m.role, m.content));
    }
    scrollBottom(false);
  } catch (e) { toast(e.message); }
}

$('newChatBtn').addEventListener('click', () => {
  S.chatId = null;
  chatEl.innerHTML = '';
  chatEl.classList.remove('active');
  welcomeEl.style.display = '';
  closeDrawer();
  inputEl.focus();
});

// ── الضغط المطول على رسالة ────────────────────────────────
let pressTimer = null;
chatEl.addEventListener('touchstart', e => {
  const msg = e.target.closest('.message');
  if (!msg || !msg.dataset.role) return;
  pressTimer = setTimeout(() => showCtxMenu(msg, e.touches[0].clientX, e.touches[0].clientY), 550);
}, { passive: true });
chatEl.addEventListener('touchend', () => clearTimeout(pressTimer));
chatEl.addEventListener('touchmove', () => clearTimeout(pressTimer));
chatEl.addEventListener('contextmenu', e => {
  const msg = e.target.closest('.message');
  if (msg && msg.dataset.role) { e.preventDefault(); showCtxMenu(msg, e.clientX, e.clientY); }
});
function showCtxMenu(msg, x, y) {
  const menu = $('ctxMenu');
  const isAi = msg.dataset.role === 'ai';
  menu.innerHTML = '';
  const items = [];
  if (isAi) {
    items.push(['copy', 'نسخ الإجابة', () => navigator.clipboard.writeText(msg.dataset.text).then(() => toast('تم النسخ'))]);
    items.push(['volume-2', 'قراءة بصوت عالٍ', () => speak(msg.dataset.text)]);
    if (S.user && S.user.plan === 'pro') items.push(['refresh-cw', 'إعادة توليد', () => regenerate(msg)]);
  } else {
    items.push(['square-pen', 'تعديل وإعادة الإرسال', () => editMessage(msg)]);
  }
  items.push(['trash-2', 'حذف من العرض', () => msg.remove()]);
  for (const [icon, label, fn] of items) {
    const b = document.createElement('button');
    b.innerHTML = ico(icon) + '<span>' + label + '</span>';
    b.addEventListener('click', () => { hideCtxMenu(); fn(); });
    menu.appendChild(b);
  }
  menu.style.display = 'block';
  const rect = menu.getBoundingClientRect();
  menu.style.left = Math.max(8, Math.min(x, window.innerWidth - rect.width - 8)) + 'px';
  menu.style.top = Math.max(8, Math.min(y, window.
