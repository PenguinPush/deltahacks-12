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
    },
    "discord_webhook": {
        "name": "Webhook Trigger (Discord)",
        "url": "https://discord.com/api/webhooks/{webhook_id}/{webhook_token}",
        "method": "POST",
        "doc_url": "https://discord.com/developers/docs/resources/webhook",
        "inputs": {
            "path": {
                "webhook_id": {"type": "string", "default": ""},
                "webhook_token": {"type": "string", "default": ""}
            },
            "body": {
                "content": {"type": "string", "default": "Hello from Flow Builder!"},
                "username": {"type": "string", "default": "Bot"}
            }
        },
        "outputs": {
            "status_code": {"type": "number"}
        }
    },
    "google_maps_geocode": {
        "name": "Map Data (Google Geocoding)",
        "url": "https://maps.googleapis.com/maps/api/geocode/json",
        "method": "GET",
        "doc_url": "https://developers.google.com/maps/documentation/geocoding/overview",
        "inputs": {
            "params": {
                "address": {"type": "string", "default": "1600 Amphitheatre Parkway, Mountain View, CA"},
                "key": {"type": "string", "default": "YOUR_API_KEY"}
            }
        },
        "outputs": {
            "results": {"type": "json"},
            "status": {"type": "string"}
        }
    },
    "airtable_list": {
        "name": "Airtable - List Records",
        "url": "https://api.airtable.com/v0/{base_id}/{table_name}",
        "method": "GET",
        "doc_url": "https://airtable.com/api",
        "inputs": {
            "path": {
                "base_id": {"type": "string", "default": "app..."},
                "table_name": {"type": "string", "default": "Table 1"}
            },
            "headers": {
                "Authorization": {"type": "string", "default": "Bearer YOUR_TOKEN"}
            }
        },
        "outputs": {
            "records": {"type": "json"}
        }
    },
    "openai_chat": {
        "name": "OpenAI - Chat Completion",
        "url": "https://api.openai.com/v1/chat/completions",
        "method": "POST",
        "doc_url": "https://platform.openai.com/docs/api-reference/chat",
        "inputs": {
            "headers": {
                "Authorization": {"type": "string", "default": "Bearer YOUR_API_KEY"}
            },
            "body": {
                "model": {"type": "string", "default": "gpt-3.5-turbo"},
                "messages": {"type": "json", "default": [{"role": "user", "content": "Hello!"}]}
            }
        },
        "outputs": {
            "choices": {"type": "json"},
            "usage": {"type": "json"}
        }
    },
    "twilio_sms": {
        "name": "Twilio - Send SMS",
        "url": "https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json",
        "method": "POST",
        "doc_url": "https://www.twilio.com/docs/sms/api/message-resource",
        "inputs": {
            "path": {
                "AccountSid": {"type": "string", "default": "AC..."}
            },
            "headers": {
                "Authorization": {"type": "string", "default": "Basic base64(SID:TOKEN)"}
            },
            "body": {
                "To": {"type": "string", "default": "+1..."},
                "From": {"type": "string", "default": "+1..."},
                "Body": {"type": "string", "default": "Hello from Flow Builder"}
            }
        },
        "outputs": {
            "sid": {"type": "string"},
            "status": {"type": "string"}
        }
    },
    "mongodb_find": {
        "name": "MongoDB Atlas - Find One",
        "url": "https://data.mongodb-api.com/app/{app_id}/endpoint/data/v1/action/findOne",
        "method": "POST",
        "doc_url": "https://www.mongodb.com/docs/atlas/app-services/data-api/openapi/",
        "inputs": {
            "path": {
                "app_id": {"type": "string", "default": "data-..."}
            },
            "headers": {
                "api-key": {"type": "string", "default": "YOUR_API_KEY"}
            },
            "body": {
                "dataSource": {"type": "string", "default": "Cluster0"},
                "database": {"type": "string", "default": "myDatabase"},
                "collection": {"type": "string", "default": "myCollection"},
                "filter": {"type": "json", "default": {}}
            }
        },
        "outputs": {
            "document": {"type": "json"}
        }
    }
}
