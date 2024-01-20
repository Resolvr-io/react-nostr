import { useEffect } from "react";
import { addPublicKeyToBatch } from "../utils/profileBatchingManager";
import useNostrStore from "../store";
import { type RelayUrl } from "../types";

const useBatchedProfiles = (publicKey: string, relays: RelayUrl[]) => {
  const profileMap = useNostrStore((state) => state.profileMap);

  const pool = useNostrStore((state) => state.pool);

  useEffect(() => {
    addPublicKeyToBatch(publicKey, pool, relays);
  }, [publicKey, pool, relays]);

  return profileMap[publicKey];
};

export default useBatchedProfiles;
