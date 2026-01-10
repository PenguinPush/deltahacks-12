from flask import Flask, jsonify, request
from flask_cors import CORS
from blocks import Block
from project import Project
from block_types.api_block import APIBlock
from block_types.logic_block import LogicBlock
from block_types.react_block import ReactBlock
from block_types.transform_block import TransformBlock
from block_types.string_builder_block import StringBuilderBlock
from api_schemas import API_SCHEMAS
import collections
import json
from db import mongodb
from supabase_client import supabase_service
from datetime import datetime

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Initialize database connections
try:
    mongodb.connect()
    supabase_service.initialize()
except Exception as e:
    print(f"Failed to initialize services: {e}")
    # Continue anyway for development

# ==========================================
# PART 1: API Block Functionality & Execution Engine
# ==========================================

def execute_graph(start_blocks: list[Block], method: str = 'bfs'):
    """
    Executes the graph.
    """
    # 1. Discovery: Find all reachable blocks
    all_blocks = set()
    # We can use BFS or DFS here to discover nodes
    if method == 'dfs':
        stack = list(start_blocks)
        while stack:
            block = stack.pop()
            if block in all_blocks:
                continue
            all_blocks.add(block)
            for connectors in block.output_connectors.values():
                for connector in connectors:
                    stack.append(connector.target_block)
    else: # bfs
        queue = collections.deque(start_blocks)
        while queue:
            block = queue.popleft()
            if block in all_blocks:
                continue
            all_blocks.add(block)
            for connectors in block.output_connectors.values():
                for connector in connectors:
                    queue.append(connector.target_block)
    
    # 2. Build Dependency Graph & Calculate In-Degrees
    in_degree = {block: 0 for block in all_blocks}
    graph = {block: [] for block in all_blocks}
    
    for block in all_blocks:
        for connectors in block.output_connectors.values():
            for connector in connectors:
                target = connector.target_block
                if target in all_blocks:
                    graph[block].append(target)
                    in_degree[target] += 1

    # 3. Execution (Topological Sort)
    # Nodes with 0 in-degree are ready to execute
    ready_queue = collections.deque([b for b in all_blocks if in_degree[b] == 0])
    
    results = {}
    execution_order = []

    while ready_queue:
        current_block = ready_queue.popleft()
        execution_order.append(current_block.name)
        
        # Fetch inputs from upstream blocks
        current_block.fetch_inputs()
        
        # Execute the block
        print(f"Executing {current_block.name}...")
        current_block.execute()
        
        # Store results
        results[current_block.id] = {
            "name": current_block.name,
            "type": current_block.block_type,
            "outputs": current_block.outputs
        }

        # Propagate to neighbors
        for neighbor in graph[current_block]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                ready_queue.append(neighbor)
                
    return {
        "execution_order": execution_order,
        "block_results": results
    }

# ==========================================
# PART 2: Flask Linking to React Frontend
# ==========================================

# In-memory storage for the current project
current_project = Project("Demo Project")

def get_user_id_from_request():
    """Extract user_id from request headers or body"""
    # Try header first
    user_id = request.headers.get('X-User-ID')

    # Try request body
    if not user_id and request.json:
        user_id = request.json.get('user_id')

    return user_id

def ensure_user_exists(user_id):
    """
    Lazy user creation: If user_id doesn't exist in MongoDB,
    fetch from Supabase and create profile.
    """
    user = mongodb.get_user_by_supabase_id(user_id)

    if not user:
        # User doesn't exist in MongoDB, try to create from Supabase
        supabase_user = supabase_service.get_user_by_id(user_id)

        if supabase_user:
            # Create user profile
            user = mongodb.create_user(
                supabase_user_id=user_id,
                email=supabase_user.email,
                full_name=supabase_user.user_metadata.get('full_name', '') if supabase_user.user_metadata else ''
            )
            print(f"✓ Auto-created user profile for {user_id}")
        else:
            return None

    return user

