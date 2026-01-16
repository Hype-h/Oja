// js/app.js
// ===============================
// APP BOOTSTRAP ONLY
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  console.log("App booting…");

  if (typeof loadProducts === "function") {
    loadProducts();
  }

  if (typeof updateCart === "function") {
    updateCart();
  }
});
