function insertFormInfoFromFirestore() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const currentUserRef = db.collection("users").doc(user.uid);
            currentUserRef.get().then(userDoc => {
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    document.getElementById("full-name").value = userData.name || "";
                    document.getElementById("email").value = userData.email || "";
                    document.getElementById("phone").value = userData.phone || "";
                    document.getElementById("birthday").value = userData.birthday || "2024-11-02";
                    document.getElementById("about-me").value = userData.description || "";

                    if (userData.profilePhotoBase64) {
                        document.getElementById("profile-photo-preview").src = userData.profilePhotoBase64;
                    }
                }
            }).catch(error => {
                console.error("Error getting user document:", error);
            });
        } else {
            console.log("No user is logged in.");
            window.location.href = "index.html";
        }
    });
}

insertFormInfoFromFirestore();

let profilePhotoBase64 = ""; 

document.getElementById("upload-button").addEventListener("click", () => {
    document.getElementById("profile-photo-upload").click();
});

document.getElementById("profile-photo-upload").addEventListener("change", (event) => {
    const profilePhotoFile = event.target.files[0];
    if (profilePhotoFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            profilePhotoBase64 = e.target.result; 
            document.getElementById("profile-photo-preview").src = profilePhotoBase64; 
        };
        reader.readAsDataURL(profilePhotoFile);
    }
});

async function saveUserInfo(event) {
    event.preventDefault();

    const user = firebase.auth().currentUser;
    
    if (!user) {
        console.log("No user is logged in.");
        window.location.href = "main.html";
        return;
    }

    const userId = user.uid;
    const currentUserRef = db.collection("users").doc(userId);

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
        alert("User information and profile photo updated successfully.");
    } catch (error) {
        console.error("Error updating user information:", error);
        alert("Failed to update user information.");
    }
}

document.getElementById("save-button").addEventListener("click", saveUserInfo);

function logout() {
    firebase.auth().signOut().then(() => {
        // Sign-out successful.
        console.log("logging out user");
      }).catch((error) => {
        // An error happened.
      });
}

document.getElementById("log-out").addEventListener("click", () => {
    logout();
})


