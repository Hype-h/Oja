// ==================== FIREBASE CONFIGURATION ====================
const firebaseConfig = {
  apiKey: "AIzaSyALSSw0-d0F2-Zkj5aXVN1ip7FcMCouy8Q",
  authDomain: "oja-place01.firebaseapp.com",
  projectId: "oja-place01",
  storageBucket: "oja-place01.firebasestorage.app",
  messagingSenderId: "543711721814",
  appId: "1:543711721814:web:6fafe8a7cf1db4b3493ef7"
};

// Global variables
let app, auth, db;
let isInitialized = false;
let isSubmitting = false;

// ==================== FIREBASE INITIALIZATION ====================
function initializeFirebase() {
  try {
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase SDK not loaded. Please check your internet connection.');
    }
    
    // Check if already initialized
    if (firebase.apps.length > 0) {
      app = firebase.app();
      auth = firebase.auth();
      db = firebase.firestore();
      isInitialized = true;
      console.log('✅ Firebase already initialized');
      return true;
    }
    
    // Initialize Firebase
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    
    // Enable persistence
    db.enablePersistence({ synchronizeTabs: true })
      .catch((err) => {
        console.warn('⚠️ Firestore persistence error:', err.code);
      });
    
    isInitialized = true;
    console.log('✅ Firebase initialized successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    showAlert('Failed to initialize app. Please refresh the page.', 'error');
    isInitialized = false;
    return false;
  }
}

// ==================== UTILITY FUNCTIONS ====================
function showAlert(message, type = 'success') {
  const alertTypes = {
    'success': 'successAlert',
    'error': 'errorAlert',
    'info': 'infoAlert'
  };
  
  const id = alertTypes[type] || 'infoAlert';
  const el = document.getElementById(id);
  
  if (el) {
    el.textContent = message;
    el.className = `alert alert-${type} active`;
    
    setTimeout(() => {
      el.classList.remove('active');
    }, 5000);
  }
}

function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(String(email).toLowerCase());
}

function sanitizeInput(input) {
  if (!input) return '';
  return String(input).trim().replace(/[<>'"]/g, '');
}

function setButtonLoading(button, isLoading, originalText) {
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = 'Please wait...';
    button.disabled = true;
    button.classList.add('loading');
  } else {
    button.textContent = originalText || button.dataset.originalText || 'Submit';
    button.disabled = false;
    button.classList.remove('loading');
  }
}

// ==================== FORM TOGGLE FUNCTIONS ====================
function toggleForm(showRegister = false) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  if (!loginForm || !registerForm) return;
  
  if (showRegister) {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  } else {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  }
  
  // Reset forms
  const loginFormElement = document.getElementById('loginFormElement');
  const registerFormElement = document.getElementById('registerFormElement');
  
  if (loginFormElement) loginFormElement.reset();
  if (registerFormElement) registerFormElement.reset();
  
  // Clear validation states
  document.querySelectorAll('input').forEach(input => {
    input.classList.remove('error', 'success');
  });
  
  // Reset password strength
  const strengthContainer = document.getElementById('passwordStrength');
  const strengthText = document.getElementById('passwordStrengthText');
  if (strengthContainer) strengthContainer.style.display = 'none';
  if (strengthText) strengthText.textContent = '';
}

// ==================== PASSWORD RESET ====================
async function handleForgotPassword(e) {
  if (e) e.preventDefault();
  
  if (!isInitialized || !auth) {
    showAlert('App not ready. Please refresh the page.', 'error');
    return;
  }
  
  const emailInput = document.getElementById('vendorEmail');
  if (!emailInput) return;
  
  const email = sanitizeInput(emailInput.value);
  
  if (!email) {
    showAlert('Please enter your email address first', 'error');
    emailInput.focus();
    return;
  }
  
  if (!validateEmail(email)) {
    showAlert('Please enter a valid email address', 'error');
    emailInput.focus();
    return;
  }
  
  try {
    await auth.sendPasswordResetEmail(email);
    showAlert(`Password reset link sent to ${email}. Check your inbox.`, 'success');
  } catch (error) {
    console.error('❌ Password reset error:', error);
    
    let errorMessage = 'Failed to send reset email. Please try again.';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address format.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many requests. Please try again in a few minutes.';
    }
    
    showAlert(errorMessage, 'error');
  }
}

