// checkout.js - Frontend checkout page logic

// Initialize Firebase Functions
const functions = firebase.functions();

// State management
const state = {
  currentUser: null,
  cart: [],
  isProcessing: false,
  orderSummary: null
};

// Load cart from localStorage
function loadCartFromStorage() {
  try {
    const savedCart = localStorage.getItem('cart');
    state.cart = savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.error('Error loading cart:', error);
    state.cart = [];
  }
}

// Save cart to localStorage
function saveCartToStorage() {
  try {
    localStorage.setItem('cart', JSON.stringify(state.cart));
  } catch (error) {
    console.error('Error saving cart:', error);
  }
}

// Calculate cart total
function calculateTotal() {
  return state.cart.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

// Format currency in Naira
function formatCurrency(amount) {
  return '₦' + amount.toLocaleString('en-NG', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });
}

// Show alert messages
function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    font-weight: 500;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => alertDiv.remove(), 300);
  }, 3000);
}

// Render cart items
function renderCart() {
  const cartContainer = document.getElementById('cart-items');
  const totalElement = document.getElementById('cart-total');
  const emptyMessage = document.getElementById('empty-cart-message');
  const checkoutSection = document.getElementById('checkout-section');
  
  if (state.cart.length === 0) {
    cartContainer.innerHTML = '';
    emptyMessage.style.display = 'block';
    checkoutSection.style.display = 'none';
    totalElement.textContent = formatCurrency(0);
    return;
  }
  
  emptyMessage.style.display = 'none';
  checkoutSection.style.display = 'block';
  
  cartContainer.innerHTML = state.cart.map((item, index) => `
    <div class="cart-item" data-index="${index}">
      <div class="item-details">
        <h3>${item.name}</h3>
        <p class="item-price">${formatCurrency(item.price)}</p>
      </div>
      <div class="item-controls">
        <div class="quantity-controls">
          <button onclick="updateQuantity(${index}, -1)" class="btn-quantity">-</button>
          <span class="quantity">${item.quantity}</span>
          <button onclick="updateQuantity(${index}, 1)" class="btn-quantity">+</button>
        </div>
        <p class="item-subtotal">${formatCurrency(item.price * item.quantity)}</p>
        <button onclick="removeItem(${index})" class="btn-remove">Remove</button>
      </div>
    </div>
  `).join('');
  
  const total = calculateTotal();
  totalElement.textContent = formatCurrency(total);
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
  
  state.cart.splice(index, 1);
  saveCartToStorage();
  renderCart();
  showAlert('Item removed from cart', 'info');
}

// Main checkout function
async function checkout() {
  // Check if user is logged in
  if (!state.currentUser) {
    showAlert('Please login to complete your order', 'error');
    // Redirect to login page
    window.location.href = '/login.html';
    return;
  }
  
  // Check if cart is empty
  if (state.cart.length === 0) {
    showAlert('Your cart is empty', 'error');
    return;
  }
  
  // Prevent multiple submissions
  if (state.isProcessing) {
    return;
  }
  
  state.isProcessing = true;
  
  // Update UI to show processing
  const checkoutBtn = document.getElementById('checkout-btn');
  const originalBtnText = checkoutBtn.textContent;
  checkoutBtn.disabled = true;
  checkoutBtn.textContent = 'Processing...';
  
  try {
    // Call Firebase function to create order
    const createOrder = functions.httpsCallable('createOrder');
    
    const response = await createOrder({
      items: state.cart.map(item => ({
        productId: item.id,
        quantity: item.quantity
      }))
    });
    
    const orderData = response.data;
    
    // Clear cart after successful order
    state.cart = [];
    saveCartToStorage();
    renderCart();
    
    // Store order summary
    state.orderSummary = orderData;
    
    // Show success message
    showAlert(`Order placed successfully! Total: ${formatCurrency(orderData.total)}`, 'success');
    
    // Redirect to order confirmation page or show order details
    setTimeout(() => {
      window.location.href = `/order-confirmation.html?orderId=${orderData.orderId}`;
    }, 2000);
    
  } catch (error) {
    console.error('Checkout error:', error);
    
    let errorMessage = 'Failed to process order. Please try again.';
    
    if (error.code === 'unauthenticated') {
      errorMessage = 'Please login to continue';
      setTimeout(() => window.location.href = '/login.html', 1500);
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

// Initialize payment (optional - for separate payment flow)
async function initializePayment(orderId) {
  if (!state.currentUser) {
    showAlert('Please login to make payment', 'error');
    return;
  }
  
  try {
    const createPayment = functions.httpsCallable('createPayment');
    
    const response = await createPayment({
      orderId: orderId,
      paymentMethod: 'card'
    });
    
    const paymentData = response.data;
    
    if (paymentData.paymentUrl) {
      // Redirect to payment gateway
      window.location.href = paymentData.paymentUrl;
    } else {
      showAlert('Payment initialized', 'success');
    }
    
  } catch (error) {
    console.error('Payment error:', error);
    showAlert('Failed to initialize payment', 'error');
  }
}

// Monitor authentication state
firebase.auth().onAuthStateChanged((user) => {
  state.currentUser = user;
  
  if (user) {
    document.getElementById('user-email')?.textContent = user.email;
  } else {
    // Optionally redirect to login if not authenticated
    // window.location.href = '/login.html';
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadCartFromStorage();
  renderCart();
  
  // Attach checkout button event
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', checkout);
  }
});

// CSS animations
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
`;
document.head.appendChild(style);