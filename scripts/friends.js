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
  Returns array of user data objects with userId in their "friends" field

  @param {string} userId - Id of user whose friends you want to find

  @returns {array} - Array of user data objects or an empty array if an error 
  occurs
*/
async function getUsersWithFriend(userId) {
  try {
    // Query for users with "friends" fields containing userId 
    const querySnapshot = await db.collection("users")
      .where("friends", "array-contains", userId)
      .get();

    // Map new array of user data 
    const users = querySnapshot.docs.map(doc => doc.data());

    return users;
  } catch (error) {
    console.error(`Error retrieving users with friend ${userId}:`, error);
    return [];
  }
}

/*
  Returns array of user data objects with "friends" field not containg userId

  @param {string} userId - Id of user used to exclude users in return

  @returns {array} - Array of user data objects or an empty array if an error 
  occurs
*/
async function getUsersWithoutFriend(userId) {
  try {
    const querySnapshot = await db.collection("users").get();

    const users = querySnapshot.docs
      .map(doc => doc.data())
      .filter(user =>
        user.id !== userId &&
        !user.friends.includes(userId) && // Filter out if already friends
        !user.requestsReceived.includes(userId) && // Filter if friend request sent
        !user.requestsSent.includes(userId) // Filter if friend request received
      );

    return users;
  } catch (error) {
    console.error(`Error retrieving users without friend ${userId}:`, error);
    return [];
  }
}

/*
  Returns user data of userId

  @param {string} userId - Id of user whose data you want
  @returns {object} - Object containing user data or null if an error occurs
*/
async function getUserData(userId) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();

    return userDoc.data();
  } catch (error) {
    console.error(`Error returning user data ${userId}`, error);
    return null;
  }
}

/*
  Returns array of user data objects of users who have sent a friend request 
  to current user

  @param {string} userId - Id of user to check incoming requests for
  @returns {array} - Array of user data objects or an empty array if an error 
  occurs
*/
async function getIncomingRequests(userId) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();

    // Retrieve user ids of incoming friend requests 
    const incomingRequestIds = await userDoc.data().requestsReceived;

    // Map array of user data of incoming friend requests
    const incomingRequestUsers = await Promise.all(
      incomingRequestIds.map(userId => getUserData(userId))
    );

    return incomingRequestUsers;
  } catch (error) {
    console.error(`Error returning user data ${userId}`, error);
    return [];
  }
}

/*
  Returns array of user data objects of users who have received a friend 
  request from current user

  @param {string} userId - Id of user to check sent requests for
  @returns {array} - Array of user data objects or an empty array if an error 
  occurs
*/
async function getOutgoingRequests(userId) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();

    // Retrieve user ids of sent friend requests 
    const outgoingRequestIds = await userDoc.data().requestsSent;

    // Map array of user data of sent friend requests
    const outgoingRequestUsers = await Promise.all(
      outgoingRequestIds.map(userId => getUserData(userId))
    );

    return outgoingRequestUsers;
  } catch (error) {
    console.error(`Error returning user data ${userId}`, error);
    return [];
  }
}

/*
  Returns latest message data between current user and target user
  @param {string} userId - Id of user to check messages between
  @returns {object} - An object containing users, text, and timestamp
*/
async function getLatestMessage(userId) {
  try {
    const querySnapshot = await db.collection("messages")
      .where("users", "array-contains", currentUserId)
      .orderBy("timestamp")
      .get()

    const messages = querySnapshot.docs
      .map(doc => doc.data())
      .filter(message => message.users.includes(userId));

    return messages[messages.length-1];

  } catch (error) {
    console.error(`Error getting latest message to ${userId}:`, error);
  }
}

/*
  Update firebase fields defined updates of user id 
  @param {string} userId - Id of user who needs database updating
  @param {object} updates - field and action to be taken to update
*/
async function updateFirebase(userId, updates) {
  try {
    const userRef = db.collection("users").doc(userId);
    await userRef.update(updates);
  } catch (error) {
    console.error(`Error updating user ${userId} fields:`, error);
  }
}

/*
  Adds current user to "requestsReceived" array field of target user id and adds
  target user id to current user "requestsSent" array field
  
  @param {string} userId - Id of user to send a friend request to
*/
async function sendFriendRequest(targetUserId) {
  try {
    // Adding target user id to current users "requestsSent" field
    updateFirebase(currentUserId, {
      requestsSent: firebase.firestore.FieldValue.arrayUnion(targetUserId)
    });

    // Add current user id to target users "requestsReceived" field 
    updateFirebase(targetUserId, {
      requestsReceived: firebase.firestore.FieldValue.arrayUnion(currentUserId)
    });
  } catch (error) {
    console.error(`Error adding friend ${targetUserId}:`, error)
  }
}

/*
  Add current and target user to each others "friends" array field and remove
  themselves from their "requestsSent" and "requestsReceived" array fields

  @param {string} targetUserId - Id of user who current user wishes to accept
  friend request from
*/
async function acceptFriendRequest(targetUserId) {
  try {
    // Add targetUserId to the current users friends array
    updateFirebase(currentUserId, {
      requestsReceived: firebase.firestore.FieldValue.arrayRemove(targetUserId),
      friends: firebase.firestore.FieldValue.arrayUnion(targetUserId)
    });

    // Remove currentUserId from the target users friends array
    updateFirebase(targetUserId, {
      requestsSent: firebase.firestore.FieldValue.arrayRemove(currentUserId),
      friends: firebase.firestore.FieldValue.arrayUnion(currentUserId)
    });
  } catch (error) {
    console.error(`Error adding friend ${targetUserId}:`, error)
  }
}

