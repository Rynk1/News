// Authentication and user management service
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  subscription: SubscriptionTier;
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'expired';
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: UserPreferences;
  usage: UsageStats;
}

export interface SubscriptionTier {
  id: string;
  name: 'free' | 'starter' | 'professional' | 'enterprise';
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: SubscriptionFeatures;
  limits: SubscriptionLimits;
}

export interface SubscriptionFeatures {
  maxAgents: number;
  maxSources: number;
  realTimeMonitoring: boolean;
  advancedAnalytics: boolean;
  customReports: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  whiteLabel: boolean;
  teamCollaboration: boolean;
  exportData: boolean;
  kindleReader: boolean;
  aiSynthesis: boolean;
}

export interface SubscriptionLimits {
  articlesPerMonth: number;
  agentExecutionsPerDay: number;
  savedArticles: number;
  annotations: number;
  dataRetentionDays: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  language: string;
  timezone: string;
}

export interface UsageStats {
  articlesRead: number;
  agentsCreated: number;
  annotationsMade: number;
  articlesShared: number;
  lastActiveDate: Date;
  monthlyUsage: {
    articlesViewed: number;
    agentExecutions: number;
    dataExported: number;
  };
}

class AuthService {
  private currentUser: User | null = null;
  private subscriptionTiers: SubscriptionTier[] = [
    {
      id: 'free',
      name: 'free',
      price: 0,
      billingCycle: 'monthly',
      features: {
        maxAgents: 1,
        maxSources: 3,
        realTimeMonitoring: false,
        advancedAnalytics: false,
        customReports: false,
        apiAccess: false,
        prioritySupport: false,
        whiteLabel: false,
        teamCollaboration: false,
        exportData: false,
        kindleReader: false,
        aiSynthesis: false,
      },
      limits: {
        articlesPerMonth: 50,
        agentExecutionsPerDay: 3,
        savedArticles: 10,
        annotations: 25,
        dataRetentionDays: 7,
      },
    },
    {
      id: 'starter',
      name: 'starter',
      price: 29,
      billingCycle: 'monthly',
      features: {
        maxAgents: 3,
        maxSources: 10,
        realTimeMonitoring: true,
        advancedAnalytics: true,
        customReports: false,
        apiAccess: false,
        prioritySupport: false,
        whiteLabel: false,
        teamCollaboration: false,
        exportData: true,
        kindleReader: true,
        aiSynthesis: true,
      },
      limits: {
        articlesPerMonth: 500,
        agentExecutionsPerDay: 20,
        savedArticles: 100,
        annotations: 200,
        dataRetentionDays: 30,
      },
    },
    {
      id: 'professional',
      name: 'professional',
      price: 99,
      billingCycle: 'monthly',
      features: {
        maxAgents: 10,
        maxSources: 50,
        realTimeMonitoring: true,
        advancedAnalytics: true,
        customReports: true,
        apiAccess: true,
        prioritySupport: true,
        whiteLabel: false,
        teamCollaboration: true,
        exportData: true,
        kindleReader: true,
        aiSynthesis: true,
      },
      limits: {
        articlesPerMonth: 2000,
        agentExecutionsPerDay: 100,
        savedArticles: 1000,
        annotations: 1000,
        dataRetentionDays: 90,
      },
    },
    {
      id: 'enterprise',
      name: 'enterprise',
      price: 299,
      billingCycle: 'monthly',
      features: {
        maxAgents: -1, // unlimited
        maxSources: -1, // unlimited
        realTimeMonitoring: true,
        advancedAnalytics: true,
        customReports: true,
        apiAccess: true,
        prioritySupport: true,
        whiteLabel: true,
        teamCollaboration: true,
        exportData: true,
        kindleReader: true,
        aiSynthesis: true,
      },
      limits: {
        articlesPerMonth: -1, // unlimited
        agentExecutionsPerDay: -1, // unlimited
        savedArticles: -1, // unlimited
        annotations: -1, // unlimited
        dataRetentionDays: 365,
      },
    },
  ];

  constructor() {
    this.initializeMockUser();
  }

