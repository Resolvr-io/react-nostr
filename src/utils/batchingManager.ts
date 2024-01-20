import { type SimplePool } from "nostr-tools";

import useNostrStore from "../store";
import { type RelayUrl } from "../types";
import { tag } from "../utils";

const batch = new Set<string>();
let timer: NodeJS.Timeout | null = null;

const fetchEvents = async (
  pool: SimplePool,
  kind: number,
  batch: Set<string>,
  relays: RelayUrl[],
) => {
  const filter = {
    kinds: [kind],
    "#a": Array.from(batch),
  };

  const events = await pool.querySync(relays, filter);

  events.forEach((event) => {
    const ref = tag("a", event);
    if (ref) {
      useNostrStore.getState().addEvent(ref, event);
    }
  });
};

// add type for lookup could be atags, or ids
const addEventReferenceBatch = (
  eventRef: string,
  kind: number,
  pool: SimplePool,
  relays: RelayUrl[],
  timeout = 500,
) => {
  // TODO: check if event id exists in event map
  // return if it does

  const events = useNostrStore.getState().eventMap[eventRef];

  if (events) {
    return;
  }

  batch.add(eventRef);

  if (timer) {
    clearTimeout(timer);
  }

  timer = setTimeout(() => {
    void fetchEvents(pool, kind, new Set(batch), relays);
    batch.clear();
  }, timeout);
};

export { addEventReferenceBatch };
