import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      
      <Card className="w-full max-w-md glass border-border/50 relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-accent" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription className="text-muted-foreground">
              We sent you a confirmation link. Click it to activate your account.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground text-center">
            Once confirmed, you can sign in and start exploring global news on an interactive 3D globe.
          </div>
          
          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href="/auth/login">
              <Globe className="w-4 h-4 mr-2" />
              Back to sign in
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