/*
  Remove target user id from current users "requestsReceived" array field and 
  remove current user id from the target users "requestsSent" array field

  @param {string} targetUserId - Id of user who current user wishes to reject
  friend request from
*/
async function rejectFriendRequest(targetUserId) {
  try {
    // Remove target user id from current users "requestsReceived" field
    updateFirebase(currentUserId, {
      requestsReceived: firebase.firestore.FieldValue.arrayRemove(targetUserId)
    });

    // Remove current user id from target users "requestsSent" field
    updateFirebase(targetUserId, {
      requestsSent: firebase.firestore.FieldValue.arrayRemove(currentUserId)
    });
  } catch (error) {
    console.error(`Error adding friend ${targetUserId}:`, error)
  }
}

/*
  Remove target user id from current users "requestsSent" array field and
  remove current user id from target users "requestReceived" array field

  @param {string} targetUserId - Id of user who current user wishes to recind
  their friend request
*/
async function cancelFriendRequest(targetUserId) {
  try {
    updateFirebase(currentUserId, {
      requestsSent: firebase.firestore.FieldValue.arrayRemove(targetUserId)
    });

    updateFirebase(targetUserId, {
      requestsReceived: firebase.firestore.FieldValue.arrayRemove(currentUserId)
    });
  } catch (error) {
    console.error(`Error adding friend ${targetUserId}:`, error)
  }
}

/*
  Removes current and target user from each others "friends" array field

  @param {string} targetUserId - Id of user which the current user wishes to 
  remove as a friend
*/
async function removeFriend(targetUserId) {
  let currentUserRef = db.collection("users").doc(currentUserId);
  let targetUserRef = db.collection("users").doc(targetUserId);

  try {
    // Remove target user id from current users "friends" array field
    await currentUserRef.update({
      friends: firebase.firestore.FieldValue.arrayRemove(targetUserId)
    });

    // Remove current user id from target users "friends" array
    await targetUserRef.update({
      friends: firebase.firestore.FieldValue.arrayRemove(currentUserId)
    });
  } catch (error) {
    console.error(`Error removing friend ${targetUserId}:`, error);
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
    console.error(`Error in getting favorite routes for ${currentUserId}`, error);
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

  for (const user of users) {
    const card = friendTemplate.content.cloneNode(true);
    const message = await getLatestMessage(user.id);

    styleFriends(user, card, message)
    
    contentContainer.appendChild(card);
  }
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

  const receivedRequests = await getIncomingRequests(currentUserId);
  const sentRequests = await getOutgoingRequests(currentUserId);

  if (receivedRequests.length === 0 && sentRequests.length === 0) {
    const noUsersContainer = document.getElementById("no-users-template").content.cloneNode(true);
    noUsersContainer.querySelector("h3").textContent = "No Pending Requests";
    contentContainer.appendChild(noUsersContainer);
    return;
  }

  receivedRequests.forEach((user) => {
    const card = userTemplate.content.cloneNode(true);

    styleReceived(user, card);

    contentContainer.appendChild(card);
  })

  sentRequests.forEach(user => {
    const card = userTemplate.content.cloneNode(true);

    styleSent(user, card);

    contentContainer.appendChild(card);
  })
}

function styleFriends(user, card, message) {
  const profile = card.querySelector(".user-profile");
  card.querySelector(".user-name").textContent = user.name;
  if (message) {
  card.querySelector(".user-message").textContent = message.text;
  }
  if (user.profilePhotoBase64) {
    profile.src = user.profilePhotoBase64;
  }

  profile.addEventListener("click", () => {
    Swal.fire({
      title: user.name,
      text: user.birthday,
      text: user.description,
      imageUrl: profile.src,
      imageWidth: 200,
      imageHeight: 200,
      imageAlt: "Custom image"
    });
  })

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
  card.querySelector(".user-message").innerHTML = "Send a friend request to begin messaging!";

  if (user.profilePhotoBase64) {
    profile.src = user.profilePhotoBase64;
  }

  profile.addEventListener("click", () => {
    Swal.fire({
      title: user.name,
      text: user.birthday,
      text: user.description,
      imageUrl: profile.src,
      imageWidth: 200,
      imageHeight: 200,
      imageAlt: "Custom image"
    });
  })

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
  card.querySelector(".user-message").innerHTML = "Wait for the person to add you back!";

  if (user.profilePhotoBase64) {
    profile.src = user.profilePhotoBase64;
  }

  profile.addEventListener("click", () => {
    Swal.fire({
      title: user.name,
      text: user.birthday,
      text: user.description,
      imageUrl: profile.src,
      imageWidth: 200,
      imageHeight: 200,
      imageAlt: "Custom image"
    });
  })

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
  card.querySelector(".user-message").innerHTML = "Add or reject a new friend!";

  if (user.profilePhotoBase64) {
    profile.src = user.profilePhotoBase64;
  }

  profile.addEventListener("click", () => {
    Swal.fire({
      title: user.name,
      text: user.birthday,
      text: user.description,
      imageUrl: profile.src,
      imageWidth: 200,
      imageHeight: 200,
      imageAlt: "Custom image"
    });
  })

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
  - Fix up placeholder, for friends showcase recent message or placeholder message text,
  for new users show placeholder text "a lasting friendship is only a click away", or show
  what routes they have in common. 
*/