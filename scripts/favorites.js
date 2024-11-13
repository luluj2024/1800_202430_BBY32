let currentUserId;

//authenticates current user
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUserId = user.uid;
        //Calls all routes after delay and initializes searchbar 
        displayAllRoutes();
        let searchbar = document.getElementById("searchbar");
        searchbar.value = "";
    }
})

//Displays all routes in users favorites
function displayAllRoutes() {
    let busTemplate = document.getElementById("bus-template");
    let container = document.getElementById("bus-info");
    container.innerHTML = '';
    document.getElementById("status").innerHTML = '';

    let favCheck = false;
    db.collection("users").doc(currentUserId).get().then(user => {
        let favoriteRoutes = user.data().favorite_routes;
        if (favoriteRoutes.length == 0) {
            document.getElementById("status").innerHTML = "<h4>Favorite some routes to meet commute buddies!</h4>";
        }
        else {
            db.collection("Routes").get().then(routeList => {
                routeList.forEach(routeId => {
                    favCheck = favoriteRoutes.includes(routeId.id);
                    if (favCheck) {
                        outputCards(container, busTemplate, routeId);
                    }
                })
            })
        }
    })
}

//Only displays routes similar to search query that are favorited by the user
function displaySimilarRoutes() {
    searchbar = document.getElementById("searchbar");
    if (searchbar.value == "") {
        displayAllRoutes();
    }
    else {
        let count = 0;
        let busTemplate = document.getElementById("bus-template");
        let container = document.getElementById("bus-info");

        container.innerHTML = '';
        let favCheck = false;
        db.collection("users").doc(currentUserId).get().then(user => {
            let favoriteRoutes = user.data().favorite_routes;
            //Checks users favorited routes and displays them accordingly 
            if (favoriteRoutes.length == 0) {
                document.getElementById("status").innerHTML = "<h4>Favorite some routes to meet commute buddies!</h4>";
            }
            else {
                db.collection("Routes").get().then(routeList => {
                    routeList.forEach(routeId => {
                        favCheck = favoriteRoutes.includes(routeId.id);
                        if (favCheck) {
                            if (relatedRoutes(searchbar.value.toLowerCase(), routeId.data().bus, routeId.data().name)) {
                                count += 1;
                                outputCards(container, busTemplate, routeId);
                            }
                        }
                    })
                }).then(() => {
                    if (count == 0) {
                        document.getElementById("status").innerHTML = "<h4>Sorry, your search doesnt match any routes in your favorites.</h4>";
                    }
                    else {
                        document.getElementById("status").innerHTML = "";
                    }
                })
            }
        });
    }
}

//Compares search query with favorite routes list
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
    if (data.start == data.end) {
        busTime = "Bus runs 24/7";
    }
    else {
        busTime = "Start: " + data.start + " End: " + data.end;
    }
    card.querySelector(".card-title").textContent = busTitle;
    card.querySelector(".card-time").textContent = busTime;
    let commuters = data.commuters.length;
    if (commuters == 0) {
        card.querySelector(".card-commute").textContent = "Be the first buddy on this route!";
    }
    else if (commuters == 1) {
        card.querySelector(".card-commute").textContent = commuters + " buddy is on this route!";
    }
    else {
        card.querySelector(".card-commute").textContent = commuters + " buddies are on this route!";
    }

    card.querySelector("#removebtn").addEventListener("click", event => { unfavoriteRoute(routeId.id) });

    card.querySelector("#cardbtn").addEventListener("click", (event) => {
        console.log("Chat Button Clicked");
        displayMessages(routeId.id);
    })

    container.appendChild(card);
}


// Function found at https://www.freecodecamp.org/news/javascript-debounce-example/ and used to prevent multiple function calls in searchbar
function debounce(func, timeout = 250) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}
//delays searchbar inputs to prevent duplication and excessive database calls
const processSearch = debounce(() => displaySimilarRoutes());
const processLoad = debounce(() => displayAllRoutes());

//Allows users to unfavorite routes from favorites page
async function unfavoriteRoute(route) {
    let userDocRef = await db.collection("users").doc(currentUserId);
    let routeDocRef = await db.collection("Routes").doc(route);
    userDocRef.update({
        favorite_routes: firebase.firestore.FieldValue.arrayRemove(route)
    })
    routeDocRef.update({
        favorites: firebase.firestore.FieldValue.arrayRemove(currentUserId)
    })
    displaySimilarRoutes();
}
