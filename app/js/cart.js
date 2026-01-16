// cart.js - Shopping cart page logic

// Initialize Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions();

// State management
const state = {
  currentUser: null,
  cart: [],
  isProcessing: false,
  products: {}
};

// Load cart from localStorage
function loadCartFromStorage() {
  try {
    const savedCart = localStorage.getItem('cart');
    state.cart = savedCart ? JSON.parse(savedCart) : [];
    updateCartCount();
  } catch (error) {
    console.error('Error loading cart:', error);
    state.cart = [];
  }
}

// Save cart to localStorage
function saveCartToStorage() {
  try {
    localStorage.setItem('cart', JSON.stringify(state.cart));
    updateCartCount();
  } catch (error) {
    console.error('Error saving cart:', error);
  }
}

// Update cart count badge
function updateCartCount() {
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountEl = document.getElementById('cart-count');
  const cartItemCountEl = document.getElementById('cart-item-count');
  
  if (cartCountEl) {
    cartCountEl.textContent = totalItems;
  }
  if (cartItemCountEl) {
    cartItemCountEl.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
  }
}

// Format currency
function formatCurrency(amount) {
  return '₦' + amount.toLocaleString('en-NG', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });
}

// Show alert/notification
function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; margin-left: 15px;">&times;</button>
  `;
  alertDiv.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    font-weight: 500;
    z-index: 1000;
    display: flex;
    align-items: center;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => alertDiv.remove(), 300);
  }, 4000);
}

// Calculate totals
function calculateTotals() {
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 50000 ? 0 : 5000; // Free shipping over ₦50,000
  const tax = subtotal * 0.075; // 7.5% VAT
  const total = subtotal + shipping + tax;
  
  return { subtotal, shipping, tax, total };
}

// Group items by vendor
function groupByVendor() {
  const groups = {};
  
  state.cart.forEach(item => {
    const vendorId = item.vendorId || 'default';
    const vendorName = item.vendorName || 'Oja Marketplace';
    
    if (!groups[vendorId]) {
      groups[vendorId] = {
        vendorId,
        vendorName,
        items: []
      };
    }
    
    groups[vendorId].items.push(item);
  });
  
  return Object.values(groups);
}

// Render cart items
function renderCart() {
  const cartItemsEl = document.getElementById('cart-items');
  const emptyCartEl = document.getElementById('empty-cart');
  const cartSummaryEl = document.getElementById('cart-summary');
  
  if (state.cart.length === 0) {
    cartItemsEl.innerHTML = '';
    emptyCartEl.style.display = 'block';
    cartSummaryEl.style.display = 'none';
    return;
  }
  
  emptyCartEl.style.display = 'none';
  cartSummaryEl.style.display = 'block';
  
  // Render cart items
  cartItemsEl.innerHTML = state.cart.map((item, index) => `
    <div class="cart-item" data-index="${index}">
      <div class="item-image">
        <img src="${item.image || 'public/placeholder.jpg'}" alt="${item.name}">
      </div>
      <div class="item-details">
        <h3>${item.name}</h3>
        <p class="item-vendor">${item.vendorName || 'Oja Marketplace'}</p>
        <p class="item-price">${formatCurrency(item.price)}</p>
      </div>
      <div class="item-quantity">
        <button onclick="updateQuantity(${index}, -1)" class="qty-btn">-</button>
        <input type="number" value="${item.quantity}" min="1" readonly>
        <button onclick="updateQuantity(${index}, 1)" class="qty-btn">+</button>
      </div>
      <div class="item-total">
        <p>${formatCurrency(item.price * item.quantity)}</p>
      </div>
      <button onclick="removeItem(${index})" class="remove-btn" title="Remove item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `).join('');
  
  // Render vendor groups
  renderVendorGroups();
  
  // Update totals
  updateTotals();
}

// Render vendor groups
function renderVendorGroups() {
  const vendorGroupsEl = document.getElementById('vendor-groups');
  const groups = groupByVendor();
  
  vendorGroupsEl.innerHTML = groups.map(group => `
    <div class="vendor-group">
      <h4>${group.vendorName}</h4>
      <p>${group.items.length} item${group.items.length !== 1 ? 's' : ''}</p>
    </div>
  `).join('');
}