  private initializeMockUser() {
    // Mock user for demo - in real app this would come from authentication
    this.currentUser = {
      id: 'user_123',
      email: 'sarah.johnson@company.com',
      name: 'Sarah Johnson',
      role: 'user',
      subscription: this.subscriptionTiers[0], // Free tier
      subscriptionStatus: 'trial',
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      lastLoginAt: new Date(),
      preferences: {
        theme: 'light',
        emailNotifications: true,
        pushNotifications: true,
        weeklyDigest: true,
        language: 'en',
        timezone: 'America/New_York',
      },
      usage: {
        articlesRead: 127,
        agentsCreated: 2,
        annotationsMade: 15,
        articlesShared: 8,
        lastActiveDate: new Date(),
        monthlyUsage: {
          articlesViewed: 45,
          agentExecutions: 12,
          dataExported: 2,
        },
      },
    };
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    // Mock login - in real app this would validate credentials
    await this.delay(1000);
    
    if (email && password) {
      this.currentUser!.lastLoginAt = new Date();
      return { success: true, user: this.currentUser! };
    }
    
    return { success: false, error: 'Invalid credentials' };
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    await this.delay(1500);
    
    // Mock registration
    const newUser: User = {
      id: `user_${Date.now()}`,
      email: userData.email,
      name: userData.name,
      role: 'user',
      subscription: this.subscriptionTiers[0], // Start with free tier
      subscriptionStatus: 'trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {
        theme: 'light',
        emailNotifications: true,
        pushNotifications: true,
        weeklyDigest: true,
        language: 'en',
        timezone: 'America/New_York',
      },
      usage: {
        articlesRead: 0,
        agentsCreated: 0,
        annotationsMade: 0,
        articlesShared: 0,
        lastActiveDate: new Date(),
        monthlyUsage: {
          articlesViewed: 0,
          agentExecutions: 0,
          dataExported: 0,
        },
      },
    };
    
    this.currentUser = newUser;
    return { success: true, user: newUser };
  }

  async logout(): Promise<void> {
    this.currentUser = null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getSubscriptionTiers(): SubscriptionTier[] {
    return this.subscriptionTiers;
  }

  async upgradeSubscription(tierId: string): Promise<{ success: boolean; error?: string }> {
    await this.delay(2000);
    
    const tier = this.subscriptionTiers.find(t => t.id === tierId);
    if (!tier || !this.currentUser) {
      return { success: false, error: 'Invalid subscription tier' };
    }
    
    this.currentUser.subscription = tier;
    this.currentUser.subscriptionStatus = 'active';
    this.currentUser.subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    return { success: true };
  }

  checkFeatureAccess(feature: keyof SubscriptionFeatures): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.subscription.features[feature] as boolean;
  }

  checkUsageLimit(limit: keyof SubscriptionLimits, currentUsage: number): {
    allowed: boolean;
    remaining: number;
    limit: number;
  } {
    if (!this.currentUser) {
      return { allowed: false, remaining: 0, limit: 0 };
    }
    
    const limitValue = this.currentUser.subscription.limits[limit] as number;
    
    // -1 means unlimited
    if (limitValue === -1) {
      return { allowed: true, remaining: -1, limit: -1 };
    }
    
    const remaining = Math.max(0, limitValue - currentUsage);
    return {
      allowed: remaining > 0,
      remaining,
      limit: limitValue,
    };
  }

  getTrialDaysRemaining(): number {
    if (!this.currentUser?.trialEndsAt) return 0;
    const now = new Date();
    const trialEnd = new Date(this.currentUser.trialEndsAt);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  isTrialExpired(): boolean {
    if (!this.currentUser?.trialEndsAt) return false;
    return new Date() > new Date(this.currentUser.trialEndsAt);
  }

  shouldShowUpgradePrompt(): boolean {
    if (!this.currentUser) return false;
    
    const trialDaysLeft = this.getTrialDaysRemaining();
    const isFreeTier = this.currentUser.subscription.name === 'free';
    const highUsage = this.currentUser.usage.monthlyUsage.articlesViewed > 30;
    
    return (trialDaysLeft <= 3 && trialDaysLeft > 0) || (isFreeTier && highUsage);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const authService = new AuthService();