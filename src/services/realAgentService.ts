// Real-world agent service with actual web scraping and AI capabilities
import { Agent, Article } from './newsDataService';
import { authService } from './authService';
import { databaseService } from './databaseService';

// Real tech stack integrations
interface RealAgentConfig {
  openaiApiKey?: string;
  newsApiKey?: string;
  serpApiKey?: string;
  rapidApiKey?: string;
  webhookUrl?: string;
}

export interface RealScrapingResult {
  url: string;
  title: string;
  content: string;
  publishDate: Date;
  author?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  entities?: string[];
  relevanceScore: number;
  sourceReliability: number;
  readingTime: number;
  tags: string[];
  summary: string;
}

export interface AIAnalysisResult {
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  entities: {
    name: string;
    type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'MISC';
    confidence: number;
  }[];
  keyPhrases: string[];
  topics: string[];
  summary: string;
  businessImpact: {
    score: number;
    reasoning: string;
    recommendations: string[];
  };
}

class RealAgentService {
  private config: RealAgentConfig;
  private runningTasks: Map<string, any> = new Map();

  constructor() {
    this.config = {
      // These would be set via environment variables in production
      openaiApiKey: process.env.OPENAI_API_KEY,
      newsApiKey: process.env.NEWS_API_KEY,
      serpApiKey: process.env.SERP_API_KEY,
      rapidApiKey: process.env.RAPID_API_KEY,
      webhookUrl: process.env.WEBHOOK_URL,
    };
  }

  // Real web scraping using multiple APIs and techniques
  async performRealWebScraping(agent: Agent): Promise<RealScrapingResult[]> {
    const results: RealScrapingResult[] = [];
    
    try {
      // 1. News API for structured news data
      if (this.config.newsApiKey) {
        const newsResults = await this.scrapeWithNewsAPI(agent);
        results.push(...newsResults);
      }

      // 2. SERP API for Google News results
      if (this.config.serpApiKey) {
        const serpResults = await this.scrapeWithSerpAPI(agent);
        results.push(...serpResults);
      }

      // 3. RSS Feed scraping
      const rssResults = await this.scrapeRSSFeeds(agent);
      results.push(...rssResults);

      // 4. Direct website scraping (with respect to robots.txt)
      const directResults = await this.scrapeDirectSources(agent);
      results.push(...directResults);

      // Remove duplicates and sort by relevance
      return this.deduplicateAndRank(results, agent);

    } catch (error) {
      console.error('Web scraping failed:', error);
      throw new Error(`Web scraping failed: ${error.message}`);
    }
  }

