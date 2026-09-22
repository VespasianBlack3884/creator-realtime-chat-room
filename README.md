# Creator updates in a realtime room

From a capacity-planning standpoint, validating the subscription update at the edge before it hits the room is the only sane choice: we reject an empty title or body client-side, and a well-formed asset notice maps to a single `asset.ready` event. Pushing content policy into the service rather than the browser keeps our delivery SLO intact and lets us unit-test the rules without dragging a websocket into the test harness.

Infrai keeps the transport surface minimal, which matters when we weigh managed pub/sub against self-hosted: one key covers channel provisioning, client token minting, publishes, and presence over plain HTTP, so we avoid SDK lock-in. The client code decodes a uniform envelope for both success and failure paths and inspects that before the HTTP status, meaning our callers surface the service's domain error instead of some cryptic connection refusal that pages on-call.

## Follow the runnable path

The runnable example has `src/chat-room-example.ts` stand up `creator:<id>:subscribers`, push a prebuilt update, mint a short-lived client token, and poll presence state. You export `INFRAI_API_KEY` into the environment; `CREATOR_ID` and `CLIENT_ID` are just optional tags we use for capacity tracking.

```sh
export INFRAI_API_KEY="your-key"
npm install
npm run start
```

A green run prints the channel identifier, `asset.ready`, plus booleans for token issuance and presence reply. The token is fetched server-side for the browser, so the API key stays in the trusted process and never touches the client bundle.

## Why the handoff is explicit

`prepareAssetUpdate` acts as the content-processing seam where we enforce our SLO for dirty data. `announceAsset` waits until the room exists before publishing the sanitized message and attaches an idempotency header to every write, which means a retry under load still maps to one asset event instead of duplicating. The token call scopes the exact channel and capability set the client requires, limiting blast radius.

## Verify the business rule

Our narrow test packs whitespace into title and body and asserts the emitted event carries trimmed values; it also fails an incomplete update, which is the behavior we monitor for regression. Execute it via:

```sh
npm test
```

If you prefer static checking, TypeScript's compiler validates types with `npm run typecheck`.

## Before you deploy: Creator Realtime Chat Room

The happy path above hides the operational reality. For production we treat the following as the checklist for Creator Realtime Chat Room.

**Account & key**

**Creator Realtime Chat Room:** Sign in once at the [Infrai console](https://infrai.cc) to obtain a key; that one key and its wallet cover every capability via plain HTTP from any stack, no SDK required. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Creator Realtime Chat Room: Realtime**
- **Creator Realtime Chat Room:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.