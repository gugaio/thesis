'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useWebSocket } from '@/hooks/useWebSocket';
import { SessionHeader } from '@/components/session/SessionHeader';
import { HypothesisPanel } from '@/components/session/HypothesisPanel';
import { DecisionModule } from '@/components/session/DecisionModule';
import { AgentsPanel } from '@/components/session/AgentsPanel';
import { ActivityTimeline } from '@/components/session/ActivityTimeline';
import { MessagesPanel } from '@/components/MessagesPanel';
import { DocumentsList } from '@/components/DocumentsList';
import { ReportSection } from '@/components/ReportSection';
import { Button } from '@/components/ui';
import { Loader2, Wifi, WifiOff, Upload, ArrowLeft } from 'lucide-react';

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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              {isConnected ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Wifi className="w-4 h-4" />
                  <span className="hidden sm:inline">Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-600">
                  <WifiOff className="w-4 h-4" />
                  <span className="hidden sm:inline">Offline</span>
                </div>
              )}
              <span className="text-muted-foreground">
                {data.connectionCount} viewer{data.connectionCount !== 1 ? 's' : ''}
              </span>
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="space-y-8">
        <SessionHeader session={data.session} hypothesis={data.hypothesis} votes={data.votes} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <HypothesisPanel hypothesis={data.hypothesis} session={data.session} />
            <MessagesPanel messages={data.messages} agents={data.agents} />
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
            <DecisionModule votes={data.votes} />
            <AgentsPanel agents={data.agents} />
            <ActivityTimeline events={data.ledger} />
            <DocumentsList documents={data.documents} sessionId={sessionId || ''} />
          </div>
        </div>
      </div>
    </main>
  );
}
