let currentUserId;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUserId = user.uid;

    displayFriends();

    document.getElementById("friendsList").addEventListener("click", event => {
      displayFriends();
    })

    document.getElementById("addFriends").addEventListener("click", event => {
      displayNonFriends();
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
      .filter(user => !user.friends.includes(targetUserId) && user.id !== targetUserId);

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

  const users = await getUsersWithoutFriend(currentUserId);

  users.forEach(user => {
    const card = userTemplate.content.cloneNode(true);
    const profile = card.querySelector(".user-profile");
    card.querySelector(".user-title").textContent = user.name;
    card.querySelector(".user-text").textContent = "Placeholder for commonalities";

    if (user.profilePhotoBase64) {
      profile.src = user.profilePhotoBase64;
    }

    profile.addEventListener("click", () => {
      console.log("Implement More Info Feature")
    })

    card.querySelector(".user-button").addEventListener("click", () => {
      console.log("Add Friend")
    })

    contentContainer.appendChild(card);
  })
}

/*
  Displays all current friends, but with the option to remove them as friends
*/
async function editCurrentBuddies() {
  const userTemplate = document.getElementById("user-template");
  const contentContainer = document.getElementById("content-container");
  contentContainer.innerHTML = "";

  const users = await getUsersWithFriend(currentUserId);

  users.forEach(user => {
    const card = userTemplate.content.cloneNode(true);
    const profile = card.querySelector(".user-profile");
    card.querySelector(".user-title").textContent = user.name;
    card.querySelector(".user-text").textContent = "Placeholder for commonalities";
    card.querySelector(".user-button").textContent = "person_remove";

    if (user.profilePhotoBase64) {
      profile.src = user.profilePhotoBase64;
    }

    profile.addEventListener("click", () => {
      console.log("Implement More Info Feature")
    })

    card.querySelector(".user-button").addEventListener("click", () => {
      console.log("Remove Button")
    })

    contentContainer.appendChild(card);
  })
}
