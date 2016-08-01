$(function() {
  CartoDbLib.renderSavedFacilities();

  $(".remove-facility").on('click', function() {
    var div = $(this).parent().parent();
    var address = div.children().eq(1).text();
    CartoDbLib.deleteSavedFacility(address);
    div.remove();
  });
});









