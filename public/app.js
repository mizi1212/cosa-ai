/* ═══════════════════════════════════════════════════════════
   COSA AI — .منطق الواجهة (لا يوجد أي مفتاح API هنا أبداً)
   ═══════════════════════════════════════════════════════════ */
'use strict';

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
  theme: localStorage.getItem('cosa_theme') || 'light',
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

// ── حالة الاتصال ──────────────────────────────────────────
function setStatus(online) {
  $('statusDot').classList.toggle('off', !online);
  $('statusText').textContent = online ? 'متصل الآن' : 'لا يوجد اتصال';
}
window.addEventListener('online', () => { setStatus(true); toast('✓ عاد الاتصال'); });
window.addEventListener('offline', () => setStatus(false));

// ── المظهر ────────────────────────────────────────────────
function applyTheme() {
  document.documentElement.setAttribute('data-theme', S.theme);
  $('themeBtn').textContent = S.theme === 'dark' ? '☀' : '☾';
  $('setDark').checked = S.theme === 'dark';
  document.querySelector('meta[name="theme-color"]').content = S.theme === 'dark' ? '#10101a' : '#17152b';
}
$('themeBtn').addEventListener('click', () => {
  S.theme = S.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('cosa_theme', S.theme);
  applyTheme();
});

// ── العداد ────────────────────────────────────────────────
function updateCounter() {
  if (!S.user || !S.config) return;
  const pro = S.user.plan === 'pro';
  const limit = pro ? S.config.proLimit : S.config.freeLimit;
  const used = S.user.usedToday || 0;
  const remaining = Math.max(0, limit - used);
  if (pro) {
    $('counterBox').classList.add('pro');
    $('counterLabel').textContent = '⭐ COSA AI Pro';
    $('counterText').textContent = remaining + ' / ' + limit;
    $('progressBar').style.width = '100%';
  } else {
    $('counterBox').classList.remove('pro');
    $('counterLabel').textContent = 'رسائل اليوم';
    $('counterText').textContent = remaining + ' / ' + limit;
    $('progressBar').style.width = Math.max(0, Math.min(100, (remaining / limit) * 100)) + '%';
  }
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
  { icon: '📚', title: 'شرح درس', desc: 'افهم أي موضوع بسهولة', prompt: 'اشرح لي هذا الدرس بطريقة سهلة ومبسطة مع أمثلة' },
  { icon: '🧮', title: 'الرياضيات', desc: 'حل المسائل خطوة بخطوة', prompt: 'ساعدني في حل مسألة رياضية خطوة بخطوة' },
  { icon: '💻', title: 'البرمجة', desc: 'اكتب وصحح الأكواد', prompt: 'ساعدني في كتابة كود برمجي مع شرح' },
  { icon: '💡', title: 'أفكار جديدة', desc: 'حوّل أفكارك إلى مشاريع', prompt: 'اعطني فكرة إبداعية لمشروع جيد وخطوات تنفيذه' },
  { icon: '✨', title: 'تلخيص', desc: 'اختصر النصوص بسرعة', prompt: 'لخص لي النص التالي بشكل واضح ومنظم' },
  { icon: '🌐', title: 'اللغات', desc: 'تعلم وترجم وتدرّب', prompt: 'ساعدني على تعلم لغة جديدة بخطة بسيطة' }
];
$('suggestions').innerHTML = SUGGESTIONS.map((s, i) =>
  `<button class="suggestion" data-i="${i}"><div class="s-icon">${s.icon}</div><strong>${s.title}</strong><span>${s.desc}</span></button>`
).join('');
$('suggestions').addEventListener('click', e => {
  const btn = e.target.closest('.suggestion');
  if (btn) sendMessage(SUGGESTIONS[+btn.dataset.i].prompt);
});

