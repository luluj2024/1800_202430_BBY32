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
    window.location.href = "index.html";
  }
});

/*
  Returns an array of user data objects who have a 
  specific user id in their "friends" array field 
*/
async function getUsersWithFriend(userId) {
  try {
    // Query documents for users whose "friends" field contains user id
    const docsRef = await db.collection("users")
      .where("friends", "array-contains", userId).get();

    // Map over documents to create an array of user data objects
    const users = docsRef.docs.map(doc => doc.data());
    return users;
  } catch (error) {
    console.error(`Error retrieving users with friend ${userId}:`, error);
  }
}

/*
  Returns an array of user data objects who do not 
  have a specific user id in their "friends" array field
*/
async function getUsersWithoutFriend(userId) {
  try {
    const docsRef = await db.collection("users").get();

    // Filter array to remove users who are friends and the current user
    const users = docsRef.docs
      .map(doc => doc.data())
      .filter(user => !user.friends.includes(userId) && user.id !== currentUserId);

    return users;
  } catch (error) {
    console.error(`Error retrieving users with friend ${userId}:`, error);
  }
}

/* 
  Function returns user data (fields) of specified userId
  Throws an error if user document doesn't exist
  All errors are caught and logged 
*/
async function getUserData(userId) {
  try {
    // Gets user specific document from the "users" collection
    const userDoc = await db.collection("users").doc(userId).get();

    // Throws error is userDoc doesn't exist 
    if (!userDoc.exists) {
      throw new Error(`User ${userId} does not exist.`);
    }

    return userDoc.data();
  } catch (error) {
    console.error(`Error retrieving data for user ${userId}:`, error);
  }
}

/* 
  Function returns all the favorite routes' names of a specified userId.
  All errors are caught and logged 
*/
async function getFavoriteRoutrNames(favoriteRoutes) {
  if (!favoriteRoutes || favoriteRoutes.length === 0) {
    return "No favorite routes.";
  }

  try {
    const routeNames = await Promise.all(favoriteRoutes.map(async (routeId) => {
      const routeDoc = await db.collection("Routes").doc(routeId).get();
      return routeDoc.data().name;
    }))
    return routeNames.join(", ");
  } catch (error) {
    console.log(`error in getting favorite routes for ${currentUserId}`, error);
    return "Error loading routes";
  }
}

/*
  Adds specified user as a friend by updating "friends" 
  field of both the current user and the target user
*/
function addFriend(friendId) {
  let userDoc = db.collection("users").doc(currentUserId);
  let friendDoc = db.collection("users").doc(friendId);

  Promise.all([
    userDoc.update({
      friends: firebase.firestore.FieldValue.arrayUnion(friendId)
    }),
    friendDoc.update({
      friends: firebase.firestore.FieldValue.arrayUnion(currentUserId)
    })
  ])
    .catch(error => {
      console.log(`Error adding friend ${friendId}:`, error);
    })
}

/*
  Removes specified user as a friend by updating "friends"
  field of both current user and target user
*/
async function removeFriend(userId) {
  let userDoc = await db.collection("users").doc(currentUserId);
  let buddyDoc = await db.collection("users").doc(userId);

  Promise.all([
    userDoc.update({
      friends: firebase.firestore.FieldValue.arrayRemove(userId)
    }),
    buddyDoc.update({
      friends: firebase.firestore.FieldValue.arrayRemove(currentUserId)
    })
  ]).catch(error => {
    console.log(`Error deleting friend ${friendId}:`, error);
  })

}

/*
  Style for the template card.
*/
function templateStyling(card, user) {
  card.querySelector(".card-title").textContent = user.name;
  let photo = card.querySelector("#profile-photo");

  if (user.profilePhotoBase64) {
    photo.src = user.profilePhotoBase64;
  }

  const [buttonOne, buttonTwo] = [
    card.querySelector("#buddyButtonOne"),
    card.querySelector("#buddyButtonTwo")
  ];

  buttonOne.textContent = "More Info";
  buttonOne.classList.add("btn-primary");
  buttonTwo.textContent = "Message";
  buttonTwo.classList.add("btn-primary");
}

/*
  Displays the current user's friends 
  Presents option to view more info or begin messaging
*/
async function displayCurrentBuddies() {
  const buddyTemplate = document.getElementById("buddyTemplate");
  const mainContainer = document.getElementById("mainContainer");
  mainContainer.innerHTML = '';

  const users = await getUsersWithFriend(currentUserId);

  users.forEach(user => {
    let card = buddyTemplate.content.cloneNode(true);

    let table = card.querySelector("#table-info");
    let birthday = card.getElementById("birthday");
    let bio = card.getElementById("bio");
    let favouriteRoutes = card.getElementById("favourite-routes");

    let isDataVisible = true;

    templateStyling(card, user);

    // show user's info when click the "more info" button
    card.querySelector("#buddyButtonOne").addEventListener("click", async () => {
      if (isDataVisible) {
        table.style.display = "table";
        birthday.innerHTML = user.birthday || "N/A";
        bio.innerHTML = user.description || "N/A";
        const routes = await getFavoriteRoutrNames(user.favorite_routes)
        favouriteRoutes.innerHTML = routes;
      } else {
        table.style.display = "none";
      }
      isDataVisible = !isDataVisible;
    })

    card.querySelector("#buddyButtonTwo").addEventListener("click", () => {
      displayMessages(user.id);
    })

    mainContainer.appendChild(card);
  })
}

