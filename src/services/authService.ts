// Authentication and user management service
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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

const defaultPreferences: UserPreferences = {
  theme: 'light',
  emailNotifications: true,
  pushNotifications: true,
  weeklyDigest: true,
  language: 'en',
  timezone: 'America/New_York',
};

function defaultUsage(): UsageStats {
  return {
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
  };
}

type AuthListener = (user: User | null) => void;

class AuthService {
  private currentUser: User | null = null;
  private listeners: Set<AuthListener> = new Set();
  private initialized = false;
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

  get usesBackend(): boolean {
    return isSupabaseConfigured;
  }

  /** Subscribe to auth-state changes. Returns an unsubscribe function. */
  onChange(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) listener(this.currentUser);
  }

  /**
   * Load the current session (Supabase) or the demo user (fallback) and start
   * listening for auth changes. Safe to call more than once.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    if (!isSupabaseConfigured || !supabase) {
      this.initializeMockUser();
      this.notify();
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      await this.loadProfile(session.user.id, session.user.email ?? "");
    }

    supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (nextSession?.user) {
        await this.loadProfile(
          nextSession.user.id,
          nextSession.user.email ?? "",
        );
      } else {
        this.currentUser = null;
        this.notify();
      }
    });
  }

  private mapProfileToUser(row: {
    id: string;
    email: string;
    name: string;
    role: string;
    subscription_tier: string;
    subscription_status: string;
    trial_ends_at: string | null;
    subscription_ends_at: string | null;
    preferences: Partial<UserPreferences> | null;
    usage: Partial<UsageStats> | null;
    created_at: string;
    last_login_at: string;
  }): User {
    const tier =
      this.subscriptionTiers.find((t) => t.name === row.subscription_tier) ??
      this.subscriptionTiers[0];

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role === "admin" ? "admin" : "user",
      subscription: tier,
      subscriptionStatus:
        (row.subscription_status as User["subscriptionStatus"]) ?? "trial",
      trialEndsAt: row.trial_ends_at ? new Date(row.trial_ends_at) : undefined,
      subscriptionEndsAt: row.subscription_ends_at
        ? new Date(row.subscription_ends_at)
        : undefined,
      createdAt: new Date(row.created_at),
      lastLoginAt: new Date(row.last_login_at),
      preferences: { ...defaultPreferences, ...(row.preferences ?? {}) },
      usage: {
        ...defaultUsage(),
        ...(row.usage ?? {}),
        monthlyUsage: {
          ...defaultUsage().monthlyUsage,
          ...(row.usage?.monthlyUsage ?? {}),
        },
      },
    };
  }

  private async loadProfile(userId: string, email: string): Promise<void> {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      // Profile row may not exist yet immediately after signup; fall back to a
      // minimal user so the app can render.
      this.currentUser = {
        id: userId,
        email,
        name: email.split("@")[0],
        role: "user",
        subscription: this.subscriptionTiers[0],
        subscriptionStatus: "trial",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        lastLoginAt: new Date(),
        preferences: { ...defaultPreferences },
        usage: defaultUsage(),
      };
    } else {
      this.currentUser = this.mapProfileToUser(data);
    }
    this.notify();
  }

  private initializeMockUser() {
    // Mock user for demo - in real app this would come from authentication
    this.currentUser = {
      id: 'user_123',
      email: 'sarah.johnson@company.com',
      name: 'Sarah Johnson',
      role: 'user',
      subscription: this.subscriptionTiers[2], // Professional tier (demo fallback) so all agent actions are usable
      subscriptionStatus: 'active',
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
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.user) {
        return { success: false, error: error?.message ?? "Invalid credentials" };
      }
      await this.loadProfile(data.user.id, data.user.email ?? email);
      return { success: true, user: this.currentUser ?? undefined };
    }

    // Demo fallback - accepts any non-empty credentials.
    await this.delay(1000);
    if (email && password) {
      if (!this.currentUser) this.initializeMockUser();
      this.currentUser!.lastLoginAt = new Date();
      this.notify();
      return { success: true, user: this.currentUser! };
    }
    return { success: false, error: 'Invalid credentials' };
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: { data: { name: userData.name } },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      // With email confirmation enabled there is no session yet.
      if (data.session?.user) {
        await this.loadProfile(data.session.user.id, data.session.user.email ?? userData.email);
      }
      return { success: true, user: this.currentUser ?? undefined };
    }

    await this.delay(1500);

    // Demo fallback registration
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
    this.notify();
    return { success: true, user: newUser };
  }

  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    this.currentUser = null;
    this.notify();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getSubscriptionTiers(): SubscriptionTier[] {
    return this.subscriptionTiers;
  }

  async upgradeSubscription(tierId: string): Promise<{ success: boolean; error?: string }> {
    const tier = this.subscriptionTiers.find(t => t.id === tierId);
    if (!tier || !this.currentUser) {
      return { success: false, error: 'Invalid subscription tier' };
    }

    const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_tier: tier.name,
          subscription_status: "active",
          subscription_ends_at: subscriptionEndsAt.toISOString(),
        })
        .eq("id", this.currentUser.id);
      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      await this.delay(2000);
    }

    this.currentUser.subscription = tier;
    this.currentUser.subscriptionStatus = 'active';
    this.currentUser.subscriptionEndsAt = subscriptionEndsAt;
    this.notify();

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