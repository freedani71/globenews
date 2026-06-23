"use client";

/**
 * @file page.tsx
 * @fileoverview Admin-Dashboard für GlobeNews.
 *              Tabs: Benutzer-Verwaltung, Kommentar-Moderation, Gesperrte Benutzer.
 * @author Projektteam GlobeNews
 * @version 1.1
 * @date 2026-06-23
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, Users, BarChart3,
  Search, Crown, Loader2, ArrowLeft,
  UserCheck, UserX, Ban, MessageCircle, Trash2, Clock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Profile {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  is_banned: boolean;
  ban_count: number;
  ban_until: string | null;
  plan: string;
  created_at: string;
}

interface AdminComment {
  id: string;
  article_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleDateString("de-CH", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function BanBadge({ profile }: { profile: Profile }) {
  if (profile.is_banned) {
    return (
      <Badge variant="secondary" className="bg-destructive/10 text-destructive">
        <Ban className="w-3 h-3 mr-1" />
        Permanent
      </Badge>
    );
  }
  if (profile.ban_until && new Date(profile.ban_until) > new Date()) {
    return (
      <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
        <Clock className="w-3 h-3 mr-1" />
        Temp. gesperrt
      </Badge>
    );
  }
  return null;
}

export default function AdminPage() {
  const [loading, setLoading]         = useState(true);
  const [isAdmin, setIsAdmin]         = useState(false);
  const [profiles, setProfiles]       = useState<Profile[]>([]);
  const [comments, setComments]       = useState<AdminComment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [commentSearch, setCommentSearch] = useState("");
  const [stats, setStats] = useState({ totalUsers: 0, premiumUsers: 0, businessUsers: 0, admins: 0 });
  const router = useRouter();

  useEffect(() => { checkAdminAndLoadData(); }, []);

  const checkAdminAndLoadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) { router.push("/auth/login"); return; }

    // Prüfe is_admin direkt aus der profiles-Tabelle (nicht aus dem JWT-Token)
    const { data: ownProfile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    const userIsAdmin = ownProfile?.is_admin === true;
    setIsAdmin(userIsAdmin);

    if (!userIsAdmin) { setLoading(false); return; }

    const [{ data: profilesData }, { data: commentsData }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("comments").select("id, article_id, user_name, content, created_at").order("created_at", { ascending: false }).limit(200),
    ]);

    if (profilesData) {
      setProfiles(profilesData);
      setStats({
        totalUsers:    profilesData.length,
        premiumUsers:  profilesData.filter((p) => p.plan === "premium").length,
        businessUsers: profilesData.filter((p) => p.plan === "business").length,
        admins:        profilesData.filter((p) => p.is_admin).length,
      });
    }
    if (commentsData) setComments(commentsData);

    setLoading(false);
  };

  const updateUserPlan = async (userId: string, newPlan: string) => {
    const supabase = createClient();
    await supabase.from("profiles").update({ plan: newPlan }).eq("id", userId);
    setProfiles((p) => p.map((u) => u.id === userId ? { ...u, plan: newPlan } : u));
  };

  const toggleAdmin = async (userId: string, current: boolean) => {
    const supabase = createClient();
    await supabase.from("profiles").update({ is_admin: !current }).eq("id", userId);
    setProfiles((p) => p.map((u) => u.id === userId ? { ...u, is_admin: !current } : u));
  };

  const toggleBan = async (userId: string, current: boolean) => {
    const supabase = createClient();
    await supabase.from("profiles").update({ is_banned: !current }).eq("id", userId);
    setProfiles((p) => p.map((u) => u.id === userId ? { ...u, is_banned: !current } : u));
  };

  // Entsperrt vollständig: is_banned, ban_until, ban_count zurücksetzen
  const unban = async (userId: string) => {
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ is_banned: false, ban_until: null, ban_count: 0 })
      .eq("id", userId);
    setProfiles((p) =>
      p.map((u) =>
        u.id === userId ? { ...u, is_banned: false, ban_until: null, ban_count: 0 } : u
      )
    );
  };

  const deleteComment = async (commentId: string) => {
    const res = await fetch(`/api/comments?id=${commentId}`, { method: "DELETE" });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const bannedProfiles = profiles.filter(
    (p) => p.is_banned || (p.ban_until && new Date(p.ban_until) > new Date())
  );

  const filteredComments = comments.filter(
    (c) =>
      c.user_name.toLowerCase().includes(commentSearch.toLowerCase()) ||
      c.content.toLowerCase().includes(commentSearch.toLowerCase()) ||
      c.article_id.toLowerCase().includes(commentSearch.toLowerCase())
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
              <CardDescription>You need admin privileges to access this page.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to GlobeNews</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
            <Crown className="w-3 h-3 mr-1" />Administrator
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Nutzer gesamt", value: stats.totalUsers,    icon: Users,    color: "primary" },
            { label: "Premium",       value: stats.premiumUsers,  icon: Crown,    color: "accent" },
            { label: "Business",      value: stats.businessUsers, icon: BarChart3, color: "chart-4" },
            { label: "Admins",        value: stats.admins,        icon: Shield,   color: "destructive" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="glass border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold">{value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full bg-${color}/10 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />Benutzer ({profiles.length})
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageCircle className="w-4 h-4 mr-2" />Kommentare ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="banned">
              <Ban className="w-4 h-4 mr-2" />Gesperrt ({bannedProfiles.length})
            </TabsTrigger>
          </TabsList>

          {/* ── Benutzer-Tab ── */}
          <TabsContent value="users">
            <Card className="glass border-border/50">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Benutzer-Verwaltung</CardTitle>
                    <CardDescription>Plan, Admin-Rechte und Sperrstatus verwalten</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Suche..."
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
                    <div className="text-center py-8 text-muted-foreground">Keine Benutzer gefunden</div>
                  ) : (
                    filteredProfiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${profile.is_banned ? "bg-destructive/10" : "bg-primary/10"}`}>
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
                                <Shield className="w-3 h-3 mr-1" />Admin
                              </Badge>
                            )}
                            <BanBadge profile={profile} />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select value={profile.plan} onValueChange={(v) => updateUserPlan(profile.id, v)}>
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
                            variant="outline" size="icon"
                            onClick={() => toggleAdmin(profile.id, profile.is_admin)}
                            title={profile.is_admin ? "Admin entfernen" : "Zum Admin machen"}
                          >
                            {profile.is_admin ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </Button>

                          <Button
                            variant={profile.is_banned ? "default" : "outline"} size="icon"
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
          </TabsContent>

          {/* ── Kommentare-Tab ── */}
          <TabsContent value="comments">
            <Card className="glass border-border/50">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Kommentar-Moderation</CardTitle>
                    <CardDescription>Alle Kommentare einsehen und löschen</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Suche..."
                      value={commentSearch}
                      onChange={(e) => setCommentSearch(e.target.value)}
                      className="pl-9 bg-input/50"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredComments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Keine Kommentare gefunden</div>
                  ) : (
                    filteredComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-semibold text-primary">{comment.user_name}</span>
                            <span className="text-xs text-muted-foreground">{formatTime(comment.created_at)}</span>
                            <span className="text-[10px] text-muted-foreground/60 truncate max-w-[200px]" title={comment.article_id}>
                              {comment.article_id}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/90 break-words">{comment.content}</p>
                        </div>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteComment(comment.id)}
                          title="Kommentar löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Gesperrte Benutzer-Tab ── */}
          <TabsContent value="banned">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle>Gesperrte Benutzer</CardTitle>
                <CardDescription>Temporär und permanent gesperrte Accounts verwalten</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bannedProfiles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Keine gesperrten Benutzer</div>
                  ) : (
                    bannedProfiles.map((profile) => {
                      const tempBanActive = !profile.is_banned && profile.ban_until && new Date(profile.ban_until) > new Date();
                      const banUntilDate = profile.ban_until ? new Date(profile.ban_until) : null;
                      return (
                        <div
                          key={profile.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                              <span className="text-sm font-medium text-destructive">
                                {(profile.display_name || profile.email || "?")[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{profile.display_name || "Unknown"}</p>
                              <p className="text-sm text-muted-foreground">{profile.email}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-xs text-muted-foreground">
                                  Verstösse: <strong>{profile.ban_count ?? 0}</strong>
                                </span>
                                {tempBanActive && banUntilDate && (
                                  <span className="text-xs text-orange-500">
                                    Bis: {formatTime(banUntilDate.toISOString())}
                                  </span>
                                )}
                                {profile.is_banned && (
                                  <span className="text-xs text-destructive font-semibold">Permanent</span>
                                )}
                              </div>
                            </div>
                            <BanBadge profile={profile} />
                          </div>

                          <Button
                            variant="outline" size="sm"
                            onClick={() => unban(profile.id)}
                            className="border-green-500/40 text-green-500 hover:bg-green-500/10 hover:text-green-500 shrink-0"
                          >
                            <UserCheck className="w-4 h-4 mr-1.5" />
                            Entsperren
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
