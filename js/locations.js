$(function() {
  CartoDbLib.renderSavedResults();
  CartoDbLib.updateSavedCounter();
  CartoDbLib.renderSavedFacilities();

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









