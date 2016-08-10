require 'support/search_helper.rb'

describe "events", type: :feature, js: true do
  include SearchHelper
  let(:address) { '441 North Milwaukee Avenue, Chicago, IL, United States' }

  describe "click search button" do
    it 'adds a pushpin' do
      do_search(address)
      # binding.pry # test will pause here
      expect(page).to have_xpath('//img[@src="/img/blue-pushpin.png"]')
    end

    it 'updates the results' do
      do_search(address)
      expect(find('.results-count').text).to eq('Results: 1')
    end

    it 'updates the info div' do
      do_search(address)
      expect(find('.info').text).to eq('Hover over a location')
    end
  end

  describe "click mode view button" do
    it 'shows a list' do
      do_search(address)
      find('#btnViewMode', match: :first).click
      expect(page).to have_selector('#listCanvas', visible: true)
    end

    it 'shows a map' do
      do_search(address)
      find('#btnViewMode', match: :first).click
      find('#btnViewMode', match: :first).click
      expect(page).to have_selector('#mapCanvas', visible: true)
    end
  end

  describe "click save search button" do
    it "adds an item to nav bar" do
      do_search(address)
      find("#btnSave", match: :first).click
      expect(page).to have_selector('#dropdown-results', visible: true)
    end

    it "adds a list item to dropdown menu" do
      do_search(address)
      find("#btnSave", match: :first).click
      find(".dropdown-toggle", match: :first).click
      searches = Array.new
      searches = find('.saved-searches').all('li')
      original_list = searches.length
      # Do another search with new address.
      do_search('432 North Clark Street, Chicago, IL, United States')
      find("#btnSave", match: :first).click
      find(".dropdown-toggle", match: :first).click
      searches_redux = Array.new
      searches_redux = find('.saved-searches').all('li')
      expect(searches_redux.length - original_list).to eq(1)
    end
  end

  describe "click reset" do
    it "resets the page" do
      do_search(address)
      find("#btnReset", match: :first).click
      uri = URI.parse(current_url)
      expect("#{uri.path}?#{uri.query}").to eq("/?")
    end
  end

  describe "save facility" do
    it "adds an element to nav bar" do
      do_search(address)
      find('#btnViewMode', match: :first).click
      find(".fa-bookmark", match: :first).click
      expect(page).to have_selector("#saved-locations", visible: true)
    end

    it "changes the icon to a circle" do
      do_search(address)
      find('#btnViewMode', match: :first).click
      find(".fa-bookmark", match: :first).click
      expect(page).to have_selector(".fa-check-circle", visible: true)
    end
  end

  describe "click on map content" do
    it "creates a modal pop-up" do
      # find("#mapCanvas").click_at(50, 50)
    end
  end

end