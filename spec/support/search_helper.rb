module SearchHelper
  def do_search
    visit '/'
    expect(page).to have_selector('#btnViewMode')
    fill_in 'search-address', :with => '441 North Milwaukee Avenue, Chicago, IL, United States'
    find("#btnSearch", match: :first).click
  end
end