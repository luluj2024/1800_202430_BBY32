const targetUser = JSON.parse(sessionStorage.getItem('targetUser'));
const targetRoute = sessionStorage.getItem('targetRoute');

let currentUserId;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUserId = user.uid;

    console.log(targetUser);
    console.log(targetRoute);
    
    displayMessages();
  } else {
    console.log("No User Logged In");
    window.location.href = "index.html";
  }
});

function displayMessages() {
  const messagesContainer = document.querySelector(".messages-container");
  messagesContainer.innerHTML = "";

  if (targetUser) {
    listenForUserMessages(targetUser, messagesContainer);

    document.querySelector(".btn-send").addEventListener("click", () => {
      sendMessageToUser(targetUser.id, messagesContainer)
    });
  } else {
    listenForRouteMessages(targetRoute, messagesContainer);

    document.querySelector(".btn-send").addEventListener("click", () => {
      sendMessageToGroup(targetRoute)
    })
  }
}

function listenForUserMessages(targetUser, container) {
  db.collection("messages")
    .where("users", "array-contains", currentUserId)
    .orderBy("timestamp")
    .onSnapshot(snapshot => {
      container.innerHTML = "";

      snapshot.forEach(doc => {
        const message = doc.data();

        if (message.users.includes(targetUser.id)) {
          const messageElement = document.createElement("p");
          messageElement.textContent = message.text;

          if (message.users[0] === currentUserId) {
            messageElement.classList.add("bg-primary");
          } else {
            messageElement.classList.add("bg-success");
          }

          container.appendChild(messageElement);
        }
      })
    })
}

function sendMessageToUser(receiverId) {
  const messageInput = document.querySelector(".message-input");
  const message = messageInput.value.trim();

  if (message) {
    const messagesRef = db.collection("messages");
    messagesRef.add({
      users: [currentUserId, receiverId],
      text: message,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      messageInput.value = "";
    }).catch((error) => {
      console.error("Error sending message: ", error);
    });
  }
}

function listenForRouteMessages(targetRouteId, container) {
  db.collection("Routes").doc(targetRouteId)
    .collection("messages")
    .orderBy("timestamp")
    .onSnapshot(snapshot => {
      container.innerHTML = "";

      snapshot.forEach(doc => {
        const message = doc.data();

        const messageElement = document.createElement("p");
        messageElement.textContent = message.text;
        if (message.sender === currentUserId) {
          messageElement.classList.add("bg-primary");
        } else {
          messageElement.classList.add("bg-success");
        }
        container.appendChild(messageElement);
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

window.addEventListener("beforeunload", () => {
  sessionStorage.removeItem("targetUser");
  sessionStorage.removeItem("targetRoute");
})