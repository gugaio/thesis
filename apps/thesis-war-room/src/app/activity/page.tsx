'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Filter, TrendingUp } from 'lucide-react';
import { BentoGrid, BentoCard } from '@/components/bento';
import { SocialTimelineFeed } from '@/components/social';
import { AgentFilter, ActivityHeatmap } from '@/components/social';
import type { AgentFilterOption } from '@/components/social';
import { apiClient } from '@/lib/api';
import { EmptyState } from '@/components/ui';
import type { Event } from '@/types';

export default function ActivityPage() {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const agentFilterOptions: AgentFilterOption[] = [
    { id: 'debt', label: 'Debt Agent', icon: '💰', count: 12 },
    { id: 'tech', label: 'Tech Agent', icon: '⚡', count: 8 },
    { id: 'market', label: 'Market Agent', icon: '📊', count: 15 },
    { id: 'branding', label: 'Branding Agent', icon: '🎨', count: 6 },
  ];

  const activityTypeOptions: AgentFilterOption[] = [
    { id: 'opinion', label: 'Opinions', count: 24 },
    { id: 'message', label: 'Messages', count: 18 },
    { id: 'vote', label: 'Votes', count: 12 },
    { id: 'document', label: 'Documents', count: 8 },
  ];

  const heatmapData = [
    { date: '2024-02-10', count: 5 },
    { date: '2024-02-11', count: 8 },
    { date: '2024-02-12', count: 3 },
    { date: '2024-02-13', count: 12 },
    { date: '2024-02-14', count: 7 },
    { date: '2024-02-15', count: 15 },
    { date: '2024-02-16', count: 10 },
  ];

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      await apiClient.getSessions();
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const mockEvents: Event[] = [
    {
      id: '1',
      type: 'opinion.posted',
      sessionId: 'session-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      version: 1,
      agentName: 'Tech Agent',
      agentRole: 'tech',
      content: 'This startup has strong technical potential',
    },
    {
      id: '2',
      type: 'vote.cast',
      sessionId: 'session-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      version: 1,
      agentName: 'Debt Agent',
      agentRole: 'debt',
      verdict: 'approve',
    },
    {
      id: '3',
      type: 'message.sent',
      sessionId: 'session-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      version: 1,
      agentName: 'Market Agent',
      agentRole: 'market',
      content: 'Can you provide more details about the market analysis?',
    },
  ];

  return (
    <main className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Activity className="w-10 h-10" />
              Activity Feed
            </h1>
            <p className="text-muted-foreground text-lg">
              Real-time activity from all your analysis sessions
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Live updates</span>
          </div>
        </div>
      </motion.div>

      <BentoGrid>
        <BentoCard colSpan="4" className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Activity Overview
            </h2>
          </div>
          <ActivityHeatmap data={heatmapData} />
        </BentoCard>

        <BentoCard colSpan="2" className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Filter by Agent</h3>
          <AgentFilter
            options={agentFilterOptions}
            selected={selectedAgents}
            onChange={setSelectedAgents}
          />
        </BentoCard>

        <BentoCard colSpan="2" className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Filter by Type</h3>
          <AgentFilter
            options={activityTypeOptions}
            selected={selectedTypes}
            onChange={setSelectedTypes}
          />
        </BentoCard>

        <BentoCard colSpan="4">
          {loading ? (
            <div className="py-8">
              <p className="text-center text-muted-foreground">Loading activities...</p>
            </div>
          ) : mockEvents.length === 0 ? (
            <EmptyState
              icon={<Activity className="w-16 h-16" />}
              title="No activity yet"
              description="Start a session to see activities from your agents"
            />
          ) : (
            <SocialTimelineFeed events={mockEvents} />
          )}
        </BentoCard>
      </BentoGrid>
    </main>
  );
}
