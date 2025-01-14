import { Announcement } from "./types";

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const response = await fetch("/api/announcements");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return [];
  }
}

export async function saveAnnouncement(
  announcement: Omit<Announcement, "id" | "date">
): Promise<Announcement | null> {
  try {
    const response = await fetch("/api/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(announcement),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error saving announcement:", error);
    return null;
  }
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/announcements?id=${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return false;
  }
}
