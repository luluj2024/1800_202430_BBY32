//----------------------------------------
//  Your web app's Firebase configuration
//----------------------------------------
var firebaseConfig = {
    apiKey: "AIzaSyB8QhotTIQD1Ozwe5DmWqDw6Diw_TpMP0E",
    authDomain: "commutebuddy-bby32.firebaseapp.com",
    projectId: "commutebuddy-bby32",
    storageBucket: "commutebuddy-bby32.appspot.com",
    messagingSenderId: "884827574427",
    appId: "1:884827574427:web:b21dadcfe29e3261ebf63e"
};

//--------------------------------------------
// initialize the Firebase app
// initialize Firestore database if using it
//--------------------------------------------
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
