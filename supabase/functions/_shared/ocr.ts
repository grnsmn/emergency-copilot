// OCR adapter.
//
// OCRmyPDF + Tesseract are native binaries and cannot run inside the Deno
// Edge Runtime. The plan is a small self-hosted OCR worker (Docker:
// ocrmypdf + tesseract-ocr-ita/eng) exposed over HTTP; Edge Functions call it
// through this interface. Not implemented yet.

export type OcrResult = {
  pages: { page: number; text: string }[];
};

export interface OcrProvider {
  readonly name: string;
  extractText(file: Blob, mimeType: string): Promise<OcrResult>;
}

export class NotImplementedOcrProvider implements OcrProvider {
  readonly name = "not-implemented";

  extractText(): Promise<OcrResult> {
    return Promise.reject(new Error("OCR provider not implemented"));
  }
}

export function getOcrProvider(): OcrProvider {
  // Future: return new HttpOcrProvider(Deno.env.get("OCR_WORKER_URL")!)
  return new NotImplementedOcrProvider();
}
