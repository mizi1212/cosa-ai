// مسار جديد باش نتأكدو من التوكن ونجيبو المستخدم
app.get('/api/auth/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // هنا قلب على المستخدم فـ قاعدة البيانات ديالك (users)
        const user = await db.getUserById(decoded.userId); 
        
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});
// ═══════════════════════════════════════════════════════════
// COSA AI — Your Intelligent World
// الخادم الخلفي الآمن: لا مفاتيح في الواجهة، كل التحقق هنا.
// ═══════════════════════════════════════════════════════════
require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const CFG = {
  groqKey: process.env.GROQ_API_KEY || '',
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  masterCode: (process.env.MASTER_CODE || '').toUpperCase(),
  adminEmail: (process.env.ADMIN_EMAIL || '').toLowerCase(),
  modelFree: process.env.MODEL_FREE || 'openai/gpt-oss-20b',
  modelPro: process.env.MODEL_PRO || 'openai/gpt-oss-120b',
  modelVision: process.env.MODEL_VISION || 'meta-llama/llama-4-scout-17b-16e-instruct',
  modelStt: process.env.MODEL_STT || 'whisper-large-v3-turbo',
  freeLimit: parseInt(process.env.FREE_DAILY_LIMIT || '35', 10),
  proLimit: parseInt(process.env.PRO_DAILY_LIMIT || '1000', 10),
  maxFileMB: parseInt(process.env.MAX_FILE_MB || '8', 10),
  whatsapp: process.env.WHATSAPP_NUMBER || '',
  prices: {
    monthly: parseInt(process.env.PRICE_MONTHLY_MAD || '30', 10),
    yearly: parseInt(process.env.PRICE_YEARLY_MAD || '250', 10)
  }
};

if (CFG.groqKey === 'ضع_مفتاحك_هنا' || !CFG.groqKey) {
  console.warn('⚠️  GROQ_API_KEY غير مضبوط في ملف .env — الذكاء الاصطناعي لن يعمل.');
}
const MOCK = CFG.groqKey === 'mock'; // وضع اختبار محلي بدون مفتاح

// ── الأمان الأساسي ────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:']
    }
  }
}));
app.use(express.json({ limit: '12mb' }));
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '1h', index: 'index.html' }));

const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false, message: { error: 'طلبات كثيرة جداً، انتظر قليلاً' } });
const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: '⏳ أرسلت رسائل كثيرة بسرعة، انتظر دقيقة' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'محاولات كثيرة، حاول لاحقاً' } });
app.use('/api/', apiLimiter);

// ── المصادقة ──────────────────────────────────────────────
function signToken(user) {
  return jwt.sign({ uid: user.id }, CFG.jwtSecret, { expiresIn: '30d' });
}
function identify(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(h.slice(7), CFG.jwtSecret);
      const u = db.findUserById(payload.uid);
      if (u) return { user: u, guest: false };
    } catch (_) { /* توكن غير صالح */ }
  }
  const deviceId = String(req.headers['x-device-id'] || '').slice(0, 64);
  if (!deviceId) return null;
  return { user: db.getGuest('dev_' + crypto.createHash('sha256').update(deviceId).digest('hex').slice(0, 24)), guest: true };
}
function requireAuth(req, res, next) {
  const id = identify(req);
  if (!id) return res.status(401).json({ error: 'يلزم تسجيل الدخول' });
  req.auth = id;
  next();
}
function requireAdmin(req, res, next) {
  const id = identify(req);
  if (!id || id.guest || !id.user.admin) return res.status(403).json({ error: 'غير مصرّح' });
  req.auth = id;
  next();
}
const publicUser = u => ({
  id: u.id, name: u.name, email: u.email, admin: !!u.admin,
  plan: db.isPro(u) ? 'pro' : 'free',
  proExpiresAt: db.isPro(u) ? u.proExpiresAt : null,
  usedToday: db.getUsage(u.id),
  guest: !!u.guest
});

// ═══ المسارات ═══════════════════════════════════════════

