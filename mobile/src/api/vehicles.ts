import { apiClient } from "./client";
import type { DrivingSession, Vehicle, VehicleCommand, VehicleData } from "@/types/vehicle";

export async function listVehicles(): Promise<Vehicle[]> {
  const { data } = await apiClient.get<Vehicle[]>("/vehicles");
  return data;
}

export async function getVehicleData(vehicleId: string): Promise<VehicleData> {
  const { data } = await apiClient.get<VehicleData>(`/vehicles/${vehicleId}/data`);
  return data;
}

export async function sendVehicleCommand(
  vehicleId: string,
  command: VehicleCommand
): Promise<void> {
  await apiClient.post(`/vehicles/${vehicleId}/command`, { command });
}

export async function setChargeLimit(vehicleId: string, percent: number): Promise<void> {
  await apiClient.post(`/vehicles/${vehicleId}/charge-limit`, { percent });
}

export async function getDrivingSessions(
  vehicleId: string,
  fromISO: string,
  toISO: string
): Promise<DrivingSession[]> {
  const { data } = await apiClient.get<DrivingSession[]>(
    `/vehicles/${vehicleId}/driving-sessions`,
    { params: { from: fromISO, to: toISO } }
  );
  return data;
}
