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

          const leadTypeLabel = (payload.lead_type ?? "consultation_booking").replace(/_/g, " ");
          const note = await twentyFetch<{ data: { createNote: { id: string } } }>(
            baseUrl,
            apiKey,
            "/rest/notes",
            {
              method: "POST",
              body: JSON.stringify({
                title: `${leadTypeLabel} — ${new Date().toLocaleString("en-IN")}`,
                bodyV2: { markdown: toMarkdown(payload) },
              }),
            },
          );

          await twentyFetch(baseUrl, apiKey, "/rest/noteTargets", {
            method: "POST",
            body: JSON.stringify({ noteId: note.data.createNote.id, targetPersonId: personId }),
          });

          return json({ ok: true, personId });
        } catch (error) {
          console.error("Twenty CRM lead capture failed", error);
          return json({ error: "The CRM could not be reached." }, 502);
        }
      },
    },
  },
});
