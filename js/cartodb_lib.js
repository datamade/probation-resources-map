var ageOptions = ["under_18", "_18_to_24", "_25_to_64", "over_65"];
var languageOptions = ["spanish", "asl_or_assistance_for_hearing_impaired"];
var facilityTypeOptions = ["facility_type___mental_health", "facility_type___behavioral_health", "facility_type___medical_health", "housing", "legal", "education_and_employment", "social_support", "food_and_clothing"];
var programOptions = ["medically_assisted_detox", "inpatient_care", "intensive_outpatient_care", "outpatient_care", "recovery_home_halfway_house", "dui_drunk_driving_treatment", "substance_abuse", "domestic_violence", "mental_illness_and_substance_abuse_misa_or_dual_diagnosis", "individual_counseling_or_clinical_psychological_services", "psychiatric_evaluations", "medication_assisted_treatment","community_meetings_aa_na", "anger_management", "parenting_classes", "veteran_specific", "social_work_and_services_case_management", "rapid_stabilization_programs", "residential_beds_for_clients_with_children"];
var insuranceOptions = ["sliding_fee_scale", "private_health_insurance", "military_insurance", "medicare", "medicaid"];

var CartoDbLib = CartoDbLib || {};
var CartoDbLib = {

  map_centroid:    [41.87811, -87.66677],
  defaultZoom:     11,
  lastClickedLayer: null,
  locationScope:   "chicago",
  currentPinpoint: null,
  layerUrl: 'https://clearstreets.carto.com/api/v2/viz/efcba8d2-4d16-11e6-a770-0e05a8b3e3d7/viz.json',
  tableName: 'probationresourcesmap_mergeddata_resources',
  userName: 'chicagoappleseed',
  geoSearch: '',
  whereClause: '',
  ageSelections: '',
  langSelections: '',
  typeSelections: '',
  insuranceSelections: '',
  lgbtqSelection: '',
  userSelection: '',
  radius: '',
  resultsCount: 0,
  fields : "id, cartodb_id, street_address, full_address, organization_name, hours_of_operation, website, intake_number, image_url, religious_affiliation, " + ageOptions.join(", ") + ", " + languageOptions.join(", ") + ", " + facilityTypeOptions.join(", ") + ", " + programOptions.join(", ") + ", " + insuranceOptions.join(", "),

  initialize: function(){

    //reset filters
    $("#search-address").val(CartoDbLib.convertToPlainString($.address.parameter('address')));
    $("#search-radius").val(CartoDbLib.convertToPlainString($.address.parameter('radius')));
    $("#select-age").val(CartoDbLib.convertToPlainString($.address.parameter('age')));
    $("#select-language").val(CartoDbLib.convertToPlainString($.address.parameter('lang')));
    $("#select-type").val(CartoDbLib.convertToPlainString($.address.parameter('type')));
    $("#select-type").val(CartoDbLib.convertToPlainString($.address.parameter('program')));
    $("#select-insurance").val(CartoDbLib.convertToPlainString($.address.parameter('insure')));

    if ( $.address.parameter('lgbtq') ) {
      $("#lgbtq").prop( "checked", true );
    } else {
      $("#lgbtq").prop( "checked", false );
    }

    var num = $.address.parameter('modal_id');

    if (typeof num !== 'undefined') {
      var sql = new cartodb.SQL({ user: CartoDbLib.userName });
      sql.execute("SELECT " + CartoDbLib.fields + " FROM " + CartoDbLib.tableName + " WHERE id = " + num)
      .done(function(data) {
        CartoDbLib.modalPop(data.rows[0]);
      });
    }

    geocoder = new google.maps.Geocoder();
    // initiate leaflet map
    if (!CartoDbLib.map) {
      CartoDbLib.map = new L.Map('mapCanvas', {
        center: CartoDbLib.map_centroid,
        zoom: CartoDbLib.defaultZoom
      });

      CartoDbLib.google = new L.Google('ROADMAP', {animate: false});

      CartoDbLib.map.addLayer(CartoDbLib.google);

      //add hover info control
      CartoDbLib.info = L.control({position: 'bottomleft'});

      CartoDbLib.info.onAdd = function (map) {
          this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
          this.update();
          return this._div;
      };

      // method that we will use to update the control based on feature properties passed
      CartoDbLib.info.update = function (props) {
        var facilityType = ""

        if (props) {
          $.each(props, function (prop, value) {
            if ($.inArray(String(prop), facilityTypeOptions) > -1 && value == 'Yes') {
              facilityType += (CartoDbLib.formatText(prop) + ", ")
            }
          });
          facilityType = facilityType.slice(0, -2);

          this._div.innerHTML = "<strong>" + props.organization_name + "</strong><br />" + facilityType + "<br />" + props.full_address;
        }
        else {
          this._div.innerHTML = 'Hover over a location';
        }
      };

      CartoDbLib.info.clear = function(){
        this._div.innerHTML = 'Hover over a location';
      };

      //add results control
      CartoDbLib.results_div = L.control({position: 'topright'});

      CartoDbLib.results_div.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'results-count');
        this._div.innerHTML = "";
        return this._div;
      };

      CartoDbLib.results_div.update = function (count){
        this._div.innerHTML = count + ' locations found';
      };

      CartoDbLib.results_div.addTo(CartoDbLib.map);

      CartoDbLib.info.addTo(CartoDbLib.map);
      CartoDbLib.clearSearch();
      CartoDbLib.renderMap();
      CartoDbLib.renderList();
      CartoDbLib.renderSavedResults();
      CartoDbLib.updateSavedCounter();
      CartoDbLib.getResults();
    }
  },

  doSearch: function() {
    CartoDbLib.clearSearch();
    var address = $("#search-address").val();
    CartoDbLib.radius = $("#search-radius").val();

    if (CartoDbLib.radius == null && address != "") {
      CartoDbLib.radius = 8050;
    }

    if (address != "") {
      if (address.toLowerCase().indexOf(CartoDbLib.locationScope) == -1)
        address = address + " " + CartoDbLib.locationScope;

      geocoder.geocode( { 'address': address }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          CartoDbLib.currentPinpoint = [results[0].geometry.location.lat(), results[0].geometry.location.lng()];
          $.address.parameter('address', encodeURIComponent(address));
          $.address.parameter('radius', CartoDbLib.radius);
          CartoDbLib.address = address;
          // Must call create SQL before setting language parameter.
          CartoDbLib.createSQL();
          $.address.parameter('age', encodeURIComponent(CartoDbLib.ageSelections));
          $.address.parameter('lang', encodeURIComponent(CartoDbLib.langSelections));
          $.address.parameter('type', encodeURIComponent(CartoDbLib.typeSelections));
          $.address.parameter('program', encodeURIComponent(CartoDbLib.programSelections));
          $.address.parameter('insure', encodeURIComponent(CartoDbLib.insuranceSelections));
          $.address.parameter('lgbtq', encodeURIComponent(CartoDbLib.lgbtqSelection));

          CartoDbLib.setZoom();
          CartoDbLib.addIcon();
          CartoDbLib.addCircle();
          CartoDbLib.renderMap();
          CartoDbLib.renderList();
          CartoDbLib.getResults();

        }
        else {
          alert("We could not find your address: " + status);
        }
      });
    }
    else { //search without geocoding callback
      CartoDbLib.map.setView(new L.LatLng( CartoDbLib.map_centroid[0], CartoDbLib.map_centroid[1] ), CartoDbLib.defaultZoom)

      CartoDbLib.createSQL();
      $.address.parameter('age', encodeURIComponent(CartoDbLib.ageSelections));
      $.address.parameter('lang', encodeURIComponent(CartoDbLib.langSelections));
      $.address.parameter('type', encodeURIComponent(CartoDbLib.typeSelections));
      $.address.parameter('program', encodeURIComponent(CartoDbLib.programSelections));
      $.address.parameter('insure', encodeURIComponent(CartoDbLib.insuranceSelections));
      $.address.parameter('lgbtq', encodeURIComponent(CartoDbLib.lgbtqSelection));

      CartoDbLib.renderMap();
      CartoDbLib.renderList();
      CartoDbLib.getResults();
    }

  },

  renderMap: function() {
      var layerOpts = {
        user_name: CartoDbLib.userName,
        type: 'cartodb',
        cartodb_logo: false,
        sublayers: [
          {
            sql: "SELECT * FROM " + CartoDbLib.tableName + CartoDbLib.whereClause,
            cartocss: $('#probation-maps-styles').html().trim(),
            interactivity: CartoDbLib.fields
          }
        ]
      }

      CartoDbLib.dataLayer = cartodb.createLayer(CartoDbLib.map, layerOpts, { https: true })
        .addTo(CartoDbLib.map)
        .done(function(layer) {
          CartoDbLib.sublayer = layer.getSubLayer(0);
          CartoDbLib.sublayer.setInteraction(true);
          CartoDbLib.sublayer.on('featureOver', function(e, latlng, pos, data, subLayerIndex) {
            $('#mapCanvas div').css('cursor','pointer');
            CartoDbLib.info.update(data);
          })
          CartoDbLib.sublayer.on('featureOut', function(e, latlng, pos, data, subLayerIndex) {
            $('#mapCanvas div').css('cursor','inherit');
            CartoDbLib.info.clear();
          })
          CartoDbLib.sublayer.on('featureClick', function(e, latlng, pos, data) {
              CartoDbLib.modalPop(data);
          })
          CartoDbLib.sublayer.on('error', function(err) {
            console.log('error: ' + err);
          })
        }).on('error', function(e) {
          console.log('ERROR')
          console.log(e)
        });
  },

  renderList: function() {
    var sql = new cartodb.SQL({ user: CartoDbLib.userName });
    var results = $('#results-list');
    var elements = {
      facility: '',
      address: '',
      hours: '',
      phone: '',
      website: ''
    };

    if ((CartoDbLib.whereClause == ' WHERE the_geom is not null AND ') || (CartoDbLib.whereClause == ' WHERE the_geom is not null ')) {
      CartoDbLib.whereClause = '';
    }

    results.empty();
    sql.execute("SELECT " + CartoDbLib.fields + " FROM " + CartoDbLib.tableName + CartoDbLib.whereClause)
      .done(function(listData) {
        var obj_array = listData.rows;

        if (listData.rows.length == 0) {
          results.append("<p class='no-results'>No results. Please broaden your search.</p>");
        }
        else {
          for (idx in obj_array) {
            var attributeArr = new Array;
            var facilityName = obj_array[idx].organization_name;
            var facilityAddress = obj_array[idx].full_address;
            var facilityHours = obj_array[idx].hours_of_operation;
            var facilityNumber = obj_array[idx].intake_number;
            var facilityWebsite = obj_array[idx].website;
            var icon = ''
            var site = ''
            var givenId = obj_array[idx].id;
            attributeArr.push(facilityName, facilityAddress, facilityHours, facilityNumber, facilityWebsite)

            if (CartoDbLib.deleteBlankResults(attributeArr) < 5) {

              if (facilityName != "") {
                elements["facility"] = facilityName;
              }
              if (facilityAddress != "") {
                elements["address"] = facilityAddress;
              }
              if (facilityHours != "") {
                elements["hours"] = facilityHours;
              }
              if (facilityNumber != "") {
                elements["phone"] = facilityNumber;
              }
              if (facilityWebsite != "") {
                site = "<a href='{{website}}' target='_blank'><i class='fa fa-reply' aria-hidden='true'></i> Website</a>"
                if (facilityWebsite.match(/^http/)) {
                  elements["website"] = facilityWebsite;
                }
                else {
                  elements["website"] = "http://" + facilityWebsite;
                }
              }

              // Check if facility is in 'location' cookie.
              if(CartoDbLib.checkCookieDuplicate(obj_array[idx].id) == false) {
                icon = "<i class='fa fa-star' aria-hidden='true' data-toggle='tooltip' title='Location saved'></i>"
              }
              else {
                icon = "<i class='fa fa-star-o' aria-hidden='true' data-toggle='tooltip' title='Save location'></i>"
              }

              var output = Mustache.render("<tr><td class='hidden-xs'>" + icon + "</td>" +
                "<td><span class='facility-name'>{{facility}}</span><br>" +
                // Address and phone hidden; show for mobile.
                "<span class='hidden-sm hidden-md hidden-lg'><i class='fa fa-map-marker'></i>&nbsp&nbsp{{address}}<br><i class='fa fa-phone'></i> {{phone}}</span></td>" +
                "<td class='hidden-xs'>{{hours}}</td>" +
                "<td class='hidden-xs' style='width: 300px'><i class='fa fa-map-marker' aria-hidden='true'></i>&nbsp&nbsp<span class='facility-address'>{{address}}</span><br>" +
                "<span class='modal-directions'><a href='http://maps.google.com/?q={{address}}' target='_blank'>GET DIRECTIONS</a></span><br>" +
                "<i class='fa fa-phone'></i>&nbsp<span class='facility-phone'>{{phone}}</span><br>" +
                 "<span class='facility-site'>" + site + "</span>" +
                 "<span class='hidden' id='given-id'>" + givenId + "</span>" + "</td></tr>", elements);

              results.append(output);
              $('.fa-star-o').tooltip();
              $('.fa-star').tooltip();
            }
          }
        }
    }).done(function(listData) {
        $(".facility-name").on("click", function() {
          var thisName = $(this).text();
          var objArray = listData.rows;
          $.each(objArray, function( index, obj ) {
            if (obj.organization_name == thisName ) {
              CartoDbLib.modalPop(obj)
            }
          });
        });
    }).error(function(errors) {
      console.log("errors:" + errors);
    });
  },

  deleteBlankResults: function(array) {
    var counter = 0;
    // Count number of instances of whitespace.
    $.each(array, function (index, value) {
      cleanText = value.trim();
      if (cleanText.length == 0) {
        counter++;
      }
    });
    return counter
  },

  getResults: function() {
    var sql = new cartodb.SQL({ user: CartoDbLib.userName });

    sql.execute("SELECT count(*) FROM " + CartoDbLib.tableName + CartoDbLib.whereClause)
      .done(function(data) {
        CartoDbLib.resultsCount = data.rows[0]["count"];
        CartoDbLib.results_div.update(CartoDbLib.resultsCount);
      }
    );
  },

  modalPop: function(data) {
      var contact = "<p id='modal-address'><i class='fa fa-map-marker' aria-hidden='true'></i> " + data.full_address + '</p>' + '<p class="modal-directions"><a href="http://maps.google.com/?q=' + data.full_address + '" target="_blank">GET DIRECTIONS</a></p>' +"<p id='modal-phone'><i class='fa fa-phone' aria-hidden='true'></i> " + data.intake_number + "</p>"
      var hours = "<p><i class='fa fa-calendar' aria-hidden='true'></i> " + data.hours_of_operation + "</p>"
      var url = ''
      var urlName = ''
      if (data.website != "") {
        if (data.website.match(/^http/)) {
          url =  data.website;
          urlName = "<i class='fa fa-reply' aria-hidden='true'></i> Website"

        }
        else {
          url = "http://" + data.website;
          urlName = "<i class='fa fa-reply' aria-hidden='true'></i> Website"
        }
      }

      var website = "<p id='modal-site'><a href='" + url + "' target='_blank'>" + urlName + "</a></p>"

      // Check if facility is in 'location' cookie.
      if(CartoDbLib.checkCookieDuplicate(data.id) == false) {
        icon = "<i class='fa fa-star' aria-hidden='true' data-toggle='tooltip' title='Location saved'></i>"
      }
      else {
        icon = "<i class='fa fa-star-o' aria-hidden='true' data-toggle='tooltip' title='Save location'></i>"
      }

      $('#modal-pop').modal();
      $('.modal-map-marker div.row').hide();
      $('#modal-title, #modal-main, #modal-programs, #modal-image, #language-header, #insurance-header, #age-header, #programs-header, #type-header, #religion-header, #language-subsection, #insurance-subsection, #age-subsection, #type-subsection, #religion-subsection').empty();
      $('#modal-title').append(icon + " " + data.organization_name);
      $('#modal-main').append(contact);

      var img_input = (data.image_url).toLowerCase();

      if (img_input != "no photo" && img_input != "no image") {
          $('#modal-image').append('<img class="img-borders" src=' + data.image_url + '>');
          loaded_image = $('img.img-borders')
          loaded_image.on('error', function() {
            loaded_image.hide();
          });
      }

      if (data.hours_of_operation != "") {
        $('#modal-main').append(hours);
      }

      $('#modal-main').append(website);

      var age_list = ''
      var type_list = ''
      var insurance_list = ''
      var language_list = 'English,&nbsp;&nbsp;'
      var program_list = ''
      // Find all instances of "yes."
      for (prop in data) {
        var value = data[prop];

        if ((String(value).toLowerCase().match(/yes/) != null) || (value == 'true')) {
          if ($.inArray(String(prop), ageOptions) > -1) {
            if (prop == "under_18") {
              age_list = CartoDbLib.formatText(prop) + ",&nbsp;&nbsp;" + age_list
            }
            else {
              age_list += CartoDbLib.formatText(prop) + ",&nbsp;&nbsp;"
            }
          }
          if ($.inArray(String(prop), facilityTypeOptions) > -1) {
              type_list += CartoDbLib.formatText(prop) + ",&nbsp;&nbsp;"
          }
          if ($.inArray(String(prop), insuranceOptions) > -1) {
              insurance_list += CartoDbLib.formatText(prop) + ",&nbsp;&nbsp;"
          }
          if ($.inArray(String(prop), languageOptions) > -1) {
              language_list += CartoDbLib.formatText(prop) + ",&nbsp;&nbsp;"
          }
          if ($.inArray(String(prop), programOptions) > -1) {
              program_list += CartoDbLib.formatText(prop) + ",&nbsp;&nbsp;"
          }
        }
      }

      // Add headers or not.
      if (age_list != '') {
        $("#age-header").parent().parent().show()
        $("#age-header").append('<i class="fa fa-user" aria-hidden="true"></i> Age groups');
        $("#age-subsection").append("<p>" + age_list.slice(0, -13) + "</p>");
      }
      if (type_list != '') {
        $("#type-header").parent().parent().show()
        $("#type-header").append('<i class="fa fa-building-o" aria-hidden="true"></i> Facility type');
        $("#type-subsection").append("<p>" + type_list.slice(0, -13) + "</p>");
      }
      if (insurance_list != '') {
        $("#insurance-header").parent().parent().show()
        $("#insurance-header").append('<i class="fa fa-usd" aria-hidden="true"></i> Payment');
        $("#insurance-subsection").append("<p>" + insurance_list.slice(0, -13) + "</p>")
      }
      if (program_list != '') {
        $("#programs-header").parent().parent().show()
        $("#programs-header").append('<i class="fa fa-heart" aria-hidden="true"></i> Programs');
        $("#modal-programs").append('<p>' + program_list.slice(0, -13) + "</p>");
      }
      if (language_list != '') {
        $("#language-header").parent().parent().show()
        $("#language-header").append('<i class="fa fa-globe" aria-hidden="true"></i> Languages');
        $("#language-subsection").append("<p>" + language_list.slice(0, -13) + "</p>")
      }
      if (data.religious_affiliation == '') {
        $("#religion-header").append('<i class="fa fa-sun-o" aria-hidden="true"></i> Religious affiliation');
        $('#religion-subsection').append('<p>This facility has no known religious affiliation.</p>')
      }
      else {
        $("#religion-header").append('<i class="fa fa-sun-o" aria-hidden="true"></i> Religious affiliation');
        $('#religion-subsection').append('<p>' + data.religious_affiliation + '</p>')
      }

      $.address.parameter('modal_id', data.id);
      $("#post-shortlink").val(location.href);

      // Add tooltip.
      $('.fa-star-o').tooltip();
      $('.fa-star').tooltip();

  },

  clearSearch: function(){
    if (CartoDbLib.sublayer) {
      CartoDbLib.sublayer.remove();
    }
    if (CartoDbLib.centerMark)
      CartoDbLib.map.removeLayer( CartoDbLib.centerMark );
    if (CartoDbLib.radiusCircle)
      CartoDbLib.map.removeLayer( CartoDbLib.radiusCircle );
  },

  findMe: function() {
    // Try W3C Geolocation (Preferred)
    var foundLocation;

    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        foundLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
        CartoDbLib.addrFromLatLng(foundLocation);
      }, null);
    }
    else {
      alert("Sorry, we could not find your location.");
    }
  },

  addrFromLatLng: function(latLngPoint) {
    geocoder.geocode({'latLng': latLngPoint}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          $('#search-address').val(results[1].formatted_address);
          $('.hint').focus();
          CartoDbLib.doSearch();
        }
      } else {
        alert("Geocoder failed due to: " + status);
      }
    });
  },

  //converts a slug or query string in to readable text
  convertToPlainString: function(text) {
    if (text == undefined) return '';
    return decodeURIComponent(text);
  },

  // Use this function to capitalize the insurance brand names
  capitalizeBrand: function(text) {
    return text.replace(/(?:^|\s|\_)\S/g, function(a) { return a.toUpperCase(); });
  },

  formatText: function(text) {
    // Format text with acronyms.
    var lookup = {
      "asl_or_assistance_for_hearing_impaired": "ASL or assistance for hearing impaired",
      "dui_drunk_driving_treatment": "DUI Drunk driving treatment",
      "mental_illness_and_substance_abuse_misa_or_dual_diagnosis": "Mental illness and substance abuse (MISA)",
      "community_meetings_aa_na": "Community meetings (AA/NA)",
      "recovery_home_halfway_house": "Recovery home/Halfway house",
      "facility_type___mental_health": "Mental health", 
      "facility_type___behavioral_health": "Behavioral health", 
      "facility_type___medical_health": "Medical health", 
      "facility_type___social_services": "Social services"
    }
    if (text in lookup) {
      var capitalText = lookup[text]
    }
    else {
      var capitalText = text.charAt(0).toUpperCase() + text.slice(1);
    }

    return capitalText.replace(/_/g, ' ')
  },

  addUnderscore: function(text) {
    newText = text.replace(/\s/g, '_').replace(/[\/]/g, '_').replace(/[\:]/g, '')
    if (newText[0].match(/^[1-9]\d*/)) {
      newText = "_" + newText
    }
    if (newText.indexOf("MISA") >= 0) {
      newText = "mental_illness_and_substance_abuse_misa_or_dual_diagnosis"
    }
    if (newText.indexOf("Community_meetings") >= 0) {
      newText = "community_meetings_aa_na"
    }
    if ((newText.indexOf("Mental_health") >= 0) || (newText.indexOf("Behavioral_health") >= 0) || (newText.indexOf("Medical_health") >= 0) || (newText.indexOf("Social_services") >= 0)) {
      newText = "facility_type___" + newText
    }
    return newText.toLowerCase();
  },

  // Call this in createSearch, when creating SQL queries from user selection.
  userSelectSQL: function(array) {
    var results = '';

    $.each( array, function(index, obj) {
      CartoDbLib.userSelection += " AND (LOWER(" + CartoDbLib.addUnderscore(obj.text) + ") LIKE '%yes%' or LOWER(" + CartoDbLib.addUnderscore(obj.text) + ") = 'true')"
      results += (obj.text + ", ")
    })
    
    return results
  },

  createSQL: function() {
     // Devise SQL calls for geosearch and language search.
    var address = $("#search-address").val();

    if(CartoDbLib.currentPinpoint != null && address != '') {
      CartoDbLib.geoSearch = "ST_DWithin(ST_SetSRID(ST_POINT(" + CartoDbLib.currentPinpoint[1] + ", " + CartoDbLib.currentPinpoint[0] + "), 4326)::geography, the_geom::geography, " + CartoDbLib.radius + ")";
    }
    else {
      CartoDbLib.geoSearch = ''
    }

    CartoDbLib.userSelection = '';
    // Gets selected elements in dropdown (represented as an array of objects).
    var ageUserSelections = ($("#select-age").select2('data'))
    var langUserSelections = ($("#select-language").select2('data'))
    var typeUserSelections = ($("#select-type").select2('data'))
    var programUserSelections = ($("#select-program").select2('data'))
    var insuranceUserSelections = ($("#select-insurance").select2('data'))

    // Set results equal to varaible – to be used when creating cookies.
    var ageResults = CartoDbLib.userSelectSQL(ageUserSelections);
    CartoDbLib.ageSelections = ageResults;

    var langResults = CartoDbLib.userSelectSQL(langUserSelections);
    CartoDbLib.langSelections = langResults;

    var facilityTypeResults = CartoDbLib.userSelectSQL(typeUserSelections);
    CartoDbLib.typeSelections = facilityTypeResults;

    var programResults = CartoDbLib.userSelectSQL(programUserSelections);
    CartoDbLib.programSelections = programResults;

    var insuranceResults = CartoDbLib.userSelectSQL(insuranceUserSelections);
    CartoDbLib.insuranceSelections = insuranceResults;

    lgbtq_checked = $('#lgbtq').is(':checked')
    if (lgbtq_checked == true) {
      CartoDbLib.userSelection += " AND LOWER(specialize_with_lgbtq) LIKE '%yes%'";
      CartoDbLib.lgbtqSelection = 'true';
    } else {
      CartoDbLib.lgbtqSelection = '';
    }

    CartoDbLib.whereClause = " WHERE the_geom is not null AND ";

    if (CartoDbLib.geoSearch != "") {
      CartoDbLib.whereClause += CartoDbLib.geoSearch;
      CartoDbLib.whereClause += CartoDbLib.userSelection;
    }
    else {
      CartoDbLib.whereClause = " WHERE the_geom is not null ";
      CartoDbLib.whereClause += CartoDbLib.userSelection;
    }
  },

  setZoom: function() {
    var zoom = '';
    if (CartoDbLib.radius >= 8050) zoom = 12; // 5 miles
    else if (CartoDbLib.radius >= 3220) zoom = 13; // 2 miles
    else if (CartoDbLib.radius >= 1610) zoom = 14; // 1 mile
    else if (CartoDbLib.radius >= 805) zoom = 15; // 1/2 mile
    else if (CartoDbLib.radius >= 400) zoom = 16; // 1/4 mile
    else zoom = 16;

    CartoDbLib.map.setView(new L.LatLng( CartoDbLib.currentPinpoint[0], CartoDbLib.currentPinpoint[1] ), zoom)
  },

  addIcon: function() {
    CartoDbLib.centerMark = new L.Marker(CartoDbLib.currentPinpoint, { icon: (new L.Icon({
            iconUrl: '/img/blue-pushpin.png',
            iconSize: [32, 32],
            iconAnchor: [10, 32]
    }))});

    CartoDbLib.centerMark.addTo(CartoDbLib.map);
  },

  addCircle: function() {
    CartoDbLib.radiusCircle = new L.circle(CartoDbLib.currentPinpoint, CartoDbLib.radius, {
        fillColor:'#1d5492',
        fillOpacity:'0.2',
        stroke: false,
        clickable: false
    });

    CartoDbLib.radiusCircle.addTo(CartoDbLib.map);
  },

  addCookieValues: function() {
    var objArr = new Array

    if ($.cookie("probationResources") != null) {
      storedObject = JSON.parse($.cookie("probationResources"));
      objArr.push(storedObject)
    }

    var path = $.address.value();
    var save_name = $("#saveInput").val()

    var parameters = {
      "address": CartoDbLib.address,
      "radius": CartoDbLib.radius,
      "age": CartoDbLib.ageSelections,
      "language": CartoDbLib.langSelections,
      "type": CartoDbLib.typeSelections,
      "insurance": CartoDbLib.insuranceSelections,
      "lgbtq": CartoDbLib.lgbtqSelection,
      "program": CartoDbLib.programSelections,
      "path": path,
      "save_name": save_name,
    }

    objArr.push(parameters)
    flatArray = [].concat.apply([], objArr)
    $.cookie("probationResources", JSON.stringify(flatArray));
  },

  renderSavedResults: function() {
    $('.saved-searches').empty();
    $('.saved-searches').append('<li class="dropdown-header">Saved searches</li><li class="divider"></li>');

    var objArray = JSON.parse($.cookie("probationResources"));

    if (objArray == null || objArray.length == 0) {
      $('#saved-searches-nav').hide();
    }
    else {
      $('#saved-searches-nav').show();
      $.each(objArray, function( index, obj ) {
        text = obj.save_name

        $('.saved-searches').append('<li><a href="#" class="remove-icon"><i class="fa fa-times"></i></a><a class="saved-search" href="#"> ' + obj.save_name + '<span class="hidden">' + obj.path + '</span></a></li>');
      });
    }
  },

  returnSavedResults: function(path) {
    var objArray = JSON.parse($.cookie("probationResources"));

    $.each(objArray, function( index, obj ) {
      if (obj.path == path ) {
        $("#search-address").val(obj.address);
        $("#search-radius").val(obj.radius);

        if (obj.lgbtq != '') {
          $("#lgbtq").prop( "checked", true );
        } else {
          $("#lgbtq").prop( "checked", false );
        }

        var ageArr     = CartoDbLib.makeSelectionArray(obj.age, ageOptions);
        $('#select-age').val(ageArr).trigger("change");

        var langArr    = CartoDbLib.makeSelectionArray(obj.language, languageOptions);
        $('#select-language').val(langArr).trigger("change");

        var typeArr    = CartoDbLib.makeSelectionArray(obj.type, facilityTypeOptions);
        $('#select-type').val(typeArr).trigger("change");

        var programArr = CartoDbLib.makeSelectionArray(obj.program, programOptions);
        $('#select-program').val(programArr).trigger("change");

        var insureArr  = CartoDbLib.makeSelectionArray(obj.insurance, insuranceOptions);
        $('#select-insurance').val(insureArr).trigger("change");
      }
    });

  },
