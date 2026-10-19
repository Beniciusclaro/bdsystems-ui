import type { SupplierResponse } from './types/supplier';

export function getSupplierDisplayName(supplier: SupplierResponse): string {
  return supplier.tradeName || supplier.legalName;
}

export function formatAddress(supplier: SupplierResponse): string {
  const { street, city, state, zipCode } = supplier.address;
  return `${street}, ${city} — ${state}, ${zipCode}`;
}
