function displayAllRoutes() {
    let busTemplate = document.getElementById("bus-template");
    let container = document.getElementById("bus-info");

    container.innerHTML = '';

    db.collection("Routes").get().then(routeList => {
        routeList.forEach(routeId => {
            outputCards(container, busTemplate, routeId);
        })
    })
}

displayAllRoutes();

function displaySimilarRoutes() {
    let searchbar = document.getElementById("searchbar");
    console.log(searchbar.value);

    if (searchbar.value == "") {
        displayAllRoutes();
        console.log("reset");
    }
    else {
        let busTemplate = document.getElementById("bus-template");
        let container = document.getElementById("bus-info");
        container.innerHTML = '';
        db.collection("Routes").get().then(routeList => {
            routeList.forEach(routeId => {
                console.log(routeId.data().bus);
                console.log(searchbar.value);
                if (relatedRoutes(searchbar.value, routeId.data().bus)) {
                    outputCards(container, busTemplate, routeId);
                }
            })
            if (!container.hasChildNodes) {
                container.innerHTML("No bus routes available");
            }
        })
    }
}


function relatedRoutes(search, result) {
    result += '';

    for (let i = 0; i < search.length; i++) {
        if (search[i] != result[i]) {
            console.log(search + " fail " + result);
            return false;
        }
    }
    console.log(search + " success " + result);
    return true;
}

function outputCards(container, busTemplate, routeId) {
    let data = routeId.data();
    let card = busTemplate.content.cloneNode(true);
    let busTitle = "Bus " + data.bus + ": " + data.name;
    let busTime = "Start: " + data.start + " End: " + data.end;
    card.querySelector(".card-title").textContent = busTitle;
    card.querySelector(".card-time").textContent = busTime;

    container.appendChild(card);
}