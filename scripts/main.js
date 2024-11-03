function displayAllRoutes() {
    let busTemplate = document.getElementById("bus-template");
    let container = document.getElementById("bus-info");
    console.log("please be working1");

    db.collection("Routes").get().then(routeList => {
        routeList.forEach(routeId => {
            let data = routeId.data();
            let card = busTemplate.content.cloneNode(true);
            let busTitle = "Bus " + data.bus + ": " + data.name;
            let busTime = "Start: " + data.start + " End: " + data.end;
            card.querySelector(".card-title").textContent = busTitle;
            card.querySelector(".card-time").textContent = busTime;
            //   card.querySelector(".card-text").textContent = ;
            console.log("THIS SHOULD WORK");

            container.appendChild(card)
        })
    })
}

displayAllRoutes();

