<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#17152b">
<title>COSA AI — Your Intelligent World</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%237657ff'/><text x='50' y='66' font-size='46' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'>C</text></svg>">
</head>
<body>
<div class="app" id="appView">

  <!-- HEADER -->
  <header class="header">
    <div class="header-inner">
      <div class="brand" id="brandHome">
        <div class="logo">C</div>
        <div>
          <div class="brand-name">COSA AI</div>
          <div class="status"><span class="dot" id="statusDot"></span> <span id="statusText">جارِ الاتصال…</span></div>
        </div>
      </div>
      <div class="header-actions">
        <button class="icon-btn" id="voiceModeBtn" title="وضع COSA Voice" aria-label="الوضع الصوتي">🎙️</button>
        <button class="icon-btn" id="historyBtn" title="سجل المحادثات" aria-label="السجل">🕘</button>
        <button class="icon-btn" id="themeBtn" title="الوضع الليلي" aria-label="الوضع الليلي">☾</button>
        <button class="icon-btn" id="settingsBtn" title="الإعدادات" aria-label="الإعدادات">⚙️</button>
        <button class="pro-btn" id="openPro">⭐ Pro</button>
      </div>
    </div>
  </header>

  <!-- COUNTER -->
  <div class="counter" id="counterBox">
    <div class="counter-top">
      <span id="counterLabel">رسائل اليوم</span>
      <strong id="counterText">— / —</strong>
    </div>
    <div class="progress"><div class="progress-bar" id="progressBar"></div></div>
  </div>

  <main>
    <!-- WELCOME -->
    <section class="welcome" id="welcome">
      <div class="big-logo">C</div>
      <h1 id="welcomeTitle">مرحباً بك في <span class="gradient-text">COSA AI</span></h1>
      <p>ذكاء اصطناعي يساعدك على التفكير، التعلم والإنجاز.</p>
      <div class="suggestions" id="suggestions"></div>
    </section>

    <!-- CHAT -->
    <section class="chat" id="chat"></section>
  </main>

  <!-- FILE CHIP -->
  <div class="file-chip hidden" id="fileChip">
    <span id="fileChipName">📎 ملف</span>
    <button id="fileChipRemove" title="إزالة">✕</button>
  </div>

  <!-- INPUT -->
  <div class="input-wrap">
    <div class="input-box">
      <button class="attach" id="attachBtn" title="رفع صورة أو ملف">📎</button>
      <button class="mic" id="micBtn" title="تحدث بالميكروفون">🎤</button>
      <textarea id="messageInput" rows="1" placeholder="اكتب رسالتك إلى COSA AI..."></textarea>
      <button class="send" id="sendBtn" title="إرسال">➤</button>
      <input type="file" id="fileInput" hidden>
    </div>
  </div>
</div>

<!-- ADMIN VIEW -->
<div class="admin-wrap hidden" id="adminView">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
    <h2 style="font-size:18px">🛠️ لوحة إدارة COSA AI</h2>
    <button class="close" id="adminBack">→</button>
  </div>
  <div class="admin-grid" id="adminStats"></div>
  <div class="admin-sec">
    <h4 style="font-size:13px;margin-bottom:9px">🔑 إصدار أكواد تفعيل</h4>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <select id="adminCodePlan" style="flex:1;min-width:110px;height:42px;border-radius:12px;border:1px solid var(--border);background:var(--card);color:var(--text);padding:0 10px">
        <option value="monthly">شهري (30 يوم)</option>
        <option value="yearly">سنوي (365 يوم)</option>
        <option value="vip">VIP (10 سنوات)</option>
      </select>
      <input id="adminCodeCount" type="number" value="5" min="1" max="100" style="width:70px;height:42px;border-radius:12px;border:1px solid var(--border);background:var(--card);color:var(--text);text-align:center">
      <button class="btn btn-primary" id="adminGenCodes" style="width:auto;padding:0 18px">إصدار</button>
    </div>
    <div class="code-list" id="adminCodeList"><div style="color:var(--muted)">اضغط "إصدار" لتوليد أكواد…</div></div>
  </div>
</div>

<!-- HISTORY DRAWER -->
<div class="overlay" id="drawerOverlay"></div>
<aside class="drawer" id="historyDrawer">
  <div class="drawer-head">
    <span>🕘 المحادثات</span>
    <div style="display:flex;gap:6px">
      <button class="icon-btn" id="newChatBtn" title="محادثة جديدة" style="width:32px;height:32px;font-size:15px">＋</button>
      <button class="icon-btn" id="closeDrawer" style="width:32px;height:32px;font-size:15px">✕</button>
    </div>
  </div>
  <input class="drawer-search" id="chatSearch" placeholder="🔍 بحث في المحادثات…">
  <div class="chat-list" id="chatList"></div>
</aside>

<!-- AUTH MODAL -->
<div class="modal" id="authModal">
  <div class="modal-card">
    <div class="modal-head">
      <div class="modal-title"><div class="pro-icon" style="font-size:18px">👤</div> <span id="authTitle">تسجيل الدخول</span></div>
      <button class="close" data-close="authModal">×</button>
    </div>
    <div class="field hidden" id="authNameField"><label>الاسم</label><input id="authName" type="text" placeholder="اسمك الكامل"></div>
    <div class="field"><label>البريد الإلكتروني</label><input id="authEmail" type="email" placeholder="you@example.com" dir="ltr" style="text-align:left"></div>
    <div class="field"><label>كلمة المرور</label><input id="authPassword" type="password" placeholder="••••••••" dir="ltr" style="text-align:left"></div>
    <button class="btn btn-primary" id="authSubmit">دخول</button>
    <div class="auth-switch" id="authSwitch">ليس لديك حساب؟ <b>أنشئ حساباً</b></div>
  </div>
