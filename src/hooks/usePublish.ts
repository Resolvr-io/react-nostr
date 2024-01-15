import { useCallback, useState } from "react";

import useNostrStore from "../store";

import { type Event } from "nostr-tools";
import { type PublishEventStatus, type UsePublishParams } from "../types";

// TODO: add retry logic
const usePublish = ({ relays }: UsePublishParams) => {
  const [status, setStatus] = useState<PublishEventStatus>("idle");
  const pool = useNostrStore((state) => state.pool);

  const publish = useCallback(
    async (event: Event | undefined, onSuccess: (event: Event) => void) => {
      setStatus("pending");

      if (!event) {
        setStatus("error");
        return null;
      }

      const publishedEvent = await Promise.any(pool.publish(relays, event));

      if (publishedEvent !== null) {
        onSuccess(event);
        setStatus("success");
      }

      setStatus("idle");

      return publishedEvent;
    },
    [pool, relays],
  );

  const invalidateKeys = useCallback(async (eventKeys: string[]) => {
    const { setEvents } = useNostrStore.getState();
    for (const eventKey of eventKeys) {
      setEvents(eventKey, []);
    }
  }, []);

  return { publish, invalidateKeys, status };
};

export default usePublish;
