async function loadHomeAds() {
  const now = firebase.firestore.Timestamp.now();
  const trackView = firebase.functions().httpsCallable("trackAdView");
trackView({ adId });
const trackClick = firebase.functions().httpsCallable("trackAdClick");
trackClick({ adId });


  const snapshot = await db
    .collection("ads")
    .where("placement", "==", "home")
    .where("status", "==", "active")
    .where("endAt", ">", now)
    .limit(6)
    .get();

  const container = document.getElementById("ads-container");
  container.innerHTML = "";

  snapshot.forEach((doc) => {
    const ad = doc.data();

    container.innerHTML += `
      <div class="border rounded-lg p-3 hover:shadow-lg">
        <img src="${ad.image}" class="h-40 w-full object-cover rounded" />
        <h3 class="font-semibold mt-2">${ad.title}</h3>
        <p class="text-green-600 font-bold">₦${ad.price}</p>
      </div>
    `;
  });
}
