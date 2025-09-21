import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const createTaskPlannerTool = () => createTool({
  id: 'plan-task',
  description: 'Create a structured plan for complex multi-step tasks',
  inputSchema: z.object({
    taskDescription: z.string()
      .describe('Description of the task to plan'),
    constraints: z.object({
      deadline: z.string().optional()
        .describe('When the task needs to be completed'),
      resources: z.array(z.string()).optional()
        .describe('Available resources or tools'),
      dependencies: z.array(z.string()).optional()
        .describe('Tasks that must be completed first'),
    }).optional(),
    preferences: z.object({
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
      style: z.enum(['detailed', 'summary', 'actionable']).default('actionable'),
    }).optional(),
  }),
  outputSchema: z.object({
    plan: z.object({
      title: z.string(),
      overview: z.string(),
      estimatedDuration: z.string().optional(),
      steps: z.array(z.object({
        order: z.number(),
        action: z.string(),
        agent: z.string().optional()
          .describe('Which agent should handle this step'),
        dependencies: z.array(z.number()).optional()
          .describe('Step numbers this depends on'),
        estimatedTime: z.string().optional(),
        notes: z.string().optional(),
      })),
      risks: z.array(z.string()).optional(),
      alternatives: z.array(z.string()).optional(),
    }),
  }),
  execute: async ({ context }) => {
    const { taskDescription, constraints, preferences } = context;
    
    // Analyze the task to create a plan
    const taskAnalysis = analyzeTask(taskDescription);
    
    // Generate steps based on task type
    const steps = generateSteps(taskAnalysis, constraints);
    
    // Create the plan
    const plan = {
      title: generateTitle(taskDescription),
      overview: `Plan to ${taskDescription.toLowerCase()}`,
      estimatedDuration: estimateDuration(steps),
      steps: steps.map((step, index) => ({
        order: index + 1,
        action: step.action,
        agent: step.agent,
        dependencies: step.dependencies,
        estimatedTime: step.estimatedTime,
        notes: step.notes,
      })),
      risks: identifyRisks(taskAnalysis),
      alternatives: suggestAlternatives(taskAnalysis),
    };
    
    return { plan };
  },
});

// Helper functions for task planning
function analyzeTask(description: string): TaskAnalysis {
  const lowerDesc = description.toLowerCase();
  
  return {
    isEmail: lowerDesc.includes('email') || lowerDesc.includes('send') || lowerDesc.includes('reply'),
    isCalendar: lowerDesc.includes('meeting') || lowerDesc.includes('schedule') || lowerDesc.includes('calendar'),
    isSearch: lowerDesc.includes('find') || lowerDesc.includes('search') || lowerDesc.includes('look'),
    isComplex: description.split(' ').length > 20 || lowerDesc.includes('and') || lowerDesc.includes('then'),
    keywords: extractKeywords(description),
  };
}

function generateSteps(analysis: TaskAnalysis, constraints?: any): TaskStep[] {
  const steps: TaskStep[] = [];
  
  // Email-related steps
  if (analysis.isEmail) {
    steps.push({
      action: 'Search for relevant emails or contacts',
      agent: 'email',
      estimatedTime: '1-2 minutes',
    });
    steps.push({
      action: 'Compose or prepare email content',
      agent: 'email',
      estimatedTime: '2-5 minutes',
      dependencies: [0],
    });
  }
  
  // Calendar-related steps
  if (analysis.isCalendar) {
    steps.push({
      action: 'Check calendar availability',
      agent: 'calendar',
      estimatedTime: '1 minute',
    });
    steps.push({
      action: 'Create or update calendar event',
      agent: 'calendar',
      estimatedTime: '2 minutes',
      dependencies: steps.length > 0 ? [steps.length - 1] : undefined,
    });
  }
  
  // Search-related steps
  if (analysis.isSearch) {
    steps.push({
      action: 'Search web for relevant information',
      agent: 'webSearch',
      estimatedTime: '2-3 minutes',
    });
    steps.push({
      action: 'Synthesize and summarize findings',
      agent: 'main',
      estimatedTime: '1-2 minutes',
      dependencies: [steps.length - 1],
    });
  }
  
  // Add coordination step for complex tasks
  if (analysis.isComplex && steps.length > 2) {
    steps.push({
      action: 'Coordinate results and prepare final output',
      agent: 'main',
      estimatedTime: '2 minutes',
      dependencies: steps.map((_, i) => i),
      notes: 'Combine all previous results',
    });
  }
  
  // Default step if no specific type detected
  if (steps.length === 0) {
    steps.push({
      action: 'Process request and provide response',
      agent: 'main',
      estimatedTime: '1-3 minutes',
    });
  }
  
  return steps;
}

function generateTitle(description: string): string {
  const words = description.split(' ').slice(0, 5);
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function estimateDuration(steps: TaskStep[]): string {
  const totalMinutes = steps.reduce((sum, step) => {
    const match = step.estimatedTime?.match(/(\d+)/);
    return sum + (match ? parseInt(match[1]) : 2);
  }, 0);
  
  if (totalMinutes < 5) return 'Less than 5 minutes';
  if (totalMinutes < 15) return '5-15 minutes';
  if (totalMinutes < 30) return '15-30 minutes';
  return 'More than 30 minutes';
}

function identifyRisks(analysis: TaskAnalysis): string[] {
  const risks: string[] = [];
  
  if (analysis.isEmail) {
    risks.push('Email delivery might be delayed');
    risks.push('Recipient contact information might be outdated');
  }
  
  if (analysis.isCalendar) {
    risks.push('Scheduling conflicts might arise');
    risks.push('Time zone differences need consideration');
  }
  
  if (analysis.isComplex) {
    risks.push('Task might require user input at multiple steps');
    risks.push('Some sub-tasks might fail and need alternatives');
  }
  
  return risks;
}

function suggestAlternatives(analysis: TaskAnalysis): string[] {
  const alternatives: string[] = [];
  
  if (analysis.isEmail) {
    alternatives.push('Use instant messaging for urgent communications');
    alternatives.push('Schedule a call instead of lengthy email exchanges');
  }
  
  if (analysis.isCalendar) {
    alternatives.push('Use scheduling polls for group meetings');
    alternatives.push('Consider asynchronous communication for updates');
  }
  
  return alternatives;
}

function extractKeywords(description: string): string[] {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  return description
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word))
    .slice(0, 5);
}

// Type definitions
interface TaskAnalysis {
  isEmail: boolean;
  isCalendar: boolean;
  isSearch: boolean;
  isComplex: boolean;
  keywords: string[];
}

interface TaskStep {
  action: string;
  agent?: string;
  dependencies?: number[];
  estimatedTime?: string;
  notes?: string;
}
