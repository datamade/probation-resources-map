var CartoDbLib = CartoDbLib || {};
var CartoDbLib = {

  map_centroid:    [41.87811, -87.66677],
  defaultZoom:     11,
  lastClickedLayer: null,
  locationScope:   "chicago",
  currentPinpoint: null,
  layerUrl: 'https://clearstreets.carto.com/api/v2/viz/efcba8d2-4d16-11e6-a770-0e05a8b3e3d7/viz.json',
  tableName: 'probationresourcesmap_mergeddata_resources',
  userName: 'clearstreets',
  geoSearch: '',
  whereClause: '',
  userSelection: '',
  radius: '',
  fields: "cartodb_id, full_address, organization_name, hours_of_operation, website, intake_number, spanish_language_emphasized, asl_or_other_assistance_for_hearing_impaired, sliding_fee_scale, private_health_insurance, military_insurance, medicare, medicaid",

  initialize: function(){
    //reset filters
    $("#search_address").val(CartoDbLib.convertToPlainString($.address.parameter('address')));

    geocoder = new google.maps.Geocoder();

    // initiate leaflet map
    if (!CartoDbLib.map) {
      CartoDbLib.map = new L.Map('mapCanvas', {
        center: CartoDbLib.map_centroid,
        zoom: CartoDbLib.defaultZoom
      });

      CartoDbLib.google = new L.Google('ROADMAP', {animate: false});

      CartoDbLib.map.addLayer(CartoDbLib.google);

      CartoDbLib.info = L.control({position: 'bottomleft'});

      CartoDbLib.info.onAdd = function (map) {
          this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
          this.update();
          return this._div;
      };

      // method that we will use to update the control based on feature properties passed
      CartoDbLib.info.update = function (props) {
        if (props) {
          this._div.innerHTML = props.full_address;
        }
        else {
          this._div.innerHTML = 'Hover over an area';
        }
      };

      CartoDbLib.info.clear = function(){
        this._div.innerHTML = '';
      };

      CartoDbLib.info.addTo(CartoDbLib.map);
      CartoDbLib.doSearch();
    }
  },

  doSearch: function() {
    CartoDbLib.clearSearch();

    var address = $("#search_address").val();
    CartoDbLib.radius = $("#search-radius").val();

    if (address != "") {
      if (address.toLowerCase().indexOf(CartoDbLib.locationScope) == -1)
        address = address + " " + CartoDbLib.locationScope;

      geocoder.geocode( { 'address': address }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          CartoDbLib.currentPinpoint = [results[0].geometry.location.lat(), results[0].geometry.location.lng()];
          $.address.parameter('address', encodeURIComponent(address));

          CartoDbLib.createSQL();
          CartoDbLib.setZoom();
          CartoDbLib.addIcon();
          CartoDbLib.addCircle();
          CartoDbLib.renderList();
          CartoDbLib.renderMap();
        }
        else {
          alert("We could not find your address: " + status);
        }
      });
    }
    else { //search without geocoding callback
      CartoDbLib.map.setView(new L.LatLng( CartoDbLib.map_centroid[0], CartoDbLib.map_centroid[1] ), CartoDbLib.defaultZoom)
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
        }).error(function(e) {
          //console.log('ERROR')
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

    results.empty();
    sql.execute("SELECT * FROM " + CartoDbLib.tableName + CartoDbLib.whereClause)
      .done(function(listData) {
        var obj_array = listData.rows;
        if (listData.rows.length == 0) {
          results.append("<p class='no-results'>No results. Please broaden your search.</p>");
        }
        else {
          for (idx in obj_array) {
            if (obj_array[idx].organization_name != "") {
              elements["facility"] = obj_array[idx].organization_name;
            }
            if (obj_array[idx].full_address != "") {
              elements["address"] = obj_array[idx].full_address;
            }
            if (obj_array[idx].hours_of_operation != "") {
              elements["hours"] = obj_array[idx].hours_of_operation;
            }
            if (obj_array[idx].intake_number != "") {
              elements["phone"] = obj_array[idx].intake_number;
            }
            if (obj_array[idx].website != "") {
              elements["website"] = obj_array[idx].website;
            }

            var output = Mustache.render("<tr><td>{{facility}}</td><td>{{address}}</td><td>{{hours}}</td><td><strong>Phone:</strong> {{phone}} <br><strong>Website:</strong> {{website}}</td></tr>", elements);

            results.append(output);
          }
        }
    })
    .error(function(errors) {
      console.log("errors:" + errors);
    });
  },

  modalPop: function(data) {
      var modalText = "<p>" + data.full_address + "</p>" + "<p>" + data.hours_of_operation + "</p>" + "<p>" + data.intake_number + "</p>" + "<p><a href='" + data.website + "' target='_blank'>" + data.website + "</a></p>"

      $('#modal-pop').modal();
      $('#modal-title, #modal-main, #language-header, #insurance-header, #insurance-subsection, #language-subsection').empty();
      $('#modal-title').append(data.organization_name)
      $('#modal-main').append(modalText);

      var insurance_count = 0
      var language_count = 0
      // Find all instances of "yes."
      for (prop in data) {
        var value = data[prop];
        if (String(value).toLowerCase() == "yes") {
          if ($.inArray(String(prop), insurance) > -1) {
            $("#insurance-subsection").append("<p>" + CartoDbLib.removeUnderscore(prop) + "</p>");
            insurance_count += 1;
          }
          if ($.inArray(String(prop), language) > -1) {
            $("#language-subsection").append("<p>" + CartoDbLib.removeUnderscore(prop) + "</p>");
            language_count += 1;
          }
        }
      }
      // Add headers or not.
      if (insurance_count > 0) {
        $("#insurance-header").append("Payment Options");
      }
      if (language_count > 0) {
        $("#language-header").append("Language");
      }
      $('#modal-main').append('<p><a href="http://maps.google.com/?q=' + data.full_address + '" target="_blank">Get Directions</a></p>')
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
          $('#search_address').val(results[1].formatted_address);
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

  removeUnderscore: function(text) {
    return text.replace(/_/g, ' ')
  },

  addUnderscore: function(text) {
    return text.replace(/\s/g, '_')
  },

  // Call this in createSearch, when creating SQL queries from user selection.
  userSelectSQL: function(array) {
    for(var i = 0; i < array.length; i++) {
          var obj = array[i];
          CartoDbLib.userSelection += " AND LOWER(" + CartoDbLib.addUnderscore(obj.text) + ") LIKE 'yes'"
      }
  },

  createSQL: function() {
     // Devise SQL calls for geosearch and language search.
    CartoDbLib.geoSearch = "ST_DWithin(ST_SetSRID(ST_POINT(" + CartoDbLib.currentPinpoint[1] + ", " + CartoDbLib.currentPinpoint[0] + "), 4326)::geography, the_geom::geography, " + CartoDbLib.radius + ")";

    CartoDbLib.userSelection = '';
    // Gets selected elements in dropdown (represented as an array of objects).
    var lang_selections = ($("#select-language").select2('data'))
    var insurance_selections = ($("#select-insurance").select2('data'))

    CartoDbLib.userSelectSQL(lang_selections);
    CartoDbLib.userSelectSQL(insurance_selections);

    CartoDbLib.whereClause = " WHERE the_geom is not null AND "

    if (CartoDbLib.geoSearch != "") {
      CartoDbLib.whereClause += CartoDbLib.geoSearch;
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
  }

}