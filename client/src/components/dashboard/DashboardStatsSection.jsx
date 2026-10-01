import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  Calendar,
  Ticket,
  Users,
  Bell,
  RefreshCw,
  AlertCircle,
  BarChart2,
  PieChart,
  Share2
} from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';

/**
 * Custom clean tooltip conforming to Design.md (flat, light theme, IBM Plex Sans, no gradients)
 */
const CustomChartTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-app-border rounded px-3 py-2 text-xs shadow-sm font-sans">
        <p className="font-semibold text-app-text mb-0.5">{label || payload[0]?.payload?.title || payload[0]?.payload?.category}</p>
        <p className="text-app-primary font-medium">
          {payload[0].value} {unit || (payload[0].value === 1 ? 'item' : 'items')}
        </p>
      </div>
    );
  }
  return null;
};

/**
 * Chart card wrapper with header and optional empty state
 */
const ChartCard = ({ title, subtitle, icon: Icon, isEmpty, emptyText, children }) => (
  <div className="bg-white border border-app-border rounded-md p-4 flex flex-col justify-between h-[320px]">
    <div className="flex items-start justify-between gap-2 mb-3 pb-2 border-b border-app-border/60">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-app-text flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-app-primary" />}
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-app-text-muted mt-0.5 font-normal">
            {subtitle}
          </p>
        )}
      </div>
    </div>

    <div className="flex-1 w-full min-h-0 flex items-center justify-center">
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center text-center p-4 text-app-text-muted">
          <p className="text-xs font-medium text-app-text mb-1">No data yet</p>
          <p className="text-[11px] max-w-[200px] leading-relaxed">{emptyText}</p>
        </div>
      ) : (
        children
      )}
    </div>
  </div>
);

