import { type Event, type Filter } from "nostr-tools";

export type KeyPair = {
  publicKey: string;
  secretKey: string;
};

export type RelayUrl = `wss://${string}`;

export type UsePublishParams = {
  relays: RelayUrl[];
};

export type UseSubscribeParams = {
  filter: Filter;
  eventKey: string;
  relays: RelayUrl[];
  initialEvents?: Event[];
  onEvent?: (event: Event) => void;
  onEOSE?: () => void;
  onEventPredicate?: () => boolean;
  onEventsResolved?: (events: Event[]) => void;
  onEventsNotFound?: () => void;
};

export type UseBatchedParams = {
  kind: number;
  eventRef: string;
  relays: RelayUrl[];
};

export type UseProfileParams = {
  publicKey: string;
};

export type UseZapParams = {
  eventKey: string;
  relays: RelayUrl[];
};

export type ZapParams = {
  amount: number;
  recipientMetadata: Event;
  eventId: string;
  content?: string;
  secretKey?: Uint8Array;
  initialDelay?: number;
  retryInterval?: number;
  useQRCode?: boolean;
  onPaymentSuccess?: (sendPaymentResponse: SendPaymentResponse) => void;
  onPaymentFailure?: () => void;
  onZapReceipts?: (events: Event[]) => void;
  onNoZapReceipts?: () => void;
};

export interface ZapRequestParams {
  recipientPubkey: string;
  eventId?: string;
  amount: number;
  content?: string;
  relays: string[];
}

export interface ZapResponseBody {
  allowsNostr?: boolean;
  nostrPubkey?: string;
  callback?: string;
}

export interface InvoiceResponse {
  pr: string;
}

export interface Profile {
  relay?: string;
  publicKey?: string;
  about?: string;
  lud06?: string;
  lud16?: string;
  name?: string;
  nip05?: string;
  picture?: string;
  website?: string;
  banner?: string;
  location?: string;
  github?: string;
  twitter?: string;
  [key: string]: unknown;
}

export type PublishEventStatus = "idle" | "pending" | "error" | "success";
export type ZapEventStatus = "idle" | "pending" | "error" | "success";

export interface ATagParams {
  kind: string;
  pubkey: string;
  dTagValue: string;
}