</div>

<!-- PRO MODAL -->
<div class="modal" id="proModal">
  <div class="modal-card">
    <div class="modal-head">
      <div class="modal-title"><div class="pro-icon">⭐</div><div>COSA AI Pro<div style="font-size:10px;color:var(--muted);font-weight:500">افتح الإمكانيات الكاملة</div></div></div>
      <button class="close" data-close="proModal">×</button>
    </div>
    <div class="sub-status hidden" id="subStatus"></div>
    <div class="features">
      <div class="feature"><div class="check">✓</div><span>حد يومي مرتفع (1000 رسالة)</span></div>
      <div class="feature"><div class="check">✓</div><span>نماذج متقدمة وردود أطول</span></div>
      <div class="feature"><div class="check">✓</div><span>رفع وتحليل الصور والملفات (PDF / Word / نصوص)</span></div>
      <div class="feature"><div class="check">✓</div><span>النظام الصوتي الكامل + وضع COSA Voice</span></div>
      <div class="feature"><div class="check">✓</div><span>مزامنة المحادثات بين أجهزتك</span></div>
    </div>
    <table class="compare">
      <tr><th></th><th>FREE</th><th>PRO</th></tr>
      <tr><td>الرسائل اليومية</td><td id="cmpFreeLimit">35</td><td>1000</td></tr>
      <tr><td>تحليل الصور</td><td>✕</td><td>✓</td></tr>
      <tr><td>تحليل الملفات</td><td>✕</td><td>✓</td></tr>
      <tr><td>النماذج المتقدمة</td><td>✕</td><td>✓</td></tr>
      <tr><td>المزامنة</td><td>✕</td><td>✓</td></tr>
    </table>
    <div class="plans">
      <button class="plan selected" data-plan="monthly">
        <h3>شهري</h3>
        <div class="price"><span id="priceMonthly">30</span> <small>درهم</small></div>
        <span style="font-size:9px;color:var(--muted)">كل شهر</span>
      </button>
      <button class="plan" data-plan="yearly">
        <div class="plan-badge">الأكثر توفيراً</div>
        <h3>سنوي</h3>
        <div class="price"><span id="priceYearly">250</span> <small>درهم</small></div>
        <span style="font-size:9px;color:var(--muted)">كل سنة</span>
      </button>
    </div>
    <div class="field" style="margin-top:6px">
      <label>🔑 لديك كود تفعيل؟</label>
      <input id="activationCode" type="text" placeholder="COSA-XXXX-XXXXXXXXXXXX" dir="ltr" style="text-align:center;font-family:monospace;text-transform:uppercase">
    </div>
    <button class="btn btn-primary" id="activateBtn">تفعيل الكود</button>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px">
      <button class="btn btn-whatsapp" id="waContact">💬 تواصل مع المطور</button>
      <button class="btn btn-primary" id="waPay">💳 دفع الاشتراك</button>
    </div>
  </div>
</div>

<!-- SETTINGS MODAL -->
<div class="modal" id="settingsModal">
  <div class="modal-card">
    <div class="modal-head">
      <div class="modal-title"><div class="pro-icon" style="font-size:18px">⚙️</div> الإعدادات</div>
      <button class="close" data-close="settingsModal">×</button>
    </div>

    <div class="set-group">
      <h4>👤 الحساب</h4>
      <div id="accountSection"></div>
    </div>

    <div class="set-group">
      <h4>🎨 المظهر</h4>
      <div class="set-row"><span>الوضع الداكن</span><label class="switch"><input type="checkbox" id="setDark"><span class="slider-t"></span></label></div>
      <div class="set-row"><span>حجم الخط</span><input type="range" id="setFontSize" min="11" max="17" step="1" value="13" style="width:130px"></div>
    </div>

    <div class="set-group">
      <h4>🔊 الصوت</h4>
      <div class="set-row"><span>سرعة القراءة</span><input type="range" id="setTtsRate" min="0.5" max="2" step="0.1" value="1" style="width:130px"></div>
      <div class="set-row"><span>لغة التعرف على الكلام</span>
        <select id="setSttLang" style="border:1px solid var(--border);border-radius:9px;background:var(--card);color:var(--text);padding:5px 9px">
          <option value="ar">العربية</option>
          <option value="fr">الفرنسية</option>
          <option value="en">الإنجليزية</option>
          <option value="">تلقائي</option>
        </select>
      </div>
    </div>

    <div class="set-group">
      <h4>🗂️ البيانات</h4>
      <div class="set-row"><span>حذف جميع المحادثات</span><button class="btn btn-danger" id="deleteAllChats" style="width:auto;padding:0 14px;height:36px">حذف</button></div>
      <div class="set-row hidden" id="deleteAccountRow"><span>حذف الحساب نهائياً</span><button class="btn btn-danger" id="deleteAccount" style="width:auto;padding:0 14px;height:36px">حذف</button></div>
    </div>
  </div>
</div>

<!-- VOICE MODE -->
<div class="voice-overlay" id="voiceOverlay">
  <div class="voice-orb" id="voiceOrb">🎙️</div>
  <div class="voice-status" id="voiceStatus">اضغط للتحدث</div>
  <div class="voice-text" id="voiceText"></div>
  <button class="voice-close" id="voiceClose">إنهاء الجلسة الصوتية</button>
</div>

<!-- CONTEXT MENU -->
<div class="ctx-menu" id="ctxMenu"></div>
<div class="toast" id="toast"></div>

<script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js"></script>
<script src="/app.js"></script>
</body>
</html>