// ── الحسابات ──────────────────────────────────────────────
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { email, name, password } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'بريد إلكتروني غير صالح' });
  if (!name || String(name).trim().length < 2) return res.status(400).json({ error: 'الاسم قصير جداً' });
  if (!password || String(password).length < 6) return res.status(400).json({ error: 'كلمة المرور 6 أحرف على الأقل' });
  if (db.findUserByEmail(email)) return res.status(409).json({ error: 'هذا البريد مسجّل مسبقاً' });
  const passwordHash = await bcrypt.hash(String(password), 10);
  const isFirstAdmin = CFG.adminEmail && email.toLowerCase() === CFG.adminEmail && !db.db.users.some(u => u.admin);
  const user = db.createUser({ email, name, passwordHash, admin: isFirstAdmin });
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  const user = db.findUserByEmail(email || '');
  if (!user || user.guest || !(await bcrypt.compare(String(password || ''), user.passwordHash))) {
    return res.status(401).json({ error: 'البريد أو كلمة المرور غير صحيحة' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.auth.user) }));

app.put('/api/auth/profile', requireAuth, async (req, res) => {
  const { name, password, currentPassword } = req.body || {};
  const u = req.auth.user;
  if (name) u.name = String(name).trim().slice(0, 60);
  if (password) {
    if (u.guest) return res.status(400).json({ error: 'غير متاح للضيوف' });
    if (!(await bcrypt.compare(String(currentPassword || ''), u.passwordHash))) {
      return res.status(403).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }
    if (String(password).length < 6) return res.status(400).json({ error: 'كلمة المرور الجديدة قصيرة' });
    u.passwordHash = await bcrypt.hash(String(password), 10);
  }
  db.save();
  res.json({ user: publicUser(u) });
});

app.delete('/api/auth/account', requireAuth, async (req, res) => {
  const u = req.auth.user;
  if (u.guest) return res.status(400).json({ error: 'غير متاح للضيوف' });
  if (u.admin) return res.status(400).json({ error: 'لا يمكن حذف حساب المدير' });
  if (!(await bcrypt.compare(String((req.body || {}).password || ''), u.passwordHash))) {
    return res.status(403).json({ error: 'كلمة المرور غير صحيحة' });
  }
  db.db.users = db.db.users.filter(x => x.id !== u.id);
  db.db.chats = db.db.chats.filter(x => x.userId !== u.id);
  db.save();
  res.json({ ok: true });
});

// ── الإعدادات العامة والنماذج ─────────────────────────────
app.get('/api/config', (req, res) => {
  res.json({
    freeLimit: CFG.freeLimit,
    proLimit: CFG.proLimit,
    prices: CFG.prices,
    whatsapp: CFG.whatsapp,
    models: MOCK ? [{ id: 'mock-model', label: 'وضع الاختبار', plan: 'free', vision: false }] : [
      { id: CFG.modelFree, label: 'COSA Fast', plan: 'free', vision: false },
      { id: CFG.modelPro, label: 'COSA Pro', plan: 'pro', vision: false },
      { id: 'qwen/qwen3-32b', label: 'Qwen 3 — عربي قوي', plan: 'pro', vision: false },
      { id: CFG.modelVision, label: 'COSA Vision — صور ومستندات', plan: 'pro', vision: true }
    ]
  });
});

// ── المحادثات ─────────────────────────────────────────────
app.get('/api/chats', requireAuth, (req, res) => res.json({ chats: db.userChats(req.auth.user.id) }));

app.post('/api/chats', requireAuth, (req, res) => {
  const c = db.createChat(req.auth.user.id);
  res.json({ chat: { id: c.id, title: c.title, messages: [] } });
});

app.get('/api/chats/:id', requireAuth, (req, res) => {
  const c = db.findChat(req.auth.user.id, req.params.id);
  if (!c) return res.status(404).json({ error: 'المحادثة غير موجودة' });
  res.json({ chat: c });
});

app.patch('/api/chats/:id', requireAuth, (req, res) => {
  const c = db.renameChat(req.auth.user.id, req.params.id, (req.body || {}).title);
  if (!c) return res.status(404).json({ error: 'المحادثة غير موجودة' });
  res.json({ ok: true });
});

