import { useEffect } from "react";
import { addPublicKeyToBatch } from "../utils/batchingManager";
import useNostrStore from "../store";
import { type RelayUrl } from "../types";

const useBatchedProfiles = (publicKey: string, relays: RelayUrl[]) => {
  const profileMap = useNostrStore((state) => state.profileMap);

  const _pool = useNostrStore((state) => state.pool);

  useEffect(() => {
    addPublicKeyToBatch(publicKey, _pool, relays);
  }, [publicKey, _pool, relays]);

  return profileMap[publicKey];
};

export default useBatchedProfiles;
