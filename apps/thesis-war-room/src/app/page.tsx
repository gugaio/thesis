'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import type { Session } from '@/types';
import { formatDate, getStatusColor } from '@/lib/utils';
import { ArrowRight, Activity } from 'lucide-react';

export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    try {
      const data = await apiClient.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Activity className="w-8 h-8" />
          THESIS War Room
        </h1>
        <p className="text-muted-foreground">
          Real-time dashboard for VC analysis sessions
        </p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-sm text-muted-foreground">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-card">
            <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No sessions yet</h2>
            <p className="text-sm text-muted-foreground">
              Create a session using the CLI to get started
            </p>
          </div>
        ) : (
          sessions.map((session) => (
            <a
              key={session.id}
              href={`/sessions/${session.id}`}
              className="block border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        session.status
                      )}`}
                    >
                      {session.status.toUpperCase()}
                    </span>
                    {session.finalVerdict && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.finalVerdict === 'approve'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {session.finalVerdict.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Session ID: {session.id.slice(0, 8)}...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created: {formatDate(session.createdAt)}
                  </p>
                  {session.closedAt && (
                    <p className="text-xs text-muted-foreground">
                      Closed: {formatDate(session.closedAt)}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </a>
          ))
        )}
      </div>
    </main>
  );
}
