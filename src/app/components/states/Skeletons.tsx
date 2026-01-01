import React from 'react';
import { Skeleton } from '../ui/skeleton';

const TIME_TABLE_GRID_COLS = 'grid-cols-[88px_repeat(7,minmax(0,1fr))]';

export function StudentListSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30 p-[var(--app-page-padding)]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-11 w-40" />
          </div>
        </div>

        <div className="mb-6 max-w-md">
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-40 mb-4" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WeeklyPlanSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-6 w-px" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-7 w-20" />
          </div>
          <Skeleton className="h-12 w-full" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-72" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-[var(--app-section-gap)] p-[var(--app-page-padding)]">
        <aside className="col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <Skeleton className="h-4 w-20" />
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-7 w-full" />
            ))}
          </div>
        </aside>

        <main className="col-span-7 space-y-[var(--app-section-gap)]">
          <div className="bg-white border border-gray-200 rounded-lg p-[var(--app-card-padding)]">
            <div className="flex items-center justify-between border-b border-gray-300 pb-2 mb-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-10 w-full" />
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-[var(--app-card-padding)]">
            <div className="border-b border-gray-300 pb-2 mb-4">
              <Skeleton className="h-6 w-40" />
            </div>
            <TimeTableSkeleton />
          </div>
        </main>

        <aside className="col-span-3 space-y-[var(--app-section-gap)]">
          <div className="bg-white border border-gray-200 rounded-lg p-[var(--app-card-padding)]">
            <div className="flex items-center justify-between border-b border-gray-300 pb-2 mb-4">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className="h-9 w-full" />
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-[var(--app-card-padding)]">
            <div className="flex items-center justify-between border-b border-gray-300 pb-2 mb-4">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-20 w-full" />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function TimeTableSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className={`grid ${TIME_TABLE_GRID_COLS} border-b border-gray-300 bg-gray-50`}>
        <div className="border-r border-gray-300 p-2">
          <Skeleton className="h-4 w-10 mx-auto" />
        </div>
        {Array.from({ length: 7 }).map((_, idx) => (
          <div
            key={idx}
            className={`p-2 ${idx < 6 ? 'border-r border-gray-200' : ''}`}
          >
            <Skeleton className="h-4 w-6 mx-auto" />
          </div>
        ))}
      </div>
      <div className={`grid ${TIME_TABLE_GRID_COLS}`}>
        <div className="border-r border-gray-300 bg-gray-50">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="border-b border-gray-200 p-2">
              <Skeleton className="h-3 w-10 mx-auto" />
            </div>
          ))}
        </div>
        {Array.from({ length: 7 }).map((_, dayIdx) => (
          <div
            key={dayIdx}
            className={`border-gray-200 ${dayIdx < 6 ? 'border-r' : ''}`}
          >
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="border-b border-dashed border-gray-100 p-2">
                <Skeleton className="h-3 w-20 mx-auto opacity-50" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 md:px-6 py-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-6 w-px" />
              <Skeleton className="h-6 w-28" />
            </div>
            <Skeleton className="h-7 w-20" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
      </header>

      <main className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-64 w-full" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
