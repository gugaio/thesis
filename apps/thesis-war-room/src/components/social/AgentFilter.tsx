'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Check, X } from 'lucide-react';

export interface AgentFilterOption {
  id: string;
  label: string;
  icon?: string;
  count?: number;
}

interface AgentFilterProps {
  options: AgentFilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export function AgentFilter({ options, selected, onChange, className }: AgentFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (optionId: string) => {
    if (selected.includes(optionId)) {
      onChange(selected.filter(id => id !== optionId));
    } else {
      onChange([...selected, optionId]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const getLabel = () => {
    if (selected.length === 0) return 'All Agents';
    if (selected.length === 1) {
      const option = options.find(o => o.id === selected[0]);
      return option?.label || '1 Agent';
    }
    return `${selected.length} Agents`;
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="secondary"
        size="md"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <span className="flex items-center gap-2">
          {getLabel()}
          {selected.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
              {selected.length}
            </span>
          )}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-20 top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
            >
              {selected.length > 0 && (
                <div className="p-3 border-b border-border">
                  <button
                    onClick={clearAll}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear all
                  </button>
                </div>
              )}

              <div className="max-h-64 overflow-y-auto">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => toggleOption(option.id)}
                    className={cn(
                      'w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors text-left',
                      selected.includes(option.id) && 'bg-accent'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {option.icon && <span className="text-xl">{option.icon}</span>}
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {option.count !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {option.count}
                        </span>
                      )}
                      {selected.includes(option.id) && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