app.delete('/api/chats/:id', requireAuth, (req, res) => {
  if (!db.deleteChat(req.auth.user.id, req.params.id)) return res.status(404).json({ error: 'غير موجودة' });
  res.json({ ok: true });
});

app.delete('/api/chats', requireAuth, (req, res) => {
  db.deleteAllChats(req.auth.user.id);
  res.json({ ok: true });
});

// ── شخصية COSA AI ─────────────────────────────────────────
const SYSTEM_PROMPT = `أنت COSA AI — مساعد ذكاء اصطناعي من تطوير Abobakr Mizi. شخصيتك: خبير، ودود، دقيق، ومنظم.

القواعد:
- أجب دائماً بلغة المستخدم (العربية الفصحى، الدارجة المغربية، الفرنسية، الإنجليزية... حسب ما يكتبه).
- استخدم Markdown للتنظيم: عناوين، قوائم، جداول عند الحاجة.
- للمسائل الرياضية: اشرح الخطوات بشكل منهجي.
- للبرمجة: اكتب أكواداً كاملة مع شرح، وضع الكود داخل بلوكات markdown.
- لا تختلق مصادر أو معلومات؛ إن لم تكن متأكداً فقل ذلك بوضوح.
- إجابات مفصلة عند الحاجة، مختصرة عند السؤال البسيط.
- لا تذكر اسم النموذج التقني أو أي شركة أخرى أبداً.`;

// إدارة السياق: آخر 16 رسالة + ملخص قديم للحوارات الطويلة
function buildContext(messages) {
  const recent = messages.slice(-16);
  const out = [{ role: 'system', content: SYSTEM_PROMPT }];
  if (messages.length > 16) {
    out.push({
      role: 'system',
      content: 'ملخص المحادثة السابقة: ' + messages.slice(0, -16)
        .filter(m => m.role === 'user')
        .map(m => String(m.content).slice(0, 200)).join(' | ')
    });
  }
  for (const m of recent) {
    if (m.role !== 'user' && m.role !== 'assistant') continue;
    out.push({ role: m.role, content: m.content });
  }
  return out;
}

