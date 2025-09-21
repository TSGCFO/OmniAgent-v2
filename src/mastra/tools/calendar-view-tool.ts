import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const createCalendarViewTool = () => createTool({
  id: 'view-calendar',
  description: 'View calendar events, check availability, and find free time slots',
  inputSchema: z.object({
    viewType: z.enum(['agenda', 'day', 'week', 'month', 'availability'])
      .describe('Type of calendar view'),
    dateRange: z.object({
      start: z.string()
        .describe('Start date/time in ISO format'),
      end: z.string()
        .describe('End date/time in ISO format'),
    }),
    filters: z.object({
      calendars: z.array(z.string()).optional()
        .describe('Specific calendars to include'),
      eventTypes: z.array(z.string()).optional()
        .describe('Types of events to show'),
      attendees: z.array(z.string()).optional()
        .describe('Filter by specific attendees'),
      showDeclined: z.boolean().default(false)
        .describe('Include declined events'),
      showTentative: z.boolean().default(true)
        .describe('Include tentative events'),
    }).optional(),
    options: z.object({
      includeDetails: z.boolean().default(true)
        .describe('Include full event details'),
      groupByDay: z.boolean().default(false)
        .describe('Group events by day'),
      timezone: z.string().optional()
        .describe('Timezone for display (defaults to user timezone)'),
    }).optional(),
  }),
  outputSchema: z.object({
    events: z.array(z.object({
      id: z.string(),
      title: z.string(),
      start: z.string(),
      end: z.string(),
      allDay: z.boolean(),
      location: z.string().optional(),
      description: z.string().optional(),
      attendees: z.array(z.object({
        name: z.string().optional(),
        email: z.string(),
        status: z.enum(['accepted', 'declined', 'tentative', 'needsAction']),
        organizer: z.boolean(),
      })).optional(),
      status: z.enum(['confirmed', 'tentative', 'cancelled']),
      visibility: z.enum(['public', 'private', 'confidential']),
      reminders: z.array(z.number()).optional(),
      recurrence: z.string().optional(),
      conferencing: z.object({
        type: z.string(),
        url: z.string(),
        phone: z.string().optional(),
      }).optional(),
    })),
    freeSlots: z.array(z.object({
      start: z.string(),
      end: z.string(),
      duration: z.number(),
    })).optional(),
    summary: z.object({
      totalEvents: z.number(),
      totalHours: z.number(),
      busyPercentage: z.number(),
    }),
  }),
  execute: async ({ context }) => {
    const { viewType, dateRange, filters, options } = context;
    
    // TODO: Integrate with actual calendar service (Google Calendar, Outlook, etc.)
    // This is a placeholder implementation
    
    console.log(`Viewing calendar (${viewType}):`, { dateRange, filters, options });
    
    // Simulate calendar events
    const mockEvents = [
      {
        id: 'evt-1',
        title: 'Team Standup',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 30 * 60000).toISOString(),
        allDay: false,
        location: 'Zoom',
        description: 'Daily team sync',
        attendees: [
          { email: 'team@example.com', status: 'accepted' as const, organizer: false },
          { email: 'you@example.com', status: 'accepted' as const, organizer: true },
        ],
        status: 'confirmed' as const,
        visibility: 'public' as const,
        reminders: [10],
        conferencing: {
          type: 'zoom',
          url: 'https://zoom.us/j/123456789',
        },
      },
      {
        id: 'evt-2',
        title: 'Client Meeting',
        start: new Date(Date.now() + 2 * 3600000).toISOString(),
        end: new Date(Date.now() + 3 * 3600000).toISOString(),
        allDay: false,
        location: 'Conference Room A',
        description: 'Quarterly review with client',
        status: 'confirmed' as const,
        visibility: 'private' as const,
        reminders: [15, 60],
      },
    ];
    
    // Calculate free slots if requested
    let freeSlots = undefined;
    if (viewType === 'availability') {
      // Simple free slot calculation
      const busyTimes = mockEvents.map(e => ({ start: new Date(e.start), end: new Date(e.end) }));
      freeSlots = [
        {
          start: new Date(Date.now() + 3600000).toISOString(),
          end: new Date(Date.now() + 2 * 3600000).toISOString(),
          duration: 60,
        },
        {
          start: new Date(Date.now() + 4 * 3600000).toISOString(),
          end: new Date(Date.now() + 6 * 3600000).toISOString(),
          duration: 120,
        },
      ];
    }
    
    // Calculate summary statistics
    const totalHours = mockEvents.reduce((sum, event) => {
      const duration = (new Date(event.end).getTime() - new Date(event.start).getTime()) / 3600000;
      return sum + duration;
    }, 0);
    
    const dayHours = 8; // Assume 8-hour workday
    const busyPercentage = Math.round((totalHours / dayHours) * 100);
    
    return {
      events: mockEvents,
      freeSlots,
      summary: {
        totalEvents: mockEvents.length,
        totalHours: Math.round(totalHours * 10) / 10,
        busyPercentage,
      },
    };
  },
});
