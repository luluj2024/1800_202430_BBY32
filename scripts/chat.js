const targetUserId = sessionStorage.getItem('targetUserId');
const targetRouteId = sessionStorage.getItem('targetRouteId');

let currentUserId;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUserId = user.uid;

    console.log(`Signed In: ${currentUserId}`);
    console.log(`Friend: ${targetUserId}`);
    console.log(`Route: ${targetRouteId}`);

    displayMessages();

  } else {
    console.log("No User Logged In");
    window.location.href = "index.html";
  }
});

function getTime(timestamp) {
  let milliseconds = timestamp.seconds * 1000;
  let date = new Date(milliseconds);

  let formattedDateTime = date.toLocaleString();
  return formattedDateTime;
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

async function createMessageForUsers(userMessageData) {
  const sender = await getUserData(userMessageData.users[0]);

  if (sender.id === currentUserId) {
    let message = document.getElementById("right-message").content.cloneNode(true);
    message.querySelector(".title").textContent = sender.name;
    message.querySelector(".text").textContent = userMessageData.text;
    message.querySelector(".time").textContent = getTime(userMessageData.timestamp);

    return message;
  } else {
    let message = document.getElementById("left-message").content.cloneNode(true);
    message.querySelector(".title").textContent = sender.name;
    message.querySelector(".text").textContent = userMessageData.text;
    message.querySelector(".time").textContent =  getTime(userMessageData.timestamp);

    return message;
  }
}

async function createMessageForGroup(groupMessageData) {
  const sender = await getUserData(groupMessageData.sender);

  if (sender.id === currentUserId) {
    let message = document.getElementById("right-message").content.cloneNode(true);
    message.querySelector(".title").textContent = sender.name;
    message.querySelector(".text").textContent = groupMessageData.text;
    message.querySelector(".time").textContent = getTime(groupMessageData.timestamp);

    return message;
  } else {
    let message = document.getElementById("left-message").content.cloneNode(true);
    message.querySelector(".title").textContent = sender.name;
    message.querySelector(".text").textContent = groupMessageData.text;
    message.querySelector(".time").textContent = getTime(groupMessageData.timestamp);

    return message;
  }
}

/*
  Determine whether a user id was sent over or a route id. Based on which
  display all the messages of the users. 
*/
function displayMessages() {
  const messagesContainer = document.querySelector(".messages-container");
  messagesContainer.innerHTML = "";

  if (targetUserId) {
    listenForUserMessages(targetUserId, messagesContainer);

    document.querySelector(".btn-send").addEventListener("click", () => {
      sendMessageToUser(targetUserId)
    });
  } else {
    listenForRouteMessages(targetRouteId, messagesContainer);

    document.querySelector(".btn-send").addEventListener("click", () => {
      sendMessageToGroup(targetRouteId)
    })
  }
}

/*
*/
function listenForUserMessages(targetUserId, messagesContainer) {
  db.collection("messages")
    .where("users", "array-contains", currentUserId)
    .orderBy("timestamp")
    .onSnapshot(snapshot => {
      messagesContainer.innerHTML = "";

      snapshot.forEach(doc => {
        const message = doc.data();

        if (message.users.includes(targetUserId)) {
          createMessageForUsers(message).then(messageElement => {
            if (messageElement) {
              messagesContainer.appendChild(messageElement);
            }
          });
        }
      })
    })
}

function sendMessageToUser(targetUserId) {
  const messageInput = document.querySelector(".message-input");
  const message = messageInput.value.trim();

  if (message) {
    const messagesRef = db.collection("messages");
    messagesRef.add({
      users: [currentUserId, targetUserId],
      text: message,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      messageInput.value = "";
    }).catch((error) => {
      console.error("Error sending message: ", error);
    });
  }
}

function listenForRouteMessages(targetRouteId, messagesContainer) {
  db.collection("Routes").doc(targetRouteId)
    .collection("messages")
    .orderBy("timestamp")
    .onSnapshot(snapshot => {
      messagesContainer.innerHTML = "";

      snapshot.forEach(doc => {
        const message = doc.data();

        createMessageForGroup(message).then(messageElement => {
          if (messageElement) {
            messagesContainer.appendChild(messageElement);
          }
        });
      });
    })
}

function sendMessageToGroup(targetRouteId) {
  const messageInput = document.querySelector(".message-input");
  const message = messageInput.value.trim();
  if (message) {
    const messagesRef = db.collection("Routes").doc(targetRouteId).collection("messages");
    messagesRef.add({
      sender: currentUserId,
      text: message,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      messageInput.value = "";
    }).catch((error) => {
      console.error("Error sending message: ", error);
    });
  }
}