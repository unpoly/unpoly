class CardsController < ApplicationController

  def index
    load_cards
  end

  def show
    load_cards
    load_card
  end

  def new
    load_cards
    build_card
  end

  def create
    load_cards
    build_card
    if @card.save
      redirect_to card_path(@card)
    else
      render 'new'
    end
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

  def build_card
    @card ||= card_scope.build
    @card.attributes = card_params
  end

  def card_params
    note_params = params[:card]
    note_params ? note_params.permit(:title, :body) : {}
  end

end
