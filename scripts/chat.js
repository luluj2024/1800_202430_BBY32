function displayMessages(userId) {
  const messageTemplate = document.querySelector("#messageTemplate");
  const contentContainer = document.querySelector("#content-container");
  contentContainer.innerHTML = "";
  contentContainer.appendChild(messageTemplate.content.cloneNode(true));

  const messageDisplay = contentContainer.querySelector("#messageDisplay");

  listenForMessages(userId, messageDisplay);

  contentContainer.querySelector("#submitBtn").addEventListener("click", () => {
    sendMessage(userId, contentContainer);
  });
}

function listenForMessages(userId, messageDisplay) {
  db.collection("messages")
    .where("users", "array-contains", currentUserId)  // Only messages between the currentUserId
    .orderBy("timestamp") // Order by timestamp
    .onSnapshot(snapshot => {
      messageDisplay.innerHTML = ""; // Clear existing messages

      snapshot.forEach(doc => {
        const message = doc.data();

        // Ensure that both userId and currentUserId are part of the message's users array
        if (message.users.includes(currentUserId) && message.users.includes(userId)) {
          const messageElement = document.createElement("p");
          messageElement.textContent = message.text;

          if (message.users[0] === currentUserId) {
            messageElement.classList.add("bg-primary");
            messageElement.classList.add("right-aligned-message");
          } else {
            messageElement.classList.add("bg-success");
            messageElement.classList.add("left-aligned-message");
          }

          messageDisplay.appendChild(messageElement);
        }
      });
    })
}

function sendMessage(receiverId, contentContainer) {
  const messageInput = contentContainer.querySelector("#messageInput");
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
