$(function() {
  CartoDbLib.renderSavedFacilities();
  CartoDbLib.renderSavedResults();
  CartoDbLib.updateSavedCounter();

  $(".remove-location").on('click', function() {
    var div = $(this).parent().parent();
    var address = div.children().eq(1).text();
    CartoDbLib.deleteSavedFacility(address);
    div.remove();
  });

  $("#dropdown-results").on('click', '.saved-search', function() {
    var path = $(this).children().text();
    window.location = '/';
  });

  $("#dropdown-results").on('click', '.remove-icon', function() {
    var path = ($(this).siblings().children().text());
    CartoDbLib.deleteSavedResult(path);
    $(this).parent().remove();
  });

  $(".btn-print").on("click", function() {
    window.print();
  });

});









