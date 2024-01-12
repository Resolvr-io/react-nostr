import { SimplePool, type Event } from "nostr-tools";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { type KeyPair } from "../types";

export interface NostrState {
  pool: SimplePool;
  setPool: (pool: SimplePool) => void;

  keyPair: KeyPair | undefined;
  setKeyPair: (keyPair: KeyPair) => void;
  clearKeyPair: () => void;

  // TODO: remove individual event from map
  eventMap: Record<string, Event[] | undefined>;
  addEvent: (key: string, event: Event) => void;
  setEvents: (key: string, events: Event[]) => void;
  clearEvents: (key: string) => void;

  profileMap: Record<string, Event | undefined>;
  addProfile: (publicKey: string, event: Event) => void;
  updateProfile: (publicKey: string, event: Event) => void;
}

const useNostrStore = create<NostrState>()(
  devtools((set) => ({
    pool: new SimplePool(),
    setPool: (pool) => set({ pool }),

    keyPair: undefined,
    setKeyPair: (keyPair) => set({ keyPair }),
    clearKeyPair: () => set({ keyPair: undefined }),

    eventMap: {},

    addEvent: (key, appEvent) =>
      set((prev) => ({
        eventMap: {
          ...prev.eventMap,
          [key]: [...(prev.eventMap[key] ?? []), appEvent],
        },
      })),
    setEvents: (key, appEvents) =>
      set((prev) => ({
        eventMap: {
          ...prev.eventMap,
          [key]: appEvents,
        },
      })),
    clearEvents: (key) =>
      set((prev) => ({
        eventMap: {
          ...prev.eventMap,
          [key]: undefined,
        },
      })),

    profileMap: {},
    addProfile: (publicKey, appEvent) =>
      set((prev) => ({
        profileMap: {
          ...prev.profileMap,
          [publicKey]: appEvent,
        },
      })),

    updateProfile: (publicKey, appEvent) =>
      set((prev) => ({
        profileMap: {
          ...prev.profileMap,
          [publicKey]: {
            ...prev.profileMap[publicKey],
            ...appEvent,
          },
        },
      })),
  })),
);

export default useNostrStore;