// ── المحادثة مع Groq (Streaming عبر SSE) ─────────────────
app.post('/api/chat', requireAuth, chatLimiter, async (req, res) => {
  const { chatId, content, model, image } = req.body || {};
  const text = String(content || '').trim();
  const hasImage = !!image;
  if (!text && !hasImage) return res.status(400).json({ error: 'رسالة فارغة' });
  if (text.length > 12000) return res.status(400).json({ error: 'الرسالة طويلة جداً' });

  const u = req.auth.user;
  const pro = db.isPro(u);
  const limit = pro ? CFG.proLimit : CFG.freeLimit;
  const used = db.getUsage(u.id);
  if (used >= limit) {
    return res.status(429).json({ error: 'limit', remaining: 0, limit, pro });
  }
  if (hasImage && !pro) return res.status(403).json({ error: 'الصور متاحة لمشتركي Pro فقط' });

  let chat = chatId ? db.findChat(u.id, chatId) : null;
  if (!chat) chat = db.createChat(u.id, db.autoTitle(text || 'تحليل صورة'));

  let userContent = text || 'صف هذه الصورة بالتفصيل';
  if (hasImage) {
    if (!/^data:image\/(jpeg|jpg|png|webp);base64,/.test(image)) {
      return res.status(400).json({ error: 'صيغة الصورة غير مدعومة (JPG/PNG/WEBP)' });
    }
    const sizeMB = (image.length * 3 / 4) / 1e6;
    if (sizeMB > CFG.maxFileMB) return res.status(400).json({ error: `الصورة أكبر من ${CFG.maxFileMB}MB` });
    userContent = [
      { type: 'image_url', image_url: { url: image } },
      { type: 'text', text }
    ];
  }

  db.appendMessages(chat.id, [{ role: 'user', content: text || '(صورة)', at: db.now() }]);

  const chosen = hasImage ? CFG.modelVision : (pro && model ? model : (pro ? CFG.modelPro : CFG.modelFree));

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write(`event: meta\ndata: ${JSON.stringify({ chatId: chat.id, title: chat.title, model: chosen, used: used + 1, limit })}\n\n`);

  let fullText = '';

  const finish = (err) => {
    if (!err && fullText.trim()) {
      db.appendMessages(chat.id, [{ role: 'assistant', content: fullText, at: db.now() }]);
    }
    db.incrementUsage(u.id);
    res.write(`event: done\ndata: ${JSON.stringify({ ok: !err, error: err || null })}\n\n`);
    res.end();
  };

  if (MOCK) {
    const reply = `هذه إجابة تجريبية من وضع الاختبار (MOCK).\n\n**سؤالك:** ${text}\n\n- الخادم يعمل ✓\n- التدفق يعمل ✓\n- عداد الرسائل على الخادم ✓`;
    const words = reply.split(' ');
    let i = 0;
    const t = setInterval(() => {
      const chunk = words.slice(i, i + 3).join(' ') + ' ';
      i += 3;
      fullText += chunk;
      res.write(`data: ${JSON.stringify({ delta: chunk })}\n\n`);
      if (i >= words.length) { clearInterval(t); finish(null); }
    }, 60);
    req.on('close', () => clearInterval(t));
    return;
  }

  try {
    const messages = buildContext([...chat.messages.slice(0, -1), { role: 'user', content: userContent }]);
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CFG.groqKey },
      body: JSON.stringify({
        model: chosen,
        messages,
        temperature: 0.7,
        max_tokens: pro ? 4096 : 1500,
        stream: true
      })
    });

    if (!groqRes.ok || !groqRes.body) {
      const errTxt = await groqRes.text().catch(() => '');
      console.error('Groq error:', groqRes.status, errTxt.slice(0, 300));
      res.write(`event: error\ndata: ${JSON.stringify({ error: groqRes.status === 401 || groqRes.status === 403 ? 'مفتاح Groq غير صالح — راجع ملف .env' : 'تعذر الاتصال بمزود الذكاء الاصطناعي' })}\n\n`);
      return finish('groq_error');
    }

    const reader = groqRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    req.on('close', () => { try { reader.cancel(); } catch (_) {} });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const l = line.trim();
        if (!l.startsWith('data:')) continue;
        const payload = l.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content;
          if (delta) {
            fullText += delta;
            res.write(`data: ${JSON.stringify({ delta })}\n\n`);
          }
        } catch (_) { /* تجاهل الأسطر غير المكتملة */ }
      }
    }
    finish(null);
  } catch (e) {
    console.error('Chat error:', e.message);
    res.write(`event: error\ndata: ${JSON.stringify({ error: 'خطأ في الخادم' })}\n\n`);
    finish('server_error');
  }
});

// ── استخراج نصوص الملفات (PDF / DOCX / نصوص) ─────────────
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: CFG.maxFileMB * 1024 * 1024 } });

app.post('/api/extract', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يصل ملف' });
  if (!db.isPro(req.auth.user)) return res.status(403).json({ error: 'تحليل الملفات متاح لمشتركي Pro فقط' });
  try {
    let text = '';
    const name = (req.file.originalname || '').toLowerCase();
    if (name.endsWith('.pdf')) {
      const pdf = require('pdf-parse');
      const out = await pdf(req.file.buffer);
      text = out.text;
    } else if (name.endsWith('.docx')) {
      const mammoth = require('mammoth');
      const out = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = out.value;
    } else if (/\.(txt|md|csv|json|js|ts|py|html|css|java|c|cpp|sql|xml|yml|yaml|sh)$/.test(name)) {
      text = req.file.buffer.toString('utf8');
    } else {
      return res.status(400).json({ error: 'صيغة غير مدعومة (PDF / DOCX / TXT / CSV / أكواد)' });
    }
    text = text.replace(/\s{3,}/g, '\n\n').trim();
    if (!text) return res.status(400).json({ error: 'تعذر استخراج نص من الملف' });
    if (text.length > 25000) text = text.slice(0, 25000) + '\n\n…(تم اقتطاع الملف الطويل)';
    res.json({ name: req.file.originalname, text, size: req.file.size });
  } catch (e) {
    console.error('Extract error:', e.message);
    res.status(500).json({ error: 'تعذرت معالجة الملف' });
  }
});

