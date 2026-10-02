import { createFileRoute } from "@tanstack/react-router";

type LeadPayload = {
  lead_type?: string;
  name?: string;
  phone?: string;
  email?: string;
  primary_concern?: string;
  [key: string]: unknown;
};

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, spaceIndex), lastName: trimmed.slice(spaceIndex + 1) };
}

function normalizePhone(raw: string): {
  primaryPhoneNumber: string;
  primaryPhoneCallingCode: string;
  primaryPhoneCountryCode: string;
} {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+91")) {
    return {
      primaryPhoneNumber: trimmed.slice(3).replace(/\D/g, ""),
      primaryPhoneCallingCode: "+91",
      primaryPhoneCountryCode: "IN",
    };
  }
  if (trimmed.startsWith("+")) {
    return {
      primaryPhoneNumber: trimmed,
      primaryPhoneCallingCode: "",
      primaryPhoneCountryCode: "",
    };
  }
  return {
    primaryPhoneNumber: trimmed.replace(/\D/g, ""),
    primaryPhoneCallingCode: "+91",
    primaryPhoneCountryCode: "IN",
  };
}

function toMarkdown(payload: LeadPayload): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      key === "name" ||
      key === "phone"
    ) {
      continue;
    }
    const label = key.replace(/_/g, " ");
    const rendered =
      typeof value === "object"
        ? "```\n" + JSON.stringify(value, null, 2) + "\n```"
        : String(value);
    lines.push(`**${label}:** ${rendered}`);
  }
  return lines.join("\n\n");
}

const LEAD_SOURCE = "Sanjay Rithik skin landing page";

function enquirySummary(payload: LeadPayload, name: string, phone: string, isRepeat: boolean) {
  const concern =
    typeof payload.primary_concern === "string" && payload.primary_concern
      ? payload.primary_concern
      : "Not given";
  const source = payload["source"];
  const form = typeof source === "string" && source ? source : "website";
  return [
    `${isRepeat ? "Repeat enquiry" : "New enquiry"} · ${LEAD_SOURCE}`,
    `Received ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC via the ${form} form.`,
    "",
    "**Contact (as submitted)**",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Concern: ${concern}`,
    "",
    "**All submitted details**",
    toMarkdown(payload),
  ].join("\n");
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Map a landing-page enquiry onto the workspace's existing custom Opportunity lead fields. */
function opportunityFields(
  payload: LeadPayload,
  name: string,
  phone: string,
  referer: string | null,
): Record<string, unknown> {
  const concern = text(payload.primary_concern);
  const preferredTime = text(payload["preferred_time"]);
  const notes = [
    concern && `Concern: ${concern}`,
    preferredTime && `Preferred time: ${preferredTime}`,
    text(payload["result_profile"]) && `Skin-check result: ${text(payload["result_profile"])}`,
    text(payload["device"]) && `Device: ${text(payload["device"])}`,
    text(payload["referrer"]) && `Referrer: ${text(payload["referrer"])}`,
  ].filter(Boolean);
  const fields: Record<string, unknown> = {
    stage: "NEW",
    leadContactName: name,
    leadPhone: phone,
    leadForm: text(payload["source"]) || text(payload.lead_type) || "website",
    leadLandingPage: referer ?? LEAD_SOURCE,
    leadIndustry: "Dermatology clinic",
    leadPreferredChannel: "Phone / WhatsApp",
    leadWantsCall: true,
    leadConsentContact: payload["consent_status"] === true,
    leadConsentWhatsapp: payload["consent_whatsapp"] === true,
    leadSubmissions: 1,
  };
  const optional: Record<string, string> = {
    leadEmail: text(payload.email),
    leadGoals: concern,
    leadTimeline: preferredTime,
    leadUtmSource: text(payload["utm_source"]),
    leadUtmMedium: text(payload["utm_medium"]),
    leadUtmCampaign: text(payload["utm_campaign"]),
    leadNotes: notes.join("\n"),
  };
  for (const [key, value] of Object.entries(optional)) if (value) fields[key] = value;
  return fields;
}

async function twentyFetch<T>(
  baseUrl: string,
  apiKey: string,
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Twenty API ${path} responded ${response.status}: ${detail.slice(0, 300)}`);
  }
  return (await response.json()) as T;
}