/*
  Displays users who are not currently friends with the current user
  Presents option to view more info or add target users as friends
*/
async function displayAllUsers() {
  const buddyTemplate = document.getElementById("buddyTemplate");
  const mainContainer = document.getElementById("mainContainer");
  mainContainer.innerHTML = '';

  const users = await getUsersWithoutFriend(currentUserId);

  users.forEach(user => {
    let card = buddyTemplate.content.cloneNode(true);

    let birthday = card.getElementById("birthday");
    let bio = card.getElementById("bio");
    let favouriteRoutes = card.getElementById("favourite-routes");
    let photo = card.getElementById("profile-photo");
    let isDataVisible = false;
    let table = card.getElementById("table-info");

    card.querySelector(".card-title").textContent = user.name;
    card.querySelector("#buddyButtonOne").textContent = "Add Friend";
    card.querySelector("#buddyButtonOne").classList.toggle("btn-primary");
    card.querySelector("#buddyButtonTwo").textContent = "More Info";
    card.querySelector("#buddyButtonTwo").classList.toggle("btn-primary");

    if (user.profilePhotoBase64) {
      photo.src = user.profilePhotoBase64;
    }

    card.querySelector("#buddyButtonTwo").addEventListener("click", async () => {
      if (!isDataVisible) {
        table.style.display = "table";
        birthday.innerHTML = user.birthday || "N/A";
        bio.innerHTML = user.description || "N/A";
        const routes = await getFavoriteRoutrNames(user.favorite_routes);
        favouriteRoutes.innerHTML = routes;
      } else {
        table.style.display = "none";
      }
      isDataVisible = !isDataVisible;
    })

    card.querySelector("#buddyButtonOne").addEventListener("click", event => {
      addFriend(user.id);
      displayAllUsers();
    })

    mainContainer.appendChild(card);
  })
}

/*
  Displays all current friends, but with the option to remove them as friends
*/
async function editCurrentBuddies() {
  const buddyTemplate = document.getElementById("buddyTemplate");
  const mainContainer = document.getElementById("mainContainer");
  mainContainer.innerHTML = '';

  const users = await getUsersWithFriend(currentUserId);

  users.forEach(user => {
    let card = buddyTemplate.content.cloneNode(true);
    card.querySelector(".card-title").textContent = user.name;
    card.querySelector("#buddyButtonOne").textContent = "Remove";
    card.querySelector("#buddyButtonOne").classList.toggle("btn-warning");
    let photo = card.querySelector("#profile-photo");

    if (user.profilePhotoBase64) {
      photo.src = user.profilePhotoBase64;
    }

    card.querySelector(".btn").addEventListener("click", event => {
      removeFriend(user.id);
      editCurrentBuddies();
    })

    mainContainer.appendChild(card);
  })
}

function displayMessages(userId) {
  const messageTemplate = document.querySelector("#messageTemplate");
  const mainContainer = document.querySelector("#mainContainer");
  mainContainer.innerHTML = "";
  mainContainer.appendChild(messageTemplate.content.cloneNode(true));

  const messageDisplay = mainContainer.querySelector("#messageDisplay");

  listenForMessages(userId, messageDisplay);

  mainContainer.querySelector("#submitBtn").addEventListener("click", () => {
    sendMessage(userId, mainContainer);
  });
}

function listenForMessages(userId, messageDisplay) {
  db.collection("messages")
    .where("users", "array-contains", currentUserId)  // Only messages between the currentUserId
    .orderBy("timestamp") // Order by timestamp
    .onSnapshot(snapshot => {
      messageDisplay.innerHTML = ""; // Clear existing messages

      snapshot.forEach(doc => {
        const message = doc.data();

        // Ensure that both userId and currentUserId are part of the message's users array
        if (message.users.includes(currentUserId) && message.users.includes(userId)) {
          const messageElement = document.createElement("p");
          messageElement.textContent = message.text;

        if (message.users[0] === currentUserId) {
          messageElement.classList.add("bg-primary");
        } else {
          messageElement.classList.add("bg-success");
        }

          messageDisplay.appendChild(messageElement);
        }
      });
    })
}

function sendMessage(receiverId, mainContainer) {
  const messageInput = mainContainer.querySelector("#messageInput");
  const message = messageInput.value.trim();

  if (message) {
    const messagesRef = db.collection("messages");
    messagesRef.add({
      users: [currentUserId, receiverId],
      text: message,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      messageInput.value = "";
    }).catch((error) => {
      console.error("Error sending message: ", error);
    });
  }
}

