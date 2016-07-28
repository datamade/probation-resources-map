var language = ["spanish", "asl_or_assistance_for_hearing_impaired"];
var insurance = ["sliding_fee_scale", "private_health_insurance", "military_insurance", "medicare", "medicaid"];

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
      // Below: attempts to fix map load issue.

      // (1)
      // $( "#mapCanvas" ).show( "fast", function() {
      //   setTimeout(function() {CartoDbLib.map.invalidateSize()}, 2000);
      // });

      // (2)
      // $( "#mapCanvas" ).show( "fast", function() {
      //   CartoDbLib.map.invalidateSize();
      // });

      // (3)
      // setTimeout(function() {
      //   $('#listCanvas').hide();
      //   $('#mapCanvas').show();
      //   CartoDbLib.map.invalidateSize();
      // }, 500);
    }
  });

  $('#reset').click(function(){
    $.address.parameter('address','');
    $.address.parameter('radius','');
    $.address.parameter('id','');
    CartoDbLib.initialize();
    return false;
  });

  $("#search-address").keydown(function(e){
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

  $("#btnSave").on('click', function() {
    CartoDbLib.addCookieValues();
    CartoDbLib.renderSavedResults();
  });

  $("#dropdown-results").on('click', '.saved-search', function() {
    var address = CartoDbLib.removeWhiteSpace($(this).text());

    // $(".js-example-data-array-language").val("spanish language emphasized").trigger("change");
    // var langSelections = ($("#select-language").select2('data'));
    // var url = CartoDbLib.returnSavedResults(address);
    // // $.address.value(url);
    // console.log("http://127.0.0.1:5000/#" + url);
    // window.location.href = "http://127.0.0.1:5000/#" + url;
    // // CartoDbLib.doSearch();
    // return false;
    // window.location.href = "http://www.google.com";

    CartoDbLib.returnSavedResults(address);
    CartoDbLib.doSearch();
  });

  // $.address.externalChange(function(event) {
  //   console.log("thissssss");
  //   CartoDbLib.initialize();
  // });

});

function makeSelectData(array) {
  data_arr = []
  for(var i = 0; i < array.length; i++) {
    data_arr.push({ id: i, text: CartoDbLib.removeUnderscore(array[i]) })
  }
  console.log(data_arr)
  return data_arr
};








