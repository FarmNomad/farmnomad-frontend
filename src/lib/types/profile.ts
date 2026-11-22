import type { Role } from "./api";

/** Role profiles: the details a farmer, driver or kitchen adds after their first login. */

export type FarmType = "ARABLE" | "LIVESTOCK" | "DAIRY" | "HORTICULTURE" | "MIXED" | "ORCHARD" | "POULTRY" | "OTHER";
export type Certification = "ORGANIC_SOIL_ASSOCIATION" | "ORGANIC_OTHER" | "RED_TRACTOR" | "LEAF_MARQUE" | "RSPCA_ASSURED" | "PASTURE_FOR_LIFE";
export type VehicleType = "CAR" | "VAN_SMALL" | "VAN_LARGE" | "REFRIGERATED_VAN" | "PICKUP" | "BICYCLE" | "MOTORCYCLE";

export interface Farm {
  id: number;
  name: string;
  description?: string;
  address: string;
  city?: string;
  postcode: string;
  county?: string;
  lat?: number;
  lng?: number;
  farmType?: FarmType;
  sizeAcres?: number;
  establishedYear?: number;
  certifications: Certification[];
}

export interface DriverProfile {
  id: number;
  vehicleType: VehicleType;
  vehicleRegistration: string;
  vehicleMake?: string;
  vehicleModel?: string;
  capacityKg?: number;
  refrigerated: boolean;
  maxRadiusKm?: number;
  licenceNumber?: string;
  hasHireRewardInsurance: boolean;
  insuranceExpiry?: string;
}

export interface Kitchen {
  id: number;
  name: string;
  description?: string;
  address: string;
  city?: string;
  postcode: string;
  lat?: number;
  lng?: number;
  cuisines: string[];
  hygieneRating?: number;
  fsaRegistered: boolean;
  localAuthority?: string;
}

/** GET /profile/me */
export interface ProfileStatus {
  role: Role;
  profileComplete: boolean;
  missingFields: string[];
  profile: Farm | DriverProfile | Kitchen | null;
}

/** The roles that have a profile step. Customers, food groups and admins skip it. */
export type ProfileRole = "FARMER" | "DRIVER" | "KITCHEN";
export const hasProfileStep = (role?: Role | null): role is ProfileRole => role === "FARMER" || role === "DRIVER" || role === "KITCHEN";

/** Where each role edits its details later, and what to call them. */
export const PROFILE_META: Record<ProfileRole, { href: string; noun: string; heading: string; cta: string; why: string }> = {
  FARMER: {
    href: "/profile/farm",
    noun: "farm details",
    heading: "Tell us about your farm",
    cta: "Add farm details",
    why: "before you can list produce. Buyers and drivers use them to find you.",
  },
  DRIVER: {
    href: "/profile/vehicle",
    noun: "vehicle details",
    heading: "Tell us about your vehicle",
    cta: "Add vehicle details",
    why: "before you can accept jobs. Farms need to know what is collecting from them.",
  },
  KITCHEN: {
    href: "/profile/kitchen",
    noun: "kitchen details",
    heading: "Tell us about your kitchen",
    cta: "Add kitchen details",
    why: "before you can list meals. Diners see them on every meal.",
  },
};

/** `missingFields` arrives as API field names. These are the words to show instead. */
const FIELD_LABELS: Record<ProfileRole, Record<string, string>> = {
  FARMER: { name: "farm name", address: "farm address", postcode: "postcode" },
  DRIVER: { vehicleType: "vehicle type", vehicleRegistration: "vehicle registration", hasHireRewardInsurance: "insurance confirmation" },
  KITCHEN: { name: "kitchen name", address: "address", postcode: "postcode", fsaRegistered: "food business registration" },
};

/** "farm name, farm address and postcode" from ["name", "address", "postcode"]. */
export function missingFieldsText(role: ProfileRole, fields: string[]): string {
  const words = fields.map((f) => FIELD_LABELS[role][f] ?? f.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase());
  if (words.length <= 1) return words[0] ?? "";
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

export const FARM_TYPES: [FarmType, string][] = [
  ["ARABLE", "Arable"],
  ["LIVESTOCK", "Livestock"],
  ["DAIRY", "Dairy"],
  ["HORTICULTURE", "Horticulture"],
  ["MIXED", "Mixed"],
  ["ORCHARD", "Orchard"],
  ["POULTRY", "Poultry"],
  ["OTHER", "Other"],
];

// The real UK scheme names: a farmer looks for "Red Tractor", not "certified".
export const CERTIFICATIONS: [Certification, string][] = [
  ["ORGANIC_SOIL_ASSOCIATION", "Soil Association Organic"],
  ["ORGANIC_OTHER", "Other Organic"],
  ["RED_TRACTOR", "Red Tractor"],
  ["LEAF_MARQUE", "LEAF Marque"],
  ["RSPCA_ASSURED", "RSPCA Assured"],
  ["PASTURE_FOR_LIFE", "Pasture for Life"],
];

export const VEHICLE_TYPES: [VehicleType, string][] = [
  ["CAR", "Car"],
  ["VAN_SMALL", "Small van"],
  ["VAN_LARGE", "Large van"],
  ["REFRIGERATED_VAN", "Refrigerated van"],
  ["PICKUP", "Pickup"],
  ["BICYCLE", "Bicycle"],
  ["MOTORCYCLE", "Motorcycle"],
];

export const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
