export type LocationType =
  | "RAILWAY_STATION"
  | "BUS_STAND"
  | "GOVERNMENT_OFFICE"
  | "BANK"
  | "POST_OFFICE"
  | "HOSPITAL";

export interface LocationInfo {
  id: string;
  type: LocationType;
  name: string;
  address: string;
  operatingHours: string;
  contactNumbers: string[];
  description: string;
  services: Service[];
  facilities: string[];
  importantNotes: string;
}

export interface Service {
  name: string;
  description: string;
  requirements: string[];
  estimatedTime: string;
  cost: string;
}

// For form handling
export interface LocationFormData
  extends Omit<LocationInfo, "id" | "services"> {
  services: Array<{
    name: string;
    description: string;
    requirements: string;
    estimatedTime: string;
    cost: string;
  }>;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: "low" | "medium" | "high";
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  priority: "low" | "medium" | "high";
}
