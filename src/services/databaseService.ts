// Database service with user isolation and subscription management
import { User, authService } from './authService';
import { Agent, Article, TrendingTopic, SentimentData, newsDataService } from './newsDataService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  AnnotationRow,
  ArticleRow,
  SavedArticleRow,
  AdminAnalytics,
} from '@/types/supabase';
import { mockScrape, trendingFromArticles, toArticle } from '@/services/ingestion/pipeline';

interface AgentRow {
  id: string;
  name: string;
  description: string | null;
  sources: string[] | null;
  topics: string[] | null;
  entities: string[] | null;
  frequency: string;
  status: 'active' | 'idle' | 'error';
  articles_collected: number | null;
  last_run_at: string | null;
  updated_at: string | null;
}

function mapRowToAgent(row: AgentRow): Agent {
  const lastRun = row.last_run_at ?? row.updated_at;
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    sources: row.sources ?? [],
    topics: row.topics ?? [],
    entities: row.entities ?? [],
    frequency: row.frequency,
    status: row.status,
    lastUpdate: lastRun ? new Date(lastRun).toLocaleString() : 'Never',
    articlesCollected: row.articles_collected ?? 0,
  };
}

function mapRowToArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    source: row.source,
    date: row.published_at
      ? new Date(row.published_at).toLocaleString()
      : new Date(row.created_at).toLocaleString(),
    sentiment: row.sentiment,
    category: row.category,
    keyPoints: row.key_points ?? [],
    implications: row.implications,
    summary: row.summary,
    imageUrl: row.image_url ?? "",
    articleUrl: row.url ?? undefined,
  };
}

interface AnnotatedArticle extends Article {
  saved?: boolean;
}

