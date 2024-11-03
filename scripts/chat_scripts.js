let currentUserId;

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in.
    currentUserId = user.uid; // Access the user ID here
    displayAllFriends();
    console.log(currentUserId);
  } else {
    // No user is signed in.
    console.log("No user is signed in.");
  }
});

function displayAllUsersDynamically() {
  let friendTemplate = document.getElementById("friend-template");
  let container = document.querySelector(".container");

  container.innerHTML = '';

  db.collection("users").get().then(allUsers => {
    allUsers.forEach(user => {
      let id = user.id;
      let data = user.data();
      if (id !== currentUserId) {
        let card = friendTemplate.content.cloneNode(true);

        card.querySelector(".card-title").textContent = data.name;
        card.querySelector(".userid").textContent = id
        card.querySelector(".btn-primary").textContent = "Add Friend";
        card.querySelector(".btn-primary").addEventListener("click", () => {
          addFriend(id)
        })

        container.appendChild(card)
      }
    })
  })
}

function displayAllFriends() {
  let friendTemplate = document.getElementById("friend-template");
  let container = document.querySelector(".container");

  db.collection("users").doc(currentUserId).get().then(userData => {
    let friendList = userData.data().friends;
    container.innerHTML = '';

    if (friendList.length == 0) {
      let card = friendTemplate.content.cloneNode(true);
      card.querySelector(".card-title").textContent = "NO FRIENDS";
      container.appendChild(card)
      return;
    }

    friendList.forEach(friendId => {
      db.collection("users").doc(friendId).get().then(friendData => {
        let data = friendData.data();
        let card = friendTemplate.content.cloneNode(true);

        card.querySelector(".card-title").textContent = data.name;

        container.appendChild(card)
      })
    })
  })
}

function addFriend(userid) {
  console.log(currentUserId);
  console.log(userid);

  const userDoc = db.collection("users").doc(currentUserId);

  userDoc.get()
    .then((doc) => {
      const friends = doc.data().friends;

      if (!friends.includes(userid)) {
        userDoc.update({
          friends: firebase.firestore.FieldValue.arrayUnion(userid)
        })
      } else {
        console.log("User is already a friend.");
      }
    })
}

document.getElementById("addFriends").addEventListener("click", e => {
  displayAllUsersDynamically();
})

document.getElementById("friendsList").addEventListener("click", e => {
  displayAllFriends();
})