// ── تحويل الكلام إلى نص (Whisper عبر Groq) ───────────────
app.post('/api/stt', requireAuth, upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يصل تسجيل' });
  if (MOCK) return res.json({ text: 'هذا نص تجريبي من وضع الاختبار الصوتي' });
  try {
    const form = new FormData();
    form.append('file', new Blob([req.file.buffer], { type: req.file.mimetype || 'audio/webm' }), 'audio.webm');
    form.append('model', CFG.modelStt);
    const lang = String((req.body || {}).language || '').trim();
    if (['ar', 'fr', 'en'].includes(lang)) form.append('language', lang);
    const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + CFG.groqKey }, body: form
    });
    if (!r.ok) {
      console.error('STT error:', r.status, (await r.text()).slice(0, 200));
      return res.status(502).json({ error: 'تعذر التعرف على الكلام' });
    }
    const data = await r.json();
    res.json({ text: (data.text || '').trim() });
  } catch (e) {
    console.error('STT error:', e.message);
    res.status(500).json({ error: 'خطأ في معالجة الصوت' });
  }
});

// ── تفعيل الأكواد (تحقق خادمي ذرّي) ──────────────────────
app.post('/api/activate', requireAuth, chatLimiter, async (req, res) => {
  const code = String((req.body || {}).code || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'أدخل الكود' });
  const u = req.auth.user;

  if (CFG.masterCode && code === CFG.masterCode) {
    db.activatePro(u, 36500, 'master');
    return res.json({ ok: true, plan: 'master', days: 36500, user: publicUser(u) });
  }

  const result = await db.redeemCode(u, code);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json({ ok: true, plan: result.plan, days: result.days, user: publicUser(u) });
});

// ── لوحة الإدارة (صلاحيات خادمية حقيقية) ─────────────────
app.get('/api/admin/stats', requireAdmin, (req, res) => res.json(db.stats()));

app.get('/api/admin/codes', requireAdmin, (req, res) => {
  const { plan, used } = req.query;
  let list = Object.entries(db.db.codes).map(([code, c]) => ({ code, ...c }));
  if (plan) list = list.filter(c => c.plan === plan);
  if (used === 'yes') list = list.filter(c => c.usedBy);
  if (used === 'no') list = list.filter(c => !c.usedBy && !c.revoked);
  list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json({ codes: list.slice(0, 500) });
});

app.post('/api/admin/codes', requireAdmin, (req, res) => {
  const count = Math.min(parseInt((req.body || {}).count || '1', 10) || 1, 100);
  const plan = ['monthly', 'yearly', 'vip'].includes((req.body || {}).plan) ? req.body.plan : 'monthly';
  const days = plan === 'yearly' ? 365 : plan === 'vip' ? 3650 : 30;
  const codes = Array.from({ length: count }, () => db.generateCode(plan, days));
  res.json({ codes });
});

app.post('/api/admin/codes/revoke', requireAdmin, (req, res) => {
  const code = String((req.body || {}).code || '').trim().toUpperCase();
  const c = db.db.codes[code];
  if (!c) return res.status(404).json({ error: 'الكود غير موجود' });
  c.revoked = true;
  db.save();
  res.json({ ok: true });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  res.json({
    users: db.db.users.filter(u => !u.guest).map(u => ({
      id: u.id, name: u.name, email: u.email, plan: db.isPro(u) ? 'pro' : 'free',
      proExpiresAt: u.proExpiresAt, createdAt: u.createdAt
    }))
  });
});

// ── شبكة أمان: لا يموت الخادم بسبب خطأ غير متوقع ──────────
process.on('uncaughtException', err => console.error('⚠️ uncaughtException:', err.message));
process.on('unhandledRejection', err => console.error('⚠️ unhandledRejection:', err && err.message));

// ── تشغيل الخادم ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════');
  console.log('  COSA AI — Your Intelligent World');
  console.log(`  الخادم يعمل على المنفذ ${PORT}`);
  console.log(MOCK ? '  وضع الاختبار: MOCK (بلا مفتاح Groq)' : '  مربوط بـ Groq ✓');
  console.log('═══════════════════════════════════════════');
});
