export enum RoomType {
  STANDARD = "ESTANDAR KING SIZE",
  DOUBLE = "DOBLE QUEEN SIZE",
  SUITE = "SUITE DE LUJO"
}

// Pricing configurations for specific months
const PRICES_JANUARY = {
  [RoomType.STANDARD]: 1250.00,
  [RoomType.DOUBLE]: 1450.00,
  [RoomType.SUITE]: 1650.00
};

const PRICES_FEBRUARY = {
  [RoomType.STANDARD]: 1136.00,
  [RoomType.DOUBLE]: 1318.00,
  [RoomType.SUITE]: 1497.00
};

// Helper function to get price based on Room Type and Date (Month)
export const getRoomPrice = (roomType: RoomType, dateStr?: string): number => {
  // Default to January prices if no date provided or for any month other than February
  // (Assuming January is the standard/current context unless February is selected)
  if (!dateStr) return PRICES_JANUARY[roomType];

  const [y, m, d] = dateStr.split('-');
  const monthIndex = parseInt(m, 10); // 1 = Jan, 2 = Feb

  if (monthIndex === 2) {
    return PRICES_FEBRUARY[roomType];
  }

  // Default to January prices
  return PRICES_JANUARY[roomType];
};

export interface BookingData {
  firstName: string;
  lastName: string;
  reservationDate: string; // YYYY-MM-DD
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  roomType: RoomType;
}

export interface BookingSummary {
  folio: string;
  nights: number;
  pricePerNight: number;
  totalCost: number;
}

// Fixed Base64 Logo (Blue Shield Icon placeholder to prevent corrupted data error)
export const HOTEL_LOGO = "data:image/png;base64,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";