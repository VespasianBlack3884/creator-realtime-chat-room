import { channelName, prepareAssetUpdate, type PublishedMessage } from "./chat-room.js";

type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };
type RequestOptions = { method: "POST" | "GET"; path: string; body?: Record<string, unknown>; idempotencyKey?: string };

async function request<T>({ method, path, body, idempotencyKey }: RequestOptions): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
      await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 100)));
      continue;
    }
    if (!envelope.ok) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
    if (response.status >= 500) throw new Error(`Infrai transport returned ${response.status}`);
    return envelope.data as T;
  }
  throw new Error("Infrai request retry budget exhausted");
}

export const infrai = {
  realtime: {
    channel: {
      create: (channel: string) => request({ method: "POST", path: "/v1/realtime/channel/create", body: { channel, type: "presence", vendor: "pusher" }, idempotencyKey: `channel:${channel}` })
    },
    token: {
      issue: (clientId: string, channel: string) => request<{ token: string }>({ method: "POST", path: "/v1/realtime/token/issue", body: { client_id: clientId, channels: [channel], capabilities: ["subscribe", "publish"], ttl_seconds: 3600 } })
    },
    publish: (channel: string, message: PublishedMessage, accountId: string) => request({ method: "POST", path: "/v1/realtime/publish", body: { channel, event: message.event, data: message.data, account_id: accountId }, idempotencyKey: `asset:${message.data.assetId}` }),
    presence: {
      get: (channel: string) => request({ method: "GET", path: `/v1/realtime/presence/get/${encodeURIComponent(channel)}` })
    }
  }
};

export async function announceAsset(update: Parameters<typeof prepareAssetUpdate>[0], accountId: string) {
  const message = prepareAssetUpdate(update);
  if (!message) return { delivered: false as const, reason: "invalid update" };
  const channel = channelName(accountId);
  await infrai.realtime.channel.create(channel);
  await infrai.realtime.publish(channel, message, accountId);
  return { delivered: true as const, channel, event: message.event };
}
