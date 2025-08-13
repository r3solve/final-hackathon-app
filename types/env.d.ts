/// <reference types="nativewind/types" />

declare module "*.png" {
  const value: any;
  export = value;
}

// PIN Authentication Types
export interface PINData {
  pin: string;
  createdAt: Date;
  lastUsed: Date;
  isSet: boolean;
}

export interface PINVerificationResult {
  success: boolean;
  error?: string;
}

export interface PINCreationResult {
  success: boolean;
  error?: string;
}

// Profile Types
export interface Profile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  walletBalance: number;
  isVerified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Group Payment Types
export interface GroupMember {
  id: string;
  name: string;
  phoneNumber: string;
  amount: number;
}

export interface PaymentGroup {
  id: string;
  name: string;
  description: string;
  members: GroupMember[];
  totalAmount: number;
  createdAt: Date;
  createdBy: string;
}