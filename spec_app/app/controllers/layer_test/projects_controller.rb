module LayerTest
  class ProjectsController < ApplicationController

    def new
      build_project
    end

    def create
      build_project
      save_project(form: 'new')
    end

    def edit
      load_project
      build_project
    end

    def update
      load_project
      build_project
      save_project(form: 'update')
    end

    def show
      load_project
    end

    def index
      load_projects
    end

    private

    def build_project
      @project ||= project_scope.build
      @project.attributes = project_attributes
    end

    def load_project
      @project ||= project_scope.find(params[:id])
    end

    def save_project(form:)
      if up.validate?
        @project.valid? # run validations
        render form
      elsif @project.save
        redirect_to [:layer_test, @project]
      else
        render form, status: :bad_request
      end
    end

    def load_projects
      @projects = project_scope.order(:name).to_a
    end

    def project_scope
      Project.all
    end

    def project_attributes
      if (attrs = params[:project])
        attrs.permit(:name, :budgets_attributes => [ :id ])
      else
        {}
      end
    end

  end
end
