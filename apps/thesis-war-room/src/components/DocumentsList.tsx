'use client';

import { useState } from 'react';
import type { Document } from '@/types';
import { apiClient } from '@/lib/api';
import { FileText, Download, Eye, Loader2 } from 'lucide-react';

interface DocumentsListProps {
  documents: Document[];
  sessionId: string;
}

interface DocumentContent {
  text: string;
  type: string;
}

export function DocumentsList({ documents, sessionId }: DocumentsListProps) {
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [docContents, setDocContents] = useState<Record<string, DocumentContent>>({});

  const canPreview = (type: string) => {
    return [
      'text/csv',
      'text/tab-separated-values',
      'text/plain',
      'text/markdown',
    ].includes(type);
  };

  const handlePreview = async (docId: string) => {
    if (expandedDocId === docId) {
      setExpandedDocId(null);
      return;
    }

    if (docContents[docId]) {
      setExpandedDocId(docId);
      return;
    }

    setLoadingDocId(docId);
    try {
      const content = await apiClient.getDocumentContent(sessionId, docId);
      setDocContents((prev) => ({ ...prev, [docId]: content }));
      setExpandedDocId(docId);
    } catch (error) {
      console.error('Error loading document content:', error);
      alert('Failed to load document content');
    } finally {
      setLoadingDocId(null);
    }
  };

  const handleDownload = async (docId: string, docName: string) => {
    try {
      const blob = await apiClient.downloadDocument(sessionId, docId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = docName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  if (documents.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-card">
        <div className="text-center py-4">
          <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card">
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Documents ({documents.length})
        </h3>
      </div>
      <div className="divide-y">
        {documents.map((doc) => (
          <div key={doc.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <p className="font-medium truncate">{doc.name}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 rounded-full bg-muted">
                    {doc.type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </span>
                  <span>{(doc.size / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {canPreview(doc.type) && (
                  <button
                    onClick={() => handlePreview(doc.id)}
                    disabled={loadingDocId === doc.id}
                    className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                    title="View content"
                  >
                    {loadingDocId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleDownload(doc.id, doc.name)}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {expandedDocId === doc.id && docContents[doc.id] && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Content Preview
                  </span>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                    {docContents[doc.id].text}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
