// ============================================================
//  api.js  —  صيانةبلس
//  مدير الجلسة + جميع طلبات API
//  المفاتيح: sb_token · sb_user · sb_guest  (localStorage فقط)
// ============================================================

// ملاحظة: تأكد من اسم المجلد، هل هو sianaaplus أم siyanaplus؟
var API_BASE = 'http://localhost/sianaaplus/backend/api';

/* ── SESSION ──────────────────────────────────── */
function getToken() {
  return localStorage.getItem('sb_token') || '';
}
function getUser() {
  try { return JSON.parse(localStorage.getItem('sb_user') || 'null'); }
  catch(e) { return null; }
}
function isLoggedIn() {
  return !!(getToken() && getUser());
}
function isGuest() {
  return localStorage.getItem('sb_guest') === '1';
}
function getDisplayName() {
  var u = getUser();
  if (!u) return isGuest() ? 'زائر' : '';
  return ((u.first_name || '') + ' ' + (u.last_name || '')).trim();
}
function _saveSession(token, user) {
  localStorage.setItem('sb_token', token);
  localStorage.setItem('sb_user',  JSON.stringify(user));
  localStorage.removeItem('sb_guest');
}
function _saveGuest() {
  localStorage.removeItem('sb_token');
  localStorage.removeItem('sb_user');
  localStorage.setItem('sb_guest', '1');
}
function clearSession() {
  localStorage.removeItem('sb_token');
  localStorage.removeItem('sb_user');
  localStorage.removeItem('sb_guest');
}
// Demo fallback when XAMPP is off
function _demoLogin(email, first, last) {
  _saveSession('demo-' + Date.now(), {
    id: 999, first_name: first || 'مستخدم', last_name: last || 'تجريبي',
    email: email || 'demo@test.com', role: 'client'
  });
}

/* ── HTTP ─────────────────────────────────────── */
async function _req(endpoint, method, body) {
  method = method || 'GET';
  var headers = {'Content-Type': 'application/json'};
  var token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  
  var opts = {method: method, headers: headers};
  if (body && method !== 'GET') opts.body = JSON.stringify(body);
  
  try {
    var r = await fetch(API_BASE + '/' + endpoint, opts);
    
    // [إصلاح حرج]: التأكد من أن السيرفر أعاد JSON لتفادي انهيار السكريبت بسبب أخطاء الـ PHP
    var contentType = r.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return await r.json();
    } else {
        console.error('تنبيه: السيرفر لم يرسل استجابة JSON (قد يكون هناك خطأ في كود PHP)');
        return {success: false, message: 'حدث خطأ غير متوقع في الخادم.'};
    }
  } catch(e) {
    return {success: false, message: 'تعذّر الاتصال بالخادم — تأكد من تشغيل XAMPP'};
  }
}

/* ── AUTH ─────────────────────────────────────── */
async function apiLogin(identifier, password) {
  var res = await _req('auth.php?action=login', 'POST',
    {email: identifier, password: password});
  if (res.success && res.data) _saveSession(res.data.token, res.data.user);
  return res;
}
async function apiRegister(data) {
  var res = await _req('auth.php?action=register', 'POST', data);
  if (res.success && res.data) _saveSession(res.data.token, res.data.user);
  return res;
}
async function apiSocialLogin(email, firstName, lastName, via) {
  var res = await _req('auth.php?action=social', 'POST',
    {email: email, first_name: firstName, last_name: lastName || '', via: via});
  if (res.success && res.data) _saveSession(res.data.token, res.data.user);
  else _saveSession('demo-social-' + Date.now(),
    {id: 0, first_name: firstName || 'مستخدم', last_name: lastName || '',
     email: email, role: 'client', via: via});
  return res;
}
function apiLoginAsGuest() { _saveGuest(); }
function apiLogout() { clearSession(); window.location.href = 'auth.html'; }

