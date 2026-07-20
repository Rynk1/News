import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Filter,
  TrendingUp,
  BarChart3,
  PieChart,
  List,
  Grid3X3,
} from "lucide-react";
import ArticleDigest from "./ArticleDigest";
import type { Article } from "@/services/newsDataService";

interface DashboardContentProps {
  category?: string;
  onConfigureAgent?: () => void;
}

const DashboardContent = ({
  category = "all",
  onConfigureAgent = () => {},
}: DashboardContentProps) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Mock data for demonstration
  const trendingTopics = [
    { id: 1, name: "AI Regulation", count: 24 },
    { id: 2, name: "Market Volatility", count: 18 },
    { id: 3, name: "Supply Chain", count: 15 },
    { id: 4, name: "Sustainability", count: 12 },
    { id: 5, name: "Remote Work", count: 10 },
  ];

  // Enhanced mock articles with categories
  const mockArticles: Article[] = [
    {
      id: 1,
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
      implications:
        "May require adjustments to current AI development roadmap and compliance processes.",
      summary: "The European Union has unveiled comprehensive AI regulation proposals that could reshape how companies develop and deploy artificial intelligence systems across various industries.",
      imageUrl:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80",
    },
    {
      id: 2,
      title:
        "Global Supply Chain Disruptions Expected to Continue Through 2024",
      source: "Bloomberg",
      date: "5 hours ago",
      sentiment: "negative",
      category: "market",
      keyPoints: [
        "Shipping costs increased by 25% since January",
        "Semiconductor shortages affecting multiple industries",
        "Asian manufacturing hubs facing continued challenges",
      ],
      implications:
        "Consider diversifying suppliers and increasing inventory buffers for critical components.",
      summary: "Supply chain experts warn that ongoing disruptions will persist well into 2024, with companies needing to adapt their procurement and inventory strategies.",
      imageUrl:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80",
    },
    {
      id: 3,
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
      implications:
        "Potential partnership opportunities for green initiatives and positive PR positioning.",
      summary: "Leading technology companies have announced ambitious new sustainability programs, signaling a major shift in corporate environmental responsibility.",
      imageUrl:
        "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&q=80",
    },
    {
      id: 4,
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
      implications:
        "Opportunity to differentiate through specialized cloud services and competitive pricing.",
      summary: "The cloud computing landscape continues to evolve with significant market share movements among major providers, creating new opportunities for strategic positioning.",
      imageUrl:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&q=80",
    },
    {
      id: 5,
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
      implications:
        "Review investment strategy and consider hedging options for corporate treasury.",
      summary: "Financial markets are experiencing heightened volatility as investors grapple with economic uncertainty and changing monetary policy expectations.",
      imageUrl:
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80",
    },
    {
      id: 6,
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
      implications:
        "Consider permanent flexible work policy and investment in recommended collaboration tools.",
      summary: "A comprehensive study reveals that remote work arrangements continue to deliver productivity benefits, challenging traditional office-centric work models.",
      imageUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
    },
  ];

  // Filter articles based on category, sentiment, and search
  const filteredArticles = mockArticles.filter((article) => {
    const matchesCategory = category === "all" || article.category === category;
    const matchesSentiment = selectedFilter === "all" || article.sentiment === selectedFilter;
    const matchesSearch = searchQuery === "" || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.keyPoints.some(point => point.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSentiment && matchesSearch;
  });

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setLastRefresh(new Date());
    }, 1500);
  };

  const handleArticleSave = (articleId: number) => {
    console.log(`Article ${articleId} saved`);
    // Here you would typically update the saved articles state or make an API call
  };

  const handleArticleShare = (articleId: number) => {
    console.log(`Article ${articleId} shared`);
    // Here you would typically handle sharing functionality
  };

  const handleArticleAnnotate = (articleId: number, annotation: string) => {
    console.log(`Article ${articleId} annotated:`, annotation);
    // Here you would typically save the annotation to your backend
  };

  return (
    <div className="flex flex-col w-full h-full bg-background p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Executive Dashboard</h1>
          <p className="text-muted-foreground">
            Your personalized news intelligence - Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onConfigureAgent}>
            Configure Agents
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
          <TabsTrigger value="articles">All Articles</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Trending Topics
                </CardTitle>
                <CardDescription>
                  Topics gaining traction in your monitored sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {trendingTopics.map((topic) => (
                    <li
                      key={topic.id}
                      className="flex justify-between items-center"
                    >
                      <span>{topic.name}</span>
                      <Badge variant="secondary">{topic.count} mentions</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Sentiment Analysis
                </CardTitle>
                <CardDescription>
                  Overall sentiment across monitored topics
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-[200px]">
                <PieChart className="h-32 w-32 text-primary opacity-80" />
                <div className="flex gap-4 mt-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">Positive (42%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                    <span className="text-sm">Neutral (35%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-sm">Negative (23%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Takeaways</CardTitle>
                <CardDescription>
                  AI-generated insights from today's news
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Supply Chain</h4>
                  <p className="text-sm text-muted-foreground">
                    Ongoing disruptions suggest need for supplier
                    diversification strategy.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Regulatory</h4>
                  <p className="text-sm text-muted-foreground">
                    New AI regulations may require compliance adjustments by Q3.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Market</h4>
                  <p className="text-sm text-muted-foreground">
                    Increased volatility suggests defensive positioning for
                    Q2-Q3.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Talent</h4>
                  <p className="text-sm text-muted-foreground">
                    Remote work productivity data supports flexible work policy.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-8">Top Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.slice(0, 3).map((article) => (
              <ArticleDigest
                key={article.id}
                title={article.title}
                source={article.source}
                date={article.date}
                sentiment={article.sentiment}
                keyPoints={article.keyPoints}
                implications={article.implications}
                summary={article.summary}
                imageUrl={article.imageUrl}
                onSave={() => handleArticleSave(article.id)}
                onShare={() => handleArticleShare(article.id)}
                onAnnotate={(annotation) => handleArticleAnnotate(article.id, annotation)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="articles">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filter by:</span>
              </div>
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Articles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Articles</SelectItem>
                  <SelectItem value="positive">Positive Sentiment</SelectItem>
                  <SelectItem value="neutral">Neutral Sentiment</SelectItem>
                  <SelectItem value="negative">Negative Sentiment</SelectItem>
                </SelectContent>
              </Select>
              <Input 
                className="w-[250px]" 
                placeholder="Search articles..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No articles found matching your criteria.</p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "flex flex-col gap-4"
              }
            >
              {filteredArticles.map((article) => (
                <ArticleDigest
                  key={article.id}
                  title={article.title}
                  source={article.source}
                  date={article.date}
                  sentiment={article.sentiment}
                  keyPoints={article.keyPoints}
                  implications={article.implications}
                  summary={article.summary}
                  imageUrl={article.imageUrl}
                  layout={viewMode === "list" ? "horizontal" : "vertical"}
                  onSave={() => handleArticleSave(article.id)}
                  onShare={() => handleArticleShare(article.id)}
                  onAnnotate={(annotation) => handleArticleAnnotate(article.id, annotation)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Source Distribution</CardTitle>
                <CardDescription>Articles by source</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <BarChart3 className="h-48 w-48 text-primary opacity-70" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Topic Trends</CardTitle>
                <CardDescription>Topic mentions over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <TrendingUp className="h-48 w-48 text-primary opacity-70" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Trends</CardTitle>
                <CardDescription>Sentiment analysis over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <BarChart3 className="h-48 w-48 text-primary opacity-70" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Entity Mentions</CardTitle>
                <CardDescription>
                  People and organizations mentioned
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <PieChart className="h-48 w-48 text-primary opacity-70" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardContent;