let currentUserId;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    sessionStorage.clear();
    currentUserId = user.uid;

    initialize();

    displayFriends();
    document.getElementById("btn-friends").addEventListener("click", displayFriends)

    document.getElementById("btn-suggested").addEventListener("click", displayNonFriends)

    document.getElementById("btn-edit").addEventListener("click", editFriends)

  } else {
    console.log("No User Logged In");
    window.location.href = "index.html";
  }
});

async function initialize() {
  const user = await getUserData(currentUserId);

  const profileIcon = document.querySelector(".nav-profile");

  if (user.profilePhotoBase64) {
    profile.src = user.profilePhotoBase64;
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
      .filter(user => !user.friends.includes(targetUserId) && user.id !== targetUserId);

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

/*
  Adds target and current user to each others "friends" array field
  
  @param {string} targetUserId - Id of user who current user wishes to add 
  as a friend
*/
async function addFriend(targetUserId) {
  // Get user document references
  const currentUserRef = db.collection("users").doc(currentUserId);
  const targetUserRef = db.collection("users").doc(targetUserId);

  try {
    // Add targetUserId to the current users friends array
    await currentUserRef.update({
      friends: firebase.firestore.FieldValue.arrayUnion(targetUserId)
    });

    // Remove currentUserId from the target users friends array
    await targetUserRef.update({
      friends: firebase.firestore.FieldValue.arrayUnion(currentUserId)
    });
  } catch (error) {
    console.log(`Error adding friend ${targetUserId}:`, error)
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
  const friendTemplate = document.getElementById("friend-template");
  const contentContainer = document.getElementById("content-container");
  contentContainer.innerHTML = "";

  // Retrieve users who are friends with currentUserId
  const users = await getUsersWithFriend(currentUserId);

  users.forEach(user => {
    const card = friendTemplate.content.cloneNode(true);
    const profile = card.querySelector(".friend-profile");
    card.querySelector(".friend-title").textContent = user.name;
    card.querySelector(".friend-text").textContent = "Placeholder For Recent Message";

    if (user.profilePhotoBase64) {
      profile.src = user.profilePhotoBase64;
    }

    profile.addEventListener("click", () => {
      console.log("Implement More Info Feature")
    })

    card.querySelector(".friend-body").addEventListener("click", () => {
      sessionStorage.setItem("targetUserId", user.id);
      window.location.assign("chat.html");
    })

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

  users.forEach(user => {
    const card = userTemplate.content.cloneNode(true);

    // Access and set elements within the user card
    const profile = card.querySelector(".user-profile");
    card.querySelector(".user-title").textContent = user.name;
    card.querySelector(".user-text").textContent = "Placeholder for commonalities";

    if (user.profilePhotoBase64) {
      profile.src = user.profilePhotoBase64;
    }

    // Add event listener to the profile icon to display more profile info 
    profile.addEventListener("click", () => {
      console.log("Implement More Info Feature")
    })

    // Add a event listener to friend user and redisplay addFriends
    card.querySelector(".user-button").addEventListener("click", async () => {
      await addFriend(user.id);
      displayNonFriends();
    })

    contentContainer.appendChild(card);
  })
}

/*
  Displays current user's friends. Allows user to view profile info and remove
  target users as friends.
*/
async function editFriends() {
  const userTemplate = document.getElementById("user-template");
  const contentContainer = document.getElementById("content-container");
  contentContainer.innerHTML = "";

  // Retrieve an array of friends of the current user
  const users = await getUsersWithFriend(currentUserId);

  users.forEach(user => {
    const card = userTemplate.content.cloneNode(true);

    // Access and set elements within the user card
    const profile = card.querySelector(".user-profile");
    card.querySelector(".user-title").textContent = user.name;
    card.querySelector(".user-text").textContent = "Placeholder for commonalities";
    card.querySelector(".user-button").textContent = "person_remove";

    if (user.profilePhotoBase64) {
      profile.src = user.profilePhotoBase64;
    }

    // Add event listenser to the profile icon to diplay more profile info
    profile.addEventListener("click", () => {
      console.log("Implement More Info Feature")
    })

    // Add event listener to unfriend user and redisplay editFriends
    card.querySelector(".user-button").addEventListener("click", async () => {
      await removeFriend(user.id);
      editFriends();
    })

    contentContainer.appendChild(card);
  })
}

/*
  POTENTIAL UPDATES: 
  - Add real-time listeners to auto-update when there are changes in the 
  database
  - Add lazy loading? Display 10 users and fetch more as needed
  - Change the top-navbar to include profile image, edit, and friends?
*/