// Update totals display
function updateTotals() {
  const { subtotal, shipping, tax, total } = calculateTotals();
  
  document.getElementById('subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('shipping').textContent = shipping === 0 ? 'FREE' : formatCurrency(shipping);
  document.getElementById('tax').textContent = formatCurrency(tax);
  document.getElementById('total').textContent = formatCurrency(total);
}

// Update item quantity
function updateQuantity(index, change) {
  if (index < 0 || index >= state.cart.length) return;
  
  state.cart[index].quantity += change;
  
  if (state.cart[index].quantity <= 0) {
    removeItem(index);
  } else {
    saveCartToStorage();
    renderCart();
  }
}

// Remove item from cart
function removeItem(index) {
  if (index < 0 || index >= state.cart.length) return;
  
  const itemName = state.cart[index].name;
  state.cart.splice(index, 1);
  saveCartToStorage();
  renderCart();
  showAlert(`${itemName} removed from cart`, 'info');
}

// Main checkout function
async function checkout() {
  // Check if user is logged in
  if (!state.currentUser) {
    showAlert('Please login to complete your order', 'error');
    setTimeout(() => {
      window.location.href = 'login.html?redirect=cart.html';
    }, 1500);
    return;
  }
  
  // Check if cart is empty
  if (state.cart.length === 0) {
    showAlert('Your cart is empty', 'error');
    return;
  }
  
  // Check terms agreement
  const termsAgree = document.getElementById('terms-agree');
  if (!termsAgree.checked) {
    showAlert('Please agree to the terms and conditions', 'error');
    return;
  }
  
  // Prevent multiple submissions
  if (state.isProcessing) {
    return;
  }
  
  state.isProcessing = true;
  
  // Update UI
  const checkoutBtn = document.getElementById('checkout-btn');
  const originalBtnText = checkoutBtn.textContent;
  checkoutBtn.disabled = true;
  checkoutBtn.innerHTML = '<span>Processing...</span>';
  
  try {
    // Call Firebase function to create order
    const createOrder = functions.httpsCallable('createOrder');
    
    const response = await createOrder({
      items: state.cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name
      }))
    });
    
    const orderData = response.data;
    
    // Clear cart after successful order
    state.cart = [];
    saveCartToStorage();
    renderCart();
    
    // Show success message
    showAlert(`Order placed successfully! Total: ${formatCurrency(orderData.total)}`, 'success');
    
    // Redirect to order confirmation
    setTimeout(() => {
      window.location.href = `order-confirmation.html?orderId=${orderData.orderId}`;
    }, 2000);
    
  } catch (error) {
    console.error('Checkout error:', error);
    
    let errorMessage = 'Failed to process order. Please try again.';
    
    if (error.code === 'unauthenticated') {
      errorMessage = 'Please login to continue';
      setTimeout(() => window.location.href = 'login.html?redirect=cart.html', 1500);
    } else if (error.code === 'not-found') {
      errorMessage = 'Some products in your cart are no longer available';
    } else if (error.code === 'failed-precondition') {
      errorMessage = error.message || 'Insufficient stock for some items';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showAlert(errorMessage, 'error');
    
  } finally {
    state.isProcessing = false;
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = originalBtnText;
  }
}

// Handle user menu modal
function setupUserMenu() {
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userMenuModal = document.getElementById('user-menu-modal');
  const closeBtn = userMenuModal.querySelector('.close');
  
  userMenuBtn.addEventListener('click', () => {
    userMenuModal.style.display = 'block';
  });
  
  closeBtn.addEventListener('click', () => {
    userMenuModal.style.display = 'none';
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === userMenuModal) {
      userMenuModal.style.display = 'none';
    }
  });
}

// Handle logout
function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await auth.signOut();
        showAlert('Logged out successfully', 'success');
        setTimeout(() => window.location.href = 'index.html', 1000);
      } catch (error) {
        console.error('Logout error:', error);
        showAlert('Failed to logout', 'error');
      }
    });
  }
}

// Monitor authentication state
auth.onAuthStateChanged((user) => {
  state.currentUser = user;
  
  const userLoggedIn = document.getElementById('user-logged-in');
  const userLoggedOut = document.getElementById('user-logged-out');
  const userEmail = document.getElementById('user-email');
  const userMenuBtn = document.getElementById('user-menu-btn');
  
  if (user) {
    userLoggedIn.style.display = 'block';
    userLoggedOut.style.display = 'none';
    userEmail.textContent = user.email;
    userMenuBtn.textContent = user.email.split('@')[0];
  } else {
    userLoggedIn.style.display = 'none';
    userLoggedOut.style.display = 'block';
    userMenuBtn.textContent = 'Account';
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadCartFromStorage();
  renderCart();
  setupUserMenu();
  setupLogout();
  
  // Attach checkout button event
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', checkout);
  }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .cart-item {
    display: grid;
    grid-template-columns: 100px 1fr 120px 100px 40px;
    gap: 20px;
    padding: 20px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 15px;
    align-items: center;
  }
  
  .item-image img {
    width: 100%;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
  }
  
  .item-details h3 {
    margin: 0 0 5px 0;
    font-size: 16px;
  }
  
  .item-vendor {
    color: #6b7280;
    font-size: 14px;
    margin: 5px 0;
  }
  
  .item-price {
    font-weight: 600;
    color: #ff9800;
  }
  
  .item-quantity {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .qty-btn {
    width: 30px;
    height: 30px;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 18px;
  }
  
  .qty-btn:hover {
    background: #f3f4f6;
  }
  
  .item-quantity input {
    width: 50px;
    text-align: center;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    padding: 5px;
  }
  
  .item-total {
    font-weight: 600;
    font-size: 18px;
  }
  
  .remove-btn {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 5px;
  }
  
  .remove-btn:hover {
    color: #dc2626;
  }
  
  .vendor-group {
    padding: 10px;
    background: #f9fafb;
    border-radius: 6px;
    margin-bottom: 10px;
  }
  
  .vendor-group h4 {
    margin: 0 0 5px 0;
    font-size: 14px;
  }
  
  .vendor-group p {
    margin: 0;
    font-size: 12px;
    color: #6b7280;
  }
`;
document.head.appendChild(style);