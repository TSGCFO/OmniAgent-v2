import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const createEmailComposeTool = () => createTool({
  id: 'compose-email',
  description: 'Compose and send emails with proper formatting and attachments',
  inputSchema: z.object({
    action: z.enum(['draft', 'send'])
      .describe('Whether to save as draft or send immediately'),
    email: z.object({
      to: z.array(z.string())
        .describe('Primary recipients email addresses'),
      cc: z.array(z.string()).optional()
        .describe('Carbon copy recipients'),
      bcc: z.array(z.string()).optional()
        .describe('Blind carbon copy recipients'),
      subject: z.string()
        .describe('Email subject line'),
      body: z.string()
        .describe('Email body content (HTML supported)'),
      replyTo: z.string().optional()
        .describe('Reply-to email address if different from sender'),
      attachments: z.array(z.object({
        filename: z.string(),
        path: z.string().optional(),
        content: z.string().optional(),
        contentType: z.string().optional(),
      })).optional()
        .describe('File attachments'),
      priority: z.enum(['low', 'normal', 'high']).default('normal')
        .describe('Email priority level'),
      headers: z.record(z.string()).optional()
        .describe('Additional email headers'),
    }),
    options: z.object({
      scheduleSend: z.string().optional()
        .describe('Schedule email to be sent at specific time'),
      trackOpens: z.boolean().default(false)
        .describe('Track if email is opened'),
      requestReadReceipt: z.boolean().default(false)
        .describe('Request read receipt'),
      signature: z.string().optional()
        .describe('Email signature to append'),
      template: z.string().optional()
        .describe('Use a predefined email template'),
    }).optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    messageId: z.string().optional(),
    status: z.enum(['sent', 'drafted', 'scheduled', 'failed']),
    timestamp: z.string(),
    error: z.string().optional(),
    details: z.object({
      recipientCount: z.number(),
      attachmentCount: z.number(),
      estimatedDeliveryTime: z.string().optional(),
    }).optional(),
  }),
  execute: async ({ context }) => {
    const { action, email, options } = context;
    
    // TODO: Integrate with actual email service (Gmail API, SMTP, etc.)
    // This is a placeholder implementation
    
    console.log(`${action === 'send' ? 'Sending' : 'Drafting'} email:`, {
      to: email.to,
      subject: email.subject,
      attachments: email.attachments?.length || 0,
    });
    
    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = [...email.to, ...(email.cc || []), ...(email.bcc || [])]
      .filter(addr => !emailRegex.test(addr));
    
    if (invalidEmails.length > 0) {
      return {
        success: false,
        status: 'failed' as const,
        timestamp: new Date().toISOString(),
        error: `Invalid email addresses: ${invalidEmails.join(', ')}`,
      };
    }
    
    // Simulate email sending/drafting
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Handle scheduled send
    if (options?.scheduleSend) {
      return {
        success: true,
        messageId,
        status: 'scheduled' as const,
        timestamp: new Date().toISOString(),
        details: {
          recipientCount: email.to.length + (email.cc?.length || 0) + (email.bcc?.length || 0),
          attachmentCount: email.attachments?.length || 0,
          estimatedDeliveryTime: options.scheduleSend,
        },
      };
    }
    
    // Return success response
    return {
      success: true,
      messageId,
      status: action === 'send' ? 'sent' as const : 'drafted' as const,
      timestamp: new Date().toISOString(),
      details: {
        recipientCount: email.to.length + (email.cc?.length || 0) + (email.bcc?.length || 0),
        attachmentCount: email.attachments?.length || 0,
        estimatedDeliveryTime: action === 'send' ? new Date(Date.now() + 60000).toISOString() : undefined,
      },
    };
  },
});
