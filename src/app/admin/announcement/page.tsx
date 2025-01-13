"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Announcement } from "@/lib/types";
import {
  getAnnouncements,
  saveAnnouncement,
  deleteAnnouncement,
} from "@/lib/announcements-store";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<Announcement["priority"]>("low");
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const loadAnnouncements = async () => {
    try {
      const allAnnouncements = await getAnnouncements();
      console.log("Admin: Current announcements:", allAnnouncements);

      // Sort by date (newest first) and priority (high to low)
      const sorted = allAnnouncements.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff =
          priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      console.log("Admin: Sorted announcements:", sorted);
      setAnnouncements(sorted);
    } catch (error) {
      console.error("Error loading announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      console.log("Admin: Not authenticated, redirecting");
      router.push("/admin");
      return;
    }
    console.log("Admin: Loading initial announcements");
    loadAnnouncements();
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setSubmitting(true);
    try {
      console.log("Admin: Saving new announcement", {
        title,
        content,
        priority,
      });
      await saveAnnouncement({
        title,
        content,
        priority,
      });

      // Reload the announcements to get the updated list
      await loadAnnouncements();

      // Reset form
      setTitle("");
      setContent("");
      setPriority("low");
      toast.success("Announcement created successfully");
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast.error("Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      console.log("Admin: Deleting announcement", id);
      await deleteAnnouncement(id);
      await loadAnnouncements();
      toast.success("Announcement deleted successfully");
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("Failed to delete announcement");
    }
  };

  const getPriorityIcon = (priority: Announcement["priority"]) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "low":
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <main className="container max-w-4xl mx-auto p-4 py-8">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Announcements</h1>
          <p className="text-muted-foreground">
            Create and manage announcements for users.
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement title"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Content</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Announcement content"
                required
                className="min-h-[100px]"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Priority</label>
              <Select
                value={priority}
                onValueChange={(value: Announcement["priority"]) =>
                  setPriority(value)
                }
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Announcement
            </Button>
          </form>
        </Card>

        {loading ? (
          <Card className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading announcements...</span>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {announcements.map((announcement) => (
              <Card
                key={announcement.id}
                className={cn("p-6", {
                  "border-destructive": announcement.priority === "high",
                  "border-yellow-500": announcement.priority === "medium",
                  "border-blue-500": announcement.priority === "low",
                })}
              >
                <div className="flex items-start gap-4">
                  {getPriorityIcon(announcement.priority)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-semibold">
                        {announcement.title}
                      </h2>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(announcement.date)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(announcement.id)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-2 whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <span>Priority: {announcement.priority}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
