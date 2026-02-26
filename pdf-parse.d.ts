declare module "pdf-parse" {
  export interface PDFParseResult {
    text: string;
    numpages: number;
    info?: Record<string, unknown>;
    metadata?: unknown;
  }

  function pdfParse(dataBuffer: Buffer): Promise<PDFParseResult>;
  export default pdfParse;
}
