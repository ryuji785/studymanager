import React from 'react';
import { Check, Clock, X } from 'lucide-react';

import { CATEGORY_COLORS, ScheduleBlock as ScheduleBlockType } from '../types';

interface ScheduleBlockProps {
  block: ScheduleBlockType;
  height: number;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function ScheduleBlock({ block, height, onClick }: ScheduleBlockProps) {
  const formatTime = (t: number) => {
    const normalized = t >= 1440 ? t - 1440 : t;
    const h = Math.floor(normalized / 60) % 24;
    const m = normalized % 60;
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  const startLabel = formatTime(block.startTime);
  const endLabel = formatTime(block.startTime + block.duration);
  const showTimeRange = height >= 48;

  const statusIcon = {
    completed: <Check className="w-3 h-3" />,
    incomplete: <X className="w-3 h-3" />,
    planned: null,
  };

  const statusColor = {
    completed: 'bg-green-500 text-white',
    incomplete: 'bg-red-500 text-white',
    planned: 'bg-gray-400 text-white',
  };

  const statusLabel =
    block.status === 'completed'
      ? '\u5b8c\u4e86'
      : block.status === 'incomplete'
        ? '\u672a\u5b8c'
        : '\u4e88\u5b9a';
  const showStatusText = height >= 36;

  const timeDiff = block.actualDuration ? block.actualDuration - block.duration : 0;
  const timeDiffText = timeDiff !== 0 ? `${timeDiff > 0 ? '+' : ''}${timeDiff}\u5206` : '';

  const isLifeBlock = block.category === 'sleep' || block.category === 'school';

  return (
    <div
      className={[
        'absolute w-full rounded border cursor-pointer hover:shadow-md transition-shadow overflow-hidden',
        CATEGORY_COLORS[block.category],
        isLifeBlock ? 'opacity-80' : '',
      ].join(' ')}
      style={{ height: `${height}px` }}
      onClick={onClick}
      title={`${startLabel}-${endLabel} ${block.label}`}
    >
      <div className="p-1.5 h-full flex flex-col text-xs">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="truncate flex-1">{block.label}</span>
          <span className="flex items-center gap-1 flex-shrink-0">
            {showStatusText && <span className="text-[10px] text-gray-600">{statusLabel}</span>}
            <span
              className={`flex items-center justify-center w-4 h-4 rounded-full ${statusColor[block.status]}`}
              aria-label={statusLabel}
              title={statusLabel}
            >
              {statusIcon[block.status]}
            </span>
          </span>
        </div>

        {showTimeRange && <div className="text-[10px] opacity-70">{startLabel}–{endLabel}</div>}

        {timeDiffText && (
          <div className="flex items-center gap-1 text-[10px] opacity-70 mt-auto">
            <Clock className="w-2.5 h-2.5" />
            <span>{timeDiffText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
