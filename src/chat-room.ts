export type SubscriptionUpdate = {
  subscriberId: string;
  assetId: string;
  title: string;
  body: string;
};

export type PublishedMessage = {
  event: "asset.ready";
  data: { assetId: string; title: string; body: string };
};

export function prepareAssetUpdate(update: SubscriptionUpdate): PublishedMessage | null {
  const parsed = subscriptionUpdateSchema.safeParse(update);
  if (!parsed.success) return null;
  const title = parsed.data.title.trim();
  const body = parsed.data.body.trim();
  if (!title || !body) return null;
  return { event: "asset.ready", data: { assetId: update.assetId, title, body } };
}

export function channelName(creatorId: string): string {
  return `creator:${creatorId}:subscribers`;
}
import { z } from "zod";

const subscriptionUpdateSchema = z.object({ subscriberId: z.string().min(1), assetId: z.string().min(1), title: z.string(), body: z.string() });
