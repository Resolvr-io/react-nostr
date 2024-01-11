import { useEffect, useState } from "react";

import { type Filter } from "nostr-tools";
import useNostrStore from "../store";

// TODO: option for batched profile events
// NOTE: batching seems to be slow
const useProfileEvent = (publicKey: string) => {
  const [loading, setLoading] = useState(true);

  const _pool = useNostrStore((state) => state.pool);
  const _subRelays = useNostrStore((state) => state.subRelays);
  const profileMap = useNostrStore((state) => state.profileMap);
  const addProfile = useNostrStore((state) => state.addProfile);

  useEffect(() => {
    async function fetchProfile() {
      const filter: Filter = {
        kinds: [0],
        authors: [publicKey],
        limit: 1,
      };

      const profileEvent = await _pool.get(_subRelays, filter);
      // console.log("PROFILE METADATA", profileEvent);
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
  }, [_pool, _subRelays]);

  return { loading, profileEvent: profileMap[publicKey] };
};

export default useProfileEvent;
