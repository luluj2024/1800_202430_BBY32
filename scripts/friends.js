let currentUserId;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    sessionStorage.clear();
    currentUserId = user.uid;

    initialize();

    displayFriends();

    document.getElementById("btn-friends").addEventListener("click", displayFriends)

    document.getElementById("btn-suggested").addEventListener("click", displayNonFriends)

    document.getElementById("btn-pending").addEventListener("click", displayPendingUsers)

  } else {
    console.log("No User Logged In");
    window.location.href = "index.html";
  }
});

async function initialize() {
  const user = await getUserData(currentUserId);

  const profileIcon = document.querySelector(".nav-profile");

  if (user.profilePhotoBase64) {
    profileIcon.src = user.profilePhotoBase64;
  }
}

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

    // Return empty array if query returns no documents
    if (querySnapshot.empty) {
      return [];
    }

    // Map new array of user document data 
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

    // Returns empty array if query returns no documents
    if (querySnapshot.empty) {
      return [];
    }

    // Filter out the target user themself and their friends
    const users = querySnapshot.docs
      .map(doc => doc.data())
      .filter(user =>
        !user.friends.includes(targetUserId) &&
        user.id !== targetUserId &&
        !user.requestsReceived.includes(targetUserId) &&
        !user.requestsSent.includes(targetUserId)
      );

    return users;
  } catch (error) {
    console.error(`Error retrieving users without friend ${targetUserId}:`, error);
    return [];
  }
}

/*
  Returns user data object of target user id

  @param {string} targetUserId - Id of target user
  @returns {object} - An object containing all fields of the target user
*/
async function getUserData(targetUserId) {
  try {
    const docRef = await db.collection("users").doc(targetUserId).get();

    // Returns null if retrieved document doesn't exist
    if (docRef.empty) {
      return null;
    }

    return docRef.data();
  } catch (error) {
    console.error(`Error returning user data ${targetUserId}`, error);
    return null;
  }
}

async function getReceivedRequests(userId) {
  try {
    const docRef = await db.collection("users").doc(userId).get();

    // Returns null if retrieved document doesn't exist
    if (docRef.empty) {
      return [];
    }

    return docRef.data().requestsReceived;
  } catch (error) {
    console.error(`Error returning user data ${userId}`, error);
    return [];
  }
}

async function getSentRequests(userId) {
  try {
    const docRef = await db.collection("users").doc(userId).get();

    // Returns null if retrieved document doesn't exist
    if (docRef.empty) {
      return [];
    }

    return docRef.data().requestsSent;
  } catch (error) {
    console.error(`Error returning user data ${userId}`, error);
    return [];
  }
}

/*
  Adds target and current user to each others "friends" array field
  
  @param {string} targetUserId - Id of user who current user wishes to add 
  as a friend
*/
async function sendFriendRequest(targetUserId) {
  // Get user document references
  const currentUserRef = db.collection("users").doc(currentUserId);
  const targetUserRef = db.collection("users").doc(targetUserId);

  try {
    // Add targetUserId to the current users friends array
    await currentUserRef.update({
      requestsSent: firebase.firestore.FieldValue.arrayUnion(targetUserId)
    });

    // Remove currentUserId from the target users friends array
    await targetUserRef.update({
      requestsReceived: firebase.firestore.FieldValue.arrayUnion(currentUserId)
    });
  } catch (error) {
    console.log(`Error adding friend ${targetUserId}:`, error)
  }
}

async function acceptFriendRequest(targetUserId) {
  // Get user document references
  const currentUserRef = db.collection("users").doc(currentUserId);
  const targetUserRef = db.collection("users").doc(targetUserId);

  try {
    // Add targetUserId to the current users friends array
    await currentUserRef.update({
      requestsReceived: firebase.firestore.FieldValue.arrayRemove(targetUserId),
      friends: firebase.firestore.FieldValue.arrayUnion(targetUserId)
    });

    // Remove currentUserId from the target users friends array
    await targetUserRef.update({
      requestsSent: firebase.firestore.FieldValue.arrayRemove(currentUserId),
      friends: firebase.firestore.FieldValue.arrayUnion(currentUserId)
    });
  } catch (error) {
    console.log(`Error adding friend ${targetUserId}:`, error)
  }
}

