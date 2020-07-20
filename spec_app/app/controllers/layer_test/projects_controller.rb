module LayerTest
  class ProjectsController < BaseController

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
      save_project(form: 'edit')
    end

    def show
      load_project
    end

    def index
      load_projects
    end

    def destroy
      load_project
      if @project.destroy
        redirect_to layer_test_companies_path
      else
        redirect_to [:layer_test, @project], alert: 'Could not delete project'
      end
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
      @projects = project_scope.includes(:company).order(:name).to_a
    end

    def project_scope
      Project.all
    end

    def project_attributes
      if (attrs = params[:project])
        attrs.permit(:name, :company_id)
      else
        {}
      end
    end

  end
end
