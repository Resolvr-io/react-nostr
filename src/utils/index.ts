import {
  nip19,
  type Event,
  type EventTemplate,
  getEventHash,
  finalizeEvent,
} from "nostr-tools";
import { type RelayUrl, type Profile, type ATagParams } from "../types";
import { type AddressPointer } from "nostr-tools/nip19";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import { utf8Encoder } from "nostr-tools/utils";

export const shortNpub = (pubkey: string | undefined, length = 4) => {
  if (!pubkey) {
    return undefined;
  }
  const npub = nip19.npubEncode(pubkey);
  return `npub...${npub.substring(npub.length - length)}`;
};

export const profileContent = (event: Event | undefined | null) => {
  try {
    return JSON.parse(event?.content ?? "{}") as Profile;
  } catch (err) {
    return {} as Profile;
  }
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

export function allTags(key: string, event: Event): string[] {
  return event.tags
    .filter(
      (innerArray) => innerArray[0] === key && innerArray[1] !== undefined
    )
    .map((innerArray) => innerArray[1]!);
}

export const createNaddr = (
  event: Event | undefined,
  relays: RelayUrl[] | undefined = undefined
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

export function createATag({ kind, pubkey, dTagValue }: ATagParams) {
  return `${kind}:${pubkey}:${dTagValue}`;
}

function generateUniqueHash(data: string, length: number) {
  const hash = sha256(utf8Encoder.encode(data));
  return bytesToHex(hash).substring(0, length);
}

export async function finishEvent(
  t: EventTemplate,
  secretKey?: Uint8Array,
  onErr?: (err: Error) => void
) {
  let event = t as Event;
  if (secretKey) {
    return finalizeEvent(t, secretKey);
  } else {
    try {
      if (nostr) {
        event.pubkey = await nostr.getPublicKey();
        event.id = getEventHash(event);
        event = (await nostr.signEvent(event)) as Event;
        console.log("signed event", event);
        return event;
      } else {
        console.error("nostr not defined");
        return undefined;
      }
    } catch (err) {
      if (onErr) onErr(err as Error);
      return undefined;
    }
  }
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

export function identityTag(
  platform: string,
  tags: (string | undefined)[][]
): (string | undefined)[] | undefined {
  return tags.find((tag) => tag[0] === "i" && tag[1]?.startsWith(platform));
}
