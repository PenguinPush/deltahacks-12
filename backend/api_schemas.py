# Dictionary defining available API schemas
API_SCHEMAS = {
    "custom": {
        "name": "Custom API",
        "url": "", # URL is provided by an input for custom requests
        "method": "GET",
        "doc_url": "https://httpbin.org/",
        # For custom, we use generic inputs. The block logic will treat them specially.
        "inputs": {
            "url": {"type": "string", "default": "https://httpbin.org/get"},
            "params": {"type": "json", "default": {}},
            "body": {"type": "json", "default": {}},
            "headers": {"type": "json", "default": {}},
        },
        "outputs": {
            "response_json": {"type": "json"},
            "status_code": {"type": "number"}
        }
    },
    "cat_fact": {
        "name": "Cat Fact",
        "url": "https://catfact.ninja/fact",
        "method": "GET",
        "doc_url": "https://catfact.ninja/",
        "inputs": {}, # No inputs needed for this specific endpoint
        "outputs": {
            # These keys should match the API response for automatic mapping
            "fact": {"type": "string"},
            "length": {"type": "number"}
        }
    },
    "agify": {
        "name": "Agify.io",
        "url": "https://api.agify.io",
        "method": "GET",
        "doc_url": "https://agify.io/",
        "inputs": {
            # This structure is now explicit. 'name' is a query parameter.
            "params": {
                "name": {"type": "string", "default": "michael"}
            }
        },
        "outputs": {
            "age": {"type": "number"},
            "count": {"type": "number"},
            "name": {"type": "string"}
        }
    },
    "jsonplaceholder_get": {
        "name": "JSONPlaceholder - Get Post",
        "url": "https://jsonplaceholder.typicode.com/posts/{post_id}",
        "method": "GET",
        "doc_url": "https://jsonplaceholder.typicode.com/",
        "inputs": {
            # 'post_id' is a path parameter
            "path": {
                "post_id": {"type": "number", "default": 1}
            }
        },
        "outputs": {
            "userId": {"type": "number"},
            "id": {"type": "number"},
            "title": {"type": "string"},
            "body": {"type": "string"}
        }
    }
}
