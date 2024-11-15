let currentUserId;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUserId = user.uid;

    displayFriends();

    document.getElementById("friendsList").addEventListener("click", event => {
      displayFriends();
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
  Returns an array of user data objects who have the target user id in their 
  "friends" array field

  @param {string} targetUserId - Id of user whose friends you want to find

  @returns {array} - An array of user data objects or an empty array if no 
  users found or an error occurs
*/
async function getUsersWithFriend(targetUserId) {
  try {
    // Query for users whose "friends" array contains the targetUserId
    const querySnapshot = await db.collection("users")
      .where("friends", "array-contains", targetUserId)
      .get();
    
    // If the query returns no documents, return an empty array  
    if (querySnapshot.empty) {
      return [];
    }

    // Map through the documents to extract user data
    const users = querySnapshot.docs.map(doc => doc.data());

    return users;
  } catch (error) {
    console.error(`Error retrieving users with friend ${targetUserId}:`, error);
    return [];
  }
}

/*
  Returns an array of user data objects of users whose "friends" array field 
  does not contain the targetUserId 

  @param {string} targetUserId - Id of user that should be used to exclude
  users from the return

  @returns {array} - An array of user data objects or an empty array if no
  users found or an error occurs
*/
async function getUsersWithoutFriend(targetUserId) {
  try {
    const querySnapshot = await db.collection("users").get();

    // If the query returns no documents, return an empty array
    if (querySnapshot.empty) {
      return [];
    }

    // Filter array to remove users who are friends and the current user
    const users = querySnapshot.docs
      .map(doc => doc.data())
      .filter(user => !user.friends.includes(userId) && user.id !== targetUserId);

    return users;
  } catch (error) {
    console.error(`Error retrieving users without friend ${targetUserId}:`, error);
    return [];
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
  Displays the current user's friends. Presents option to view more info or 
  begin messaging.
*/
async function displayFriends() {
  const userTemplate = document.getElementById("user-template");
  const contentContainer = document.getElementById("content-container");
  contentContainer.innerHTML = '';

  // Retrieve users who are friends with currentUserId
  const users = await getUsersWithFriend(currentUserId);

  users.forEach(user => {
    const card = userTemplate.content.cloneNode(true);
    const profile = card.querySelector(".user-profile");
    card.querySelector(".user-title").textContent = user.name;
    card.querySelector(".user-text").textContent = "Placeholder For Recent Message";
    // card.querySelector(".user-button").textContent = "Message";
    if (user.profilePhotoBase64) {
      profile.src = user.profilePhotoBase64;
    }

    profile.addEventListener("click", (e) => {
      console.log("Implement More Info Feature")
    })

    card.querySelector(".user-body").addEventListener("click", (e) => {
      window.location.assign("chat.html");
    })

    contentContainer.appendChild(card);
  })
}

/*
  Displays users who are not currently friends with the current user
  Presents option to view more info or add target users as friends
*/
async function displayAllUsers() {
  const userTemplate = document.getElementById("userTemplate");
  const contentContainer = document.getElementById("contentContainer");
  contentContainer.innerHTML = '';

  const users = await getUsersWithoutFriend(currentUserId);

  users.forEach(user => {
    let card = userTemplate.content.cloneNode(true);

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

    contentContainer.appendChild(card);
  })
}

/*
  Displays all current friends, but with the option to remove them as friends
*/
async function editCurrentBuddies() {
  const userTemplate = document.getElementById("userTemplate");
  const contentContainer = document.getElementById("contentContainer");
  contentContainer.innerHTML = '';

  const users = await getUsersWithFriend(currentUserId);

  users.forEach(user => {
    let card = userTemplate.content.cloneNode(true);
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

    contentContainer.appendChild(card);
  })
}

function displayMessages(userId) {
  const messageTemplate = document.querySelector("#messageTemplate");
  const contentContainer = document.querySelector("#content-container");
  contentContainer.innerHTML = "";
  contentContainer.appendChild(messageTemplate.content.cloneNode(true));

  const messageDisplay = contentContainer.querySelector("#messageDisplay");

  listenForMessages(userId, messageDisplay);

  contentContainer.querySelector("#submitBtn").addEventListener("click", () => {
    sendMessage(userId, contentContainer);
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
            messageElement.classList.add("right-aligned-message");
          } else {
            messageElement.classList.add("bg-success");
            messageElement.classList.add("left-aligned-message");
          }

          messageDisplay.appendChild(messageElement);
        }
      });
    })
}

function sendMessage(receiverId, contentContainer) {
  const messageInput = contentContainer.querySelector("#messageInput");
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

