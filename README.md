# Ultravox-s2s

This is an example Jambonz application that connects to the Ultravox Realtime API and illustrates how to build a Voice-AI application using Jambonz and Ultravox. This application utilizes a weather REST API to enable Ultravox to answer callers' questions about the weather for specified locations.

## Authentication
To use this application, you must have an Ultravox API key with access to the Realtime API. Specify the API key as an environment variable when starting the application:

```bash
ULTRAVOX_API_KEY=API_KEY SERVER_TOOL_ENABLED=false HTTP_BASE_URL=https://<your-ngrok-url>.ngrok-free.app npm start
```
Replace `API_KEY` with your actual Ultravox API key and `<your-ngrok-url>` with your ngrok URL or HTTP server endpoint.

## Prerequisites
This application requires a Jambonz server running release `0.9.2-rc3` or above.

## Configuring the Assistant
Ultravox requires the assistant to be configured before connecting to the agent. This application uses the `llm` verb with `llmOptions` to send the initial configuration to Ultravox. For details, refer to the Ultravox documentation: [Ultravox Create Call](https://docs.ultravox.ai/api-reference/calls/calls-post).

## Function Calling
Ultravox supports [Client Tools](https://docs.ultravox.ai/sdk-reference/introduction#client-tools) for **client** or **HTTP**.

### Server Tool Mode
By enabling the following environment variables:

- `SERVER_TOOL_ENABLED=true`
- `HTTP_BASE_URL=<your-http-server-url>`

The application will listen for weather requests via HTTP POST from Ultravox and return raw weather JSON from the REST API.

### Client Tool Mode
If the environment variables `SERVER_TOOL_ENABLED` and `HTTP_BASE_URL` are not configured, Ultravox will call Client Tools. The application will respond with the same weather JSON payload as the HTTP POST request.

## ActionHook
Like many Jambonz verbs, the `llm` verb sends an `actionHook` with a final status when the verb completes. The payload includes a `completion_reason` property indicating why the `llm` session ended. Possible values for `completion_reason` are:

- Normal conversation end
- Connection failure
- Disconnect from remote end
- Server failure
- Server error

---

Ensure all environment variables are properly configured before starting the application. For detailed API references and documentation, visit the [Ultravox Documentation](https://docs.ultravox.ai).

