const { Pool } = require('pg');
const crypto = require('crypto');

// الاتصال بقاعدة البيانات عبر Vercel Environment Variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// إنشاء الجداول تلقائياً إذا لم تكن موجودة
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        password_hash VARCHAR(255),
        admin BOOLEAN DEFAULT FALSE,
        plan VARCHAR(20) DEFAULT 'free',
        pro_expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS chats (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id VARCHAR(50) REFERENCES chats(id) ON DELETE CASCADE,
        role VARCHAR(20),
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS codes (
        code VARCHAR(50) PRIMARY KEY,
        plan VARCHAR(20),
        days INT,
        used_by VARCHAR(50),
        revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS usage (
        user_id VARCHAR(50),
        date DATE,
        count INT DEFAULT 0,
        PRIMARY KEY (user_id, date)
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50),
        type VARCHAR(50),
        source VARCHAR(50),
        code VARCHAR(50),
        days INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Database tables ready');
  } catch (err) {
    console.error('❌ Error initializing DB:', err.message);
  }
}
initDB();

const uid = () => crypto.randomBytes(12).toString('hex');
const now = () => new Date().toISOString();

// ── المستخدمون ────────────────────────────────────────────
async function findUserByEmail(email) {
  const target = String(email || '').toLowerCase();
  if (!target) return undefined;
  const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [target]);
  return res.rows[0];
}

async function findUserById(id) {
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0];
}

async function createUser({ email, name, passwordHash, admin }) {
  const user = {
    id: uid(),
    email: String(email).toLowerCase().trim(),
    name: String(name).trim(),
    password_hash: passwordHash,
    admin: !!admin,
    plan: 'free'
  };
  await pool.query(
    'INSERT INTO users (id, email, name, password_hash, admin, plan) VALUES ($1, $2, $3, $4, $5, $6)',
    [user.id, user.email, user.name, user.password_hash, user.admin, user.plan]
  );
  return { ...user, passwordHash }; // keep original format for server.js
}

async function updateUser(id, patch) {
  if (patch.name) await pool.query('UPDATE users SET name = $1 WHERE id = $2', [patch.name, id]);
  if (patch.passwordHash) await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [patch.passwordHash, id]);
  return await findUserById(id);
}

// ── الضيوف ────────────────────────────────────────────────
async function getGuest(deviceId) {
  const guestId = 'guest:' + deviceId;
  let user = await findUserById(guestId);
  if (!user) {
    await pool.query(
      'INSERT INTO users (id, name, plan) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [guestId, 'ضيف', 'free']
    );
    user = { id: guestId, name: 'ضيف', plan: 'free', guest: true };
  }
  return { ...user, guest: true };
}

// ── الاشتراك ──────────────────────────────────────────────
function isPro(user) {
  if (!user || user.plan !== 'pro' || !user.pro_expires_at) return false;
  if (new Date(user.pro_expires_at) < new Date()) return false;
  return true;
}

async function activatePro(user, days, source, code) {
  const base = (isPro(user) && user.pro_expires_at) ? new Date(user.pro_expires_at) : new Date();
  base.setDate(base.getDate() + days);
  const expiresAt = base.toISOString();
  
  await pool.query(
    'UPDATE users SET plan = $1, pro_expires_at = $2 WHERE id = $3',
    ['pro', expiresAt, user.id]
  );
  await pool.query(
    'INSERT INTO transactions (id, user_id, type, source, code, days) VALUES ($1, $2, $3, $4, $5, $6)',
    [uid(), user.id, 'activation', source, code || null, days]
  );
  return { ...user, plan: 'pro', proExpiresAt: expiresAt, pro_expires_at: expiresAt };
}

// ── عداد الرسائل اليومي ───────────────────────────────────
function todayKey() { return new Date().toISOString().slice(0, 10); }

async function getUsage(userId) {
  const res = await pool.query('SELECT count FROM usage WHERE user_id = $1 AND date = $2', [userId, todayKey()]);
  return res.rows[0] ? res.rows[0].count : 0;
}

