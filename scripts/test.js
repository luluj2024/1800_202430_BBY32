firebase.auth().onAuthStateChanged((user) => {
  userId = user?.uid;
  console.log(userId);
  
});