const pathname = window.location.pathname;
const navSelector = document.querySelector(`.nav > li > a[href="${pathname}"]`);
const menuToggleIcon = document.getElementById("menu-toggle");
const wrapperElement = document.getElementById("wrapper");

// Replace feather class in HTML
feather.replace();

// Highlight Current Page
navSelector.classList.add("active");

// Toggle the display of the sidebar with a menu
menuToggleIcon.addEventListener("click", (e) => {
  e.preventDefault();
  wrapperElement.classList.toggle("toggled");
});
