"use client";

import { useState } from "react";
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
import { LocationInfo } from "@/lib/types";
import { saveLocation } from "@/lib/locations-store";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface LocationFormProps {
  initialData?: LocationInfo;
}

export default function LocationForm({ initialData }: LocationFormProps) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Partial<LocationInfo>>(
    initialData || {
      type: "RAILWAY_STATION",
      name: "",
      address: "",
      operatingHours: "",
      contactNumbers: [""],
      description: "",
      services: [
        {
          name: "",
          description: "",
          requirements: [""],
          estimatedTime: "",
          cost: "",
        },
      ],
      facilities: [""],
      importantNotes: "",
    }
  );

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      const requiredFields = [
        "name",
        "type",
        "address",
        "operatingHours",
        "description",
        "importantNotes",
      ];

      const missingFields = requiredFields.filter((field) => !location[field]);
      if (missingFields.length > 0) {
        toast.error(`Missing required fields: ${missingFields.join(", ")}`);
        return;
      }

      // Validate contact numbers
      if (!location.contactNumbers?.length || !location.contactNumbers[0]) {
        toast.error("At least one contact number is required");
        return;
      }

      // Validate services
      if (!location.services?.length) {
        toast.error("At least one service is required");
        return;
      }

      for (const service of location.services) {
        if (
          !service.name ||
          !service.description ||
          !service.estimatedTime ||
          !service.cost
        ) {
          toast.error("All service fields are required");
          return;
        }
        if (!service.requirements?.length || !service.requirements[0]) {
          toast.error("Each service must have at least one requirement");
          return;
        }
      }

      // Validate facilities
      if (!location.facilities?.length || !location.facilities[0]) {
        toast.error("At least one facility is required");
        return;
      }

      console.log("Saving location:", location);
      const savedLocation = await saveLocation(location as LocationInfo);
      console.log("Location saved:", savedLocation);

      toast.success(
        initialData
          ? "Location updated successfully"
          : "Location created successfully"
      );
      router.push("/admin/locations");
    } catch (error) {
      console.error("Error saving location:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to save location");
      }
    } finally {
      setLoading(false);
    }
  };

  const addContactNumber = () => {
    setLocation((prev) => ({
      ...prev,
      contactNumbers: [...(prev.contactNumbers || []), ""],
    }));
  };

  const removeContactNumber = (index: number) => {
    setLocation((prev) => ({
      ...prev,
      contactNumbers: prev.contactNumbers?.filter((_, i) => i !== index),
    }));
  };

  const updateContactNumber = (index: number, value: string) => {
    setLocation((prev) => ({
      ...prev,
      contactNumbers: prev.contactNumbers?.map((num, i) =>
        i === index ? value : num
      ),
    }));
  };

  const addService = () => {
    setLocation((prev) => ({
      ...prev,
      services: [
        ...(prev.services || []),
        {
          name: "",
          description: "",
          requirements: [""],
          estimatedTime: "",
          cost: "",
        },
      ],
    }));
  };

  const removeService = (index: number) => {
    setLocation((prev) => ({
      ...prev,
      services: prev.services?.filter((_, i) => i !== index),
    }));
  };

  const updateService = (
    index: number,
    field: keyof LocationInfo["services"][0],
    value: string
  ) => {
    setLocation((prev) => ({
      ...prev,
      services: prev.services?.map((service, i) =>
        i === index ? { ...service, [field]: value } : service
      ),
    }));
  };

  const addServiceRequirement = (serviceIndex: number) => {
    setLocation((prev) => ({
      ...prev,
      services: prev.services?.map((service, i) =>
        i === serviceIndex
          ? {
              ...service,
              requirements: [...(service.requirements || []), ""],
            }
          : service
      ),
    }));
  };

  const removeServiceRequirement = (
    serviceIndex: number,
    requirementIndex: number
  ) => {
    setLocation((prev) => ({
      ...prev,
      services: prev.services?.map((service, i) =>
        i === serviceIndex
          ? {
              ...service,
              requirements: service.requirements?.filter(
                (_, j) => j !== requirementIndex
              ),
            }
          : service
      ),
    }));
  };

  const updateServiceRequirement = (
    serviceIndex: number,
    requirementIndex: number,
    value: string
  ) => {
    setLocation((prev) => ({
      ...prev,
      services: prev.services?.map((service, i) =>
        i === serviceIndex
          ? {
              ...service,
              requirements: service.requirements?.map((req, j) =>
                j === requirementIndex ? value : req
              ),
            }
          : service
      ),
    }));
  };

  const addFacility = () => {
    setLocation((prev) => ({
      ...prev,
      facilities: [...(prev.facilities || []), ""],
    }));
  };

  const removeFacility = (index: number) => {
    setLocation((prev) => ({
      ...prev,
      facilities: prev.facilities?.filter((_, i) => i !== index),
    }));
  };

  const updateFacility = (index: number, value: string) => {
    setLocation((prev) => ({
      ...prev,
      facilities: prev.facilities?.map((facility, i) =>
        i === index ? value : facility
      ),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Location Type
            </label>
            <Select
              value={location.type}
              onValueChange={(value) =>
                setLocation((prev) => ({ ...prev, type: value }))
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RAILWAY_STATION">Railway Station</SelectItem>
                <SelectItem value="BUS_STAND">Bus Stand</SelectItem>
                <SelectItem value="GOVERNMENT_OFFICE">
                  Government Office
                </SelectItem>
                <SelectItem value="HOSPITAL">Hospital</SelectItem>
                <SelectItem value="POLICE_STATION">Police Station</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Location Name
            </label>
            <Input
              value={location.name}
              onChange={(e) =>
                setLocation((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter location name"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Address</label>
            <Textarea
              value={location.address}
              onChange={(e) =>
                setLocation((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="Enter full address"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Operating Hours
            </label>
            <Input
              value={location.operatingHours}
              onChange={(e) =>
                setLocation((prev) => ({
                  ...prev,
                  operatingHours: e.target.value,
                }))
              }
              placeholder="e.g., 9 AM - 5 PM, Monday to Friday"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Contact Numbers
            </label>
            <div className="space-y-2">
              {location.contactNumbers?.map((number, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={number}
                    onChange={(e) => updateContactNumber(index, e.target.value)}
                    placeholder="Enter contact number"
                    disabled={loading}
                  />
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeContactNumber(index)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addContactNumber}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact Number
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Description
            </label>
            <Textarea
              value={location.description}
              onChange={(e) =>
                setLocation((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter location description"
              disabled={loading}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Services</h2>
        <div className="space-y-6">
          {location.services?.map((service, serviceIndex) => (
            <div key={serviceIndex} className="space-y-4 pb-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium">
                  Service {serviceIndex + 1}
                </h3>
                {serviceIndex > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeService(serviceIndex)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Service Name
                </label>
                <Input
                  value={service.name}
                  onChange={(e) =>
                    updateService(serviceIndex, "name", e.target.value)
                  }
                  placeholder="Enter service name"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Description
                </label>
                <Textarea
                  value={service.description}
                  onChange={(e) =>
                    updateService(serviceIndex, "description", e.target.value)
                  }
                  placeholder="Enter service description"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Requirements
                </label>
                <div className="space-y-2">
                  {service.requirements?.map((requirement, reqIndex) => (
                    <div key={reqIndex} className="flex gap-2">
                      <Input
                        value={requirement}
                        onChange={(e) =>
                          updateServiceRequirement(
                            serviceIndex,
                            reqIndex,
                            e.target.value
                          )
                        }
                        placeholder="Enter requirement"
                        disabled={loading}
                      />
                      {reqIndex > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            removeServiceRequirement(serviceIndex, reqIndex)
                          }
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addServiceRequirement(serviceIndex)}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Requirement
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Estimated Time
                </label>
                <Input
                  value={service.estimatedTime}
                  onChange={(e) =>
                    updateService(serviceIndex, "estimatedTime", e.target.value)
                  }
                  placeholder="e.g., 30 minutes"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Cost</label>
                <Input
                  value={service.cost}
                  onChange={(e) =>
                    updateService(serviceIndex, "cost", e.target.value)
                  }
                  placeholder="e.g., ₹100"
                  disabled={loading}
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addService}
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Facilities</h2>
        <div className="space-y-2">
          {location.facilities?.map((facility, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={facility}
                onChange={(e) => updateFacility(index, e.target.value)}
                placeholder="Enter facility"
                disabled={loading}
              />
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFacility(index)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addFacility}
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Facility
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div>
          <label className="text-sm font-medium mb-1 block">
            Important Notes
          </label>
          <Textarea
            value={location.importantNotes}
            onChange={(e) =>
              setLocation((prev) => ({
                ...prev,
                importantNotes: e.target.value,
              }))
            }
            placeholder="Enter any important notes or instructions"
            disabled={loading}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {initialData ? "Update Location" : "Create Location"}
        </Button>
      </div>
    </form>
  );
}
