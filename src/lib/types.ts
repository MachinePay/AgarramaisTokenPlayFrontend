export type UserNavbarSummary = {
  name: string;
  creditBalance: number;
  pointsBalance: number;
  currentLevelName: string | null;
  nextLevelName: string | null;
  progressPercentage: number;
};

export type Store = {
  id: string;
  name: string;
  location: string;
  status: "ACTIVE" | "INACTIVE";
  isFavorite?: boolean;
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
  pointsAwarded: number;
  isPopular: boolean;
  showOnHome: boolean;
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
  pointsAwarded: number;
  checkoutUrl: string | null;
  pixQrCode?: string;
  pixQrCodeBase64?: string;
};

export type AdminTransaction = Transaction & {
  createdAt: string;
  mpPreferenceId: string | null;
  mpPaymentId: string | null;
  user: { id: string; name: string; email: string };
  package: { id: string; name: string } | null;
};

export type AdminReportRankingItem = {
  id: string;
  name: string;
  subtitle?: string;
  purchases?: number;
  amountBrl?: number;
  credits?: number;
  games?: number;
};

export type AdminOperationsReport = {
  period: {
    dateFrom: string;
    dateTo: string;
  };
  summary: {
    revenueBrl: number;
    approvedPurchases: number;
    pendingPurchases: number;
    failedPurchases: number;
    creditsSold: number;
    totalGames: number;
    failedGames: number;
    creditsUsed: number;
    activeBuyers: number;
    activePlayers: number;
    averageTicketBrl: number;
    averageCreditsPerGame: number;
  };
  rankings: {
    packages: AdminReportRankingItem[];
    buyers: AdminReportRankingItem[];
    players: AdminReportRankingItem[];
    stores: AdminReportRankingItem[];
    machines: AdminReportRankingItem[];
  };
  series: {
    daily: Array<{
      date: string;
      revenueBrl: number;
      purchases: number;
      creditsSold: number;
      games: number;
      creditsUsed: number;
    }>;
  };
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string | null;
  status: "ACTIVE" | "BLOCKED";
  role: "CUSTOMER" | "ADMIN";
  creditBalance: number;
  totalCreditsPurchased: number;
  pointsBalance: number;
  createdAt: string;
  protected?: boolean;
};

export type LoyaltyLevel = {
  id: string;
  levelName: string;
  requiredCredits: number;
  bonusCreditsReward: number;
  pointsAwarded: number;
  status: "ACTIVE" | "DRAFT";
};

export type AdminMachine = Machine & {
  telemetryId: string;
  pulsesPerCredit: number;
  store: { id: string; name: string; location: string };
};

export type MachineContext = {
  store: Store;
  machine: Machine;
};

export type CompactPayMachine = {
  telemetryId: string;
  name: string | null;
  location: string | null;
  online: boolean;
  clienteId: number | null;
  clienteNome: string | null;
};

export type GameplayLog = {
  id: string;
  creditsDebited: number;
  pulsesSent: number;
  status: "SUCCESS" | "FAILED";
  createdAt: string;
  machine: {
    name: string;
    store: { name: string };
  };
};

export type AdminGameplayLog = {
  id: string;
  creditsDebited: number;
  pulsesSent: number;
  status: "SUCCESS" | "FAILED";
  createdAt: string;
  user: { id: string; name: string; email: string };
  machine: {
    id: string;
    name: string;
    telemetryId: string;
    store: { id: string; name: string };
  };
};

export type Campaign = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  notes: string | null;
  packageOverrides: Array<{
    id: string;
    packageId: string;
    amountBrl: string;
    baseCredits: number;
    bonusCredits: number;
    isPopular: boolean;
    active: boolean;
    package: CreditPackage;
  }>;
  machineOverrides: Array<{
    id: string;
    machineId: string;
    costPerGame: number;
    pulsesPerCredit: number;
    status: MachineStatus | null;
    machine: AdminMachine;
  }>;
};

export type AdminDashboardSummary = {
  totalUsers: number;
  totalRevenueBrl: string;
  approvedTransactions: number;
  pendingTransactions: number;
  totalGameplay: number;
  successfulGameplay: number;
  activeStores: number;
  activeMachines: number;
  unavailableMachines: number;
  averageTicketBrl: string;
};

export type AdminSettings = {
  tokenBundleAmountBrl: string;
  tokenBundleCredits: number;
  tokenValueBrl: string;
  pointsPerCredit: number;
};

export type LoyaltyDistribution = {
  totalUsers: number;
  distribution: Array<{
    levelName: string;
    userCount: number;
    percentage: number;
  }>;
};