async function rejectFriendRequest(targetUserId) {
  // Get user document references
  const currentUserRef = db.collection("users").doc(currentUserId);
  const targetUserRef = db.collection("users").doc(targetUserId);

  try {
    // Add targetUserId to the current users friends array
    await currentUserRef.update({
      requestsReceived: firebase.firestore.FieldValue.arrayRemove(targetUserId)
    });

    // Remove currentUserId from the target users friends array
    await targetUserRef.update({
      requestsSent: firebase.firestore.FieldValue.arrayRemove(currentUserId)
    });
  } catch (error) {
    console.log(`Error adding friend ${targetUserId}:`, error)
  }
}

async function cancelFriendRequest(userId) {
  // Get user document references
  const currentUserRef = db.collection("users").doc(currentUserId);
  const targetUserRef = db.collection("users").doc(userId);

  try {
    // Add targetUserId to the current users friends array
    await currentUserRef.update({
      requestsSent: firebase.firestore.FieldValue.arrayRemove(userId)
    });

    // Remove currentUserId from the target users friends array
    await targetUserRef.update({
      requestsReceived: firebase.firestore.FieldValue.arrayRemove(currentUserId)
    });
  } catch (error) {
    console.log(`Error adding friend ${userId}:`, error)
  }
}

/*
  Removes target and current user from each others "friends" array field

  @param {string} targetUserId - Id of user who current user wishes to remove
  as a friend
*/
async function removeFriend(targetUserId) {
  // Get user document references
  let currentUserRef = db.collection("users").doc(currentUserId);
  let targetUserRef = db.collection("users").doc(targetUserId);

  try {
    // Remove targetUserId from the current user's friends array
    await currentUserRef.update({
      friends: firebase.firestore.FieldValue.arrayRemove(targetUserId)
    });

    // Remove currentUserId from the target user's friends array
    await targetUserRef.update({
      friends: firebase.firestore.FieldValue.arrayRemove(currentUserId)
    });
  } catch (error) {
    console.log(`Error removing friend ${targetUserId}:`, error);
  }
}

