$(window).resize(function () {
  var h = $(window).height(),
    offsetTop = 120; // Calculate the top offset

  $('#mapCanvas').css('height', (h - offsetTop));
}).resize();

$(function() {

  CartoDbLib.initialize();
  var autocomplete = new google.maps.places.Autocomplete(document.getElementById('search_address'));

  $(':checkbox').click(function(){
    CartoDbLib.doSearch();
  });

  $('#btnSearch').click(function(){
    CartoDbLib.doSearch();
  });

  $('#findMe').click(function(){
    CartoDbLib.findMe();
    return false;
  });

  $('#reset').click(function(){
    $.address.parameter('address','');
    $.address.parameter('radius','');
    $.address.parameter('id','');
    CartoDbLib.initialize();
    return false;
  });

  $("#search_address").keydown(function(e){
      var key =  e.keyCode ? e.keyCode : e.which;
      if(key == 13) {
          $('#btnSearch').click();
          return false;
      }
  });
});