def convert_workflow_to_project(workflow, input_data=None):
    """
    Convert MongoDB workflow format to executable Project with Blocks.

    MongoDB format:
    {
        "nodes": [{"id": "...", "name": "...", "block_type": "API", ...}],
        "edges": [{"source_id": "...", "target_id": "...", ...}]
    }
    """
    project = Project()

    # Create blocks from nodes
    nodes = workflow.get('nodes', [])
    for node in nodes:
        block_id = node.get('id')
        block_type = node.get('block_type', 'API')
        name = node.get('name', 'Unnamed Block')

        # Create appropriate block type
        if block_type == 'API':
            block = APIBlock(block_id=block_id, name=name)
            # Set API block properties
            block.url = node.get('url', '')
            block.method = node.get('method', 'GET')

        elif block_type == 'LOGIC':
            block = LogicBlock(block_id=block_id, name=name)
            # Logic blocks have custom transform functions

        elif block_type == 'REACT':
            block = ReactBlock(block_id=block_id, name=name)
            # Set initial input values if provided
            if input_data and block_id in input_data:
                block.set_input('user_input', input_data[block_id])

        elif block_type == 'TRANSFORM':
            block = TransformBlock(block_id=block_id, name=name)

        elif block_type == 'STRING_BUILDER':
            block = StringBuilderBlock(block_id=block_id, name=name)
        else:
            # Default to API block
            block = APIBlock(block_id=block_id, name=name)

        project.add_block(block)

    # Create connections from edges
    edges = workflow.get('connections', workflow.get('edges', []))
    for edge in edges:
        source_id = edge.get('source_id')
        source_output = edge.get('source_output', 'output')
        target_id = edge.get('target_id')
        target_input = edge.get('target_input', 'input')

        source_block = project.blocks.get(source_id)
        target_block = project.blocks.get(target_id)

        if source_block and target_block:
            source_block.connect(source_output, target_block, target_input)

    return project

def save_execution_result(workflow_id, user_id, results):
    """
    Save workflow execution results to MongoDB.
    Creates an execution history record.
    """
    try:
        execution_record = {
            'workflow_id': workflow_id,
            'user_id': user_id,
            'executed_at': datetime.utcnow(),
            'status': 'completed',
            'results': results,
            'execution_order': results.get('execution_order', []),
            'block_results': results.get('block_results', {})
        }

        # Store in executions collection
        if not hasattr(mongodb, 'executions'):
            mongodb.executions = mongodb.db['executions']

        mongodb.executions.insert_one(execution_record)
        print(f"✓ Saved execution result for workflow {workflow_id}")
    except Exception as e:
        print(f"✗ Failed to save execution result: {e}")

@app.route('/api/execute', methods=['POST'])
def run_graph():
    """
    Endpoint to trigger workflow execution from MongoDB.
    Expects JSON: { "workflow_id": "...", "method": "bfs", "input_data": {...} }
    """
    try:
        data = request.json
        workflow_id = data.get('workflow_id')
        method = data.get('method', 'bfs')
        input_data = data.get('input_data', {})

        # Get user_id for ownership verification
        user_id = get_user_id_from_request()

        if not workflow_id:
            # Fallback to demo workflow if no workflow_id provided
            global current_project
            if not current_project.blocks:
                return jsonify({"error": "No workflow specified and no demo workflow available"}), 400
            start_blocks = list(current_project.blocks.values())
        else:
            # Load workflow from MongoDB
            workflow = mongodb.get_workflow(workflow_id, user_id)

            if not workflow:
                return jsonify({"error": "Workflow not found or access denied"}), 404

            # Convert MongoDB workflow to executable blocks
            project = convert_workflow_to_project(workflow, input_data)
            start_blocks = list(project.blocks.values())

        # Execute the workflow
        results = execute_graph(start_blocks, method=method)

        # Save execution result to MongoDB
        if workflow_id and user_id:
            save_execution_result(workflow_id, user_id, results)

        return jsonify(results)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/workflows/<workflow_id>/executions', methods=['GET'])
