import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNews } from "@/contexts/NewsContext";
import ArticleDigest from "@/components/dashboard/ArticleDigest";

const SavedArticles = () => {
  const { state, actions } = useNews();
  const navigate = useNavigate();

  const savedArticles = (state.articles ?? []).filter((a) => a.saved);

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
            <h1 className="text-3xl font-bold">Saved Articles</h1>
            <p className="text-muted-foreground">
              {savedArticles.length} article{savedArticles.length === 1 ? "" : "s"} bookmarked
            </p>
          </div>
        </div>
      </div>

      {state.isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Loading saved articles...
        </div>
      ) : savedArticles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bookmark className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg">No saved articles yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1">
              Bookmark articles from your dashboard to build a personal research
              library.
            </p>
            <Button className="mt-6" onClick={() => navigate("/")}>
              Browse the dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedArticles.map((article) => (
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
              articleUrl={article.articleUrl}
              saved={article.saved}
              onSave={() => actions.saveArticle(article.id)}
              onShare={() => actions.shareArticle(article.id, "clipboard")}
              onAnnotate={(annotation) =>
                actions.addAnnotation(article.id, annotation)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedArticles;