'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useWebSocket } from '@/hooks/useWebSocket';
import { BentoCard, BentoGrid } from '@/components/bento';
import { SocialTimelineFeed } from '@/components/social';
import { AgentIdentityCard } from '@/components/agents';
import { VotesPanel } from '@/components/VotesPanel';
import { MessagesPanel } from '@/components/MessagesPanel';
import { ReportSection } from '@/components/ReportSection';
import { DocumentsList } from '@/components/DocumentsList';
import { Button } from '@/components/ui';
import { Loader2, Wifi, WifiOff, Upload, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

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
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span
                className={cn('px-3 py-1 rounded-full text-xs font-semibold', getStatusColor(data.session.status))}
              >
                {data.session.status.toUpperCase()}
              </span>
              {data.session.finalVerdict && (
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1',
                    data.session.finalVerdict === 'approve'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  )}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {data.session.finalVerdict.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              {isConnected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="w-4 h-4" />
                  <span className="hidden sm:inline">Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-600">
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
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </motion.div>

      <BentoGrid>
        <BentoCard colSpan="2" className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Hypothesis</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Statement</p>
              <p className="text-base font-medium">{data.hypothesis.statement}</p>
            </div>
            {data.hypothesis.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{data.hypothesis.description}</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <p className="text-sm font-medium">{formatDate(data.session.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <p className="text-sm font-medium capitalize">{data.session.status}</p>
              </div>
              {data.session.closedAt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Closed</p>
                  <p className="text-sm font-medium">{formatDate(data.session.closedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </BentoCard>

        <BentoCard colSpan="2" className="mb-6">
          <VotesPanel votes={data.votes} />
        </BentoCard>

        <BentoCard colSpan="3" className="mb-6">
          <SocialTimelineFeed events={data.ledger} />
        </BentoCard>

        <BentoCard colSpan="1" className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Agents</h3>
          <div className="space-y-3">
            {data.agents.map((agent) => (
              <AgentIdentityCard key={agent.id} agent={agent} />
            ))}
          </div>
        </BentoCard>

        <BentoCard colSpan="2" className="mb-6">
          <MessagesPanel messages={data.messages} agents={data.agents} />
        </BentoCard>

        <BentoCard colSpan="2" className="mb-6">
          <DocumentsList documents={data.documents} sessionId={sessionId || ''} />
        </BentoCard>

        <BentoCard colSpan="4" className="mb-6">
          <ReportSection
            session={data.session}
            hypothesis={data.hypothesis}
            documents={data.documents}
            agents={data.agents}
            opinions={data.opinions}
            votes={data.votes}
          />
        </BentoCard>
      </BentoGrid>
    </main>
  );
}