/* 
  Returns Function returns all the favorite routes' names of a specified userId.
*/
async function getFavoritedRoutes(favoriteRoutes) {
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
  Displays the current user's friends. Allows user to view profile info and 
  begin messaging.
*/
async function displayFriends() {
  const friendTemplate = document.getElementById("user-template");
  const contentContainer = document.getElementById("content-container");
  contentContainer.innerHTML = "";

  // Retrieve users who are friends with currentUserId
  const users = await getUsersWithFriend(currentUserId);

  if (users.length === 0) {
    const noUsersContainer = document.getElementById("no-users-template").content.cloneNode(true);
    noUsersContainer.querySelector("h3").textContent = "No Friends Found";
    noUsersContainer.querySelector("h4").textContent = "Go To Suggested To Send Friend Requests";
    contentContainer.appendChild(noUsersContainer);
    return;
  }

  users.forEach(user => {
    const card = friendTemplate.content.cloneNode(true);

    styleFriends(user, card)

    contentContainer.appendChild(card);
  })
}

/*
  Displays users who are not currently friends with the current user.
  Allows user to view profile info and add target users as friends.
*/
async function displayNonFriends() {
  const userTemplate = document.getElementById("user-template");
  const contentContainer = document.getElementById("content-container");
  contentContainer.innerHTML = "";

  // Retrieve an array of non-friends of the current user
  const users = await getUsersWithoutFriend(currentUserId);

  if (users.length === 0) {
    const noUsersContainer = document.getElementById("no-users-template").content.cloneNode(true);
    noUsersContainer.querySelector("h3").textContent = "No Users To Friend";
    contentContainer.appendChild(noUsersContainer);
    return;
  }

  users.forEach(user => {
    const card = userTemplate.content.cloneNode(true);

    styleNonFriends(user, card);

    contentContainer.appendChild(card);
  })
}

async function displayPendingUsers() {
  const userTemplate = document.getElementById("user-template");
  const contentContainer = document.getElementById("content-container");
  contentContainer.innerHTML = "";

  const receivedRequests = await getReceivedRequests(currentUserId);
  const sentRequests = await getSentRequests(currentUserId);

  console.log(receivedRequests);
  console.log(sentRequests);

  if (receivedRequests.length === 0 && sentRequests.length === 0) {
    const noUsersContainer = document.getElementById("no-users-template").content.cloneNode(true);
    noUsersContainer.querySelector("h3").textContent = "No Pending Requests";
    contentContainer.appendChild(noUsersContainer);
    return;
  }



  receivedRequests.forEach(async (userId) => {
    const userData = await getUserData(userId);

    const card = userTemplate.content.cloneNode(true);

    styleReceived(userData, card);

    contentContainer.appendChild(card);
  })



  sentRequests.forEach(async (userId) => {
    const userData = await getUserData(userId);

    const card = userTemplate.content.cloneNode(true);

    styleSent(userData, card);

    contentContainer.appendChild(card);
  })
}

function styleFriends(user, card) {
  const profile = card.querySelector(".user-profile");
  card.querySelector(".user-name").textContent = user.name;
  card.querySelector(".user-message").textContent = "Placeholder For Message";

  if (user.profilePhotoBase64) {
    profile.src = user.profilePhotoBase64;
  }

  const buttonContainer = card.querySelector(".buttons-container");
  const button = card.querySelector(".btn-friends")
  const button2 = button.cloneNode(true);
  button.textContent = "chat";
  button2.textContent = "person_remove";

  button.addEventListener("click", async () => {
    sessionStorage.setItem("targetUserId", user.id);
    window.location.assign("chat.html");
  })

  button2.addEventListener("click", async () => {
    await removeFriend(user.id);
    displayFriends();
  })

  buttonContainer.appendChild(button2);
}

function styleNonFriends(user, card) {
  const profile = card.querySelector(".user-profile");
  card.querySelector(".user-name").textContent = user.name;
  card.querySelector(".user-bio").textContent = "Placeholder";

  if (user.profilePhotoBase64) {
    profile.src = user.profilePhotoBase64;
  }

  const button = card.querySelector(".btn-friends")
  button.textContent = "person_add";

  button.classList.add("btn-padding");

  button.addEventListener("click", async () => {
    await sendFriendRequest(user.id);
    displayNonFriends();
  })
}

function styleSent(user, card) {
  const profile = card.querySelector(".user-profile");
  card.querySelector(".user-name").textContent = user.name;
  card.querySelector(".user-bio").textContent = "Placeholder";

  if (user.profilePhotoBase64) {
    profile.src = user.profilePhotoBase64;
  }

  const buttonContainer = card.querySelector(".buttons-container");
  const button = buttonContainer.querySelector(".btn-friends");
  button.textContent = "remove";
  button.classList.add("btn-padding");

  button.addEventListener("click", async () => {
    await cancelFriendRequest(user.id);
    displayPendingUsers();
  })
}

function styleReceived(user, card) {
  const profile = card.querySelector(".user-profile");
  card.querySelector(".user-name").textContent = user.name;
  card.querySelector(".user-bio").textContent = "Placeholder";

  if (user.profilePhotoBase64) {
    profile.src = user.profilePhotoBase64;
  }

  const buttonContainer = card.querySelector(".buttons-container");
  const button = buttonContainer.querySelector(".btn-friends");
  const button2 = button.cloneNode(true);
  button.textContent = "add";
  button.classList.add("btn-padding");
  button2.classList.add("btn-padding");
  button2.textContent = "remove";

  button.addEventListener("click", async () => {
    await acceptFriendRequest(user.id);
    displayPendingUsers();
  })

  button2.addEventListener("click", async () => {
    await rejectFriendRequest(user.id);
    displayPendingUsers();
  })

  buttonContainer.appendChild(button2);
}

/*
  POTENTIAL UPDATES: 
  - Make the icons more responsive to user interactions
  - Possibly integrate edit into friends
  - Show profile on the right of the navbar to align with other designs
  - Fix up placeholder, for friends showcase recent message or placeholder message text,
  for new users show placeholder text "a lasting friendship is only a click away", or show
  what routes they have in common. 
*/