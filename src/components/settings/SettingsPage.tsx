import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { databaseService } from "@/services/databaseService";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

const SettingsPage = () => {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [emailNotifications, setEmailNotifications] = useState(
    user?.preferences.emailNotifications ?? true,
  );
  const [pushNotifications, setPushNotifications] = useState(
    user?.preferences.pushNotifications ?? true,
  );
  const [weeklyDigest, setWeeklyDigest] = useState(
    user?.preferences.weeklyDigest ?? true,
  );
  const [timezone, setTimezone] = useState(
    user?.preferences.timezone ?? "America/New_York",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setEmailNotifications(user?.preferences.emailNotifications ?? true);
    setPushNotifications(user?.preferences.pushNotifications ?? true);
    setWeeklyDigest(user?.preferences.weeklyDigest ?? true);
    setTimezone(user?.preferences.timezone ?? "America/New_York");
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      if (supabase) {
        const { error } = await supabase
          .from("profiles")
          .update({
            name,
            preferences: {
              ...user.preferences,
              emailNotifications,
              pushNotifications,
              weeklyDigest,
              timezone,
            },
          })
          .eq("id", user.id);
        if (error) throw new Error(error.message);
      }
      logger.info("Settings saved", { userId: user.id });
      refresh();
      setSaved(true);
    } catch (err) {
      logger.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const result = await databaseService.exportUserData(user.id, "json");
      const blob = new Blob([JSON.stringify(result?.data ?? result, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `newsintel-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      logger.error("Export failed:", err instanceof Error ? err.message : err);
    } finally {
      setExporting(false);
    }
  };

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
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your profile and preferences</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saved ? "Saved" : "Save changes"}
        </Button>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your public profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email ?? ""} disabled />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email address.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose how you want to be notified</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notif">Email notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive insights and digests by email
                </p>
              </div>
              <Switch
                id="email-notif"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notif">Push notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Real-time alerts when tracked entities make news
                </p>
              </div>
              <Switch
                id="push-notif"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-digest">Weekly digest</Label>
                <p className="text-xs text-muted-foreground">
                  A summary of the week's key developments
                </p>
              </div>
              <Switch
                id="weekly-digest"
                checked={weeklyDigest}
                onCheckedChange={setWeeklyDigest}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data</CardTitle>
            <CardDescription>Export your personal data</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export Data (JSON)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;