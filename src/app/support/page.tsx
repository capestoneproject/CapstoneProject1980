"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Video } from "lucide-react";
import VideoCall from "@/components/video-call";

interface SupportRequest {
  id: string;
  roomId: string;
  createdAt: string;
  status: "pending" | "active" | "completed";
}

export default function SupportPage() {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeRequest, setActiveRequest] = useState<SupportRequest | null>(
    null
  );

  const createSupportRequest = async () => {
    try {
      setIsLoading(true);

      // Generate a unique room ID
      const roomId = Math.random().toString(36).substring(7);

      // Create a support request
      const response = await fetch("/api/video/create-support-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create support request");
      }

      const request = await response.json();
      setActiveRequest(request);
      toast.success("Support request created. Waiting for admin to join...");
    } catch (error) {
      console.error("Error creating support request:", error);
      toast.error("Failed to start video support call. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container max-w-4xl mx-auto p-4 py-8">
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Customer Support</h1>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Setting up your support call...</span>
            </div>
          ) : activeRequest ? (
            <VideoCall roomId={activeRequest.roomId} />
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Start a video call with our support team for immediate
                assistance.
              </p>
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={createSupportRequest}
              >
                <Video className="h-5 w-5" />
                Start Video Support Call
              </Button>
            </div>
          )}
        </div>
      </Card>
    </main>
  );
}