// ── بناء عناصر المحادثة ───────────────────────────────────
function messageEl(role, text, extra) {
  const el = document.createElement('div');
  el.className = 'message ' + role;
  el.innerHTML = `<div class="avatar ${role === 'ai' ? 'ai-avatar' : 'user-avatar'}">${role === 'ai' ? 'AI' : 'أنت'}</div><div><div class="bubble"></div><div class="msg-actions"></div></div>`;
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

function addMsgActions(el) {
  const bar = el.querySelector('.msg-actions');
  if (!bar || bar.dataset.built) return;
  bar.dataset.built = '1';
  const role = el.dataset.role;
  const text = () => el.dataset.text || '';

  if (role === 'ai') {
    bar.appendChild(mkAct('📋 نسخ', () => {
      navigator.clipboard.writeText(text()).then(() => toast('✓ تم النسخ')).catch(() => toast('تعذر النسخ'));
    }));
    bar.appendChild(mkAct('🔊 قراءة', btn => speak(text(), btn)));
    if (S.user && S.user.plan === 'pro') bar.appendChild(mkAct('🔁 إعادة توليد', () => regenerate(el)));
    bar.appendChild(mkAct('👍', btn => rate(btn)));
    bar.appendChild(mkAct('👎', btn => rate(btn)));
  } else {
    bar.appendChild(mkAct('✏️ تعديل', () => {
      $('messageInput').value = text();
      $('messageInput').focus();
      el.remove();
      const next = el.nextElementSibling;
      if (next && next.dataset && next.dataset.role === 'ai') next.remove();
    }));
  }
}
function mkAct(label, fn) {
  const b = document.createElement('button');
  b.className = 'msg-act';
  b.textContent = label;
  b.addEventListener('click', e => { e.stopPropagation(); fn(b); });
  return b;
}
function rate(btn) {
  btn.classList.toggle('on');
  toast(btn.classList.contains('on') ? '✓ شكراً لتقييمك' : 'تم إلغاء التقييم');
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

function showTyping() {
  const t = document.createElement('div');
  t.className = 'message ai'; t.id = 'typing';
  t.innerHTML = '<div class="avatar ai-avatar">AI</div><div class="bubble typing"><i></i><i></i><i></i></div>';
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
  let attachmentImg = S.pendingImage;
  if (S.pendingFile) {
    finalText = (text ? text + '\n\n' : '') + '📄 ملف: ' + S.pendingFile.name + '\n\n' + S.pendingFile.text;
  }

  const userEl = messageEl('user', finalText, { image: attachmentImg });
  chatEl.appendChild(userEl);

  inputEl.value = ''; inputEl.style.height = '40px';
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
  sendBtn.textContent = '⏹'; sendBtn.title = 'إيقاف';
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
        chatEl.appendChild(messageEl('ai', '📊 **استهلكت حصتك اليومية المجانية.**\n\n⭐ رقِّ إلى **COSA AI Pro** لمتابعة المحادثة بدون انقطاع.'));
        setTimeout(openPro, 1200);
      } else if (r.status === 403) {
        chatEl.appendChild(messageEl('ai', '🔒 ' + (err.error || 'هذه الميزة متاحة لمشتركي Pro فقط.')));
        setTimeout(openPro, 1200);
      } else {
        chatEl.appendChild(messageEl('ai', '🙏 ' + (err.error || 'تعذر الإجابة الآن، حاول لاحقاً.')));
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
          toast('⚠️ ' + (payload.error || 'خطأ'));
        } else if (event === 'done') {
          done = true;
        } else if (payload.delta) {
          if (!started) {
            started = true; removeTyping();
            aiEl = document.createElement('div');
            aiEl.className = 'message ai'; aiEl.dataset.role = 'ai'; aiEl.dataset.text = '';
            aiEl.innerHTML = '<div class="avatar ai-avatar">AI</div><div><div class="bubble"></div><div class="msg-actions"></div></div>';
            bubble = aiEl.querySelector('.bubble');
            bubble.innerHTML = '<span style="color:var(--muted)">▍</span>';
            chatEl.appendChild(aiEl);
          }
          streamText += payload.delta;
          aiEl.dataset.text = streamText;
          bubble.innerHTML = renderMarkdown(streamText) + '<span style="color:var(--primary)">▍</span>';
          if (window.innerHeight + window.scrollY > document.body.scrollHeight - 220) scrollBottom(false);
        }
      }
    }

    if (!started) {
      removeTyping();
      chatEl.appendChild(messageEl('ai', '🙏 لم يصل رد، حاول مرة أخرى.'));
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
      toast('⏹ تم إيقاف التوليد');
    } else {
      chatEl.appendChild(messageEl('ai', '🙏 خطأ في الاتصال بالخادم.'));
      scrollBottom();
    }
  } finally {
    S.streaming = false;
    S.abort = null;
    sendBtn.textContent = '➤'; sendBtn.title = 'إرسال';
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
inputEl.addEventListener('input', () => {
  inputEl.style.height = '40px';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 110) + 'px';
});

