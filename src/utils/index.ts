import { nip19, type Event, utils } from "nostr-tools";
import { type RelayUrl, type Profile } from "../types";
import { type AddressPointer } from "nostr-tools/nip19";
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from '@noble/hashes/utils'
import { utf8Encoder } from "nostr-tools/utils";

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

export function tag(key: string, event: Event | undefined) {
  if (!event) {
    return undefined;
  }
  const array = event.tags;
  if (!array) {
    return undefined;
  }
  const item = array.find((element) => element[0] === key);
  return item ? item[1] : undefined;
}

export const createNaddr = (
  event: Event | undefined,
  relays: RelayUrl[] | undefined = undefined,
) => {
  const identifier = tag("d", event);
  if (!identifier) {
    return null;
  }
  if (!event) {
    return null;
  }

  const addressPointer: AddressPointer = {
    identifier: identifier,
    pubkey: event.pubkey,
    kind: event.kind,
    relays,
  };

  return nip19.naddrEncode(addressPointer);
};

function generateUniqueHash(data: string, length: number) {
  const hash = sha256(utf8Encoder.encode(data))
  return bytesToHex(hash).substring(0, length)
}

function createUrlSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "-");
}

export function createIdentifier(title: string, pubkey: string): string {
  const titleSlug = createUrlSlug(title);
  const uniqueHash = generateUniqueHash(title + pubkey, 12);
  return `${titleSlug}-${uniqueHash}`;
}
