(function () {
    'use strict'

    // Replace feather class calls in HTML
    feather.replace()

    // Hilight current page in dashboard menu
    var pathname = window.location.pathname;
    $('.nav > li > a[href="'+pathname+'"]').addClass('active'); // Add .parent() for one level higher

    // Toggle button for sidebar
    $("#menu-toggle").click(function(e) {
      e.preventDefault();
      $("#wrapper").toggleClass("toggled");
    });
  
  }())