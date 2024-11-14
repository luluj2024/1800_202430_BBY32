firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      const currentUserRef = db.collection("users").doc(user.uid).get().then(userDoc => {
        if(userDoc.exists) {
            const userData = userDoc.data();

            if(userData.profilePhotoBase64) {
                document.getElementsByClassName("profile-logo")[0].src = userData.profilePhotoBase64;
              }
        }
      });

    } else {
        console.log("No user photo found.")
    }
  });

  
