var CartoDbLib = CartoDbLib || {};
var CartoDbLib = {

  map_centroid:    [41.87811, -87.66677],
  defaultZoom:     11,
  lastClickedLayer: null,
  locationScope:   "chicago",
  currentPinpoint: null,
  layerUrl: 'https://clearstreets.carto.com/api/v2/viz/efcba8d2-4d16-11e6-a770-0e05a8b3e3d7/viz.json',
  tableName: 'probationresourcesmap_mergeddata_resources',

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

      var fields = "cartodb_id, full_address, organization_name, hours_of_operation, website, intake_number, spanish_language_emphasized, asl_or_other_assistance_for_hearing_impaired, sliding_fee_scale, private_health_insurance, military_insurance, medicare, medicaid"
      var layerOpts = {
        user_name: 'clearstreets',
        type: 'cartodb',
        cartodb_logo: false,
        sublayers: [
          {
            sql: "select * from " + CartoDbLib.tableName,
            cartocss: $('#probation-maps-styles').html().trim(),
            interactivity: fields
          }
        ]
      }

      CartoDbLib.dataLayer = cartodb.createLayer(CartoDbLib.map, layerOpts, { https: true })
        .addTo(CartoDbLib.map)
        .done(function(layer) {
          var sublayer = layer.getSubLayer(0);
          sublayer.setInteraction(true);
          sublayer.on('featureOver', function(e, latlng, pos, data, subLayerIndex) {
            $('#mapCanvas div').css('cursor','pointer');
            CartoDbLib.info.update(data);
          })
          sublayer.on('featureOut', function(e, latlng, pos, data, subLayerIndex) {
            $('#mapCanvas div').css('cursor','inherit');
            CartoDbLib.info.clear();
          })
          // sublayer.on('featureClick', function(e, latlng, pos, data){
          //   CartoDbLib.getOneZone(data['cartodb_id'], latlng);
          // })
          // Modal pop-up.
          sublayer.on('featureClick', function(e, latlng, pos, data){
              var modalText = "<p>" + data.full_address + "</p>" + "<p>" + data.hours_of_operation + "</p>" + "<p>" + data.intake_number + "</p>" + "<p><a href='" + data.website + "' target='_blank'>" + data.website + "</a></p>"

              $('#modal-pop').modal();
              $('#modal-title, #modal-main, #language-header, #insurance-header').empty();

              $('#modal-title').append(data.organization_name)
              $('#modal-main').append(modalText);

// // How to handle YES and NO fields?
//               if (data.spanish_language_emphasized.toLowerCase() == "yes") {
//                 $('#modal-main').append("<p>Spanish language assistance available.</p>");
//               }
//               if (data.asl_or_other_assistance_for_hearing_impaired.toLowerCase() == "yes") {
//                 $('#modal-main').append("<p>ASL and assistance for hearing impaired available.</p>");
//               }

              console.log(data);

              var insurance = ["sliding_fee_scale", "private_health_insurance", "military_insurance", "medicare", "medicaid"]

              var language = ["spanish_language_emphasized", "asl_or_other_assistance_for_hearing_impaired"]

              var insurance_count = 0
              var language_count = 0
              for (prop in data) {
                var value = data[prop];
                if (String(value).toLowerCase() == "yes") {
                  for (val in insurance) {
                    if (insurance[val] == String(prop)) {
                      $("#insurance-subsection").append("<p>" + prop + "</p>");
                      insurance_count += 1;
                    }

                  }
                  for (val in language) {
                    if (language[val] == String(prop)) {
                      $("#language-subsection").append("<p>" + prop + "</p>");
                      language_count += 1;
                    }
                  }
                }

              }

              if (insurance_count > 0) {
                $("#insurance-header").append("Insurance");
              }

              if (language_count > 0) {
                $("#language-header").append("Language");
              }


              $('#modal-main').append('<p><a href="http://maps.google.com/?q=' + data.full_address + '" target="_blank">Get Directions</a></p>')
          })



// hours_of_operation, website, intake_number

          // after layer is loaded, add the layer toggle control
          L.control.layers(CartoDbLib.baseMaps, {"Zoning": layer}, { collapsed: false, autoZIndex: true }).addTo(CartoDbLib.map);

          // CartoDbLib.map.on('zoomstart', function(e){
          //   sublayer.hide();
          // })
          // google.maps.event.addListener(CartoDbLib.google._google, 'idle', function(e){
          //   sublayer.show();
          // })

          // window.setTimeout(function(){
          //   if($.address.parameter('id')){
          //     CartoDbLib.getOneZone($.address.parameter('id'))
          //   }
          // }, 500)
        }).error(function(e) {
          //console.log('ERROR')
          //console.log(e)
        });
      }

    CartoDbLib.doSearch();
  },

  doSearch: function() {
    CartoDbLib.clearSearch();
    var address = $("#search_address").val();

    if (address != "") {
      if (address.toLowerCase().indexOf(CartoDbLib.locationScope) == -1)
        address = address + " " + CartoDbLib.locationScope;

      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          CartoDbLib.currentPinpoint = [results[0].geometry.location.lat(), results[0].geometry.location.lng()];
          $.address.parameter('address', encodeURIComponent(address));
          CartoDbLib.map.setView(new L.LatLng( CartoDbLib.currentPinpoint[0], CartoDbLib.currentPinpoint[1] ), 16)
          CartoDbLib.centerMark = new L.Marker(CartoDbLib.currentPinpoint, { icon: (new L.Icon({
            iconUrl: '/images/blue-pushpin.png',
            iconSize: [32, 32],
            iconAnchor: [10, 32]
          }))}).addTo(CartoDbLib.map);

          var sql = new cartodb.SQL({user: 'datamade', format: 'geojson'});
          sql.execute('select cartodb_id, the_geom from ' + CartoDbLib.tableName + ' where ST_Intersects( the_geom, ST_SetSRID(ST_POINT({{lng}}, {{lat}}) , 4326))', {lng:CartoDbLib.currentPinpoint[1], lat:CartoDbLib.currentPinpoint[0]})
          .done(function(data){
            // console.log(data);
            CartoDbLib.getOneZone(data.features[0].properties.cartodb_id, CartoDbLib.currentPinpoint)
          }).error(function(e){console.log(e)});

          // CartoDbLib.drawCircle(CartoDbLib.currentPinpoint);
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

  clearSearch: function(){
    if (CartoDbLib.lastClickedLayer) {
      CartoDbLib.map.removeLayer(CartoDbLib.lastClickedLayer);
    }
    if (CartoDbLib.centerMark)
      CartoDbLib.map.removeLayer( CartoDbLib.centerMark );
    if (CartoDbLib.circle)
      CartoDbLib.map.removeLayer( CartoDbLib.circle );

    CartoDbLib.map.setView(new L.LatLng( CartoDbLib.map_centroid[0], CartoDbLib.map_centroid[1] ), CartoDbLib.defaultZoom)
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
  }
}