import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const createCalendarManageTool = () => createTool({
  id: 'manage-calendar',
  description: 'Update, cancel, or manage existing calendar events and settings',
  inputSchema: z.object({
    action: z.enum([
      'update',
      'cancel',
      'reschedule',
      'addAttendee',
      'removeAttendee',
      'updateAttendeeStatus',
      'changeReminders',
      'moveToCalendar',
    ]).describe('The management action to perform'),
    eventId: z.string()
      .describe('ID of the event to manage'),
    updates: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      location: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      attendees: z.array(z.object({
        email: z.string(),
        name: z.string().optional(),
        action: z.enum(['add', 'remove']).optional(),
      })).optional(),
      attendeeStatus: z.object({
        email: z.string(),
        status: z.enum(['accepted', 'declined', 'tentative']),
      }).optional(),
      reminders: z.array(z.object({
        method: z.enum(['email', 'popup', 'sms']),
        minutes: z.number().min(0).max(40320),
      })).optional(),
      targetCalendar: z.string().optional(),
      conferencing: z.object({
        add: z.boolean().optional(),
        remove: z.boolean().optional(),
        url: z.string().optional(),
      }).optional(),
    }).optional(),
    options: z.object({
      notifyAttendees: z.boolean().default(true)
        .describe('Send update notifications to attendees'),
      updateSeries: z.boolean().default(false)
        .describe('Update all events in a recurring series'),
      reason: z.string().optional()
        .describe('Reason for the change (included in notifications)'),
      proposedTime: z.object({
        start: z.string(),
        end: z.string(),
      }).optional()
        .describe('For reschedule requests, proposed new time'),
    }).optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    eventId: z.string(),
    action: z.string(),
    changes: z.record(z.any()).optional()
      .describe('Summary of changes made'),
    notifications: z.object({
      sent: z.number(),
      failed: z.number(),
      recipients: z.array(z.string()),
    }).optional(),
    warnings: z.array(z.string()).optional(),
    newEventId: z.string().optional()
      .describe('New event ID if event was moved or rescheduled'),
  }),
  execute: async ({ context }) => {
    const { action, eventId, updates = {}, options = {} } = context;
    
    // TODO: Integrate with actual calendar service
    // This is a placeholder implementation
    
    console.log(`Performing ${action} on event ${eventId}:`, { updates, options });
    
    // Track changes made
    const changes: Record<string, any> = {};
    const warnings: string[] = [];
    
    // Handle different actions
    switch (action) {
      case 'cancel':
        changes.status = 'cancelled';
        if (options.reason) {
          changes.cancellationReason = options.reason;
        }
        break;
        
      case 'reschedule':
        if (updates.startTime && updates.endTime) {
          changes.oldStart = 'previous-start-time';
          changes.oldEnd = 'previous-end-time';
          changes.newStart = updates.startTime;
          changes.newEnd = updates.endTime;
        } else if (options.proposedTime) {
          changes.proposedStart = options.proposedTime.start;
          changes.proposedEnd = options.proposedTime.end;
          warnings.push('Proposed time sent to organizer for approval');
        }
        break;
        
      case 'update':
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== undefined && key !== 'attendees') {
            changes[key] = value;
          }
        });
        break;
        
      case 'addAttendee':
      case 'removeAttendee':
        if (updates.attendees) {
          changes.attendeesModified = updates.attendees.length;
          changes.attendeeAction = action;
        }
        break;
        
      case 'updateAttendeeStatus':
        if (updates.attendeeStatus) {
          changes.attendeeEmail = updates.attendeeStatus.email;
          changes.newStatus = updates.attendeeStatus.status;
        }
        break;
        
      case 'changeReminders':
        if (updates.reminders) {
          changes.remindersCount = updates.reminders.length;
          changes.reminderTimes = updates.reminders.map(r => `${r.minutes} minutes`);
        }
        break;
        
      case 'moveToCalendar':
        if (updates.targetCalendar) {
          changes.fromCalendar = 'original-calendar';
          changes.toCalendar = updates.targetCalendar;
          // Generate new ID for moved event
          const newEventId = `evt-${Date.now()}-moved`;
          return {
            success: true,
            eventId,
            action,
            changes,
            newEventId,
            notifications: options.notifyAttendees ? {
              sent: 2,
              failed: 0,
              recipients: ['attendee1@example.com', 'attendee2@example.com'],
            } : undefined,
          };
        }
        break;
    }
    
    // Handle series updates
    if (options.updateSeries) {
      changes.seriesUpdated = true;
      warnings.push('All events in the series have been updated');
    }
    
    // Simulate notifications
    const notifications = options.notifyAttendees ? {
      sent: Math.floor(Math.random() * 5) + 1,
      failed: 0,
      recipients: ['attendee1@example.com', 'attendee2@example.com'],
    } : undefined;
    
    return {
      success: true,
      eventId,
      action,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
      notifications,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  },
});
