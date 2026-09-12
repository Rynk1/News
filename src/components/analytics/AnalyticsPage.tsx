import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, TrendingUp, PieChart, Layers, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNews } from "@/contexts/NewsContext";

const AnalyticsPage = () => {
  const { state } = useNews();
  const navigate = useNavigate();

  const total = state.articles.length;
  const byCategory = state.articles.reduce<Record<string, number>>((acc, a) => {
    acc[a.category] = (acc[a.category] ?? 0) + 1;
    return acc;
  }, {});
  const featured = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="flex flex-col w-full h-full bg-background p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Your news intelligence metrics</p>
          </div>
        </div>
      </div>

      {state.isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Loading analytics...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Articles Collected</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground">Across all your agents</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sentiment Split</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 text-sm">
                  <span className="flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5" />
                    {state.sentimentData?.positive ?? 0}% positive
                  </span>
                  <span className="flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-400 mr-1.5" />
                    {state.sentimentData?.neutral ?? 0}% neutral
                  </span>
                  <span className="flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5" />
                    {state.sentimentData?.negative ?? 0}% negative
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trending Topics</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {state.trendingTopics.slice(0, 3).map((topic) => (
                    <li key={topic.name} className="flex justify-between">
                      <span>{topic.name}</span>
                      <span className="text-muted-foreground">{topic.count}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Source Distribution
                </CardTitle>
                <CardDescription>Articles by category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {featured.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet — run an agent or two.</p>
                ) : (
                  featured.map(([category, count]) => {
                    const pct = total ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{category}</span>
                          <span className="text-muted-foreground">{count} articles</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Insight</CardTitle>
                <CardDescription>What your intelligence is telling you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {state.articles.length === 0 ? (
                  <p>
                    Once your agents start collecting articles, NewsIntel will surface
                    key takeaways, risks, and opportunities here.
                  </p>
                ) : (
                  <>
                    <p>
                      You are tracking <strong>{state.agents.length}</strong> agents across{" "}
                      <strong>{featured.length}</strong> topics. The most active category
                      is <strong>{featured[0]?.[0] ?? "—"}</strong> with{" "}
                      <strong>{featured[0]?.[1] ?? 0}</strong> articles.
                    </p>
                    <p>
                      Overall sentiment skews{" "}
                      <strong>
                        {Math.max(
                          state.sentimentData?.positive ?? 0,
                          state.sentimentData?.neutral ?? 0,
                          state.sentimentData?.negative ?? 0,
                        ) === (state.sentimentData?.positive ?? 0)
                          ? "positive"
                          : Math.max(
                              state.sentimentData?.positive ?? 0,
                              state.sentimentData?.neutral ?? 0,
                              state.sentimentData?.negative ?? 0,
                            ) === (state.sentimentData?.neutral ?? 0)
                            ? "neutral"
                            : "negative"}
                      </strong>
                      , which may signal opportunity or caution depending on your focus
                      areas.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;