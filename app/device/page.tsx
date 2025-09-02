"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function DeviceAuthorizationPage() {
  const [userCode, setUserCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);
    
    try {
      // Format the code: remove dashes and convert to uppercase
      const formattedCode = userCode.trim().replace(/-/g, "").toUpperCase();

      // Check if the code is valid by trying to navigate to approval page
      // The server will validate the code when the approval page loads
      if (formattedCode.length >= 4) {
        window.location.href = `/device/approve?user_code=${formattedCode}`;
        return;
      } else {
        throw new Error("Invalid code format");
      }
    } catch (err: any) {
      console.error('Device verification error:', err);
      setError("Invalid or expired code. Please check your code and try again.");
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">Device Authorization</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter the code displayed on your device to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                placeholder="Enter device code (e.g., ABCD-1234)"
                maxLength={12}
                className="text-center text-lg font-mono bg-card border-border text-foreground"
                disabled={isVerifying}
              />
            </div>
            
            {error && (
              <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-lg">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
              disabled={isVerifying || !userCode.trim()}
            >
              {isVerifying ? "Verifying..." : "Continue"}
            </Button>
          </form>
          
          <div className="mt-4 text-xs text-muted-foreground text-center">
            <p>Looking for the code? Check your CLI or device screen.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
