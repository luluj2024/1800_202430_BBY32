let currentUserId;

// Check user authentication state
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    currentUserId = user.uid; // Store user ID
    displayAllFriends(); // Display friends initially
    console.log("Current User ID:", currentUserId);
  } else {
    console.log("No user is signed in.");
  }
});

function displayAllUsersDynamically() {
  let friendTemplate = document.getElementById("friend-template");
  let container = document.querySelector(".container");
  container.innerHTML = ''; // Clear container

  // Ensure currentUserId is set
  if (!currentUserId) return;

  db.collection("users").doc(currentUserId).get()
    .then(userData => {
      let friends = userData.data().friends || []; // Ensure friends is an array

      db.collection("users").get()
        .then(allUsers => {
          allUsers.forEach(user => {
            let id = user.id;
            let data = user.data();

            // Display users who are not the current user and not already friends
            if (id !== currentUserId && !friends.includes(id)) {
              let card = friendTemplate.content.cloneNode(true);

              card.querySelector(".card-title").textContent = data.name;
              card.querySelector(".userid").textContent = id;
              let addButton = card.querySelector(".btn-primary");

              addButton.textContent = "Add Friend";
              addButton.addEventListener("click", () => addFriend(id));

              container.appendChild(card);
            }
          });
        })
        .catch(error => console.error("Error retrieving all users:", error));
    })
    .catch(error => console.error("Error retrieving user data:", error));
}

function displayAllFriends() {
  let friendTemplate = document.getElementById("friend-template");
  let container = document.querySelector(".container");
  container.innerHTML = ''; // Clear container

  // Ensure currentUserId is set
  if (!currentUserId) return;

  db.collection("users").doc(currentUserId).get()
    .then(userData => {
      let friendList = userData.data().friends || [];

      if (friendList.length === 0) {
        let card = friendTemplate.content.cloneNode(true);
        card.querySelector(".card-title").textContent = "NO FRIENDS";
        container.appendChild(card);
        return;
      }

      friendList.forEach(friendId => {
        db.collection("users").doc(friendId).get()
          .then(friendData => {
            let data = friendData.data();
            let card = friendTemplate.content.cloneNode(true);

            card.querySelector(".card-title").textContent = data.name;

            container.appendChild(card);
          })
          .catch(error => console.error("Error fetching friend data:", error));
      });
    })
    .catch(error => console.error("Error retrieving user data:", error));
}

function displayAllFriendsToRemove() {
  let friendTemplate = document.getElementById("friend-template");
  let container = document.querySelector(".container");
  container.innerHTML = ''; // Clear container

  // Ensure currentUserId is set
  if (!currentUserId) return;

  db.collection("users").doc(currentUserId).get()
    .then(userData => {
      let friendList = userData.data().friends || [];

      if (friendList.length === 0) {
        let card = friendTemplate.content.cloneNode(true);
        card.querySelector(".card-title").textContent = "NO FRIENDS";
        container.appendChild(card);
        return;
      }

      friendList.forEach(friendId => {
        db.collection("users").doc(friendId).get()
          .then(friendData => {
            let data = friendData.data();
            let card = friendTemplate.content.cloneNode(true);

            card.querySelector(".card-title").textContent = data.name;
            let button = card.querySelector(".btn");

            button.classList.remove("btn-primary");
            button.classList.add("btn-warning");
            button.textContent = "Remove Friend";

            button.addEventListener("click", () => {
              removeFriend(friendId)
                .then(() => displayAllFriendsToRemove()) // Refresh after removal
                .catch(err => console.error("Error removing friend:", err));
            });

            container.appendChild(card);
          })
          .catch(error => console.error("Error fetching friend data:", error));
      });
    })
    .catch(error => console.error("Error retrieving user data:", error));
}

function removeFriend(userid) {
  console.log("Removing friend:", userid);

  const userDoc = db.collection("users").doc(currentUserId);

  return userDoc.get()
    .then(doc => {
      const friends = doc.data().friends || [];

      if (friends.includes(userid)) {
        return userDoc.update({
          friends: firebase.firestore.FieldValue.arrayRemove(userid)
        });
      } else {
        console.log("User is not a friend.");
      }
    })
    .catch(error => console.error("Error retrieving friends list:", error));
}

function addFriend(userid) {
  console.log("Adding friend:", userid);

  const userDoc = db.collection("users").doc(currentUserId);

  return userDoc.get()
    .then(doc => {
      const friends = doc.data().friends || [];

      if (!friends.includes(userid)) {
        return userDoc.update({
          friends: firebase.firestore.FieldValue.arrayUnion(userid)
        });
      } else {
        console.log("User is already a friend.");
      }
    })
    .catch(error => console.error("Error adding friend:", error));
}

// Event listeners for buttons
document.getElementById("addFriends").addEventListener("click", () => displayAllUsersDynamically());
document.getElementById("friendsList").addEventListener("click", () => displayAllFriends());
document.getElementById("edit").addEventListener("click", () => displayAllFriendsToRemove());
