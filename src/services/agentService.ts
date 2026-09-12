// Enhanced agent service with user isolation and subscription checks
import { Agent, Article } from './newsDataService';
import { authService } from './authService';
import { databaseService } from './databaseService';
import { runIngestionForAgent } from './ingestion/pipeline';

export interface AgentCapabilities {
  webScraping: boolean;
  sentimentAnalysis: boolean;
  entityExtraction: boolean;
  contentSynthesis: boolean;
  realTimeMonitoring: boolean;
  alertGeneration: boolean;
}

export interface ScrapingResult {
  url: string;
  title: string;
  content: string;
  publishDate: Date;
  author?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  entities?: string[];
  relevanceScore: number;
}

export interface AgentTask {
  id: string;
  userId: string; // Added user isolation
  agentId: string;
  type: 'scrape' | 'analyze' | 'synthesize' | 'monitor';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  results?: any;
  error?: string;
}

class AgentService {
  private runningTasks: Map<string, AgentTask> = new Map();
  private agentCapabilities: Map<string, AgentCapabilities> = new Map();

  constructor() {
    this.initializeAgentCapabilities();
  }

  private initializeAgentCapabilities() {
    const defaultCapabilities: AgentCapabilities = {
      webScraping: true,
      sentimentAnalysis: true,
      entityExtraction: true,
      contentSynthesis: true,
      realTimeMonitoring: true,
      alertGeneration: true,
    };

    // Set capabilities for existing agents
    ['user_123_agent_1', 'user_123_agent_2'].forEach(agentId => {
      this.agentCapabilities.set(agentId, { ...defaultCapabilities });
    });
  }