export interface UserData {
  userId: string;
  agents: Agent[];
  articles: Article[];
  savedArticles: string[];
  annotations: { [articleId: string]: string[] };
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
    const seedArticles = newsDataService.getBaseArticles();
    this.userData.set(mockUserId, {
      userId: mockUserId,
      articles: seedArticles,
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
    if (isSupabaseConfigured && supabase) {
      const [agentsRes, articlesRes, savedRes, annotationsRes] =
        await Promise.all([
          supabase.from('agents').select('*').eq('user_id', userId).order('created_at'),
          supabase.from('articles').select('*').eq('user_id', userId).order('published_at', { ascending: false }),
          supabase.from('saved_articles').select('article_id').eq('user_id', userId),
          supabase.from('annotations').select('*').eq('user_id', userId).order('created_at'),
        ]);

      for (const res of [agentsRes, articlesRes, savedRes, annotationsRes]) {
        if (res.error) throw new Error(res.error.message);
      }

      const savedIds = (savedRes.data as SavedArticleRow[]).map((r) => r.article_id);
      const annotations: Record<string, string[]> = {};
      for (const a of annotationsRes.data as AnnotationRow[]) {
        annotations[a.article_id] = [...(annotations[a.article_id] ?? []), a.body];
      }

      return {
        userId,
        agents: (agentsRes.data as AgentRow[]).map(mapRowToAgent),
        articles: (articlesRes.data as ArticleRow[]).map(mapRowToArticle),
        savedArticles: savedIds,
        annotations,
        preferences: {},
        usage: {},
      };
    }

    await this.delay(200);

    if (!this.isAuthorized(userId)) {
      throw new Error('Unauthorized access');
    }

    return this.userData.get(userId) || null;
  }

  /**
   * Return the articles visible in the dashboard for a user. Supabase mode
   * reads the `articles` table and decorates each row with saved/annotation
   * state; demo mode returns the in-memory store.
   */
  async getArticles(
    userId: string,
    filters?: { category?: string; sentiment?: string; search?: string },
  ): Promise<Article[]> {
    let articles: AnnotatedArticle[];

    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('articles')
        .select('*')
        .eq('user_id', userId)
        .order('published_at', { ascending: false });
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters?.sentiment && filters.sentiment !== 'all') {
        query = query.eq('sentiment', filters.sentiment);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      articles = (data as ArticleRow[]).map(mapRowToArticle);

      const savedRes = await supabase
        .from('saved_articles')
        .select('article_id')
        .eq('user_id', userId);
      if (savedRes.error) throw new Error(savedRes.error.message);
      const savedIds = new Set(
        (savedRes.data as SavedArticleRow[]).map((r) => r.article_id),
      );

      const annRes = await supabase
        .from('annotations')
        .select('*')
        .eq('user_id', userId);
      if (annRes.error) throw new Error(annRes.error.message);
      const annotations: Record<string, string[]> = {};
      for (const a of annRes.data as AnnotationRow[]) {
        annotations[a.article_id] = [...(annotations[a.article_id] ?? []), a.body];
      }

      articles = articles.map((a) => ({
        ...a,
        saved: savedIds.has(a.id),
        annotations: annotations[a.id] ?? [],
      }));
    } else {
      const userData = this.userData.get(userId);
      articles = (userData?.articles ?? []).map((a) => ({
        ...a,
        saved: userData?.savedArticles.includes(a.id) ?? false,
        annotations: userData?.annotations[a.id] ?? [],
      }));
    }

    // Search filter applies in both modes.
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.keyPoints.some((p) => p.toLowerCase().includes(q)),
      );
    }

    return articles;
  }

  /** Aggregate trending topics from the user's stored articles. */
  async getTrendingTopics(userId: string): Promise<TrendingTopic[]> {
    const articles = await this.getArticles(userId);
    return trendingFromArticles(articles);
  }

  /** Aggregate sentiment percentages from the user's stored articles. */
  async getSentimentData(userId: string): Promise<SentimentData> {
    const articles = await this.getArticles(userId);
    const total = articles.length || 1;
    const positive = Math.round(
      (articles.filter((a) => a.sentiment === 'positive').length / total) * 100,
    );
    const negative = Math.round(
      (articles.filter((a) => a.sentiment === 'negative').length / total) * 100,
    );
    return {
      positive,
      negative,
      neutral: Math.max(0, 100 - positive - negative),
    };
  }

  /** Convenience: list the current user's agents. */
  async listAgents(userId: string): Promise<Agent[]> {
    const data = await this.getUserData(userId);
    return data?.agents ?? [];
  }

  async createUserAgent(userId: string, agent: Omit<Agent, 'id'>): Promise<Agent> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    const agentLimit = user.subscription.features.maxAgents;

    if (isSupabaseConfigured && supabase) {
      const { count, error: countError } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (countError) throw new Error(countError.message);
      if (agentLimit !== -1 && (count ?? 0) >= agentLimit) {
        throw new Error(`Agent limit reached. Upgrade to create more agents. Current limit: ${agentLimit}`);
      }

      const { data, error } = await supabase
        .from('agents')
        .insert({
          user_id: userId,
          name: agent.name,
          description: agent.description,
          sources: agent.sources,
          topics: agent.topics,
          entities: agent.entities,
          frequency: agent.frequency,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return mapRowToAgent(data as AgentRow);
    }

    await this.delay(500);

    if (!this.isAuthorized(userId)) {
      throw new Error('Unauthorized access');
    }

    const userData = this.userData.get(userId);
    if (!userData) throw new Error('User data not found');

    const currentAgentCount = userData.agents.length;
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
    if (isSupabaseConfigured && supabase) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.sources !== undefined) dbUpdates.sources = updates.sources;
      if (updates.topics !== undefined) dbUpdates.topics = updates.topics;
      if (updates.entities !== undefined) dbUpdates.entities = updates.entities;
      if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.articlesCollected !== undefined) dbUpdates.articles_collected = updates.articlesCollected;

      const { data, error } = await supabase
        .from('agents')
        .update(dbUpdates)
        .eq('id', agentId)
        .eq('user_id', userId)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return mapRowToAgent(data as AgentRow);
    }

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
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId)
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
      return true;
    }

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

  async saveUserArticle(userId: string, articleId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      // Toggle behavior: remove when already saved.
      const { data: existing, error: qError } = await supabase
        .from('saved_articles')
        .select('article_id')
        .eq('user_id', userId)
        .eq('article_id', articleId)
        .maybeSingle();
      if (qError) throw new Error(qError.message);

      if (existing) {
        const { error } = await supabase
          .from('saved_articles')
          .delete()
          .eq('user_id', userId)
          .eq('article_id', articleId);
        if (error) throw new Error(error.message);
        return true;
      }

      const user = authService.getCurrentUser();
      const userData = await this.getUserData(userId);
      const savedLimit = user?.subscription.limits.savedArticles ?? 10;
      if (
        savedLimit !== -1 &&
        (userData?.savedArticles.length ?? 0) >= savedLimit
      ) {
        throw new Error(`Saved articles limit reached. Upgrade to save more articles. Current limit: ${savedLimit}`);
      }

      const { error } = await supabase
        .from('saved_articles')
        .insert({ user_id: userId, article_id: articleId });
      if (error) throw new Error(error.message);
      return true;
    }

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

  /** Insert article rows (from the ingestion pipeline) when Supabase is on. */
  async insertArticles(
    userId: string,
    articles: Array<{
      title: string;
      source: string;
      url?: string | null;
      summary: string;
      keyPoints: string[];
      implications: string;
      category: string;
      sentiment: Article["sentiment"];
      imageUrl?: string;
      articleUrl?: string;
      publishedAt?: Date;
    }>,
    agentId?: string,
  ): Promise<string[]> {
    if (!isSupabaseConfigured || !supabase) {
      // Demo fallback: append the pipeline output to the in-memory store so
      // scraped articles show up in the dashboard without Supabase configured.
      const userData = this.userData.get(userId);
      if (!userData) throw new Error("User data not found");
      const inserted: Article[] = [];
      const insertedIds: string[] = [];
      for (const a of articles) {
        const id = `ingested_${userId}_${Date.now()}_${insertedIds.length}`;
        insertedIds.push(id);
        inserted.push({
          id,
          title: a.title,
          source: a.source,
          date: (a.publishedAt ?? new Date()).toLocaleString(),
          sentiment: a.sentiment,
          category: a.category,
          keyPoints: a.keyPoints ?? [],
          implications: a.implications ?? "",
          summary: a.summary,
          imageUrl: a.imageUrl ?? "",
          articleUrl: a.articleUrl ?? a.url ?? undefined,
        });
      }
      // Newest ingested articles first so the dashboard picks them up.
      userData.articles = [...inserted, ...userData.articles];
      this.userData.set(userId, userData);
      return insertedIds;
    }

    const rows = articles.map((a) => ({
      user_id: userId,
      agent_id: agentId ?? null,
      title: a.title,
      source: a.source,
      url: a.url ?? a.articleUrl ?? null,
      summary: a.summary,
      key_points: a.keyPoints ?? [],
      implications: a.implications ?? "",
      category: a.category ?? "tech",
      sentiment: a.sentiment ?? "neutral",
      image_url: a.imageUrl ?? null,
      published_at: (a.publishedAt ?? new Date()).toISOString(),
    }));

    const { data, error } = await supabase
      .from("articles")
      .insert(rows)
      .select("id");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => (r as { id: string }).id);
  }

  async addUserAnnotation(
    userId: string,
    articleId: string,
    annotation: string,
  ): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("annotations")
        .insert({ user_id: userId, article_id: articleId, body: annotation });
      if (error) throw new Error(error.message);
      return true;
    }

    await this.delay(300);

    if (!this.isAuthorized(userId)) {
      throw new Error("Unauthorized access");
    }

    const user = authService.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const userData = this.userData.get(userId);
    if (!userData) throw new Error("User data not found");

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
    if (isSupabaseConfigured && supabase) {
      await supabase.from("usage_events").insert({
        user_id: userId,
        action,
        metadata: metadata ?? {},
      });
      return;
    }

    await this.delay(100);

    if (!this.isAuthorized(userId)) {
      throw new Error("Unauthorized access");
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
      case "article_viewed":
        userData.usage.articlesViewed++;
        break;
      case "agent_executed":
        userData.usage.agentExecutions++;
        break;
      case "data_exported":
        userData.usage.dataExported++;
        break;
    }

    userData.usage.lastActivity = new Date();
    this.userData.set(userId, userData);
  }

  // Admin-only functions
  async getAdminAnalytics(adminUserId: string): Promise<any> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    if (isSupabaseConfigured && supabase) {
      const normalize = <T,>(res: { data: T | null; error: unknown }) => {
        if (res.error) throw new Error(String(res.error));
        return res.data ?? [];
      };

      try {
        const [profileRes, adminAgentsRes, adminArticlesRes, usageRes] =
          await Promise.all([
            supabase.from("profiles").select("role, subscription_tier, subscription_status"),
            supabase.from("agents").select("id"),
            supabase.from("articles").select("id"),
            supabase.from("usage_events").select("action", { count: "exact", head: true }),
          ]);
        const profiles = normalize(profileRes);
        const activeUsers = profiles.filter((p) => p.role === "user").length;
        const subDist = { free: 0, starter: 0, professional: 0, enterprise: 0 };
        for (const p of profiles) {
          const tier = p.subscription_tier as keyof typeof subDist;
          if (tier in subDist) subDist[tier]++;
        }
        return {
          totalUsers: profiles.length,
          activeUsers,
          totalAgents: normalize(adminAgentsRes).length,
          totalArticles: normalize(adminArticlesRes).length,
          monthlyRevenue: Math.round(
            (subDist.starter * 29 + subDist.professional * 99 + subDist.enterprise * 299) * 0.9,
          ),
          subscriptionDistribution: subDist,
          totalUsageEvents: usageRes.count ?? 0,
        };
      } catch (err) {
        // Supabase may not have an admin policy; fall back to demo data.
        return { ...this.adminData.get("analytics"), demo: true };
      }
    }

    await this.delay(500);

    return this.adminData.get("analytics");
  }

  async getAllUsers(adminUserId: string): Promise<User[]> {
    await this.delay(400);

    const user = authService.getCurrentUser();
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role === "admin" ? "admin" : "user",
        subscription: authService.getSubscriptionTiers().find((t) => t.name === row.subscription_tier) ?? authService.getSubscriptionTiers()[0],
        subscriptionStatus: row.subscription_status,
        createdAt: new Date(row.created_at),
        lastLoginAt: new Date(row.last_login_at),
        preferences: row.preferences ?? {},
        usage: row.usage ?? {},
      }));
    }

    // Mock user list for admin
    return [
      {
        id: "user_123",
        email: "sarah.johnson@company.com",
        name: "Sarah Johnson",
        role: "user",
        subscription: authService.getSubscriptionTiers()[0],
        subscriptionStatus: "trial",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastLoginAt: new Date(),
        preferences: {} as any,
        usage: {} as any,
      },
      {
        id: "user_456",
        email: "john.doe@startup.com",
        name: "John Doe",
        role: "user",
        subscription: authService.getSubscriptionTiers()[1],
        subscriptionStatus: "active",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastLoginAt: new Date(),
        preferences: {} as any,
        usage: {} as any,
      },
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