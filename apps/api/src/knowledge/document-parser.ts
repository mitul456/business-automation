import { DocSourceType } from '@omniflow/shared';

export interface ParsedDocumentResult {
  text: string;
  sourceType: DocSourceType;
  metadata: Record<string, any>;
}

export class DocumentParser {
  /**
   * Parse input based on source type into plain text ready for chunking & embedding
   */
  static async parse(input: {
    content?: string;
    sourceType: DocSourceType;
    sourceUrl?: string;
    fileBuffer?: Buffer;
    fileName?: string;
  }): Promise<ParsedDocumentResult> {
    const { content = '', sourceType, sourceUrl, fileBuffer, fileName } = input;

    switch (sourceType) {
      case DocSourceType.URL_SCRAPE:
        return this.parseUrl(sourceUrl || content);

      case DocSourceType.CSV_FILE:
        return this.parseCsv(fileBuffer ? fileBuffer.toString('utf-8') : content);

      case DocSourceType.PDF_FILE:
        return this.parsePdf(fileBuffer ? fileBuffer.toString('latin1') : content, fileName);

      case DocSourceType.DOCX_FILE:
        return this.parseDocx(fileBuffer ? fileBuffer.toString('utf-8') : content, fileName);

      case DocSourceType.FAQ:
        return this.parseFaq(content);

      case DocSourceType.INSTRUCTIONS:
      case DocSourceType.MANUAL_TEXT:
      case DocSourceType.TXT_FILE:
      default:
        return {
          text: content.trim(),
          sourceType,
          metadata: { length: content.length, fileName },
        };
    }
  }

  /**
   * Scrapes website URL and extracts meaningful text
   */
  private static async parseUrl(url: string): Promise<ParsedDocumentResult> {
    if (!url || !url.startsWith('http')) {
      return {
        text: url || '',
        sourceType: DocSourceType.URL_SCRAPE,
        metadata: { url },
      };
    }

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'OmniFlowBot/1.0 (+https://omniflow.io)' },
      });

      const html = await response.text();
      // Strip scripts, styles, and HTML tags
      const cleanedText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        text: cleanedText.slice(0, 50000), // Cap at 50k characters for safe embedding
        sourceType: DocSourceType.URL_SCRAPE,
        metadata: { url, fetchedLength: cleanedText.length },
      };
    } catch (err: any) {
      return {
        text: `Content extracted from URL: ${url}`,
        sourceType: DocSourceType.URL_SCRAPE,
        metadata: { url, error: err.message },
      };
    }
  }

  /**
   * Parses CSV lines into searchable knowledge statements
   */
  private static parseCsv(csvContent: string): Promise<ParsedDocumentResult> {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return Promise.resolve({
        text: '',
        sourceType: DocSourceType.CSV_FILE,
        metadata: { rowCount: 0 },
      });
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rowsText: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const rowParts: string[] = [];
      headers.forEach((h, idx) => {
        if (values[idx]) {
          rowParts.push(`${h}: ${values[idx]}`);
        }
      });
      if (rowParts.length > 0) {
        rowsText.push(`[Record ${i}] ${rowParts.join(' | ')}`);
      }
    }

    return Promise.resolve({
      text: rowsText.join('\n\n'),
      sourceType: DocSourceType.CSV_FILE,
      metadata: { rowCount: lines.length - 1, headers },
    });
  }

  /**
   * Parses PDF content text streams
   */
  private static parsePdf(rawContent: string, fileName?: string): Promise<ParsedDocumentResult> {
    // Extract readable text from text objects /BT ... /ET or clean ASCII/Unicode streams
    const streamMatches = rawContent.match(/\(([^)]+)\)\s*T[jJ]/g);
    let extracted = '';

    if (streamMatches && streamMatches.length > 0) {
      extracted = streamMatches
        .map((m) => m.replace(/^\(/, '').replace(/\)\s*T[jJ]$/, ''))
        .join(' ')
        .replace(/\\([()\\])/g, '$1');
    } else {
      // Fallback: extract printable strings
      extracted = rawContent
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    return Promise.resolve({
      text: extracted.length > 20 ? extracted : `PDF Document: ${fileName || 'Uploaded PDF'}\n${rawContent.slice(0, 5000)}`,
      sourceType: DocSourceType.PDF_FILE,
      metadata: { fileName, extractedLength: extracted.length },
    });
  }

  /**
   * Parses DOCX document xml content
   */
  private static parseDocx(rawContent: string, fileName?: string): Promise<ParsedDocumentResult> {
    // Extract text inside <w:t> tags from WordprocessingML if present
    const xmlMatches = rawContent.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    let extracted = '';

    if (xmlMatches && xmlMatches.length > 0) {
      extracted = xmlMatches
        .map((m) => m.replace(/<[^>]+>/g, ''))
        .join(' ');
    } else {
      extracted = rawContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    return Promise.resolve({
      text: extracted.length > 20 ? extracted : `Word Document: ${fileName || 'Uploaded DOCX'}\n${rawContent.slice(0, 5000)}`,
      sourceType: DocSourceType.DOCX_FILE,
      metadata: { fileName, extractedLength: extracted.length },
    });
  }

  /**
   * Parses structured FAQ inputs (Q&A pairs)
   */
  private static parseFaq(faqContent: string): Promise<ParsedDocumentResult> {
    const normalized = faqContent
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean)
      .join('\n\n');

    return Promise.resolve({
      text: normalized,
      sourceType: DocSourceType.FAQ,
      metadata: { type: 'FAQ' },
    });
  }

  /**
   * Chunk text into semantic chunks with token estimation and overlap
   */
  static chunkText(
    text: string,
    chunkSize = 500,
    overlap = 50
  ): Array<{ content: string; tokenCount: number; chunkIndex: number }> {
    const clean = text.trim();
    if (!clean) return [];

    const chunks: Array<{ content: string; tokenCount: number; chunkIndex: number }> = [];
    let start = 0;
    let chunkIndex = 0;

    while (start < clean.length) {
      let end = start + chunkSize;

      // If we are not at the very end of text, attempt to break at sentence or newline
      if (end < clean.length) {
        const punctuationBreak = clean.slice(start, end).search(/[.!?।\n]\s*[^.!?।\n]*$/);
        if (punctuationBreak > chunkSize * 0.6) {
          end = start + punctuationBreak + 1;
        }
      } else {
        end = clean.length;
      }

      const chunkSlice = clean.slice(start, end).trim();
      if (chunkSlice.length > 0) {
        chunks.push({
          content: chunkSlice,
          tokenCount: Math.ceil(chunkSlice.length / 4),
          chunkIndex,
        });
        chunkIndex++;
      }

      start = end - overlap;
      if (start >= clean.length || end === clean.length) break;
    }

    return chunks;
  }
}
