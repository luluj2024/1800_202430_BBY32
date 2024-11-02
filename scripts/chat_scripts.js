function displayUsersDynamically(collection) {
  let cardTemplate = document.getElementById("friend-template");
  let cardContainer = document.querySelector(".container");

  db.collection(collection).get().then(allUsers => {
    allUsers.forEach(user => {
      let userId = user.id;
      let userData = user.data();

      let userCard = cardTemplate.content.cloneNode(true);

      userCard.querySelector(".card-title").textContent = userData.name;
      userCard.querySelector(".d-none").textContent = user.id;
      userCard.querySelector(".card-text").textContent = "BOO";

      cardContainer.appendChild(userCard)
    })
  })
}

displayUsersDynamically("users");