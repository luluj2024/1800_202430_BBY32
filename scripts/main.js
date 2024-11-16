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
        //Checks users favorited routes and displays them accordingly 
        if (favoriteRoutes.length == 0) { //Checks for if the user has favorited routes, and if they dont, shows them where to go
            document.getElementById("status").innerHTML = "<h4>Welcome to commute buddy, go to the routes tab to find some routes to save!</h4><h4> You will be able to see them here and meet new people on your routes!</h4>";
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

function displayMessages(routeId) {
    const messageTemplate = document.querySelector("#messageTemplate");
    const mainContainer = document.querySelector("#bus-info");
    mainContainer.innerHTML = "";
    mainContainer.appendChild(messageTemplate.content.cloneNode(true));

    const messageDisplay = mainContainer.querySelector("#messageDisplay");

    listenForMessages(routeId, messageDisplay);

    mainContainer.querySelector("#submitBtn").addEventListener("click", () => {
        sendMessage(routeId, mainContainer);
    });
}

function listenForMessages(routeId, messageDisplay) {
    db.collection("Routes")
        .doc(routeId)
        .collection("messages")
        .orderBy("timestamp") // Order by timestamp
        .onSnapshot(snapshot => {
            messageDisplay.innerHTML = ""; // Clear existing messages

            snapshot.forEach(doc => {
                const message = doc.data();

                const messageElement = document.createElement("p");
                messageElement.textContent = message.text;

                if (message.sender === currentUserId) {
                    messageElement.classList.add("bg-primary");
                    messageElement.classList.add("right-aligned-message");
                } else {
                    messageElement.classList.add("bg-success");
                    messageElement.classList.add("left-aligned-message");
                }

                messageDisplay.appendChild(messageElement);

            });
        })
}

function sendMessage(routeId, mainContainer) {
    const messageInput = mainContainer.querySelector("#messageInput");
    const message = messageInput.value.trim();

    if (message) {
        const messagesRef = db.collection("Routes").doc(routeId).collection("messages");
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


//Only displays routes similar to search query that are favorited by the user
function displaySimilarRoutes() {
    searchbar = document.getElementById("searchbar");
    searchVal = searchbar.value.toLowerCase();
    //Checks if they writes bus and ignores it
    if (searchVal.length >= 3 && searchVal.substring(0,3) == "bus") {
        searchVal = searchVal.substring(3);
    }
    //Ignores white space 
    searchVal = searchVal.trim();
    if (searchVal == "") {
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
            if (favoriteRoutes.length == 0) { //Checks for if the user has favorited routes, and if they dont, shows them where to go
                console.log("is this working");1
                document.getElementById("status").innerHTML = "<h4>Welcome to commute buddy, go to the routes tab to find some routes to save! You will be able to see them here and meet new people on your routes!</h4>";
            }
            else {
                db.collection("Routes").get().then(routeList => {
                    routeList.forEach(routeId => {
                        favCheck = favoriteRoutes.includes(routeId.id);
                        //Checks if its there favorite and then runs through search to see if routes match it
                        if (favCheck) {
                            if (relatedRoutes(searchVal, routeId.data().bus, routeId.data().name)) {
                                count += 1;
                                outputCards(container, busTemplate, routeId);
                            }
                        }
                    })
                }).then(() => {
                    if (count == 0) {
                        document.getElementById("status").innerHTML = "<h4>Sorry, your search doesnt match any routes in your favorites, try going to the routes page and find the route you want!</h4>";
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
    //Displays bus times and whether its 24/7
    if (data.start == data.end) {
        busTime = "Bus runs 24/7";
    }
    else {
        busTime = "Start: " + data.start + " End: " + data.end;
    }
    card.querySelector(".card-title").textContent = busTitle;
    card.querySelector(".card-time").textContent = busTime;
    //Displays how many commuters are actively on this route
    let commuters = data.commuters.length;
    if (commuters == 0 || commuters == undefined) {
        card.querySelector(".card-commute").textContent = "Be the first person on this route!";
    }
    else if (commuters == 1) {
        card.querySelector(".card-commute").textContent = commuters + " person is on this route!";
    }
    else {
        card.querySelector(".card-commute").textContent = commuters + " people are on this route!";
    }

    //Unfavorite route button
    card.querySelector("#removebtn").addEventListener("click", event => { unfavoriteRoute(routeId.id) });

    //Route groupchat button
    card.querySelector("#cardbtn").addEventListener("click", (event) => {
        console.log("Chat Button Clicked");
        displayMessages(routeId.id);
    })

    container.appendChild(card);
}


// Function found at https://www.freecodecamp.org/news/javascript-debounce-example/ and used to prevent multiple function calls in searchbar
function debounce(func, timeout = 280) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        //Creates a timer based of the timeout that calls the passed in function once its complete
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
    //Updates both user favorites and routes favorites 
    userDocRef.update({
        favorite_routes: firebase.firestore.FieldValue.arrayRemove(route)
    })
    routeDocRef.update({
        favorites: firebase.firestore.FieldValue.arrayRemove(currentUserId)
    })
    displaySimilarRoutes();
}
