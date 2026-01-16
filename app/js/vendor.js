let db // Declare db variable
let currentUser // Declare currentUser variable

function loadVendorDashboard() {
  const container = document.getElementById("vendorDashboardContainer")
  container.innerHTML = `
    <div data-page="vendorDashboard">
      <div class="dashboard">
        <ul class="sidebar-menu">
          <li><a href="#" class="active" onclick="vendorShowSection('overview')">Overview</a></li>
          <li><a href="#" onclick="vendorShowSection('products')">My Products</a></li>
          <li><a href="#" onclick="vendorShowSection('orders')">Orders</a></li>
          <li><a href="#" onclick="vendorShowSection('messages')">Messages</a></li>
          <li><a href="#" onclick="vendorShowSection('earnings')">Earnings</a></li>
          <li><a href="#" onclick="logout()">Logout</a></li>
        </ul>
        <div class="dashboard-content">
          <div id="vendorOverview">
            <h2 class="section-title">Vendor Dashboard</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
              <div style="background: var(--background); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border);">
                <div style="color: var(--text-secondary);">Total Products</div>
                <div style="font-size: 2rem; font-weight: 700; color: var(--primary);" id="vendorTotalProducts">0</div>
              </div>
              <div style="background: var(--background); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border);">
                <div style="color: var(--text-secondary);">Total Orders</div>
                <div style="font-size: 2rem; font-weight: 700; color: var(--accent);" id="vendorTotalOrders">0</div>
              </div>
              <div style="background: var(--background); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border);">
                <div style="color: var(--text-secondary);">Total Earnings</div>
                <div style="font-size: 2rem; font-weight: 700; color: var(--success);" id="vendorEarnings">$0</div>
              </div>
            </div>
          </div>

          <div id="vendorProducts" style="display:none;">
            <h2 class="section-title">My Products</h2>
            <button class="btn btn-primary" onclick="showAddProductModal()">Add Product</button>
            <table class="table" style="margin-top: 1rem;">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Price</th>
                  <th>Orders</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="vendorProductsList"></tbody>
            </table>
          </div>

          <div id="vendorOrders" style="display:none;">
            <h2 class="section-title">My Orders</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody id="vendorOrdersList"></tbody>
            </table>
          </div>

          <div id="vendorMessages" style="display:none;">
            <h2 class="section-title">Messages</h2>
            <div style="background: var(--background); padding: 1.5rem; border: 1px solid var(--border); border-radius: 0.75rem;">
              <div id="messagesList" style="max-height: 400px; overflow-y: auto; margin-bottom: 1rem;"></div>
              <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="vendorMessageInput" placeholder="Type a message..." style="flex: 1; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
                <button class="btn btn-primary" onclick="sendVendorMessage()">Send</button>
              </div>
            </div>
          </div>

          <div id="vendorEarnings" style="display:none;">
            <h2 class="section-title">Earnings Report</h2>
            <div style="background: var(--background); padding: 1.5rem; border: 1px solid var(--border); border-radius: 0.75rem;">
              <p style="margin-bottom: 1rem;">Total Earnings: <span id="earningsTotal" style="font-weight: 700; font-size: 1.25rem; color: var(--primary);">$0</span></p>
              <p style="margin-bottom: 1rem;">Pending Payout: <span id="earningsPending" style="font-weight: 700;">$0</span></p>
              <button class="btn btn-primary">Request Withdrawal</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

async function loadVendorData() {
  try {
    const vendorDoc = await db.collection("vendors").doc(currentUser.uid).get()
    if (vendorDoc.exists) {
      const vendorData = vendorDoc.data()
      document.getElementById("vendorTotalProducts").textContent = vendorData.products || 0
      document.getElementById("earningsTotal").textContent = `$${(vendorData.earnings || 0).toFixed(2)}`

      const ordersSnapshot = await db.collection("orders").where("vendorId", "==", currentUser.uid).get()
      document.getElementById("vendorTotalOrders").textContent = ordersSnapshot.size
      document.getElementById("vendorEarnings").textContent = `$${(vendorData.earnings || 0).toFixed(2)}`
    }
  } catch (error) {
    console.error("Error loading vendor data:", error)
  }
}

function vendorShowSection(section) {
  document.getElementById("vendorOverview").style.display = "none"
  document.getElementById("vendorProducts").style.display = "none"
  document.getElementById("vendorOrders").style.display = "none"
  document.getElementById("vendorMessages").style.display = "none"
  document.getElementById("vendorEarnings").style.display = "none"

  if (section === "overview") {
    document.getElementById("vendorOverview").style.display = "block"
    loadVendorData()
  } else if (section === "products") {
    document.getElementById("vendorProducts").style.display = "block"
    loadVendorProducts()
  } else if (section === "orders") {
    document.getElementById("vendorOrders").style.display = "block"
    loadVendorOrders()
  } else if (section === "messages") {
    document.getElementById("vendorMessages").style.display = "block"
    loadMessages()
  } else if (section === "earnings") {
    document.getElementById("vendorEarnings").style.display = "block"
  }
}

async function loadVendorProducts() {
  try {
    const snapshot = await db.collection("products").where("vendorId", "==", currentUser.uid).get()
    const productsList = document.getElementById("vendorProductsList")
    if (snapshot.empty) {
      productsList.innerHTML =
        '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No products yet</td></tr>'
    } else {
      const rows = []
      snapshot.forEach((doc) => {
        const product = doc.data()
        rows.push(`
          <tr>
            <td>${product.name}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.orders || 0}</td>
            <td>
              <button class="btn btn-secondary" style="padding: 0.5rem;" onclick="editProduct('${doc.id}')">Edit</button>
            </td>
          </tr>
        `)
      })
      productsList.innerHTML = rows.join("")
    }
  } catch (error) {
    console.error("Error loading vendor products:", error)
  }
}

async function loadVendorOrders() {
  try {
    const snapshot = await db.collection("orders").get()
    const vendorOrders = []
    snapshot.forEach((doc) => {
      const order = doc.data()
      if (order.items && order.items.some((item) => item.vendorId === currentUser.uid)) {
        vendorOrders.push({ id: doc.id, ...order })
      }
    })

    const ordersList = document.getElementById("vendorOrdersList")
    if (vendorOrders.length === 0) {
      ordersList.innerHTML =
        '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No orders yet</td></tr>'
    } else {
      ordersList.innerHTML = vendorOrders
        .map(
          (order) => `
        <tr>
          <td>${order.id}</td>
          <td>${order.customerEmail}</td>
          <td>$${order.total.toFixed(2)}</td>
          <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
          <td>${new Date(order.createdAt.toDate()).toLocaleDateString()}</td>
        </tr>
      `,
        )
        .join("")
    }
  } catch (error) {
    console.error("Error loading vendor orders:", error)
  }
}

async function loadMessages() {
  try {
    const snapshot = await db.collection("messages").where("senderType", "==", "vendor").get()
    const messagesList = document.getElementById("messagesList")
    if (snapshot.empty) {
      messagesList.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No messages</p>'
    } else {
      messagesList.innerHTML = snapshot.docs
        .map((doc) => {
          const msg = doc.data()
          return `<div style="padding: 0.75rem; background: var(--surface); border-radius: 0.5rem; margin-bottom: 0.5rem;"><strong>You:</strong> ${msg.message}</div>`
        })
        .join("")
    }
  } catch (error) {
    console.error("Error loading messages:", error)
  }
}

function showAddProductModal() {
  const modal = document.createElement("div")
  modal.className = "modal active"
  modal.id = "productModal"
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title">Add Product</div>
        <button class="modal-close" onclick="closeModal('productModal')">✕</button>
      </div>
      <form onsubmit="addProduct(event)">
        <div class="form-group">
          <label>Product Name</label>
          <input type="text" id="productName" required>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="productDesc" rows="3" required></textarea>
        </div>
        <div class="form-group">
          <label>Price</label>
          <input type="number" id="productPrice" step="0.01" required>
        </div>
        <div class="form-group">
          <label>Stock</label>
          <input type="number" id="productStock" required>
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%;">Add Product</button>
      </form>
    </div>
  `
  document.body.appendChild(modal)
}

