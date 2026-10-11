import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'xl',
}) => {
  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  }[rounded];

  const style: React.CSSProperties = {
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      style={style}
      className={`relative overflow-hidden bg-slate-200/80 dark:bg-slate-800/80 animate-pulse ${roundedClass} ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-slate-700/40 to-transparent animate-[shimmer_1.8s_infinite]" />
    </div>
  );
};

// Stat Card Skeleton Loader (KPI Boxes)
export const StatCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton width="40%" height={16} rounded="md" />
            <Skeleton width={40} height={40} rounded="xl" />
          </div>
          <Skeleton width="60%" height={32} rounded="lg" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton width="30%" height={12} rounded="md" />
            <Skeleton width="40%" height={12} rounded="md" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Table View Skeleton Loader
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Table Header Skeleton */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="flex-1" height={16} rounded="md" />
        ))}
      </div>

      {/* Table Rows Skeleton */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton width={36} height={36} rounded="xl" />
              <div className="space-y-1.5 flex-1">
                <Skeleton width="70%" height={14} rounded="md" />
                <Skeleton width="40%" height={12} rounded="md" />
              </div>
            </div>
            <Skeleton className="flex-1 hidden sm:block" height={14} rounded="md" />
            <Skeleton className="flex-1 hidden md:block" height={14} rounded="md" />
            <Skeleton width={80} height={24} rounded="full" />
            <Skeleton width={70} height={32} rounded="xl" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Grid Cards Skeleton Loader (Scrap Categories, Services, Tasks)
export const CardGridSkeleton: React.FC<{ count?: number; cols?: string }> = ({
  count = 6,
  cols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}) => {
  return (
    <div className={`grid ${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <Skeleton width="50%" height={20} rounded="lg" />
            <Skeleton width={60} height={20} rounded="full" />
          </div>
          <Skeleton width="100%" height={14} rounded="md" />
          <Skeleton width="80%" height={14} rounded="md" />
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <Skeleton width="35%" height={18} rounded="md" />
            <Skeleton width={90} height={32} rounded="xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Chart Skeleton Loader
export const ChartSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width={180} height={20} rounded="lg" />
          <Skeleton width={240} height={14} rounded="md" />
        </div>
        <Skeleton width={120} height={36} rounded="xl" />
      </div>
      <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-l border-slate-200 dark:border-slate-800 px-4">
        {Array.from({ length: 8 }).map((_, i) => {
          const heights = [40, 70, 55, 90, 65, 80, 45, 100];
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton
                width="80%"
                height={`${heights[i]}%`}
                rounded="lg"
                className="bg-emerald-200/60 dark:bg-emerald-950/40"
              />
              <Skeleton width="60%" height={12} rounded="sm" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Full Dashboard View Skeleton Loader
export const DashboardSkeleton: React.FC<{ title?: string }> = ({ title = 'Loading Dashboard' }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Header Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="space-y-2">
          <Skeleton width={200} height={24} rounded="lg" />
          <Skeleton width={280} height={14} rounded="md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton width={100} height={36} rounded="xl" />
          <Skeleton width={120} height={36} rounded="xl" />
        </div>
      </div>

      {/* KPI Stat Cards */}
      <StatCardSkeleton count={4} />

      {/* Main Content Area: Chart + Recent Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ChartSkeleton />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <Skeleton width={140} height={18} rounded="lg" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <Skeleton width={36} height={36} rounded="xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton width="80%" height={14} rounded="md" />
                  <Skeleton width="50%" height={12} rounded="md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Table Skeleton */}
      <TableSkeleton rows={4} columns={5} />
    </div>
  );
};
