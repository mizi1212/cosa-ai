// ═══════════════════════════════════════════════════════════
// COSA AI — قاعدة بيانات JSON خفيفة مع كتابة ذرّية
// ═══════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = '/tmp/db.json';

let db = { users: [], chats: [], codes: {}, usage: {}, transactions: [] };

function load() {
  try {
    if (fs.existsSync(DB_FILE)) {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      db.codes = db.codes || {};
      db.usage = db.usage || {};
      db.transactions = db.transactions || [];
      db.users = db.users || [];
      db.chats = db.chats || [];
    }
  } catch (e) {
    console.error('⚠️  تعذر قراءة قاعدة البيانات، سيتم البدء بقاعدة فارغة:', e.message);
  }
}

// كتابة ذرّية عبر طابور (تمنع تلف الملف عند الطلبات المتزامنة)
let writeQueue = Promise.resolve();
function save() {
  writeQueue = writeQueue.then(() => {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db));
    fs.renameSync(tmp, DB_FILE);
  });
  return writeQueue;
}

const uid = () => crypto.randomBytes(12).toString('hex');
const now = () => new Date().toISOString();

// ── المستخدمون ────────────────────────────────────────────
function findUserByEmail(email) {
  const target = String(email || '').toLowerCase();
  if (!target) return undefined;
  return db.users.find(u => u.email && u.email.toLowerCase() === target);
}
function findUserById(id) {
  return db.users.find(u => u.id === id);
}
function createUser({ email, name, passwordHash, admin }) {
  const user = {
    id: uid(), email: String(email).toLowerCase().trim(), name: String(name).trim(),
    passwordHash, admin: !!admin, plan: 'free',
    proExpiresAt: null, createdAt: now()
  };
  db.users.push(user);
  save();
  return user;
}
function updateUser(id, patch) {
  const u = findUserById(id);
  if (u) { Object.assign(u, patch); save(); }
  return u;
}

// ── الضيوف (بدون حساب — بمعرّف جهاز) ─────────────────────
function getGuest(deviceId) {
  let g = db.users.find(u => u.id === 'guest:' + deviceId);
  if (!g) {
    g = { id: 'guest:' + deviceId, email: null, name: 'ضيف', guest: true, plan: 'free', proExpiresAt: null, createdAt: now() };
    db.users.push(g);
    save();
  }
  return g;
}

// ── الاشتراك ──────────────────────────────────────────────
function isPro(user) {
  if (!user || user.plan !== 'pro' || !user.proExpiresAt) return false;
  if (new Date(user.proExpiresAt) < new Date()) {
    user.plan = 'free';
    save();
    return false;
  }
  return true;
}
function activatePro(user, days, source, code) {
  const base = (isPro(user) ? new Date(user.proExpiresAt) : new Date());
  base.setDate(base.getDate() + days);
  user.plan = 'pro';
  user.proExpiresAt = base.toISOString();
  db.transactions.push({ id: uid(), userId: user.id, type: 'activation', source, code: code || null, days, at: now() });
  save();
  return user;
}

// ── عداد الرسائل اليومي (على الخادم) ─────────────────────
function todayKey() { return new Date().toISOString().slice(0, 10); }
function getUsage(userId) {
  const k = todayKey() + ':' + userId;
  db.usage[k] = db.usage[k] || 0;
  return db.usage[k];
}
function incrementUsage(userId) {
  const k = todayKey() + ':' + userId;
  db.usage[k] = (db.usage[k] || 0) + 1;
  save();
  return db.usage[k];
}
function pruneUsage() {
  const cutoff = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
  let changed = false;
  for (const k of Object.keys(db.usage)) {
    if (k.slice(0, 10) < cutoff) { delete db.usage[k]; changed = true; }
  }
  if (changed) save();
}

