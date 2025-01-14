import { LocationInfo } from "./types";

export async function getLocations(): Promise<LocationInfo[]> {
  try {
    const response = await fetch("/api/locations");
    if (!response.ok) {
      throw new Error("Failed to fetch locations");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
}

export async function saveLocation(location: LocationInfo) {
  try {
    const method = location.id ? "PUT" : "POST";
    const url = location.id
      ? `/api/locations/${location.id}`
      : "/api/locations";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(location),
    });

    if (!response.ok) {
      throw new Error("Failed to save location");
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving location:", error);
    throw error;
  }
}

export async function deleteLocation(id: string) {
  try {
    const response = await fetch(`/api/locations/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete location");
    }
  } catch (error) {
    console.error("Error deleting location:", error);
    throw error;
  }
}

export async function getLocationById(
  id: string
): Promise<LocationInfo | null> {
  try {
    const response = await fetch(`/api/locations/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch location");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching location:", error);
    return null;
  }
}

export function generateLocationContext(locations: LocationInfo[]): string {
  return locations
    .map(
      (location) => `
Location: ${location.name} (${location.type})
Address: ${location.address}
Operating Hours: ${location.operatingHours}
Contact: ${location.contactNumbers.join(", ")}
Description: ${location.description}

Services:
${location.services
  .map(
    (service) => `- ${service.name}:
  * Description: ${service.description}
  * Requirements: ${service.requirements.join(", ")}
  * Estimated Time: ${service.estimatedTime}
  * Cost: ${service.cost}
`
  )
  .join("\n")}

Facilities: ${location.facilities.join(", ")}

Important Notes: ${location.importantNotes}
---
`
    )
    .join("\n");
}
