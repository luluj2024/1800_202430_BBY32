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

async function createMessage(messageData, isGroup = false) {
  const senderId = isGroup ? messageData.sender : messageData.users[0];
  const sender = await getUserData(senderId);

  const isCurrentUser = sender.id === currentUserId;
  const templateId = isCurrentUser ? "right-message" : "left-message";
  const messageTemplate = document.getElementById(templateId).content.cloneNode(true);

  messageTemplate.querySelector(".title").textContent = sender.name;
  messageTemplate.querySelector(".text").textContent = messageData.text;
  messageTemplate.querySelector(".time").textContent = getTime(messageData.timestamp);

  return messageTemplate;
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
          createMessage(message, false).then(messageElement => {
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

        createMessage(message, true).then(messageElement => {
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