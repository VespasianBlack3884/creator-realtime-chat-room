import { announceAsset, infrai } from "./infrai-realtime.js";

const creatorId = process.env.CREATOR_ID ?? "demo-creator";
const clientId = process.env.CLIENT_ID ?? "subscriber-client";
const result = await announceAsset({ subscriberId: clientId, assetId: "pack-42", title: "New brush pack", body: "Your download is ready." }, creatorId);
if (result.delivered) {
  const token = await infrai.realtime.token.issue(clientId, result.channel);
  const members = await infrai.realtime.presence.get(result.channel);
  console.log(JSON.stringify({ result, tokenIssued: Boolean(token), presenceRead: Boolean(members) }, null, 2));
}
