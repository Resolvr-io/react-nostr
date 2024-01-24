import { type Filter, type SimplePool } from "nostr-tools";

import useNostrStore from "../store";
import { type RelayUrl } from "../types";
import { tag } from "..";

const batch = new Set<string>();
let timer: NodeJS.Timeout | null = null;

function isATag(str: string): str is `${string}:${string}:${string}` {
  return /^.+?:.+?:.+?$/.test(str);
}

const fetchEvents = async (
  pool: SimplePool,
  eventRef: string,
  eventKey: string,
  kind: number,
  batch: Set<string>,
  relays: RelayUrl[],
) => {
  let filter: Filter | undefined;

  if (isATag(eventRef)) {
    console.log("is a tag");
    filter = {
      kinds: [kind],
      "#a": Array.from(batch),
    };
  } else {
    console.log("is an id");
    filter = {
      kinds: [kind],
      "#e": Array.from(batch),
    };
  }

  const events = await pool.querySync(relays, filter);

  events.forEach((event) => {
    if (isATag(eventRef)) {
      useNostrStore
        .getState()
        .addEvent(`${eventKey}-${tag("a", event)}`, event);
    } else {
      useNostrStore
        .getState()
        .addEvent(`${eventKey}-${tag("e", event)}`, event);
    }
  });
};

// add type for lookup could be atags, or ids
const addEventReferenceBatch = (
  eventRef: string,
  eventKey: string,
  kind: number,
  pool: SimplePool,
  relays: RelayUrl[],
  timeout = 500,
) => {
  // TODO: check if event id exists in event map
  // return if it does

  const events = useNostrStore.getState().eventMap[`${eventKey}-${eventRef}`];

  if (events) {
    return;
  }

  batch.add(eventRef);

  if (timer) {
    clearTimeout(timer);
  }

  timer = setTimeout(() => {
    void fetchEvents(pool, eventRef, eventKey, kind, new Set(batch), relays);
    batch.clear();
  }, timeout);
};

export { addEventReferenceBatch };
