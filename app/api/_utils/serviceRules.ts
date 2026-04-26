import Vehicle from "@/models/vehicleModel";

export function normalizePlate(numberPlate: string) {
  return numberPlate.trim().toUpperCase();
}

export function monthsRemaining(expiryDate: Date) {
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 30);
}

export function daysRemaining(expiryDate: Date) {
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

export function isRenewalWindowValid(expiryDate: Date) {
  const daysLeft = daysRemaining(expiryDate);
  return daysLeft >= 0 && daysLeft < 90;
}

export function computeRenewedExpiry(currentExpiry: Date) {
  const now = new Date();
  const base = currentExpiry > now ? new Date(currentExpiry) : now;
  const renewed = new Date(base);
  renewed.setFullYear(renewed.getFullYear() + 1);
  return renewed;
}

export async function getNextRequestNumber(model: any) {
  const maxDoc = await model.findOne().sort({ request_number: -1 }).lean();
  return maxDoc?.request_number ? maxDoc.request_number + 1 : 1;
}

export async function findOwnedVehicleByPlate(userId: string, numberPlate: string) {
  return Vehicle.findOne({ userId, number_plate: normalizePlate(numberPlate) });
}
