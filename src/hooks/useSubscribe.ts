import { useCallback, useEffect, useState } from "react";
import useNostrStore from "../store";
import { type UseSubscribeParams } from "../types";

// TODO: load newer events function
// TODO: add invalidation function
const useSubscribe = ({
  filter,
  eventKey,
  initialEvents = [],
  // onEvent = (_) => {},
  // onEOSE = () => {},
  // onEventPredicate = () => true,
  // onEventsResolved = (_) => {},
  // onEventsNotFound = () => {},
}: UseSubscribeParams) => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "fetching">("idle");
  const _pool = useNostrStore((state) => state.pool);
  const _subRelays = useNostrStore((state) => state.subRelays);
  const eventMap = useNostrStore((state) => state.eventMap);
  const setEvents = useNostrStore((state) => state.setEvents);

  useEffect(() => {
    setLoading(true);

    if (initialEvents.length > 0) {
      setEvents(eventKey, initialEvents);
      setLoading(false);
      return;
    }

    if (eventMap[eventKey]) {
      setLoading(false);
      return;
    }

    async function fetchEvents() {
      const _events = await _pool.querySync(_subRelays, filter);
      // console.log("_EVENTS", _events);
      console.log("GETTING INITIAL EVENTS");
      setEvents(eventKey, _events);
    }

    void fetchEvents();
    setLoading(false);
  }, [_subRelays, _pool]);

  const loadOlderEvents = useCallback(
    async (eventKey: string, limit: number) => {
      const { eventMap, setEvents } = useNostrStore.getState();

      setLoading(true);
      const existingEvents = eventMap[eventKey];

      if (!existingEvents || existingEvents.length === 0) {
        setLoading(false);
        return;
      }

      let moreFilter = { ...filter, limit };

      const lastEvent = existingEvents[existingEvents.length - 1];

      if (!lastEvent) {
        setLoading(false);
        return;
      }

      const until = lastEvent.created_at - 200;

      moreFilter = { ...moreFilter, until };

      console.log("MORE FILTER", moreFilter);

      setStatus("fetching");
      console.log("GETTING MORE EVENTS");
      const newEvents = await _pool.querySync(_subRelays, moreFilter);

      if (newEvents.length === 0) {
        setLoading(false);
      }

      const allEvents = [...existingEvents, ...newEvents];
      setStatus("idle");

      setEvents(eventKey, allEvents);
      setLoading(false);
    },
    [_subRelays, _pool],
  );

  return { loading, status, events: eventMap[eventKey], loadOlderEvents };
};

export default useSubscribe;