// Resets select2 selectors to match CartoDb field names. Takes a string from returnSavedResults iteration, and takes an array from the array variables in map.js.
  makeSelectionArray: function(string, selectionArray){
    var newArr = string.split(",")
    newArr.pop();

    var indexArray = new Array

    $.each( newArr, function( index, el ) {
      var value = CartoDbLib.removeWhiteSpace(el);
      value = CartoDbLib.addUnderscore(value);
      indexArray.push(selectionArray.indexOf(value));
    });

    return indexArray
  },

  deleteSavedResult: function(path) {
    var objArray = JSON.parse($.cookie("probationResources"));

    for (var idx = 0; idx < objArray.length; idx++) {
      if (objArray[idx].path == path ) {
        objArray.splice(idx, 1);
      }
    }

    $.cookie("probationResources", JSON.stringify(objArray), { path: '/' });
    CartoDbLib.renderSavedResults();
  },

  addFacilityCookie: function(address, id_nbr) {
    var objArr = new Array

    if ($.cookie("location") != null) {
      storedObject = JSON.parse($.cookie("location"));
      objArr.push(storedObject)
    }

    var parameters = {
      "address": address,
      "id": id_nbr
    }

    objArr.push(parameters)
    // Concatenate and flatten array of objects, after pushing new 'parameters' in.
    flatArray = [].concat.apply([], objArr)
    $.cookie("location", JSON.stringify(flatArray), { path: '/' });
    CartoDbLib.updateSavedCounter();
  },

  // Call when rendering list. To determine icon.
  checkCookieDuplicate: function(id_nbr) {
    var objArray = JSON.parse($.cookie("location"));
    var returnVal = true;

    if (objArray != null) {
      $.each(objArray, function( index, obj ) {
        if (obj.id == id_nbr) {
          returnVal = false;
        }
      });
    }

    return returnVal;
  },

  renderSavedFacilities: function() {
    $("#locations-div").empty();

    var elements = {
      facility: '',
      address: '',
      hours: '',
      phone: '',
      website: ''
    };

    var objArray = JSON.parse($.cookie("location"));

    if (objArray != null) {
      // Create SQL call.
      CartoDbLib.whereClause = " WHERE the_geom is not null AND "
      $.each(objArray, function( index, obj ) {
        CartoDbLib.whereClause += "id=" + obj.id + " OR "
      });
      CartoDbLib.whereClause += "id=0"

      // Execute SQL.
      var sql = new cartodb.SQL({ user: CartoDbLib.userName });
      sql.execute("SELECT " + CartoDbLib.fields + " FROM " + CartoDbLib.tableName + CartoDbLib.whereClause)
        .done(function(listData) {
          var obj_array = listData.rows;

          for (idx in obj_array) {
            var attributeArr = new Array;
            var facilityName = obj_array[idx].organization_name;
            var facilityAddress = obj_array[idx].full_address;
            var facilityHours = obj_array[idx].hours_of_operation;
            var facilityNumber = obj_array[idx].intake_number;
            var facilityWebsite = obj_array[idx].website;
            var givenId = obj_array[idx].id;
            var icon = ''
            var site = ''

            attributeArr.push(facilityName, facilityAddress, facilityHours, facilityNumber, facilityWebsite);

            // Check that the array has only five elements (start count from 0).
            if (CartoDbLib.deleteBlankResults(attributeArr) < 5) {
              if (facilityName != "") {
                elements["facility"] = facilityName;
              }
              if (facilityAddress != "") {
                elements["address"] = facilityAddress;
              }
              if (facilityHours != "") {
                elements["hours"] = facilityHours;
              }
              if (facilityNumber != "") {
                elements["phone"] = facilityNumber;
              }
              if (facilityWebsite != "") {
                site = "<a href='{{website}}' target='_blank'><i class='fa fa-reply' aria-hidden='true'></i> Website</a>"
                if (facilityWebsite.match(/^http/)) {
                  elements["website"] = facilityWebsite;
                }
                else {
                  elements["website"] = "http://" + facilityWebsite;
                }
              }

              var output = Mustache.render("<tr><td><span class='facility-name'>{{facility}}</span>" +
                "<span class='given-id hidden'>" + givenId + "</span>" + "<br>" +
                "<td class='hidden-xs'>{{hours}}</td>" +
                "<td style='width: 300px'><i class='fa fa-map-marker' aria-hidden='true'></i>&nbsp&nbsp<span class='facility-address'>{{address}}</span><br>" +
                "<span class='modal-directions'><a href='http://maps.google.com/?q={{address}}' target='_blank'>GET DIRECTIONS</a></span><br>" +
                "<i class='fa fa-phone'></i>&nbsp<span class='facility-phone'>{{phone}}</span><br>" +
                "<span class='facility-site hidden-xs'>" + site + "</span><br>" +
                "<a class='remove-location btn-sm btn-reset hidden-sm hidden-md hidden-lg'><i class='fa fa-times' aria-hidden='true'></i> Remove</a></td>" +
                "<td class='hidden-xs no-wrap'><a class='remove-location btn-sm btn-reset'><i class='fa fa-times' aria-hidden='true'></i> Remove</a></td>" +
                "</tr>", elements);

              $("#locations-div").append(output);
            }
          }
          // Activate jQuery for removing a location.
          $(".remove-location").on('click', function() {
            var tr = $(this).parent().parent();
            var id_nbr = tr.children().eq(0).find('.given-id').text();
            CartoDbLib.deleteSavedFacility(id_nbr);
            tr.remove();
          });

          // Activate jQuery for modalPop.
          $(".facility-name").on('click', function() {

            var thisId = $(this).siblings().text();
            var objArray = listData.rows;
            $.each(objArray, function( index, obj ) {
              if (obj.id == thisId ) {
                CartoDbLib.modalPop(obj)
              }
            });

          });

        });
    }
  },

  deleteSavedFacility: function(givenId) {
    var objArray = JSON.parse($.cookie("location"));

    for (var idx = 0; idx < objArray.length; idx++) {
      if (objArray[idx].id == givenId ) {
        objArray.splice(idx, 1);
      }
    }

    $.cookie("location", JSON.stringify(objArray), { path: '/' });
    CartoDbLib.updateSavedCounter();
  },

  updateSavedCounter: function() {
    $("#saved-locations").empty();
    $("#no-locations").empty();

    var objArray = JSON.parse($.cookie("location"));

    if (objArray == null || objArray.length == 0) {
      $("#saved-locations").hide();
      $("#no-locations").append("No saved locations. Return <a href='/'>home</a> to search for more results.")
      document.cookie = 'location=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
    else if (objArray.length == 1) {
      $("#saved-locations").show();
      $("#saved-locations").append('<span class="badge">' + objArray.length + '</span>' + " Location saved")
    }
    else {
      $("#saved-locations").append('<span class="badge">' + objArray.length + '</span>' + " Locations saved")
    }

  },

  removeWhiteSpace: function(word) {
    while(word.charAt(0) === ' ')
        word = word.substr(1);
    return word;
  },

  urlExists: function(url, cb){
    jQuery.ajax({
        url:      url,
        dataType: 'text',
        type:     'GET',
        complete:  function(xhr){
            if(typeof cb === 'function')
               cb.apply(this, [xhr.status]);
        }
    });
  },

}