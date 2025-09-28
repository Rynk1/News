import React, { createContext, useContext, useReducer, useEffect } from "react";
import { newsDataService, Article, Agent, TrendingTopic, SentimentData } from "../services/newsDataService";

interface NewsState {
  articles: Article[];
  agents: Agent[];
  trendingTopics: TrendingTopic[];
  sentimentData: SentimentData | null;
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date;
  savedArticles: number[];
  notifications: Notification[];
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning" | "error";
}

type NewsAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_ARTICLES"; payload: Article[] }
  | { type: "SET_AGENTS"; payload: Agent[] }
  | { type: "SET_TRENDING_TOPICS"; payload: TrendingTopic[] }
  | { type: "SET_SENTIMENT_DATA"; payload: SentimentData }
  | { type: "SET_LAST_REFRESH"; payload: Date }
  | { type: "TOGGLE_ARTICLE_SAVE"; payload: number }
  | { type: "ADD_ANNOTATION"; payload: { articleId: number; annotation: string } }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_NOTIFICATION_READ"; payload: number }
  | { type: "UPDATE_AGENT"; payload: Agent }
  | { type: "DELETE_AGENT"; payload: string }
  | { type: "ADD_AGENT"; payload: Agent };

const initialState: NewsState = {
  articles: [],
  agents: [
    {
      id: "1",
      name: "Tech Industry Tracker",
      description: "Monitors technology industry news and trends",
      sources: ["TechCrunch", "Wired", "The Verge"],
      topics: ["AI", "Cloud Computing", "Cybersecurity"],
      entities: ["Google", "Microsoft", "Apple"],
      frequency: "daily",
      status: "active",
      lastUpdate: "10 min ago",
      articlesCollected: 24,
    },
    {
      id: "2",
      name: "Competitor Analysis",
      description: "Tracks news about direct competitors",
      sources: ["Bloomberg", "Reuters", "Financial Times"],
      topics: ["Market Share", "Product Launch", "Acquisitions"],
      entities: ["Amazon", "Facebook", "Netflix"],
      frequency: "hourly",
      status: "active",
      lastUpdate: "1 hour ago",
      articlesCollected: 18,
    },
    {
      id: "3",
      name: "Market Trends",
      description: "Monitors overall market conditions and trends",
      sources: ["Wall Street Journal", "CNBC", "MarketWatch"],
      topics: ["Stock Market", "Economic Indicators", "Industry Reports"],
      entities: ["S&P 500", "NASDAQ", "Federal Reserve"],
      frequency: "daily",
      status: "idle",
      lastUpdate: "3 hours ago",
      articlesCollected: 12,
    },
  ],
  trendingTopics: [],
  sentimentData: null,
  isLoading: false,
  error: null,
  lastRefresh: new Date(),
  savedArticles: [],
  notifications: [
    {
      id: 1,
      title: "New insights from Tech Industry agent",
      message: "5 new articles about AI regulation found",
      time: "10 minutes ago",
      read: false,
      type: "info",
    },
    {
      id: 2,
      title: "Market Trends agent needs attention",
      message: "Agent configuration may need updating",
      time: "1 hour ago",
      read: false,
      type: "warning",
    },
    {
      id: 3,
      title: "Weekly summary ready",
      message: "Your weekly news digest is available",
      time: "2 hours ago",
      read: true,
      type: "success",
    },
  ],
};

function newsReducer(state: NewsState, action: NewsAction): NewsState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "SET_ARTICLES":
      return { ...state, articles: action.payload, isLoading: false };
    case "SET_AGENTS":
      return { ...state, agents: action.payload };
    case "SET_TRENDING_TOPICS":
      return { ...state, trendingTopics: action.payload };
    case "SET_SENTIMENT_DATA":
      return { ...state, sentimentData: action.payload };
    case "SET_LAST_REFRESH":
      return { ...state, lastRefresh: action.payload };
    case "TOGGLE_ARTICLE_SAVE":
      const articleId = action.payload;
      const savedArticles = state.savedArticles.includes(articleId)
        ? state.savedArticles.filter(id => id !== articleId)
        : [...state.savedArticles, articleId];
      return { ...state, savedArticles };
    case "ADD_ANNOTATION":
      return {
        ...state,
        articles: state.articles.map(article =>
          article.id === action.payload.articleId
            ? {
                ...article,
                annotations: [...(article.annotations || []), action.payload.annotation]
              }
            : article
        ),
      };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        ),
      };
    case "UPDATE_AGENT":
      return {
        ...state,
        agents: state.agents.map(agent =>
          agent.id === action.payload.id ? action.payload : agent
        ),
      };
    case "DELETE_AGENT":
      return {
        ...state,
        agents: state.agents.filter(agent => agent.id !== action.payload),
      };
    case "ADD_AGENT":
      return {
        ...state,
        agents: [...state.agents, action.payload],
      };
    default:
      return state;
  }
}

