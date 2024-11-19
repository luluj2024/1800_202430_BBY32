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
  if (messageData.timestamp) {
    messageTemplate.querySelector(".time").textContent = getTime(messageData.timestamp);
  }

  return messageTemplate;
}

/*
  Initiate rendering of messages between users or with favourited route
*/
function displayMessages() {
  const messagesContainer = document.querySelector(".messages-container");

  if (targetUserId) {
    userMessageListener(messagesContainer);

    document.querySelector(".btn-send").addEventListener("click", () => {
      sendUserMessage()
    });
  } else {
    routeMessagesListener(messagesContainer);

    document.querySelector(".btn-send").addEventListener("click", () => {
      sendGroupMessage(targetRouteId)
    })
  }
}

/*
  Updates the messages collection with user provided input. Message fields 
  include text, server timestamp, and an users array consisting of 
  [currentUserId, targetUserId]
*/
function sendUserMessage() {
  const input = document.querySelector(".input");
  const message = input.value.trim();

  // If message is not empty or whitespace
  if (message) {
    const messagesRef = db.collection("messages");
    messagesRef.add({
      users: [currentUserId, targetUserId],
      text: message,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      // Clear textbox
      input.value = "";
    })
    .catch((error) => {
      console.error("Error sending message: ", error);
    });
  }
}

/*
  Updates the messages collection inside the Routes collection with user
  provided input. Message fields include text, server timestamp, and sender
*/
function sendGroupMessage() {
  const input = document.querySelector(".input");
  const message = input.value.trim();
  
   // If message is not empty or whitespace
  if (message) {
    const messagesRef = db.collection("Routes").doc(targetRouteId).collection("messages");
    messagesRef.add({
      sender: currentUserId,
      text: message,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      // Clear textbox
      input.value = "";
    })
    .catch((error) => {
      console.error("Error sending message: ", error);
    });
  }
}

/*
*/
function userMessageListener(container) {
  db.collection("messages")
    .where("users", "array-contains", currentUserId)
    .orderBy("timestamp")
    .onSnapshot(snapshot => {
      container.innerHTML = "";

      snapshot.forEach(message => {
        const messageData = message.data();

        if (messageData.users.includes(targetUserId)) {
          console.log(messageData);
        }
      })
    })
  // db.collection("messages")
  //   .where("users", "array-contains", currentUserId)
  //   .orderBy("timestamp")
  //   .onSnapshot(snapshot => {
  //     messagesContainer.innerHTML = "";

  //     snapshot.forEach(doc => {
  //       const message = doc.data();

  //       if (message.users.includes(targetUserId)) {
  //         createMessage(message, false).then(messageElement => {
  //           if (messageElement) {
  //             messagesContainer.appendChild(messageElement);
  //           }
  //         });
  //       }
  //     })
  //   })
}

function routeMessagesListener(container) {
  db.collection("Routes").doc(targetRouteId).collection("messages")
    .orderBy("timestamp")
    .onSnapshot(snapshot => {
      container.innerHTML = "";

      snapshot.forEach(message => {
        const messageData = message.data();
        console.log(messageData);
      })
    })
}

// function listenForRouteMessages(targetRouteId, messagesContainer) {
//   db.collection("Routes").doc(targetRouteId)
//     .collection("messages")
//     .orderBy("timestamp")
//     .onSnapshot(snapshot => {
//       messagesContainer.innerHTML = "";

//       snapshot.forEach(doc => {
//         const message = doc.data();

//         createMessage(message, true).then(messageElement => {
//           if (messageElement) {
//             messagesContainer.appendChild(messageElement);
//           }
//         });
//       });
//     })
// }