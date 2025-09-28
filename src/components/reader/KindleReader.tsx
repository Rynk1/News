import React, { useState, useEffect } from "react";
import { 
  Book, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Sun, 
  Moon, 
  Type,
  Bookmark,
  BookmarkCheck,
  Share2,
  MessageSquare,
  X,
  Minus,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KindleReaderProps {
  article?: {
    id: number;
    title: string;
    source: string;
    date: string;
    author?: string;
    content: string;
    summary: string;
    keyPoints: string[];
    implications: string;
    sentiment: "positive" | "negative" | "neutral";
    imageUrl?: string;
    estimatedReadTime?: number;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave?: () => void;
  onShare?: () => void;
  onAnnotate?: (annotation: string) => void;
}

interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  theme: 'light' | 'dark' | 'sepia';
  lineHeight: number;
  margin: number;
  brightness: number;
}

const KindleReader = ({
  article = {
    id: 1,
    title: "AI Breakthrough Could Revolutionize Supply Chain Management",
    source: "Tech Insights",
    date: "2 hours ago",
    author: "Dr. Sarah Chen",
    content: `The global supply chain industry stands on the brink of a revolutionary transformation, thanks to a groundbreaking artificial intelligence algorithm developed by researchers at MIT's Computer Science and Artificial Intelligence Laboratory (CSAIL). This innovative system promises to predict supply chain disruptions with an unprecedented 95% accuracy rate, potentially saving businesses billions of dollars in lost revenue and operational inefficiencies.

The algorithm, dubbed "SupplyChain AI," represents a significant leap forward in predictive analytics for logistics and supply chain management. Unlike traditional forecasting methods that rely on historical data and linear projections, this AI system employs a sophisticated neural network architecture that processes real-time data from multiple sources simultaneously.

**How the Technology Works**

The system integrates data streams from weather monitoring stations, social media sentiment analysis, shipping tracker APIs, port congestion reports, and economic indicators. By analyzing these diverse data points in real-time, the AI can identify patterns and correlations that human analysts might miss.

"What makes this system unique is its ability to understand the interconnected nature of global supply chains," explains Dr. Sarah Chen, the lead researcher on the project. "A political event in one country, combined with weather patterns in another, might seem unrelated to human observers, but our AI can detect how these factors will cascade through the supply chain weeks in advance."

The algorithm uses advanced machine learning techniques, including transformer neural networks and attention mechanisms, to weigh the importance of different factors dynamically. This allows it to adapt to changing global conditions and maintain its accuracy even as supply chain dynamics evolve.

**Real-World Testing and Results**

The research team conducted extensive testing over an 18-month period, partnering with several Fortune 500 companies across different industries. The results were remarkable: the AI system successfully predicted 95% of major supply chain disruptions 2-3 weeks before they occurred.

In one notable case study, the system predicted a semiconductor shortage three weeks before it materialized, allowing a major electronics manufacturer to secure alternative suppliers and avoid a production shutdown that would have cost an estimated $50 million.

Another success story involved predicting port congestion at the Port of Los Angeles. The AI system detected early warning signs from shipping schedules, weather patterns, and labor negotiations, giving logistics companies time to reroute shipments through alternative ports.

**Implementation and Cost Considerations**

While the technology shows tremendous promise, implementation comes with significant considerations. The estimated cost for enterprise-level deployment ranges from $500,000 to $2 million, depending on the complexity of the supply chain and the number of data sources integrated.

However, early adopters report that the return on investment is substantial. Companies using the system have seen:
- 30% reduction in supply chain disruptions
- 15% savings in emergency logistics costs  
- 25% improvement in inventory optimization
- 40% reduction in stockout incidents

The system requires integration with existing enterprise resource planning (ERP) systems and supply chain management platforms. Most implementations take 3-6 months to fully deploy and calibrate.

**Industry Impact and Future Implications**

The implications of this technology extend far beyond individual companies. If widely adopted, SupplyChain AI could fundamentally reshape global trade patterns and supply chain strategies.

"We're looking at a future where supply chain disruptions become predictable events rather than unexpected crises," notes Dr. Chen. "This could lead to more resilient global trade networks and reduced economic volatility."

The technology is particularly relevant in the post-pandemic world, where supply chain resilience has become a critical business priority. The COVID-19 pandemic exposed the fragility of global supply chains, with disruptions cascading across industries and continents.

**Challenges and Limitations**

Despite its impressive accuracy, the system is not without limitations. The AI requires high-quality, real-time data feeds, which can be expensive to maintain. Additionally, the system's predictions are only as good as the data it receives, making data quality and source reliability critical factors.

Privacy and security concerns also need to be addressed, as the system requires access to sensitive business data and real-time operational information. Companies must implement robust cybersecurity measures to protect this valuable intelligence.

**Looking Ahead**

The research team is already working on the next generation of the system, which will incorporate additional data sources such as satellite imagery, IoT sensor networks, and blockchain-based supply chain tracking. They're also exploring applications in other industries, including healthcare supply chains and food distribution networks.

As businesses continue to grapple with supply chain challenges in an increasingly complex global economy, technologies like SupplyChain AI represent a crucial step toward more resilient and efficient operations. The question is no longer whether AI will transform supply chain management, but how quickly companies can adapt to leverage these powerful new capabilities.

The future of supply chain management is here, and it's powered by artificial intelligence.`,
    summary: "Researchers have developed a new AI algorithm that can predict supply chain disruptions with 95% accuracy, potentially saving global businesses billions in lost revenue.",
    keyPoints: [
      "Algorithm uses real-time data from multiple sources including weather, social media, and shipping trackers",
      "Early tests show 95% accuracy in predicting disruptions up to 2 weeks in advance",
      "Implementation costs estimated at $500K for enterprise-level businesses",
    ],
    implications: "Companies implementing this technology could see a 30% reduction in supply chain disruptions and an estimated 15% savings in emergency logistics costs.",
    sentiment: "positive",
    imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
    estimatedReadTime: 8,
  },
  open = false,
  onOpenChange,
  onSave,
  onShare,
  onAnnotate,
}: KindleReaderProps) => {
  const [settings, setSettings] = useState<ReaderSettings>({
    fontSize: 16,
    fontFamily: 'serif',
    theme: 'light',
    lineHeight: 1.6,
    margin: 20,
    brightness: 100,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // Calculate reading progress based on scroll position
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target) {
        const scrollTop = target.scrollTop;
        const scrollHeight = target.scrollHeight - target.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        setReadingProgress(Math.min(progress, 100));
      }
    };

    const contentElement = document.getElementById('kindle-content');
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const themeStyles = {
    light: {
      background: '#ffffff',
      text: '#000000',
      secondary: '#666666',
    },
    dark: {
      background: '#1a1a1a',
      text: '#e0e0e0',
      secondary: '#a0a0a0',
    },
    sepia: {
      background: '#f4f1ea',
      text: '#5c4b37',
      secondary: '#8b7355',
    },
  };

  const currentTheme = themeStyles[settings.theme];

  const fontFamilies = {
    serif: 'Georgia, "Times New Roman", serif',
    'sans-serif': 'Arial, Helvetica, sans-serif',
    'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const handleSave = () => {
    setIsBookmarked(!isBookmarked);
    onSave?.();
  };

  const formatContent = (content: string) => {
    // Split content into paragraphs and format
    return content.split('\n\n').map((paragraph, index) => {
      if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
        // Handle bold headers
        return (
          <h3 key={index} className="font-bold text-xl mb-4 mt-6">
            {paragraph.replace(/\*\*/g, '')}
          </h3>
        );
      }
      return (
        <p key={index} className="mb-4">
          {paragraph}
        </p>
      );
    });
  };

  const sentimentColors = {
    positive: "bg-green-100 text-green-800 border-green-200",
    negative: "bg-red-100 text-red-800 border-red-200",
    neutral: "bg-blue-100 text-blue-800 border-blue-200",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-6xl max-h-[95vh] p-0 overflow-hidden"
        style={{ 
          backgroundColor: currentTheme.background,
          color: currentTheme.text,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: currentTheme.secondary + '40' }}>
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6" style={{ color: currentTheme.text }} />
            <div>
              <h2 className="font-semibold text-lg line-clamp-1">{article.title}</h2>
              <div className="flex items-center space-x-2 text-sm" style={{ color: currentTheme.secondary }}>
                <span>{article.source}</span>
                <span>•</span>
                <span>{article.date}</span>
                {article.author && (
                  <>
                    <span>•</span>
                    <span>by {article.author}</span>
                  </>
                )}
                {article.estimatedReadTime && (
                  <>
                    <span>•</span>
                    <span>{article.estimatedReadTime} min read</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={sentimentColors[article.sentiment]}>
              {article.sentiment.charAt(0).toUpperCase() + article.sentiment.slice(1)}
            </Badge>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              style={{ color: currentTheme.text }}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-5 w-5 text-primary" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onShare}
              style={{ color: currentTheme.text }}
            >
              <Share2 className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              style={{ color: currentTheme.text }}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Reading Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Settings Panel */}
          {showSettings && (
            <div className="w-80 border-r p-4 space-y-6" style={{ borderColor: currentTheme.secondary + '40' }}>
              <h3 className="font-semibold text-lg">Reading Settings</h3>
              
              {/* Theme */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Theme</label>
                <div className="flex space-x-2">
                  <Button
                    variant={settings.theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, theme: 'light' }))}
                  >
                    <Sun className="h-4 w-4 mr-1" />
                    Light
                  </Button>
                  <Button
                    variant={settings.theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, theme: 'dark' }))}
                  >
                    <Moon className="h-4 w-4 mr-1" />
                    Dark
                  </Button>
                  <Button
                    variant={settings.theme === 'sepia' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, theme: 'sepia' }))}
                  >
                    Sepia
                  </Button>
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Font Size</label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSettings(prev => ({ ...prev, fontSize: Math.max(12, prev.fontSize - 1) }))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center">{settings.fontSize}px</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSettings(prev => ({ ...prev, fontSize: Math.min(24, prev.fontSize + 1) }))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Font Family */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Font Family</label>
                <Select 
                  value={settings.fontFamily} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, fontFamily: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="sans-serif">Sans Serif</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Line Height */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Line Height</label>
                <Slider
                  value={[settings.lineHeight]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, lineHeight: value }))}
                  min={1.2}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <span className="text-xs" style={{ color: currentTheme.secondary }}>{settings.lineHeight.toFixed(1)}</span>
              </div>

              {/* Margin */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Margin</label>
                <Slider
                  value={[settings.margin]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, margin: value }))}
                  min={10}
                  max={50}
                  step={5}
                  className="w-full"
                />
                <span className="text-xs" style={{ color: currentTheme.secondary }}>{settings.margin}px</span>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea 
              id="kindle-content"
              className="flex-1"
              style={{ 
                backgroundColor: currentTheme.background,
                color: currentTheme.text,
              }}
            >
              <div 
                className="max-w-4xl mx-auto"
                style={{ 
                  padding: `${settings.margin}px`,
                  fontSize: `${settings.fontSize}px`,
                  fontFamily: fontFamilies[settings.fontFamily as keyof typeof fontFamilies],
                  lineHeight: settings.lineHeight,
                }}
              >
                {/* Article Header */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
                  
                  {article.imageUrl && (
                    <div className="mb-6">
                      <img 
                        src={article.imageUrl} 
                        alt={article.title}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: currentTheme.secondary + '20' }}>
                    <h3 className="font-semibold mb-2">Executive Summary</h3>
                    <p style={{ color: currentTheme.secondary }}>{article.summary}</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Key Points</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      {article.keyPoints.map((point, index) => (
                        <li key={index} style={{ color: currentTheme.secondary }}>{point}</li>
                      ))}
                    </ul>
                  </div>

                  <Separator className="my-6" />
                </div>

                {/* Article Content */}
                <div className="prose prose-lg max-w-none">
                  {formatContent(article.content)}
                </div>

                {/* Business Implications */}
                <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: currentTheme.secondary + '20' }}>
                  <h3 className="font-semibold mb-2">Business Implications</h3>
                  <p style={{ color: currentTheme.secondary }}>{article.implications}</p>
                </div>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: currentTheme.secondary + '40' }}>
              <div className="text-sm" style={{ color: currentTheme.secondary }}>
                Reading Progress: {Math.round(readingProgress)}%
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAnnotate?.("")}
                  style={{ color: currentTheme.text }}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Add Note
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KindleReader;