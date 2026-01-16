// Import Firebase SDK
let currentProduct = null
let productReviews = []
let selectedRating = 0

// Use global Firebase references from firebase-config.js
const db = window.db
const auth = window.auth

// Initialize product detail page
async function initProductDetail() {
  try {
    const params = new URLSearchParams(window.location.search)
    const productId = params.get("id")

    if (!productId) {
      window.location.href = "products.html"
      return
    }

    updateCartBadge()
    await loadProductDetail(productId)
    await loadProductReviews(productId)
    setupEventListeners()
  } catch (error) {
    console.error("[v0] Error initializing product detail:", error)
    showMessage("Error loading product", "error")
  }
}

// Load product details
async function loadProductDetail(productId) {
  try {
    const doc = await db.collection("products").doc(productId).get()

    if (!doc.exists) {
      showMessage("Product not found", "error")
      setTimeout(() => (window.location.href = "products.html"), 2000)
      return
    }

    currentProduct = {
      id: doc.id,
      ...doc.data(),
    }

    displayProductDetail()
  } catch (error) {
    console.error("[v0] Error loading product:", error)
    throw error
  }
}

// Display product details
function displayProductDetail() {
  const product = currentProduct

  // Update breadcrumb
  document.getElementById("product-name-breadcrumb").textContent = product.name

  // Update images
  const mainImage = document.getElementById("main-image")
  mainImage.src = product.image || "/diverse-products-still-life.png"

  const thumbnailContainer = document.getElementById("thumbnail-container")
  if (product.images && product.images.length > 0) {
    thumbnailContainer.innerHTML = product.images
      .map(
        (img) => `
            <img src="${img}" alt="Product" class="thumbnail" onclick="this.parentElement.previousElementSibling.src='${img}'">
        `,
      )
      .join("")
  }

  // Update product info
  document.getElementById("product-title").textContent = product.name
  document.getElementById("price").textContent = `$${product.price}`
  if (product.oldPrice) {
    document.getElementById("old-price").textContent = `$${product.oldPrice}`
  }

  document.getElementById("vendor-name").textContent = product.vendorName
  document.getElementById("category").textContent = product.category
  document.getElementById("stock").textContent = product.stock > 0 ? `${product.stock} in stock` : "Out of stock"
  document.getElementById("sku").textContent = product.sku || "N/A"
  document.getElementById("description").textContent = product.description

  // Update ratings
  updateRatingDisplay()

  // Disable add to cart if out of stock
  if (product.stock === 0) {
    document.getElementById("add-to-cart-btn").disabled = true
    document.getElementById("buy-now-btn").disabled = true
  }
}

// Load product reviews
async function loadProductReviews(productId) {
  try {
    const snapshot = await db
      .collection("reviews")
      .where("productId", "==", productId)
      .orderBy("createdAt", "desc")
      .get()

    productReviews = []
    snapshot.forEach((doc) => {
      productReviews.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    displayReviews()
  } catch (error) {
    console.error("[v0] Error loading reviews:", error)
  }
}

// Display reviews
function displayReviews() {
  const reviewsList = document.getElementById("reviews-list")

  if (productReviews.length === 0) {
    reviewsList.innerHTML = '<p style="text-align: center; color: #666;">No reviews yet. Be the first to review!</p>'
    return
  }

  reviewsList.innerHTML = productReviews
    .map(
      (review) => `
        <div class="review-item">
            <div class="review-header">
                <div>
                    <strong>${review.reviewerName}</strong>
                    <div class="stars">${renderStars(review.rating)}</div>
                </div>
                <span class="review-date">${formatDate(review.createdAt)}</span>
            </div>
            <h4>${review.title}</h4>
            <p>${review.comment}</p>
        </div>
    `,
    )
    .join("")
}

// Update rating display
function updateRatingDisplay() {
  const avgRating = calculateAverageRating()
  document.getElementById("avg-rating-display").textContent = avgRating.toFixed(1)
  document.getElementById("rating-stars").innerHTML = renderStars(avgRating)
  document.getElementById("rating-count").textContent = `(${productReviews.length} reviews)`

  // Update rating bars
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  productReviews.forEach((review) => {
    ratingCounts[review.rating]++
  })

  const total = productReviews.length || 1
  for (let i = 1; i <= 5; i++) {
    const percentage = (ratingCounts[i] / total) * 100
    document.getElementById(`bar-${i}`).style.width = percentage + "%"
  }
}

// Calculate average rating
function calculateAverageRating() {
  if (productReviews.length === 0) return 0
  const sum = productReviews.reduce((total, review) => total + review.rating, 0)
  return sum / productReviews.length
}

// Render stars
function renderStars(rating) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating % 1 !== 0
  let stars = ""

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars += '<span class="star filled">★</span>'
    } else if (i === fullStars && hasHalf) {
      stars += '<span class="star half">★</span>'
    } else {
      stars += '<span class="star">★</span>'
    }
  }
  return stars
}

