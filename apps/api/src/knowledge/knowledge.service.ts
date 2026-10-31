import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OpenAiClient } from '@omniflow/integrations';
import { DocSourceType, DocStatus } from '@omniflow/shared';

@Injectable()
export class KnowledgeService {
  private readonly openai = new OpenAiClient();

  constructor(private readonly prisma: PrismaService) {}

  async listDocuments(tenantId: string) {
    return this.prisma.knowledgeDocument.findMany({
      where: { tenantId },
      include: {
        _count: { select: { chunks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addDocument(params: {
    tenantId: string;
    title: string;
    content: string;
    sourceType: DocSourceType;
    sourceUrl?: string;
  }) {
    const { tenantId, title, content, sourceType, sourceUrl } = params;

    // 1. Get or create default KnowledgeBase
    let kb = await this.prisma.knowledgeBase.findFirst({
      where: { tenantId },
    });
    if (!kb) {
      kb = await this.prisma.knowledgeBase.create({
        data: {
          tenantId,
          name: 'Default Knowledge Base',
        },
      });
    }

    // 2. Create document
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

    // 3. Chunk text into ~500 character chunks with 50 char overlap
    const chunks = this.chunkText(content, 500, 50);

    for (const chunkText of chunks) {
      const embedding = await this.openai.generateEmbedding(chunkText);
      await this.prisma.knowledgeChunk.create({
        data: {
          documentId: doc.id,
          tenantId,
          content: chunkText,
          embedding: embedding as any,
          tokenCount: Math.ceil(chunkText.length / 4),
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
    if (!doc) throw new NotFoundException('Document not found');

    return this.prisma.knowledgeDocument.delete({
      where: { id: documentId },
    });
  }

  /**
   * Semantic cosine similarity search over tenant knowledge chunks
   */
  async searchRelevantChunks(tenantId: string, query: string, topK = 3): Promise<string[]> {
    const queryEmbedding = await this.openai.generateEmbedding(query);

    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: { tenantId },
      take: 20,
    });

    if (chunks.length === 0) return [];

    // Compute cosine similarities
    const scored = chunks.map((chunk) => {
      const vec = chunk.embedding as unknown as number[];
      const similarity = this.cosineSimilarity(queryEmbedding, vec);
      return { content: chunk.content, similarity };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK).map((s) => s.content);
  }

  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const result: string[] = [];
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      result.push(text.slice(start, end).trim());
      start += chunkSize - overlap;
    }
    return result;
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
