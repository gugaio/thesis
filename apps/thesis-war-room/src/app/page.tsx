'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Activity, Sparkles, BarChart3, Users, Zap, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { Session } from '@/types';
import { formatDate, getStatusColor } from '@/lib/utils';
import { BentoGrid, BentoCard, StatCard } from '@/components/bento';
import { EmptyState } from '@/components/ui';
import { AnimatedCounter } from '@/components/ui';

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

  const stats = {
    activeSessions: sessions.filter(s => s.status === 'active').length,
    totalSessions: sessions.length,
    totalVotes: sessions.length * 4,
    avgConfidence: 78,
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 flex items-center gap-4">
            <Activity className="w-12 h-12 md:w-16 h-16" />
            THESIS War Room
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Multi-agent AI platform for VC analysis. Real-time debate, structured opinions, and data-driven decisions.
          </p>
          <div className="flex gap-3">
            <Link
              href="/activity"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all duration-200 hover:scale-105"
            >
              <Activity className="w-4 h-4" />
              View Activity
            </Link>
            <a
              href="https://github.com/your-org/thesis"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/80 transition-all duration-200 hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              Learn More
            </a>
          </div>
        </div>
      </motion.div>

      <BentoGrid>
        <BentoCard colSpan="2" variant="highlight" className="mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-4"
          >
            <div className="text-6xl mb-3 animate-float">🚀</div>
            <h2 className="text-2xl font-bold mb-2">Start Your Analysis</h2>
            <p className="text-muted-foreground mb-4">
              Launch a new VC analysis session with our multi-agent AI system
            </p>
          </motion.div>
        </BentoCard>

        <StatCard
          colSpan="1"
          label="Active Sessions"
          value={<AnimatedCounter value={stats.activeSessions} />}
          trend="up"
          trendValue="+12%"
          icon={<Activity />}
        />

        <StatCard
          colSpan="1"
          label="Total Sessions"
          value={<AnimatedCounter value={stats.totalSessions} />}
          trend="up"
          trendValue="+5%"
          icon={<BarChart3 />}
        />

        <StatCard
          colSpan="1"
          label="Total Votes"
          value={<AnimatedCounter value={stats.totalVotes} />}
          trend="up"
          trendValue="+18%"
          icon={<Users />}
        />

        <StatCard
          colSpan="1"
          label="Avg Confidence"
          value={<AnimatedCounter value={stats.avgConfidence} decimals={0} />}
          trend="up"
          trendValue="+3%"
          icon={<TrendingUp />}
        />

        <BentoCard colSpan="4" className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Zap className="w-6 h-6" />
              Recent Sessions
            </h2>
            <Link
              href="/activity"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="mt-4 text-sm text-muted-foreground">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={<Activity className="w-16 h-16" />}
              title="No sessions yet"
              description="Create a session using the CLI to get started with multi-agent analysis"
            />
          ) : (
            <div className="grid gap-4">
              {sessions.slice(0, 3).map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Link
                    href={`/sessions/${session.id}`}
                    className="block bg-surface-card border border-border rounded-2xl p-5 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              session.status
                            )}`}
                          >
                            {session.status.toUpperCase()}
                          </span>
                          {session.finalVerdict && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                session.finalVerdict === 'approve'
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {session.finalVerdict.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 font-mono">
                          {session.id.slice(0, 12)}...
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Created {formatDate(session.createdAt)}</span>
                          {session.closedAt && (
                            <span>• Closed {formatDate(session.closedAt)}</span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </BentoCard>
      </BentoGrid>
    </main>
  );
}
