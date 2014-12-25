class CardsController < ApplicationController

  def index
    load_cards
  end

  def show
    load_cards
    load_card
  end

  private

  def card_scope
    Card.all
  end

  def load_cards
    @cards ||= card_scope.to_a
  end

  def load_card
    @card ||= card_scope.find(params[:id])
  end

end
