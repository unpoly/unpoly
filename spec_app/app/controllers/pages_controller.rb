class PagesController < ApplicationController

  layout 'integration_test'

  # def start
  #   cookies['baram'] = { value: 'baz;bam', expires: 2.days.from_now }
  # end
  #
  def one
    redirect_to '/pages/two'
  end

  def two
    render text: "This is two. Header X-Foo is #{request.headers['X-Foo']}"
  end

end
