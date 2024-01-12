import { type Event, type Filter } from "nostr-tools";

export type KeyPair = {
  publicKey: string;
  secretKey: string;
};

export type RelayUrl = `wss://${string}`;

export type UsePublishParams = {
  relays: RelayUrl[];
}

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

export type UseProfileParams = {
  publicKey: string;
};

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
  [key: string]: unknown;
}

export type PublishEventStatus = "idle" | "pending" | "error" | "success";
