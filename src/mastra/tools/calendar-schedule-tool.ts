import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const createCalendarScheduleTool = () => createTool({
  id: 'schedule-meeting',
  description: 'Schedule new meetings, appointments, and events on the calendar',
  inputSchema: z.object({
    event: z.object({
      title: z.string()
        .describe('Event title'),
      description: z.string().optional()
        .describe('Event description'),
      startTime: z.string()
        .describe('Start time in ISO format'),
      endTime: z.string()
        .describe('End time in ISO format'),
      allDay: z.boolean().default(false)
        .describe('Whether this is an all-day event'),
      location: z.string().optional()
        .describe('Physical location or meeting URL'),
      attendees: z.array(z.object({
        email: z.string(),
        name: z.string().optional(),
        required: z.boolean().default(true),
      })).optional()
        .describe('List of attendees'),
      reminders: z.array(z.object({
        method: z.enum(['email', 'popup', 'sms']).default('popup'),
        minutes: z.number().min(0).max(40320), // Max 4 weeks
      })).optional()
        .describe('Reminder settings'),
      recurrence: z.object({
        frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
        interval: z.number().min(1).default(1),
        count: z.number().optional(),
        until: z.string().optional(),
        byDay: z.array(z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'])).optional(),
      }).optional()
        .describe('Recurrence rules'),
      conferencing: z.object({
        type: z.enum(['zoom', 'teams', 'meet', 'custom']),
        createNew: z.boolean().default(true),
        customUrl: z.string().optional(),
      }).optional()
        .describe('Video conferencing settings'),
    }),
    options: z.object({
      calendar: z.string().optional()
        .describe('Specific calendar to use'),
      sendInvites: z.boolean().default(true)
        .describe('Send invitations to attendees'),
      checkConflicts: z.boolean().default(true)
        .describe('Check for scheduling conflicts'),
      bufferTime: z.object({
        before: z.number().min(0).default(0),
        after: z.number().min(0).default(0),
      }).optional()
        .describe('Buffer time in minutes before/after event'),
      visibility: z.enum(['public', 'private', 'confidential']).default('public'),
    }).optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    eventId: z.string().optional(),
    conflicts: z.array(z.object({
      title: z.string(),
      start: z.string(),
      end: z.string(),
      type: z.enum(['overlap', 'back-to-back', 'buffer-violation']),
    })).optional(),
    conferencing: z.object({
      url: z.string(),
      phone: z.string().optional(),
      accessCode: z.string().optional(),
    }).optional(),
    invitesSent: z.number().optional(),
    htmlLink: z.string().optional()
      .describe('Link to view event in calendar app'),
    warnings: z.array(z.string()).optional(),
  }),
  execute: async ({ context }) => {
    const { event, options = {} } = context;
    
    // TODO: Integrate with actual calendar service
    // This is a placeholder implementation
    
    console.log('Scheduling event:', { event, options });
    
    // Validate times
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    
    if (endTime <= startTime) {
      return {
        success: false,
        warnings: ['End time must be after start time'],
      };
    }
    
    // Check for conflicts (simulated)
    const conflicts = [];
    if (options.checkConflicts) {
      // Simulate a potential conflict
      if (Math.random() > 0.7) {
        conflicts.push({
          title: 'Existing Meeting',
          start: event.startTime,
          end: event.endTime,
          type: 'overlap' as const,
        });
      }
    }
    
    if (conflicts.length > 0 && options.checkConflicts) {
      return {
        success: false,
        conflicts,
        warnings: ['Event conflicts with existing calendar items'],
      };
    }
    
    // Generate event ID
    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Handle conferencing
    let conferencing = undefined;
    if (event.conferencing?.createNew) {
      conferencing = {
        url: `https://${event.conferencing.type}.com/j/${Math.random().toString(36).substr(2, 9)}`,
        accessCode: Math.random().toString().substr(2, 6),
      };
    } else if (event.conferencing?.customUrl) {
      conferencing = {
        url: event.conferencing.customUrl,
      };
    }
    
    // Count invites
    const invitesSent = options.sendInvites ? (event.attendees?.length || 0) : 0;
    
    // Generate calendar link
    const htmlLink = `https://calendar.example.com/event/${eventId}`;
    
    // Success response
    return {
      success: true,
      eventId,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      conferencing,
      invitesSent,
      htmlLink,
      warnings: event.allDay && event.reminders 
        ? ['Reminders may not work correctly for all-day events'] 
        : undefined,
    };
  },
});
