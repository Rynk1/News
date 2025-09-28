// Database service with user isolation and subscription management
import { User, SubscriptionTier, authService } from './authService';
import { Agent, Article } from './newsDataService';

export interface UserData {
  userId: string;
  agents: Agent[];
  articles: Article[];
  savedArticles: number[];
  annotations: { [articleId: number]: string[] };
  preferences: any;
  usage: any;
}

export interface DatabaseQuery {
  userId: string;
  table: string;
  operation: 'create' | 'read' | 'update' | 'delete';
  data?: any;
  filters?: any;
}

class DatabaseService {
  private userData: Map<string, UserData> = new Map();
  private adminData: Map<string, any> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize mock user data
    const mockUserId = 'user_123';
    this.userData.set(mockUserId, {
      userId: mockUserId,
      agents: [
        {
          id: `${mockUserId}_agent_1`,
          name: "Tech Industry Tracker",
          description: "Monitors technology industry news and trends with AI-powered analysis",
          sources: ["TechCrunch", "Wired", "The Verge"],
          topics: ["AI", "Cloud Computing", "Cybersecurity"],
          entities: ["Google", "Microsoft", "Apple"],
          frequency: "daily",
          status: "active",
          lastUpdate: "10 min ago",
          articlesCollected: 24,
        },
        {
          id: `${mockUserId}_agent_2`,
          name: "Competitor Analysis",
          description: "Tracks news about direct competitors with sentiment analysis",
          sources: ["Bloomberg", "Reuters", "Financial Times"],
          topics: ["Market Share", "Product Launch", "Acquisitions"],
          entities: ["Amazon", "Facebook", "Netflix"],
          frequency: "hourly",
          status: "active",
          lastUpdate: "1 hour ago",
          articlesCollected: 18,
        },
      ],
      articles: [],
      savedArticles: [],
      annotations: {},
      preferences: {},
      usage: {},
    });

