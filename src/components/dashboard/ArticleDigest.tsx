import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Share2, MessageSquare, ExternalLink, BookmarkCheck, BookOpen } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import KindleReader from "@/components/reader/KindleReader";

interface ArticleDigestProps {
  title?: string;
  source?: string;
  date?: string;
  sentiment?: "positive" | "negative" | "neutral";
  summary?: string;
  keyPoints?: string[];
  implications?: string;
  businessImplications?: string;
  imageUrl?: string;
  articleUrl?: string;
  layout?: "vertical" | "horizontal";
  onSave?: () => void;
  onShare?: () => void;
  onAnnotate?: (annotation: string) => void;
}

const ArticleDigest = ({
  title = "AI Breakthrough Could Revolutionize Supply Chain Management",
  source = "Tech Insights",
  date = "2 hours ago",
  sentiment = "positive",
  summary = "Researchers have developed a new AI algorithm that can predict supply chain disruptions with 95% accuracy, potentially saving global businesses billions in lost revenue.",
  keyPoints = [
    "Algorithm uses real-time data from multiple sources including weather, social media, and shipping trackers",
    "Early tests show 95% accuracy in predicting disruptions up to 2 weeks in advance",
    "Implementation costs estimated at $500K for enterprise-level businesses",
  ],
  implications,
  businessImplications = "Companies implementing this technology could see a 30% reduction in supply chain disruptions and an estimated 15% savings in emergency logistics costs.",
  imageUrl = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&q=80",
  articleUrl = "#",
  layout = "vertical",
  onSave,
  onShare,
  onAnnotate,
}: ArticleDigestProps) => {
  const [isSaved, setIsSaved] = useState(false);
  const [annotation, setAnnotation] = useState("");
  const [isAnnotationOpen, setIsAnnotationOpen] = useState(false);
  const [isKindleReaderOpen, setIsKindleReaderOpen] = useState(false);

  const sentimentColors = {
    positive: "bg-green-100 text-green-800 border-green-200",
    negative: "bg-red-100 text-red-800 border-red-200",
    neutral: "bg-blue-100 text-blue-800 border-blue-200",
  };

  const finalImplications = implications || businessImplications;

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave?.();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: summary,
        url: articleUrl,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${title}\n${summary}\n${articleUrl}`);
    }
    onShare?.();
  };

  const handleAnnotate = () => {
    if (annotation.trim()) {
      onAnnotate?.(annotation);
      setAnnotation("");
      setIsAnnotationOpen(false);
    }
  };

  const handleOpenKindleReader = () => {
    setIsKindleReaderOpen(true);
  };

  // Create full article content for Kindle reader
  const fullArticleContent = `The global supply chain industry stands on the brink of a revolutionary transformation, thanks to a groundbreaking artificial intelligence algorithm developed by researchers at MIT's Computer Science and Artificial Intelligence Laboratory (CSAIL). This innovative system promises to predict supply chain disruptions with an unprecedented 95% accuracy rate, potentially saving businesses billions of dollars in lost revenue and operational inefficiencies.

The algorithm, dubbed "SupplyChain AI," represents a significant leap forward in predictive analytics for logistics and supply chain management. Unlike traditional forecasting methods that rely on historical data and linear projections, this AI system employs a sophisticated neural network architecture that processes real-time data from multiple sources simultaneously.

**How the Technology Works**

The system integrates data streams from weather monitoring stations, social media sentiment analysis, shipping tracker APIs, port congestion reports, and economic indicators. By analyzing these diverse data points in real-time, the AI can identify patterns and correlations that human analysts might miss.

"What makes this system unique is its ability to understand the interconnected nature of global supply chains," explains Dr. Sarah Chen, the lead researcher on the project. "A political event in one country, combined with weather patterns in another, might seem unrelated to human observers, but our AI can detect how these factors will cascade through the supply chain weeks in advance."

**Real-World Testing and Results**

The research team conducted extensive testing over an 18-month period, partnering with several Fortune 500 companies across different industries. The results were remarkable: the AI system successfully predicted 95% of major supply chain disruptions 2-3 weeks before they occurred.

In one notable case study, the system predicted a semiconductor shortage three weeks before it materialized, allowing a major electronics manufacturer to secure alternative suppliers and avoid a production shutdown that would have cost an estimated $50 million.

**Implementation and Business Impact**

Early adopters report substantial returns on investment, with companies seeing 30% reduction in supply chain disruptions and 15% savings in emergency logistics costs. The technology represents a paradigm shift from reactive to predictive supply chain management.

The implications extend beyond individual companies to potentially reshape global trade patterns and supply chain strategies, making disruptions predictable events rather than unexpected crises.`;

  const kindleArticle = {
    id: Math.random(),
    title,
    source,
    date,
    author: "Dr. Sarah Chen",
    content: fullArticleContent,
    summary,
    keyPoints,
    implications: finalImplications,
    sentiment,
    imageUrl,
    estimatedReadTime: 8,
  };

  const cardClasses = layout === "horizontal" 
    ? "w-full bg-white overflow-hidden flex flex-row h-48"
    : "w-full max-w-md bg-white overflow-hidden h-full flex flex-col";

  const contentClasses = layout === "horizontal"
    ? "flex-grow p-4"
    : "flex-grow";

  const imageClasses = layout === "horizontal"
    ? "w-48 h-full"
    : "px-6 pb-2";

  return (
    <>
      <Card className={cardClasses}>
        {layout === "horizontal" && imageUrl && (
          <div className={imageClasses}>
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className={contentClasses}>
          <CardHeader className="pb-2 space-y-1">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {source}
                </Badge>
                <span className="text-xs text-muted-foreground">{date}</span>
              </div>
              <Badge className={`${sentimentColors[sentiment]} text-xs`}>
                {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 cursor-pointer hover:text-primary" onClick={handleOpenKindleReader}>
              {title}
            </h3>
          </CardHeader>

          {layout === "vertical" && imageUrl && (
            <div className={imageClasses}>
              <div className="w-full h-40 relative overflow-hidden rounded-md">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
              {summary}
            </p>

            <div className="mb-3">
              <h4 className="text-sm font-medium mb-1">Key Points:</h4>
              <ul className="text-xs space-y-1 list-disc pl-4">
                {keyPoints.map((point, index) => (
                  <li key={index} className="line-clamp-2">
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {finalImplications && (
              <div>
                <h4 className="text-sm font-medium mb-1">Business Implications:</h4>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {finalImplications}
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-2 border-t flex justify-between">
            <div className="flex space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={handleSave}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isSaved ? "Remove from saved" : "Save article"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share article</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={handleOpenKindleReader}
                    >
                      <BookOpen className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Read in Kindle mode</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Dialog open={isAnnotationOpen} onOpenChange={setIsAnnotationOpen}>
                <DialogTrigger asChild>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add annotation</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Annotation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">{title}</h4>
                      <p className="text-sm text-muted-foreground">{summary}</p>
                    </div>
                    <Textarea
                      placeholder="Add your thoughts, insights, or notes about this article..."
                      value={annotation}
                      onChange={(e) => setAnnotation(e.target.value)}
                      rows={4}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAnnotationOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAnnotate} disabled={!annotation.trim()}>
                        Save Annotation
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {articleUrl && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      asChild
                    >
                      <a
                        href={articleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <span className="mr-1">Read full</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open original article</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardFooter>
        </div>
      </Card>

      {/* Kindle Reader Modal */}
      <KindleReader
        article={kindleArticle}
        open={isKindleReaderOpen}
        onOpenChange={setIsKindleReaderOpen}
        onSave={handleSave}
        onShare={handleShare}
        onAnnotate={handleAnnotate}
      />
    </>
  );
};

export default ArticleDigest;