import type { Session, Hypothesis } from '@/types';
import { formatDate, getStatusColor } from '@/lib/utils';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

interface SessionHeaderProps {
  session: Session;
  hypothesis: Hypothesis;
}

export function SessionHeader({ session, hypothesis }: SessionHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">THESIS War Room</h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                session.status
              )}`}
            >
              {session.status.toUpperCase()}
            </span>
            {session.finalVerdict && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  session.finalVerdict === 'approve'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {session.finalVerdict === 'approve' ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    APPROVED
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    REJECTED
                  </span>
                )}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Session ID: {session.id}
          </p>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-card">
        <h2 className="text-lg font-semibold mb-2">Hypothesis</h2>
        <p className="text-sm text-muted-foreground mb-1">Statement:</p>
        <p className="text-base font-medium mb-3">{hypothesis.statement}</p>
        {hypothesis.description && (
          <>
            <p className="text-sm text-muted-foreground mb-1">Description:</p>
            <p className="text-sm">{hypothesis.description}</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-3 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Created At</p>
          <p className="text-sm font-medium">{formatDate(session.createdAt)}</p>
        </div>
        <div className="border rounded-lg p-3 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Status</p>
          <p className="text-sm font-medium capitalize">{session.status}</p>
        </div>
        {session.closedAt && (
          <div className="border rounded-lg p-3 bg-card">
            <p className="text-sm text-muted-foreground mb-1">Closed At</p>
            <p className="text-sm font-medium">{formatDate(session.closedAt)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
