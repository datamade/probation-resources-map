describe "page", type: :feature, js: true do

  describe "navbar" do
    before(:each) { visit '/' }

    it "has a page title" do
      # binding.pry # test will pause here
      expect(find('.navbar-brand').text).to eq('Probation Community Resources')
    end

    it "has an About" do
      expect(find('#navbar ul li:nth-child(3)').text).to eq('About')
    end

    it "has an Add a location" do
      expect(find('#navbar ul li:nth-child(4)').text).to eq('Add a location')
    end
  end

  describe "map canvas" do
    before(:each) { visit '/' }

    it "has a results div" do
      expect(page).to have_selector('.results-count', visible: true)
    end

    it "has an info div" do
      expect(page).to have_selector('.results-count', visible: true)
    end
  end

end