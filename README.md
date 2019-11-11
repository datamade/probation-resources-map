# Probation Community Resources

Probation Community Resources is an online interactive, searchable map that helps users:

-   find **social, health, and cultural resources** throughout Chicago
-   identify services within **certain geographic boundaries**
-   suggest **updates, changes, and additions** to the directory

Built in collaboration with the Cook County Adult Probation Department (CCAPD), the Cook County Juvenile Probation Department (CCJPD), the Sargent Shriver National Center on Poverty Law, the Chicago Appleseed Fund, and the Health & Medicine Policy Research Group, Probation Community Resources helps criminal justice personnel refer clients to culturally relevant and geographically specific community-based services.

![Probation Community Resources](https://raw.githubusercontent.com/datamade/probation-resources-map/master/images/probation-community-resources.jpg)

## Installation

<pre>
  $ git clone https://github.com/datamade/probation-resources-map.git
  $ cd site_template
  $ gem install jekyll
  $ jekyll serve -w
  navigate to http://localhost:5000/
</pre>

## Dependencies

* [Jekyll](http://jekyllrb.com)
* [CartoDB](http://docs.cartodb.com/cartodb-platform/cartodb-js.html)
* [Leaflet](http://leafletjs.com)
* [jQuery](http://jquery.org)
* [jQuery Address](http://www.asual.com/jquery/address)
* [Bootstrap](http://getbootstrap.com)

## Data

The data for this tool resides in a Google spreadsheet and its corresponding Carto table.

Most of the data has been (and continues to be) manually entered by people associated with CCAPD, CCJPD, the Shriver Center, the Appleseed Fund, and the HMPR Group. One data piece can be automated: the discovery of latitude and longitude for facility addresses. We use [Google Sheets Geocoder](https://github.com/jackdougherty/google-sheets-geocoder) - specifically, [geocoder-census-google.gs](https://raw.githubusercontent.com/JackDougherty/google-sheets-geocoder/master/geocoder-census-google.gs) - a library that converts addresses into lat-long coordinates.

## Run Tests

This site includes a basic test suite built with Rspec and Capybara, which drive the browser to perform acceptance tests.

<pre>
  $ bundle install
  $ rspec spec/
</pre>

Some tests include **binding.pry**. In such cases the test pauses, after which you may type "exit" in the terminal to continue.

## Team

* [Derek Eder](mailto:derek.eder+git@gmail.com)
* [Regina Compton](mailto:reginafcompton@datamade.us)

## Errors / Bugs

If something is not behaving intuitively, it is a bug, and should be reported.
Report it here: https://github.com/datamade/probation-resources-map/issues

## Note on Patches/Pull Requests

* Fork the project.
* Make your feature addition or bug fix.
* Commit, do not mess with rakefile, version, or history.
* Send a pull request. Bonus points for topic branches.

## Copyright

Copyright (c) 2016 DataMade. Released under the MIT License.

[See LICENSE for details](https://github.com/datamade/probation-resources-map/blob/master/LICENSE)
