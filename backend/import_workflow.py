#!/usr/bin/env python3
"""
Import workflow JSON file into MongoDB
"""
import json
import sys
from db import mongodb
from datetime import datetime

def import_workflow(json_file_path, user_id, workflow_name=None, description=None):
    """
    Import a workflow JSON file into MongoDB

    Args:
        json_file_path: Path to the JSON file
        user_id: Supabase user ID (owner of the workflow)
        workflow_name: Optional workflow name (defaults to filename)
        description: Optional workflow description
    """
    # Read JSON file
    print(f"📖 Reading workflow from: {json_file_path}")
    with open(json_file_path, 'r') as f:
        workflow_data = json.load(f)

    # Extract nodes and connections
    nodes = workflow_data.get('nodes', workflow_data.get('blocks', []))
    connections = workflow_data.get('connections', workflow_data.get('edges', []))

    print(f"✓ Found {len(nodes)} nodes and {len(connections)} connections")

    # Set workflow name
    if not workflow_name:
        workflow_name = json_file_path.split('/')[-1].replace('.json', '')

    # Connect to MongoDB
    print("🔌 Connecting to MongoDB...")
    mongodb.connect()
    print("✓ Connected to MongoDB")

    # Create workflow document
    workflow_doc = {
        'user_id': user_id,
        'name': workflow_name,
        'description': description or f'Imported from {json_file_path}',
        'nodes': nodes,
        'edges': connections,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
    }

    # Insert into MongoDB
    print(f"💾 Importing workflow '{workflow_name}' for user {user_id}...")
    result = mongodb.workflows.insert_one(workflow_doc)

    print(f"✅ Workflow imported successfully!")
    print(f"   Workflow ID: {result.inserted_id}")
    print(f"   Name: {workflow_name}")
    print(f"   Nodes: {len(nodes)}")
    print(f"   Connections: {len(connections)}")

    return str(result.inserted_id)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python import_workflow.py <json_file> <user_id> [workflow_name] [description]")
        print("\nExample:")
        print("  python import_workflow.py workflow.json abc123 'My Workflow' 'Sample workflow'")
        sys.exit(1)

    json_file = sys.argv[1]
    user_id = sys.argv[2]
    workflow_name = sys.argv[3] if len(sys.argv) > 3 else None
    description = sys.argv[4] if len(sys.argv) > 4 else None

    try:
        import_workflow(json_file, user_id, workflow_name, description)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
