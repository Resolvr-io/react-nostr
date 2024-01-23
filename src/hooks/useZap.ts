import { useCallback, useState } from "react";

import useNostrStore from "../store";
import { profileContent } from "../utils";

import { type Filter } from "nostr-tools";
import {
  type ZapEventStatus,
  type UseZapParams,
  type ZapParams,
} from "../types";
import { sendZap } from "../utils/zap";

const useZap = ({ eventKey, relays }: UseZapParams) => {
  const [status, setStatus] = useState<ZapEventStatus>("idle");
  const pool = useNostrStore((state) => state.pool);
  const eventMap = useNostrStore((state) => state.eventMap);
  const [sendPaymentResponse, setSendPaymentResponse] = useState<
    SendPaymentResponse | undefined
  >(undefined);

  const zap = useCallback(
    async ({
      amount,
      recipientMetadata,
      eventId,
      content,
      secretKey,
      initialDelay = 100,
      retryInterval = 500,
      onPaymentSuccess,
      onPaymentFailure,
      onZapReceipts,
      onNoZapReceipts,
    }: ZapParams) => {
      const { eventMap, setEvents } = useNostrStore.getState();

      setStatus("pending");

      if (recipientMetadata.content === "") {
        console.error("recipient profile not found");
        if (onPaymentFailure) onPaymentFailure();
        setStatus("error");
        setStatus("idle");
        return;
      }

      const lud16 = profileContent(recipientMetadata).lud16;

      if (!lud16) {
        console.error("lud16 not found");
        if (onPaymentFailure) onPaymentFailure();
        setStatus("error");
        setStatus("idle");
        return;
      }

      let sendPaymentResponse: SendPaymentResponse | undefined;

      try {
        sendPaymentResponse = await sendZap({
          relays,
          recipientMetadata,
          eventId,
          amount,
          content: content ?? "",
          secretKey,
        });
        setSendPaymentResponse(sendPaymentResponse);
        if (onPaymentSuccess) onPaymentSuccess(sendPaymentResponse);
        // return sendPaymentResponse;
      } catch (e) {
        if (onPaymentFailure) onPaymentFailure();
        setStatus("error");
        setStatus("idle");
        return;
      }

      setTimeout(() => {
        let attempts = 0;
        const maxAttempts = 5;

        const zapReceiptFilter: Filter = {
          kinds: [9735],
          "#e": [eventId],
        };

        const checkReceipt = async () => {
          const zapReceipts = await pool.querySync(relays, zapReceiptFilter);

          if (zapReceipts) {
            clearInterval(interval);
            // setZapReceipts(zapReceipts);
            setEvents(eventKey, [...zapReceipts, ...(eventMap[eventKey] ?? [])]);
            // return { sendPaymentResponse, zapReceipts };
            setStatus("success");
            setStatus("idle");
            if (onZapReceipts) onZapReceipts(zapReceipts);
          } else {
            attempts++;
            if (attempts >= maxAttempts) {
              clearInterval(interval);
              setStatus("idle");
              onNoZapReceipts && onNoZapReceipts();
            }
          }
        };

        const interval = setInterval(() => {
          void checkReceipt();
        }, retryInterval);
      }, initialDelay);
    },
    [],
  );
  return {
    zap,
    status,
    zapReceiptEvents: eventMap[eventKey] ?? [],
    sendPaymentResponse,
  };
};

export default useZap;
