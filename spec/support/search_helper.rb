module SearchHelper
  def do_search(address)
    visit '/'
    expect(page).to have_selector('#btnViewMode')
    fill_in 'search-address', :with => address
    find("#btnSearch", match: :first).click
  end
end