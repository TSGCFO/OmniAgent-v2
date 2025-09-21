import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const createSourceValidationTool = () => createTool({
  id: 'validate-source',
  description: 'Validate the credibility and reliability of information sources',
  inputSchema: z.object({
    source: z.object({
      url: z.string().url()
        .describe('URL of the source to validate'),
      domain: z.string().optional()
        .describe('Domain name if already known'),
      content: z.string().optional()
        .describe('Content sample for analysis'),
      claimedAuthor: z.string().optional()
        .describe('Author claimed by the source'),
      publishDate: z.string().optional()
        .describe('Published date claimed by the source'),
    }),
    validationChecks: z.object({
      checkDomain: z.boolean().default(true)
        .describe('Verify domain reputation'),
      checkAuthor: z.boolean().default(true)
        .describe('Verify author credentials'),
      checkFactuality: z.boolean().default(true)
        .describe('Cross-reference facts'),
      checkBias: z.boolean().default(true)
        .describe('Analyze for bias'),
      checkFreshness: z.boolean().default(true)
        .describe('Check information recency'),
    }).optional(),
  }),
  outputSchema: z.object({
    credibilityScore: z.number().min(0).max(100)
      .describe('Overall credibility score (0-100)'),
    assessment: z.object({
      domainReputation: z.object({
        score: z.number().min(0).max(100),
        status: z.enum(['trusted', 'neutral', 'questionable', 'blacklisted']),
        details: z.string().optional(),
      }).optional(),
      authorCredibility: z.object({
        score: z.number().min(0).max(100),
        verified: z.boolean(),
        expertise: z.array(z.string()).optional(),
        details: z.string().optional(),
      }).optional(),
      contentAnalysis: z.object({
        factualAccuracy: z.number().min(0).max(100),
        biasLevel: z.enum(['none', 'minimal', 'moderate', 'high']),
        biasDirection: z.string().optional(),
        sensationalism: z.number().min(0).max(100),
      }).optional(),
      freshness: z.object({
        isRecent: z.boolean(),
        daysSincePublished: z.number().optional(),
        lastUpdated: z.string().optional(),
        relevance: z.enum(['current', 'recent', 'dated', 'outdated']),
      }).optional(),
    }),
    warnings: z.array(z.string()),
    recommendations: z.array(z.string()),
    alternativeSources: z.array(z.object({
      url: z.string(),
      name: z.string(),
      credibilityScore: z.number(),
    })).optional(),
  }),
  execute: async ({ context }) => {
    const { source, validationChecks = {} } = context;
    
    // TODO: Integrate with actual fact-checking and source validation services
    // This is a placeholder implementation
    
    console.log('Validating source:', source.url);
    
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let totalScore = 0;
    let checksPerformed = 0;
    
    // Parse domain
    const domain = source.domain || new URL(source.url).hostname;
    
    // Domain reputation check
    let domainReputation = undefined;
    if (validationChecks.checkDomain !== false) {
      const knownDomains = {
        'wikipedia.org': { score: 85, status: 'trusted' as const },
        'gov': { score: 90, status: 'trusted' as const },
        'edu': { score: 85, status: 'trusted' as const },
        'example.com': { score: 50, status: 'neutral' as const },
      };
      
      const domainInfo = Object.entries(knownDomains).find(([key]) => 
        domain.includes(key)
      );
      
      if (domainInfo) {
        domainReputation = {
          score: domainInfo[1].score,
          status: domainInfo[1].status,
          details: `Domain ${domain} is recognized`,
        };
      } else {
        domainReputation = {
          score: 40,
          status: 'neutral' as const,
          details: 'Domain not in trusted database',
        };
        warnings.push('Source domain is not widely recognized');
      }
      
      totalScore += domainReputation.score;
      checksPerformed++;
    }
    
    // Author credibility check
    let authorCredibility = undefined;
    if (validationChecks.checkAuthor !== false && source.claimedAuthor) {
      const isVerified = Math.random() > 0.5;
      authorCredibility = {
        score: isVerified ? 75 : 30,
        verified: isVerified,
        expertise: isVerified ? ['Technology', 'Science'] : undefined,
        details: isVerified ? 'Author verified through public records' : 'Author could not be verified',
      };
      
      if (!isVerified) {
        warnings.push('Author credentials could not be verified');
        recommendations.push('Cross-reference author information with other sources');
      }
      
      totalScore += authorCredibility.score;
      checksPerformed++;
    }
    
    // Content analysis
    let contentAnalysis = undefined;
    if (validationChecks.checkFactuality !== false || validationChecks.checkBias !== false) {
      const factualAccuracy = Math.floor(Math.random() * 30) + 70;
      const biasScore = Math.random();
      
      contentAnalysis = {
        factualAccuracy,
        biasLevel: biasScore < 0.2 ? 'minimal' : biasScore < 0.5 ? 'moderate' : 'high' as const,
        biasDirection: biasScore > 0.5 ? 'political left' : undefined,
        sensationalism: Math.floor(Math.random() * 40),
      };
      
      if (contentAnalysis.biasLevel === 'high') {
        warnings.push('High bias detected in content');
        recommendations.push('Seek alternative perspectives on this topic');
      }
      
      totalScore += factualAccuracy;
      checksPerformed++;
    }
    
    // Freshness check
    let freshness = undefined;
    if (validationChecks.checkFreshness !== false && source.publishDate) {
      const publishDate = new Date(source.publishDate);
      const daysSince = Math.floor((Date.now() - publishDate.getTime()) / 86400000);
      
      freshness = {
        isRecent: daysSince < 30,
        daysSincePublished: daysSince,
        lastUpdated: source.publishDate,
        relevance: daysSince < 7 ? 'current' : 
                  daysSince < 30 ? 'recent' : 
                  daysSince < 365 ? 'dated' : 'outdated' as const,
      };
      
      if (freshness.relevance === 'outdated') {
        warnings.push('Information may be outdated');
        recommendations.push('Look for more recent sources on this topic');
      }
      
      const freshnessScore = daysSince < 30 ? 90 : daysSince < 365 ? 60 : 30;
      totalScore += freshnessScore;
      checksPerformed++;
    }
    
    // Calculate final credibility score
    const credibilityScore = checksPerformed > 0 
      ? Math.round(totalScore / checksPerformed) 
      : 50;
    
    // Generate alternative sources
    const alternativeSources = warnings.length > 0 ? [
      {
        url: 'https://scholar.google.com/search?q=' + encodeURIComponent(source.url),
        name: 'Google Scholar',
        credibilityScore: 85,
      },
      {
        url: 'https://www.snopes.com/search/?q=' + encodeURIComponent(domain),
        name: 'Snopes Fact Check',
        credibilityScore: 80,
      },
    ] : undefined;
    
    // Add general recommendations
    if (credibilityScore < 50) {
      recommendations.push('Exercise caution with this source');
      recommendations.push('Verify information with multiple trusted sources');
    } else if (credibilityScore < 70) {
      recommendations.push('Consider cross-referencing key facts');
    }
    
    return {
      credibilityScore,
      assessment: {
        domainReputation,
        authorCredibility,
        contentAnalysis,
        freshness,
      },
      warnings,
      recommendations,
      alternativeSources,
    };
  },
});
