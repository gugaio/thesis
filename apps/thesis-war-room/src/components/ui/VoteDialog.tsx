import * as Dialog from '@radix-ui/react-dialog';
import type { Vote } from '@/types';
import { formatRelativeTime, getVerdictColor } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

interface VoteDialogProps {
  vote: Vote | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VoteDialog({ vote, isOpen, onClose }: VoteDialogProps) {
  if (!vote) return null;

  const getVerdictIcon = () => {
    switch (vote.verdict) {
      case 'approve':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'reject':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'abstain':
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-card border rounded-lg shadow-xl p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </Dialog.Close>
          
          <Dialog.Title className="text-xl font-bold mb-4 flex items-center gap-2">
            {getVerdictIcon()}
            <span>Vote Details</span>
          </Dialog.Title>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVerdictColor(vote.verdict)}`}>
                {vote.verdict.toUpperCase()}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatRelativeTime(vote.votedAt)}
              </span>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Agent</p>
              <p className="text-base font-semibold">{vote.agentId}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Rationale</p>
              <div className="bg-muted/50 rounded-md p-4 max-h-[300px] overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {vote.rationale}
                </p>
              </div>
            </div>
          </div>

          <Dialog.Close asChild>
            <button className="mt-6 w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-colors">
              Close
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
