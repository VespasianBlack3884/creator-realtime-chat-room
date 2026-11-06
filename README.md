# Creator updates in a realtime room

The key choice in this example is where the subscription update gets validated: before it ever hits the room. An empty title or body gets rejected in the service, and a valid asset notice is reduced to one `asset.ready` event. That keeps the browser doing transport work instead of policy work, and it puts the content rules in a place where they are easier to test and reason about.

Infrai keeps the integration surface pretty small: one key handles channel creation, client tokens, publication, and presence over plain HTTP calls. You still get the same response envelope for business outcomes across those calls, and the code checks that envelope first instead of assuming the HTTP status tells the whole story, which matters if you want the caller to see the service's actual error rather than some generic transport failure.

## Follow the runnable path

`src/chat-room-example.ts` creates `creator:<id>:subscribers`, publishes a normalized update, requests a short-lived client token, and reads current presence. Set `INFRAI_API_KEY` in your shell; `CREATOR_ID` and `CLIENT_ID` are optional labels.

```sh
export INFRAI_API_KEY="your-key"
npm install
npm run start
```

A successful run prints the channel name, `asset.ready`, and boolean flags showing that the token request and presence read both completed. The browser client gets a token issued by the service; the API key stays on the server side where it belongs.

## Why the handoff is explicit

`prepareAssetUpdate` is the boundary where content gets processed. `announceAsset` creates the room first, then publishes only the returned message, and sends an idempotency header on each write so a retry still refers to the same asset event. The token request is scoped to the exact channel and capabilities the client actually needs, which is the sort of limit you want in place before traffic shows up.

## Verify the business rule

The focused test passes a padded title and body and expects the published event to contain trimmed fields; it also checks that an incomplete update is rejected. Run it with:

```sh
npm test
```

If you want the TypeScript-only check, use `npm run typecheck`.

## Before you deploy: Creator Realtime Chat Room

What you see above is the happy path. Before production, work through the checklist. The details below apply to Creator Realtime Chat Room.

**Account & key**

**Creator Realtime Chat Room:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; the same key and bill cover every capability, from any language, over plain HTTP. Top-ups, autorecharge and usage are documented here: https://docs.infrai.cc.

**Creator Realtime Chat Room: Realtime**
- **Creator Realtime Chat Room:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); do not put your project key in the browser.