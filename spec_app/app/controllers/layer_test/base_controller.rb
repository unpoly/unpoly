module LayerTest
  class BaseController < ApplicationController

    before_filter :set_nav

    private

    def set_nav
      @nav = 'layer_test/nav'
    end

  end
end

