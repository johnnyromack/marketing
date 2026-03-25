import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { PlatformIcon } from '../shared/PlatformIcon';
import type { ScheduledPost, PostStatus } from '@/lib/schemas/social-media.schema';

interface ContentCalendarProps {
  posts: ScheduledPost[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onPostClick?: (post: ScheduledPost) => void;
  onCreatePost?: (date: Date) => void;
  className?: string;
}

const STATUS_COLORS: Record<PostStatus, string> = {
  draft: 'bg-muted-foreground',
  pending_approval: 'bg-yellow-500',
  approved: 'bg-blue-500',
  scheduled: 'bg-primary',
  published: 'bg-green-600',
  failed: 'bg-red-600',
};

export function ContentCalendar({
  posts,
  selectedDate,
  onDateSelect,
  onPostClick,
  onCreatePost,
  className = '',
}: ContentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group posts by date
  const postsByDate = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();
    posts.forEach((post) => {
      const date = post.scheduled_for || post.created_at;
      if (date) {
        const key = format(new Date(date), 'yyyy-MM-dd');
        const existing = map.get(key) || [];
        map.set(key, [...existing, post]);
      }
    });
    return map;
  }, [posts]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentMonth(new Date());
    onDateSelect?.(new Date());
  }, [onDateSelect]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  return (
    <Card data-testid="content-calendar" className={className}>
      <CardContent className="p-4">
        {/* Header */}
        <div
          data-testid="calendar-header"
          className="mb-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" data-testid="calendar-icon" />
            <h2
              data-testid="current-month"
              className="font-semibold text-base text-foreground"
            >
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
          </div>

          <div data-testid="calendar-nav" className="flex items-center gap-1">
            <button
              data-testid="btn-today"
              onClick={handleToday}
              className="hover:bg-primary/10 rounded-md px-2 py-1 text-primary text-sm transition-colors"
            >
              Hoje
            </button>
            <button
              data-testid="btn-prev-month"
              onClick={handlePrevMonth}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              data-testid="btn-next-month"
              onClick={handleNextMonth}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Week days header */}
        <div data-testid="weekdays-header" className="mb-px grid grid-cols-7 gap-px">
          {weekDays.map((day) => (
            <div
              key={day}
              data-testid={`weekday-${day.toLowerCase()}`}
              className="py-2 text-center font-medium text-xs text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div
          data-testid="calendar-grid"
          className="grid grid-cols-7 gap-px overflow-hidden rounded-md bg-border"
        >
          {calendarDays.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayPosts = postsByDate.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isDayToday = isToday(day);

            return (
              <div
                key={index}
                data-testid={`calendar-day-${dateKey}`}
                onClick={() => onDateSelect?.(day)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDateSelect?.(day);
                  }
                }}
                role="button"
                tabIndex={0}
                className={`min-h-[100px] cursor-pointer bg-card p-2 transition-colors hover:bg-muted ${!isCurrentMonth ? 'opacity-40' : ''} ${isSelected ? 'ring-2 ring-inset ring-primary' : ''} `}
              >
                {/* Day number */}
                <div className="mb-1 flex items-center justify-between">
                  <span
                    data-testid={`day-number-${dateKey}`}
                    className={`flex h-6 w-6 items-center justify-center rounded-full font-medium text-sm ${isDayToday ? 'bg-primary text-white' : 'text-foreground'} `}
                  >
                    {format(day, 'd')}
                  </span>
                  {onCreatePost && isCurrentMonth && (
                    <button
                      data-testid={`btn-create-post-${dateKey}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreatePost(day);
                      }}
                      className="hover:bg-primary/10 rounded p-0.5 text-muted-foreground opacity-0 transition-all hover:text-primary hover:opacity-100 focus:opacity-100"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Posts */}
                <div data-testid={`day-posts-${dateKey}`} className="space-y-1">
                  {dayPosts.slice(0, 3).map((post) => (
                    <button
                      key={post.id}
                      data-testid={`calendar-post-${post.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPostClick?.(post);
                      }}
                      className={`flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[10px] ${STATUS_COLORS[post.status]} bg-opacity-20 transition-colors hover:bg-opacity-30`}
                    >
                      {post.platforms[0] && <PlatformIcon platform={post.platforms[0]} size="sm" />}
                      <span className="truncate text-foreground">
                        {post.content?.text?.slice(0, 20) || 'Sem conteúdo'}
                      </span>
                    </button>
                  ))}
                  {dayPosts.length > 3 && (
                    <span
                      data-testid={`day-more-${dateKey}`}
                      className="block pl-1.5 text-[10px] text-muted-foreground"
                    >
                      +{dayPosts.length - 3} mais
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div
          data-testid="calendar-legend"
          className="mt-4 flex flex-wrap gap-4 border-t border-border pt-2"
        >
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} data-testid={`legend-${status}`} className="flex items-center gap-1">
              <div className={`h-2 w-2 rounded-full ${color}`} data-testid={`legend-dot-${status}`} />
              <span
                data-testid={`legend-label-${status}`}
                className="capitalize text-xs text-muted-foreground"
              >
                {status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
