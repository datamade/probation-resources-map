var ageOptions = ["under_18", "_18_to_24", "_25_to_64", "over_65"];
var languageOptions = ["spanish", "asl_or_assistance_for_hearing_impaired"];
var facilityTypeOptions = ["housing", "health", "legal", "education_and_employment", "social_support", "food_and_clothing"];
var insuranceOptions = ["sliding_fee_scale", "private_health_insurance", "military_insurance", "medicare", "medicaid"];

$(window).resize(function () {
  var h = $(window).height(),
    offsetTop = 110; // Calculate the top offset

  $('#mapCanvas').css('height', (h - offsetTop));
}).resize();

$(function() {
  CartoDbLib.initialize();

  var autocomplete = new google.maps.places.Autocomplete(document.getElementById('search-address'));

  $(':checkbox').click(function(){
    CartoDbLib.doSearch();
  });

  $('#btnSearch').click(function(){
    // Temporary fix for map load issue: set show map as default.
    if ($('#mapCanvas').is(":visible")){
      CartoDbLib.doSearch();
    }
    else {
      $('#btnViewMode').html("<i class='fa fa-list'></i> List view");
      $('#mapCanvas').show();
      $('#listCanvas').hide();
      CartoDbLib.doSearch();
    }
  });

  $('#btnViewMode').click(function(){
    if ($('#mapCanvas').is(":visible")){
      $('#btnViewMode').html("<i class='fa fa-map-marker'></i> Map view");
      $('#listCanvas').show();
      $('#mapCanvas').hide();
    }
    else {
      $('#btnViewMode').html("<i class='fa fa-list'></i> List view");
      $('#listCanvas').hide();
      $('#mapCanvas').show();
    }
  });

  $("#search-address").keydown(function(e){
      var key =  e.keyCode ? e.keyCode : e.which;
      if(key == 13) {
          $('#btnSearch').click();
          return false;
      }
  });

  $('select').select2();

  var age_data = makeSelectData(ageOptions);
  var language_data = makeSelectData(languageOptions);
  var facility_type_data = makeSelectData(facilityTypeOptions);
  var insurance_data = makeSelectData(insuranceOptions);

  $(".data-array-age").select2({
    placeholder: "Age group",
    data: age_data
  });

  $(".data-array-language").select2({
    placeholder: "Language preferences",
    data: language_data
  });

  $(".data-array-type").select2({
    placeholder: "Facility type",
    data: facility_type_data
  });

  $(".data-array-insurance").select2({
    placeholder: "Payment preferences",
    data: insurance_data
  });

  $("#btnSave").on('click', function() {
    CartoDbLib.addCookieValues();
    CartoDbLib.renderSavedResults();
  });

  $("#dropdown-results").on('click', '.saved-search', function() {
    var path = $(this).children().text();
    CartoDbLib.returnSavedResults(path);
    CartoDbLib.doSearch();
  });

  $("#dropdown-results").on('click', '.remove-icon', function() {
    var path = ($(this).siblings().children().text());
    CartoDbLib.deleteSavedResult(path);
    $(this).parent().remove();
  });

  $(".list-table").on('click', '.fa-bookmark', function() {
    var tr = ($(this).parents().eq(1));
    var name = tr.find("td.facility-name").text();
    var address = tr.find("td.facility-address").text();
    CartoDbLib.addFacilityCookie(name, address);
  });

});

function makeSelectData(array) {
  data_arr = []
  for(var i = 0; i < array.length; i++) {
    data_arr.push({ id: i, text: CartoDbLib.removeUnderscore(array[i]) })
  }

  return data_arr
};