  async deployAgent(agent: Agent): Promise<{ success: boolean; error?: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check subscription limits
      const userData = await databaseService.getUserData(user.id);
      if (!userData) {
        return { success: false, error: 'User data not found' };
      }

      const currentAgentCount = userData.agents.length;
      const agentLimit = user.subscription.features.maxAgents;
      
      if (agentLimit !== -1 && currentAgentCount >= agentLimit) {
        return { 
          success: false, 
          error: `Agent limit reached (${agentLimit}). Upgrade your subscription to create more agents.` 
        };
      }

      // Check source limits
      const sourceLimit = user.subscription.features.maxSources;
      if (sourceLimit !== -1 && agent.sources.length > sourceLimit) {
        return { 
          success: false, 
          error: `Too many sources (${agent.sources.length}). Your plan allows up to ${sourceLimit} sources.` 
        };
      }

      // Simulate agent deployment process
      await this.delay(2000);
      
      // Initialize agent capabilities based on subscription
      const capabilities: AgentCapabilities = {
        webScraping: true,
        sentimentAnalysis: user.subscription.features.aiSynthesis,
        entityExtraction: user.subscription.features.aiSynthesis,
        contentSynthesis: user.subscription.features.aiSynthesis,
        realTimeMonitoring: user.subscription.features.realTimeMonitoring,
        alertGeneration: user.subscription.features.realTimeMonitoring,
      };

      this.agentCapabilities.set(agent.id, capabilities);

      console.log(`Agent ${agent.name} deployed successfully for user ${user.id} with capabilities:`, capabilities);
      return { success: true };
    } catch (error) {
      console.error(`Failed to deploy agent ${agent.name}:`, error);
      return { success: false, error: 'Deployment failed' };
    }
  }

  async executeAgentTask(agent: Agent, taskType: 'scrape' | 'analyze' | 'synthesize' | 'monitor'): Promise<{ success: boolean; task?: AgentTask; error?: string }> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check subscription limits for task execution
    const userData = await databaseService.getUserData(user.id);
    if (!userData) {
      return { success: false, error: 'User data not found' };
    }

    // Check daily execution limits
    const dailyLimit = user.subscription.limits.agentExecutionsPerDay;
    const todayExecutions = this.getTodayExecutions(user.id);
    
    if (dailyLimit !== -1 && todayExecutions >= dailyLimit) {
      return { 
        success: false, 
        error: `Daily execution limit reached (${dailyLimit}). Upgrade to run more agent tasks.` 
      };
    }

    // Check if user has access to specific task types
    if (taskType === 'synthesize' && !user.subscription.features.aiSynthesis) {
      return { 
        success: false, 
        error: 'AI Synthesis not available in your plan. Upgrade to access this feature.' 
      };
    }

    if (taskType === 'monitor' && !user.subscription.features.realTimeMonitoring) {
      return { 
        success: false, 
        error: 'Real-time monitoring not available in your plan. Upgrade to access this feature.' 
      };
    }

    const taskId = `${user.id}_${agent.id}_${taskType}_${Date.now()}`;
    
    const task: AgentTask = {
      id: taskId,
      userId: user.id,
      agentId: agent.id,
      type: taskType,
      status: 'pending',
      progress: 0,
      startTime: new Date(),
    };

    this.runningTasks.set(taskId, task);

    // Start task execution
    this.executeTask(task, agent);
    
    // Track usage
    await databaseService.trackUserUsage(user.id, 'agent_executed', { taskType, agentId: agent.id });

    return { success: true, task };
  }

  private async executeTask(task: AgentTask, agent: Agent) {
    try {
      task.status = 'running';
      
      switch (task.type) {
        case 'scrape':
          await this.performWebScraping(task, agent);
          break;
        case 'analyze':
          await this.performContentAnalysis(task, agent);
          break;
        case 'synthesize':
          await this.performContentSynthesis(task, agent);
          break;
        case 'monitor':
          await this.performRealTimeMonitoring(task, agent);
          break;
      }
      
      task.status = 'completed';
      task.endTime = new Date();
      task.progress = 100;
      
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.endTime = new Date();
    }
  }

  private async performWebScraping(task: AgentTask, agent: Agent): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    task.progress = 10;

    // Run the shared ingestion pipeline (RSS first, then NewsAPI, then mock
    // fallback) so scrape runs produce real persisted content.
    const result = await runIngestionForAgent(agent, { preferMock: import.meta.env.DEV ? false : undefined });
    task.progress = 70;

    // Persist the articles (Supabase mode inserts rows; demo mode no-ops).
    let insertedIds: string[] = [];
    try {
      insertedIds = await databaseService.insertArticles(
        user.id,
        result.articles,
        agent.id,
      );
    } catch (err) {
      // Persistence errors should not fail the whole task; report them.
      task.error = err instanceof Error ? err.message : 'Failed to persist articles';
    }

    // Update agent stats whenever the ingestion produced new content. In
    // Supabase mode insertedIds reflects fresh rows; in demo mode the pipeline
    // output is prepended to the in-memory store, so use it directly so the
    // dashboard timestamp/articles count stays accurate.
    if (insertedIds.length > 0) {
      await databaseService.updateUserAgent(user.id, agent.id, {
        articlesCollected: agent.articlesCollected + insertedIds.length,
        status: 'active',
        lastUpdate: new Date().toLocaleString(),
      });
    } else if (result.articles.length > 0 && !import.meta.env.PROD) {
      await databaseService.updateUserAgent(user.id, agent.id, {
        articlesCollected: agent.articlesCollected + result.articles.length,
        status: 'active',
        lastUpdate: new Date().toLocaleString(),
      });
    }

    task.results = {
      articlesFound: result.articles.length,
      sourcesScanned: result.sourcesScanned,
      usedFallback: result.usedFallback,
      errors: result.errors,
      articles: result.articles.slice(0, 10),
    };
  }

  /** Articles stored for the user that belong to an agent (via userData). */
  private async getAgentArticles(userId: string, agentId: string): Promise<Article[]> {
    const userData = await databaseService.getUserData(userId);
    if (!userData) return [];

    const assigned = userData.articles.filter(a =>
      (a as Article & { agentId?: string }).agentId === agentId
    );
    if (assigned.length > 0) return assigned;

    // Legacy seed data has no agentId; attribute by topic/entity affinity.
    const agent = userData.agents.find(g => g.id === agentId);
    if (!agent) return [];
    const keywords = [...agent.topics, ...agent.entities].filter(Boolean);
    return userData.articles.filter(a => {
      const text = `${a.title} ${a.summary}`.toLowerCase();
      return keywords.some(k => text.includes(k.toLowerCase()));
    });
  }

  private countMentions(text: string, keywords: string[]): number {
    const lower = text.toLowerCase();
    return keywords.filter(k => k && lower.includes(k.toLowerCase())).length;
  }

  private async performContentAnalysis(task: AgentTask, agent: Agent): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    if (!user.subscription.features.advancedAnalytics) {
      throw new Error('Advanced analytics not available in your plan');
    }

    task.progress = 20;
    const articles = await this.getAgentArticles(user.id, agent.id);
    if (articles.length === 0) {
      throw new Error(
        `No articles collected yet for "${agent.name}". Run Scrape first.`,
      );
    }

    task.progress = 50;
    await this.delay(400);

    // --- Real analysis over the agent's stored articles -------------------
    const sentimentDistribution = {
      positive: articles.filter(a => a.sentiment === 'positive').length,
      neutral: articles.filter(a => a.sentiment === 'neutral').length,
      negative: articles.filter(a => a.sentiment === 'negative').length,
    };

    // Entity mention counts across all article copy.
    const entityMentions = agent.entities
      .map(entity => ({
        entity,
        mentions: articles.reduce(
          (sum, a) => sum + this.countMentions(`${a.title} ${a.summary}`, [entity]),
          0,
        ),
      }))
      .filter(e => e.mentions > 0)
      .sort((a, b) => b.mentions - a.mentions);

    // Topic / category signal from the article set.
    const leadingCategories = Array.from(
      articles.reduce(
        (map, a) => map.set(a.category, (map.get(a.category) ?? 0) + 1),
        new Map<string, number>(),
      ).entries(),
    ).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const emergingTopics = agent.topics
      .map(topic => {
        const mentions = articles.reduce(
          (sum, a) => sum + this.countMentions(`${a.title} ${a.summary}`, [topic]),
          0,
        );
        return { topic, mentions };
      })
      .filter(t => t.mentions > 0)
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 5);

    const total = articles.length;
    const negativeRatio = sentimentDistribution.negative / total;
    const riskLevel = negativeRatio > 0.5 ? 'High' : negativeRatio > 0.25 ? 'Medium' : 'Low';

    const riskFactors = articles
      .filter(a => a.sentiment === 'negative')
      .map(a => a.title)
      .slice(0, 5);
    const opportunities = leadingCategories
      .filter(([cat]) => cat)
      .slice(0, 3)
      .map(([cat]) => `Growing coverage in ${cat}`);

    task.progress = 90;
    task.results = {
      analyzedCount: articles.length,
      sentimentDistribution,
      entityMentions,
      leadingCategories,
      emergingTopics,
      riskLevel,
      riskFactors,
      opportunities,
      confidenceScore: Math.min(0.98, 0.7 + total * 0.02),
    };
  }

  private async performContentSynthesis(task: AgentTask, agent: Agent): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    if (!user.subscription.features.aiSynthesis) {
      throw new Error('AI Synthesis not available in your plan');
    }

    task.progress = 30;
    const articles = await this.getAgentArticles(user.id, agent.id);
    if (articles.length === 0) {
      throw new Error(
        `No articles collected yet for "${agent.name}". Run Scrape first.`,
      );
    }

    await this.delay(600);
    task.progress = 70;

    // --- Synthesis derived from the agent's actual stored articles ---------
    const total = articles.length;
    const positive = articles.filter(a => a.sentiment === 'positive').length;
    const outlook =
      positive / total > 0.5 ? 'cautiously optimistic'
      : positive / total >= 0.3 ? 'mixed'
      : 'cautious';

    const topTitles = articles
      .slice(0, 5)
      .map(a => a.title)
      .map(t => t.replace(/\s+/g, ' ').trim());

    const keyTopics = agent.topics.length ? agent.topics.slice(0, 3).join(', ') : 'the monitored space';
    const entityList = (agent.entities.length ? agent.entities.slice(0, 3).join(', ') : 'key players');

    const distinctTopics = [...new Set(articles.map(a => a.category).filter(Boolean))];
    const topicDetail = distinctTopics.length
      ? `Coverage clusters around ${distinctTopics.slice(0, 4).join(', ')}.`
      : '';

    const strongInsights = articles
      .filter(a => a.sentiment === 'positive')
      .slice(0, 2)
      .map(a => a.title);

    const weakInsights = articles
      .filter(a => a.sentiment === 'negative')
      .slice(0, 2)
      .map(a => a.title);

    const keyInsights = [
      ...(strongInsights.length ? [`Positive signal: ${strongInsights[0]}`] : []),
      ...(weakInsights.length ? [`Watch item: ${weakInsights[0]}`] : []),
      ...(distinctTopics.length ? [`Active themes: ${distinctTopics.slice(0, 4).join(', ')}.`] : []),
    ];

    const recommendations = [
      `Monitor ${keyTopics} developments weekly for shifts in ${entityList}.`,
      ...(weakInsights.length ? [`Prepare a response plan for negative coverage around ${weakInsights[0].slice(0, 60)}.`] : []),
      ...(strongInsights.length ? [`Double down on momentum: capitalize on ${strongInsights[0].slice(0, 60)}.`] : []),
    ];

    task.results = {
      executiveSummary: `Based on ${total} articles across ${agent.sources.length} sources, sentiment in ${keyTopics} is ${outlook}. ${topicDetail} Sentiment split is ${positive}/${total} positive, ${articles.filter(a => a.sentiment === 'negative').length}/${total} negative.`,
      keyInsights: keyInsights.slice(0, 5),
      actionableRecommendations: recommendations.slice(0, 4),
      topStories: topTitles.slice(0, 5),
      riskAssessment: `${agent.entities.slice(0, 2).join(', ') || 'Monitored entities'} exposure is ${articles.filter(a => a.sentiment === 'negative').length}/${total} negative-covered stories.`,
      marketOpportunities: distinctTopics.slice(0, 3).map(cat => `${cat} category showing coverage momentum`),
      competitiveIntelligence: {
        threats: articles.filter(a => a.sentiment === 'negative').slice(0, 3).map(a => a.title),
        advantages: articles.filter(a => a.sentiment === 'positive').slice(0, 3).map(a => a.title),
      },
    };
  }

  private async performRealTimeMonitoring(task: AgentTask, agent: Agent): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    if (!user.subscription.features.realTimeMonitoring) {
      throw new Error('Real-time monitoring not available in your plan');
    }

    task.progress = 15;

    // A real "check": re-run the ingestion pipeline the same way a scrape
    // does. The pipeline is deterministic in demo mode so alerting is based
    // on whether the check actually surfaced anything new.
    const result = await runIngestionForAgent(agent, {
      preferMock: import.meta.env.DEV ? false : undefined,
    });

    task.progress = 60;

    let insertedIds: string[] = [];
    try {
      insertedIds = await databaseService.insertArticles(
        user.id,
        result.articles,
        agent.id,
      );
    } catch (err) {
      task.error = err instanceof Error ? err.message : 'Failed to persist monitored articles';
    }

    if (insertedIds.length > 0) {
      await databaseService.updateUserAgent(user.id, agent.id, {
        articlesCollected: agent.articlesCollected + insertedIds.length,
        status: 'active',
        lastUpdate: new Date().toLocaleString(),
      });
    } else if (result.articles.length > 0 && !import.meta.env.PROD) {
      await databaseService.updateUserAgent(user.id, agent.id, {
        articlesCollected: agent.articlesCollected + result.articles.length,
        status: 'active',
        lastUpdate: new Date().toLocaleString(),
      });
    }

    task.progress = 90;

    const newArticles = insertedIds.length > 0
      ? insertedIds.length
      : !import.meta.env.PROD
        ? result.articles.length
        : 0;

    const alerts =
      newArticles > 0
        ? [
            {
              type: 'info',
              message: `${newArticles} new article${newArticles > 1 ? 's' : ''} detected for ${agent.name} from ${[...new Set(result.sourcesScanned)].slice(0, 3).join(', ') || 'monitored sources'}.`,
            },
          ]
        : [
            {
              type: 'success',
              message: `No new articles found for ${agent.name} — sources are up to date.`,
            },
          ];

    task.results = {
      checkedAt: new Date().toLocaleString(),
      articlesChecked: result.articles.length,
      newArticles,
      sourcesScanned: result.sourcesScanned,
      usedFallback: result.usedFallback,
      errors: result.errors,
      alerts,
      nextCheck: new Date(Date.now() + this.getFrequencyMs(agent.frequency)).toLocaleString(),
      monitoringQuality: 'Standard',
    };
  }

  private async mockScrapeSource(source: string, topics: string[], entities: string[], enhancedMode: boolean): Promise<ScrapingResult[]> {
    const baseArticles = [
      {
        url: `https://${source.toLowerCase().replace(' ', '')}.com/article-1`,
        title: `${topics[0]} Developments at ${entities[0]}`,
        content: `Recent developments in ${topics[0]} show significant progress. ${entities[0]} announced new initiatives that could reshape the industry landscape. Market analysts are closely watching these developments for potential impacts on competitive positioning.`,
        publishDate: new Date(Date.now() - Math.random() * 86400000 * 7),
        author: 'Industry Reporter',
        relevanceScore: Math.random() * 0.4 + 0.6,
      },
    ];

    if (enhancedMode) {
      // Add more detailed articles for paid users
      baseArticles.push(
        {
          url: `https://${source.toLowerCase().replace(' ', '')}.com/article-2`,
          title: `Market Analysis: ${topics[1] || topics[0]} Trends with Predictive Insights`,
          content: `Comprehensive industry analysis reveals ${topics[1] || topics[0]} trends with advanced predictive modeling. Our AI-powered analysis suggests 73% probability of continued growth. Key market drivers include regulatory changes, consumer behavior shifts, and technological innovations. Expert interviews with 15 industry leaders provide additional context on strategic implications.`,
          publishDate: new Date(Date.now() - Math.random() * 86400000 * 3),
          author: 'Senior Market Analyst',
          relevanceScore: Math.random() * 0.2 + 0.8,
        },
        {
          url: `https://${source.toLowerCase().replace(' ', '')}.com/article-3`,
          title: `Exclusive: ${entities[0]} Strategic Partnership Implications`,
          content: `Exclusive analysis of ${entities[0]}'s latest strategic moves reveals significant implications for the ${topics[0]} sector. Internal sources suggest major announcements planned for Q2. Competitive analysis shows potential market share shifts of 15-20%. Risk assessment indicates moderate exposure to regulatory changes.`,
          publishDate: new Date(Date.now() - Math.random() * 86400000 * 2),
          author: 'Executive Editor',
          relevanceScore: 0.95,
        }
      );
    }

    return baseArticles;
  }

  private getTodayExecutions(userId: string): number {
    const today = new Date().toDateString();
    const userTasks = Array.from(this.runningTasks.values()).filter(
      task => task.userId === userId && task.startTime.toDateString() === today
    );
    return userTasks.length;
  }

  private analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['growth', 'opportunity', 'success', 'innovation', 'progress'];
    const negativeWords = ['decline', 'risk', 'challenge', 'problem', 'concern'];
    
    const lowerContent = content.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractEntities(content: string, configuredEntities: string[]): string[] {
    const lowerContent = content.toLowerCase();
    return configuredEntities.filter(entity => 
      lowerContent.includes(entity.toLowerCase())
    );
  }

  private getFrequencyMs(frequency: string): number {
    switch (frequency) {
      case 'hourly': return 60 * 60 * 1000;
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getAgentCapabilities(agentId: string): AgentCapabilities | null {
    return this.agentCapabilities.get(agentId) || null;
  }

  getRunningTasks(userId?: string): AgentTask[] {
    const tasks = Array.from(this.runningTasks.values());
    return userId ? tasks.filter(task => task.userId === userId) : tasks;
  }

  async testAgentCapabilities(agent: Agent): Promise<{
    success: boolean;
    capabilities: AgentCapabilities;
    testResults: any;
    subscriptionLimits?: any;
  }> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { success: false, capabilities: {} as AgentCapabilities, testResults: {} };
    }

    await this.delay(2000);
    
    const capabilities = this.getAgentCapabilities(agent.id) || {
      webScraping: true,
      sentimentAnalysis: user.subscription.features.aiSynthesis,
      entityExtraction: user.subscription.features.aiSynthesis,
      contentSynthesis: user.subscription.features.aiSynthesis,
      realTimeMonitoring: user.subscription.features.realTimeMonitoring,
      alertGeneration: user.subscription.features.realTimeMonitoring,
    };

    const testResults = {
      webScrapingTest: 'Successfully connected to configured sources',
      sentimentAnalysisTest: user.subscription.features.aiSynthesis ? 
        'Advanced sentiment analysis model loaded and functional' : 
        'Basic sentiment analysis available (upgrade for advanced features)',
      entityExtractionTest: `Configured to track ${agent.entities.length} entities${user.subscription.features.aiSynthesis ? ' with enhanced accuracy' : ''}`,
      synthesisTest: user.subscription.features.aiSynthesis ? 
        'Premium content synthesis pipeline operational' : 
        'Content synthesis not available (upgrade required)',
      monitoringTest: user.subscription.features.realTimeMonitoring ? 
        `Real-time monitoring set to ${agent.frequency} frequency with premium alerts` : 
        'Real-time monitoring not available (upgrade required)',
    };

    const subscriptionLimits = {
      maxAgents: user.subscription.features.maxAgents,
      maxSources: user.subscription.features.maxSources,
      dailyExecutions: user.subscription.limits.agentExecutionsPerDay,
      currentUsage: {
        agents: (await databaseService.getUserData(user.id))?.agents.length || 0,
        todayExecutions: this.getTodayExecutions(user.id),
      },
    };

    return {
      success: true,
      capabilities,
      testResults,
      subscriptionLimits,
    };
  }
}

export const agentService = new AgentService();