async function addProduct(event) {
  event.preventDefault()
  try {
    const vendorDoc = await db.collection("vendors").doc(currentUser.uid).get()
    const vendorData = vendorDoc.data()

    await db.collection("products").add({
      vendorId: currentUser.uid,
      vendorName: vendorData.businessName,
      name: document.getElementById("productName").value,
      description: document.getElementById("productDesc").value,
      price: Number.parseFloat(document.getElementById("productPrice").value),
      stock: Number.parseInt(document.getElementById("productStock").value),
      emoji: "📦",
      rating: 5,
      createdAt: new Date(),
    })

    await db
      .collection("vendors")
      .doc(currentUser.uid)
      .update({
        products: (vendorData.products || 0) + 1,
      })

    closeModal("productModal")
    loadVendorProducts()
    showAlert("Product added successfully!", "success")
  } catch (error) {
    showAlert(error.message, "error")
  }
}

async function sendVendorMessage() {
  const input = document.getElementById("vendorMessageInput")
  const message = input.value
  if (message.trim()) {
    try {
      await db.collection("messages").add({
        senderId: currentUser.uid,
        senderType: "vendor",
        message: message,
        createdAt: new Date(),
      })
      input.value = ""
      loadMessages()
      showAlert("Message sent!", "success")
    } catch (error) {
      showAlert(error.message, "error")
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.remove()
  }
}

function showAlert(message, type) {
  const alertContainer = document.createElement("div")
  alertContainer.className = `alert alert-${type}`
  alertContainer.textContent = message
  document.body.appendChild(alertContainer)

  setTimeout(() => {
    alertContainer.remove()
  }, 3000)
}
