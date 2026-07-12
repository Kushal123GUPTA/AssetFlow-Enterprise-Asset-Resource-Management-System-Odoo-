export type MyMaintenanceRequest = {
  id: string;
  assetId: string;
  issueTitle: string | null;
  issueDescription: string;
  priority: string;
  photoUrl: string | null;
  status: string;
  rejectionReason: string | null;
  technicianName: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  approvedAt: string | null;
  resolvedAt: string | null;
  assetName: string;
  assetTag: string;
};
