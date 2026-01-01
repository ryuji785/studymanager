import React from 'react';
import { BookOpen, Clock } from 'lucide-react';

type ScheduleItem = {
  id: string;
  start: string;
  end: string;
  title: string;
  category: string;
  minutes: number;
  status: 'done' | 'current' | 'upcoming';
};

const scheduleData: ScheduleItem[] = [
  {
    id: 's1',
    start: '07:30',
    end: '08:00',
    title: '英語：単語復習（ターゲット）',
    category: '英語',
    minutes: 30,
    status: 'done',
  },
  {
    id: 's2',
    start: '08:00',
    end: '09:00',
    title: '数学：二次関数 演習（問題集A）',
    category: '数学',
    minutes: 60,
    status: 'current',
  },
  {
    id: 's3',
    start: '12:30',
    end: '13:00',
    title: '国語：現代文（要約トレ）',
    category: '国語',
    minutes: 30,
    status: 'upcoming',
  },
  {
    id: 's4',
    start: '18:30',
    end: '19:30',
    title: '理科：化学基礎（苦手単元）',
    category: '理科',
    minutes: 60,
    status: 'upcoming',
  },
  {
    id: 's5',
    start: '21:00',
    end: '21:30',
    title: '振り返り：今日の学習ログ入力',
    category: '振り返り',
    minutes: 30,
    status: 'upcoming',
  },
];

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function ScheduleStrip({
  items = scheduleData,
  onMarkDone,
}: {
  items?: ScheduleItem[];
  onMarkDone?: (id: string) => void;
}) {
  const today = new Date();
  const dateLabel = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
  const dayLabel = WEEKDAYS[today.getDay()];
  const hasItems = items.length > 0;

  return (
    <div
      className="relative flex items-center gap-4 rounded-lg border border-border/30 bg-foreground text-background px-3 py-3 overflow-hidden"
    >
      <div className="flex items-center gap-3 pr-4 border-r border-border/30">
        <div className="flex flex-col leading-none">
          <span className="text-[10px] tracking-widest text-background/60">今日</span>
          <span className="text-lg font-semibold text-background">{dateLabel}</span>
        </div>
        <div className="text-sm font-medium text-background/70">{dayLabel}</div>
      </div>

      <div className="relative flex-1 min-w-0">
        <div className="schedule-strip-scroll flex gap-3 overflow-x-auto pb-2">
          {hasItems ? (
            items.map((item) => {
              const isCurrent = item.status === 'current';
              const isDone = item.status === 'done';

              const baseCard =
                'w-52 shrink-0 rounded-lg border px-3 py-2 transition';
              const doneStyles =
                'border-border/30 bg-background/5 text-background/60';
              const currentStyles =
                'border-primary/60 bg-primary/20 text-background shadow-sm';
              const upcomingStyles =
                'border-border/30 bg-background/10 text-background/80 hover:-translate-y-0.5 hover:shadow-sm';

              return (
                <div
                  key={item.id}
                  className={[
                    baseCard,
                    isCurrent ? currentStyles : isDone ? doneStyles : upcomingStyles,
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2 text-[11px] text-background/60">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-mono">
                      {item.start}-{item.end}
                    </span>
                    <span className="ml-auto text-[10px]">
                      {item.minutes}分
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 opacity-70" />
                    <span className="truncate text-sm font-medium">
                      {item.title}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-background/50">
                    <span className="rounded-full border border-border/30 px-2 py-0.5">
                      {item.category}
                    </span>
                    {isCurrent ? (
                      <span className="ml-auto inline-flex items-center gap-1 text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                        進行中
                      </span>
                    ) : null}
                  </div>
                  {onMarkDone && item.status !== 'done' ? (
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        className="rounded-full border border-border/30 px-2.5 py-0.5 text-[10px] text-background/70 hover:bg-background/10"
                        onClick={() => onMarkDone(item.id)}
                      >
                        完了にする
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="flex w-60 shrink-0 flex-col justify-center rounded-lg border border-dashed border-border/40 bg-background/5 px-3 py-2 text-xs text-background/70">
              <span className="font-semibold">今日の予定はまだありません</span>
              <span className="text-[10px] text-background/50">タイムテーブルから追加できます</span>
            </div>
          )}

        </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-foreground to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-foreground to-transparent" />
    </div>

    <style>{`
      .schedule-strip-scroll {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        scrollbar-gutter: stable;
      }
      .schedule-strip-scroll::-webkit-scrollbar {
        height: 8px;
      }
      .schedule-strip-scroll::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.35);
        border-radius: 9999px;
      }
      .schedule-strip-scroll::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.08);
      }
    `}</style>

    </div>
  );
}