// ── المرفقات (صور + ملفات) ────────────────────────────────
$('attachBtn').addEventListener('click', () => $('fileInput').click());
$('fileInput').addEventListener('change', async () => {
  const file = $('fileInput').files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) { toast('⚠️ الحد الأقصى 8MB'); $('fileInput').value = ''; return; }

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
        showChip('📷 ' + file.name);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    if (!S.user || S.user.plan !== 'pro') {
      toast('🔒 تحليل الملفات للمشتركين Pro');
      $('fileInput').value = '';
      return;
    }
    toast('⏳ جارِ قراءة الملف…');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/extract', { method: 'POST', headers: authHeaders(), body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'تعذر القراءة');
      S.pendingFile = { name: data.name, text: data.text };
      showChip('📄 ' + data.name);
    } catch (e) {
      toast('⚠️ ' + e.message);
    }
  }
  $('fileInput').value = '';
});
function showChip(name) {
  $('fileChipName').textContent = name;
  $('fileChip').classList.remove('hidden');
}
function clearAttachment() {
  S.pendingImage = null; S.pendingFile = null;
  $('fileChip').classList.add('hidden');
}
$('fileChipRemove').addEventListener('click', clearAttachment);

// ── الميكروفون (تسجيل → Whisper على الخادم) ───────────────
let mediaRecorder = null, audioChunks = [];
$('micBtn').addEventListener('click', async () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') { mediaRecorder.stop(); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return toast('⚠️ الميكروفون غير مدعوم في هذا المتصفح');
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
    toast('🎤 جارِ التسجيل… اضغط مرة أخرى للإيقاف');
  } catch (e) {
    toast('⚠️ أذن الوصول إلى الميكروفون مرفوض');
  }
});
async function transcribe(blob) {
  toast('⏳ جارِ تحويل الكلام إلى نص…');
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
      toast('✓ تم التحويل — راجع النص ثم أرسل');
    } else toast('لم يتم التقاط كلام واضح');
  } catch (e) {
    toast('⚠️ ' + e.message);
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
        <span style="font-size:14px">💬</span>
        <div style="flex:1;min-width:0">
          <div class="t">${escapeHtml(c.title)}</div>
          <div class="d">${new Date(c.updatedAt).toLocaleDateString('ar-MA')} · ${c.messageCount} رسالة</div>
        </div>
        <button class="del" data-del="${c.id}" title="حذف">🗑</button>
      </div>`).join('');
  } catch (_) {}
}
function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

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
  } catch (e) { toast('⚠️ ' + e.message); }
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
  if (!msg) return;
  pressTimer = setTimeout(() => showCtxMenu(msg, e.touches[0].clientX, e.touches[0].clientY), 550);
}, { passive: true });
chatEl.addEventListener('touchend', () => clearTimeout(pressTimer));
chatEl.addEventListener('touchmove', () => clearTimeout(pressTimer));
chatEl.addEventListener('contextmenu', e => {
  const msg = e.target.closest('.message');
  if (msg) { e.preventDefault(); showCtxMenu(msg, e.clientX, e.clientY); }
});
function showCtxMenu(msg, x, y) {
  const menu = $('ctxMenu');
  const isAi = msg.dataset.role === 'ai';
  menu.innerHTML = '';
  const items = [];
  if (isAi) {
    items.push(['📋 نسخ الإجابة', () => navigator.clipboard.writeText(msg.dataset.text).then(() => toast('✓ تم النسخ'))]);
    items.push(['🔊 قراءة بصوت عالٍ', () => speak(msg.dataset.text)]);
    if (S.user && S.user.plan === 'pro') items.push(['🔁 إعادة توليد', () => regenerate(msg)]);
  } else {
    items.push(['✏️ تعديل وإعادة الإرسال', () => {
      inputEl.value = msg.dataset.text; msg.remove();
      const last = chatEl.querySelector('.message.ai:last-child'); if (last) last.remove();
      inputEl.focus();
    }]);
  }
  items.push(['🗑 حذف من العرض', () => msg.remove()]);
  for (const [label, fn] of items) {
    const b = document.createElement('button');
    b.textContent = label;
    b.addEventListener('click', () => { hideCtxMenu(); fn(); });
    menu.appendChild(b);
  }
  menu.style.display = 'block';
  const rect = menu.getBoundingClientRect();
  menu.style.left = Math.max(8, Math.min(x, window.innerWidth - rect.width - 8)) + 'px';
  menu.style.top = Math.max(8, Math.min(y, window.innerHeight - rect.height - 8)) + 'px';
}
function hideCtxMenu() { $('ctxMenu').style.display = 'none'; }
document.addEventListener('click', e => { if (!e.target.closest('#ctxMenu')) hideCtxMenu(); });

// ── النوافذ ───────────────────────────────────────────────
function openModal(id) { $(id).classList.add('show'); }
function closeModal(id) { $(id).classList.remove('show'); }
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.close)));
document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); }));

// ── الحسابات ──────────────────────────────────────────────
let authMode = 'login';
function openAuth(mode) {
  authMode = mode || 'login';
  $('authTitle').textContent = authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد';
  $('authNameField').classList.toggle('hidden', authMode === 'login');
  $('authSubmit').textContent = authMode === 'login' ? 'دخول' : 'إنشاء الحساب';
  $('authSwitch').innerHTML = authMode === 'login' ? 'ليس لديك حساب؟ <b>أنشئ حساباً</b>' : 'لديك حساب؟ <b>سجّل دخولك</b>';
  openModal('authModal');
}
$('authSwitch').addEventListener('click', () => openAuth(authMode === 'login' ? 'register' : 'login'));
$('authSubmit').addEventListener('click', async () => {
  const email = $('authEmail').value.trim();
  const password = $('authPassword').value;
  const name = $('authName').value.trim();
  if (!email || !password) return toast('⚠️ أكمل البريد وكلمة المرور');
  try {
    const body = authMode === 'login' ? { email, password } : { email, password, name };
    const data = await api('/api/auth/' + authMode, { method: 'POST', json: body });
    S.token = data.token;
    localStorage.setItem('cosa_token', S.token);
    S.user = data.user;
    closeModal('authModal');
    toast('👋 أهلاً ' + S.user.name);
    updateCounter(); renderAccount(); refreshChatList();
  } catch (e) { toast('⚠️ ' + e.message); }
});
function logout() {
  S.token = null; S.user = null; S.chatId = null;
  localStorage.removeItem('cosa_token');
  chatEl.innerHTML = ''; chatEl.classList.remove('active');
  welcomeEl.style.display = '';
  closeModal('settingsModal');
  toast('تم تسجيل الخروج');
  boot();
}

async function loadMe() {
  try {
    const { user } = await api('/api/auth/me');
    S.user = user;
  } catch (_) {
    S.token = null; localStorage.removeItem('cosa_token');
    try { const { user } = await api('/api/auth/me'); S.user = user; }
    catch (_) { S.user = { name: 'ضيف', plan: 'free', usedToday: 0, guest: true }; }
  }
}

function renderAccount() {
  const box = $('accountSection');
  if (!S.user) return;
  if (S.user.guest) {
    box.innerHTML = `
      <div class="set-row" style="flex-direction:column;align-items:stretch;gap:9px">
        <div style="font-size:11px;color:var(--muted)">أنت تستخدم COSA AI كضيف. أنشئ حساباً لمزامنة محادثاتك بين أجهزتك.</div>
        <button class="btn btn-primary" id="goLogin" style="height:40px">تسجيل الدخول / إنشاء حساب</button>
      </div>`;
    $('goLogin').addEventListener('click', () => openAuth('login'));
    $('deleteAccountRow').classList.add('hidden');
  } else {
    const planTxt = S.user.plan === 'pro'
      ? '⭐ Pro حتى ' + new Date(S.user.proExpiresAt).toLocaleDateString('ar-MA')
      : 'مجاني (FREE)';
    box.innerHTML = `
      <div class="set-row"><span>👤 ${escapeHtml(S.user.name)}</span><span style="color:var(--muted);font-size:10px">${escapeHtml(S.user.email || '')}</span></div>
      <div class="set-row"><span>الخطة</span><span style="color:${S.user.plan === 'pro' ? '#f59e0b' : 'var(--muted)'};font-weight:800;font-size:11px">${planTxt}</span></div>
      <button class="btn btn-ghost" id="logoutBtn" style="margin-top:4px;height:40px">تسجيل الخروج</button>`;
    $('logoutBtn').addEventListener('click', logout);
    $('deleteAccountRow').classList.remove('hidden');
  }
}
$('deleteAllChats').addEventListener('click', async () => {
  if (!confirm('حذف جميع محادثاتك نهائياً؟')) return;
  try { await api('/api/chats', { method: 'DELETE' }); chatEl.innerHTML = ''; S.chatId = null; toast('✓ تم الحذف'); }
  catch (e) { toast('⚠️ ' + e.message); }
});
$('deleteAccount').addEventListener('click', async () => {
  const pwd = prompt('أدخل كلمة المرور لتأكيد حذف الحساب نهائياً:');
  if (!pwd) return;
  try { await api('/api/auth/account', { method: 'DELETE', json: { password: pwd } }); logout(); toast('تم حذف الحساب'); }
  catch (e) { toast('⚠️ ' + e.message); }
});

// ── PRO ───────────────────────────────────────────────────
function openPro() {
  renderAccountPro();
  openModal('proModal');
}
function renderAccountPro() {
  const st = $('subStatus');
  if (S.user && S.user.plan === 'pro') {
    st.classList.remove('hidden');
    st.textContent = '⭐ اشتراكك Pro نشط — ينتهي في ' + new Date(S.user.proExpiresAt).toLocaleDateString('ar-MA');
  } else st.classList.add('hidden');
}
$('openPro').addEventListener('click', openPro);
document.querySelectorAll('.plan').forEach(p => p.addEventListener('click', () => {
  document.querySelectorAll('.plan').forEach(x => x.classList.remove('selected'));
  p.classList.add('selected');
}));

function openWA(message) {
  const num = (S.config && S.config.whatsapp) || '';
  window.open('https://api.whatsapp.com/send?phone=' + num + '&text=' + encodeURIComponent(message), '_blank');
}
$('waContact').addEventListener('click', () => openWA('مرحباً 👋 لدي سؤال حول COSA AI'));
$('waPay').addEventListener('click', () => {
  const plan = document.querySelector('.plan.selected').dataset.plan;
  const price = plan === 'yearly' ? S.config.prices.yearly : S.config.prices.monthly;
  openWA(`مرحباً 👋 أريد الاشتراك في COSA AI Pro\n\n📦 الخطة: ${plan === 'yearly' ? 'سنوي' : 'شهري'}\n💰 السعر: ${price} درهم\n\nسأقوم بالتحويل وانتظر كود التفعيل.`);
});

$('activateBtn').addEventListener('click', async () => {
  const code = $('activationCode').value.trim().toUpperCase();
  if (!code) return toast('⚠️ أدخل كود التفعيل');
  const btn = $('activateBtn');
  btn.textContent = '⏳ جارِ التحقق…'; btn.disabled = true;
  try {
    const data = await api('/api/activate', { method: 'POST', json: { code } });
    S.user = data.user;
    closeModal('proModal');
    toast('🎉 تم تفعيل COSA AI Pro بنجاح!');
    updateCounter(); renderAccount();
    $('activationCode').value = '';
  } catch (e) {
    toast('❌ ' + e.message);
  } finally {
    btn.textContent = 'تفعيل الكود'; btn.disabled = false;
  }
});

// ── الإعدادات ─────────────────────────────────────────────
$('settingsBtn').addEventListener('click', () => { renderAccount(); openModal('settingsModal'); });
$('setDark').addEventListener('change', e => {
  S.theme = e.target.checked ? 'dark' : 'light';
  localStorage.setItem('cosa_theme', S.theme);
  applyTheme();
});
$('setFontSize').addEventListener('input', e => {
  S.fontSize = e.target.value;
  localStorage.setItem('cosa_font', S.fontSize);
  document.body.style.setProperty('--app-font-size', S.fontSize + 'px');
});
$('setTtsRate').addEventListener('input', e => {
  S.ttsRate = parseFloat(e.target.value);
  localStorage.setItem('cosa_tts_rate', String(S.ttsRate));
});
$('setSttLang').addEventListener('change', e => {
  S.sttLang = e.target.value;
  localStorage.setItem('cosa_stt_lang', S.sttLang);
});

// ── وضع COSA Voice ────────────────────────────────────────
let voiceActive = false;
$('voiceModeBtn').addEventListener('click', () => {
  if (!S.user) return;
  if (S.user.plan !== 'pro') { toast('🔒 وضع COSA Voice متاح لمشتركي Pro'); openPro(); return; }
  voiceActive = true;
  $('voiceOverlay').classList.add('show');
  voiceIdle();
});
$('voiceClose').addEventListener('click', () => {
  voiceActive = false;
  speechSynthesis.cancel(); speaking = false;
  if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
  $('voiceOverlay').classList.remove('show');
});
function voiceIdle() {
  $('voiceOrb').className = 'voice-orb';
  $('voiceOrb').textContent = '🎙️';
  $('voiceStatus').textContent = 'اضغط على الدائرة للتحدث';
  $('voiceText').textContent = '';
}
$('voiceOrb').addEventListener('click', async () => {
  if (!voiceActive) return;
  if (mediaRecorder && mediaRecorder.state === 'recording') { mediaRecorder.stop(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      $('voiceOrb').className = 'voice-orb';
      try {
        const fd = new FormData();
        fd.append('audio', new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' }), 'voice.webm');
        fd.append('language', S.sttLang);
        $('voiceStatus').textContent = '⏳ أستمع وأفكر…';
        const r = await fetch('/api/stt', { method: 'POST', headers: { 'Authorization': 'Bearer ' + S.token }, body: fd });
        const data = await r.json();
        if (!r.ok || !data.text) throw new Error(data.error || 'لم يتم التقاط كلام');
        $('voiceText').textContent = '«' + data.text + '»';
        await sendVoiceMessage(data.text);
      } catch (e) {
        $('voiceStatus').textContent = '⚠️ ' + e.message;
        setTimeout(voiceIdle, 2000);
      }
    };
    mediaRecorder.start();
    $('voiceOrb').className = 'voice-orb listening';
    $('voiceStatus').textContent = '🎤 أستمع إليك…';
  } catch (e) {
    $('voiceStatus').textContent = '⚠️ الميكروفون غير متاح';
  }
});
async function sendVoiceMessage(text) {
  $('voiceStatus').textContent = '🤔 COSA AI يفكر…';
  enterChat();
  chatEl.appendChild(messageEl('user', text));
  S.streaming = true;
  showTyping();
  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + S.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: S.chatId, content: text })
    });
    removeTyping();
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || 'تعذر الإجابة');
    }
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '', full = '', aiEl = null, bubble = null;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n'); buffer = parts.pop() || '';
      for (const block of parts) {
        let event = 'message', dataLine = '';
        for (const ln of block.split('\n')) {
          if (ln.startsWith('event:')) event = ln.slice(6).trim();
          else if (ln.startsWith('data:')) dataLine += ln.slice(5).trim();
        }
        if (!dataLine) continue;
        let p; try { p = JSON.parse(dataLine); } catch (_) { continue; }
        if (event === 'meta') { S.chatId = p.chatId; }
        else if (p.delta) {
          if (!aiEl) {
            aiEl = document.createElement('div');
            aiEl.className = 'message ai'; aiEl.dataset.role = 'ai'; aiEl.dataset.text = '';
            aiEl.innerHTML = '<div class="avatar ai-avatar">AI</div><div><div class="bubble"></div><div class="msg-actions"></div></div>';
            bubble = aiEl.querySelector('.bubble');
            chatEl.appendChild(aiEl);
          }
          full += p.delta;
          aiEl.dataset.text = full;
          bubble.innerHTML = renderMarkdown(full);
          scrollBottom(false);
        }
      }
    }
    if (aiEl) { bubble.innerHTML = renderMarkdown(full); addMsgActions(aiEl); }
    $('voiceOrb').className = 'voice-orb speaking';
    $('voiceStatus').textContent = '🔊 COSA AI يتحدث…';
    const u = new SpeechSynthesisUtterance(plainForSpeech(full || 'لم يصل رد.'));
    u.lang = 'ar-MA'; u.rate = S.ttsRate;
    const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('ar'));
    if (v) u.voice = v;
    u.onend = () => { if (voiceActive) voiceIdle(); };
    speechSynthesis.speak(u);
  } catch (e) {
    removeTyping();
    $('voiceStatus').textContent = '⚠️ ' + e.message;
    setTimeout(voiceIdle, 2200);
  } finally {
    S.streaming = false;
  }
}

// ── لوحة الإدارة ──────────────────────────────────────────
async function openAdmin() {
  if (!S.user || !S.user.admin) return toast('⛔ غير مصرّح');
  S.adminMode = true;
  $('appView').classList.add('hidden');
  $('adminView').classList.remove('hidden');
  window.scrollTo(0, 0);
  try {
    const s = await api('/api/admin/stats');
    $('adminStats').innerHTML = `
      <div class="stat-card"><b>${s.users}</b><span>مستخدم مسجّل</span></div>
      <div class="stat-card"><b>${s.guests}</b><span>زائر (ضيف)</span></div>
      <div class="stat-card"><b>${s.activePro}</b><span>اشتراك Pro نشط</span></div>
      <div class="stat-card"><b>${s.messages}</b><span>إجمالي الرسائل</span></div>
      <div class="stat-card"><b>${s.chats}</b><span>محادثة</span></div>
      <div class="stat-card"><b>${s.todayUsage}</b><span>رسائل اليوم (الكل)</span></div>
      <div class="stat-card"><b>${s.codes.used}/${s.codes.total}</b><span>أكواد مستخدمة/كلية</span></div>
      <div class="stat-card"><b>${S.config ? S.config.freeLimit : 35}</b><span>الحد اليومي المجاني</span></div>`;
  } catch (e) { toast('⚠️ ' + e.message); }
}
$('adminBack').addEventListener('click', () => {
  S.adminMode = false;
  $('adminView').classList.add('hidden');
  $('appView').classList.remove('hidden');
});
$('adminGenCodes').addEventListener('click', async () => {
  try {
    const plan = $('adminCodePlan').value;
    const count = parseInt($('adminCodeCount').value || '5', 10);
    const { codes } = await api('/api/admin/codes', { method: 'POST', json: { plan, count } });
    $('adminCodeList').innerHTML = codes.map(c => `<div><span>${c}</span><span style="color:var(--ok)">جديد</span></div>`).join('');
    toast('✓ تم إصدار ' + codes.length + ' كود');
  } catch (e) { toast('⚠️ ' + e.message); }
});
// وصول المدير: 5 ضغطات متتالية على الشعار
let brandTaps = 0, brandTapTimer;
$('brandHome').addEventListener('click', () => {
  if (S.user && S.user.admin) {
    brandTaps++;
    clearTimeout(brandTapTimer);
    brandTapTimer = setTimeout(() => brandTaps = 0, 1500);
    if (brandTaps >= 5) { brandTaps = 0; openAdmin(); }
  } else {
    $('newChatBtn').click();
  }
});

// ── الإقلاع ───────────────────────────────────────────────
async function boot() {
  applyTheme();
  document.body.style.setProperty('--app-font-size', S.fontSize + 'px');
  $('setFontSize').value = S.fontSize;
  $('setTtsRate').value = S.ttsRate;
  $('setSttLang').value = S.sttLang;
  setStatus(navigator.onLine);
  try {
    S.config = await api('/api/config');
    $('cmpFreeLimit').textContent = S.config.freeLimit;
    $('priceMonthly').textContent = S.config.prices.monthly;
    $('priceYearly').textContent = S.config.prices.yearly;
  } catch (_) { toast('⚠️ تعذر الاتصال بالخادم'); }
  await loadMe();
  updateCounter();
  renderAccount();
  refreshChatList();
}
boot();
