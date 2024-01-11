import useNostrStore from "./store";

export const { keyPair, setKeyPair } = useNostrStore.getState();
export const { pool, setPool } = useNostrStore.getState();
export const { subRelays, setSubscribeRelays } = useNostrStore.getState();
export const { pubRelays, setPublishRelays } = useNostrStore.getState();
export * from "./hooks";
export * from "./utils";
export * from "./types";