def get_workflow_executions(workflow_id):
    """
    Get execution history for a workflow.
    """
    try:
        user_id = get_user_id_from_request()

        if not user_id:
            return jsonify({"error": "User ID required"}), 401

        # Ensure executions collection exists
        if not hasattr(mongodb, 'executions'):
            mongodb.executions = mongodb.db['executions']

        # Get executions for this workflow and user
        executions = list(mongodb.executions.find(
            {'workflow_id': workflow_id, 'user_id': user_id}
        ).sort('executed_at', -1).limit(50))

        # Convert ObjectId to string for JSON serialization
        for execution in executions:
            execution['_id'] = str(execution['_id'])

        return jsonify({"executions": executions}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# Schema Management Endpoints
# ============================================================================

@app.route('/api/schemas', methods=['GET'])
def get_schemas():
    """
    Get all schemas (global + user's private schemas).
    Query params:
      - type: Filter by schema_type (optional)
    """
    try:
        user_id = get_user_id_from_request()
        schema_type = request.args.get('type')

        schemas = mongodb.get_schemas(schema_type=schema_type, user_id=user_id)
        return jsonify({"schemas": schemas}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/schemas', methods=['POST'])
def create_schema():
    """
    Create a new schema.
    Expects JSON: {
      "schema_type": "api" | "node_template" | "integration",
      "name": "Schema Name",
      "config": {...},
      "is_global": false (optional)
    }
    """
    try:
        user_id = get_user_id_from_request()

        if not user_id:
            return jsonify({"error": "User ID required"}), 401

        data = request.json

        # Validate required fields
        if not data.get('schema_type'):
            return jsonify({"error": "schema_type is required"}), 400
        if not data.get('name'):
            return jsonify({"error": "name is required"}), 400
        if not data.get('config'):
            return jsonify({"error": "config is required"}), 400

        schema = mongodb.create_schema(
            schema_type=data['schema_type'],
            name=data['name'],
            config=data['config'],
            user_id=user_id,
            is_global=data.get('is_global', False)
        )

        return jsonify(schema), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/schemas/<schema_id>', methods=['PUT'])
def update_schema(schema_id):
    """
    Update a schema.
    Expects JSON with fields to update.
    """
    try:
        user_id = get_user_id_from_request()

        if not user_id:
            return jsonify({"error": "User ID required"}), 401

        data = request.json

        # Remove fields that shouldn't be updated directly
        updates = {k: v for k, v in data.items() if k not in ['_id', 'created_at', 'updated_at']}

        success = mongodb.update_schema(schema_id, user_id, updates)

        if success:
            return jsonify({"success": True, "schema_id": schema_id}), 200
        else:
            return jsonify({"error": "Schema not found or unauthorized"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/schemas/<schema_id>', methods=['DELETE'])
def delete_schema(schema_id):
    """
    Delete a schema.
    """
    try:
        user_id = get_user_id_from_request()

        if not user_id:
            return jsonify({"error": "User ID required"}), 401

        success = mongodb.delete_schema(schema_id, user_id)

        if success:
            return jsonify({"success": True}), 200
        else:
            return jsonify({"error": "Schema not found or unauthorized"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/update_input', methods=['POST'])
def update_react_input():
    """
    Endpoint for React frontend to send user input values.
    """
    data = request.json
    block_id = data.get("block_id")
    value = data.get("value")
    
    block = current_project.blocks.get(block_id)
    if block and isinstance(block, ReactBlock):
        block.set_user_input(value)
        return jsonify({"status": "updated", "block_id": block_id})
    else:
        return jsonify({"error": "Block not found"}), 404

@app.route('/api/block/toggle_visibility', methods=['POST'])
def toggle_visibility():
    """
    Endpoint to toggle visibility of an input or output on a block.
    """
    data = request.json
    block_id = data.get("block_id")
    key = data.get("key")
    io_type = data.get("type") # "input" or "output"
    
    block = current_project.blocks.get(block_id)
    if not block:
        return jsonify({"error": "Block not found"}), 404
        
    if io_type == "input":
        block.toggle_input_visibility(key)
    elif io_type == "output":
        block.toggle_output_visibility(key)
    else:
        return jsonify({"error": "Invalid type"}), 400
        
    return jsonify({"status": "updated", "block_id": block_id})

@app.route('/api/block/add', methods=['POST'])
def add_block():
    """
    Endpoint to add a new block to the project.
    Expects JSON: { "type": "API", "name": "My Block", "x": 100, "y": 100, ...params }
    """
    data = request.json
    block_type = data.get("type")
    name = data.get("name", "New Block")
    x = data.get("x", 0)
    y = data.get("y", 0)
    
    new_block = None
    
    try:
        if block_type == "API":
            # Default to custom if not specified
            schema_key = data.get("schema_key", "custom")
            new_block = APIBlock(name, schema_key)
            # If custom, allow overriding url/method
            if schema_key == "custom":
                if "url" in data: new_block.url = data["url"]
                if "method" in data: new_block.method = data["method"]
                
        elif block_type == "LOGIC":
            operation = data.get("operation", "add")
            new_block = LogicBlock(name, operation)
        elif block_type == "REACT":
            new_block = ReactBlock(name)
        elif block_type == "TRANSFORM":
            t_type = data.get("transformation_type", "to_string")
            new_block = TransformBlock(name, t_type)
        elif block_type == "STRING_BUILDER":
            template = data.get("template", "")
            new_block = StringBuilderBlock(name, template)
        else:
            return jsonify({"error": f"Unknown block type: {block_type}"}), 400
            
        new_block.x = x
        new_block.y = y
        current_project.add_block(new_block)
        
        return jsonify({
            "status": "added", 
            "block": new_block.to_dict()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/block/remove', methods=['POST'])
def remove_block():
    """
    Endpoint to remove a block.
    Expects JSON: { "block_id": "..." }
    """
    data = request.json
    block_id = data.get("block_id")
    
    if block_id in current_project.blocks:
        current_project.remove_block(block_id)
        return jsonify({"status": "removed", "block_id": block_id})
    else:
        return jsonify({"error": "Block not found"}), 404

@app.route('/api/block/update', methods=['POST'])
def update_block():
    """
    Endpoint to update block properties (position, name, specific params).
    Expects JSON: { "block_id": "...", "x": 100, "y": 100, "name": "...", ... }
    """
    data = request.json
    block_id = data.get("block_id")
    
    block = current_project.blocks.get(block_id)
    if not block:
        return jsonify({"error": "Block not found"}), 404
        
    # Update common properties
    if "x" in data:
        block.x = data["x"]
    if "y" in data:
        block.y = data["y"]
    if "name" in data:
        block.name = data["name"]
        
    # Update specific properties based on type
    if isinstance(block, APIBlock):
        if "schema_key" in data:
            block.apply_schema(data["schema_key"])
        if "url" in data:
            block.url = data["url"]
        if "method" in data:
            block.method = data["method"]
    elif isinstance(block, LogicBlock):
        if "operation" in data:
            block.operation = data["operation"]
    elif isinstance(block, TransformBlock):
        if "transformation_type" in data:
            block.transformation_type = data["transformation_type"]
    elif isinstance(block, StringBuilderBlock):
        if "template" in data:
            block.template = data["template"]
            
    return jsonify({"status": "updated", "block": block.to_dict()})

@app.route('/api/connection/add', methods=['POST'])
def add_connection():
    """
    Endpoint to connect two blocks.
    Expects JSON: { "source_id": "...", "source_output": "...", "target_id": "...", "target_input": "..." }
    """
    data = request.json
    source_id = data.get("source_id")
    source_output = data.get("source_output")
    target_id = data.get("target_id")
    target_input = data.get("target_input")
    
    source = current_project.blocks.get(source_id)
    target = current_project.blocks.get(target_id)
    
    if not source or not target:
        return jsonify({"error": "Source or target block not found"}), 404
        
    try:
        # Check if connection already exists to avoid duplicates?
        # For now, just connect.
        source.connect(source_output, target, target_input)
        return jsonify({"status": "connected"})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/connection/remove', methods=['POST'])
def remove_connection():
    """
    Endpoint to remove a connection.
    Expects JSON: { "source_id": "...", "source_output": "...", "target_id": "...", "target_input": "..." }
    """
    data = request.json
    source_id = data.get("source_id")
    source_output = data.get("source_output")
    target_id = data.get("target_id")
    target_input = data.get("target_input")
    
    source = current_project.blocks.get(source_id)
    target = current_project.blocks.get(target_id)
    
    if not source or not target:
        return jsonify({"error": "Source or target block not found"}), 404
        
    # Find and remove the connector
    if source_output in source.output_connectors:
        connectors = source.output_connectors[source_output]
        to_remove = []
        for conn in connectors:
            if conn.target_block == target and conn.target_input_key == target_input:
                to_remove.append(conn)
        
        for conn in to_remove:
            connectors.remove(conn)
            # Also clear from target
            target.input_connectors[target_input] = None
            
        if to_remove:
            return jsonify({"status": "disconnected"})
    
    return jsonify({"error": "Connection not found"}), 404

@app.route('/api/graph', methods=['GET'])
def get_graph_structure():
    """
    Returns the current graph structure for the frontend to render.
    """
    nodes = []
    edges = []
    
    for block in current_project.blocks.values():
        # Prepare extra data for frontend rendering
        extra_data = {}
        if isinstance(block, APIBlock):
            extra_data["schema_key"] = block.schema_key
            extra_data["url"] = block.url
            extra_data["method"] = block.method
        
        nodes.append({
            "id": block.id,
            "name": block.name,
            "type": block.block_type,
            "x": block.x,
            "y": block.y,
            "inputs": list(block.inputs.keys()),
            "outputs": list(block.outputs.keys()),
            "hidden_inputs": list(block.hidden_inputs),
            "hidden_outputs": list(block.hidden_outputs),
            "menu_open": block.menu_open,
            "extra": extra_data
        })
        
        for output_key, connectors in block.output_connectors.items():
            for connector in connectors:
                edges.append({
                    "source": block.id,
                    "sourceHandle": output_key,
                    "target": connector.target_block.id,
                    "targetHandle": connector.target_input_key
                })

    return jsonify({"nodes": nodes, "edges": edges})

@app.route('/api/schemas', methods=['GET'])
def get_schemas():
    """Returns available API schemas."""
    return jsonify(API_SCHEMAS)

@app.route('/api/project/save', methods=['GET'])
def save_project():
    """Returns the project as a JSON string."""
    return current_project.to_json()

@app.route('/api/project/load', methods=['POST'])
def load_project():
    """Loads a project from a JSON string."""
    global current_project
    try:
        json_data = request.json
        # If the client sends the JSON object directly, dump it to string first
        # or adjust from_json to take a dict.
        # Assuming request.data is the raw string or request.json is the dict.
        if isinstance(json_data, dict):
            json_str = json.dumps(json_data)
        else:
            json_str = json_data

        current_project = Project.from_json(json_str)
        return jsonify({"status": "loaded", "project_name": current_project.name})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ==========================================
# PART 3: Authentication Endpoints
# ==========================================

@app.route('/api/auth/create-profile', methods=['POST'])
def create_profile():
    """
    Create user profile in MongoDB after Supabase signup.
    Expects JSON: { "supabase_user_id": "...", "email": "...", "full_name": "..." }
    """
    try:
        data = request.json
        supabase_user_id = data.get('supabase_user_id')
        email = data.get('email')
        full_name = data.get('full_name', '')

        if not supabase_user_id or not email:
            return jsonify({"error": "supabase_user_id and email are required"}), 400

        # Check if user already exists
        existing_user = mongodb.get_user_by_supabase_id(supabase_user_id)
        if existing_user:
            return jsonify({
                "success": True,
                "user": existing_user,
                "message": "User profile already exists"
            }), 200

        # Create new user profile
        user = mongodb.create_user(supabase_user_id, email, full_name)

        return jsonify({
            "success": True,
            "user": user
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/update-last-login', methods=['POST'])
def update_last_login():
    """
    Update user's last login timestamp.
    Expects JSON: { "supabase_user_id": "..." }
    """
    try:
        data = request.json
        supabase_user_id = data.get('supabase_user_id')

        if not supabase_user_id:
            return jsonify({"error": "supabase_user_id is required"}), 400

        result = mongodb.update_last_login(supabase_user_id)

        if result.matched_count == 0:
            # User doesn't exist, try lazy creation
            user = ensure_user_exists(supabase_user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404

        return jsonify({"success": True}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    """
    Get current user profile.
    Expects header: X-User-ID
    """
    try:
        user_id = get_user_id_from_request()

        if not user_id:
            return jsonify({"error": "User ID not provided"}), 401

        user = ensure_user_exists(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify(user), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# PART 4: Workflow Management (MongoDB-backed)
# ==========================================

@app.route('/api/workflows', methods=['GET'])
def get_workflows():
    """
    Get all workflows for the current user.
    Expects header: X-User-ID
    """
    try:
        user_id = get_user_id_from_request()

        if not user_id:
            return jsonify({"error": "User ID not provided"}), 401

        # Ensure user exists (lazy creation)
        ensure_user_exists(user_id)

        workflows = mongodb.get_user_workflows(user_id)

        return jsonify({"workflows": workflows}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/workflows', methods=['POST'])
def create_workflow():
    """
    Create a new workflow.
    Expects header: X-User-ID
    Expects JSON: { "name": "...", "description": "..." }
    """
    try:
        user_id = get_user_id_from_request()

        if not user_id:
            return jsonify({"error": "User ID not provided"}), 401

        data = request.json
        name = data.get('name', 'Untitled Workflow')
        description = data.get('description', '')

        # Ensure user exists
        ensure_user_exists(user_id)

        workflow = mongodb.create_workflow(user_id, name, description)

        return jsonify(workflow), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/workflows/<workflow_id>', methods=['GET'])
def get_workflow(workflow_id):
    """
    Get a specific workflow.
    Expects header: X-User-ID
    """
    try:
        user_id = get_user_id_from_request()

        if not user_id:
            return jsonify({"error": "User ID not provided"}), 401

        workflow = mongodb.get_workflow(workflow_id, user_id)

        if not workflow:
            return jsonify({"error": "Workflow not found or access denied"}), 404

        return jsonify(workflow), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/workflows/<workflow_id>', methods=['PUT'])
def update_workflow_endpoint(workflow_id):
    """
    Update a workflow.
    Expects header: X-User-ID
    Expects JSON: { "name": "...", "nodes": [...], "edges": [...] }
    """
    try:
        user_id = get_user_id_from_request()

        if not user_id:
            return jsonify({"error": "User ID not provided"}), 401

        data = request.json
        updates = {}

        if 'name' in data:
            updates['name'] = data['name']
        if 'description' in data:
            updates['description'] = data['description']
        if 'nodes' in data:
            updates['nodes'] = data['nodes']
        if 'edges' in data:
            updates['edges'] = data['edges']
        if 'viewport' in data:
            updates['viewport'] = data['viewport']

        result = mongodb.update_workflow(workflow_id, user_id, updates)

        if result.matched_count == 0:
            return jsonify({"error": "Workflow not found or access denied"}), 404

        # Return updated workflow
        workflow = mongodb.get_workflow(workflow_id, user_id)
        return jsonify(workflow), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/workflows/<workflow_id>', methods=['DELETE'])
def delete_workflow_endpoint(workflow_id):
    """
    Delete a workflow.
    Expects header: X-User-ID
    """
    try:
        user_id = get_user_id_from_request()

        if not user_id:
            return jsonify({"error": "User ID not provided"}), 401

        result = mongodb.delete_workflow(workflow_id, user_id)

        if result.deleted_count == 0:
            return jsonify({"error": "Workflow not found or access denied"}), 404

        return jsonify({"success": True}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Demo Setup ---
def setup_demo_project():
    """
    Sets up a sample project.
    """
    proj = Project("Demo Project")
    
    input_block = ReactBlock("User Name Input")
    input_block.set_user_input("World")
    input_block.x = 100
    input_block.y = 100
    
    logic_block = LogicBlock("Greeter", "add")
    logic_block.inputs["val_a"] = "Hello " 
    logic_block.x = 300
    logic_block.y = 100
    
    api_block = APIBlock("Echo API", "custom")
    api_block.url = "https://postman-echo.com/get"
    api_block.x = 500
    api_block.y = 100
    
    display_block = ReactBlock("Result Display")
    display_block.x = 700
    display_block.y = 100

    proj.add_block(input_block)
    proj.add_block(logic_block)
    proj.add_block(api_block)
    proj.add_block(display_block)

    input_block.connect("user_input", logic_block, "val_b")
    
    def to_params(data):
        return {"message": data}
    
    logic_block.connect("result", api_block, "params", modifier=to_params)
    api_block.connect("response_json", display_block, "display_data")
    
    return proj

if __name__ == '__main__':
    current_project = setup_demo_project()
    app.run(debug=True, port=5001)
