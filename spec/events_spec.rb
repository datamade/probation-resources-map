describe "events", type: :feature, js: true do
  describe "click search button" do

    it 'adds a pushpin' do
      visit '/'
      expect(page).to have_selector('#search_address')
      fill_in 'search_address', :with => '1035 North Clark Street, Chicago, IL, United States'
      find("#btnSearch", match: :first).click
      # binding.pry # test will pause here
      expect(page).to have_xpath('//img[@src="/img/blue-pushpin.png"]')
    end

  end
end