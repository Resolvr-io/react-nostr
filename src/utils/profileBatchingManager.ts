import { type SimplePool } from "nostr-tools";

import useNostrStore from "../store";
import { type RelayUrl } from "../types";

const batch = new Set<string>();
let timer: NodeJS.Timeout | null = null;

const fetchProfiles = async (
  pool: SimplePool,
  batch: Set<string>,
  relays: RelayUrl[],
) => {
  const filter = {
    kinds: [0],
    authors: Array.from(batch),
  };

  const profileEvents = await pool.querySync(relays, filter);

  profileEvents.forEach((event) => {
    useNostrStore.getState().addProfile(event.pubkey, event);
  });
};

const addPublicKeyToBatch = (
  publicKey: string,
  pool: SimplePool,
  relays: RelayUrl[],
  timeout = 500,
) => {
  const profile = useNostrStore.getState().profileMap[publicKey];

  if (profile) {
    return;
  }

  batch.add(publicKey);

  if (timer) {
    clearTimeout(timer);
  }

  timer = setTimeout(() => {
    void fetchProfiles(pool, new Set(batch), relays);
    batch.clear();
  }, timeout);
};

export { addPublicKeyToBatch };
