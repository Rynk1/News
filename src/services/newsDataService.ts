// Mock data service for the news dashboard
export interface Article {
  id: string;
  title: string;
  source: string;
  date: string;
  sentiment: "positive" | "negative" | "neutral";
  category: string;
  keyPoints: string[];
  implications: string;
  summary: string;
  imageUrl: string;
  articleUrl?: string;
  saved?: boolean;
  annotations?: string[];
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  sources: string[];
  topics: string[];
  entities: string[];
  frequency: string;
  status: "active" | "idle" | "error";
  lastUpdate: string;
  articlesCollected: number;
}

export interface TrendingTopic {
  id: number;
  name: string;
  count: number;
  trend: "up" | "down" | "stable";
}

export interface SentimentData {
  positive: number;
  negative: number;
  neutral: number;
}

class NewsDataService {
  private articles: Article[] = [
    {
      id: "mock-1",
      title: "AI Regulation Framework Proposed by EU Commission",
      source: "Financial Times",
      date: "2 hours ago",
      sentiment: "neutral",
      category: "regulatory",
      keyPoints: [
        "EU Commission proposes new AI regulatory framework",
        "Framework focuses on high-risk AI applications",
        "Compliance deadline set for Q3 2024",
      ],
      implications: "May require adjustments to current AI development roadmap and compliance processes.",
      summary: "The European Union has unveiled comprehensive AI regulation proposals that could reshape how companies develop and deploy artificial intelligence systems across various industries.",
      imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80",
      articleUrl: "https://example.com/ai-regulation",
      saved: false,
      annotations: [],
    },
    {
      id: "mock-2",
      title: "Global Supply Chain Disruptions Expected to Continue Through 2024",
      source: "Bloomberg",
      date: "5 hours ago",
      sentiment: "negative",
      category: "market",
      keyPoints: [
        "Shipping costs increased by 25% since January",
        "Semiconductor shortages affecting multiple industries",
        "Asian manufacturing hubs facing continued challenges",
      ],
      implications: "Consider diversifying suppliers and increasing inventory buffers for critical components.",
      summary: "Supply chain experts warn that ongoing disruptions will persist well into 2024, with companies needing to adapt their procurement and inventory strategies.",
      imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80",
      articleUrl: "https://example.com/supply-chain",
      saved: false,
      annotations: [],
    },
    {
      id: "mock-3",
      title: "Major Tech Companies Announce New Sustainability Initiatives",
      source: "Reuters",
      date: "1 day ago",
      sentiment: "positive",
      category: "tech",
      keyPoints: [
        "Combined $5B investment in renewable energy infrastructure",
        "Carbon neutrality targets moved up by 5 years",
        "New partnerships with environmental organizations",
      ],
      implications: "Potential partnership opportunities for green initiatives and positive PR positioning.",
      summary: "Leading technology companies have announced ambitious new sustainability programs, signaling a major shift in corporate environmental responsibility.",
      imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&q=80",
      articleUrl: "https://example.com/sustainability",
      saved: false,
      annotations: [],
    },
    {
      id: "mock-4",
      title: "Competitor Analysis: Market Share Shifts in Cloud Computing",
      source: "Wall Street Journal",
      date: "2 days ago",
      sentiment: "neutral",
      category: "competitors",
      keyPoints: [
        "AWS maintains lead but growth rate slowing",
        "Microsoft Azure gains significant enterprise contracts",
        "Google Cloud focusing on AI-powered services",
      ],
      implications: "Opportunity to differentiate through specialized cloud services and competitive pricing.",
      summary: "The cloud computing landscape continues to evolve with significant market share movements among major providers, creating new opportunities for strategic positioning.",
      imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&q=80",
      articleUrl: "https://example.com/cloud-computing",
      saved: false,
      annotations: [],
    },
    {
      id: "mock-5",
      title: "Market Volatility Reaches Two-Year High Amid Economic Uncertainty",
      source: "CNBC",
      date: "3 days ago",
      sentiment: "negative",
      category: "market",
      keyPoints: [
        "VIX index at highest point since 2022",
        "Tech stocks particularly affected by selloffs",
        "Analysts predict continued uncertainty through Q2",
      ],
      implications: "Review investment strategy and consider hedging options for corporate treasury.",
      summary: "Financial markets are experiencing heightened volatility as investors grapple with economic uncertainty and changing monetary policy expectations.",
      imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80",
      articleUrl: "https://example.com/market-volatility",
      saved: false,
      annotations: [],
    },
    {
      id: "mock-6",
      title: "Remote Work Productivity Study Shows Surprising Results",
      source: "Harvard Business Review",
      date: "4 days ago",
      sentiment: "positive",
      category: "tech",
      keyPoints: [
        "Productivity increased 13% in fully remote teams",
        "Work satisfaction scores higher for flexible arrangements",
        "Specific collaboration tools correlated with better outcomes",
      ],
      implications: "Consider permanent flexible work policy and investment in recommended collaboration tools.",
      summary: "A comprehensive study reveals that remote work arrangements continue to deliver productivity benefits, challenging traditional office-centric work models.",
      imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
      articleUrl: "https://example.com/remote-work",
      saved: false,
      annotations: [],
    },
  ];

