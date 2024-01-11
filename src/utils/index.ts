import { nip19, type Event } from "nostr-tools";
import { type Profile } from "../types";

export const shortNpub = (pubkey: string | undefined, length = 4) => {
  if (!pubkey) {
    return undefined;
  }
  const npub = nip19.npubEncode(pubkey);
  return `npub...${npub.substring(npub.length - length)}`;
};

export const profileContent = (event: Event | undefined | null) => {
  return JSON.parse(event?.content ?? "{}") as Profile;
};
