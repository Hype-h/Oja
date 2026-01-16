async function adminLogin(event) {
  event.preventDefault()
  const email = document.getElementById("adminEmail").value
  const password = document.getElementById("adminPassword").value

  try {
    await window.auth.signInWithEmailAndPassword(email, password)
    const user = window.auth.currentUser
    const userDoc = await window.db.collection("users").doc(user.uid).get()

    if (userDoc.exists && userDoc.data().role === "admin") {
      showAlert("Admin login successful!", "success")
      setTimeout(() => {
        window.location.href = "admin-dashboard.html"
      }, 1500)
    } else {
      showAlert("Invalid admin credentials", "error")
      await window.auth.signOut()
    }
  } catch (error) {
    showAlert(error.message, "error")
  }
}

function showAlert(message, type) {
  const alertEl = type === "success" ? document.getElementById("successAlert") : document.getElementById("errorAlert")
  alertEl.textContent = message
  alertEl.textContent = message
  alertEl.classList.add("active")
  setTimeout(() => alertEl.classList.remove("active"), 3000)
}
