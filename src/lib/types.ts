export interface LatLng {
  lat: number;
  lng: number;
}

export const VEHICLE_TYPES = ["hatchback", "sedan", "suv", "tempo", "luxury"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export interface Driver {
  id: string;
  phone: string;
  name: string;
  licenceNo: string | null;
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  makeModel: string;
  colour: string | null;
  plate: string;
  year: number | null;
  seats: number;
  ac: boolean;
  city: string;
  ratePerKm: number;
  baseFare: number;
  rcNo: string | null;
  photoUrl: string | null;
  status: "pending" | "approved" | "rejected";
  rejectReason: string | null;
  available: boolean;
}

export type BookingStatus = "requested" | "accepted" | "declined" | "cancelled" | "arrived" | "started" | "completed" | "expired";

export interface Booking {
  id: string;
  userName: string | null;
  /** only present once the booking is accepted */
  userPhone: string | null;
  pickupText: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropText: string;
  dropLat: number | null;
  dropLng: number | null;
  pickupAt: string;
  passengers: number;
  distanceKm: number | null;
  fare: number;
  note: string | null;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  /** when an unanswered request lapses */
  expiresAt: string;
  acceptedAt: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  rating: number | null;
  review: string | null;
}

export interface DriverStats {
  avgRating: number | null;
  ratingCount: number;
  completedTrips: number;
}

export interface Alert {
  id: string;
  bookingId: string | null;
  kind: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export type DriverAction = "accept" | "decline" | "arrived" | "start" | "complete" | "cancel";

export interface VehicleForm {
  type: VehicleType;
  makeModel: string;
  colour: string;
  plate: string;
  year: string;
  seats: string;
  ac: boolean;
  city: string;
  ratePerKm: string;
  baseFare: string;
  rcNo: string;
  licenceNo: string;
  photoUrl: string | null;
}
