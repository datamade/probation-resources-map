require 'support/search_helper.rb'

describe "events", type: :feature, js: true do
  include SearchHelper

  describe "click search button" do
    it 'adds a pushpin' do
      do_search
      # binding.pry # test will pause here
      expect(page).to have_xpath('//img[@src="/img/blue-pushpin.png"]')
    end

    it 'updates the results' do
      do_search
      expect(find('.results-count').text).to eq('Results: 1')
    end

    it 'updates the info div' do
      do_search
      expect(find('.info').text).to eq('Hover over an area')
    end
  end

  describe "click mode view button" do
    it 'shows a list' do
      do_search
      find('#btnViewMode', match: :first).click
      expect(page).to have_selector('#listCanvas', visible: true)
    end

    it 'shows a map' do
      do_search
      find('#btnViewMode', match: :first).click
      find('#btnViewMode', match: :first).click
      expect(page).to have_selector('#mapCanvas', visible: true)
    end
  end

end