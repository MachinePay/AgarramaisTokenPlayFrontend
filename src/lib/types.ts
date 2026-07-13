export type UserNavbarSummary = {
  name: string;
  creditBalance: number;
  currentLevelName: string | null;
  nextLevelName: string | null;
  progressPercentage: number;
};

export type Store = {
  id: string;
  name: string;
  location: string;
  status: "ACTIVE" | "INACTIVE";
};

export type MachineStatus = "AVAILABLE" | "BUSY" | "MAINTENANCE";

export type Machine = {
  id: string;
  name: string;
  imageUrl: string | null;
  status: MachineStatus;
  costPerGame: number;
};

export type PlayMachineResult = {
  gameplayLogId: string;
  creditsDebited: number;
  pulsesSent: number;
  remainingBalance: number;
  pulseStatus: string;
};

export type CreditPackage = {
  id: string;
  name: string;
  amountBrl: string;
  baseCredits: number;
  bonusCredits: number;
  isPopular: boolean;
  active: boolean;
};

export type AuthResponse = {
  token: string;
  user: { id: string; name: string; email: string };
};

export type Transaction = {
  id: string;
  status: "PENDING" | "APPROVED" | "FAILED";
  amountBrl: string;
  creditsAwarded: number;
  checkoutUrl: string | null;
};
