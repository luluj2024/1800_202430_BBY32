let currentUserId;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUserId = user.uid;

    displayCurrentBuddies();

    document.getElementById("friendsList").addEventListener("click", event => {
      displayCurrentBuddies();
    })

    document.getElementById("addFriends").addEventListener("click", event => {
      displayAllUsers();
    })

    document.getElementById("edit").addEventListener("click", event => {
      editCurrentBuddies();
    })

  } else {
    console.log("No User Logged In");
  }
});

async function getCurrentBuddies(userId) {
  const docRef = await db.collection("users").doc(userId).get();
  return docRef.data().friends;
}

async function getUserData(userId) {
  const docRef = await db.collection("users").doc(userId).get();
  return docRef.data();
}

function displayCurrentBuddies() {
  const buddyTemplate = document.getElementById("buddyTemplate");
  const mainContainer = document.getElementById("mainContainer");
  mainContainer.innerHTML = '';

  getCurrentBuddies(currentUserId).then(currentBuddies => {
    currentBuddies.forEach(buddyId => {
      getUserData(buddyId).then(buddyData => {
        let card = buddyTemplate.content.cloneNode(true);
        card.querySelector(".card-title").textContent = buddyData.name;
        mainContainer.appendChild(card);
      })
    })
  })
}

function displayAllUsers() {
  const buddyTemplate = document.getElementById("buddyTemplate");
  const mainContainer = document.getElementById("mainContainer");
  mainContainer.innerHTML = '';

  getCurrentBuddies(currentUserId).then(currentBuddies => {
    db.collection("users").get().then(buddiesRef => {
      buddiesRef.forEach(buddy => {
        let buddyId = buddy.id;
        let buddyData = buddy.data();

        if (buddyId !== currentUserId && !currentBuddies.includes(buddyId)) {
          let card = buddyTemplate.content.cloneNode(true);
          card.querySelector(".card-title").textContent = buddyData.name;
          card.querySelector(".btn").textContent = "Add Friend";

          card.querySelector(".btn").addEventListener("click", event => {
            addFriend(buddyId);
          })

          mainContainer.appendChild(card);
        }
      })
    })
  })
}

function editCurrentBuddies() {
  const buddyTemplate = document.getElementById("buddyTemplate");
  const mainContainer = document.getElementById("mainContainer");
  mainContainer.innerHTML = '';

  getCurrentBuddies(currentUserId).then(currentBuddies => {
    currentBuddies.forEach(buddyId => {
      getUserData(buddyId).then(buddyData => {
        let card = buddyTemplate.content.cloneNode(true);
        card.querySelector(".card-title").textContent = buddyData.name;
        card.querySelector(".btn").textContent = "Remove";

        card.querySelector(".btn").addEventListener("click", event => {
          removeFriend(buddyId);
        })

        mainContainer.appendChild(card);
      })
    })
  })
}

async function addFriend(buddyId) {
  let userDocRef = await db.collection("users").doc(currentUserId);
  let buddyDocRef = await db.collection("users").doc(buddyId);
  userDocRef.update({
    friends: firebase.firestore.FieldValue.arrayUnion(buddyId)
  })
  buddyDocRef.update({
    friends: firebase.firestore.FieldValue.arrayUnion(currentUserId)
  })
}

async function removeFriend(buddyId) {
  let userDocRef = await db.collection("users").doc(currentUserId);
  let buddyDocRef = await db.collection("users").doc(buddyId);
  userDocRef.update({
    friends: firebase.firestore.FieldValue.arrayRemove(buddyId)
  })
  buddyDocRef.update({
    friends: firebase.firestore.FieldValue.arrayRemove(currentUserId)
  })
}
