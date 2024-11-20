//------------------------------------------------
// Call this function when the "logout" button is clicked
//-------------------------------------------------
function logout() {
  firebase.auth().signOut().then(() => {
    // Sign-out successful.
    console.log("logging out user");
  }).catch((error) => {
    // An error happened.
  });
}

// Function to show the signup container
function showSignupContainer() {
  var signupContainer = document.getElementById('signup-container');
  var closeButton = document.createElement('span');
  var body = document.body;

  signupContainer.classList.remove('d-none');
  closeButton.className = 'close-btn';
  closeButton.innerHTML = '&times;';
  signupContainer.appendChild(closeButton);
  body.style.overflow = 'hidden'; 

  closeButton.addEventListener('click', function () {
      signupContainer.removeChild(closeButton);
      signupContainer.classList.add('d-none');
      body.style.overflow = ''; 
  });
}

// Event listener for the "Become A Commute Buddy" button
document.querySelectorAll('.signup-btn').forEach(function(button) {
  button.addEventListener('click', showSignupContainer);
});


