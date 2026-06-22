"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Users, Globe, BarChart3,
  Search, Crown, Loader2, ArrowLeft,
  UserCheck, UserX, Ban
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Profile {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  is_banned: boolean;
  plan: string;
  created_at: string;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    businessUsers: 0,
    admins: 0,
  });
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Check if user is admin from metadata
    const userIsAdmin = user.user_metadata?.is_admin === true;
    setIsAdmin(userIsAdmin);

    if (!userIsAdmin) {
      setLoading(false);
      return;
    }

    // Fetch all profiles (admin only)
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesData) {
      setProfiles(profilesData);
      setStats({
        totalUsers: profilesData.length,
        premiumUsers: profilesData.filter(p => p.plan === "premium").length,
        businessUsers: profilesData.filter(p => p.plan === "business").length,
        admins: profilesData.filter(p => p.is_admin).length,
      });
    }

    setLoading(false);
  };

  const updateUserPlan = async (userId: string, newPlan: string) => {
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ plan: newPlan })
      .eq("id", userId);
    
    setProfiles(profiles.map(p => 
      p.id === userId ? { ...p, plan: newPlan } : p
    ));
  };

  const toggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ is_admin: !currentIsAdmin })
      .eq("id", userId);

    setProfiles(profiles.map(p =>
      p.id === userId ? { ...p, is_admin: !currentIsAdmin } : p
    ));
  };

  const toggleBan = async (userId: string, currentIsBanned: boolean) => {
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ is_banned: !currentIsBanned })
      .eq("id", userId);

    setProfiles(profiles.map(p =>
      p.id === userId ? { ...p, is_banned: !currentIsBanned } : p
    ));
  };

  const filteredProfiles = profiles.filter(p => 
    p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md glass border-border/50">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
              <CardDescription className="text-muted-foreground">
                You need admin privileges to access this page.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to GlobeNews
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Crown className="w-3 h-3 mr-1" />
            Administrator
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Premium Users</p>
                  <p className="text-3xl font-bold">{stats.premiumUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Business Users</p>
                  <p className="text-3xl font-bold">{stats.businessUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-chart-4/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-chart-4" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-3xl font-bold">{stats.admins}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card className="glass border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts, plans, and permissions</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-input/50"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredProfiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              ) : (
                filteredProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${profile.is_banned ? "bg-destructive/10" : "bg-primary/10"}`}>
                        <span className={`text-sm font-medium ${profile.is_banned ? "text-destructive" : "text-primary"}`}>
                          {(profile.display_name || profile.email || "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{profile.display_name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {profile.is_admin && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {profile.is_banned && (
                          <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                            <Ban className="w-3 h-3 mr-1" />
                            Gesperrt
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-13 sm:ml-0">
                      <Select
                        value={profile.plan}
                        onValueChange={(value) => updateUserPlan(profile.id, value)}
                      >
                        <SelectTrigger className="w-32 bg-input/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleAdmin(profile.id, profile.is_admin)}
                        title={profile.is_admin ? "Admin entfernen" : "Admin machen"}
                      >
                        {profile.is_admin ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        variant={profile.is_banned ? "default" : "outline"}
                        size="icon"
                        onClick={() => toggleBan(profile.id, profile.is_banned)}
                        title={profile.is_banned ? "Entsperren" : "Sperren"}
                        className={profile.is_banned ? "bg-destructive hover:bg-destructive/90" : "hover:border-destructive hover:text-destructive"}
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
