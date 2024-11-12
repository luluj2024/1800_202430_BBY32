let currentUserId;

//Authenticates users
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUserId = user.uid;
  }
  //Calls all routes after delay and initializes searchbar 
  displayAllRoutes()
  let searchbar = document.getElementById("searchbar");
  searchbar.value = "";
})

//Displays all routes in database
function displayAllRoutes() {
    let busTemplate = document.getElementById("bus-template");
    let container = document.getElementById("bus-info");

    container.innerHTML = '';
    document.getElementById("status").innerHTML = "";

    db.collection("Routes").get().then(routeList => {
        routeList.forEach(routeId => {
            outputCards(container, busTemplate, routeId);
        })
    })
}


//Only displays routes similar to search query 
function displaySimilarRoutes() {
    searchbar = document.getElementById("searchbar");
    if (searchbar.value == "") {
        processLoad();
    }
    else {
        let count = 0;
        let busTemplate = document.getElementById("bus-template");
        let container = document.getElementById("bus-info");

        container.innerHTML = '';
        db.collection("Routes").get().then(routeList => {
            routeList.forEach(routeId => {
                if (relatedRoutes(searchbar.value.toLowerCase(), routeId.data().bus, routeId.data().name)) {
                    count += 1;
                    outputCards(container, busTemplate, routeId);
                }
            })
        }).then(() => {
            if (count == 0) {
                document.getElementById("status").innerHTML = "<h4>Sorry, your search doesnt match any routes in our database.</h4>";
            }
            else {
                document.getElementById("status").innerHTML = "";
            }
        })
    }
}

//Compares search input with route database
function relatedRoutes(search, result, result2) {
    result += '';
    result2 += '';
    //Loops through the search and bus#/busName values to see what matches and return it to user
    for (let i = 0; i < search.length; i++) {
        //Verify I dont attempt to go out of length
        if (i >= result.length && i >= result2.length) {
            return false;
        }
        else if (i >= result.length) {
            if (search[i] != result2[i].toLowerCase()) {
                return false;
            }
        }
        else if (i >= result2.length) {
            if (search[i] != result[i]) {
                return false;
            }
        }
        else if (search[i] != result[i] && search[i].toLowerCase() != result2[i].toLowerCase()) {
            return false;
        }
    }
    return true;
}

//Adds valid bus cards to bus route list
function outputCards(container, busTemplate, routeId) {
    let data = routeId.data();
    let card = busTemplate.content.cloneNode(true);
    let busTitle = "Bus " + data.bus + ": " + data.name;
    let busTime = "Start: " + data.start + " End: " + data.end;
    card.querySelector(".card-title").textContent = busTitle;
    card.querySelector(".card-time").textContent = busTime;
    let favCount = data.favorites.length;
    if (favCount == 0) {
        card.querySelector(".card-fav").textContent = "Be the first buddy on this route!";
    }
    else if (favCount == 1) {
        card.querySelector(".card-fav").textContent = favCount + " buddy favorited this route!";
    }
    else {
        card.querySelector(".card-fav").textContent = favCount + " buddies favorited this route!";
    }

    let curcard = card.querySelector("#cardbtn");
    favBtn(curcard, routeId);

    container.appendChild(card);
}


// Function found at https://www.freecodecamp.org/news/javascript-debounce-example/ and used to prevent multiple function calls in searchbar
function debounce(func, timeout = 250){
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
  }
  //delays searchbar inputs to prevent duplication and excessive database calls
  const processSearch = debounce(() => displaySimilarRoutes());
  const processLoad = debounce(() => displayAllRoutes());

//Favorites for both user and route
  async function favoriteRoute(route) {
    let userDocRef = await db.collection("users").doc(currentUserId);
    let routeDocRef = await db.collection("Routes").doc(route);
    userDocRef.update({
      favorite_routes: firebase.firestore.FieldValue.arrayUnion(route)
    })
    routeDocRef.update({
      favorites: firebase.firestore.FieldValue.arrayUnion(currentUserId)
    })
}

//Removes favorite for both user and route
async function unfavoriteRoute(route) {
    let userDocRef = await db.collection("users").doc(currentUserId);
    let routeDocRef = await db.collection("Routes").doc(route);
    userDocRef.update({
      favorite_routes: firebase.firestore.FieldValue.arrayRemove(route)
    })
    routeDocRef.update({
      favorites: firebase.firestore.FieldValue.arrayRemove(currentUserId)
    })
}

//Favorite button functionality
function favBtn(curcard, routeId) {
    let favCheck = false;
    db.collection("users").doc(currentUserId).get().then(user => {
        let favoriteRoutes = user.data().favorite_routes;
        favCheck = favoriteRoutes.includes(routeId.id);
        //Establishes which version of favorite button
        if (favCheck) {
            curcard.style.color = "blue";
            curcard.addEventListener("click", event => {
                unfavoriteRoute(routeId.id)
                curcard.style.color = "black";
                displaySimilarRoutes();
              })
        }
        else {
            curcard.style.color = "black";
            curcard.addEventListener("click", event => {
                favoriteRoute(routeId.id)
                curcard.style.color = "blue";
                displaySimilarRoutes();
              })
        }
    });
}

