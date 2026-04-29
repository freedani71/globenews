import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-destructive/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <Card className="w-full max-w-md glass border-border/50 relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
            <CardDescription className="text-muted-foreground">
              Something went wrong during authentication.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground text-center">
            This could be due to an expired link, invalid credentials, or a network issue.
          </div>
          
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1 bg-transparent">
              <Link href="/auth/login">Try again</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/">Go home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
