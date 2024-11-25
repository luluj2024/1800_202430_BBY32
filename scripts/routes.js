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

    //Runs through routes list, outputing routes as its found
    db.collection("Routes").get().then(routeList => {
        routeList.forEach(routeId => {
            outputCards(container, busTemplate, routeId);
        })
    })
}


//Only displays routes similar to search query 
function displaySimilarRoutes() {
    searchbar = document.getElementById("searchbar");
    searchVal = searchbar.value.toLowerCase();
    //Checks if they writes bus and ignores it
    if (searchVal.length >= 3 && searchVal.substring(0, 3) == "bus") {
        searchVal = searchVal.substring(3);
    }
    //Ignores white space 
    searchVal = searchVal.trim();
    if (searchVal == "") {
        //Resets page on empty search bar
        processLoad();
    }
    else {
        let count = 0;
        let busTemplate = document.getElementById("bus-template");
        let container = document.getElementById("bus-info");

        container.innerHTML = '';
        db.collection("Routes").get().then(routeList => {
            routeList.forEach(routeId => {
                //Takes searchbar value, and compares it to the route number and name to see if the search matches it
                if (relatedRoutes(searchVal, routeId.data().bus, routeId.data().name)) {
                    count += 1;
                    outputCards(container, busTemplate, routeId);
                }
            })
        }).then(() => {
            //counts the amount of displayed routes, acting as an empty case condition to inform user there is no routes
            if (count == 0) {
                document.getElementById("status").innerHTML = "<h3>Sorry, your search doesnt match any routes in our database.</h3>";
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
    let busTime;
    //Display bus times, where if the bus runs 24/7 it diplays it as such
    if (data.start == data.end) {
        busTime = "Bus runs 24/7";
    }
    else {
        busTime = "Start: " + data.start + " End: " + data.end;
    }
    card.querySelector(".card-title").textContent = busTitle;
    card.querySelector(".card-time").textContent = busTime;
    //Checks how many people have favoritied 
    let favCount = data.favorites.length;
    let cardFav = card.querySelector(".card-fav").textContent;
    if (favCount == 0 || favCount == undefined) {
        cardFav = "Be the first person on this route!";
    }
    else if (favCount == 1) {
        cardFav = favCount + " person favorited this route!";
    }
    else {
        cardFav = favCount + " people favorited this route!";
    }

    //allows user to favorite specific routes
    let curcard = card.querySelector("#cardbtn");
    favBtn(curcard, routeId);

    container.appendChild(card);
}


// Function found at https://www.freecodecamp.org/news/javascript-debounce-example/ and used to prevent multiple function calls in searchbar
function debounce(func, timeout = 300) {
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

//Favorites for both user and route
async function favoriteRoute(route) {
    let userDocRef = await db.collection("users").doc(currentUserId);
    let routeDocRef = await db.collection("Routes").doc(route);
    //Updates both user favorites and routes favorites 
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
    //Updates both user favorites and routes favorites 
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
        //unfavorites route
        if (favCheck) {
            curcard.style.color = "#2596BE";
            curcard.addEventListener("click", event => {
                unfavoriteRoute(routeId.id)
                displaySimilarRoutes();
            })
        }
        //favorites route
        else {
            curcard.style.color = "black";
            curcard.addEventListener("click", event => {
                favoriteRoute(routeId.id)
                displaySimilarRoutes();
            })
        }
    });
}

//Populate route information code
// function populateRoutes() {
//     var routeRef = db.collection("Routes");

//     routeRef.add({
//         bus: 14,
//         name: "UBC",
//         start: "5am",
//         end: "12am",
//         favorites: {},
//         commuters: {},
//     });
//     routeRef.add({
//         bus: 564,
//         name: "Langley Centre",
//         start: "5am",
//         end: "12am",
//         favorites: {},
//         commuters: {},
//     });
//     routeRef.add({
//         bus: 147,
//         name: "Metrotown",
//         start: "6am",
//         end: "12am",
//         favorites: {},
//         commuters: {},
//     });
//     routeRef.add({
//         bus: 123,
//         name: "New Westminster",
//         start: "12am",
//         end: "12am",
//         favorites: {},
//         commuters: {},
//     });
//     routeRef.add({
//         bus: 17,
//         name: "UBC Nightbus",
//         start: "2am",
//         end: "4am",
//         favorites: {},
//         commuters: {},
//     });
//     routeRef.add({
//         bus: 229,
//         name: "Lynn Valley",
//         start: "6am",
//         end: "1am",
//         favorites: {},
//         commuters: {},
//     });
//     routeRef.add({
//         bus: 188,
//         name: "Port Coquitlam",
//         start: "12am",
//         end: "12am",
//         favorites: {},
//         commuters: {},
//     });
//     routeRef.add({
//         bus: 231,
//         name: "Lonsdale Quay",
//         start: "4pm",
//         end: "6pm",
//         favorites: {},
//         commuters: {},
//     });
//     routeRef.add({
//         bus: 335,
//         name: "Newton Exchange",
//         start: "12am",
//         end: "12am",
//         favorites: {},
//         commuters: {},
//     });
//     routeRef.add({
//         bus: 2,
//         name: "Macdonald",
//         start: "12am",
//         end: "12am",
//         favorites: {},
//         commuters: {},
//     });
//     routeRef.add({
//         bus: 391,
//         name: "Scott Road",
//         start: "5am",
//         end: "8am",
//         favorites: {},
//         commuters: {},
//     });
// }
// populateRoutes();