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

//Only displays routes similar to search query 
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
                if (relatedRoutes(searchbar.value, routeId.data().bus, routeId.data().name)) {
                    outputCards(container, busTemplate, routeId);
                }
            })
        })
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
                console.log("fail");
                return false;
            }
        }
        else if (i >= result2.length) {
            if (search[i] != result[i]) {
                console.log("fail");
                return false;
            }
        }
        else if (search[i] != result[i] && search[i].toLowerCase() != result2[i].toLowerCase()) {
            console.log("fail");
            return false;
        }
    }
    console.log(search + " success " + result);
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
  
  
  
  