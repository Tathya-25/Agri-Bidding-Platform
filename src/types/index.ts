export type Role = 'Customer' | 'Bidder';

export interface UserProfile {
  uid: string;
  email: string;
  role: Role;
  createdAt: number;
}

export type WorkOrderStatus = 'open' | 'assigned' | 'completed' | 'cancelled';
export type CropStage = 'Pre-planting' | 'Vegetative' | 'Flowering' | 'Harvesting';

export interface WorkOrder {
  id: string;
  customerId: string;
  location: string;
  area: number; // in Acres/Hectares
  cropType: string;
  stage: CropStage;
  status: WorkOrderStatus;
  createdAt: number;
  assignedBidId?: string; // If a bid is accepted
}

export type BidStatus = 'pending' | 'accepted' | 'rejected';

export interface Bid {
  id: string;
  workOrderId: string;
  bidderId: string;
  amount: number; // in ₹
  status: BidStatus;
  createdAt: number;
}
