import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AiProviderFactory } from '../ai-agent/providers/ai-provider.factory';
import { DocSourceType, DocStatus } from '@omniflow/shared';
import { DocumentParser } from './document-parser';

export interface SemanticSearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  sourceType: DocSourceType;
  sourceUrl?: string;
  content: string;
  similarity: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiProviderFactory: AiProviderFactory
  ) {}

  async listDocuments(tenantId: string) {
    return this.prisma.knowledgeDocument.findMany({
      where: { tenantId },
      include: {
        _count: { select: { chunks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocument(tenantId: string, documentId: string) {
    const doc = await this.prisma.knowledgeDocument.findFirst({
      where: { id: documentId, tenantId },
      include: {
        chunks: {
          select: { id: true, tokenCount: true, metadata: true, createdAt: true },
        },
      },
    });

    if (!doc) throw new NotFoundException('Document not found in workspace');
    return doc;
  }

  async addDocument(params: {
    tenantId: string;
    title: string;
    content?: string;
    sourceType: DocSourceType;
    sourceUrl?: string;
    fileBuffer?: Buffer;
    fileName?: string;
  }) {
    const { tenantId, title, content = '', sourceType, sourceUrl, fileBuffer, fileName } = params;
    const provider = this.aiProviderFactory.getProvider();

    // 1. Get or create default KnowledgeBase for workspace
    let kb = await this.prisma.knowledgeBase.findFirst({
      where: { tenantId },
    });
    if (!kb) {
      kb = await this.prisma.knowledgeBase.create({
        data: {
          tenantId,
          name: 'Main Knowledge Base',
        },
      });
    }

    // 2. Create document record with PROCESSING state
    const doc = await this.prisma.knowledgeDocument.create({
      data: {
        knowledgeBaseId: kb.id,
        tenantId,
        title,
        sourceType,
        sourceUrl,
        status: DocStatus.PROCESSING,
      },
    });

    try {
      // 3. Parse content based on source format
      const parsed = await DocumentParser.parse({
        content,
        sourceType,
        sourceUrl,
        fileBuffer,
        fileName,
      });

      // 4. Chunk text with boundary detection and overlap
      const chunks = DocumentParser.chunkText(parsed.text, 500, 50);

      // 5. Generate embeddings and store chunks
      for (const chunk of chunks) {
        const embedding = await provider.generateEmbedding(chunk.content);
        await this.prisma.knowledgeChunk.create({
          data: {
            documentId: doc.id,
            tenantId,
            content: chunk.content,
            embedding: embedding as any,
            tokenCount: chunk.tokenCount,
            metadata: {
              ...parsed.metadata,
              documentTitle: title,
              sourceType,
              chunkIndex: chunk.chunkIndex,
              sourceUrl,
            },
          },
        });
      }

      // 6. Mark document as indexed
      return await this.prisma.knowledgeDocument.update({
        where: { id: doc.id },
        data: {
          status: DocStatus.INDEXED,
          chunkCount: chunks.length,
        },
      });
    } catch (err: any) {
      this.logger.error(`Failed to index document ${doc.id}: ${err.message}`);
      await this.prisma.knowledgeDocument.update({
        where: { id: doc.id },
        data: { status: DocStatus.FAILED },
      });
      throw err;
    }
  }

  async reindexDocument(tenantId: string, documentId: string) {
    const doc = await this.prisma.knowledgeDocument.findFirst({
      where: { id: documentId, tenantId },
    });
    if (!doc) throw new NotFoundException('Document not found in workspace');

    // 1. Remove existing chunks
    await this.prisma.knowledgeChunk.deleteMany({
      where: { documentId, tenantId },
    });

    // 2. Set to processing
    await this.prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { status: DocStatus.PROCESSING },
    });

    const provider = this.aiProviderFactory.getProvider();

    // 3. Re-parse
    const parsed = await DocumentParser.parse({
      sourceType: doc.sourceType as unknown as DocSourceType,
      sourceUrl: doc.sourceUrl || undefined,
      content: doc.title,
    });

    const chunks = DocumentParser.chunkText(parsed.text, 500, 50);

    for (const chunk of chunks) {
      const embedding = await provider.generateEmbedding(chunk.content);
      await this.prisma.knowledgeChunk.create({
        data: {
          documentId: doc.id,
          tenantId,
          content: chunk.content,
          embedding: embedding as any,
          tokenCount: chunk.tokenCount,
          metadata: {
            documentTitle: doc.title,
            sourceType: doc.sourceType,
            chunkIndex: chunk.chunkIndex,
            sourceUrl: doc.sourceUrl,
          },
        },
      });
    }

    return this.prisma.knowledgeDocument.update({
      where: { id: doc.id },
      data: {
        status: DocStatus.INDEXED,
        chunkCount: chunks.length,
      },
    });
  }

  async deleteDocument(tenantId: string, documentId: string) {
    const doc = await this.prisma.knowledgeDocument.findFirst({
      where: { id: documentId, tenantId },
    });
    if (!doc) throw new NotFoundException('Document not found in workspace');

    return this.prisma.knowledgeDocument.delete({
      where: { id: documentId },
    });
  }

  /**
   * Vector semantic search with cosine similarity scoring, ranking, and threshold filtering
   */
  async semanticSearch(
    tenantId: string,
    query: string,
    topK = 3,
    minSimilarity = 0.4
  ): Promise<SemanticSearchResult[]> {
    if (!query || !query.trim()) return [];

    const provider = this.aiProviderFactory.getProvider();
    const queryEmbedding = await provider.generateEmbedding(query);

    // Fetch tenant chunks
    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: { tenantId },
      include: {
        document: {
          select: { id: true, title: true, sourceType: true, sourceUrl: true },
        },
      },
      take: 50,
    });

    if (chunks.length === 0) return [];

    // Calculate cosine similarity for each chunk
    const scored: SemanticSearchResult[] = [];

    for (const chunk of chunks) {
      const vec = chunk.embedding as unknown as number[];
      const similarity = this.cosineSimilarity(queryEmbedding, vec);

      if (similarity >= minSimilarity) {
        scored.push({
          chunkId: chunk.id,
          documentId: chunk.documentId,
          documentTitle: chunk.document.title,
          sourceType: chunk.document.sourceType as unknown as DocSourceType,
          sourceUrl: chunk.document.sourceUrl || undefined,
          content: chunk.content,
          similarity: Math.round(similarity * 1000) / 1000,
          metadata: (chunk.metadata as Record<string, any>) || undefined,
        });
      }
    }

    // Sort by descending similarity score
    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  }

  /**
   * Helper method for RAG context extraction
   */
  async searchRelevantChunks(tenantId: string, query: string, topK = 3): Promise<string[]> {
    const results = await this.semanticSearch(tenantId, query, topK, 0.4);
    return results.map(
      (r) => `[Source: ${r.documentTitle} (${r.sourceType}) | Match: ${Math.round(r.similarity * 100)}%]\n${r.content}`
    );
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length === 0 || b.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
