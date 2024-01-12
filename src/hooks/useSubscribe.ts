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
  const _pool = useNostrStore((state) => state.pool);
  const eventMap = useNostrStore((state) => state.eventMap);
  const setEvents = useNostrStore((state) => state.setEvents);
  const [noEvents, setNoEvents] = useState(false);

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
      const _events = await _pool.querySync(relays, filter);
      // console.log("_EVENTS", _events);
      console.log("GETTING INITIAL EVENTS");

      if (!_events || _events.length === 0) {
        // onEventsNotFound();
        setNoEvents(true);
        setLoading(false);
        return;
      }
      setNoEvents(false);

      const sortedEvents = _events.sort((a, b) => b.created_at - a.created_at);

      setEvents(eventKey, sortedEvents);
    }

    void fetchEvents();
    setLoading(false);
  }, [relays, _pool]);

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

      console.log("LAST EVENT", lastEvent);
      // last event should be oldest event you can get them from the last existing event list
      // sort by created_at
      const until = lastEvent.created_at - 200;
      console.log("UNTIL", until);

      moreFilter = { ...moreFilter, until };

      console.log("MORE FILTER", moreFilter);

      setStatus("fetching");
      console.log("GETTING MORE EVENTS");
      const newEvents = await _pool.querySync(relays, moreFilter);

      if (!newEvents || newEvents.length === 0) {
        onEventsNotFound();
        setLoading(false);
        return;
      }
      setNoEvents(false);

      let sortedEvents = newEvents.sort((a, b) => b.created_at - a.created_at);

      // TODO: if events returned are greater than limit, drop the extra events
      // maybe keep them in a separate list
      sortedEvents = sortedEvents.slice(0, limit);

      const allEvents = [...existingEvents, ...sortedEvents];
      setStatus("idle");
      console.log("ALL EVENTS", allEvents);

      setEvents(eventKey, allEvents);
      setLoading(false);
    },
    [relays, _pool],
  );

  return {
    loading,
    status,
    events: eventMap[eventKey] ?? [],
    loadOlderEvents,
    noEvents,
  };
};

export default useSubscribe;
