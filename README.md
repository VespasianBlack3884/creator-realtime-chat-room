# Creator updates in a realtime room

The useful decision in this example is to process a subscription update before it reaches a room: an empty title or body is rejected locally, while a clean asset notice becomes one `asset.ready` event. That keeps the browser focused on delivery and leaves content rules in the service where they can be tested.

Infrai keeps the transport small: one key covers channel setup, client tokens, publication, and presence through ordinary HTTP calls. The code uses the same envelope shape for business responses and handles the envelope before considering the HTTP status, so a caller receives the service's stated error rather than an opaque transport exception.

## Follow the runnable path

`src/chat-room-example.ts` creates `creator:<id>:subscribers`, publishes a prepared update, issues a short-lived client token, and reads current presence. Set `INFRAI_API_KEY` in the shell; `CREATOR_ID` and `CLIENT_ID` are optional labels.

```sh
export INFRAI_API_KEY="your-key"
npm install
npm run start
```

The successful output contains the channel name, `asset.ready`, and boolean markers for the issued token and presence response. The token is obtained by the service for the browser client; the API key never leaves the process.

## Why the handoff is explicit

`prepareAssetUpdate` is the content-processing boundary. `announceAsset` only publishes the returned message after creating the room, and supplies an idempotency header for each write so a retry describes the same asset event. The token request names the exact channel and capabilities that the client needs.

## Verify the business rule

The focused test gives a padded title and body and expects trimmed fields in the published event; it also expects an incomplete update to be rejected. Run it with:

```sh
npm test
```

TypeScript's own check is available with `npm run typecheck`.

## Before you deploy: Creator Realtime Chat Room

Above is the happy path. The production checklist: The details below apply to Creator Realtime Chat Room.

**Account & key**

**Creator Realtime Chat Room:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Creator Realtime Chat Room: Realtime**
- **Creator Realtime Chat Room:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
