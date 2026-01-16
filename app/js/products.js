// js/products.js

window.loadProducts = async () => {
  const snap = await db.collection("products")
    .where("status", "==", "active")
    .get();

  state.allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderProducts();
};

function renderProducts() {
  const el = document.getElementById("productsGrid");
  if (!el) return;

  el.innerHTML = state.allProducts.map(p => `
    <div class="border p-4 rounded">
      <h3>${p.name}</h3>
      <p>$${p.price}</p>
      <button onclick="addToCart('${p.id}')">Add</button>
    </div>
  `).join("");
}

// Product listing page script
async function loadProducts() {
  try {
    showLoading(true);
    filteredProducts = [...allProducts];
    displayProducts();
    showLoading(false);
  } catch (error) {
    console.error("Error loading products:", error);
    showLoading(false);
    showMessage("Error loading products", "error");
  }
}

// Display products in grid
function displayProducts() {
  const grid = document.getElementById("products-grid")
  const emptyState = document.getElementById("empty-state")

  if (filteredProducts.length === 0) {
    grid.innerHTML = ""
    emptyState.style.display = "block"
    return
  }

  emptyState.style.display = "none"
  grid.innerHTML = filteredProducts
    .map(
      (product) => `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image || "/diverse-products-still-life.png"}" alt="${product.name}">
                ${product.discount ? `<span class="discount-badge">-${product.discount}%</span>` : ""}
            </div>
            <div class="product-body">
                <h3>${product.name}</h3>
                <p class="vendor-name">by ${product.vendorName}</p>
                <div class="product-rating">
                    <div class="stars">${renderStars(product.rating || 0)}</div>
                    <span class="rating-count">(${product.reviewCount || 0})</span>
                </div>
                <p class="product-price">
                    $${product.price}
                    ${product.oldPrice ? `<span class="old-price">$${product.oldPrice}</span>` : ""}
                </p>
                <div class="product-actions">
                    <button class="btn-primary btn-small view-details-btn" data-id="${product.id}">View Details</button>
                    <button class="btn-secondary btn-small quick-add-btn" data-id="${product.id}">Add to Cart</button>
                </div>
            </div>
        </div>
    `,
    )
    .join("")

  attachProductEventListeners()
}

// Render star rating
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
  document.getElementById("search-btn").addEventListener("click", filterProducts)
  document.getElementById("search-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") filterProducts()
  })

  document.getElementById("category-filter").addEventListener("change", filterProducts)
  document.getElementById("price-filter").addEventListener("change", filterProducts)
  document.getElementById("sort-filter").addEventListener("change", filterProducts)

  document.getElementById("user-menu-btn").addEventListener("click", openUserMenu)
  document.getElementById("logout-btn")?.addEventListener("click", logout)
}

// Filter products
function filterProducts() {
  const search = document.getElementById("search-input").value.toLowerCase()
  const category = document.getElementById("category-filter").value
  const price = document.getElementById("price-filter").value
  const sort = document.getElementById("sort-filter").value

  filteredProducts = allProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search) || product.description?.toLowerCase().includes(search)
    const matchesCategory = !category || product.category === category
    const matchesPrice = !price || checkPriceRange(product.price, price)

    return matchesSearch && matchesCategory && matchesPrice
  })

  // Sort products
  sortProducts(sort)
  displayProducts()
}

// Check price range
function checkPriceRange(price, range) {
  const [min, max] = range.split("-")
  const numPrice = Number.parseFloat(price)

  if (max === "+") {
    return numPrice >= Number.parseFloat(min)
  }
  return numPrice >= Number.parseFloat(min) && numPrice <= Number.parseFloat(max)
}

// Sort products
function sortProducts(sort) {
  switch (sort) {
    case "price-low":
      filteredProducts.sort((a, b) => a.price - b.price)
      break
    case "price-high":
      filteredProducts.sort((a, b) => b.price - a.price)
      break
    case "rating":
      filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      break
    case "newest":
    default:
      filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
}

// Attach product button listeners
function attachProductEventListeners() {
  document.querySelectorAll(".view-details-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.href = `product-detail.html?id=${btn.dataset.id}`
    })
  })

  document.querySelectorAll(".quick-add-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.target.disabled = true
      const productId = btn.dataset.id
      await addToCart(productId, 1)
      e.target.textContent = "Added!"
      setTimeout(() => {
        e.target.disabled = false
        e.target.textContent = "Add to Cart"
      }, 2000)
    })
  })
}

// Add to cart
async function addToCart(productId, quantity) {
  if (!auth.currentUser) {
    showMessage("Please login to add items to cart", "info")
    setTimeout(() => (window.location.href = "login.html"), 2000)
    return
  }

  try {
    const product = allProducts.find((p) => p.id === productId)
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")

    const existingItem = cart.find((item) => item.id === productId)
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cart.push({
        id: productId,
        name: product.name,
        price: product.price,
        image: product.image,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        quantity: quantity,
      })
    }

    localStorage.setItem("cart", JSON.stringify(cart))
    updateCartBadge()
    showMessage("Added to cart!", "success")
  } catch (error) {
    console.error("[v0] Error adding to cart:", error)
    showMessage("Error adding to cart", "error")
  }
}

// Update cart badge
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]")
  const total = cart.reduce((sum, item) => sum + item.quantity, 0)
  document.getElementById("cart-count").textContent = total
}

// Show loading
function showLoading(show) {
  document.getElementById("loading").style.display = show ? "block" : "none"
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

// Logout
async function logout() {
  try {
    await auth.signOut()
    window.location.href = "./index.html"
  } catch (error) {
    console.error("[v0] Logout error:", error)
  }
}

// Initialize on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProductsPage)
} else {
  initProductsPage()
}
