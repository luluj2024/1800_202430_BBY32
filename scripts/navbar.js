/*
  Dynamically adds an "active" class to the navigation item that 
  matches the current page's URL, highlighting it to indicate the active page.
*/
$(document).ready(function () {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll(".custom-nav-item");

    if (navItems.length === 0) {
      return;
    }
  
    navItems.forEach((item) => {
      const href = item.getAttribute("href");
      if (currentPath.endsWith(href)) {
        item.classList.add("active");
      }
    });
  });
  
  
  
  