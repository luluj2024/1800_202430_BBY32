// console.log($('#navbar-template').load('./navbar.html'));
console.log($('#searchbox-template').load('./searchbox.html'));

  
$('#navbar-template').load('./navbar.html', function() {
    $.getScript('./scripts/navbar.js', function() {
    });
  });
  