# Ultravox-s2s

This is an example Jambonz application that connects to the Ultravox Realtime API and illustrates how to build a Voice-AI application using Jambonz and Ultravox. 

When building agents with Ultravox, you can extend your agents' capabilities by connecting them to external services and systems via [tools](https://docs.ultravox.ai/essentials/tools)—functions that agents can invoke to perform specific actions or retrieve information. These tools can be implemented as either client or server tools; we're covering both in this sample application. 
Read more about client vs server tools in the [Ultravox docs](https://docs.ultravox.ai/essentials/tools#server-vs-client-tools).

This example application covers four scenarios:
- weather agent using Ultravox clientTools
- weather agent using Ultravox serverTools
- call transfer agent using Ultravox clientTools
- call transfer agent using Ultravox serverTools. 

The weather agent utilizes a weather REST API to enable Ultravox to answer callers' questions about the weather for specified locations. 
The call transfer agent uses Jambonz to redirect the inbound call to a destination number of your choice.

## Prerequisites

- a [jambonz.cloud](https://jambonz.cloud/) account
- an [Ultravox](https://app.ultravox.ai/) account
- a carrier and virtual phone number of your choice

## Running instructions

### Set Environment Variables

Duplicate the *examples.env* file as *.env* and fill in your credentials as shown below.

```bash
ULTRAVOX_API_KEY=SoMe.ExAmpLeKeY
PORT=3000

# Required for Call Transfer
HUMAN_AGENT_NUMBER=+12125551212
HUMAN_AGENT_TRUNK=MyCarrier
HUMAN_AGENT_CALLERID=+14155551000

# Required for Server Tools
HTTP_BASE_URL=https://example.ngrok.io
JAMBONZ_ACCOUNT_SID=72c5c38f-test-test-test-aaa6be55e1b5
JAMBONZ_API_KEY=1cf2f4f4-stub-stub-stub-5bb4cb597c2a
JAMBONZ_BASE_URL=https://api.jambonz.cloud
```

| Environment Variable   | Value |
| :--------------------- | :---- |
| `ULTRAVOX_API_KEY`     | You can generate a new Ultravox API key under *Settings* in your [Ultravox account](https://app.ultravox.ai/settings/) |
| `PORT`                 | The port your Express server is listening at, you can use `3000` by default. |
| `HUMAN_AGENT_NUMBER`   | The destination phone number you'd like your call to be transferred to, in international format. For example, `+12125551212`. |
| `HUMAN_AGENT_TRUNK`    | The name of your carrier of choice. |
| `HUMAN_AGENT_CALLERID` | The caller ID that shows up when transferring the call to the destination number. It will vary based on what type of caller IDs your carrier of choice allows, but using your virtual number is typically a good call. Use international format, e.g. `+14155551000`. |
| `HTTP_BASE_URL`        | The URL you're serving this app up at. If running locally, you could use a tunneling service like [ngrok](https://ngrok.com/). In your terminal, run `ngrok http 3000` to get your base URL. E.g. `https://your-example-domain.ngrok.io` |
| `JAMBONZ_ACCOUNT_SID`  | Find this in your [jambonz.cloud](https://jambonz.cloud/) account under the *Account* tab. |
| `JAMBONZ_API_KEY`      | Generate a new API key in your [jambonz.cloud](https://jambonz.cloud/) account under the *Account* tab. |
| `JAMBONZ_BASE_URL`     | The base URL where you're running your Jambonz server. This will be `https://api.jambonz.cloud` if using jambonz.cloud. |

### Jambonz Setup

1. Create a Carrier entity in the Jambonz portal. [See docs](https://docs.jambonz.org/guides/using-the-jambonz-portal/basic-concepts/creating-carriers).

2. Create a new Jambonz application in your portal under the [*Applications*](https://jambonz.cloud/internal/applications) tab.
Give it a name, then set both `Calling webhook` and `Call status webhook` values to the same URL, based on which scenario you'd like to run:
    - weather agent using Ultravox clientTools:  
    `ws://your-example-domain.ngrok.io/weather-agent-client-tool`
    - weather agent using Ultravox serverTools:  
    `ws://your-example-domain.ngrok.io/weather-agent-server-tool`
    - call transfer agent using Ultravox clientTools:  
    `ws://your-example-domain.ngrok.io/call-transfer-agent`
    - call transfer agent using Ultravox serverTools:  
    `ws://your-example-domain.ngrok.io/call-transfer-agent-server-tool`


3. After creating a carrier, you need to provision the phone number that you will be receiving calls on from that carrier. [See docs](https://docs.jambonz.org/guides/using-the-jambonz-portal/basic-concepts/creating-phone-numbers).
At the bottom of the page select the Jambonz application you just created to link your new virtual number to that application.

### Run Your App

Ensure all environment variables are properly configured before starting the application. 
Navigate to the root of this project in your terminal, then run `npm install` and `npm start`.
Call your virtual number and test it out!

To switch between scenarios, update the `Calling webhook` and `Call status webhook` values to another URL, as explained in *step 2* of the *Jambonz Setup* section.

#### A note on ActionHook
Jambonz integrates with Ultravox via the [llm verb](https://docs.jambonz.org/verbs/verbs/llm).  
Like many Jambonz verbs, the `llm` verb sends an `actionHook` with a final status when the verb completes. The payload includes a `completion_reason` property indicating why the `llm` session ended. Possible values for `completion_reason` are:
- Normal conversation end
- Connection failure
- Disconnect from remote end
- Server failure
- Server error

## Resources

- [Ultravox Documentation](https://docs.ultravox.ai)
  - [tools](https://docs.ultravox.ai/essentials/tools) in Ultravox
- [Jambonz Documentation](https://docs.jambonz.org)
  - the ['llm'](https://docs.jambonz.org/verbs/verbs/llm) verb
  - the ['dial'](https://docs.jambonz.org/verbs/verbs/dial) verb
  - the ['sip_refer'](https://docs.jambonz.org/verbs/verbs/sip-refer) verb
  - step-by-step [guides](https://docs.jambonz.org/guides/telephony-integrations) for adding carriers to Jambonz

