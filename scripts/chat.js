const targetUserId = sessionStorage.getItem('targetUserId');
const targetRouteId = sessionStorage.getItem('targetRouteId');
const commutingId = sessionStorage.getItem('commuting');

let currentUserId;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUserId = user.uid;

    console.log(`Signed In: ${currentUserId}`);
    console.log(`Friend: ${targetUserId}`);
    console.log(`Route: ${targetRouteId}`);
    console.log(`Commuting: ${commutingId}`);

    initialize();

    displayMessages();

  } else {
    console.log("No User Logged In");
    window.location.href = "index.html";
  }
});

function getTime(timestamp) {
  let messageDate = timestamp.toDate();
  let currentDate = new Date();

  // Calculate the time/days difference 
  const timeDifference = Math.abs(currentDate - messageDate);
  const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  if (daysDifference === 0) {
    return messageDate.toLocaleTimeString();
  } else if (daysDifference === 1) {
    return "Yesterday";
  } else {
    return messageDate.toLocaleDateString();
  }
}

async function initialize() {
  if (targetUserId) {
    const userData = await getUserData(targetUserId);
    document.querySelector(".chat-heading").textContent = userData.name;

    document.querySelector(".chat-back-btn").addEventListener("click", () => {
      window.location.href = "friends.html";
    })

    return;
  }

  const routeRef = await db.collection("Routes").doc(targetRouteId).get()
  const routeData = await routeRef.data();
  document.querySelector(".chat-heading").textContent = `Bus ${routeData.bus}: ${routeData.name}`;
  document.querySelector(".chat-back-btn").addEventListener("click", () => {
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
  const messagesContainer = document.querySelector(".message-display");

  if (targetUserId) {
    userMessageListener(messagesContainer);

    document.querySelector(".message-form-container").addEventListener("submit", (event) => {
      event.preventDefault();
      sendUserMessage(targetUserId)
    })
  } else {
    routeMessagesListener(messagesContainer);

    document.querySelector(".message-form-container").addEventListener("submit", (event) => {
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
    .limitToLast(50)
    .onSnapshot(async (snapshot) => {
      const messagePromises = snapshot.docs.map(doc => {
        const data = doc.data();
        if (data.users.includes(targetUserId)) {
          return createMessage(data, false)
        }
      });

      // Wait for all messages to be processed concurrently
      const styledMessages = await Promise.all(messagePromises.filter(Boolean));

      // Clear container and append all messages
      container.innerHTML = ""; // Clear previous messages
      styledMessages.forEach(styledMessage => {
        container.appendChild(styledMessage);
      });

      // Auto-scroll to the bottom of the container
      container.scrollTo(0, container.scrollHeight);
    });
}

function routeMessagesListener(container, commuters) {
  db.collection("Routes").doc(targetRouteId).collection("messages")
    .orderBy("timestamp")
    .limitToLast(50)
    .onSnapshot(async (snapshot) => {
      const messagePromises = snapshot.docs.map(doc => createMessage(doc.data(), true));

      // Wait for all messages to be processed concurrently
      const styledMessages = await Promise.all(messagePromises);

      // Clear container and append all messages
      container.innerHTML = ""; // Clear previous messages
      styledMessages.forEach(styledMessage => {
        container.appendChild(styledMessage);
      });

      // Auto-scroll to the bottom of the container
      container.scrollTo(0, container.scrollHeight);
    });
}

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
  messageTemplate.querySelector(".title").textContent = sender.commuting === targetRouteId 
    ? `${sender.name} (commuting)`
    : sender.name;
  messageTemplate.querySelector(".text").textContent = message.text;
  if (sender.profilePhotoBase64) {
    messageTemplate.querySelector(".profile-icon").src = sender.profilePhotoBase64;
  }


  console.log(sender.id);

  return messageTemplate;
}

async function getCommuters(routeId) {
  const routeDoc = await db.collection("Routes")
}