import { useState } from 'react';
import type { Vote } from '@/types';
import { formatRelativeTime, getVerdictColor } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { VoteDialog } from '@/components/ui/VoteDialog';

interface VotesPanelProps {
  votes: Vote[];
}

export function VotesPanel({ votes }: VotesPanelProps) {
  const [selectedVote, setSelectedVote] = useState<Vote | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleVoteClick = (vote: Vote) => {
    setSelectedVote(vote);
    setIsDialogOpen(true);
  };
  const voteCounts = votes.reduce(
    (acc, vote) => {
      acc[vote.verdict] = (acc[vote.verdict] || 0) + 1;
      return acc;
    },
    { approve: 0, reject: 0, abstain: 0 }
  );

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold mb-4">Votes</h3>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="border rounded-lg p-3 bg-card text-center">
          <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-bold text-lg">{voteCounts.approve}</span>
          </div>
          <p className="text-xs text-muted-foreground">Approve</p>
        </div>
        <div className="border rounded-lg p-3 bg-card text-center">
          <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
            <XCircle className="w-4 h-4" />
            <span className="font-bold text-lg">{voteCounts.reject}</span>
          </div>
          <p className="text-xs text-muted-foreground">Reject</p>
        </div>
        <div className="border rounded-lg p-3 bg-card text-center">
          <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="font-bold text-lg">{voteCounts.abstain}</span>
          </div>
          <p className="text-xs text-muted-foreground">Abstain</p>
        </div>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {votes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No votes yet
          </p>
        ) : (
          votes.map((vote) => (
            <div
              key={vote.id}
              onClick={() => handleVoteClick(vote)}
              className="border rounded-lg p-3 bg-card cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVerdictColor(vote.verdict)}`}>
                  {vote.verdict.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(vote.votedAt)}
                </span>
              </div>
              <p className="text-sm font-medium mb-1">Agent: {vote.agentId}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {vote.rationale}
              </p>
            </div>
          ))
        )}
      </div>
      <VoteDialog vote={selectedVote} isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </div>
  );
}
