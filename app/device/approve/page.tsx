"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function DeviceApprovalPage() {
  const { data: session, isPending } = useSession();
  const searchParams = useSearchParams();
  const userCode = searchParams.get("user_code");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      const redirectUrl = `/device/approve?user_code=${userCode}`;
      window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
    }
  }, [session, isPending, userCode]);
  
  const handleApprove = async () => {
    if (!userCode) return;
    
    setIsProcessing(true);
    setMessage(null);
    
    try {
      await authClient.device.approve({
        userCode: userCode,
      });
      setMessage("Device approved successfully! You can now return to your device.");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (error: any) {
      console.error('Failed to approve device:', error);
      setMessage("Failed to approve device. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeny = async () => {
    if (!userCode) return;
    
    setIsProcessing(true);
    setMessage(null);
    
    try {
      await authClient.device.deny({
        userCode: userCode,
      });
      setMessage("Device authorization denied.");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (error: any) {
      console.error('Failed to deny device:', error);
      setMessage("Failed to deny device. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading while checking authentication
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!session?.user) {
    return null;
  }

  // Show error if no user code
  if (!userCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Request</CardTitle>
            <CardDescription>No device code provided.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Device Authorization</CardTitle>
          <CardDescription>
            A device is requesting access to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">Device Code:</p>
            <p className="text-lg font-mono font-semibold">{userCode}</p>
          </div>
          
          <div className="text-sm text-gray-600 text-center">
            <p>Signed in as: <strong>{session.user.name || session.user.email}</strong></p>
          </div>
          
          {message && (
            <div className={`text-sm text-center p-3 rounded ${
              message.includes('successfully') || message.includes('denied') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}
          
          <div className="flex space-x-3">
            <Button 
              onClick={handleApprove} 
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? "Processing..." : "Approve"}
            </Button>
            <Button 
              onClick={handleDeny} 
              disabled={isProcessing}
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
            >
              {isProcessing ? "Processing..." : "Deny"}
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            <p>Only approve if you initiated this request from your device.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
