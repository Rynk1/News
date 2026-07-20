import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Crown, 
  Zap, 
  TrendingUp, 
  Users, 
  BarChart3, 
  FileText, 
  Shield, 
  Sparkles,
  Check,
  X,
  ArrowRight,
  Gift,
  Clock,
  Star
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const SubscriptionModal = ({ 
  open = false, 
  onOpenChange,
  trigger 
}: SubscriptionModalProps) => {
  const { user: currentUser, refresh } = useAuth();
  const [selectedTier, setSelectedTier] = useState<string>('starter');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [subscriptionTiers] = useState(authService.getSubscriptionTiers());

  const trialDaysLeft = authService.getTrialDaysRemaining();
  const shouldShowUrgency = trialDaysLeft <= 3 && trialDaysLeft > 0;

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const result = await authService.upgradeSubscription(selectedTier);
      if (result.success) {
        refresh();
        onOpenChange?.(false);
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  const getFeatureIcon = (feature: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'maxAgents': <Users className="h-4 w-4" />,
      'realTimeMonitoring': <Zap className="h-4 w-4" />,
      'advancedAnalytics': <BarChart3 className="h-4 w-4" />,
      'customReports': <FileText className="h-4 w-4" />,
      'apiAccess': <Shield className="h-4 w-4" />,
      'prioritySupport': <Star className="h-4 w-4" />,
      'kindleReader': <FileText className="h-4 w-4" />,
      'aiSynthesis': <Sparkles className="h-4 w-4" />,
    };
    return icons[feature] || <Check className="h-4 w-4" />;
  };

  const getTierColor = (tierName: string) => {
    const colors = {
      free: 'border-gray-200 bg-gray-50',
      starter: 'border-blue-200 bg-blue-50',
      professional: 'border-purple-200 bg-purple-50 ring-2 ring-purple-500',
      enterprise: 'border-amber-200 bg-amber-50',
    };
    return colors[tierName as keyof typeof colors] || colors.free;
  };

  const getTierBadge = (tierName: string) => {
    if (tierName === 'professional') {
      return (
        <Badge className="bg-purple-500 text-white mb-2">
          <Crown className="h-3 w-3 mr-1" />
          Most Popular
        </Badge>
      );
    }
    if (tierName === 'starter' && shouldShowUrgency) {
      return (
        <Badge className="bg-orange-500 text-white mb-2">
          <Gift className="h-3 w-3 mr-1" />
          Limited Time
        </Badge>
      );
    }
    return null;
  };

  const renderFeatureComparison = () => {
    const features = [
      { key: 'maxAgents', label: 'AI Agents', type: 'number' },
      { key: 'maxSources', label: 'News Sources', type: 'number' },
      { key: 'articlesPerMonth', label: 'Articles/Month', type: 'limit' },
      { key: 'realTimeMonitoring', label: 'Real-time Monitoring', type: 'boolean' },
      { key: 'advancedAnalytics', label: 'Advanced Analytics', type: 'boolean' },
      { key: 'kindleReader', label: 'Kindle Reader', type: 'boolean' },
      { key: 'aiSynthesis', label: 'AI Synthesis', type: 'boolean' },
      { key: 'customReports', label: 'Custom Reports', type: 'boolean' },
      { key: 'apiAccess', label: 'API Access', type: 'boolean' },
      { key: 'prioritySupport', label: 'Priority Support', type: 'boolean' },
      { key: 'teamCollaboration', label: 'Team Features', type: 'boolean' },
    ];

    return (
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Feature Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Feature</th>
                {subscriptionTiers.map(tier => (
                  <th key={tier.id} className="text-center p-3 font-medium capitalize">
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map(feature => (
                <tr key={feature.key} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{feature.label}</td>
                  {subscriptionTiers.map(tier => {
                    let value;
                    if (feature.type === 'number') {
                      value = tier.features[feature.key as keyof typeof tier.features];
                      value = value === -1 ? 'Unlimited' : value;
                    } else if (feature.type === 'limit') {
                      value = tier.limits[feature.key as keyof typeof tier.limits];
                      value = value === -1 ? 'Unlimited' : value;
                    } else {
                      value = tier.features[feature.key as keyof typeof tier.features];
                    }

                    return (
                      <td key={tier.id} className="p-3 text-center">
                        {feature.type === 'boolean' ? (
                          value ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )
                        ) : (
                          <span className="font-medium">{value}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Choose Your NewsIntel Plan
          </DialogTitle>
        </DialogHeader>

        {/* Urgency Banner */}
        {shouldShowUrgency && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                <span className="font-semibold">
                  Trial expires in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}!
                </span>
              </div>
              <div className="text-sm">
                Upgrade now to keep your agents and data
              </div>
            </div>
          </div>
        )}

        {/* Current Usage */}
        {currentUser && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Your Current Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Articles This Month</div>
                  <div className="flex items-center mt-1">
                    <Progress 
                      value={(currentUser.usage.monthlyUsage.articlesViewed / currentUser.subscription.limits.articlesPerMonth) * 100} 
                      className="flex-1 mr-2" 
                    />
                    <span className="text-sm font-medium">
                      {currentUser.usage.monthlyUsage.articlesViewed}/{currentUser.subscription.limits.articlesPerMonth === -1 ? '∞' : currentUser.subscription.limits.articlesPerMonth}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Active Agents</div>
                  <div className="flex items-center mt-1">
                    <Progress 
                      value={(currentUser.usage.agentsCreated / currentUser.subscription.features.maxAgents) * 100} 
                      className="flex-1 mr-2" 
                    />
                    <span className="text-sm font-medium">
                      {currentUser.usage.agentsCreated}/{currentUser.subscription.features.maxAgents === -1 ? '∞' : currentUser.subscription.features.maxAgents}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Saved Articles</div>
                  <div className="flex items-center mt-1">
                    <Progress 
                      value={50} 
                      className="flex-1 mr-2" 
                    />
                    <span className="text-sm font-medium">
                      5/{currentUser.subscription.limits.savedArticles === -1 ? '∞' : currentUser.subscription.limits.savedArticles}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {subscriptionTiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedTier === tier.id ? 'ring-2 ring-primary' : ''
              } ${getTierColor(tier.name)}`}
              onClick={() => setSelectedTier(tier.id)}
            >
              <CardHeader className="text-center pb-2">
                {getTierBadge(tier.name)}
                <CardTitle className="capitalize text-xl">{tier.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">
                    ${tier.price}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                {tier.name === 'starter' && shouldShowUrgency && (
                  <div className="text-sm text-orange-600 font-medium mt-1">
                    🔥 50% off first month!
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      {tier.features.maxAgents === -1 ? 'Unlimited' : tier.features.maxAgents} AI Agents
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      {tier.limits.articlesPerMonth === -1 ? 'Unlimited' : tier.limits.articlesPerMonth} Articles/month
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      {tier.features.maxSources === -1 ? 'Unlimited' : tier.features.maxSources} News Sources
                    </span>
                  </div>
                  
                  {tier.features.realTimeMonitoring && (
                    <div className="flex items-center text-sm text-green-600">
                      <Zap className="h-4 w-4 mr-2" />
                      <span>Real-time Monitoring</span>
                    </div>
                  )}
                  
                  {tier.features.kindleReader && (
                    <div className="flex items-center text-sm text-blue-600">
                      <FileText className="h-4 w-4 mr-2" />
                      <span>Kindle Reader</span>
                    </div>
                  )}
                  
                  {tier.features.aiSynthesis && (
                    <div className="flex items-center text-sm text-purple-600">
                      <Sparkles className="h-4 w-4 mr-2" />
                      <span>AI Synthesis</span>
                    </div>
                  )}

                  {tier.features.prioritySupport && (
                    <div className="flex items-center text-sm text-amber-600">
                      <Star className="h-4 w-4 mr-2" />
                      <span>Priority Support</span>
                    </div>
                  )}
                </div>

                {tier.name !== 'free' && (
                  <Button 
                    className="w-full mt-4" 
                    variant={selectedTier === tier.id ? "default" : "outline"}
                    disabled={currentUser?.subscription.name === tier.name}
                  >
                    {currentUser?.subscription.name === tier.name ? 'Current Plan' : 'Select Plan'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison Table */}
        {renderFeatureComparison()}

        {/* Psychological Nudges */}
        <div className="mt-8 space-y-4">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Sparkles className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <div className="font-semibold text-blue-900">
                    Join 1,200+ executives who trust NewsIntel
                  </div>
                  <div className="text-sm text-blue-700">
                    "NewsIntel's AI agents save me 2 hours daily on market research" - Sarah K., CEO
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {shouldShowUrgency && (
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Gift className="h-5 w-5 text-orange-500 mr-3" />
                  <div>
                    <div className="font-semibold text-orange-900">
                      Don't lose your configured agents and saved articles!
                    </div>
                    <div className="text-sm text-orange-700">
                      Upgrade now to preserve all your personalized settings and data.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedTier !== 'free' && (
              <>
                30-day money-back guarantee • Cancel anytime • Secure payment
              </>
            )}
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => onOpenChange?.(false)}>
              Maybe Later
            </Button>
            {selectedTier !== 'free' && (
              <Button 
                onClick={handleUpgrade}
                disabled={isUpgrading || currentUser?.subscription.name === selectedTier}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {isUpgrading ? (
                  'Processing...'
                ) : (
                  <>
                    Upgrade Now
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;