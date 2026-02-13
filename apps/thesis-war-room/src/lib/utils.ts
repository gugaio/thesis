import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora mesmo';
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  return `${diffDays}d atrás`;
}

export function getVerdictColor(verdict: 'approve' | 'reject' | 'abstain'): string {
  switch (verdict) {
    case 'approve':
      return 'text-green-600 bg-green-50';
    case 'reject':
      return 'text-red-600 bg-red-50';
    case 'abstain':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'created':
      return 'text-blue-600 bg-blue-50';
    case 'active':
      return 'text-green-600 bg-green-50';
    case 'paused':
      return 'text-yellow-600 bg-yellow-50';
    case 'closed':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getProfileIcon(role: string): string {
  switch (role.toLowerCase()) {
    case 'debt':
      return '💰';
    case 'tech':
      return '⚡';
    case 'market':
      return '📊';
    case 'branding':
      return '🎨';
    default:
      return '🤖';
  }
}
