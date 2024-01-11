import { useCallback } from "react";
import useNostrStore from "../store";
import { type KeyPair } from "../types";

// TODO: probably just export keyPair and setKeyPair from store
const useKeyPair = () => {
  const keyPair = useNostrStore((state) => state.keyPair);
  const _setKeyPair = useNostrStore((state) => state.setKeyPair);

  const setKeyPair = useCallback(async (keyPair: KeyPair) => {
    _setKeyPair(keyPair);
  }, [_setKeyPair]);

  return { keyPair, setKeyPair };
};

export default useKeyPair;
