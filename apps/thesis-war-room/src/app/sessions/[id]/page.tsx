'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWebSocket } from '@/hooks/useWebSocket';
import { SessionHeader } from '@/components/SessionHeader';
import { Timeline } from '@/components/Timeline';
import { AgentsPanel } from '@/components/AgentsPanel';
import { VotesPanel } from '@/components/VotesPanel';
import { MessagesPanel } from '@/components/MessagesPanel';
import { ReportSection } from '@/components/ReportSection';
import { DocumentsList } from '@/components/DocumentsList';
import { Loader2, Wifi, WifiOff, Upload } from 'lucide-react';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SessionPage({ params }: PageProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    params.then((p) => setSessionId(p.id));
  }, [params]);

  const { data, isConnected, error } = useWebSocket({
    sessionId: sessionId || '',
  });

  const handleUpload = async () => {
    if (!sessionId) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`http://localhost:4000/sessions/${sessionId}/documents`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }
      } catch (err) {
        console.error('Upload error:', err);
        alert('Failed to upload document');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-12 border rounded-lg bg-card">
          <WifiOff className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Connecting to session...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to sessions
        </Link>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <Wifi className="w-4 h-4" />
              <span className="hidden sm:inline">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <WifiOff className="w-4 h-4" />
              <span className="hidden sm:inline">Disconnected</span>
            </div>
          )}
          <span className="text-xs text-muted-foreground">
            ({data.connectionCount} viewer{data.connectionCount !== 1 ? 's' : ''})
          </span>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SessionHeader session={data.session} hypothesis={data.hypothesis} />

          <DocumentsList documents={data.documents} sessionId={sessionId || ''} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <VotesPanel votes={data.votes} />
            <MessagesPanel messages={data.messages} agents={data.agents} />
          </div>

          <Timeline events={data.ledger} />

          <ReportSection
            session={data.session}
            hypothesis={data.hypothesis}
            documents={data.documents}
            agents={data.agents}
            opinions={data.opinions}
            votes={data.votes}
          />
        </div>

        <div className="space-y-6">
          <AgentsPanel agents={data.agents} />
        </div>
      </div>
    </main>
  );
}