// Setup event listeners
function setupEventListeners() {
  // Quantity controls
  document.getElementById("qty-minus").addEventListener("click", () => {
    const input = document.getElementById("quantity")
    if (input.value > 1) input.value--
  })

  document.getElementById("qty-plus").addEventListener("click", () => {
    const input = document.getElementById("quantity")
    input.value = Number.parseInt(input.value) + 1
  })

  // Add to cart
  document.getElementById("add-to-cart-btn").addEventListener("click", addToCart)
  document.getElementById("buy-now-btn").addEventListener("click", buyNow)

  // Reviews
  document.getElementById("write-review-btn").addEventListener("click", openReviewModal)
  document.getElementById("review-form").addEventListener("submit", submitReview)

  // Star rating
  document.querySelectorAll("#star-rating span").forEach((star) => {
    star.addEventListener("click", () => {
      selectedRating = Number.parseInt(star.dataset.value)
      document.getElementById("review-rating").value = selectedRating
      updateStarDisplay()
    })
  })

  // User menu
  document.getElementById("user-menu-btn").addEventListener("click", openUserMenu)
}

// Add to cart
async function addToCart() {
  if (!auth.currentUser) {
    showMessage("Please login to add items to cart", "info")
    setTimeout(() => (window.location.href = "login.html"), 2000)
    return
  }

  try {
    const quantity = Number.parseInt(document.getElementById("quantity").value)
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")

    const existingItem = cart.find((item) => item.id === currentProduct.id)
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cart.push({
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        image: currentProduct.image,
        vendorId: currentProduct.vendorId,
        vendorName: currentProduct.vendorName,
        quantity: quantity,
      })
    }

    localStorage.setItem("cart", JSON.stringify(cart))
    updateCartBadge()
    showMessage(`Added ${quantity} item(s) to cart!`, "success")
  } catch (error) {
    console.error("[v0] Error adding to cart:", error)
    showMessage("Error adding to cart", "error")
  }
}

// Buy now
async function buyNow() {
  await addToCart()
  setTimeout(() => (window.location.href = "cart.html"), 1000)
}

// Open review modal
function openReviewModal() {
  if (!auth.currentUser) {
    showMessage("Please login to write a review", "info")
    setTimeout(() => (window.location.href = "login.html"), 2000)
    return
  }

  document.getElementById("review-modal").style.display = "block"
  document.querySelector(".close").addEventListener("click", () => {
    document.getElementById("review-modal").style.display = "none"
  })
}

// Submit review
async function submitReview(e) {
  e.preventDefault()

  if (selectedRating === 0) {
    showMessage("Please select a rating", "error")
    return
  }

  try {
    const reviewData = {
      productId: currentProduct.id,
      userId: auth.currentUser.uid,
      reviewerName: auth.currentUser.displayName || auth.currentUser.email,
      rating: selectedRating,
      title: document.getElementById("review-title").value,
      comment: document.getElementById("review-comment").value,
      createdAt: new Date(),
    }

    const docRef = await db.collection("reviews").add(reviewData)

    productReviews.unshift({
      id: docRef.id,
      ...reviewData,
    })

    displayReviews()
    updateRatingDisplay()
    document.getElementById("review-form").reset()
    document.getElementById("review-modal").style.display = "none"
    showMessage("Review submitted successfully!", "success")
  } catch (error) {
    console.error("[v0] Error submitting review:", error)
    showMessage("Error submitting review", "error")
  }
}

// Update star display
function updateStarDisplay() {
  document.querySelectorAll("#star-rating span").forEach((star, index) => {
    if (index < selectedRating) {
      star.classList.add("active")
    } else {
      star.classList.remove("active")
    }
  })
}

// Format date
function formatDate(date) {
  if (!date) return ""
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

// Update cart badge
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]")
  const total = cart.reduce((sum, item) => sum + item.quantity, 0)
  document.getElementById("cart-count").textContent = total
}

// Show message
function showMessage(message, type) {
  const div = document.createElement("div")
  div.className = `toast toast-${type}`
  div.textContent = message
  document.body.appendChild(div)

  setTimeout(() => div.remove(), 3000)
}

// Open user menu
function openUserMenu() {
  const modal = document.getElementById("user-menu-modal")
  if (auth.currentUser) {
    document.getElementById("user-logged-out").style.display = "none"
    document.getElementById("user-logged-in").style.display = "block"
    document.getElementById("user-email").textContent = auth.currentUser.email
  } else {
    document.getElementById("user-logged-out").style.display = "block"
    document.getElementById("user-logged-in").style.display = "none"
  }
  modal.style.display = "block"

  document.querySelector(".close").addEventListener("click", () => {
    modal.style.display = "none"
  })
}

// Initialize on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProductDetail)
} else {
  initProductDetail()
}
