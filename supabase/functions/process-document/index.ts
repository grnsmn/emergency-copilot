// process-document
//
// Called by the app (signed-in user) after uploading a file to the
// `documents` bucket and inserting its `documents` row.
//
// Flow (only steps 1-2 are implemented):
//   1. verify the caller owns `document_id` (RLS-scoped read)
//   2. mark it `processing`
//   3. download the file, run OCR via the OCR adapter, store `ocr_text`
//   4. invoke `extract-medical-facts`
//   5. mark `processed` (or `failed` with `error_message`)
import { withSupabase } from "npm:@supabase/server@1";

import { getOcrProvider } from "../_shared/ocr.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "method_not_allowed" }, { status: 405 });
    }

    const { document_id } = await req.json().catch(() => ({}));
    if (typeof document_id !== "string") {
      return Response.json({ error: "document_id_required" }, { status: 400 });
    }

    // RLS ensures this only returns the caller's own document.
    const { data: document, error } = await ctx.supabase
      .from("documents")
      .select("id, user_id, storage_path, mime_type, status")
      .eq("id", document_id)
      .maybeSingle();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!document) return Response.json({ error: "not_found" }, { status: 404 });

    await ctx.supabaseAdmin
      .from("documents")
      .update({ status: "processing" })
      .eq("id", document.id);
    await ctx.supabaseAdmin.from("audit_events").insert({
      user_id: document.user_id,
      event_type: "document.processing_started",
      entity_type: "document",
      entity_id: document.id,
    });

    // TODO(OCR): download from storage, getOcrProvider().extractText(...),
    // save ocr_text, then invoke extract-medical-facts with a secret key.
    const ocr = getOcrProvider();
    const message = `OCR provider "${ocr.name}" not implemented`;

    await ctx.supabaseAdmin
      .from("documents")
      .update({ status: "failed", error_message: message })
      .eq("id", document.id);

    return Response.json({ error: "not_implemented", message }, { status: 501 });
  }),
};
