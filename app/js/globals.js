// js/globals.js
// ============================================
// GLOBAL STATE & SHARED UTILITIES
// ============================================

// Firebase references (from firebase-config.js)
const auth = window.auth;
const db = window.db;

// ---------- GLOBAL STATE ----------
window.state = {
  currentUser: null,
  userRole: null,
  cart: [],
  currentSlideIndex: 0,
};

// ============================================
// PAGE NAVIGATION
// ============================================
window.showPage = function (page) {
  document.querySelectorAll("[data-page]").forEach(el => {
    el.classList.remove("active");
  });

  const pageEl = document.querySelector(`[data-page="${page}"]`);
  if (!pageEl) {
    console.warn(`Page not found: ${page}`);
    return;
  }

  pageEl.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (page === "vendorDashboard" && typeof loadVendorDashboard === "function") {
    loadVendorDashboard();
  }

  if (page === "adminDashboard" && typeof loadAdminDashboard === "function") {
    loadAdminDashboard();
  }
};

// ============================================
// ALERTS
// ============================================
window.showAlert = function (message, type = "success") {
  const alertId = type === "success" ? "successAlert" : "errorAlert";
  const el = document.getElementById(alertId);
  if (!el) return;

  el.textContent = message;
  el.classList.remove("hidden");
  el.classList.add("active");

  setTimeout(() => {
    el.classList.remove("active");
    el.classList.add("hidden");
  }, 3000);
};

// ============================================
// CART UI
// ============================================
window.toggleCart = function () {
  document.getElementById("cartSidebar")?.classList.toggle("active");
};

// ============================================
// SLIDER
// ============================================
window.nextSlide = () => showSlide(state.currentSlideIndex + 1);
window.prevSlide = () => showSlide(state.currentSlideIndex - 1);
window.currentSlide = n => showSlide(n);

function showSlide(n) {
  const slides = document.querySelectorAll(".slider-image");
  const dots = document.querySelectorAll(".dot");

  if (!slides.length) return;

  if (n >= slides.length) n = 0;
  if (n < 0) n = slides.length - 1;

  state.currentSlideIndex = n;

  slides.forEach(s => s.classList.remove("active"));
  dots.forEach(d => d.classList.remove("active"));

  slides[n].classList.add("active");
  dots[n]?.classList.add("active");
}

// ============================================
// AUTH HANDLERS
// ============================================
window.handleLogin = async function (e) {
  e.preventDefault();

  const email = loginEmail.value;
  const password = loginPassword.value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    showAlert("Login successful");
    showPage("home");
  } catch (err) {
    showAlert(err.message, "error");
  }
};

window.logout = async function () {
  await auth.signOut();
  state.currentUser = null;
  state.userRole = null;
  state.cart = [];
  showAlert("Logged out");
  showPage("home");
};

// ============================================
// AUTH STATE
// ============================================
auth.onAuthStateChanged(async user => {
  state.currentUser = user;

  if (user) {
    const snap = await db.collection("users").doc(user.uid).get();
    state.userRole = snap.exists ? snap.data().role : "customer";
  } else {
    state.userRole = null;
  }

  updateNavigation();
});

// ---------- UI HELPERS ----------
window.showAlert = (msg, type = "success") => {
  const el = document.getElementById(type === "success" ? "successAlert" : "errorAlert");
  if (!el) return;

  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 3000);
};

window.showPage = (page) => {
  document.querySelectorAll("[data-page]").forEach(p => p.classList.remove("active"));
  document.querySelector(`[data-page="${page}"]`)?.classList.add("active");
};

// ============================================
// NAVIGATION
// ============================================
function updateNavigation() {
  const nav = document.getElementById("navRight");
  if (!nav) return;

  if (state.currentUser) {
    nav.innerHTML = `
      <button onclick="toggleCart()">🛒</button>
      <button onclick="logout()">Logout</button>
    `;
  } else {
    nav.innerHTML = `<button onclick="showPage('login')">Login</button>`;
  }
}

window.toggleUserMenu = function () {
  document.getElementById("userMenu")?.classList.toggle("hidden");
};
