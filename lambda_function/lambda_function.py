import json
import requests
import os

def lambda_handler(event, context):
    try:
        method = event['requestContext']['http']['method']
        headers = event.get('headers', {})
        body = event.get('body', None)
        path = event['requestContext']['http']['path']

        # Forward the request to the external server
        url = os.getenv("SERVER")
        response = requests.request(
            method=method,
            url=f"{url}{path}",
            headers=headers,
            data=body
        )

        return {
            'statusCode': response.status_code,
            'headers': dict(response.headers),
            'body': response.text,
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