/* ── TECHNICIANS ──────────────────────────────── */
async function apiGetTechnicians(service, available) {
  var q = 'technicians.php?action=list';
  if (service)   q += '&service=' + encodeURIComponent(service);
  if (available) q += '&available=1';
  return await _req(q);
}
async function apiGetTechReviews(id) {
  return await _req('technicians.php?action=reviews&id=' + id);
}

/* ── BOOKINGS ─────────────────────────────────── */
async function apiCreateBooking(data) {
  if (!isLoggedIn())
    return {success: false, message: 'يجب تسجيل الدخول أولاً', needLogin: true};
  return await _req('bookings.php?action=create', 'POST', data);
}
async function apiGetMyBookings() {
  if (!isLoggedIn()) return {success: false, data: []};
  return await _req('bookings.php?action=my');
}
async function apiUpdateBookingStatus(id, status) {
  return await _req('bookings.php?action=update_status&id=' + id, 'PUT', {status: status});
}
async function apiSubmitReview(id, rating, comment) {
  return await _req('bookings.php?action=review&id=' + id, 'POST',
    {rating: rating, comment: comment});
}

/* ── MESSAGES ─────────────────────────────────── */
async function apiSendMessage(bookingId, message) {
  if (!isLoggedIn()) return {success: false, message: 'يجب تسجيل الدخول'};
  return await _req('messages.php?action=send', 'POST',
    {booking_id: bookingId, message: message});
}
async function apiGetMessages(bookingId) {
  return await _req('messages.php?action=list&booking_id=' + bookingId);
}

/* ── USERS ────────────────────────────────────── */
async function apiGetProfile()     { return await _req('users.php?action=profile'); }
async function apiUpdateProfile(d) { return await _req('users.php?action=update', 'PUT', d); }
async function apiChangePassword(c, n) {
  return await _req('users.php?action=change_password', 'PUT',
    {current_password: c, new_password: n});
}

/* ── NAVBAR ────────────────────────────────────
   استدعِها في كل صفحة بعد تحميل api.js
─────────────────────────────────────────────── */
function initNavUser() {
  var lbtn  = document.getElementById('login-nav-btn');
  var badge = document.getElementById('user-badge');
  if (!lbtn) return;
  if (isLoggedIn()) {
    var name = getDisplayName();
    if (badge) {
      badge.textContent = name ? '👋 ' + name.split(' ')[0] : '✅ مرحباً';
      badge.style.display = 'inline-flex';
      badge.style.cssText = 'display:inline-flex;align-items:center;font-size:.76rem;' +
        'color:#c9a84c;font-weight:700;padding:.28rem .75rem;' +
        'background:rgba(201,168,76,.1);border-radius:6px;border:1px solid rgba(201,168,76,.2);';
    }
    lbtn.textContent = '🚪 خروج';
    lbtn.href = '#';
    lbtn.onclick = function(e) {
      e.preventDefault();
      clearSession();
      window.location.href = 'auth.html';
    };
  } else if (isGuest()) {
    if (badge) {
      badge.textContent = '👤 زائر';
      badge.style.cssText = 'display:inline-flex;align-items:center;font-size:.76rem;' +
        'color:#7a7060;padding:.28rem .75rem;background:rgba(255,255,255,.04);' +
        'border-radius:6px;border:1px solid rgba(255,255,255,.08);';
    }
  }
}

/* ── TOAST ─────────────────────────────────────── */
function showToast(msg, type) {
  type = type || 'ok';
  var t = document.getElementById('toast');
  
  // إنشاء العنصر إذا لم يكن موجوداً
  if (!t) { 
      t = document.createElement('div'); 
      t.id = 'toast'; 
      document.body.appendChild(t); 
  }
  
  t.textContent = msg;
  
  // [إصلاح التناسق]: استخدام الكلاسات من shared.css لضمان توحيد التصميم وتخفيف الكود
  t.className = 'toast show ' + type;
  
  clearTimeout(t._t);
  t._t = setTimeout(function() { 
      t.classList.remove('show'); 
  }, 3200);
}