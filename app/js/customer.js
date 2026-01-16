let cart = []
let products = []
let currentProductId = null
let db // Declare db variable
let currentUser // Declare currentUser variable
let showAlert // Declare showAlert variable
let showPage // Declare showPage variable

async function loadProducts() {
  try {
    const snapshot = await db.collection("products").get()
    products = []
    snapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() })
    })
    displayHomeProducts()
    displayAllProducts()
  } catch (error) {
    console.error("Error loading products:", error)
  }
}

function displayHomeProducts() {
  const container = document.getElementById("homeProducts")
  container.innerHTML = products
    .slice(0, 6)
    .map(
      (product) => `
    <div class="product-card">
      <div class="product-image">${product.emoji || "📦"}</div>
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-vendor">by ${product.vendorName || "Unknown"}</div>
        <div class="product-price">$${product.price.toFixed(2)}</div>
        <div class="product-rating">⭐ ${product.rating || "No ratings"}</div>
        <div class="product-actions">
          <button class="btn btn-primary" onclick="addToCart('${product.id}')">Add to Cart</button>
          <button class="btn btn-secondary" onclick="viewReviews('${product.id}')">Reviews</button>
        </div>
      </div>
    </div>
  `,
    )
    .join("")
}

function displayAllProducts() {
  const container = document.getElementById("productsGrid")
  container.innerHTML = products
    .map(
      (product) => `
    <div class="product-card">
      <div class="product-image">${product.emoji || "📦"}</div>
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-vendor">by ${product.vendorName || "Unknown"}</div>
        <div class="product-price">$${product.price.toFixed(2)}</div>
        <div class="product-rating">⭐ ${product.rating || "No ratings"}</div>
        <div class="product-actions">
          <button class="btn btn-primary" onclick="addToCart('${product.id}')">Add to Cart</button>
          <button class="btn btn-secondary" onclick="viewReviews('${product.id}')">Reviews</button>
        </div>
      </div>
    </div>
  `,
    )
    .join("")
}

function addToCart(productId) {
  if (!currentUser) {
    showAlert("Please sign in to add items to cart", "error")
    showPage("login")
    return
  }

  const product = products.find((p) => p.id === productId)
  if (product) {
    cart.push(product)
    updateCart()
    showAlert(`${product.name} added to cart!`, "success")
  }
}

function updateCart() {
  const cartItems = document.getElementById("cartItems")
  const cartFooter = document.getElementById("cartFooter")
  const cartEmpty = document.getElementById("cartEmpty")

  if (cart.length === 0) {
    cartItems.innerHTML = ""
    cartEmpty.style.display = "block"
    cartFooter.style.display = "none"
    document.getElementById("cartCount").style.display = "none"
  } else {
    cartEmpty.style.display = "none"
    cartFooter.style.display = "block"
    document.getElementById("cartCount").textContent = cart.length
    document.getElementById("cartCount").style.display = "flex"

    cartItems.innerHTML = cart
      .map(
        (item, index) => `
      <div class="cart-item">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <div class="cart-item-price">$${item.price.toFixed(2)}</div>
        </div>
        <button class="btn btn-danger" style="padding: 0.5rem;" onclick="removeFromCart(${index})">Remove</button>
      </div>
    `,
      )
      .join("")

    const total = cart.reduce((sum, item) => sum + item.price, 0)
    document.getElementById("cartTotalPrice").textContent = `$${total.toFixed(2)}`
  }
}

function removeFromCart(index) {
  cart.splice(index, 1)
  updateCart()
}

function toggleCart() {
  document.getElementById("cartSidebar").classList.toggle("active")
}

async function checkout() {
  if (!currentUser) {
    showAlert("Please sign in to checkout", "error")
    return
  }

  try {
    const orderData = {
      customerId: currentUser.uid,
      customerEmail: currentUser.email,
      items: cart,
      total: cart.reduce((sum, item) => sum + item.price, 0),
      status: "pending",
      createdAt: new Date(),
    }

    const docRef = await db.collection("orders").add(orderData)
    cart = []
    updateCart()
    toggleCart()
    showAlert(`Order placed! Order ID: ${docRef.id}`, "success")
  } catch (error) {
    showAlert(error.message, "error")
  }
}

function viewReviews(productId) {
  currentProductId = productId
  showModal("reviewModal")
}

function showModal(modalId) {
  const modal = document.createElement("div")
  modal.className = "modal active"
  modal.id = modalId
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title">Product Reviews</div>
        <button class="modal-close" onclick="closeModal('${modalId}')">✕</button>
      </div>
      <div id="reviewsList"></div>
      ${
        currentUser
          ? `
        <form id="reviewForm" onsubmit="submitReview(event)" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
          <div class="form-group">
            <label>Rating</label>
            <select id="reviewRating" required>
              <option value="">Select rating</option>
              <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
              <option value="4">⭐⭐⭐⭐ Good</option>
              <option value="3">⭐⭐⭐ Average</option>
              <option value="2">⭐⭐ Poor</option>
              <option value="1">⭐ Bad</option>
            </select>
          </div>
          <div class="form-group">
            <label>Your Review</label>
            <textarea id="reviewText" rows="3" placeholder="Share your experience..." required></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">Submit Review</button>
        </form>
      `
          : '<p style="margin-top: 1rem; text-align: center; color: var(--text-secondary);">Sign in to leave a review</p>'
      }
    </div>
  `
  document.body.appendChild(modal)
  loadProductReviews(currentProductId)
}

async function loadProductReviews(productId) {
  try {
    const snapshot = await db.collection("reviews").where("productId", "==", productId).get()
    const reviews = []
    snapshot.forEach((doc) => {
      reviews.push(doc.data())
    })
    const reviewsList = document.getElementById("reviewsList")
    if (reviews.length === 0) {
      reviewsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No reviews yet</p>'
    } else {
      reviewsList.innerHTML = reviews
        .map(
          (review) => `
        <div style="padding: 1rem; border-bottom: 1px solid var(--border);">
          <div style="color: var(--warning); margin-bottom: 0.5rem;">${"⭐".repeat(review.rating)}</div>
          <p style="margin-bottom: 0.5rem;">${review.text}</p>
          <small style="color: var(--text-secondary);">${new Date(review.createdAt.toDate()).toLocaleDateString()}</small>
        </div>
      `,
        )
        .join("")
    }
  } catch (error) {
    console.error("Error loading reviews:", error)
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.remove()
  }
}

async function submitReview(event) {
  event.preventDefault()
  const rating = document.getElementById("reviewRating").value
  const text = document.getElementById("reviewText").value
  try {
    await db.collection("reviews").add({
      productId: currentProductId,
      customerId: currentUser.uid,
      rating: Number.parseInt(rating),
      text: text,
      createdAt: new Date(),
    })
    closeModal("reviewModal")
    showAlert("Review submitted successfully!", "success")
  } catch (error) {
    showAlert(error.message, "error")
  }
}
