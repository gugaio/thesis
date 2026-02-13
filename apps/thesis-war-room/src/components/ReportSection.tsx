import type { Session, Hypothesis, Document, Agent, Opinion, Vote } from '@/types';
import { FileText, Users, MessageSquare, Vote as VoteIcon, Download } from 'lucide-react';

interface ReportSectionProps {
  session: Session;
  hypothesis: Hypothesis;
  documents: Document[];
  agents: Agent[];
  opinions: Opinion[];
  votes: Vote[];
}

export function ReportSection({
  session,
  hypothesis,
  documents,
  agents,
  opinions,
  votes,
}: ReportSectionProps) {
  const voteCounts = votes.reduce(
    (acc, vote) => {
      acc[vote.verdict] = (acc[vote.verdict] || 0) + 1;
      return acc;
    },
    { approve: 0, reject: 0, abstain: 0 }
  );

  const totalVotes = votes.length;
  const approvePercentage = totalVotes > 0 ? ((voteCounts.approve / totalVotes) * 100).toFixed(1) : 0;
  const rejectPercentage = totalVotes > 0 ? ((voteCounts.reject / totalVotes) * 100).toFixed(1) : 0;
  const abstainPercentage = totalVotes > 0 ? ((voteCounts.abstain / totalVotes) * 100).toFixed(1) : 0;

  const handleDownloadReport = () => {
    const report = {
      session: {
        id: session.id,
        status: session.status,
        finalVerdict: session.finalVerdict,
        closedAt: session.closedAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      hypothesis,
      documents,
      agents: agents.map((agent) => ({
        id: agent.id,
        profile: agent.profile,
        joinedAt: agent.joinedAt,
        isActive: agent.isActive,
        budget: agent.budget,
      })),
      opinions,
      votes,
      voteCounts,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${session.id}-report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Session Report</h3>
        <button
          onClick={handleDownloadReport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border hover:bg-accent transition-colors"
        >
          <Download className="w-4 h-4" />
          Download JSON
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="border rounded-lg p-3 bg-card text-center">
          <FileText className="w-5 h-5 mx-auto mb-1 text-blue-600" />
          <p className="text-2xl font-bold">{documents.length}</p>
          <p className="text-xs text-muted-foreground">Documents</p>
        </div>
        <div className="border rounded-lg p-3 bg-card text-center">
          <Users className="w-5 h-5 mx-auto mb-1 text-purple-600" />
          <p className="text-2xl font-bold">{agents.length}</p>
          <p className="text-xs text-muted-foreground">Agents</p>
        </div>
        <div className="border rounded-lg p-3 bg-card text-center">
          <MessageSquare className="w-5 h-5 mx-auto mb-1 text-orange-600" />
          <p className="text-2xl font-bold">{opinions.length}</p>
          <p className="text-xs text-muted-foreground">Opinions</p>
        </div>
        <div className="border rounded-lg p-3 bg-card text-center">
          <VoteIcon className="w-5 h-5 mx-auto mb-1 text-pink-600" />
          <p className="text-2xl font-bold">{votes.length}</p>
          <p className="text-xs text-muted-foreground">Votes</p>
        </div>
      </div>

      {votes.length > 0 && (
        <div className="border rounded-lg p-4 bg-card">
          <h4 className="font-medium mb-3">Vote Distribution</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-20">Approve</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${approvePercentage}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-12 text-right">
                {voteCounts.approve} ({approvePercentage}%)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-20">Reject</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${rejectPercentage}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-12 text-right">
                {voteCounts.reject} ({rejectPercentage}%)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-20">Abstain</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-500 transition-all"
                  style={{ width: `${abstainPercentage}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-12 text-right">
                {voteCounts.abstain} ({abstainPercentage}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {session.finalVerdict && (
        <div className="border rounded-lg p-4 bg-card">
          <h4 className="font-medium mb-2">Final Verdict</h4>
          <p
            className={`text-lg font-bold ${
              session.finalVerdict === 'approve' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {session.finalVerdict.toUpperCase()}
          </p>
        </div>
      )}
    </div>
  );
}