export const Route = createFileRoute("/api/lead-capture")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["TWENTY_API_KEY"];
        const baseUrl = (process.env["TWENTY_API_URL"] ?? "http://localhost:3000").replace(
          /\/$/,
          "",
        );
        if (!apiKey) {
          return json({ error: "CRM is not configured on the server." }, 503);
        }

        let payload: LeadPayload;
        try {
          payload = await request.json();
        } catch {
          return json({ error: "Invalid JSON body." }, 400);
        }

        const name = typeof payload.name === "string" ? payload.name.trim() : "";
        const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
        if (!name || !phone) {
          return json({ error: "name and phone are required." }, 400);
        }

        try {
          const phoneFields = normalizePhone(phone);

          const existing = await twentyFetch<{ data: { people: Array<{ id: string }> } }>(
            baseUrl,
            apiKey,
            `/rest/people?filter=phones.primaryPhoneNumber[eq]:${encodeURIComponent(
              phoneFields.primaryPhoneNumber,
            )}&limit=1`,
            { method: "GET" },
          );
          const existingPerson = existing.data.people[0];

          let personId: string;
          if (existingPerson?.id) {
            personId = existingPerson.id;
          } else {
            const email =
              typeof payload.email === "string" && payload.email ? payload.email : undefined;
            const created = await twentyFetch<{ data: { createPerson: { id: string } } }>(
              baseUrl,
              apiKey,
              "/rest/people",
              {
                method: "POST",
                body: JSON.stringify({
                  name: splitName(name),
                  phones: phoneFields,
                  ...(email ? { emails: { primaryEmail: email } } : {}),
                  jobTitle: [payload.lead_type, payload.primary_concern].filter(Boolean).join(": "),
                }),
              },
            );
            personId = created.data.createPerson.id;
          }

          // Mirror the CRM's existing website-form convention: one opportunity per person
          // ("Name · Source"), with a "New enquiry" / "Repeat enquiry" note on it.
          const isRepeat = Boolean(existingPerson?.id);
          let opportunityId: string | undefined;
          try {
            const openOpportunity = await twentyFetch<{
              data: { opportunities: Array<{ id: string; leadSubmissions?: number | null }> };
            }>(
              baseUrl,
              apiKey,
              `/rest/opportunities?filter=pointOfContactId[eq]:${personId}&limit=1`,
              { method: "GET" },
            );
            const existingOpportunity = openOpportunity.data.opportunities[0];
            const fields = opportunityFields(payload, name, phone, request.headers.get("referer"));
            if (existingOpportunity?.id) {
              opportunityId = existingOpportunity.id;
              // Repeat enquiry: count it and refresh what the person told us this time.
              const { stage: _stage, leadSubmissions: _count, ...latest } = fields;
              await twentyFetch(baseUrl, apiKey, `/rest/opportunities/${opportunityId}`, {
                method: "PATCH",
                body: JSON.stringify({
                  ...latest,
                  leadSubmissions: (existingOpportunity.leadSubmissions ?? 1) + 1,
                }),
              }).catch((error) => console.error("Twenty CRM opportunity update failed", error));
            } else {
              const base = { name: `${name} · ${LEAD_SOURCE}`, pointOfContactId: personId };
              const create = (body: Record<string, unknown>) =>
                twentyFetch<{ data: { createOpportunity: { id: string } } }>(
                  baseUrl,
                  apiKey,
                  "/rest/opportunities",
                  { method: "POST", body: JSON.stringify(body) },
                );
              // If the workspace's custom lead fields ever change, still record the opportunity.
              const createdOpportunity = await create({ ...base, ...fields }).catch((error) => {
                console.error("Twenty CRM opportunity fields rejected; retrying without them", error);
                return create(base);
              });
              opportunityId = createdOpportunity.data.createOpportunity.id;
            }
          } catch (error) {
            // The lead is still recorded on the person if the opportunity step fails.
            console.error("Twenty CRM opportunity step failed", error);
          }

          const note = await twentyFetch<{ data: { createNote: { id: string } } }>(
            baseUrl,
            apiKey,
            "/rest/notes",
            {
              method: "POST",
              body: JSON.stringify({
                title: `${isRepeat ? "Repeat enquiry" : "New enquiry"}: ${name}`,
                bodyV2: { markdown: enquirySummary(payload, name, phone, isRepeat) },
              }),
            },
          );

          await twentyFetch(baseUrl, apiKey, "/rest/noteTargets", {
            method: "POST",
            body: JSON.stringify({ noteId: note.data.createNote.id, targetPersonId: personId }),
          });
          if (opportunityId) {
            await twentyFetch(baseUrl, apiKey, "/rest/noteTargets", {
              method: "POST",
              body: JSON.stringify({
                noteId: note.data.createNote.id,
                targetOpportunityId: opportunityId,
              }),
            });
          }

          return json({ ok: true, personId, opportunityId });
        } catch (error) {
          console.error("Twenty CRM lead capture failed", error);
          return json({ error: "The CRM could not be reached." }, 502);
        }
      },
    },
  },
});