interface NewsContextType {
  state: NewsState;
  dispatch: React.Dispatch<NewsAction>;
  actions: {
    loadArticles: (filters?: { category?: string; sentiment?: string; search?: string }) => Promise<void>;
    loadTrendingTopics: () => Promise<void>;
    loadSentimentData: () => Promise<void>;
    refreshData: () => Promise<void>;
    saveArticle: (articleId: number) => Promise<void>;
    addAnnotation: (articleId: number, annotation: string) => Promise<void>;
    shareArticle: (articleId: number, method: string) => Promise<void>;
    markNotificationRead: (notificationId: number) => void;
    updateAgent: (agent: Agent) => void;
    deleteAgent: (agentId: string) => void;
    addAgent: (agent: Agent) => void;
  };
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export function NewsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(newsReducer, initialState);

  const actions = {
    loadArticles: async (filters?: { category?: string; sentiment?: string; search?: string }) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const articles = await newsDataService.getArticles(filters);
        dispatch({ type: "SET_ARTICLES", payload: articles });
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to load articles" });
      }
    },

    loadTrendingTopics: async () => {
      try {
        const topics = await newsDataService.getTrendingTopics();
        dispatch({ type: "SET_TRENDING_TOPICS", payload: topics });
      } catch (error) {
        console.error("Failed to load trending topics:", error);
      }
    },

    loadSentimentData: async () => {
      try {
        const sentimentData = await newsDataService.getSentimentData();
        dispatch({ type: "SET_SENTIMENT_DATA", payload: sentimentData });
      } catch (error) {
        console.error("Failed to load sentiment data:", error);
      }
    },

    refreshData: async () => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        await newsDataService.refreshData();
        await actions.loadArticles();
        await actions.loadTrendingTopics();
        await actions.loadSentimentData();
        dispatch({ type: "SET_LAST_REFRESH", payload: new Date() });
        
        // Add a notification about the refresh
        const notification: Notification = {
          id: Date.now(),
          title: "Data refreshed",
          message: "All news data has been updated",
          time: "Just now",
          read: false,
          type: "success",
        };
        dispatch({ type: "ADD_NOTIFICATION", payload: notification });
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to refresh data" });
      }
    },

    saveArticle: async (articleId: number) => {
      try {
        await newsDataService.saveArticle(articleId);
        dispatch({ type: "TOGGLE_ARTICLE_SAVE", payload: articleId });
      } catch (error) {
        console.error("Failed to save article:", error);
      }
    },

    addAnnotation: async (articleId: number, annotation: string) => {
      try {
        await newsDataService.addAnnotation(articleId, annotation);
        dispatch({ type: "ADD_ANNOTATION", payload: { articleId, annotation } });
      } catch (error) {
        console.error("Failed to add annotation:", error);
      }
    },

    shareArticle: async (articleId: number, method: string) => {
      try {
        await newsDataService.shareArticle(articleId, method);
      } catch (error) {
        console.error("Failed to share article:", error);
      }
    },

    markNotificationRead: (notificationId: number) => {
      dispatch({ type: "MARK_NOTIFICATION_READ", payload: notificationId });
    },

    updateAgent: (agent: Agent) => {
      dispatch({ type: "UPDATE_AGENT", payload: agent });
    },

    deleteAgent: (agentId: string) => {
      dispatch({ type: "DELETE_AGENT", payload: agentId });
    },

    addAgent: (agent: Agent) => {
      dispatch({ type: "ADD_AGENT", payload: agent });
    },
  };

  // Load initial data
  useEffect(() => {
    actions.loadArticles();
    actions.loadTrendingTopics();
    actions.loadSentimentData();
  }, []);

  return (
    <NewsContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </NewsContext.Provider>
  );
}

export function useNews() {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error("useNews must be used within a NewsProvider");
  }
  return context;
}

export type { NewsState, NewsAction, Notification };