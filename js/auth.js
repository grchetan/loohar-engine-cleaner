/**
 * Lohar Auto Garage — Firebase Auth + JWT Integration
 */

// Firebase config (populated from server or window.__FIREBASE_CONFIG__)
const getFirebaseConfig = () => window.__FIREBASE_CONFIG__ || {
  apiKey: "",
  authDomain: "",
  projectId: "",
  messagingSenderId: "",
  appId: "",
};

let firebaseAuth = null;
let GoogleAuthProvider = null;

// Lazy-load Firebase SDK
const loadFirebase = async () => {
  if (firebaseAuth) return firebaseAuth;
  if (!getFirebaseConfig().apiKey) return null;

  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
  const { getAuth, GoogleAuthProvider: GAP, signInWithPopup, signOut, sendPasswordResetEmail, createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');

  const app = initializeApp(getFirebaseConfig());
  firebaseAuth = getAuth(app);
  GoogleAuthProvider = GAP;
  window._fbSignInWithPopup = signInWithPopup;
  window._fbSignOut = signOut;
  window._fbSendPasswordResetEmail = sendPasswordResetEmail;
  window._fbCreateUser = createUserWithEmailAndPassword;
  window._fbSignIn = signInWithEmailAndPassword;
  return firebaseAuth;
};

// Google Sign-In
window.signInWithGoogle = async () => {
  try {
    const auth = await loadFirebase();
    if (!auth) { toast.warning('Google login not configured. Please use email login.'); return; }
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    const result = await window._fbSignInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    const res = await AuthAPI.firebase(idToken);
    window.saveToken(res.token);
    window.saveUser(res.user);
    await CartAPI.merge(getSessionId(), res.user._id).catch(() => {});
    toast.success(`Welcome, ${res.user.name}! 🎉`);
    return res;
  } catch (err) {
    toast.error(err.message || 'Google sign-in failed');
    throw err;
  }
};

// Email Registration
window.registerUser = async (name, email, password, phone) => {
  try {
    const res = await AuthAPI.register({ name, email, password, phone });
    window.saveToken(res.token);
    window.saveUser(res.user);
    toast.success(`Welcome to Lohar Auto Garage, ${name}! 🎉`);
    return res;
  } catch (err) {
    toast.error(err.message || 'Registration failed');
    throw err;
  }
};

// Email Login
window.loginUser = async (email, password) => {
  try {
    const res = await AuthAPI.login({ email, password });
    window.saveToken(res.token);
    window.saveUser(res.user);
    await CartAPI.merge(getSessionId(), res.user._id).catch(() => {});
    toast.success(`Welcome back, ${res.user.name}!`);
    return res;
  } catch (err) {
    toast.error(err.message || 'Login failed');
    throw err;
  }
};

// Logout
window.logoutUser = async () => {
  try {
    await AuthAPI.logout().catch(() => {});
    const auth = firebaseAuth;
    if (auth && window._fbSignOut) await window._fbSignOut(auth).catch(() => {});
    window.clearToken();
    window.clearUser();
    toast.info('Logged out successfully');
    setTimeout(() => window.location.href = '/', 1000);
  } catch (err) {
    toast.error('Logout failed');
  }
};

// Update navbar based on auth state
window.updateAuthNav = () => {
  const user = window.getUser ? getUser() : null;
  const isAuth = window.isLoggedIn ? isLoggedIn() : false;

  // Find or create auth nav element
  let authEl = document.getElementById('navAuthEl');
  if (!authEl) {
    authEl = document.createElement('div');
    authEl.id = 'navAuthEl';
    authEl.style.cssText = 'display:flex;align-items:center;gap:8px;flex-shrink:0;';
    const navCta = document.querySelector('.nav-cta');
    if (navCta) navCta.parentNode.insertBefore(authEl, navCta);
  }

  if (isAuth && user) {
    const initial = user.name ? user.name[0].toUpperCase() : 'U';
    authEl.innerHTML = `
      <div style="position:relative">
        <button onclick="toggleUserMenu()" style="width:38px;height:38px;border-radius:50%;background:#f5c518;border:none;color:#000;font-weight:800;font-size:1rem;cursor:pointer">${initial}</button>
        <div id="userDropdown" style="display:none;position:absolute;top:48px;right:0;background:var(--black-2);border:1px solid var(--glass-border);border-radius:12px;min-width:180px;z-index:9999;overflow:hidden;box-shadow:var(--shadow);">
          <div style="padding:12px 16px;border-bottom:1px solid var(--glass-border);font-size:0.85rem;color:var(--white);opacity:0.6">${user.name}</div>
          <a href="/pages/profile.html" style="display:block;padding:10px 16px;font-size:0.88rem;color:var(--white);text-decoration:none" onmouseover="this.style.background='rgba(0,0,0,0.03)'" onmouseout="this.style.background='none'">👤 Profile</a>
          <a href="/pages/orders.html" style="display:block;padding:10px 16px;font-size:0.88rem;color:var(--white);text-decoration:none" onmouseover="this.style.background='rgba(0,0,0,0.03)'" onmouseout="this.style.background='none'">📦 My Orders</a>
          <a href="/pages/wishlist.html" style="display:block;padding:10px 16px;font-size:0.88rem;color:var(--white);text-decoration:none" onmouseover="this.style.background='rgba(0,0,0,0.03)'" onmouseout="this.style.background='none'">❤️ Wishlist</a>
          ${user.role === 'admin' ? `<a href="/pages/admin/" style="display:block;padding:10px 16px;font-size:0.88rem;color:var(--yellow);text-decoration:none" onmouseover="this.style.background='rgba(0,0,0,0.03)'" onmouseout="this.style.background='none'">⚙ Admin Panel</a>` : ''}
          <button onclick="logoutUser()" style="width:100%;padding:10px 16px;text-align:left;background:none;border:none;border-top:1px solid var(--glass-border);color:#ef4444;font-size:0.88rem;cursor:pointer" onmouseover="this.style.background='rgba(0,0,0,0.03)'" onmouseout="this.style.background='none'">🚪 Logout</button>
        </div>
      </div>
    `;
  } else {
    authEl.innerHTML = `<a href="/pages/auth.html" class="nav-login-btn">Login</a>`;
  }
};

window.toggleUserMenu = () => {
  const d = document.getElementById('userDropdown');
  if (d) d.style.display = d.style.display === 'none' ? 'block' : 'none';
};
document.addEventListener('click', (e) => {
  if (!e.target.closest('#navAuthEl')) {
    const d = document.getElementById('userDropdown');
    if (d) d.style.display = 'none';
  }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => { if (window.updateAuthNav) updateAuthNav(); });
