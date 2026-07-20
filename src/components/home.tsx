import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Search, 
  Settings, 
  RefreshCw, 
  Filter, 
  Crown,
  Zap,
  AlertTriangle,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DashboardContent from "./dashboard/DashboardContent";
import AgentConfigPanel from "./agents/AgentConfigPanel";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";
import { authService } from "@/services/authService";
import { databaseService } from "@/services/databaseService";

const Home = () => {
  const [isAgentConfigOpen, setIsAgentConfigOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  // Mock user data
  const user = {
    name: "Sarah Johnson",
    role: "Chief Executive Officer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  };

  // Mock agent data with enhanced status
  const [agents, setAgents] = useState([
    {
      id: 1,
      name: "Tech Industry",
      status: "active",
      lastUpdate: "10 min ago",
      articlesCollected: 24,
    },
    {
      id: 2,
      name: "Competitor Analysis",
      status: "active",
      lastUpdate: "1 hour ago",
      articlesCollected: 18,
    },
    { 
      id: 3, 
      name: "Market Trends", 
      status: "idle", 
      lastUpdate: "3 hours ago",
      articlesCollected: 12,
    },
    {
      id: 4,
      name: "Regulatory Changes",
      status: "active",
      lastUpdate: "30 min ago",
      articlesCollected: 15,
    },
  ]);

  useEffect(() => {
    // Check if user should see upgrade prompts
    const shouldShow = authService.shouldShowUpgradePrompt();
    setShowUpgradePrompt(shouldShow);
    
    // Auto-show subscription modal for trial users near expiration
    const trialDaysLeft = authService.getTrialDaysRemaining();
    if (trialDaysLeft <= 1 && trialDaysLeft > 0) {
      setIsSubscriptionModalOpen(true);
    }
  }, []);

  const trialDaysLeft = authService.getTrialDaysRemaining();
  const isTrialExpired = authService.isTrialExpired();
  const isFreeTier = currentUser?.subscription.name === 'free';

  // Enhanced notifications with subscription prompts
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New insights from Tech Industry agent",
      message: "5 new articles about AI regulation found",
      time: "10 minutes ago",
      read: false,
    },
    ...(showUpgradePrompt ? [{
      id: 99,
      title: "🚀 Unlock Premium Features",
      message: `${isFreeTier ? 'Upgrade to access AI synthesis and real-time monitoring' : `Trial expires in ${trialDaysLeft} days`}`,
      time: "now",
      read: false,
      isUpgrade: true,
    }] : []),
    {
      id: 2,
      title: "Market Trends agent needs attention",
      message: "Agent configuration may need updating",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      title: "Weekly summary ready",
      message: "Your weekly news digest is available",
      time: "2 hours ago",
      read: true,
    },
  ]);

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notificationId: number) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification?.isUpgrade) {
      setIsSubscriptionModalOpen(true);
    }
    
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const handleRefreshAll = () => {
    // Simulate refreshing all agents
    setAgents(agents.map(agent => ({
      ...agent,
      lastUpdate: "Just now",
      articlesCollected: agent.articlesCollected + Math.floor(Math.random() * 5),
    })));
  };

  const handleAgentConfigClose = () => {
    setIsAgentConfigOpen(false);
  };

  const renderSubscriptionBanner = () => {
    if (isTrialExpired) {
      return (
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-3 flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span className="font-medium">Trial Expired - Upgrade to continue using NewsIntel</span>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setIsSubscriptionModalOpen(true)}
          >
            Upgrade Now
          </Button>
        </div>
      );
    }

    if (trialDaysLeft <= 3 && trialDaysLeft > 0) {
      return (
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white p-3 flex items-center justify-between">
          <div className="flex items-center">
            <Gift className="h-5 w-5 mr-2" />
            <span className="font-medium">
              Trial expires in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} - Upgrade to keep your data!
            </span>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setIsSubscriptionModalOpen(true)}
          >
            <Crown className="h-4 w-4 mr-1" />
            Upgrade
          </Button>
        </div>
      );
    }

    if (isFreeTier && currentUser?.usage.monthlyUsage.articlesViewed > 30) {
      return (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            <span className="font-medium">
              You're a power user! Unlock AI synthesis and unlimited articles
            </span>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setIsSubscriptionModalOpen(true)}
          >
            <Crown className="h-4 w-4 mr-1" />
            Upgrade
          </Button>
        </div>
      );
    }

    return null;
  };

  const renderUsageLimits = () => {
    if (!currentUser || currentUser.subscription.name === 'enterprise') return null;

    const articlesUsed = currentUser.usage.monthlyUsage.articlesViewed;
    const articlesLimit = currentUser.subscription.limits.articlesPerMonth;
    const agentsUsed = currentUser.usage.agentsCreated;
    const agentsLimit = currentUser.subscription.features.maxAgents;

    const articlesPercentage = articlesLimit === -1 ? 0 : (articlesUsed / articlesLimit) * 100;
    const agentsPercentage = agentsLimit === -1 ? 0 : (agentsUsed / agentsLimit) * 100;

    if (articlesPercentage < 70 && agentsPercentage < 70) return null;

    return (
      <Card className="mb-4 border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-orange-900">Usage Limits</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="text-orange-700 border-orange-300"
            >
              Upgrade
            </Button>
          </div>
          <div className="space-y-2">
            {articlesPercentage >= 70 && (
              <div>
                <div className="flex justify-between text-sm text-orange-700">
                  <span>Articles this month</span>
                  <span>{articlesUsed}/{articlesLimit === -1 ? '∞' : articlesLimit}</span>
                </div>
                <Progress value={articlesPercentage} className="h-2" />
              </div>
            )}
            {agentsPercentage >= 70 && (
              <div>
                <div className="flex justify-between text-sm text-orange-700">
                  <span>AI Agents</span>
                  <span>{agentsUsed}/{agentsLimit === -1 ? '∞' : agentsLimit}</span>
                </div>
                <Progress value={agentsPercentage} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex h-screen w-full bg-background flex-col">
      {/* Subscription Banner */}
      {renderSubscriptionBanner()}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r bg-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold text-primary">NewsIntel</h1>
            {currentUser?.subscription.name !== 'free' && (
              <Badge variant="secondary" className="text-xs">
                {currentUser?.subscription.name}
              </Badge>
            )}
          </div>

          {/* Usage Limits */}
          {renderUsageLimits()}

          <div className="space-y-1">
            <Button
              variant={activeTab === "all" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("all")}
            >
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setIsAgentConfigOpen(true)}
            >
              Configure Agents
              {!currentUser?.subscription.features.realTimeMonitoring && (
                <Crown className="h-3 w-3 ml-auto text-amber-500" />
              )}
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Saved Articles
              {currentUser?.subscription.limits.savedArticles !== -1 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  5/{currentUser?.subscription.limits.savedArticles}
                </span>
              )}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => !currentUser?.subscription.features.teamCollaboration && setIsSubscriptionModalOpen(true)}
            >
              Shared Insights
              {!currentUser?.subscription.features.teamCollaboration && (
                <Crown className="h-3 w-3 ml-auto text-amber-500" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => !currentUser?.subscription.features.advancedAnalytics && setIsSubscriptionModalOpen(true)}
            >
              Analytics
              {!currentUser?.subscription.features.advancedAnalytics && (
                <Crown className="h-3 w-3 ml-auto text-amber-500" />
              )}
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Settings
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2 flex-grow">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Your Agents</h3>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  {currentUser?.usage.agentsCreated}/{currentUser?.subscription.features.maxAgents === -1 ? '∞' : currentUser?.subscription.features.maxAgents}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshAll}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-2 text-sm rounded-md hover:bg-accent cursor-pointer group"
              >
                <div className="flex items-center flex-1">
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      agent.status === "active" ? "bg-green-500" : "bg-amber-500"
                    }`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {agent.articlesCollected} articles
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground group-hover:hidden">
                  {agent.lastUpdate}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAgentConfigOpen(true);
                  }}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            ))}
            
            {/* Upgrade prompt for more agents */}
            {currentUser && currentUser.usage.agentsCreated >= currentUser.subscription.features.maxAgents && currentUser.subscription.features.maxAgents !== -1 && (
              <div 
                className="p-2 text-sm rounded-md border-2 border-dashed border-amber-300 bg-amber-50 cursor-pointer hover:bg-amber-100"
                onClick={() => setIsSubscriptionModalOpen(true)}
              >
                <div className="flex items-center justify-center text-amber-700">
                  <Crown className="h-4 w-4 mr-2" />
                  <span className="font-medium">Upgrade for more agents</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4">
            <div className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="border-b bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center w-1/3">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search news and insights..."
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={handleRefreshAll}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh All</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadNotificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadNotificationCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="p-2">
                      <h3 className="font-medium">Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        {unreadNotificationCount > 0 
                          ? `You have ${unreadNotificationCount} unread notifications`
                          : "All caught up!"
                        }
                      </p>
                    </div>
                    {notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id)}
                        className={`cursor-pointer ${!notification.read ? 'bg-accent/50' : ''} ${notification.isUpgrade ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''}`}
                      >
                        <div className="flex flex-col w-full">
                          <div className="flex items-center justify-between">
                            <span className={`font-medium text-sm ${notification.isUpgrade ? 'text-blue-700' : ''}`}>
                              {notification.title}
                            </span>
                            {!notification.read && !notification.isUpgrade && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                            {notification.isUpgrade && (
                              <Crown className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {notification.message}
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            {notification.time}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsSubscriptionModalOpen(true)}>
                      <Crown className="h-4 w-4 mr-2" />
                      Subscription
                    </DropdownMenuItem>
                    <DropdownMenuItem>Notification Preferences</DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => !currentUser?.subscription.features.exportData && setIsSubscriptionModalOpen(true)}
                    >
                      Export Data
                      {!currentUser?.subscription.features.exportData && (
                        <Crown className="h-3 w-3 ml-auto text-amber-500" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem>Help & Support</DropdownMenuItem>
                    <DropdownMenuItem>Sign Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Dashboard Tabs */}
          <div className="p-4 flex-1 overflow-hidden">
            <Tabs defaultValue="all" className="w-full h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="all">All Insights</TabsTrigger>
                  <TabsTrigger value="tech">Tech Industry</TabsTrigger>
                  <TabsTrigger value="market">Market Trends</TabsTrigger>
                  <TabsTrigger value="competitors">Competitors</TabsTrigger>
                  <TabsTrigger value="regulatory">Regulatory</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="all" className="mt-0 h-full">
                  <DashboardContent onConfigureAgent={() => setIsAgentConfigOpen(true)} />
                </TabsContent>

                <TabsContent value="tech" className="mt-0 h-full">
                  <DashboardContent 
                    category="tech" 
                    onConfigureAgent={() => setIsAgentConfigOpen(true)} 
                  />
                </TabsContent>

                <TabsContent value="market" className="mt-0 h-full">
                  <DashboardContent 
                    category="market" 
                    onConfigureAgent={() => setIsAgentConfigOpen(true)} 
                  />
                </TabsContent>

                <TabsContent value="competitors" className="mt-0 h-full">
                  <DashboardContent 
                    category="competitors" 
                    onConfigureAgent={() => setIsAgentConfigOpen(true)} 
                  />
                </TabsContent>

                <TabsContent value="regulatory" className="mt-0 h-full">
                  <DashboardContent 
                    category="regulatory" 
                    onConfigureAgent={() => setIsAgentConfigOpen(true)} 
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Agent Configuration Modal */}
      <AgentConfigPanel 
        open={isAgentConfigOpen} 
        onOpenChange={setIsAgentConfigOpen}
        onClose={handleAgentConfigClose}
      />

      {/* Subscription Modal */}
      <SubscriptionModal 
        open={isSubscriptionModalOpen}
        onOpenChange={setIsSubscriptionModalOpen}
      />
    </div>
  );
};

export default Home;