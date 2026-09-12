import React, { useState } from "react";
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
  Loader2,
} from "lucide-react";
import ArticleDigest from "./ArticleDigest";
import { useNews } from "@/contexts/NewsContext";

interface DashboardContentProps {
  category?: string;
  onConfigureAgent?: () => void;
}

const DashboardContent = ({
  category = "all",
  onConfigureAgent = () => {},
}: DashboardContentProps) => {
  const { state, actions } = useNews();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const trendingTopics = state.trendingTopics;
  const sentimentData = state.sentimentData;

  // Filter articles based on category, sentiment, and search
  const filteredArticles = (state.articles ?? []).filter((article) => {
    const matchesCategory = category === "all" || article.category === category;
    const matchesSentiment =
      selectedFilter === "all" || article.sentiment === selectedFilter;
    const matchesSearch =
      searchQuery === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.keyPoints.some((point) =>
        point.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    return matchesCategory && matchesSentiment && matchesSearch;
  });

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await actions.refreshData();
    } finally {
      setIsLoading(false);
      setLastRefresh(new Date());
    }
  };

  const handleArticleSave = (articleId: string) => {
    actions.saveArticle(articleId);
  };

  const handleArticleShare = (articleId: string, method: string) => {
    actions.shareArticle(articleId, method);
  };

  const handleArticleAnnotate = (articleId: string, annotation: string) => {
    actions.addAnnotation(articleId, annotation);
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
                    <span className="text-sm">Positive ({sentimentData?.positive ?? 0}%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                    <span className="text-sm">Neutral ({sentimentData?.neutral ?? 0}%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-sm">Negative ({sentimentData?.negative ?? 0}%)</span>
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
          {state.isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Loading articles...
            </div>
          ) : (
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
                onShare={() => handleArticleShare(article.id, 'clipboard')}
                onAnnotate={(annotation) => handleArticleAnnotate(article.id, annotation)}
              />
            ))}
          </div>
          )}
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
                  onShare={() => handleArticleShare(article.id, 'clipboard')}
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