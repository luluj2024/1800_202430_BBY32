// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());

var uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function (authResult, redirectUrl) {
      // If the user is a "brand new" user, then create a new "user" in your own database.
      var user = authResult.user;                            
      if (authResult.additionalUserInfo.isNewUser) {        
        db.collection("users").doc(user.uid).set({   
          id: user.uid,      
          name: user.displayName,                    
          email: user.email,                         
          favorite_routes: [],
          commuting: "",
          friends: [],
          requestsSent: [],
          requestsReceived: []        
        }).then(function () {
          console.log("New user added to users collection")
          window.location.assign("main.html");       
        }).catch(function (error) {
          console.log("Error adding new user: " + error);
        });
      } else {
        return true;
      }
      return false;
    },
    uiShown: function () {
      // The widget is rendered.
      // Hide the loader.
      document.getElementById('loader').style.display = 'none';
    }
  },
  // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
  signInFlow: 'popup',
  signInSuccessUrl: "main.html",
  signInOptions: [
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
  ],
  // Terms of service url.
  tosUrl: '<your-tos-url>',
  // Privacy policy url.
  privacyPolicyUrl: '<your-privacy-policy-url>'
};

ui.start('#firebaseui-auth-container', uiConfig);