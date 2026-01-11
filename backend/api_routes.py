from flask import Blueprint, request, jsonify
from auth_middleware import require_auth
from project import Project
import logging

logger = logging.getLogger(__name__)

api_v2 = Blueprint('api_v2', __name__, url_prefix='/api/v2')

@api_v2.route('/projects', methods=['POST'])
@require_auth
def create_project(current_user):
    """Creates a new project associated with the authenticated user."""
    try:
        user_id = current_user.get('sub')
        if not user_id:
            return jsonify({"error": "User ID not found in token"}), 401

        data = request.json
        project_name = data.get("name", "New Project")
        
        from user_service import UserService
        project = UserService.create_project(user_id, project_name)

        logger.info(f"User '{user_id}' created project '{project_name}' ({project.get('project_id')})")

        return jsonify({
            "status": "created",
            "project_id": str(project.get('project_id')),
            "project_name": project.get('name')
        }), 201

    except Exception as e:
        # Check if user_id is defined before using it in logger
        uid = current_user.get('sub') if 'current_user' in locals() else 'unknown'
        logger.error(f"Error creating project for user '{uid}': {e}", exc_info=True)
        return jsonify({"error": "Failed to create project on server"}), 500

@api_v2.route('/projects', methods=['GET'])
@require_auth
def get_projects(current_user):
    """Lists all projects for the authenticated user."""
    try:
        user_id = current_user.get('sub')
        from user_service import UserService
        projects = UserService.get_all_projects(user_id)

        # Transform for frontend if needed, or return as is
        # UserService returns list of project dicts

        return jsonify({"projects": projects}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to list projects: {str(e)}"}), 500
