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
      const messagePromises = snapshot.docs.map(doc => createMessage(doc.data(), true, createCommutingSVG()));

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
async function createMessage(message, isGroup = false, svgIcon) {
  const senderId = isGroup ? message.sender : message.users[0];
  const sender = await getUserData(senderId);
  const isCurrentUser = sender.id === currentUserId;

  // Clone a template based on isCurrentUser
  const templateId = isCurrentUser ? "current-user-message" : "external-user-message";
  const messageTemplate = document.getElementById(templateId).content.cloneNode(true);

  // Styling Template Content
  messageTemplate.querySelector(".time").textContent = getTime(message.timestamp);
  const title = messageTemplate.querySelector(".title")
  
  title.textContent = sender.name;
  if (sender.commuting === targetRouteId) {
    svgIcon.addEventListener("click", () => {
      // Check if the span doesn't already exist
      if (!title.querySelector(".commuting-span")) {
        const span = document.createElement("span");
        span.textContent = "(commuting)";
        span.className = "commuting-span"; // Assign a class for easy reference
        title.appendChild(span);
      }
    });

    svgIcon.addEventListener("mouseout", () => {
      // Remove the span when mouse leaves
      const span = title.querySelector(".commuting-span");
      if (span) {
        title.removeChild(span);
      }
    });
    svgIcon.style = "margin-bottom: 2px;";
    title.appendChild(svgIcon);
  }

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

function createCommutingSVG () {
  const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgIcon.setAttribute("width", "1rem");
  svgIcon.setAttribute("height", "1rem");
  svgIcon.setAttribute("viewBox", "0 0 24 24");
  svgIcon.setAttribute("fill", "none");
  svgIcon.innerHTML = `
    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
    <g id="SVGRepo_iconCarrier">
      <path d="M5 6V15.8C5 16.9201 5 17.4802 5.21799 17.908C5.40973 18.2843 5.71569 18.5903 6.09202 18.782C6.51984 19 7.07989 19 8.2 19H15.8C16.9201 19 17.4802 19 17.908 18.782C18.2843 18.5903 18.5903 18.2843 18.782 17.908C19 17.4802 19 16.9201 19 15.8V6M5 6C5 6 5 3 12 3C19 3 19 6 19 6M5 6H19M5 13H19M17 21V19M7 21V19M8 16H8.01M16 16H16.01"
        stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    </g>
  `;
  return svgIcon;
}