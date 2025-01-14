"use client";

import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function VideoCallButton() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);

      if (isAuthenticated) {
        // Admin goes to admin support dashboard
        router.push("/admin/support");
      } else {
        // User goes to support page
        router.push("/support");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="default"
      size="default"
      className="gap-2"
      onClick={handleClick}
      disabled={isLoading}
    >
      <Video className="h-5 w-5" />
      {isLoading
        ? "Loading..."
        : isAuthenticated
        ? "View Support Requests"
        : "Get Video Support"}
    </Button>
  );
}