  private async scrapeWithNewsAPI(agent: Agent): Promise<RealScrapingResult[]> {
    const results: RealScrapingResult[] = [];
    
    for (const topic of agent.topics) {
      try {
        const response = await fetch(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&apiKey=${this.config.newsApiKey}&sortBy=publishedAt&pageSize=20`
        );
        
        if (!response.ok) {
          throw new Error(`News API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        for (const article of data.articles) {
          if (article.title && article.description && article.url) {
            results.push({
              url: article.url,
              title: article.title,
              content: article.description + (article.content || ''),
              publishDate: new Date(article.publishedAt),
              author: article.author,
              relevanceScore: this.calculateRelevance(article, agent),
              sourceReliability: this.getSourceReliability(article.source?.name || ''),
              readingTime: this.estimateReadingTime(article.content || article.description),
              tags: [topic],
              summary: article.description,
            });
          }
        }
      } catch (error) {
        console.error(`News API scraping failed for topic ${topic}:`, error);
      }
    }
    
    return results;
  }

  private async scrapeWithSerpAPI(agent: Agent): Promise<RealScrapingResult[]> {
    const results: RealScrapingResult[] = [];
    
    for (const topic of agent.topics) {
      try {
        const response = await fetch(
          `https://serpapi.com/search.json?engine=google_news&q=${encodeURIComponent(topic)}&api_key=${this.config.serpApiKey}`
        );
        
        if (!response.ok) {
          throw new Error(`SERP API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.news_results) {
          for (const article of data.news_results) {
            results.push({
              url: article.link,
              title: article.title,
              content: article.snippet || '',
              publishDate: new Date(article.date || Date.now()),
              author: article.source,
              relevanceScore: this.calculateRelevance(article, agent),
              sourceReliability: this.getSourceReliability(article.source || ''),
              readingTime: this.estimateReadingTime(article.snippet || ''),
              tags: [topic],
              summary: article.snippet || '',
            });
          }
        }
      } catch (error) {
        console.error(`SERP API scraping failed for topic ${topic}:`, error);
      }
    }
    
    return results;
  }

  private async scrapeRSSFeeds(agent: Agent): Promise<RealScrapingResult[]> {
    const results: RealScrapingResult[] = [];
    
    // RSS feed URLs for major news sources
    const rssFeedMap: { [key: string]: string } = {
      'TechCrunch': 'https://techcrunch.com/feed/',
      'Wired': 'https://www.wired.com/feed/rss',
      'Reuters': 'https://www.reuters.com/rssFeed/businessNews',
      'Bloomberg': 'https://feeds.bloomberg.com/markets/news.rss',
      'Financial Times': 'https://www.ft.com/rss/home',
      'Wall Street Journal': 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
      'CNBC': 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    };

    for (const source of agent.sources) {
      const feedUrl = rssFeedMap[source];
      if (feedUrl) {
        try {
          // Use a CORS proxy or server-side RSS parsing
          const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
          const data = await response.json();
          
          if (data.status === 'ok' && data.items) {
            for (const item of data.items.slice(0, 10)) {
              if (this.isRelevantToAgent(item, agent)) {
                results.push({
                  url: item.link,
                  title: item.title,
                  content: item.description || item.content || '',
                  publishDate: new Date(item.pubDate),
                  author: item.author || source,
                  relevanceScore: this.calculateRelevance(item, agent),
                  sourceReliability: this.getSourceReliability(source),
                  readingTime: this.estimateReadingTime(item.description || ''),
                  tags: agent.topics.filter(topic => 
                    item.title.toLowerCase().includes(topic.toLowerCase()) ||
                    (item.description || '').toLowerCase().includes(topic.toLowerCase())
                  ),
                  summary: item.description || '',
                });
              }
            }
          }
        } catch (error) {
          console.error(`RSS scraping failed for ${source}:`, error);
        }
      }
    }
    
    return results;
  }

  private async scrapeDirectSources(agent: Agent): Promise<RealScrapingResult[]> {
    // This would implement direct website scraping using libraries like Puppeteer or Playwright
    // For now, returning empty array as this requires server-side implementation
    console.log('Direct source scraping would be implemented server-side');
    return [];
  }

  // Real AI analysis using OpenAI GPT
  async performRealAIAnalysis(content: string, context: Agent): Promise<AIAnalysisResult> {
    if (!this.config.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = `
        Analyze the following news content for business intelligence:
        
        Content: "${content}"
        
        Context: This is being analyzed for ${context.topics.join(', ')} topics, 
        focusing on entities: ${context.entities.join(', ')}
        
        Please provide:
        1. Sentiment analysis (positive/negative/neutral with confidence score)
        2. Named entity recognition
        3. Key phrases extraction
        4. Topic classification
        5. Executive summary
        6. Business impact assessment with recommendations
        
        Return as JSON format.
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert business intelligence analyst. Analyze news content and provide structured insights in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;
      
      // Parse the JSON response from GPT
      try {
        const analysis = JSON.parse(analysisText);
        return this.formatAIAnalysis(analysis);
      } catch (parseError) {
        // Fallback to basic analysis if JSON parsing fails
        return this.performBasicAnalysis(content, context);
      }

    } catch (error) {
      console.error('AI analysis failed:', error);
      return this.performBasicAnalysis(content, context);
    }
  }

  private formatAIAnalysis(rawAnalysis: any): AIAnalysisResult {
    return {
      sentiment: {
        score: rawAnalysis.sentiment?.score || 0,
        label: rawAnalysis.sentiment?.label || 'neutral',
        confidence: rawAnalysis.sentiment?.confidence || 0.5,
      },
      entities: rawAnalysis.entities || [],
      keyPhrases: rawAnalysis.keyPhrases || [],
      topics: rawAnalysis.topics || [],
      summary: rawAnalysis.summary || '',
      businessImpact: {
        score: rawAnalysis.businessImpact?.score || 0.5,
        reasoning: rawAnalysis.businessImpact?.reasoning || '',
        recommendations: rawAnalysis.businessImpact?.recommendations || [],
      },
    };
  }

  private performBasicAnalysis(content: string, context: Agent): AIAnalysisResult {
    // Fallback basic analysis
    const words = content.toLowerCase().split(/\s+/);
    const positiveWords = ['growth', 'success', 'profit', 'increase', 'positive', 'gain'];
    const negativeWords = ['decline', 'loss', 'decrease', 'negative', 'fall', 'drop'];
    
    const positiveCount = positiveWords.filter(word => words.includes(word)).length;
    const negativeCount = negativeWords.filter(word => words.includes(word)).length;
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';

    return {
      sentiment: {
        score: sentiment === 'positive' ? 0.7 : sentiment === 'negative' ? -0.7 : 0,
        label: sentiment,
        confidence: 0.6,
      },
      entities: context.entities.map(entity => ({
        name: entity,
        type: 'ORGANIZATION' as const,
        confidence: content.toLowerCase().includes(entity.toLowerCase()) ? 0.8 : 0.3,
      })),
      keyPhrases: context.topics,
      topics: context.topics,
      summary: content.substring(0, 200) + '...',
      businessImpact: {
        score: 0.5,
        reasoning: 'Basic analysis performed due to AI service unavailability',
        recommendations: ['Monitor for further developments', 'Assess competitive implications'],
      },
    };
  }

  // Real-time monitoring with webhooks
  async setupRealTimeMonitoring(agent: Agent): Promise<void> {
    if (!this.config.webhookUrl) {
      console.warn('Webhook URL not configured for real-time monitoring');
      return;
    }

    // Set up monitoring intervals based on agent frequency
    const intervalMs = this.getFrequencyMs(agent.frequency);
    
    const monitoringTask = setInterval(async () => {
      try {
        const newResults = await this.performRealWebScraping(agent);
        
        if (newResults.length > 0) {
          // Send webhook notification
          await fetch(this.config.webhookUrl!, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              agentId: agent.id,
              agentName: agent.name,
              newArticlesCount: newResults.length,
              timestamp: new Date().toISOString(),
              articles: newResults.slice(0, 5), // Send top 5 articles
            }),
          });
        }
      } catch (error) {
        console.error(`Real-time monitoring failed for agent ${agent.id}:`, error);
      }
    }, intervalMs);

    // Store the interval ID for cleanup
    this.runningTasks.set(`monitor_${agent.id}`, monitoringTask);
  }

  async stopRealTimeMonitoring(agentId: string): Promise<void> {
    const taskId = `monitor_${agentId}`;
    const intervalId = this.runningTasks.get(taskId);
    
    if (intervalId) {
      clearInterval(intervalId);
      this.runningTasks.delete(taskId);
    }
  }

  // Content synthesis using AI
  async performRealContentSynthesis(articles: RealScrapingResult[], agent: Agent): Promise<any> {
    if (!this.config.openaiApiKey) {
      throw new Error('OpenAI API key not configured for content synthesis');
    }

    const combinedContent = articles.map(article => 
      `Title: ${article.title}\nContent: ${article.content}\nSource: ${article.author || 'Unknown'}\n---`
    ).join('\n');

    const prompt = `
      As an executive business intelligence analyst, synthesize the following news articles into a comprehensive executive briefing:
      
      ${combinedContent}
      
      Focus on:
      - Key trends and patterns
      - Business implications for ${agent.entities.join(', ')}
      - Strategic recommendations
      - Risk assessment
      - Market opportunities
      
      Provide a structured executive summary suitable for C-level decision making.
    `;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a senior business intelligence analyst creating executive briefings.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 2000,
        }),
      });

      const data = await response.json();
      return {
        executiveSummary: data.choices[0].message.content,
        articlesAnalyzed: articles.length,
        synthesisDate: new Date(),
        confidence: 0.85,
      };

    } catch (error) {
      console.error('Content synthesis failed:', error);
      throw error;
    }
  }

  // Utility methods
  private calculateRelevance(article: any, agent: Agent): number {
    let score = 0;
    const title = (article.title || '').toLowerCase();
    const content = (article.content || article.description || '').toLowerCase();
    
    // Topic relevance
    for (const topic of agent.topics) {
      if (title.includes(topic.toLowerCase())) score += 0.3;
      if (content.includes(topic.toLowerCase())) score += 0.2;
    }
    
    // Entity relevance
    for (const entity of agent.entities) {
      if (title.includes(entity.toLowerCase())) score += 0.4;
      if (content.includes(entity.toLowerCase())) score += 0.3;
    }
    
    return Math.min(score, 1.0);
  }

  private getSourceReliability(source: string): number {
    const reliabilityMap: { [key: string]: number } = {
      'Reuters': 0.95,
      'Bloomberg': 0.93,
      'Financial Times': 0.92,
      'Wall Street Journal': 0.91,
      'Associated Press': 0.90,
      'BBC': 0.88,
      'CNBC': 0.85,
      'TechCrunch': 0.82,
      'Wired': 0.80,
    };
    
    return reliabilityMap[source] || 0.70;
  }

  private estimateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private isRelevantToAgent(item: any, agent: Agent): boolean {
    const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();
    
    return agent.topics.some(topic => text.includes(topic.toLowerCase())) ||
           agent.entities.some(entity => text.includes(entity.toLowerCase()));
  }

  private deduplicateAndRank(results: RealScrapingResult[], agent: Agent): RealScrapingResult[] {
    // Remove duplicates based on URL and title similarity
    const unique = results.filter((result, index, self) => 
      index === self.findIndex(r => r.url === result.url || this.isSimilarTitle(r.title, result.title))
    );
    
    // Sort by relevance score and source reliability
    return unique.sort((a, b) => 
      (b.relevanceScore * b.sourceReliability) - (a.relevanceScore * a.sourceReliability)
    );
  }

  private isSimilarTitle(title1: string, title2: string): boolean {
    const words1 = title1.toLowerCase().split(/\s+/);
    const words2 = title2.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length) > 0.7;
  }

  private getFrequencyMs(frequency: string): number {
    switch (frequency) {
      case 'hourly': return 60 * 60 * 1000;
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }
}

export const realAgentService = new RealAgentService();