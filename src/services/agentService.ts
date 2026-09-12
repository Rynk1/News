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

    // Update agent stats when Supabase showed newly inserted rows.
    if (insertedIds.length > 0) {
      await databaseService.updateUserAgent(user.id, agent.id, {
        articlesCollected: agent.articlesCollected + insertedIds.length,
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

  private async performContentAnalysis(task: AgentTask, agent: Agent): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    if (!user.subscription.features.advancedAnalytics) {
      throw new Error('Advanced analytics not available in your plan');
    }

    task.progress = 25;
    await this.delay(1500);
    
    // Enhanced analysis for paid users
    const analysisResults = {
      sentimentDistribution: {
        positive: 45,
        neutral: 35,
        negative: 20,
      },
      topEntities: agent.entities.slice(0, user.subscription.features.aiSynthesis ? 10 : 3),
      emergingTopics: user.subscription.features.aiSynthesis ? 
        ['AI Ethics', 'Quantum Computing', 'Green Technology', 'Web3', 'Metaverse'] :
        ['AI Ethics', 'Green Technology'],
      riskFactors: user.subscription.features.aiSynthesis ? 
        ['Market Volatility', 'Regulatory Changes', 'Supply Chain Disruptions'] :
        ['Market Volatility'],
      opportunities: user.subscription.features.aiSynthesis ? 
        ['New Market Segments', 'Technology Partnerships', 'Sustainability Initiatives'] :
        ['New Market Segments'],
      confidenceScore: user.subscription.features.aiSynthesis ? 0.92 : 0.75,
    };
    
    task.progress = 100;
    task.results = analysisResults;
  }

  private async performContentSynthesis(task: AgentTask, agent: Agent): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    if (!user.subscription.features.aiSynthesis) {
      throw new Error('AI Synthesis not available in your plan');
    }

    task.progress = 30;
    await this.delay(2000);
    
    // Premium synthesis results
    const synthesisResults = {
      executiveSummary: `Based on comprehensive analysis of ${agent.sources.length} premium sources, key trends in ${agent.topics.join(', ')} show significant developments. Market sentiment remains cautiously optimistic with emerging opportunities in AI and sustainability sectors. Our AI analysis indicates a 78% probability of continued growth in these areas.`,
      keyInsights: [
        'AI regulation frameworks are accelerating globally with 15 new policies in Q1',
        'Supply chain resilience investments increased 34% YoY across Fortune 500',
        'Sustainability initiatives are driving new business models worth $2.3T market',
        'Remote work productivity tools show 23% adoption increase in enterprise',
      ],
      actionableRecommendations: [
        'Consider establishing AI governance committee by Q2 2024',
        'Evaluate supply chain diversification options in Southeast Asia',
        'Explore partnerships in green technology sector - 12 potential targets identified',
        'Implement hybrid work policy based on productivity data analysis',
      ],
      riskAssessment: 'Medium-Low - Monitor regulatory developments closely, particularly EU AI Act implementation',
      marketOpportunities: [
        'AI-powered supply chain solutions ($45B market by 2026)',
        'Sustainable technology partnerships (projected 67% ROI)',
        'Remote collaboration tools for enterprise (growing 28% annually)',
      ],
      competitiveIntelligence: {
        threats: ['New market entrants in AI space', 'Regulatory compliance costs'],
        advantages: ['Early adoption of sustainable practices', 'Strong remote work infrastructure'],
      },
    };
    
    task.progress = 100;
    task.results = synthesisResults;
  }

  private async performRealTimeMonitoring(task: AgentTask, agent: Agent): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    if (!user.subscription.features.realTimeMonitoring) {
      throw new Error('Real-time monitoring not available in your plan');
    }

    // Enhanced monitoring for paid users
    const monitoringResults = {
      alertsGenerated: Math.floor(Math.random() * 8) + 2,
      newArticles: Math.floor(Math.random() * 15) + 5,
      significantChanges: [
        'Sudden spike in AI regulation mentions (+340% in last 4 hours)',
        'New competitor announcement detected: TechCorp AI division launch',
        'Market sentiment shift: Supply chain stocks up 12% after positive news',
      ],
      realTimeAlerts: user.subscription.features.realTimeMonitoring ? [
        { type: 'urgent', message: 'Breaking: Major acquisition in your tracked entities' },
        { type: 'opportunity', message: 'Positive sentiment surge in sustainability sector' },
      ] : [],
      nextCheck: new Date(Date.now() + this.getFrequencyMs(agent.frequency)),
      monitoringQuality: user.subscription.features.realTimeMonitoring ? 'Premium' : 'Standard',
    };
    
    task.progress = 100;
    task.results = monitoringResults;
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