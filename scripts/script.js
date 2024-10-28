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

document.getElementById('signup-btn').addEventListener('click',
  function() {
  var signupContainer = document.getElementById('signup-container'); 
  var closeButton = document.createElement('span');
  var body = document.getElementById('core');
  signupContainer.style = ''
  closeButton.className = 'close-btn';
  closeButton.innerHTML = '&times;';
  signupContainer.appendChild(closeButton);
  body.style = 'overflow: hidden;'

  closeButton.addEventListener('click', function() {
  signupContainer.removeChild(closeButton);
  signupContainer.style = 'display: none;'
  body.style = 'overflow: none;'
  });
  });
