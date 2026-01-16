let db // Declare the db variable

function loadAdminDashboard() {
  const container = document.getElementById("adminDashboardContainer")
  container.innerHTML = `
    <div data-page="adminDashboard">
      <div class="dashboard">
        <ul class="sidebar-menu">
          <li><a href="#" class="active" onclick="adminShowSection('overview')">Overview</a></li>
          <li><a href="#" onclick="adminShowSection('vendors')">Vendors</a></li>
          <li><a href="#" onclick="adminShowSection('orders')">Orders</a></li>
          <li><a href="#" onclick="adminShowSection('users')">Users</a></li>
          <li><a href="#" onclick="adminShowSection('reports')">Reports</a></li>
          <li><a href="#" onclick="logout()">Logout</a></li>
        </ul>
        <div class="dashboard-content">
          <div id="adminOverview">
            <h2 class="section-title">Admin Dashboard</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
              <div style="background: var(--background); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border);">
                <div style="color: var(--text-secondary);">Total Users</div>
                <div style="font-size: 2rem; font-weight: 700; color: var(--primary);" id="adminTotalUsers">0</div>
              </div>
              <div style="background: var(--background); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border);">
                <div style="color: var(--text-secondary);">Total Vendors</div>
                <div style="font-size: 2rem; font-weight: 700; color: var(--accent);" id="adminTotalVendors">0</div>
              </div>
              <div style="background: var(--background); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border);">
                <div style="color: var(--text-secondary);">Total Orders</div>
                <div style="font-size: 2rem; font-weight: 700; color: var(--primary);" id="adminTotalOrders">0</div>
              </div>
              <div style="background: var(--background); padding: 1.5rem; border: 1px solid var(--border); border-radius: 0.75rem;">
                <div style="color: var(--text-secondary);">Platform Revenue</div>
                <div style="font-size: 2rem; font-weight: 700; color: var(--success);" id="adminRevenue">$0</div>
              </div>
            </div>
          </div>

          <div id="adminVendors" style="display:none;">
            <h2 class="section-title">Manage Vendors</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Products</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="adminVendorsList"></tbody>
            </table>
          </div>

          <div id="adminOrders" style="display:none;">
            <h2 class="section-title">All Orders</h2>
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
              <tbody id="adminOrdersList"></tbody>
            </table>
          </div>

          <div id="adminUsers" style="display:none;">
            <h2 class="section-title">Manage Users</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Orders</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody id="adminUsersList"></tbody>
            </table>
          </div>

          <div id="adminReports" style="display:none;">
            <h2 class="section-title">Platform Reports</h2>
            <div style="background: var(--background); padding: 1.5rem; border: 1px solid var(--border); border-radius: 0.75rem;">
              <h3>Sales Summary</h3>
              <p style="margin-top: 1rem;">Total Platform Revenue: <span id="reportRevenue" style="font-weight: 700;">$0</span></p>
              <p style="margin-top: 0.5rem;">Average Order Value: <span id="reportAvgOrder" style="font-weight: 700;">$0</span></p>
              <p style="margin-top: 0.5rem;">Total Orders: <span id="reportTotalOrders" style="font-weight: 700;">0</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function adminShowSection(section) {
  document.getElementById("adminOverview").style.display = "none"
  document.getElementById("adminVendors").style.display = "none"
  document.getElementById("adminOrders").style.display = "none"
  document.getElementById("adminUsers").style.display = "none"
  document.getElementById("adminReports").style.display = "none"

  if (section === "overview") {
    document.getElementById("adminOverview").style.display = "block"
    loadAdminOverview()
  } else if (section === "vendors") {
    document.getElementById("adminVendors").style.display = "block"
    loadAdminVendors()
  } else if (section === "orders") {
    document.getElementById("adminOrders").style.display = "block"
    loadAdminOrders()
  } else if (section === "users") {
    document.getElementById("adminUsers").style.display = "block"
    loadAdminUsers()
  } else if (section === "reports") {
    document.getElementById("adminReports").style.display = "block"
    loadAdminReports()
  }
}

async function loadAdminOverview() {
  try {
    const usersSnapshot = await db.collection("users").get()
    const ordersSnapshot = await db.collection("orders").get()
    const vendorsSnapshot = await db.collection("vendors").get()

    let totalRevenue = 0
    ordersSnapshot.forEach((doc) => {
      totalRevenue += doc.data().total || 0
    })

    document.getElementById("adminTotalUsers").textContent = usersSnapshot.size
    document.getElementById("adminTotalVendors").textContent = vendorsSnapshot.size
    document.getElementById("adminTotalOrders").textContent = ordersSnapshot.size
    document.getElementById("adminRevenue").textContent = `$${totalRevenue.toFixed(2)}`
  } catch (error) {
    console.error("Error loading admin overview:", error)
  }
}

async function loadAdminVendors() {
  try {
    const snapshot = await db.collection("vendors").get()
    const vendorsList = document.getElementById("adminVendorsList")
    if (snapshot.empty) {
      vendorsList.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No vendors</td></tr>'
    } else {
      vendorsList.innerHTML = snapshot.docs
        .map((doc) => {
          const vendor = doc.data()
          return `
          <tr>
            <td>${vendor.businessName}</td>
            <td>${vendor.email}</td>
            <td><span class="status-badge status-${vendor.status.toLowerCase()}">${vendor.status}</span></td>
            <td>${vendor.products || 0}</td>
            <td>${vendor.status === "pending" ? `<button class="btn btn-success" style="padding: 0.5rem;" onclick="approveVendor('${doc.id}')">Approve</button>` : "Approved"}</td>
          </tr>
        `
        })
        .join("")
    }
  } catch (error) {
    console.error("Error loading vendors:", error)
  }
}

async function loadAdminOrders() {
  try {
    const snapshot = await db.collection("orders").get()
    const ordersList = document.getElementById("adminOrdersList")
    if (snapshot.empty) {
      ordersList.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No orders</td></tr>'
    } else {
      ordersList.innerHTML = snapshot.docs
        .map((doc) => {
          const order = doc.data()
          return `
          <tr>
            <td>${doc.id}</td>
            <td>${order.customerEmail}</td>
            <td>$${order.total.toFixed(2)}</td>
            <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
            <td>${new Date(order.createdAt.toDate()).toLocaleDateString()}</td>
          </tr>
        `
        })
        .join("")
    }
  } catch (error) {
    console.error("Error loading orders:", error)
  }
}

async function loadAdminUsers() {
  try {
    const snapshot = await db.collection("users").get()
    const usersList = document.getElementById("adminUsersList")
    if (snapshot.empty) {
      usersList.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">No users</td></tr>'
    } else {
      usersList.innerHTML = snapshot.docs
        .map((doc) => {
          const user = doc.data()
          return `
          <tr>
            <td>${user.name || "N/A"}</td>
            <td>${user.email}</td>
            <td>0</td>
            <td>${new Date(user.createdAt.toDate()).toLocaleDateString()}</td>
          </tr>
        `
        })
        .join("")
    }
  } catch (error) {
    console.error("Error loading users:", error)
  }
}

async function loadAdminReports() {
  try {
    const ordersSnapshot = await db.collection("orders").get()
    const orders = []
    let totalRevenue = 0

    ordersSnapshot.forEach((doc) => {
      const order = doc.data()
      orders.push(order)
      totalRevenue += order.total || 0
    })

    const avgOrder = orders.length > 0 ? totalRevenue / orders.length : 0

    document.getElementById("reportRevenue").textContent = `$${totalRevenue.toFixed(2)}`
    document.getElementById("reportAvgOrder").textContent = `$${avgOrder.toFixed(2)}`
    document.getElementById("reportTotalOrders").textContent = orders.length
  } catch (error) {
    console.error("Error loading reports:", error)
  }
}

async function approveVendor(vendorId) {
  try {
    await db.collection("vendors").doc(vendorId).update({
      status: "approved",
    })
    await db.collection("users").doc(vendorId).update({
      role: "vendor",
    })
    loadAdminVendors()
    window.showAlert("Vendor approved successfully!", "success")
  } catch (error) {
    window.showAlert(error.message, "error")
  }
}

// Example implementation of showAlert function
window.showAlert = (message, type) => {
  const alertContainer = document.createElement("div")
  alertContainer.className = `alert alert-${type}`
  alertContainer.textContent = message
  document.body.appendChild(alertContainer)

  // Remove alert after 3 seconds
  setTimeout(() => {
    document.body.removeChild(alertContainer)
  }, 3000)
}

// Example implementation of db variable
// db = firebase.firestore(); // Assuming Firebase is used for db operations
