// Initialize Firebase configuration with CDN-loaded libraries
const firebaseConfig = {
  apiKey: "AIzaSyALSSw0-d0F2-Zkj5aXVN1ip7FcMCouy8Q",
  authDomain: "oja-place01.firebaseapp.com",
  projectId: "oja-place01",
  storageBucket: "oja-place01.firebasestorage.app",
  messagingSenderId: "543711721814",
  appId: "1:543711721814:web:6fafe8a7cf1db4b3493ef7"
}

// Declare the firebase variable before using it
const firebase = window.firebase

// Initialize Firebase using global Firebase object from CDN
if (typeof firebase !== "undefined") {
  firebase.initializeApp(firebaseConfig)
}

// Export references for use in other modules
const auth = firebase.auth()
const db = firebase.firestore()

// Make available globally
window.auth = auth
window.db = db
window.firebaseApp = firebase
