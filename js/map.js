var language = ["spanish_language_emphasized", "asl_or_other_assistance_for_hearing_impaired"];
var insurance = ["sliding_fee_scale", "private_health_insurance", "military_insurance", "medicare", "medicaid"];

$(window).resize(function () {
  var h = $(window).height(),
    offsetTop = 110; // Calculate the top offset

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

  $('#btnListSearch').click(function() {
    CartoDbLib.doListSearch();
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

  $('select').select2();

  var language_data = makeSelectData(language);
  var insurance_data = makeSelectData(insurance);

  $(".js-example-data-array-language").select2({
    placeholder: "Language preferences",
    data: language_data
  });

  $(".js-example-data-array-insurance").select2({
    placeholder: "Payment preferences",
    data: insurance_data
  });

});

function makeSelectData(array) {
  data_arr = []
  for(var i = 0; i < array.length; i++) {
    data_arr.push({ id: 0, text: CartoDbLib.removeUnderscore(array[i]) })
  }
  return data_arr
};