import assert from "node:assert/strict";
import { prepareAssetUpdate } from "../src/chat-room.js";

const accepted = prepareAssetUpdate({ subscriberId: "sub-1", assetId: "asset-7", title: "  Pack ready  ", body: "  Open your library.  " });
assert.deepEqual(accepted, { event: "asset.ready", data: { assetId: "asset-7", title: "Pack ready", body: "Open your library." } });
assert.equal(prepareAssetUpdate({ subscriberId: "sub-1", assetId: "asset-7", title: "", body: "body" }), null);
console.log("chat-room decision test passed");
