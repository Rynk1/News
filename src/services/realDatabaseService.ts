// Real database service with PostgreSQL, Redis, and proper data isolation
import { Pool } from 'pg';
import Redis from 'ioredis';
import { config, DB_TABLES, REDIS_KEYS } from '../config/environment';
import { User, SubscriptionTier } from '../services/realAuthService';
import { Agent, Article } from '../services/newsDataService';

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

class RealDatabaseService {
  private pgPool: Pool;
  private redis: Redis;

  constructor() {
    // Initialize PostgreSQL connection pool
    this.pgPool = new Pool({
      connectionString: config.DATABASE_URL,
      ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Initialize Redis connection
    this.redis = new Redis(config.REDIS_URL, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      // Create tables if they don't exist
      await this.createTables();
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
    }
  }

  private async createTables() {
    const queries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS ${DB_TABLES.USERS} (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        subscription_tier VARCHAR(50) DEFAULT 'free',
        subscription_status VARCHAR(50) DEFAULT 'trial',
        trial_ends_at TIMESTAMP,
        subscription_ends_at TIMESTAMP,
        email_verified BOOLEAN DEFAULT FALSE,
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        stripe_customer_id VARCHAR(255),
        preferences JSONB DEFAULT '{}',
        usage_stats JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
      )`,

      // Agents table
      `CREATE TABLE IF NOT EXISTS ${DB_TABLES.AGENTS} (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES ${DB_TABLES.USERS}(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        sources JSONB DEFAULT '[]',
        topics JSONB DEFAULT '[]',
        entities JSONB DEFAULT '[]',
        frequency VARCHAR(50) DEFAULT 'daily',
        status VARCHAR(50) DEFAULT 'idle',
        last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        articles_collected INTEGER DEFAULT 0,
        configuration JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Articles table
      `CREATE TABLE IF NOT EXISTS ${DB_TABLES.ARTICLES} (
        id SERIAL PRIMARY KEY,
        agent_id VARCHAR(255) REFERENCES ${DB_TABLES.AGENTS}(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL REFERENCES ${DB_TABLES.USERS}(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT,
        summary TEXT,
        url VARCHAR(500),
        source VARCHAR(255),
        author VARCHAR(255),
        publish_date TIMESTAMP,
        sentiment VARCHAR(50),
        relevance_score DECIMAL(3,2),
        source_reliability DECIMAL(3,2),
        reading_time INTEGER,
        tags JSONB DEFAULT '[]',
        key_points JSONB DEFAULT '[]',
        business_implications TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // User sessions table
      `CREATE TABLE IF NOT EXISTS ${DB_TABLES.USER_SESSIONS} (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES ${DB_TABLES.USERS}(id) ON DELETE CASCADE,
        refresh_token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address INET,
        user_agent TEXT
      )`,

      // Agent tasks table
      `CREATE TABLE IF NOT EXISTS ${DB_TABLES.AGENT_TASKS} (
        id VARCHAR(255) PRIMARY KEY,
        agent_id VARCHAR(255) NOT NULL REFERENCES ${DB_TABLES.AGENTS}(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL REFERENCES ${DB_TABLES.USERS}(id) ON DELETE CASCADE,
        task_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        results JSONB,
        error_message TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )`,

      // Usage stats table
      `CREATE TABLE IF NOT EXISTS ${DB_TABLES.USAGE_STATS} (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES ${DB_TABLES.USERS}(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        articles_viewed INTEGER DEFAULT 0,
        agent_executions INTEGER DEFAULT 0,
        data_exported INTEGER DEFAULT 0,
        annotations_made INTEGER DEFAULT 0,
        articles_shared INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date)
      )`,

      // Saved articles table
      `CREATE TABLE IF NOT EXISTS saved_articles (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES ${DB_TABLES.USERS}(id) ON DELETE CASCADE,
        article_id INTEGER NOT NULL REFERENCES ${DB_TABLES.ARTICLES}(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, article_id)
      )`,

      // Article annotations table
      `CREATE TABLE IF NOT EXISTS article_annotations (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES ${DB_TABLES.USERS}(id) ON DELETE CASCADE,
        article_id INTEGER NOT NULL REFERENCES ${DB_TABLES.ARTICLES}(id) ON DELETE CASCADE,
        annotation TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // System logs table
      `CREATE TABLE IF NOT EXISTS ${DB_TABLES.SYSTEM_LOGS} (
        id SERIAL PRIMARY KEY,
        level VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        metadata JSONB,
        user_id VARCHAR(255),
        ip_address INET,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    for (const query of queries) {
      await this.pgPool.query(query);
    }

    // Create indexes for better performance
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_users_email ON ${DB_TABLES.USERS}(email)`,
      `CREATE INDEX IF NOT EXISTS idx_agents_user_id ON ${DB_TABLES.AGENTS}(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_articles_user_id ON ${DB_TABLES.ARTICLES}(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_articles_agent_id ON ${DB_TABLES.ARTICLES}(agent_id)`,
      `CREATE INDEX IF NOT EXISTS idx_usage_stats_user_date ON ${DB_TABLES.USAGE_STATS}(user_id, date)`,
      `CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON ${DB_TABLES.SYSTEM_LOGS}(created_at)`,
    ];

    for (const index of indexes) {
      await this.pgPool.query(index);
    }
  }

  // User management
  async createUser(userData: Partial<User>): Promise<User> {
    const client = await this.pgPool.connect();
    try {
      const query = `
        INSERT INTO ${DB_TABLES.USERS} 
        (id, email, name, password_hash, role, subscription_tier, subscription_status, 
         trial_ends_at, email_verified, preferences, usage_stats)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        userData.id,
        userData.email,
        userData.name,
        userData.passwordHash,
        userData.role || 'user',
        userData.subscription?.name || 'free',
        userData.subscriptionStatus || 'trial',
        userData.trialEndsAt,
        userData.emailVerified || false,
        JSON.stringify(userData.preferences || {}),
        JSON.stringify(userData.usage || {}),
      ];

      const result = await client.query(query, values);
      return this.mapDbUserToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    const client = await this.pgPool.connect();
    try {
      const query = `SELECT * FROM ${DB_TABLES.USERS} WHERE id = $1`;
      const result = await client.query(query, [userId]);
      
      if (result.rows.length === 0) return null;
      return this.mapDbUserToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const client = await this.pgPool.connect();
    try {
      const query = `SELECT * FROM ${DB_TABLES.USERS} WHERE email = $1`;
      const result = await client.query(query, [email]);
      
      if (result.rows.length === 0) return null;
      return this.mapDbUserToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const client = await this.pgPool.connect();
    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      if (updates.name) {
        setClause.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }
      if (updates.email) {
        setClause.push(`email = $${paramIndex++}`);
        values.push(updates.email);
      }
      if (updates.passwordHash) {
        setClause.push(`password_hash = $${paramIndex++}`);
        values.push(updates.passwordHash);
      }
      if (updates.subscription) {
        setClause.push(`subscription_tier = $${paramIndex++}`);
        values.push(updates.subscription.name);
      }
      if (updates.subscriptionStatus) {
        setClause.push(`subscription_status = $${paramIndex++}`);
        values.push(updates.subscriptionStatus);
      }
      if (updates.emailVerified !== undefined) {
        setClause.push(`email_verified = $${paramIndex++}`);
        values.push(updates.emailVerified);
      }
      if (updates.preferences) {
        setClause.push(`preferences = $${paramIndex++}`);
        values.push(JSON.stringify(updates.preferences));
      }
      if (updates.usage) {
        setClause.push(`usage_stats = $${paramIndex++}`);
        values.push(JSON.stringify(updates.usage));
      }

      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      const query = `
        UPDATE ${DB_TABLES.USERS} 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      return this.mapDbUserToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  // Agent management with user isolation
  async createAgent(userId: string, agentData: Omit<Agent, 'id'>): Promise<Agent> {
    const client = await this.pgPool.connect();
    try {
      // Verify user exists and check subscription limits
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');

      const agentId = `${userId}_agent_${Date.now()}`;
      
      const query = `
        INSERT INTO ${DB_TABLES.AGENTS} 
        (id, user_id, name, description, sources, topics, entities, frequency, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [
        agentId,
        userId,
        agentData.name,
        agentData.description,
        JSON.stringify(agentData.sources),
        JSON.stringify(agentData.topics),
        JSON.stringify(agentData.entities),
        agentData.frequency,
        agentData.status || 'idle',
      ];

      const result = await client.query(query, values);
      return this.mapDbAgentToAgent(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getUserAgents(userId: string): Promise<Agent[]> {
    const client = await this.pgPool.connect();
    try {
      const query = `SELECT * FROM ${DB_TABLES.AGENTS} WHERE user_id = $1 ORDER BY created_at DESC`;
      const result = await client.query(query, [userId]);
      
      return result.rows.map(row => this.mapDbAgentToAgent(row));
    } finally {
      client.release();
    }
  }

  async updateAgent(userId: string, agentId: string, updates: Partial<Agent>): Promise<Agent> {
    const client = await this.pgPool.connect();
    try {
      // Ensure user can only update their own agents
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      if (updates.name) {
        setClause.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }
      if (updates.description) {
        setClause.push(`description = $${paramIndex++}`);
        values.push(updates.description);
      }
      if (updates.sources) {
        setClause.push(`sources = $${paramIndex++}`);
        values.push(JSON.stringify(updates.sources));
      }
      if (updates.topics) {
        setClause.push(`topics = $${paramIndex++}`);
        values.push(JSON.stringify(updates.topics));
      }
      if (updates.entities) {
        setClause.push(`entities = $${paramIndex++}`);
        values.push(JSON.stringify(updates.entities));
      }
      if (updates.frequency) {
        setClause.push(`frequency = $${paramIndex++}`);
        values.push(updates.frequency);
      }
      if (updates.status) {
        setClause.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }

      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(agentId, userId);

      const query = `
        UPDATE ${DB_TABLES.AGENTS} 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('Agent not found or access denied');
      }
      
      return this.mapDbAgentToAgent(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async deleteAgent(userId: string, agentId: string): Promise<boolean> {
    const client = await this.pgPool.connect();
    try {
      const query = `DELETE FROM ${DB_TABLES.AGENTS} WHERE id = $1 AND user_id = $2`;
      const result = await client.query(query, [agentId, userId]);
      
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  // Article management
  async saveArticle(userId: string, articleData: Partial<Article>): Promise<Article> {
    const client = await this.pgPool.connect();
    try {
      const query = `
        INSERT INTO ${DB_TABLES.ARTICLES} 
        (agent_id, user_id, title, content, summary, url, source, author, 
         publish_date, sentiment, relevance_score, source_reliability, 
         reading_time, tags, key_points, business_implications)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `;
      
      const values = [
        articleData.agentId,
        userId,
        articleData.title,
        articleData.content,
        articleData.summary,
        articleData.url,
        articleData.source,
        articleData.author,
        articleData.publishDate,
        articleData.sentiment,
        articleData.relevanceScore,
        articleData.sourceReliability,
        articleData.readingTime,
        JSON.stringify(articleData.tags || []),
        JSON.stringify(articleData.keyPoints || []),
        articleData.businessImplications,
      ];

      const result = await client.query(query, values);
      return this.mapDbArticleToArticle(result.rows[0]);
    } finally {
      client.release();
    }
  }

  // Usage tracking
  async trackUsage(userId: string, action: string, metadata?: any): Promise<void> {
    const client = await this.pgPool.connect();
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Upsert usage stats for today
      const query = `
        INSERT INTO ${DB_TABLES.USAGE_STATS} (user_id, date, ${action})
        VALUES ($1, $2, 1)
        ON CONFLICT (user_id, date)
        DO UPDATE SET ${action} = ${DB_TABLES.USAGE_STATS}.${action} + 1
      `;
      
      await client.query(query, [userId, today]);

      // Cache in Redis for real-time access
      const cacheKey = REDIS_KEYS.USER_SESSION(userId);
      await this.redis.hincrby(cacheKey, `today_${action}`, 1);
      await this.redis.expire(cacheKey, 86400); // 24 hours
    } finally {
      client.release();
    }
  }

  // Admin functions
  async getAdminStats(): Promise<any> {
    const client = await this.pgPool.connect();
    try {
      const queries = await Promise.all([
        client.query(`SELECT COUNT(*) as total_users FROM ${DB_TABLES.USERS}`),
        client.query(`SELECT COUNT(*) as active_users FROM ${DB_TABLES.USERS} WHERE last_login_at > NOW() - INTERVAL '30 days'`),
        client.query(`SELECT subscription_tier, COUNT(*) as count FROM ${DB_TABLES.USERS} GROUP BY subscription_tier`),
        client.query(`SELECT COUNT(*) as total_agents FROM ${DB_TABLES.AGENTS}`),
        client.query(`SELECT COUNT(*) as total_articles FROM ${DB_TABLES.ARTICLES}`),
      ]);

      const [totalUsers, activeUsers, subscriptionDist, totalAgents, totalArticles] = queries;

      return {
        totalUsers: parseInt(totalUsers.rows[0].total_users),
        activeUsers: parseInt(activeUsers.rows[0].active_users),
        subscriptionDistribution: subscriptionDist.rows.reduce((acc, row) => {
          acc[row.subscription_tier] = parseInt(row.count);
          return acc;
        }, {}),
        totalAgents: parseInt(totalAgents.rows[0].total_agents),
        totalArticles: parseInt(totalArticles.rows[0].total_articles),
      };
    } finally {
      client.release();
    }
  }

  async getAllUsers(limit = 100, offset = 0): Promise<User[]> {
    const client = await this.pgPool.connect();
    try {
      const query = `
        SELECT * FROM ${DB_TABLES.USERS} 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      const result = await client.query(query, [limit, offset]);
      
      return result.rows.map(row => this.mapDbUserToUser(row));
    } finally {
      client.release();
    }
  }

  // Caching with Redis
  async cacheSet(key: string, value: any, ttl = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async cacheGet(key: string): Promise<any> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async cacheDelete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  // Utility methods
  private mapDbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      subscription: { name: dbUser.subscription_tier } as SubscriptionTier,
      subscriptionStatus: dbUser.subscription_status,
      trialEndsAt: dbUser.trial_ends_at,
      subscriptionEndsAt: dbUser.subscription_ends_at,
      createdAt: dbUser.created_at,
      lastLoginAt: dbUser.last_login_at,
      passwordHash: dbUser.password_hash,
      emailVerified: dbUser.email_verified,
      twoFactorEnabled: dbUser.two_factor_enabled,
      stripeCustomerId: dbUser.stripe_customer_id,
      preferences: dbUser.preferences || {},
      usage: dbUser.usage_stats || {},
    };
  }

  private mapDbAgentToAgent(dbAgent: any): Agent {
    return {
      id: dbAgent.id,
      name: dbAgent.name,
      description: dbAgent.description,
      sources: dbAgent.sources || [],
      topics: dbAgent.topics || [],
      entities: dbAgent.entities || [],
      frequency: dbAgent.frequency,
      status: dbAgent.status,
      lastUpdate: dbAgent.last_update,
      articlesCollected: dbAgent.articles_collected,
    };
  }

  private mapDbArticleToArticle(dbArticle: any): Article {
    return {
      id: dbArticle.id,
      title: dbArticle.title,
      content: dbArticle.content,
      summary: dbArticle.summary,
      url: dbArticle.url,
      source: dbArticle.source,
      author: dbArticle.author,
      publishDate: dbArticle.publish_date,
      sentiment: dbArticle.sentiment,
      relevanceScore: dbArticle.relevance_score,
      sourceReliability: dbArticle.source_reliability,
      readingTime: dbArticle.reading_time,
      tags: dbArticle.tags || [],
      keyPoints: dbArticle.key_points || [],
      businessImplications: dbArticle.business_implications,
    };
  }

  // Cleanup and maintenance
  async cleanup(): Promise<void> {
    await this.pgPool.end();
    await this.redis.disconnect();
  }
}

export const realDatabaseService = new RealDatabaseService();