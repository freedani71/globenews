"use client";

import React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Loader2, AlertCircle, Shield } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

export default function SignUpPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loading = isPending;
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    formData.set("isAdmin", isAdmin.toString());
    
    startTransition(async () => {
      const result = await signUp(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success && result.redirectTo) {
        router.push(result.redirectTo);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      
      <Card className="w-full max-w-md glass border-border/50 relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription className="text-muted-foreground">
              Join GlobeNews to explore world news
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-input/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-input/50"
              />
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Checkbox 
                id="isAdmin" 
                checked={isAdmin}
                onCheckedChange={(checked) => setIsAdmin(checked === true)}
              />
              <div className="flex-1">
                <Label htmlFor="isAdmin" className="flex items-center gap-2 cursor-pointer">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-medium">Admin Account</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Full access to all features and admin dashboard
                </p>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign up"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
