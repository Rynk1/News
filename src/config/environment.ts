// Environment variables configuration for real-world deployment
export const config = {
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/newsintel',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // AI Services
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4',
  
  // News APIs
  NEWS_API_KEY: process.env.NEWS_API_KEY,
  SERP_API_KEY: process.env.SERP_API_KEY,
  RAPID_API_KEY: process.env.RAPID_API_KEY,
  
  // Payment Processing
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Email Services
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@newsintel.com',
  
  // Monitoring & Analytics
  SENTRY_DSN: process.env.SENTRY_DSN,
  MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN,
  
  // Server Configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // File Storage
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  
  // Webhooks
  WEBHOOK_URL: process.env.WEBHOOK_URL,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  
  // Feature Flags
  ENABLE_REAL_TIME_MONITORING: process.env.ENABLE_REAL_TIME_MONITORING === 'true',
  ENABLE_AI_SYNTHESIS: process.env.ENABLE_AI_SYNTHESIS === 'true',
  ENABLE_ADVANCED_ANALYTICS: process.env.ENABLE_ADVANCED_ANALYTICS === 'true',
  
  // Security
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'your-cookie-secret',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'combined',
};

// Validation function to ensure required environment variables are set
export function validateConfig() {
  const requiredVars = [
    'JWT_SECRET',
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'NEWS_API_KEY',
    'STRIPE_SECRET_KEY',
    'SENDGRID_API_KEY',
  ];

  const missingVars = requiredVars.filter(varName => !config[varName as keyof typeof config]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  console.log('✅ All required environment variables are configured');
}

// Development vs Production configuration
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH: '/api/auth/refresh',
  VERIFY_EMAIL: '/api/auth/verify-email',
  RESET_PASSWORD: '/api/auth/reset-password',
  
  // Users
  USERS: '/api/users',
  USER_PROFILE: '/api/users/profile',
  USER_PREFERENCES: '/api/users/preferences',
  
  // Agents
  AGENTS: '/api/agents',
  AGENT_DEPLOY: '/api/agents/deploy',
  AGENT_EXECUTE: '/api/agents/execute',
  AGENT_MONITOR: '/api/agents/monitor',
  
  // Articles
  ARTICLES: '/api/articles',
  ARTICLES_SEARCH: '/api/articles/search',
  ARTICLES_SAVE: '/api/articles/save',
  ARTICLES_ANNOTATE: '/api/articles/annotate',
  
  // Subscriptions
  SUBSCRIPTIONS: '/api/subscriptions',
  SUBSCRIPTION_UPGRADE: '/api/subscriptions/upgrade',
  SUBSCRIPTION_CANCEL: '/api/subscriptions/cancel',
  
  // Admin
  ADMIN_DASHBOARD: '/api/admin/dashboard',
  ADMIN_USERS: '/api/admin/users',
  ADMIN_ANALYTICS: '/api/admin/analytics',
  ADMIN_SYSTEM: '/api/admin/system',
  
  // Webhooks
  STRIPE_WEBHOOK: '/api/webhooks/stripe',
  AGENT_WEBHOOK: '/api/webhooks/agent',
};

// Database table names
export const DB_TABLES = {
  USERS: 'users',
  AGENTS: 'agents',
  ARTICLES: 'articles',
  SUBSCRIPTIONS: 'subscriptions',
  USER_SESSIONS: 'user_sessions',
  AGENT_TASKS: 'agent_tasks',
  USAGE_STATS: 'usage_stats',
  SYSTEM_LOGS: 'system_logs',
};

// Redis keys
export const REDIS_KEYS = {
  USER_SESSION: (userId: string) => `session:${userId}`,
  RATE_LIMIT: (ip: string) => `rate_limit:${ip}`,
  AGENT_CACHE: (agentId: string) => `agent:${agentId}`,
  ARTICLE_CACHE: (articleId: string) => `article:${articleId}`,
};

export default config;