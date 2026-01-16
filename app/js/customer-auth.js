function toggleForm() {
  const loginForm = document.getElementById("loginForm")
  const registerForm = document.getElementById("registerForm")
  loginForm.style.display = loginForm.style.display === "none" ? "block" : "none"
  registerForm.style.display = registerForm.style.display === "none" ? "block" : "none"
}

async function customerLogin(event) {
  event.preventDefault()
  const email = document.getElementById("customerEmail").value
  const password = document.getElementById("customerPassword").value
  try {
    await window.auth.signInWithEmailAndPassword(email, password)
    showAlert("Login successful!", "success")
    setTimeout(() => {
      window.location.href = "./products.html"
    }, 1500)
  } catch (error) {
    showAlert(error.message, "error")
  }
}

async function customerRegister(event) {
  event.preventDefault()
  const name = document.getElementById("customerName").value
  const email = document.getElementById("registerEmail").value
  const password = document.getElementById("registerPassword").value
  try {
    const result = await window.auth.createUserWithEmailAndPassword(email, password)
    await window.db.collection("users").doc(result.user.uid).set({
      name: name,
      email: email,
      role: "customer",
      createdAt: new Date(),
    })
    showAlert("Account created! Redirecting to login...", "success")
    setTimeout(() => {
      toggleForm()
    }, 1500)
  } catch (error) {
    showAlert(error.message, "error")
  }
}

function showAlert(message, type) {
  const alertEl = type === "success" ? document.getElementById("successAlert") : document.getElementById("errorAlert")
  alertEl.textContent = message
  alertEl.classList.add("active")
  setTimeout(() => alertEl.classList.remove("active"), 3000)
}
