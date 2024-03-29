import { useEffect } from "react";
import { addEventReferenceBatch } from "../utils/batchingManager";
import useNostrStore from "../store";
import { type RelayUrl } from "../types";

// TODO: might need to call this useBatchedReferencedEvents
const useBatchedEvents = (
  kind: number,
  eventRef: string,
  eventKey: string,
  relays: RelayUrl[],
) => {
  const eventMap = useNostrStore((state) => state.eventMap);

  const pool = useNostrStore((state) => state.pool);

  useEffect(() => {
    addEventReferenceBatch(eventRef, eventKey, kind, pool, relays);
  }, [eventKey, eventRef, kind, pool, relays]);

  return eventMap[`${eventKey}-${eventRef}`];
};

export default useBatchedEvents;
