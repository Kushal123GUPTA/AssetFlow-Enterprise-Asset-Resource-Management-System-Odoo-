export type BookableResource = {
  id: string;
  name: string;
  assetTag: string;
  location: string | null;
  condition: string | null;
  status: string;
  categoryName: string | null;
  photoUrl: string | null;
};

export type MyBooking = {
  id: string;
  assetId: string;
  startTime: string;
  endTime: string;
  status: string;
  cancelledReason: string | null;
  createdAt: string;
  assetName: string;
  assetTag: string;
  location: string | null;
};

export type BookingSlot = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  bookedByEmployeeId: string;
};
