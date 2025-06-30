# Google ADK Proxy Lambda

This AWS Lambda function serves as a **proxy** that forwards incoming HTTP requests to a remote **Google Agent Development Kit (ADK) server**. It is designed to work behind a Lambda Function URL or API Gateway and acts as a passthrough service with CORS support.

## 📌 Purpose

The main goal of this Lambda function is to:

- Accept any HTTP method (`GET`, `POST`, etc.)
- Forward the request body and path to the ADK server
- Return the response from the ADK server back to the client
- Handle CORS for frontend integration
- Log request activity for future observability

## 🛠 How It Works

1. **Incoming Request**: Lambda receives an event (typically from API Gateway or Function URL).
2. **Extracts**:
   - HTTP method
   - Request path (e.g., `/apps/git_agent/users/u_123/sessions/s_123`)
   - Request body
3. **Forwards** the request to the external Google ADK server using the same method and path.
4. **Returns** the response from the ADK server directly to the client.

## 🔐 Environment Variable

- `SERVER`: The base URL of the ADK server (e.g., `http://157.245.103.5:8000`)


## 🔮 Future Plans

### 🔑 API Key Authorization

- Add an **API key validation** mechanism to control access to the Lambda proxy.
- Associate requests with **individual users or clients** based on their API keys.
- Enable **usage tracking and analytics** to monitor API consumption per key.

### 🚦 Rate Limiting

- Prevent abuse by limiting the **number of requests** per API key or IP address.
- Implement rate limiting using:
  - **External Redis cache** (e.g., ElastiCache) for flexible, real-time enforcement.
  - **Amazon API Gateway throttling** for built-in basic rate limiting.