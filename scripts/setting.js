let currentUserId;
let profilePhotoBase64 = ""; 

/* 
    Main funtions of profile setting page, including displaying user's info saved in firestoree,
    enabling user to update their info, clearing user's input and logging out.
*/
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUserId = user.uid;

        insertFormInfoFromFirestore();

        document.getElementById("save-button").addEventListener("click", (e) => {
            saveUserInfo(e);
        });

        document.getElementById("btn-suggested").addEventListener("click", () => {
            logout();
        })

        document.getElementById("upload-button").addEventListener("click", () => {
            document.getElementById("profile-photo-upload").click();
        });

        document.getElementById("profile-photo-upload").addEventListener("change", (e) => {
            updateUserPhoto(e);
            
        })

        document.getElementById("clear-button").addEventListener("click", function(e){
            insertFormInfoFromFirestore();
        })
 
    } else {
        console.log("No user logged In");
        window.location.href = "index.html";
    }
})

/* 
    Displays user's information from firestore
    if not logging in, redirects to index.htm 
*/
function insertFormInfoFromFirestore() {
    const currentUserRef = db.collection("users").doc(currentUserId);

    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];

    // Display user's info. If it doesn't exist, uses "N/A" for phone number and bio,
    // and uses today's date as the default birthday. 
    currentUserRef.get().then(userDoc => {
        if (userDoc.exists) { 
            const userData = userDoc.data();
            document.getElementById("full-name").value = userData.name || "";
            document.getElementById("email").value = userData.email || "";
            document.getElementById("phone").value = userData.phone || "N/A";
            document.getElementById("birthday").value = userData.birthday || formattedToday;
            document.getElementById("about-me").value = userData.description || "N/A";

            if (userData.profilePhotoBase64) {
                document.getElementById("profile-photo-preview").src = userData.profilePhotoBase64;
            }
        } else {
            console.log("No user data found.");
        }
    }).catch(error => {
        console.log(`Error getting user document for ${currentUserId}:`, error);
    });
}

/* Save and update uses's profile photo */
function updateUserPhoto(event) {
    const profilePhotoFile = event.target.files[0];
    if (profilePhotoFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            profilePhotoBase64 = e.target.result; 
            document.getElementById("profile-photo-preview").src = profilePhotoBase64; 
        };
        reader.readAsDataURL(profilePhotoFile);
    }
};

/* Save user's input and update the information */
async function saveUserInfo(event) {
    event.preventDefault();

    const currentUserRef = db.collection("users").doc(currentUserId);

    const updatedUserInfo = {
        name: document.getElementById("full-name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        birthday: document.getElementById("birthday").value,
        description: document.getElementById("about-me").value,
        profilePhotoBase64: profilePhotoBase64 
    };

    try {
        await currentUserRef.update(updatedUserInfo);
        Swal.fire({
            icon: "success",
            title: "Your work has been saved",
            showConfirmButton: false,
            timer: 1500
          });
    } catch (error) {
        console.error(`Error updating user information for ${currentUserId}`, error);
        alert("Failed to update your information.");
    }
}


/* 
   log-out function 
   after logging out, redirects to index.html 
*/
function logout() {
    const currentUserRef = db.collection("users").doc(currentUserId);

    currentUserRef.get().then(userDoc => {
        let userName = "Buddy"; // Default name
        if (userDoc.exists) {
            userName = userDoc.data().name;
        }
        // Display the logout message after fetching the user name
        Swal.fire({
            title: "See you next time",
            text: userName,
        }).then(() => {
            firebase.auth().signOut().then(() => {
                // Redirect to the index page
                window.location.href = "index.html";
            }).catch((error) => {
                console.error("Error in logging out:", error);
            });
        });
    }).catch(error => {
        console.error("Error fetching user data:", error);
        // Handle error gracefully, e.g., proceed with sign-out even if user name is not fetched
        Swal.fire({
            title: "Error",
            text: "Could not fetch user information",
            icon: "error",
        }).then(() => {
            firebase.auth().signOut().then(() => {
                window.location.href = "index.html";
            }).catch((error) => {
                console.error("Error in logging out:", error);
            });
        });
    });
}





