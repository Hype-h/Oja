// js/auth.js

window.login = async (e) => {
  e.preventDefault();
  const email = loginEmail.value;
  const password = loginPassword.value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    showAlert("Logged in!");
    showPage("home");
  } catch (err) {
    showAlert(err.message, "error");
  }
};

window.signup = async (e) => {
  e.preventDefault();
  const email = signupEmail.value;
  const password = signupPassword.value;

  try {
    const res = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection("users").doc(res.user.uid).set({
      email,
      role: "customer",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showAlert("Account created!");
    showPage("login");
  } catch (err) {
    showAlert(err.message, "error");
  }
};

window.logout = async () => {
  await auth.signOut();
  state.cart = [];
  localStorage.removeItem("oja_cart");
  showPage("home");
};