// ==================== VENDOR LOGIN ====================
async function handleVendorLogin(e) {
  e.preventDefault();
  
  // Prevent multiple submissions
  if (isSubmitting) {
    console.log('⚠️ Form already submitting');
    return;
  }
  
  if (!isInitialized || !auth || !db) {
    showAlert('App not ready. Please refresh the page.', 'error');
    return;
  }
  
  const emailInput = document.getElementById('vendorEmail');
  const passwordInput = document.getElementById('vendorPassword');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  if (!emailInput || !passwordInput || !submitBtn) {
    console.error('❌ Form elements not found');
    return;
  }
  
  const email = sanitizeInput(emailInput.value);
  const password = passwordInput.value;
  
  // Validation
  if (!email || !password) {
    showAlert('Please fill in all fields', 'error');
    return;
  }
  
  if (!validateEmail(email)) {
    showAlert('Please enter a valid email address', 'error');
    emailInput.focus();
    return;
  }
  
  if (password.length < 6) {
    showAlert('Password must be at least 6 characters', 'error');
    passwordInput.focus();
    return;
  }
  
  // Set submitting state
  isSubmitting = true;
  setButtonLoading(submitBtn, true);
  
  try {
    console.log('🔐 Attempting login for:', email);
    
    // Sign in with Firebase Auth
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    
    if (!userCredential || !userCredential.user) {
      throw new Error('Authentication failed - no user returned');
    }
    
    const user = userCredential.user;
    console.log('✅ Authentication successful:', user.uid);
    
    // Wait a moment for auth state to propagate
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Fetch user document from Firestore
    const userDocRef = db.collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      console.error('❌ User document not found in Firestore');
      await auth.signOut();
      showAlert('Account data not found. Please contact support.', 'error');
      return;
    }
    
    const userData = userDoc.data();
    console.log('✅ User data retrieved:', { role: userData.role, status: userData.status });
    
    // Validate vendor role
    if (userData.role !== 'vendor') {
      console.error('❌ Invalid role:', userData.role);
      await auth.signOut();
      showAlert('This account is not registered as a vendor. Please use the customer login.', 'error');
      return;
    }
    
    // Check account status
    if (userData.status === 'suspended') {
      await auth.signOut();
      showAlert('Your vendor account has been suspended. Please contact support.', 'error');
      return;
    }
    
    if (userData.status === 'rejected') {
      await auth.signOut();
      showAlert('Your vendor application was rejected. Please contact support for more information.', 'error');
      return;
    }
    
    // Success - Update last login
    await userDocRef.update({
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(err => console.warn('Could not update last login:', err));
    
    console.log('✅ Login successful');
    showAlert('Login successful! Redirecting...', 'success');
    
    // Redirect based on profile completion
    setTimeout(() => {
      if (userData.profileComplete) {
        window.location.href = './vendor-dashboard.html';
      } else {
        window.location.href = './vendor-setup.html';
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Login error:', error);
    
    let errorMessage = 'Login failed. Please check your credentials and try again.';
    
    // Handle specific Firebase Auth errors
    switch (error.code) {
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address format.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled. Please contact support.';
        break;
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email. Please register first.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password. Please try again or reset your password.';
        break;
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials':
        errorMessage = 'Invalid email or password. Please check your credentials.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed login attempts. Please try again later or reset your password.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection and try again.';
        break;
      case 'auth/timeout':
        errorMessage = 'Request timed out. Please check your connection and try again.';
        break;
      default:
        if (error.message) {
          errorMessage = error.message;
        }
    }
    
    showAlert(errorMessage, 'error');
    
  } finally {
    // Reset button state
    isSubmitting = false;
    setButtonLoading(submitBtn, false);
  }
}

// ==================== VENDOR REGISTRATION ====================
async function handleVendorRegister(e) {
  e.preventDefault();
  
  // Prevent multiple submissions
  if (isSubmitting) {
    console.log('⚠️ Form already submitting');
    return;
  }
  
  if (!isInitialized || !auth || !db) {
    showAlert('App not ready. Please refresh the page.', 'error');
    return;
  }
  
  const businessNameInput = document.getElementById('vendorBusiness');
  const emailInput = document.getElementById('vendorRegisterEmail');
  const phoneInput = document.getElementById('vendorPhone');
  const addressInput = document.getElementById('vendorAddress');
  const passwordInput = document.getElementById('vendorRegisterPassword');
  const termsCheckbox = document.getElementById('vendorTerms');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  if (!businessNameInput || !emailInput || !phoneInput || !passwordInput || !termsCheckbox || !submitBtn) {
    console.error('❌ Form elements not found');
    return;
  }
  
  const businessName = sanitizeInput(businessNameInput.value);
  const email = sanitizeInput(emailInput.value);
  const phone = sanitizeInput(phoneInput.value);
  const address = sanitizeInput(addressInput.value);
  const password = passwordInput.value;
  const termsAccepted = termsCheckbox.checked;
  
  // Validation
  if (!businessName || !email || !phone || !password) {
    showAlert('Please fill in all required fields', 'error');
    return;
  }
  
  if (businessName.length < 3) {
    showAlert('Business name must be at least 3 characters', 'error');
    businessNameInput.focus();
    return;
  }
  
  if (!validateEmail(email)) {
    showAlert('Please enter a valid email address', 'error');
    emailInput.focus();
    return;
  }
  
  if (phone.length < 10) {
    showAlert('Please enter a valid phone number', 'error');
    phoneInput.focus();
    return;
  }
  
  if (password.length < 6) {
    showAlert('Password must be at least 6 characters long', 'error');
    passwordInput.focus();
    return;
  }
  
  if (!termsAccepted) {
    showAlert('Please agree to the Terms of Service and Privacy Policy', 'error');
    return;
  }
  
  // Set submitting state
  isSubmitting = true;
  setButtonLoading(submitBtn, true);
  
  try {
    console.log('📝 Starting vendor registration for:', email);
    
    // Check if business name is already taken
    const businessQuery = await db.collection('users')
      .where('businessName', '==', businessName)
      .limit(1)
      .get();
    
    if (!businessQuery.empty) {
      showAlert('Business name already taken. Please choose a different name.', 'error');
      return;
    }
    
    console.log('✅ Business name available');
    
    // Create Firebase Auth account
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    
    if (!userCredential || !userCredential.user) {
      throw new Error('Failed to create user account');
    }
    
    const user = userCredential.user;
    console.log('✅ Auth account created:', user.uid);
    
    // Create vendor profile in Firestore
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      businessName: businessName,
      email: email,
      phone: phone,
      address: address || '',
      role: 'vendor',
      status: 'pending',
      profileComplete: false,
      commissionRate: 10,
      balance: 0,
      totalSales: 0,
      totalOrders: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Vendor profile created in Firestore');
    
    // Create initial vendor stats document
    await db.collection('vendorStats').doc(user.uid).set({
      vendorId: user.uid,
      totalProducts: 0,
      activeProducts: 0,
      pendingOrders: 0,
      completedOrders: 0,
      revenue: 0,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(err => console.warn('Could not create vendor stats:', err));
    
    showAlert('Application submitted successfully! Please sign in to continue.', 'success');
    
    // Sign out the user
    await auth.signOut();
    
    // Switch to login form after delay
    setTimeout(() => {
      toggleForm(false);
      const loginEmailInput = document.getElementById('vendorEmail');
      if (loginEmailInput) {
        loginEmailInput.value = email;
        loginEmailInput.focus();
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    
    let errorMessage = 'Registration failed. Please try again.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email is already registered. Please sign in instead.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address format.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Email/password registration is currently disabled. Please contact support.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection and try again.';
        break;
      default:
        if (error.message) {
          errorMessage = error.message;
        }
    }
    
    showAlert(errorMessage, 'error');
    
    // If user was created but Firestore failed, try to delete the auth account
    if (error.code !== 'auth/email-already-in-use' && auth.currentUser) {
      await auth.currentUser.delete().catch(err => 
        console.error('Failed to clean up auth account:', err)
      );
    }
    
  } finally {
    // Reset button state
    isSubmitting = false;
    setButtonLoading(submitBtn, false);
  }
}

// ==================== PASSWORD STRENGTH CHECKER ====================
function checkPasswordStrength(password) {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  return Math.min(strength, 4);
}

function updatePasswordStrength(password) {
  const strengthBar = document.getElementById('passwordStrengthBar');
  const strengthText = document.getElementById('passwordStrengthText');
  const strengthContainer = document.getElementById('passwordStrength');
  
  if (!strengthBar || !strengthText || !strengthContainer) return;
  
  if (!password) {
    strengthContainer.style.display = 'none';
    strengthText.textContent = '';
    return;
  }
  
  strengthContainer.style.display = 'block';
  
  const strength = checkPasswordStrength(password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
  const strengthWidths = ['20%', '40%', '60%', '80%', '100%'];
  
  strengthBar.style.width = strengthWidths[strength];
  strengthBar.style.backgroundColor = strengthColors[strength];
  strengthText.textContent = strengthLabels[strength];
  strengthText.style.color = strengthColors[strength];
}

// ==================== INPUT VALIDATION ====================
function setupInputValidation() {
  // Email validation on blur
  document.querySelectorAll('input[type="email"]').forEach(input => {
    input.addEventListener('blur', function() {
      if (this.value && !validateEmail(this.value)) {
        this.classList.add('error');
        this.classList.remove('success');
      } else if (this.value) {
        this.classList.remove('error');
        this.classList.add('success');
      } else {
        this.classList.remove('error', 'success');
      }
    });
    
    input.addEventListener('focus', function() {
      this.classList.remove('error');
    });
  });
  
  // Password strength indicator
  const registerPassword = document.getElementById('vendorRegisterPassword');
  if (registerPassword) {
    registerPassword.addEventListener('input', function() {
      updatePasswordStrength(this.value);
    });
  }
  
  // Phone number formatting
  const phoneInput = document.getElementById('vendorPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      
      if (value.length > 0) {
        if (value.startsWith('0')) {
          value = '234' + value.substring(1);
        } else if (!value.startsWith('234')) {
          value = '234' + value;
        }
        e.target.value = '+' + value;
      } else {
        e.target.value = '';
      }
    });
  }
  
  // Business name validation
  const businessNameInput = document.getElementById('vendorBusiness');
  if (businessNameInput) {
    businessNameInput.addEventListener('input', function() {
      // Allow letters, numbers, spaces, hyphens, apostrophes, and ampersands
      this.value = this.value.replace(/[^a-zA-Z0-9\s\-'&]/g, '');
    });
  }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Login form submission
  const loginFormElement = document.getElementById('loginFormElement');
  if (loginFormElement) {
    loginFormElement.addEventListener('submit', handleVendorLogin);
  }
  
  // Register form submission
  const registerFormElement = document.getElementById('registerFormElement');
  if (registerFormElement) {
    registerFormElement.addEventListener('submit', handleVendorRegister);
  }
  
  // Form toggle links
  const showRegisterLink = document.getElementById('showRegisterLink');
  if (showRegisterLink) {
    showRegisterLink.addEventListener('click', (e) => {
      e.preventDefault();
      toggleForm(true);
    });
  }
  
  const showLoginLink = document.getElementById('showLoginLink');
  if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      toggleForm(false);
    });
  }
  
  // Forgot password link
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', handleForgotPassword);
  }
  
  // Terms and privacy links
  const showTermsLink = document.getElementById('showTermsLink');
  if (showTermsLink) {
    showTermsLink.addEventListener('click', (e) => {
      e.preventDefault();
      showAlert('Terms of Service document will be displayed here', 'info');
    });
  }
  
  const showPrivacyLink = document.getElementById('showPrivacyLink');
  if (showPrivacyLink) {
    showPrivacyLink.addEventListener('click', (e) => {
      e.preventDefault();
      showAlert('Privacy Policy document will be displayed here', 'info');
    });
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // ESC to close alerts
    if (e.key === 'Escape') {
      document.querySelectorAll('.alert.active').forEach(alert => {
        alert.classList.remove('active');
      });
    }
  });
  
  // Network status
  window.addEventListener('offline', () => {
    showAlert('No internet connection. Please check your network.', 'error');
  });
  
  window.addEventListener('online', () => {
    showAlert('Connection restored', 'success');
  });
  
  // Setup input validation
  setupInputValidation();
}

// ==================== AUTH STATE OBSERVER ====================
function setupAuthObserver() {
  if (!auth) return;
  
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('👤 Auth state: User logged in -', user.uid);
    } else {
      console.log('👤 Auth state: No user logged in');
    }
  });
}

// ==================== INITIALIZATION ====================
function initializePage() {
  console.log('🚀 Initializing Vendor Auth Page...');
  
  // Initialize Firebase
  if (!initializeFirebase()) {
    console.error('❌ Failed to initialize Firebase');
    return;
  }
  
  // Setup event listeners
  setupEventListeners();
  
  // Setup auth state observer
  setupAuthObserver();
  
  console.log('✅ Vendor Auth Page Ready');
}

// ==================== PAGE LOAD ====================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}

// ==================== ERROR HANDLING ====================
window.addEventListener('error', function(e) {
  console.error('💥 Global error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('💥 Unhandled promise rejection:', e.reason);
});

console.log('📄 Vendor auth script loaded');