describe "navbar", type: :feature, js: true do

  it "has a page title" do
    visit '/'
    # binding.pry # test will pause here
    expect(find('.navbar-brand').text).to eq('Probation Resources Map')
  end

  it "has an About" do
    visit '/'
    # binding.pry
    expect(find('#navbar ul li:first-child').text).to eq('About')
  end

  it "has a Contribute" do
    visit '/'
    # binding.pry
    expect(find('#navbar ul li:nth-child(2)').text).to eq('Contribute')
  end

end