async function incrementUsage(userId) {
  const date = todayKey();
  await pool.query(
    'INSERT INTO usage (user_id, date, count) VALUES ($1, $2, 1) ON CONFLICT (user_id, date) DO UPDATE SET count = usage.count + 1',
    [userId, date]
  );
  return await getUsage(userId);
}

// ── المحادثات ─────────────────────────────────────────────
async function createChat(userId, title = 'محادثة جديدة') {
  const chat = { id: uid(), user_id: userId, title, messages: [] };
  await pool.query('INSERT INTO chats (id, user_id, title) VALUES ($1, $2, $3)', [chat.id, userId, title]);
  return chat;
}

async function userChats(userId) {
  const res = await pool.query('SELECT id, title, created_at FROM chats WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return res.rows;
}

async function findChat(userId, chatId) {
  const chatRes = await pool.query('SELECT * FROM chats WHERE id = $1 AND user_id = $2', [chatId, userId]);
  if (chatRes.rows.length === 0) return null;
  const chat = chatRes.rows[0];
  const msgRes = await pool.query('SELECT role, content, created_at as at FROM messages WHERE chat_id = $1 ORDER BY id ASC', [chatId]);
  chat.messages = msgRes.rows;
  return chat;
}

async function appendMessages(chatId, messages) {
  for (const m of messages) {
    await pool.query('INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)', [chatId, m.role, m.content]);
  }
}

async function renameChat(userId, chatId, newTitle) {
  await pool.query('UPDATE chats SET title = $1 WHERE id = $2 AND user_id = $3', [newTitle, chatId, userId]);
  return true;
}

async function deleteChat(userId, chatId) {
  const res = await pool.query('DELETE FROM chats WHERE id = $1 AND user_id = $2', [chatId, userId]);
  return res.rowCount > 0;
}

async function deleteAllChats(userId) {
  await pool.query('DELETE FROM chats WHERE user_id = $1', [userId]);
}

function autoTitle(text) {
  return text.slice(0, 30) + (text.length > 30 ? '...' : '');
}

// ── الأكواد والإدارة ──────────────────────────────────────
async function generateCode(plan, days) {
  const code = 'COSA-' + plan.toUpperCase() + '-' + crypto.randomBytes(6).toString('hex').toUpperCase();
  await pool.query('INSERT INTO codes (code, plan, days) VALUES ($1, $2, $3)', [code, plan, days]);
  return code;
}

async function redeemCode(user, code) {
  const res = await pool.query('SELECT * FROM codes WHERE code = $1 FOR UPDATE', [code]);
  const c = res.rows[0];
  if (!c) return { ok: false, error: 'الكود غير صحيح' };
  if (c.revoked) return { ok: false, error: 'الكود ملغى' };
  if (c.used_by) return { ok: false, error: 'الكود مستخدم مسبقاً' };

  await pool.query('UPDATE codes SET used_by = $1 WHERE code = $2', [user.id, code]);
  await activatePro(user, c.days, 'code', code);
  return { ok: true, plan: c.plan, days: c.days };
}

async function stats() {
  const users = await pool.query('SELECT COUNT(*) FROM users WHERE email IS NOT NULL');
  const totalUsers = parseInt(users.rows[0].count);
  const guests = await pool.query('SELECT COUNT(*) FROM users WHERE id LIKE \'guest:%\'');
  const chats = await pool.query('SELECT COUNT(*) FROM chats');
  const codesTotal = await pool.query('SELECT COUNT(*) FROM codes');
  const codesUsed = await pool.query('SELECT COUNT(*) FROM codes WHERE used_by IS NOT NULL');
  return {
    totalUsers,
    guests: parseInt(guests.rows[0].count),
    totalChats: parseInt(chats.rows[0].count),
    codesGenerated: parseInt(codesTotal.rows[0].count),
    codesUsed: parseInt(codesUsed.rows[0].count)
  };
}

module.exports = {
  findUserByEmail, findUserById, createUser, updateUser, getGuest,
  isPro, activatePro, getUsage, incrementUsage,
  createChat, userChats, findChat, appendMessages, renameChat, deleteChat, deleteAllChats, autoTitle,
  generateCode, redeemCode, stats, now, save: () => {} // save is no-op now
};