  private trendingTopics: TrendingTopic[] = [
    { id: 1, name: "AI Regulation", count: 24, trend: "up" },
    { id: 2, name: "Market Volatility", count: 18, trend: "down" },
    { id: 3, name: "Supply Chain", count: 15, trend: "up" },
    { id: 4, name: "Sustainability", count: 12, trend: "up" },
    { id: 5, name: "Remote Work", count: 10, trend: "stable" },
  ];

  // Simulate API delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** Deep copy of the seed articles (used to bootstrap demo user data). */
  getBaseArticles(): Article[] {
    return this.articles.map((a) => ({ ...a, annotations: [...(a.annotations ?? [])] }));
  }

  async getArticles(filters?: {
    category?: string;
    sentiment?: string;
    search?: string;
  }): Promise<Article[]> {
    await this.delay(500);
    
    let filtered = [...this.articles];
    
    if (filters?.category && filters.category !== "all") {
      filtered = filtered.filter(article => article.category === filters.category);
    }
    
    if (filters?.sentiment && filters.sentiment !== "all") {
      filtered = filtered.filter(article => article.sentiment === filters.sentiment);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchLower) ||
        article.summary.toLowerCase().includes(searchLower) ||
        article.keyPoints.some(point => point.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  }

  async getTrendingTopics(): Promise<TrendingTopic[]> {
    await this.delay(300);
    return [...this.trendingTopics];
  }

  async getSentimentData(): Promise<SentimentData> {
    await this.delay(300);
    const total = this.articles.length;
    const positive = this.articles.filter(a => a.sentiment === "positive").length;
    const negative = this.articles.filter(a => a.sentiment === "negative").length;
    const neutral = this.articles.filter(a => a.sentiment === "neutral").length;
    
    return {
      positive: Math.round((positive / total) * 100),
      negative: Math.round((negative / total) * 100),
      neutral: Math.round((neutral / total) * 100),
    };
  }

  async saveArticle(articleId: string): Promise<void> {
    await this.delay(200);
    const article = this.articles.find(a => a.id === articleId);
    if (article) {
      article.saved = !article.saved;
    }
  }

  async addAnnotation(articleId: string, annotation: string): Promise<void> {
    await this.delay(300);
    const article = this.articles.find(a => a.id === articleId);
    if (article) {
      if (!article.annotations) {
        article.annotations = [];
      }
      article.annotations.push(annotation);
    }
  }

  async shareArticle(articleId: string, method: string): Promise<void> {
    await this.delay(200);
    console.log(`Article ${articleId} shared via ${method}`);
  }

  async refreshData(): Promise<void> {
    await this.delay(1000);
    // Simulate new articles being added
    const newArticleCount = Math.floor(Math.random() * 3) + 1;
    console.log(`Refreshed data: ${newArticleCount} new articles found`);
  }
}

export const newsDataService = new NewsDataService();