import { useCallback, useState } from "react";

import useNostrStore from "../store";

import { type Event } from "nostr-tools";
import { type PublishEventStatus, type UsePublishParams } from "../types";

// TODO: expose callback functions for success and error
// TODO: add retry logic
const usePublish = ({ relays }: UsePublishParams) => {
  const [status, setStatus] = useState<PublishEventStatus>("idle");
  const pool = useNostrStore((state) => state.pool);

  const publishEvent = useCallback(
    async (event: Event | undefined) => {
      setStatus("pending");

      if (!event) {
        setStatus("error");
        return null;
      }

      const publishedEvent = await Promise.any(pool.publish(relays, event));

      setStatus("success");
      setStatus("idle");

      return publishedEvent;
    },
    [pool, relays],
  );

  return { publishEvent, status };
};

export default usePublish;
