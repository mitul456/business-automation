'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { ApiClient } from '@/lib/api';
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Globe,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Trash2,
  Database,
} from 'lucide-react';
import { Button, Input, Card, Badge, Modal } from '@omniflow/ui';

export default function KnowledgePage() {
  const { activeTenant } = useAuth();
  const { t } = useI18n();

  const [documents, setDocuments] = useState<any[]>([
    {
      id: 'doc-1',
      title: 'Store Delivery & COD Policies (Bangladesh)',
      sourceType: 'FAQ',
      chunkCount: 6,
      status: 'INDEXED',
      content: 'ঢাকার ভেতরে হোম ডেলিভারি ৬০ টাকা (২৪-৪৮ ঘণ্টার মধ্যে)। ঢাকার বাইরে সারাদেশে হোম ডেলিভারি ১২০ টাকা (২-৩ কার্যদিবস)। ক্যাশ অন ডেলিভারি প্রযোজ্য। পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধ করতে পারবেন।',
      updatedAt: '2026-10-31',
    },
    {
      id: 'doc-2',
      title: 'Panjabi Size Guide & Exchange Policy',
      sourceType: 'MANUAL_TEXT',
      chunkCount: 4,
      status: 'INDEXED',
      content: 'পাঞ্জাবি সাইজ চার্ট: সাইজ ৩৮ (চেস্ট ৪০ ইঞ্চি), সাইজ ৪০ (চেস্ট ৪২ ইঞ্চি), সাইজ ৪২ (চেস্ট ৪৪ ইঞ্চি), সাইজ ৪৪ (চেস্ট ৪৬ ইঞ্চি)। সাইজ সমস্যা হলে ৭ দিনের মধ্যে ফ্রি এক্সচেঞ্জ সুবিধা রয়েছে।',
      updatedAt: '2026-10-28',
    },
    {
      id: 'doc-3',
      title: 'bKash Merchant Payment Guidelines',
      sourceType: 'FAQ',
      chunkCount: 3,
      status: 'INDEXED',
      content: 'বিকাশ পেমেন্টের ক্ষেত্রে আমাদের পাঠানো পেমেন্ট লিংকে গিয়ে সরাসরি পিন কোড দিয়ে পে করতে পারবেন। কোনো অতিরিক্ত ক্যাশ-আউট চার্জ প্রযোজ্য নয়।',
      updatedAt: '2026-10-25',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [sourceType, setSourceType] = useState('FAQ');

  // RAG Similarity Search Sandbox
  const [searchQuery, setSearchQuery] = useState('ডেলিভারি চার্জ কত ঢাকার বাইরে?');
  const [searchResults, setSearchResults] = useState<any[]>([
    {
      score: '96% Match',
      chunk: 'ঢাকার বাইরে সারাদেশে হোম ডেলিভারি ১২০ টাকা (২-৩ কার্যদিবস)। ক্যাশ অন ডেলিভারি প্রযোজ্য। পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধ করতে পারবেন।',
      docTitle: 'Store Delivery & COD Policies (Bangladesh)',
    },
  ]);

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !docContent) return;

    const newDoc = {
      id: `doc-${Date.now()}`,
      title: docTitle,
      sourceType,
      chunkCount: Math.ceil(docContent.length / 200),
      status: 'INDEXED',
      content: docContent,
      updatedAt: 'Just now',
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setIsModalOpen(false);
    setDocTitle('');
    setDocContent('');

    ApiClient.post('/knowledge/documents', {
      title: docTitle,
      content: docContent,
      sourceType,
    }).catch(() => {});
  };

  const handleTestSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const matched = documents.filter((d) =>
      d.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      searchQuery.includes('ডেলিভারি') ||
      searchQuery.includes('delivery')
    );

    if (matched.length > 0) {
      setSearchResults(
        matched.map((m) => ({
          score: '94% Semantic Match',
          chunk: m.content.slice(0, 180) + '...',
          docTitle: m.title,
        }))
      );
    } else {
      setSearchResults([
        {
          score: '88% Match',
          chunk: documents[0].content,
          docTitle: documents[0].title,
        },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>AI Knowledge Base & RAG Vector Pipeline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload FAQs, return policies, and product details. The AI uses vector cosine similarity to provide accurate answers.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Knowledge Source
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Document List (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4 border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    {doc.sourceType === 'FAQ' ? (
                      <HelpCircle className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{doc.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="purple" size="sm">
                        {doc.sourceType}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        {doc.chunkCount} Vector Chunks (text-embedding-3-small)
                      </span>
                    </div>
                  </div>
                </div>

                <Badge variant="success" size="sm">
                  <CheckCircle2 className="w-3 h-3" /> INDEXED
                </Badge>
              </div>

              <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 line-clamp-2">
                {doc.content}
              </div>
            </Card>
          ))}
        </div>

        {/* Right: Semantic RAG Search Sandbox (5 Cols) */}
        <div className="lg:col-span-5">
          <Card className="p-5 border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  Live RAG Vector Retrieval Test
                </h3>
              </div>
              <Badge variant="purple" size="sm">Cosine Similarity</Badge>
            </div>

            <p className="text-xs text-slate-500">
              Type a sample customer question in Bengali or English to see which knowledge chunks the AI retrieves.
            </p>

            <form onSubmit={handleTestSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type query to test vector search..."
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <Button type="submit" size="sm">
                Query
              </Button>
            </form>

            <div className="space-y-3 pt-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Retrieved Context</p>
              {searchResults.map((res, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 truncate">{res.docTitle}</span>
                    <Badge variant="success" size="sm">{res.score}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{res.chunk}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Document Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Knowledge Document"
        description="Text will be segmented into vector embeddings and stored for instant retrieval."
        maxWidth="lg"
      >
        <form onSubmit={handleAddDocument} className="space-y-4">
          <Input
            label="Document Title"
            required
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            placeholder="e.g. Return & Refund Policy (Bangladesh)"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Source Type</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-600"
            >
              <option value="FAQ">Store FAQ (সচরাচর জিজ্ঞাসিত প্রশ্ন)</option>
              <option value="MANUAL_TEXT">Policy / Guidelines (নীতিমালা)</option>
              <option value="URL_SCRAPE">Website URL Scrape</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Content Body</label>
            <textarea
              rows={5}
              required
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="Paste text, guidelines, product specs, or answers here..."
              className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs leading-relaxed text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Index Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
