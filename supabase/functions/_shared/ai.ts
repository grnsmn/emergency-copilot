// AI adapter — provider-agnostic.
//
// Hard product constraint (see README "Product scope"): the only operations
// exposed here are structured fact extraction and short, non-prescriptive
// summaries with citations. Do NOT add chat, free-form Q&A, diagnosis,
// therapy or triage methods to this interface.

export type FactCategory =
  "allergy" | "medication" | "condition" | "procedure" | "vaccination" | "other";

export type ExtractedFact = {
  category: FactCategory;
  label: string;
  value: string | null;
  sourcePage: number | null;
  sourceExcerpt: string;
};

export type ConfirmedFact = {
  id: string;
  category: FactCategory;
  label: string;
  value: string | null;
};

export type Summary = {
  content: string;
  sourceExtractionIds: string[];
};

export interface AiProvider {
  readonly name: string;
  extractFacts(input: {
    pages: { page: number; text: string }[];
    locale: "it" | "en";
  }): Promise<ExtractedFact[]>;
  summarize(input: { facts: ConfirmedFact[]; locale: "it" | "en" }): Promise<Summary>;
}

export class NotImplementedAiProvider implements AiProvider {
  readonly name = "not-implemented";

  extractFacts(): Promise<ExtractedFact[]> {
    return Promise.reject(new Error("AI provider not implemented"));
  }

  summarize(): Promise<Summary> {
    return Promise.reject(new Error("AI provider not implemented"));
  }
}

export function getAiProvider(): AiProvider {
  // Future: switch on Deno.env.get("AI_PROVIDER") and return a concrete adapter.
  return new NotImplementedAiProvider();
}