// ── المحادثات ─────────────────────────────────────────────
function userChats(userId) {
  return db.chats
    .filter(c => c.userId === userId)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .map(c => ({ id: c.id, title: c.title, updatedAt: c.updatedAt, messageCount: c.messages.length }));
}
function findChat(userId, chatId) {
  return db.chats.find(c => c.id === chatId && c.userId === userId);
}
function createChat(userId, title) {
  const chat = { id: uid(), userId, title: title || 'محادثة جديدة', messages: [], createdAt: now(), updatedAt: now() };
  db.chats.push(chat);
  save();
  return chat;
}
function appendMessages(chatId, msgs) {
  const c = db.chats.find(x => x.id === chatId);
  if (!c) return null;
  c.messages.push(...msgs);
  c.updatedAt = now();
  save();
  return c;
}
function renameChat(userId, chatId, title) {
  const c = findChat(userId, chatId);
  if (!c) return null;
  c.title = String(title).trim().slice(0, 80) || c.title;
  save();
  return c;
}
function deleteChat(userId, chatId) {
  const i = db.chats.findIndex(c => c.id === chatId && c.userId === userId);
  if (i === -1) return false;
  db.chats.splice(i, 1);
  save();
  return true;
}
function deleteAllChats(userId) {
  db.chats = db.chats.filter(c => c.userId !== userId);
  save();
}
function autoTitle(firstUserText) {
  const t = String(firstUserText).replace(/\s+/g, ' ').trim();
  return (t.length > 42 ? t.slice(0, 42) + '…' : t) || 'محادثة جديدة';
}

// ── أكواد التفعيل ─────────────────────────────────────────
function generateCode(plan, days) {
  const raw = crypto.randomBytes(6).toString('hex').toUpperCase();
  const prefix = plan === 'vip' ? 'VIP' : plan === 'yearly' ? 'Y' : 'M';
  const code = `COSA-${prefix}-${raw}`;
  db.codes[code] = { plan, days, createdAt: now(), usedBy: null, usedAt: null, revoked: false };
  save();
  return code;
}
// تفعيل ذرّي: فحص + تعليم في خطوة واحدة
let codeLock = Promise.resolve();
function redeemCode(user, code) {
  const run = codeLock.then(() => {
    const c = db.codes[code];
    if (!c) return { ok: false, error: 'الكود غير صحيح' };
    if (c.revoked) return { ok: false, error: 'هذا الكود ملغى' };
    if (c.usedBy) return { ok: false, error: 'هذا الكود مستخدم بالفعل' };
    c.usedBy = user.id;
    c.usedAt = now();
    activatePro(user, c.days, 'code', code);
    return { ok: true, days: c.days, plan: c.plan };
  });
  codeLock = run.catch(() => {});
  return run;
}

// ── الإحصاءات ─────────────────────────────────────────────
function stats() {
  const realUsers = db.users.filter(u => !u.guest);
  const proUsers = db.users.filter(u => !u.guest && isPro(u));
  const msgCount = db.chats.reduce((n, c) => n + c.messages.length, 0);
  const usedCodes = Object.values(db.codes).filter(c => c.usedBy).length;
  const totalCodes = Object.keys(db.codes).length;
  return {
    users: realUsers.length,
    guests: db.users.length - realUsers.length,
    activePro: proUsers.length,
    messages: msgCount,
    chats: db.chats.length,
    codes: { total: totalCodes, used: usedCodes },
    todayUsage: Object.keys(db.usage).filter(k => k.startsWith(todayKey())).reduce((n, k) => n + db.usage[k], 0)
  };
}

load();
setInterval(pruneUsage, 6 * 3600 * 1000).unref();

module.exports = {
  db, save, uid, now,
  findUserByEmail, findUserById, createUser, updateUser, getGuest,
  isPro, activatePro,
  getUsage, incrementUsage,
  userChats, findChat, createChat, appendMessages, renameChat, deleteChat, deleteAllChats, autoTitle,
  generateCode, redeemCode, stats
};
