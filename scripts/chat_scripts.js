let currentUserId;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUserId = user.uid;

    measureFunctionTime(getCurrentBuddies);

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

async function measureFunctionTime(callback) {
  const start = Date.now();

  await callback(currentUserId);

  const end = Date.now();
  console.log(`Execution time: ${end - start} ms`);
}

// Return promise of friends array for specific user in "users" collection
async function getCurrentBuddies(userId) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      throw new Error(`User ${userId} does not exist.`);
    }

    return userDoc.data().friends;
  } catch (error) {
    console.error(`Error retrieving friends for user ${userId}:`, error);
  }
}

// Get User Data for Specific User in the "users" collection
async function getUserData(userId) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      throw new Error(`User ${userId} does not exist.`);
    }

    return userDoc.data();
  } catch (error) {
    console.error(`Error retrieving data for user ${userId}:`, error);
  }
}

async function getFavoriteRoutrNames(favoriteRoutes) {
  if (!favoriteRoutes || favoriteRoutes.length === 0) {
    return Promise.resolve("No favorite routes.");
  }

  return Promise.all(favoriteRoutes.map(routeId => {
    return db.collection("Routes").doc(routeId).get().data().name;
  })).then(routeNames => {
    return routeNames.join(", ");
  }).catch(error => {
    console.log("errors in getting route name", error);
    return "Error loading routes";
  })
}

// Updates current/other users friend array to include each other
function addFriend(friendId) {
  let userDoc = db.collection("users").doc(currentUserId);
  let friendDoc = db.collection("users").doc(friendId);

  Promise.all([
    userDoc.update({
      friends: firebase.firestore.FieldValue.arrayUnion(buddyId)
    }),
    friendDoc.update({
      friends: firebase.firestore.FieldValue.arrayUnion(currentUserId)
    })
  ])
    .catch(error => {
      console.error("Error adding friend ${friendId}:", error);
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

function friendListTemplateStyling(card, buddyData) {
  card.querySelector(".card-title").textContent = buddyData.name;
  let buttonOne = card.getElementById("buddyButtonOne");
  let buttonTwo = card.getElementById("buddyButtonTwo");
  buttonOne.textContent = "More Info";
  buttonOne.classList.toggle("btn-primary");
  buttonTwo.textContent = "Message";
  buttonTwo.classList.toggle("btn-primary");
}

function displayCurrentBuddies() {
  const buddyTemplate = document.getElementById("buddyTemplate");
  const mainContainer = document.getElementById("mainContainer");
  mainContainer.innerHTML = '';

  getCurrentBuddies
    (currentUserId).then(currentBuddies => {
      currentBuddies.forEach(buddyId => {
        getUserData(buddyId).then(buddyData => {
          let card = buddyTemplate.content.cloneNode(true);
          let birthday = card.getElementById("birthday");
          let bio = card.getElementById("bio");
          let favouriteRoutes = card.getElementById("favourite-routes");
          let isDataVidible = true;
          let photo = card.getElementById("profile-photo");
          let table = card.getElementById("table-info");

          friendListTemplateStyling(card, buddyData);

          if (buddyData.profilePhotoBase64) {
            photo.src = buddyData.profilePhotoBase64;
          }

          card.querySelector("#buddyButtonOne").addEventListener("click", () => {
            if (isDataVidible) {
              table.style.display = "table";
              birthday.innerHTML = buddyData.birthday || "N/A";
              bio.innerHTML = buddyData.description || "N/A";
              // console.log(buddyData.favorite_routes);
              getFavoriteRoutrNames(buddyData.favorite_routes).then(routeNames => {
                favouriteRoutes.innerHTML = routeNames;
              });
            } else {
              table.style.display = "none";
              birthday.innerHTML = "";
              bio.innerHTML = ""
              favouriteRoutes = "";
            }
            isDataVidible = !isDataVidible;

          })

          mainContainer.appendChild(card);
        })
      })
    })
}

function displayAllUsers() {
  const buddyTemplate = document.getElementById("buddyTemplate");
  const mainContainer = document.getElementById("mainContainer");
  mainContainer.innerHTML = '';

  getCurrentBuddies
    (currentUserId).then(currentBuddies => {
      db.collection("users").get().then(buddiesRef => {
        buddiesRef.forEach(buddy => {
          let buddyId = buddy.id;
          let buddyData = buddy.data();

          if (buddyId !== currentUserId && !currentBuddies.includes(buddyId)) {
            let card = buddyTemplate.content.cloneNode(true);
            let birthday = card.getElementById("birthday");
            let bio = card.getElementById("bio");
            let favouriteRoutes = card.getElementById("favourite-routes");
            let photo = card.getElementById("profile-photo");
            let isDataVidible = false;
            let table = card.getElementById("table-info");

            card.querySelector(".card-title").textContent = buddyData.name;
            card.querySelector("#buddyButtonOne").textContent = "Add Friend";
            card.querySelector("#buddyButtonOne").classList.toggle("btn-primary");
            card.querySelector("#buddyButtonTwo").textContent = "More Info";
            card.querySelector("#buddyButtonTwo").classList.toggle("btn-primary");

            if (buddyData.profilePhotoBase64) {
              photo.src = buddyData.profilePhotoBase64;
            }

            card.querySelector("#buddyButtonTwo").addEventListener("click", () => {
              if (!isDataVidible) {
                table.style.display = "table";
                birthday.innerHTML = buddyData.birthday || "N/A";
                bio.innerHTML = buddyData.description || "N/A";
                getFavoriteRoutrNames(buddyData.favorite_routes).then(routeNames => {
                  favouriteRoutes.innerHTML = routeNames;
                });
              } else {
                table.style.display = "none";
                birthday.innerHTML = "";
                bio.innerHTML = "";
                favouriteRoutes = "";
              }
              isDataVidible = !isDataVidible;

            })

            card.querySelector(".btn").addEventListener("click", event => {
              addFriend(buddyId);
              displayAllUsers();
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

  getCurrentBuddies
    (currentUserId).then(currentBuddies => {
      currentBuddies.forEach(buddyId => {
        getUserData(buddyId).then(buddyData => {
          let card = buddyTemplate.content.cloneNode(true);
          card.querySelector(".card-title").textContent = buddyData.name;
          card.querySelector("#buddyButtonOne").textContent = "Remove";
          card.querySelector("#buddyButtonOne").classList.toggle("btn-warning");

          card.querySelector(".btn").addEventListener("click", event => {
            removeFriend(buddyId);
            editCurrentBuddies();
          })

          mainContainer.appendChild(card);
        })
      })
    })
}