    // Initialize admin analytics data
    this.adminData.set('analytics', {
      totalUsers: 1247,
      activeUsers: 892,
      subscriptionDistribution: {
        free: 623,
        starter: 398,
        professional: 187,
        enterprise: 39,
      },
      monthlyRevenue: 47890,
      churnRate: 3.2,
      averageSessionTime: 24.5,
      topFeatures: [
        { name: 'AI Synthesis', usage: 89 },
        { name: 'Real-time Monitoring', usage: 76 },
        { name: 'Kindle Reader', usage: 68 },
        { name: 'Custom Reports', usage: 45 },
      ],
    });
  }

  // User data isolation - all operations require userId
  async getUserData(userId: string): Promise<UserData | null> {
    await this.delay(200);
    
    if (!this.isAuthorized(userId)) {
      throw new Error('Unauthorized access');
    }
    
    return this.userData.get(userId) || null;
  }

  async createUserAgent(userId: string, agent: Omit<Agent, 'id'>): Promise<Agent> {
    await this.delay(500);
    
    if (!this.isAuthorized(userId)) {
      throw new Error('Unauthorized access');
    }

    // Check subscription limits
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const userData = this.userData.get(userId);
    if (!userData) throw new Error('User data not found');

    const currentAgentCount = userData.agents.length;
    const agentLimit = user.subscription.features.maxAgents;
    
    if (agentLimit !== -1 && currentAgentCount >= agentLimit) {
      throw new Error(`Agent limit reached. Upgrade to create more agents. Current limit: ${agentLimit}`);
    }

    const newAgent: Agent = {
      ...agent,
      id: `${userId}_agent_${Date.now()}`,
      status: 'idle',
      lastUpdate: 'Just created',
      articlesCollected: 0,
    };

    userData.agents.push(newAgent);
    this.userData.set(userId, userData);

    return newAgent;
  }

  async updateUserAgent(userId: string, agentId: string, updates: Partial<Agent>): Promise<Agent> {
    await this.delay(300);
    
    if (!this.isAuthorized(userId)) {
      throw new Error('Unauthorized access');
    }

    const userData = this.userData.get(userId);
    if (!userData) throw new Error('User data not found');

    const agentIndex = userData.agents.findIndex(a => a.id === agentId && a.id.startsWith(userId));
    if (agentIndex === -1) {
      throw new Error('Agent not found or access denied');
    }

    userData.agents[agentIndex] = { ...userData.agents[agentIndex], ...updates };
    this.userData.set(userId, userData);

    return userData.agents[agentIndex];
  }

  async deleteUserAgent(userId: string, agentId: string): Promise<boolean> {
    await this.delay(200);
    
    if (!this.isAuthorized(userId)) {
      throw new Error('Unauthorized access');
    }

    const userData = this.userData.get(userId);
    if (!userData) throw new Error('User data not found');

    const agentIndex = userData.agents.findIndex(a => a.id === agentId && a.id.startsWith(userId));
    if (agentIndex === -1) {
      throw new Error('Agent not found or access denied');
    }

    userData.agents.splice(agentIndex, 1);
    this.userData.set(userId, userData);

    return true;
  }

  async saveUserArticle(userId: string, articleId: number): Promise<boolean> {
    await this.delay(200);
    
    if (!this.isAuthorized(userId)) {
      throw new Error('Unauthorized access');
    }

    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const userData = this.userData.get(userId);
    if (!userData) throw new Error('User data not found');

    // Check subscription limits
    const savedCount = userData.savedArticles.length;
    const savedLimit = user.subscription.limits.savedArticles;
    
    if (savedLimit !== -1 && savedCount >= savedLimit) {
      throw new Error(`Saved articles limit reached. Upgrade to save more articles. Current limit: ${savedLimit}`);
    }

    if (!userData.savedArticles.includes(articleId)) {
      userData.savedArticles.push(articleId);
      this.userData.set(userId, userData);
    }

    return true;
  }

  async addUserAnnotation(userId: string, articleId: number, annotation: string): Promise<boolean> {
    await this.delay(300);
    
    if (!this.isAuthorized(userId)) {
      throw new Error('Unauthorized access');
    }

    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const userData = this.userData.get(userId);
    if (!userData) throw new Error('User data not found');

    // Check subscription limits
    const totalAnnotations = Object.values(userData.annotations).flat().length;
    const annotationLimit = user.subscription.limits.annotations;
    
    if (annotationLimit !== -1 && totalAnnotations >= annotationLimit) {
      throw new Error(`Annotation limit reached. Upgrade to add more annotations. Current limit: ${annotationLimit}`);
    }

    if (!userData.annotations[articleId]) {
      userData.annotations[articleId] = [];
    }
    
    userData.annotations[articleId].push(annotation);
    this.userData.set(userId, userData);

    return true;
  }

  async trackUserUsage(userId: string, action: string, metadata?: any): Promise<void> {
    await this.delay(100);
    
    if (!this.isAuthorized(userId)) {
      throw new Error('Unauthorized access');
    }

    const userData = this.userData.get(userId);
    if (!userData) return;

    // Track usage for subscription limits and analytics
    if (!userData.usage) {
      userData.usage = {
        articlesViewed: 0,
        agentExecutions: 0,
        dataExported: 0,
        lastActivity: new Date(),
      };
    }

    switch (action) {
      case 'article_viewed':
        userData.usage.articlesViewed++;
        break;
      case 'agent_executed':
        userData.usage.agentExecutions++;
        break;
      case 'data_exported':
        userData.usage.dataExported++;
        break;
    }

    userData.usage.lastActivity = new Date();
    this.userData.set(userId, userData);
  }

  // Admin-only functions
  async getAdminAnalytics(adminUserId: string): Promise<any> {
    await this.delay(500);
    
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    return this.adminData.get('analytics');
  }

  async getAllUsers(adminUserId: string): Promise<User[]> {
    await this.delay(800);
    
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    // Mock user list for admin
    return [
      {
        id: 'user_123',
        email: 'sarah.johnson@company.com',
        name: 'Sarah Johnson',
        role: 'user',
        subscription: authService.getSubscriptionTiers()[0],
        subscriptionStatus: 'trial',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastLoginAt: new Date(),
        preferences: {} as any,
        usage: {} as any,
      },
      // Add more mock users...
    ];
  }

  async updateUserSubscription(adminUserId: string, userId: string, subscriptionId: string): Promise<boolean> {
    await this.delay(400);
    
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    // Mock subscription update
    return true;
  }

  // Security and authorization
  private isAuthorized(userId: string): boolean {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return false;
    
    // Users can only access their own data, admins can access any data
    return currentUser.id === userId || currentUser.role === 'admin';
  }

  // Data export with subscription checks
  async exportUserData(userId: string, format: 'json' | 'csv'): Promise<any> {
    await this.delay(1000);
    
    if (!this.isAuthorized(userId)) {
      throw new Error('Unauthorized access');
    }

    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user has export feature
    if (!user.subscription.features.exportData) {
      throw new Error('Data export not available in your subscription plan. Please upgrade to access this feature.');
    }

    const userData = this.userData.get(userId);
    if (!userData) throw new Error('User data not found');

    // Track usage
    await this.trackUserUsage(userId, 'data_exported');

    return {
      format,
      data: userData,
      exportedAt: new Date(),
      userId,
    };
  }

  // Cleanup and maintenance
  async cleanupExpiredData(): Promise<void> {
    // Clean up data based on subscription retention limits
    for (const [userId, userData] of this.userData.entries()) {
      const user = authService.getCurrentUser();
      if (!user) continue;

      const retentionDays = user.subscription.limits.dataRetentionDays;
      if (retentionDays === -1) continue; // Unlimited retention

      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      // Remove old articles, annotations, etc.
      // Implementation would depend on data structure
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const databaseService = new DatabaseService();