export const DashboardStatsSection = ({ stats, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="mb-8 space-y-6">
        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-app-border rounded-md p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-app-border rounded-md p-4 space-y-3 h-[320px]">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-56 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-md p-6 mb-8 text-center flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-3">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-app-text mb-1">
          Unable to Load Dashboard Analytics
        </h3>
        <p className="text-xs text-app-text-muted max-w-md mb-4">
          {error}
        </p>
        <Button onClick={onRetry} variant="secondary" size="sm" className="inline-flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  const { totals = {}, rsvpsByMonth = [], eventsByCategory = [], inviteReach = [] } = stats;

  const hasMonthlyData = rsvpsByMonth.some((item) => item.count > 0);
  const hasCategoryData = eventsByCategory.length > 0;
  const hasInviteData = inviteReach.some((item) => item.uniqueClicks > 0);

  // Format month labels from YYYY-MM to MMM YY (e.g. 2026-10 -> Oct 26)
  const formattedMonthlyData = rsvpsByMonth.map((item) => {
    try {
      const [year, month] = item.month.split('-');
      const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
      const label = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
      return {
        ...item,
        label: `${label} '${year.slice(-2)}`
      };
    } catch (_) {
      return { ...item, label: item.month };
    }
  });

  // Shorten inviteReach title for axis display
  const formattedInviteData = inviteReach.map((item) => ({
    ...item,
    shortTitle: item.title.length > 16 ? `${item.title.substring(0, 14)}...` : item.title
  }));

  return (
    <div className="mb-8 space-y-6">
      {/* 1. Stats Row (4 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total RSVPs */}
        <div className="bg-white border border-app-border rounded-md p-4 transition-colors hover:border-app-primary/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted">
              Total RSVPs
            </span>
            <div className="w-7 h-7 rounded bg-app-surface flex items-center justify-center text-app-primary">
              <Ticket className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-app-text font-sans">
            {totals.rsvps ?? 0}
          </p>
          <p className="text-[11px] text-app-text-muted mt-1">
            Confirmed event attendance
          </p>
        </div>

        {/* Upcoming */}
        <div className="bg-white border border-app-border rounded-md p-4 transition-colors hover:border-app-primary/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted">
              Upcoming
            </span>
            <div className="w-7 h-7 rounded bg-app-surface flex items-center justify-center text-app-primary">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-app-text font-sans">
            {totals.upcoming ?? 0}
          </p>
          <p className="text-[11px] text-app-text-muted mt-1">
            Scheduled in future
          </p>
        </div>

        {/* Friends Reached */}
        <div className="bg-white border border-app-border rounded-md p-4 transition-colors hover:border-app-primary/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted">
              Friends Reached
            </span>
            <div className="w-7 h-7 rounded bg-app-surface flex items-center justify-center text-app-primary">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-app-text font-sans">
            {totals.friendsReached ?? 0}
          </p>
          <p className="text-[11px] text-app-text-muted mt-1">
            Unique referral clicks
          </p>
        </div>

        {/* Reminders Set */}
        <div className="bg-white border border-app-border rounded-md p-4 transition-colors hover:border-app-primary/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted">
              Reminders Set
            </span>
            <div className="w-7 h-7 rounded bg-app-surface flex items-center justify-center text-app-primary">
              <Bell className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-app-text font-sans">
            {totals.remindersSet ?? 0}
          </p>
          <p className="text-[11px] text-app-text-muted mt-1">
            Active notifications
          </p>
        </div>
      </div>

      {/* 2. 3-Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1: RSVPs by Month */}
        <ChartCard
          title="RSVPs by Month"
          subtitle="Past 6 months velocity"
          icon={BarChart2}
          isEmpty={!hasMonthlyData}
          emptyText="No RSVP activity recorded in the last 6 months."
        >
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={formattedMonthlyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid stroke="#DDE2E9" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#5B6676"
                tick={{ fill: '#5B6676', fontSize: 11, fontFamily: 'IBM Plex Sans, sans-serif' }}
                tickLine={false}
                axisLine={{ stroke: '#DDE2E9' }}
              />
              <YAxis
                allowDecimals={false}
                stroke="#5B6676"
                tick={{ fill: '#5B6676', fontSize: 11, fontFamily: 'IBM Plex Sans, sans-serif' }}
                tickLine={false}
                axisLine={{ stroke: '#DDE2E9' }}
              />
              <Tooltip
                content={<CustomChartTooltip unit="RSVPs" />}
                cursor={{ fill: '#F5F7FA' }}
              />
              <Bar
                dataKey="count"
                fill="#1D4E89"
                maxBarSize={36}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 2: Events by Category (Horizontal Bar) */}
        <ChartCard
          title="Events by Category"
          subtitle="Breakdown by event classification"
          icon={PieChart}
          isEmpty={!hasCategoryData}
          emptyText="No categorized events found in active RSVPs."
        >
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              layout="vertical"
              data={eventsByCategory}
              margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
            >
              <CartesianGrid stroke="#DDE2E9" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                stroke="#5B6676"
                tick={{ fill: '#5B6676', fontSize: 11, fontFamily: 'IBM Plex Sans, sans-serif' }}
                tickLine={false}
                axisLine={{ stroke: '#DDE2E9' }}
              />
              <YAxis
                type="category"
                dataKey="category"
                width={85}
                stroke="#5B6676"
                tick={{ fill: '#5B6676', fontSize: 11, fontFamily: 'IBM Plex Sans, sans-serif' }}
                tickLine={false}
                axisLine={{ stroke: '#DDE2E9' }}
              />
              <Tooltip
                content={<CustomChartTooltip unit="events" />}
                cursor={{ fill: '#F5F7FA' }}
              />
              <Bar
                dataKey="count"
                fill="#8FA9C9"
                maxBarSize={20}
                radius={[0, 2, 2, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 3: Invite Reach (Top 5 Events) */}
        <ChartCard
          title="Invite Reach"
          subtitle="Top 5 shared events by unique clicks"
          icon={Share2}
          isEmpty={!hasInviteData}
          emptyText="No invite link clicks recorded yet. Share events to see referral reach."
        >
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={formattedInviteData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid stroke="#DDE2E9" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="shortTitle"
                stroke="#5B6676"
                tick={{ fill: '#5B6676', fontSize: 10, fontFamily: 'IBM Plex Sans, sans-serif' }}
                tickLine={false}
                axisLine={{ stroke: '#DDE2E9' }}
              />
              <YAxis
                allowDecimals={false}
                stroke="#5B6676"
                tick={{ fill: '#5B6676', fontSize: 11, fontFamily: 'IBM Plex Sans, sans-serif' }}
                tickLine={false}
                axisLine={{ stroke: '#DDE2E9' }}
              />
              <Tooltip
                content={<CustomChartTooltip unit="unique clicks" />}
                cursor={{ fill: '#F5F7FA' }}
              />
              <Bar
                dataKey="uniqueClicks"
                fill="#1D4E89"
                maxBarSize={36}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};
