const targetUserId = sessionStorage.getItem('targetUserId');
const targetRouteId = sessionStorage.getItem('targetRouteId');

let currentUserId;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUserId = user.uid;

    console.log(`Signed In: ${currentUserId}`);
    console.log(`Friend: ${targetUserId}`);
    console.log(`Route: ${targetRouteId}`);

    initialize();

    displayMessages();

  } else {
    console.log("No User Logged In");
    window.location.href = "index.html";
  }
});

function getTime(timestamp) {
  // Convert Firestore Timestamp to milliseconds
  let milliseconds = timestamp.seconds * 1000;
  let date = new Date(milliseconds);

  // Get the current date and midnight reference
  let now = new Date();
  let todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let differenceInDays = Math.floor((date - todayMidnight) / (24 * 60 * 60 * 1000));

  // Format date components
  const formatDate = (date) => {
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    let day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    let minutes = String(date.getMinutes()).padStart(2, '0');
    let seconds = String(date.getSeconds()).padStart(2, '0');
    let period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert 0 to 12 for midnight
    return `${hours}:${minutes}:${seconds} ${period}`;
  };

  // Return appropriate result based on difference
  if (differenceInDays === 0) {
    return formatTime(date); // Same day
  } else if (differenceInDays === -1) {
    return "Yesterday"; // Previous day
  } else {
    return formatDate(date); 
  } 
}

async function initialize() {
  if (targetUserId) {
    const userData = await getUserData(targetUserId);
    document.querySelector(".chat-title").textContent = userData.name;

    document.querySelector("#back-btn").addEventListener("click", () => {
      window.location.href = "friends.html";
    })

    return;
  }

  const routeRef = await db.collection("Routes").doc(targetRouteId).get()
  const routeData = await routeRef.data();
  document.querySelector(".chat-title").textContent =  `Bus ${routeData.bus}: ${routeData.name}`;
  document.querySelector("#back-btn").addEventListener("click", () => {
    window.location.href = "main.html";
  })
}

/*
  Returns user data object of target user id

  @param {string} targetUserId - Id of target user
  @returns {object} - An object containing all fields of the target user
*/
async function getUserData(userId) {
  try {
    const docRef = await db.collection("users").doc(userId).get();

    // Returns null if retrieved document doesn't exist
    if (docRef.empty) {
      return null;
    }

    return docRef.data();
  } catch (error) {
    console.error(`Error returning user data ${userId}`, error);
    return null;
  }
}

/*
  Initiate rendering of messages between users or with favourited route
*/
function displayMessages() {
  const messagesContainer = document.querySelector(".messages-container");

  if (targetUserId) {
    userMessageListener(messagesContainer);

    document.querySelector(".messages-form").addEventListener("submit", (event) => {
      event.preventDefault();
      sendUserMessage(targetUserId)
    })
  } else {
    routeMessagesListener(messagesContainer);

    document.querySelector(".messages-form").addEventListener("submit", (event) => {
      event.preventDefault();
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
    .onSnapshot(async (snapshot) => {
      const messageBuffer = []; // Temporary buffer for storing styled messages

      for (const doc of snapshot.docs) {
        const messageData = doc.data();

        if (messageData.users.includes(targetUserId)) {
          const styledMessage = await createMessage(messageData, false);
          messageBuffer.push({
            styledMessage,
            timestamp: messageData.timestamp, // Include timestamp for sorting
          });
        }
      }

      // Sort messages by timestamp
      messageBuffer.sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);

      // Clear and render all messages in the correct order
      container.innerHTML = "";
      messageBuffer.forEach(({ styledMessage }) => {
        container.appendChild(styledMessage);
      });
    });
}



function routeMessagesListener(container) {
  db.collection("Routes").doc(targetRouteId).collection("messages")
    .orderBy("timestamp")
    .onSnapshot(async (snapshot) => {
      const messageBuffer = []; // Temporary buffer for storing styled messages

      for (const doc of snapshot.docs) {
        const messageData = doc.data();

        const styledMessage = await createMessage(messageData, true);
        messageBuffer.push({
          styledMessage,
          timestamp: messageData.timestamp, // Include timestamp for sorting
        })
      }

      // Sort messages by timestamp
      messageBuffer.sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);

      // Clear and render all messages in the correct order
      container.innerHTML = "";
      messageBuffer.forEach(({ styledMessage }) => {
        container.appendChild(styledMessage);
      });
    });
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

/*
  Creates a message to append to container.
  @param {object} message: An object containing text, timestamp, and users/sender
  @param {boolean} isGroup: Used to determine whether a message was sent into a
  group or to another user
*/
async function createMessage(message, isGroup = false) {
  const senderId = isGroup ? message.sender : message.users[0];
  const sender = await getUserData(senderId);
  const isCurrentUser = sender.id === currentUserId;

  // Clone a template based on isCurrentUser
  const templateId = isCurrentUser ? "current-user-message" : "external-user-message";
  const messageTemplate = document.getElementById(templateId).content.cloneNode(true);

  // Styling Template Content
  messageTemplate.querySelector(".time").textContent = getTime(message.timestamp);
  messageTemplate.querySelector(".title").textContent = sender.name;
  messageTemplate.querySelector(".text").textContent = message.text;
  

  return messageTemplate;
}