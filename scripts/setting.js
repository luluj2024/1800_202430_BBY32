function insertFormInfoFromFirestore() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log(user.uid); 
            currentUser = db.collection("users").doc(user.uid); 
            currentUser.get().then(userDoc => {
                let userName = userDoc.data().name;
                let userEmail = userDoc.data().email;
                let userPhone = userDoc.data().phone;
                let userBOD = userDoc.data().birthday;
                let userDescription = user.data().description;
                console.log(userName);
                document.getElementById("full-name").value = userName || "";
                document.getElementById("email").value = userEmail || "";
                document.getElementById("phone").value = userPhone || "";
                document.getElementById("birthday").value = userBOD || "";
                document.getElementById("about-me").value = userDescription || "";
            })
        } else {
            console.log("No user is logged in."); 
        }
    })
}

insertFormInfoFromFirestore();


function saveUserInfo() {
    const userInfo = {
        fullName: document.getElementById('full-name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        birthday: document.getElementById('birthday').value,
        aboutMe: document.getElementById('about-me').value
    };

    fetch('/api/updateUserInfo', { // 假设这是更新用户数据的API
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userInfo)
    })
    .then(response => {
        if (response.ok) {
            alert("User information saved successfully.");
        } else {
            alert("Failed to save user information.");
        }
    })
    .catch(error => console.error('Error updating user data:', error));
}