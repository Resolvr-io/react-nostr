import { useCallback, useEffect, useState } from "react";
import useNostrStore from "../store";
import { type UseSubscribeParams } from "../types";

// TODO: load newer events function
// TODO: add invalidation function
const useSubscribe = ({
  filter,
  eventKey,
  relays,
  initialEvents = [],
  onEventsNotFound = () => {},
  // onEvent = (_) => {},
  // onEOSE = () => {},
  // onEventPredicate = () => true,
  // onEventsResolved = (_) => {},
}: UseSubscribeParams) => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "fetching">("idle");
  const pool = useNostrStore((state) => state.pool);
  const eventMap = useNostrStore((state) => state.eventMap);
  const setEvents = useNostrStore((state) => state.setEvents);
  const [noEvents, setNoEvents] = useState(false);

  useEffect(() => {
    setLoading(true);
    setStatus("fetching");

    if (initialEvents.length > 0) {
      setEvents(eventKey, initialEvents);
      setLoading(false);
      setStatus("idle");
      return;
    }

    const events = eventMap[eventKey];

    if (events && events.length > 0) {
      setLoading(false);
      setStatus("idle");
      return;
    }

    async function fetchEvents() {
      const _events = await pool.querySync(relays, filter);
      setStatus("fetching");
      // console.log("EVENTS", _events);

      if (!_events || _events.length === 0) {
        // onEventsNotFound();
        // TODO: need a way to set noEvents to false when new events are added
        // setNoEvents(true);
        setLoading(false);
        setStatus("idle");
        return;
      }
      setNoEvents(false);

      // the last event should be the oldest event so we sort by created_at
      const sortedEvents = _events.sort((a, b) => b.created_at - a.created_at);

      setEvents(eventKey, sortedEvents);
      setStatus("idle");
    }

    void fetchEvents();
    setLoading(false);
  }, [relays, pool]);

  const loadOlderEvents = useCallback(
    async (eventKey: string, limit: number) => {
      const { eventMap, setEvents } = useNostrStore.getState();

      setLoading(true);
      setStatus("fetching");
      const existingEvents = eventMap[eventKey];

      if (!existingEvents || existingEvents.length === 0) {
        setLoading(false);
        setStatus("idle");
        return;
      }

      let moreFilter = { ...filter, limit };

      const lastEvent = existingEvents[existingEvents.length - 1];

      if (!lastEvent) {
        setLoading(false);
        setStatus("idle");
        return;
      }

      const until = lastEvent.created_at - 200;

      moreFilter = { ...moreFilter, until };

      const newEvents = await pool.querySync(relays, moreFilter);

      if (!newEvents || newEvents.length === 0) {
        onEventsNotFound();
        setLoading(false);
        setStatus("idle");
        return;
      }
      setNoEvents(false);

      let sortedEvents = newEvents.sort((a, b) => b.created_at - a.created_at);

      // TODO: if events returned are greater than limit, drop the extra events
      // maybe keep them in a separate list/cache for later use
      sortedEvents = sortedEvents.slice(0, limit);

      const allEvents = [...existingEvents, ...sortedEvents];

      setEvents(eventKey, allEvents);
      setLoading(false);
      setStatus("idle");
    },
    [relays, pool, filter],
  );

  const invalidate = useCallback(async (eventKey: string) => {
    const { setEvents } = useNostrStore.getState();
    setEvents(eventKey, []);
  }, []);

  return {
    loading,
    status,
    events: eventMap[eventKey] ?? [],
    loadOlderEvents,
    noEvents,
    invalidate,
  };
};

export default useSubscribe;
