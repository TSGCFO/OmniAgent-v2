import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { getUnifiedMemory } from '../memory/memory-config.js';
import { getSystemConfig } from '../config/system-config.js';
import { createCalendarViewTool } from '../tools/calendar-view-tool.js';
import { createCalendarScheduleTool } from '../tools/calendar-schedule-tool.js';
import { createCalendarManageTool } from '../tools/calendar-manage-tool.js';

const CALENDAR_AGENT_INSTRUCTIONS = `You are the Calendar Management Agent, a specialized assistant for scheduling, managing meetings, and optimizing time management.

## Your Capabilities:
1. **Schedule Management**: Create, update, and manage calendar events
2. **Availability Checking**: Find free time slots and prevent conflicts
3. **Meeting Coordination**: Handle meeting invites, responses, and rescheduling
4. **Time Zone Handling**: Manage events across different time zones
5. **Recurring Events**: Set up and manage recurring meetings and appointments

## Scheduling Guidelines:
- Always check for conflicts before scheduling
- Respect working hours preferences from memory
- Include buffer time between back-to-back meetings
- Consider time zones for all participants
- Provide meeting preparation time for important events

## Smart Features:
1. **Conflict Resolution**: Suggest alternative times when conflicts arise
2. **Meeting Optimization**: Recommend shorter meetings when appropriate
3. **Travel Time**: Account for travel time between locations
4. **Preparation Reminders**: Set prep time for important meetings
5. **Follow-up Scheduling**: Automatically suggest follow-up meetings

## Integration:
- Work with Email Agent for meeting invitations
- Coordinate with Main Agent for complex scheduling scenarios
- Use memory to learn scheduling preferences and patterns

## Best Practices:
- Always confirm time zones explicitly
- Include dial-in/location details for meetings
- Set appropriate reminders based on meeting importance
- Respect user's preferred meeting times and days
- Suggest agenda items for scheduled meetings`;

export const calendarAgent = new Agent({
  name: 'CalendarAgent',
  description: 'Specialized agent for calendar management, scheduling, and time optimization',
  instructions: CALENDAR_AGENT_INSTRUCTIONS,
  model: ({ runtimeContext }) => {
    const config = getSystemConfig();
    const model = runtimeContext?.get('model') || config.agents.subAgentModel;
    return openai(model);
  },
  memory: getUnifiedMemory(),
  tools: {
    viewCalendar: createCalendarViewTool(),
    scheduleMeeting: createCalendarScheduleTool(),
    manageCalendar: createCalendarManageTool(),
  },
  defaultGenerateOptions: ({ runtimeContext }) => {
    const config = getSystemConfig();
    return {
      temperature: 0.4, // Moderate temperature for scheduling flexibility
      maxSteps: 4,
    };
  },
});

// Calendar-specific types
export interface CalendarContext {
  calendar?: string;
  timezone?: string;
  workingHours?: {
    start: string;
    end: string;
    days: string[];
  };
}

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  reminders?: number[]; // minutes before event
  recurrence?: RecurrenceRule;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  count?: number;
  until?: Date;
  byDay?: string[];
}

// Helper function for calendar operations
export async function processCalendarRequest(
  request: string,
  userId: string,
  context?: CalendarContext
) {
  const response = await calendarAgent.generate(request, {
    memory: {
      thread: `calendar-${userId}-${Date.now()}`,
      resource: userId,
    },
    runtimeContext: context ? new Map(Object.entries(context)) : undefined,
  });
  
  return response;
}
