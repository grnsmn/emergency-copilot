// extract-medical-facts
//
// Server-to-server only (called by process-document with a secret key).
// Reads a document's `ocr_text`, asks the AI adapter for structured facts and
// writes them to `extractions` as `pending_review`. The user must confirm
// each fact before it can appear on the Emergency Card.
//
// Extraction only: never diagnosis, therapy, triage or free-form answers.
import { withSupabase } from "npm:@supabase/server@1";

import { getAiProvider } from "../_shared/ai.ts";

export default {
  fetch: withSupabase({ auth: "secret" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "method_not_allowed" }, { status: 405 });
    }

    const { document_id } = await req.json().catch(() => ({}));
    if (typeof document_id !== "string") {
      return Response.json({ error: "document_id_required" }, { status: 400 });
    }

    const { data: document, error } = await ctx.supabaseAdmin
      .from("documents")
      .select("id, user_id, ocr_text")
      .eq("id", document_id)
      .maybeSingle();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!document) return Response.json({ error: "not_found" }, { status: 404 });
    if (!document.ocr_text) {
      return Response.json({ error: "ocr_text_missing" }, { status: 409 });
    }

    // TODO(AI): getAiProvider().extractFacts(...), insert rows into
    // `extractions` (review_status defaults to pending_review), write an
    // audit event.
    const ai = getAiProvider();

    return Response.json(
      { error: "not_implemented", message: `AI provider "${ai.name}" not implemented` },
      { status: 501 },
    );
  }),
};
