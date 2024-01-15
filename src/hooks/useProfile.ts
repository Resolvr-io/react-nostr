import { useEffect, useState } from "react";

import { type Filter } from "nostr-tools";
import useNostrStore from "../store";
import { type RelayUrl } from "../types";

const useProfileEvent = (publicKey: string, relays: RelayUrl[]) => {
  const [loading, setLoading] = useState(true);

  const _pool = useNostrStore((state) => state.pool);
  const profileMap = useNostrStore((state) => state.profileMap);
  const addProfile = useNostrStore((state) => state.addProfile);

  useEffect(
    () => {
      if (profileMap[publicKey]) {
        setLoading(false);
        return;
      }

      async function fetchProfile() {
        const filter: Filter = {
          kinds: [0],
          authors: [publicKey],
          limit: 1,
        };

        const profileEvent = await _pool.get(relays, filter);
        if (!profileEvent) {
          setLoading(false);
          return;
        }
        addProfile(publicKey, profileEvent);
      }

      void fetchProfile();

      return () => {
        setLoading(false);
      };
    },

    [_pool, addProfile, publicKey, relays],
  );

  return { loading, profileEvent: profileMap[publicKey] };
};

export default useProfileEvent;
