// ---------------------------------------------------------------------------
// Database row types for NewsIntel.
//
// Hand-written to match `supabase/migrations/0001_init.sql` so the frontend
// compiles even without a live Supabase project. When a project is available,
// regenerate canonical types with:  npm run types:supabase
// (keep this file in sync with the migrations).
// ---------------------------------------------------------------------------

export interface ProfileRow {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  subscription_tier: "free" | "starter" | "professional" | "enterprise";
  subscription_status: "active" | "inactive" | "trial" | "expired";
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  preferences: Record<string, unknown> | null;
  usage: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  last_login_at: string;
}

export interface AgentRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  sources: string[] | null;
  topics: string[] | null;
  entities: string[] | null;
  frequency: "hourly" | "daily" | "weekly";
  status: "active" | "idle" | "error";
  articles_collected: number | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleRow {
  id: string;
  user_id: string;
  agent_id: string | null;
  title: string;
  source: string;
  url: string | null;
  summary: string;
  key_points: string[] | null;
  implications: string;
  category: string;
  sentiment: "positive" | "negative" | "neutral";
  image_url: string | null;
  published_at: string | null;
  created_at: string;
}

export interface SavedArticleRow {
  user_id: string;
  article_id: string;
  created_at: string;
}

export interface AnnotationRow {
  id: string;
  user_id: string;
  article_id: string;
  body: string;
  created_at: string;
}

export interface UsageEventRow {
  id: string;
  user_id: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalAgents: number;
  totalArticles: number;
  monthlyRevenue: number;
  subscriptionDistribution: {
    free: number;
    starter: number;
    professional: number;
    enterprise: number;
  };
}