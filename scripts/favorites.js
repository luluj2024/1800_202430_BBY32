let currentUserId;

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUserId = user.uid;
    }
})
function displayAllRoutes() {
    let busTemplate = document.getElementById("bus-template");
    let container = document.getElementById("bus-info");

    container.innerHTML = '';
    document.getElementById("status").innerHTML = "";
    let favCheck = false;
    //For SOME reason returns undefined??
    db.collection("users").doc(currentUserId).get().then(user => {
        console.log(user);
        console.log(user.data());
        console.log(user.data().favorite_routes);
        let favoriteRoutes = user.data().favorite_routes;
        favCheck = favoriteRoutes.includes(routeId);
    })
    db.collection("Routes").get().then(routeList => {
        routeList.forEach(routeId => {
            if (favCheck) {
                outputCards(container, busTemplate, routeId);
            }
        })
    })

}

displayAllRoutes();
let searchbar = document.getElementById("searchbar");
searchbar.value = "";
//Only displays routes similar to search query 
function displaySimilarRoutes() {
    searchbar = document.getElementById("searchbar");
    // console.log(searchbar.value);
    if (searchbar.value == "") {
        displayAllRoutes();
        // console.log("reset");
    }
    else {
        let count = 0;
        let busTemplate = document.getElementById("bus-template");
        let container = document.getElementById("bus-info");

        container.innerHTML = '';
        db.collection("users").doc(currentUserId).get().then(user => {
            db.collection("Routes").get().then(routeList => {
                routeList.forEach(routeId => {
                    // console.log(routeId.data().bus);
                    // console.log(searchbar.value);
                    let favoriteRoutes = user.id.data().favorite_routes;
                    let favCheck = favoriteRoutes.includes(routeId.id);
                    if (favCheck) {
                        if (relatedRoutes(searchbar.value, routeId.data().bus, routeId.data().name)) {
                            count += 1;
                            // console.log(count + "e")
                            outputCards(container, busTemplate, routeId);
                        }
                    }
                })
            }).then(() => {
                // console.log("final" + count)
                if (count == 0) {
                    document.getElementById("status").innerHTML = "<h4>Sorry, your search doesnt match any routes in our database.</h4>";
                }
                else {
                    document.getElementById("status").innerHTML = "";
                }
            })
        });
    }
}

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
                // console.log("fail");
                return false;
            }
        }
        else if (i >= result2.length) {
            if (search[i] != result[i]) {
                // console.log("fail");
                return false;
            }
        }
        else if (search[i] != result[i] && search[i].toLowerCase() != result2[i].toLowerCase()) {
            // console.log("fail");
            return false;
        }
    }
    // console.log(search + " success " + result);
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
    card.querySelector("#removebtn").addEventListener("click", event => { unfavoriteRoute(routeId.id) });
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

async function unfavoriteRoute(route) {
    // console.log("entered unfavorites");
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

