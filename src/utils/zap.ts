import { type EventTemplate, type Event } from "nostr-tools";
import {
  type ZapRequestParams,
  type RelayUrl,
  type Profile,
  type ZapResponseBody,
  type InvoiceResponse,
} from "../types";
import { finishEvent, tag } from "../utils";

export function zapRequest({
  recipientPubkey,
  eventId,
  amount,
  relays,
  content,
}: ZapRequestParams) {
  if (!amount) throw new Error("amount not given");
  if (!recipientPubkey) throw new Error("recipient public key not given");
  if (!relays) throw new Error("relays not given");
  if (!content) content = "";

  const zapRequest: EventTemplate = {
    kind: 9734,
    content,
    tags: [
      ["p", recipientPubkey],
      ["amount", (amount * 1000).toString()],
      ["relays", ...relays],
    ],
    created_at: Math.round(Date.now() / 1000),
  };

  if (eventId) {
    zapRequest.tags.push(["e", eventId]);
  }

  return zapRequest;
}

async function getZapEndpoint(profileEvent: Event) {
  try {
    let lnurl = "";
    const { lud16 } = JSON.parse(profileEvent.content) as Profile;
    if (lud16) {
      const [name, domain] = lud16.split("@");
      lnurl = `https://${domain}/.well-known/lnurlp/${name}`;
    } else {
      return undefined;
    }

    const res = await fetch(lnurl);
    const body = (await res.json()) as ZapResponseBody;

    if (body.allowsNostr && body.nostrPubkey) {
      return body.callback;
    }
  } catch (err) {
    console.error(err);
  }

  return undefined;
}

const fetchInvoice = async (zapEndpoint: string, zapRequestEvent: Event) => {
  const comment = zapRequestEvent.content;
  const amount = tag("amount", zapRequestEvent);
  if (!amount) throw new Error("amount not found");

  let url = `${zapEndpoint}?amount=${amount}&nostr=${encodeURIComponent(
    JSON.stringify(zapRequestEvent),
  )}`;

  if (comment) {
    url = `${url}&comment=${encodeURIComponent(comment)}`;
  }

  const res = await fetch(url);
  const { pr: invoice } = (await res.json()) as InvoiceResponse;

  return invoice;
};

const weblnConnect = async () => {
  try {
    if (typeof window.webln !== "undefined") {
      await window.webln.enable();
      return true;
    } else {
      return false;
    }
  } catch (e) {
    console.error(e);
    return false;
  }
};

const payInvoice = async (invoice: string) => {
  const weblnConnected = await weblnConnect();
  if (!weblnConnected) throw new Error("webln not available");

  const webln = window.webln;

  if (!webln) throw new Error("webln not available");

  const paymentRequest = invoice;

  const paymentResponse = await webln.sendPayment(paymentRequest);

  if (!paymentResponse) throw new Error("payment response not found");

  return paymentResponse;
};

export const sendZap = async ({
  relays,
  recipientMetadata,
  eventId,
  amount,
  content,
  secretKey,
}: {
  relays: RelayUrl[];
  recipientMetadata: Event;
  eventId: string;
  amount: number;
  content: string;
  secretKey: Uint8Array | undefined;
}) => {
  if (!amount) throw new Error("amount not given");

  const zapRequestEventTemplate = zapRequest({
    recipientPubkey: recipientMetadata.pubkey,
    eventId,
    amount,
    relays,
    content,
  });

  const zapRequestEvent = await finishEvent(zapRequestEventTemplate, secretKey);

  if (!zapRequestEvent) throw new Error("zap request event not created");

  // this needs to be a profile event
  const zapEndpoint = await getZapEndpoint(recipientMetadata);

  if (!zapEndpoint) throw new Error("zap endpoint not found");

  const invoice = await fetchInvoice(zapEndpoint, zapRequestEvent);

  if (!invoice) throw new Error("invoice not found");

  try {
    return await payInvoice(invoice);
  } catch (err) {
    console.error(err);
    throw new Error("zap failed");
  }
};
