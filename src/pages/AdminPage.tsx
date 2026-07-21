import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { apiRequest, ApiError } from "@/lib/api";
import type {
  AdminDashboardSummary,
  AdminGameplayLog,
  AdminMachine,
  AdminOperationsReport,
  AdminReportRankingItem,
  AdminSettings,
  AdminTransaction,
  AdminUser,
  Campaign,
  CreditPackage,
  AdminProductOrder,
  AdminPrivacyRequest,
  LoyaltyDistribution,
  LoyaltyLevel,
  Product,
  Store,
} from "@/lib/types";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminTag } from "@/components/admin/AdminTag";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminFormSection } from "@/components/admin/AdminFormSection";

type AdminTab =
  | "summary"
  | "users"
  | "transactions"
  | "gameplay"
  | "campaigns"
  | "packages"
  | "levels"
  | "stores"
  | "machines"
  | "products"
  | "orders"
  | "finance"
  | "privacy"
  | "reports";

type PackageForm = {
  name: string;
  amountBrl: string;
  baseCredits: string;
  bonusCredits: string;
  pointsAwarded: string;
  isPopular: boolean;
  showOnHome: boolean;
};

type UserForm = {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  password: string;
  role: "CUSTOMER" | "ADMIN";
  status: "ACTIVE" | "BLOCKED";
};

type LevelForm = {
  levelName: string;
  requiredCredits: string;
  bonusCreditsReward: string;
  pointsAwarded: string;
  status: "ACTIVE" | "DRAFT";
};

type ProductForm = {
  name: string;
  description: string;
  imageUrl: string;
  priceCredits: string;
  pricePoints: string;
  priceBrl: string;
  cardPriceBrl: string;
};

type StoreForm = {
  name: string;
  location: string;
};

type MachineForm = {
  storeId: string;
  name: string;
  imageUrl: string;
  telemetryId: string;
  costPerGame: string;
  pulsesPerCredit: string;
};

type CampaignForm = {
  name: string;
  startsAt: string;
  endsAt: string;
  notes: string;
  packageId: string;
  packageAmountBrl: string;
  packageBaseCredits: string;
  packageBonusCredits: string;
  machineId: string;
  machineCostPerGame: string;
  machinePulsesPerCredit: string;
};

const inputClass =
  "rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-black outline-none transition-colors focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20";

const filterInputClass =
  "h-11 rounded-xl border border-amber-100 bg-white px-3 text-sm font-medium text-brand-black outline-none shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20";

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 2) return "***";
  return `***.***.***-${digits.slice(-2)}`;
}

function maskPhone(value: string | null): string {
  if (!value) return "Nao informado";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `(**) *****-${digits.slice(-4)}`;
}

const privacyRequestTypeLabel: Record<AdminPrivacyRequest["type"], string> = {
  ACCESS: "Acesso aos dados",
  CORRECTION: "Correcao",
  DELETION: "Exclusao/anonimizacao",
  CONSENT_REVOCATION: "Revogacao",
  OTHER: "Outro",
};

const privacyRequestStatusLabel: Record<AdminPrivacyRequest["status"], string> = {
  OPEN: "Aberto",
  IN_REVIEW: "Em analise",
  COMPLETED: "Concluido",
  REJECTED: "Recusado",
};

type FilterableTab = Exclude<AdminTab, "summary" | "finance" | "reports">;

type AdminFilter = {
  search: string;
  status: string;
  dateFrom?: string;
  dateTo?: string;
};

type AdminFilters = Record<FilterableTab, AdminFilter>;

function getTodayInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const todayInputValue = getTodayInputValue();

function getDaysAgoInputValue(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const defaultFilters: AdminFilters = {
  users: { search: "", status: "ALL" },
  transactions: { search: "", status: "ALL", dateFrom: todayInputValue, dateTo: todayInputValue },
  gameplay: { search: "", status: "ALL" },
  campaigns: { search: "", status: "ALL" },
  packages: { search: "", status: "ALL" },
  levels: { search: "", status: "ALL" },
  stores: { search: "", status: "ALL" },
  machines: { search: "", status: "ALL" },
  products: { search: "", status: "ALL" },
  orders: { search: "", status: "ALL", dateFrom: getDaysAgoInputValue(6), dateTo: todayInputValue },
  privacy: { search: "", status: "ALL" },
};

const tabs: Array<{ id: AdminTab; label: string; icon: string }> = [
  { id: "summary", label: "Resumo", icon: "📊" },
  { id: "users", label: "Usuarios", icon: "👥" },
  { id: "transactions", label: "Transacoes", icon: "💳" },
  { id: "gameplay", label: "Jogadas", icon: "🕹️" },
  { id: "campaigns", label: "Campanhas", icon: "🎯" },
  { id: "packages", label: "Pacotes", icon: "🎁" },
  { id: "levels", label: "Niveis", icon: "🏆" },
  { id: "stores", label: "Lojas", icon: "🏬" },
  { id: "machines", label: "Maquinas", icon: "🧸" },
  { id: "products", label: "Produtos", icon: "🛍️" },
  { id: "orders", label: "Entregas", icon: "📮" },
  { id: "finance", label: "Financeiro", icon: "🏦" },
  { id: "privacy", label: "LGPD", icon: "LG" },
  { id: "reports", label: "Relatorios", icon: "📈" },
];

function toNumber(value: string): number {
  return Number(value.replace(",", "."));
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchesSearch(search: string, fields: Array<string | number | null | undefined>): boolean {
  const query = normalizeSearch(search.trim());
  if (!query) {
    return true;
  }

  return fields.some((field) => normalizeSearch(String(field ?? "")).includes(query));
}

function campaignMoment(campaign: Campaign): "UPCOMING" | "RUNNING" | "EXPIRED" {
  const now = Date.now();
  const startsAt = new Date(campaign.startsAt).getTime();
  const endsAt = new Date(campaign.endsAt).getTime();

  if (startsAt > now) {
    return "UPCOMING";
  }
  if (endsAt < now) {
    return "EXPIRED";
  }
  return "RUNNING";
}

async function loadAdminSettingsWithFallback(): Promise<AdminSettings> {
  try {
    return await apiRequest<AdminSettings>("/admin/settings");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return {
        tokenBundleAmountBrl: "1.00",
        tokenBundleCredits: 1,
        tokenValueBrl: "1.00",
        pointsPerCredit: 0,
        paymentProvider: "MERCADO_PAGO",
        santanderEnvironment: "SANDBOX",
        santanderBaseUrl: "https://trust-sandbox.api.santander.com.br",
        santanderPixBaseUrl: "https://pix.santander.com.br/api/v1/sandbox",
        santanderClientIdSet: false,
        santanderClientSecretSet: false,
        santanderCertificatePemSet: false,
        santanderPrivateKeyPemSet: false,
        santanderPfxSet: false,
        santanderPixKeySet: false,
      };
    }
    throw err;
  }
}

function AdminFilterBar({
  search,
  status,
  total,
  filtered,
  searchPlaceholder,
  statusLabel = "Status",
  statusOptions,
  dateFrom,
  dateTo,
  onSearchChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onClear,
}: {
  search: string;
  status: string;
  total: number;
  filtered: number;
  searchPlaceholder: string;
  statusLabel?: string;
  statusOptions: Array<{ value: string; label: string }>;
  dateFrom?: string;
  dateTo?: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  onClear: () => void;
}) {
  const hasDateFilters = Boolean(onDateFromChange || onDateToChange);
  const hasFilters = Boolean(search.trim()) || status !== "ALL" || Boolean(dateFrom) || Boolean(dateTo);

  return (
    <div className="rounded-2xl border border-white/80 bg-white/85 p-3 shadow-sm backdrop-blur">
      <div
        className={`grid gap-2 md:items-center ${
          hasDateFilters ? "md:grid-cols-[1fr_170px_170px_220px_auto]" : "md:grid-cols-[1fr_220px_auto]"
        }`}
      >
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
            🔎
          </span>
          <input
            className={`${filterInputClass} w-full pl-9`}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        {hasDateFilters && (
          <>
            <input
              className={`${filterInputClass} w-full`}
              aria-label="Data inicial"
              type="date"
              value={dateFrom ?? ""}
              onChange={(event) => onDateFromChange?.(event.target.value)}
            />
            <input
              className={`${filterInputClass} w-full`}
              aria-label="Data final"
              type="date"
              value={dateTo ?? ""}
              onChange={(event) => onDateToChange?.(event.target.value)}
            />
          </>
        )}
        <select
          className={`${filterInputClass} w-full`}
          aria-label={statusLabel}
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <AdminButton type="button" variant="secondary" disabled={!hasFilters} onClick={onClear} className="h-11">
          Limpar
        </AdminButton>
      </div>
      <p className="mt-2 text-xs font-semibold text-gray-500">
        Mostrando {filtered} de {total}
      </p>
    </div>
  );
}

function formatMoney(value: number): string {
  return `R$ ${value.toFixed(2)}`;
}

function formatDateLabel(value: string): string {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

function ReportRankingCard({
  title,
  items,
  metric,
  metricLabel,
  emptyMessage,
}: {
  title: string;
  items: AdminReportRankingItem[];
  metric: "amountBrl" | "credits" | "games" | "purchases";
  metricLabel: string;
  emptyMessage: string;
}) {
  const maxValue = Math.max(1, ...items.map((item) => Number(item[metric] ?? 0)));

  return (
    <AdminCard>
      <h3 className="text-base font-black text-brand-black">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm font-medium text-gray-500">{emptyMessage}</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((item, index) => {
            const value = Number(item[metric] ?? 0);
            return (
              <div key={item.id} className="grid gap-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-brand-black">
                      {index + 1}. {item.name}
                    </p>
                    {item.subtitle && <p className="truncate text-xs font-semibold text-gray-500">{item.subtitle}</p>}
                  </div>
                  <p className="shrink-0 text-sm font-black text-orange-600">
                    {metric === "amountBrl" ? formatMoney(value) : value} {metricLabel}
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-amber-50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-yellow to-orange-400"
                    style={{ width: `${Math.max(8, (value / maxValue) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminCard>
  );
}

function ReportDailyChart({ daily }: { daily: AdminOperationsReport["series"]["daily"] }) {
  const maxRevenue = Math.max(1, ...daily.map((day) => day.revenueBrl));
  const maxGames = Math.max(1, ...daily.map((day) => day.games));

  return (
    <AdminCard className="xl:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-black text-brand-black">Movimento por dia</h3>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-orange-700">
          Faturamento e jogadas
        </span>
      </div>
      {daily.length === 0 ? (
        <p className="mt-4 text-sm font-medium text-gray-500">Sem movimento no periodo.</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {daily.map((day) => (
            <div key={day.date} className="grid grid-cols-[54px_1fr] items-center gap-3">
              <p className="text-xs font-black text-gray-500">{formatDateLabel(day.date)}</p>
              <div className="grid gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-amber-50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-yellow to-orange-400"
                      style={{ width: `${Math.max(4, (day.revenueBrl / maxRevenue) * 100)}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs font-black text-brand-black">{formatMoney(day.revenueBrl)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-sky-50">
                    <div
                      className="h-full rounded-full bg-sky-400"
                      style={{ width: `${Math.max(4, (day.games / maxGames) * 100)}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs font-bold text-gray-500">{day.games} jogadas</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminCard>
  );
}

export function AdminPage({ initialTab = "summary" }: { initialTab?: AdminTab }) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loyaltyDistribution, setLoyaltyDistribution] = useState<LoyaltyDistribution | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [gameplayLogs, setGameplayLogs] = useState<AdminGameplayLog[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [levels, setLevels] = useState<LoyaltyLevel[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [machines, setMachines] = useState<AdminMachine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminProductOrder[]>([]);
  const [privacyRequests, setPrivacyRequests] = useState<AdminPrivacyRequest[]>([]);
  const [operationsReport, setOperationsReport] = useState<AdminOperationsReport | null>(null);
  const [gameplaySearched, setGameplaySearched] = useState(false);
  const [gameplayLoading, setGameplayLoading] = useState(false);
  const [gameplayStoreId, setGameplayStoreId] = useState("ALL");
  const [gameplayMachineId, setGameplayMachineId] = useState("ALL");
  const [gameplayMinCredits, setGameplayMinCredits] = useState("");
  const [gameplayMaxCredits, setGameplayMaxCredits] = useState("");
  const [gameplayLimit, setGameplayLimit] = useState("50");
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportDateFrom, setReportDateFrom] = useState(getDaysAgoInputValue(29));
  const [reportDateTo, setReportDateTo] = useState(todayInputValue);
  const [reportStoreId, setReportStoreId] = useState("ALL");
  const [reportMachineId, setReportMachineId] = useState("ALL");
  const [reportTransactionStatus, setReportTransactionStatus] = useState("ALL");
  const [reportGameplayStatus, setReportGameplayStatus] = useState("ALL");
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState("ALL");
  const [orderProductId, setOrderProductId] = useState("ALL");
  const [orderMinAmount, setOrderMinAmount] = useState("");
  const [orderMaxAmount, setOrderMaxAmount] = useState("");
  const [orderLimit, setOrderLimit] = useState("100");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminFilters>(defaultFilters);
  const [tokenBundleAmountBrl, setTokenBundleAmountBrl] = useState("1,00");
  const [tokenBundleCredits, setTokenBundleCredits] = useState("1");
  const [pointsPerCredit, setPointsPerCredit] = useState("0");
  const [paymentProvider, setPaymentProvider] = useState<AdminSettings["paymentProvider"]>("MERCADO_PAGO");
  const [santanderEnvironment, setSantanderEnvironment] = useState<AdminSettings["santanderEnvironment"]>("SANDBOX");
  const [santanderBaseUrl, setSantanderBaseUrl] = useState("https://trust-sandbox.api.santander.com.br");
  const [santanderPixBaseUrl, setSantanderPixBaseUrl] = useState("https://pix.santander.com.br/api/v1/sandbox");
  const [santanderClientId, setSantanderClientId] = useState("");
  const [santanderClientSecret, setSantanderClientSecret] = useState("");
  const [santanderCertificatePem, setSantanderCertificatePem] = useState("");
  const [santanderPrivateKeyPem, setSantanderPrivateKeyPem] = useState("");
  const [santanderPfxBase64, setSantanderPfxBase64] = useState("");
  const [santanderPfxPassphrase, setSantanderPfxPassphrase] = useState("");
  const [santanderPixKey, setSantanderPixKey] = useState("");

  const [userForm, setUserForm] = useState<UserForm>({
    name: "",
    email: "",
    cpf: "",
    phone: "",
    password: "",
    role: "CUSTOMER",
    status: "ACTIVE",
  });
  const [packageForm, setPackageForm] = useState<PackageForm>({
    name: "",
    amountBrl: "",
    baseCredits: "",
  bonusCredits: "0",
  pointsAwarded: "0",
  isPopular: false,
  showOnHome: false,
});
  const [levelForm, setLevelForm] = useState<LevelForm>({
    levelName: "",
    requiredCredits: "",
    bonusCreditsReward: "0",
    pointsAwarded: "0",
    status: "ACTIVE",
  });
  const [productForm, setProductForm] = useState<ProductForm>({
    name: "",
    description: "",
    imageUrl: "",
    priceCredits: "",
    pricePoints: "",
    priceBrl: "",
    cardPriceBrl: "",
  });
  const [storeForm, setStoreForm] = useState<StoreForm>({ name: "", location: "" });
  const [machineForm, setMachineForm] = useState<MachineForm>({
    storeId: "",
    name: "",
    imageUrl: "",
    telemetryId: "",
    costPerGame: "1",
    pulsesPerCredit: "5",
  });
  const [campaignForm, setCampaignForm] = useState<CampaignForm>({
    name: "",
    startsAt: "",
    endsAt: "",
    notes: "",
    packageId: "",
    packageAmountBrl: "",
    packageBaseCredits: "",
    packageBonusCredits: "0",
    machineId: "",
    machineCostPerGame: "",
    machinePulsesPerCredit: "",
  });

  const activeStores = useMemo(() => stores.filter((store) => store.status === "ACTIVE"), [stores]);

  const updateFilter = (tab: FilterableTab, field: keyof AdminFilter, value: string) => {
    setFilters((current) => ({
      ...current,
      [tab]: { ...current[tab], [field]: value },
    }));
  };

  const clearFilter = (tab: FilterableTab) => {
    setFilters((current) => ({ ...current, [tab]: defaultFilters[tab] }));
  };

  const readTextFile = async (file: File | undefined, onRead: (value: string) => void) => {
    if (!file) return;
    onRead(await file.text());
  };

  const readBinaryFileAsBase64 = async (file: File | undefined, onRead: (value: string) => void) => {
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    onRead(window.btoa(binary));
  };

  const filteredUsers = useMemo(() => {
    const filter = filters.users;
    return users.filter((user) => {
      const statusMatches = filter.status === "ALL" || user.status === filter.status || user.role === filter.status;
      return statusMatches && matchesSearch(filter.search, [user.name, user.email, user.cpf, user.phone, user.status, user.role]);
    });
  }, [filters.users, users]);

  const filteredTransactions = useMemo(() => {
    const filter = filters.transactions;
    return transactions.filter((transaction) => {
      const statusMatches = filter.status === "ALL" || transaction.status === filter.status;
      const createdAt = new Date(transaction.createdAt);
      const startsAt = filter.dateFrom ? new Date(`${filter.dateFrom}T00:00:00`) : null;
      const endsAt = filter.dateTo ? new Date(`${filter.dateTo}T23:59:59.999`) : null;
      const dateMatches = (!startsAt || createdAt >= startsAt) && (!endsAt || createdAt <= endsAt);
      return (
        statusMatches &&
        dateMatches &&
        matchesSearch(filter.search, [
          transaction.user.name,
          transaction.user.email,
          transaction.package?.name,
          transaction.amountBrl,
          transaction.creditsAwarded,
          transaction.mpPaymentId,
          transaction.mpPreferenceId,
        ])
      );
    });
  }, [filters.transactions, transactions]);

  const filteredGameplayLogs = useMemo(() => {
    const filter = filters.gameplay;
    return gameplayLogs.filter((log) => {
      const statusMatches = filter.status === "ALL" || log.status === filter.status;
      return (
        statusMatches &&
        matchesSearch(filter.search, [
          log.user.name,
          log.user.email,
          log.machine.name,
          log.machine.telemetryId,
          log.machine.store.name,
          log.creditsDebited,
          log.pulsesSent,
        ])
      );
    });
  }, [filters.gameplay, gameplayLogs]);

  const filteredCampaigns = useMemo(() => {
    const filter = filters.campaigns;
    return campaigns.filter((campaign) => {
      const moment = campaignMoment(campaign);
      const statusMatches =
        filter.status === "ALL" ||
        (filter.status === "ACTIVE" && campaign.active) ||
        (filter.status === "INACTIVE" && !campaign.active) ||
        filter.status === moment;
      return (
        statusMatches &&
        matchesSearch(filter.search, [
          campaign.name,
          campaign.notes,
          campaign.packageOverrides.map((override) => override.package.name).join(" "),
          campaign.machineOverrides.map((override) => override.machine.name).join(" "),
        ])
      );
    });
  }, [campaigns, filters.campaigns]);

  const filteredPackages = useMemo(() => {
    const filter = filters.packages;
    return packages.filter((creditPackage) => {
      const statusMatches =
        filter.status === "ALL" ||
        (filter.status === "ACTIVE" && creditPackage.active) ||
        (filter.status === "INACTIVE" && !creditPackage.active) ||
        (filter.status === "POPULAR" && creditPackage.isPopular);
      return (
        statusMatches &&
        matchesSearch(filter.search, [
          creditPackage.name,
          creditPackage.amountBrl,
          creditPackage.baseCredits,
          creditPackage.bonusCredits,
        ])
      );
    });
  }, [filters.packages, packages]);

  const filteredLevels = useMemo(() => {
    const filter = filters.levels;
    return levels.filter((level) => {
      const statusMatches = filter.status === "ALL" || level.status === filter.status;
      return (
        statusMatches &&
        matchesSearch(filter.search, [
          level.levelName,
          level.requiredCredits,
          level.bonusCreditsReward,
          level.status,
        ])
      );
    });
  }, [filters.levels, levels]);

  const filteredProducts = useMemo(() => {
    const filter = filters.products;
    return products.filter((product) => {
      const statusMatches =
        filter.status === "ALL" ||
        (filter.status === "ACTIVE" && product.active) ||
        (filter.status === "INACTIVE" && !product.active);
      return (
        statusMatches &&
        matchesSearch(filter.search, [
          product.name,
          product.description,
          product.priceCredits,
          product.pricePoints,
          product.priceBrl,
          product.cardPriceBrl,
        ])
      );
    });
  }, [filters.products, products]);

  const filteredOrders = useMemo(() => {
    const filter = filters.orders;
    return orders.filter((order) => {
      const statusMatches = filter.status === "ALL" || order.status === filter.status;
      return (
        statusMatches &&
        matchesSearch(filter.search, [order.productName, order.user.name, order.user.email, order.status])
      );
    });
  }, [filters.orders, orders]);

  const filteredStores = useMemo(() => {
    const filter = filters.stores;
    return stores.filter((store) => {
      const statusMatches = filter.status === "ALL" || store.status === filter.status;
      return statusMatches && matchesSearch(filter.search, [store.name, store.location, store.status]);
    });
  }, [filters.stores, stores]);

  const filteredMachines = useMemo(() => {
    const filter = filters.machines;
    return machines.filter((machine) => {
      const statusMatches = filter.status === "ALL" || machine.status === filter.status || machine.store.id === filter.status;
      return (
        statusMatches &&
        matchesSearch(filter.search, [
          machine.name,
          machine.telemetryId,
          machine.store.name,
          machine.store.location,
          machine.status,
          machine.costPerGame,
          machine.pulsesPerCredit,
        ])
      );
    });
  }, [filters.machines, machines]);

  const gameplayStoreMachines = useMemo(
    () =>
      gameplayStoreId === "ALL"
        ? machines
        : machines.filter((machine) => machine.store.id === gameplayStoreId),
    [gameplayStoreId, machines],
  );

  const reportStoreMachines = useMemo(
    () =>
      reportStoreId === "ALL"
        ? machines
        : machines.filter((machine) => machine.store.id === reportStoreId),
    [machines, reportStoreId],
  );

  const hasGameplayFilters = Boolean(
    filters.gameplay.search.trim() ||
      filters.gameplay.status !== "ALL" ||
      filters.gameplay.dateFrom ||
      filters.gameplay.dateTo ||
      gameplayStoreId !== "ALL" ||
      gameplayMachineId !== "ALL" ||
      gameplayMinCredits ||
      gameplayMaxCredits,
  );

  const loadAdminOrders = useCallback(async (overrides?: {
    filter?: AdminFilter;
    paymentMethod?: string;
    productId?: string;
    minAmount?: string;
    maxAmount?: string;
    limit?: string;
  }) => {
    setOrdersLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const filter = overrides?.filter ?? filters.orders;
      const paymentMethod = overrides?.paymentMethod ?? orderPaymentMethod;
      const productId = overrides?.productId ?? orderProductId;
      const minAmount = overrides?.minAmount ?? orderMinAmount;
      const maxAmount = overrides?.maxAmount ?? orderMaxAmount;
      const limit = overrides?.limit ?? orderLimit;
      if (filter.search.trim()) params.set("search", filter.search.trim());
      if (filter.status !== "ALL") params.set("status", filter.status);
      if (filter.dateFrom) params.set("dateFrom", filter.dateFrom);
      if (filter.dateTo) params.set("dateTo", filter.dateTo);
      if (paymentMethod !== "ALL") params.set("paymentMethod", paymentMethod);
      if (productId !== "ALL") params.set("productId", productId);
      if (minAmount.trim()) params.set("minAmountBrl", String(toNumber(minAmount)));
      if (maxAmount.trim()) params.set("maxAmountBrl", String(toNumber(maxAmount)));
      if (limit.trim()) params.set("limit", limit.trim());

      const suffix = params.toString();
      const data = await apiRequest<AdminProductOrder[]>(`/admin/orders${suffix ? `?${suffix}` : ""}`);
      setOrders(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar as entregas");
    } finally {
      setOrdersLoading(false);
    }
  }, [filters.orders, orderLimit, orderMaxAmount, orderMinAmount, orderPaymentMethod, orderProductId]);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        usersData,
        transactionsData,
        campaignsData,
        packagesData,
        levelsData,
        storesData,
        machinesData,
        productsData,
        ordersData,
        privacyRequestsData,
      ] = await Promise.all([
        apiRequest<AdminUser[]>("/admin/users"),
        apiRequest<AdminTransaction[]>("/admin/transactions"),
        apiRequest<Campaign[]>("/admin/campaigns"),
        apiRequest<CreditPackage[]>("/admin/packages"),
        apiRequest<LoyaltyLevel[]>("/admin/levels"),
        apiRequest<Store[]>("/admin/stores"),
        apiRequest<AdminMachine[]>("/admin/machines"),
        apiRequest<Product[]>("/admin/products"),
        apiRequest<AdminProductOrder[]>(
          `/admin/orders?dateFrom=${defaultFilters.orders.dateFrom}&dateTo=${defaultFilters.orders.dateTo}&limit=100`,
        ),
        apiRequest<AdminPrivacyRequest[]>("/admin/privacy-requests").catch((err) => {
          if (err instanceof ApiError && err.status === 404) return [];
          throw err;
        }),
      ]);
      const [summaryData, distributionData, settingsData] = await Promise.all([
        apiRequest<AdminDashboardSummary>("/admin/dashboard/summary"),
        apiRequest<LoyaltyDistribution>("/admin/dashboard/loyalty-distribution"),
        loadAdminSettingsWithFallback(),
      ]);

      setSummary(summaryData);
      setLoyaltyDistribution(distributionData);
      setSettings(settingsData);
      setTokenBundleAmountBrl(settingsData.tokenBundleAmountBrl.replace(".", ","));
      setTokenBundleCredits(String(settingsData.tokenBundleCredits));
      setPointsPerCredit(String(settingsData.pointsPerCredit));
      setPaymentProvider(settingsData.paymentProvider);
      setSantanderEnvironment(settingsData.santanderEnvironment);
      setSantanderBaseUrl(settingsData.santanderBaseUrl);
      setSantanderPixBaseUrl(settingsData.santanderPixBaseUrl);
      setUsers(usersData);
      setTransactions(transactionsData);
      setCampaigns(campaignsData);
      setPackages(packagesData);
      setLevels(levelsData);
      setStores(storesData);
      setMachines(machinesData);
      setProducts(productsData);
      setOrders(ordersData);
      setPrivacyRequests(privacyRequestsData);

      if (storesData[0]) {
        setMachineForm((current) => ({
          ...current,
          storeId: current.storeId || storesData[0].id,
        }));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar o admin");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  async function searchGameplayLogs() {
    if (!hasGameplayFilters) {
      setError("Informe pelo menos um filtro para buscar jogadas.");
      setGameplayLogs([]);
      setGameplaySearched(false);
      return;
    }

    setGameplayLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.gameplay.search.trim()) params.set("search", filters.gameplay.search.trim());
      if (filters.gameplay.status !== "ALL") params.set("status", filters.gameplay.status);
      if (filters.gameplay.dateFrom) params.set("dateFrom", filters.gameplay.dateFrom);
      if (filters.gameplay.dateTo) params.set("dateTo", filters.gameplay.dateTo);
      if (gameplayStoreId !== "ALL") params.set("storeId", gameplayStoreId);
      if (gameplayMachineId !== "ALL") params.set("machineId", gameplayMachineId);
      if (gameplayMinCredits) params.set("minCredits", gameplayMinCredits);
      if (gameplayMaxCredits) params.set("maxCredits", gameplayMaxCredits);
      if (gameplayLimit) params.set("limit", gameplayLimit);

      const logs = await apiRequest<AdminGameplayLog[]>(`/admin/gameplay?${params.toString()}`);
      setGameplayLogs(logs);
      setGameplaySearched(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel buscar as jogadas");
    } finally {
      setGameplayLoading(false);
    }
  }

  function clearGameplaySearch() {
    clearFilter("gameplay");
    setGameplayStoreId("ALL");
    setGameplayMachineId("ALL");
    setGameplayMinCredits("");
    setGameplayMaxCredits("");
    setGameplayLimit("50");
    setGameplayLogs([]);
    setGameplaySearched(false);
  }

  function setReportQuickRange(days: number) {
    setReportDateFrom(days <= 1 ? todayInputValue : getDaysAgoInputValue(days - 1));
    setReportDateTo(todayInputValue);
  }

  const loadOperationsReport = useCallback(async () => {
    setReportsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (reportDateFrom) params.set("dateFrom", reportDateFrom);
      if (reportDateTo) params.set("dateTo", reportDateTo);
      if (reportStoreId !== "ALL") params.set("storeId", reportStoreId);
      if (reportMachineId !== "ALL") params.set("machineId", reportMachineId);
      if (reportTransactionStatus !== "ALL") params.set("transactionStatus", reportTransactionStatus);
      if (reportGameplayStatus !== "ALL") params.set("gameplayStatus", reportGameplayStatus);
      const report = await apiRequest<AdminOperationsReport>(`/admin/reports/operations?${params.toString()}`);
      setOperationsReport(report);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar os relatorios");
    } finally {
      setReportsLoading(false);
    }
  }, [reportDateFrom, reportDateTo, reportGameplayStatus, reportMachineId, reportStoreId, reportTransactionStatus]);

  useEffect(() => {
    if (activeTab === "reports") {
      loadOperationsReport();
    }
  }, [activeTab, loadOperationsReport]);

  async function submitPackage(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiRequest<CreditPackage>("/admin/packages", {
        method: "POST",
        body: {
          name: packageForm.name,
          amountBrl: toNumber(packageForm.amountBrl),
          baseCredits: toNumber(packageForm.baseCredits),
          bonusCredits: toNumber(packageForm.bonusCredits || "0"),
          pointsAwarded: toNumber(packageForm.pointsAwarded || "0"),
          isPopular: packageForm.isPopular,
          showOnHome: packageForm.showOnHome,
          active: true,
        },
      });
      setPackageForm({
        name: "",
        amountBrl: "",
        baseCredits: "",
        bonusCredits: "0",
        pointsAwarded: "0",
        isPopular: false,
        showOnHome: false,
      });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar o pacote");
    } finally {
      setSaving(false);
    }
  }

  async function submitUser(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiRequest<AdminUser>("/admin/users", {
        method: "POST",
        body: {
          ...userForm,
          phone: userForm.phone || undefined,
        },
      });
      setUserForm({
        name: "",
        email: "",
        cpf: "",
        phone: "",
        password: "",
        role: "CUSTOMER",
        status: "ACTIVE",
      });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel criar o usuario");
    } finally {
      setSaving(false);
    }
  }

  async function updateUserProfile(event: FormEvent<HTMLFormElement>, user: AdminUser) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");

    try {
      await apiRequest<AdminUser>(`/admin/users/${user.id}`, {
        method: "PUT",
        body: {
          name: String(data.get("name") ?? user.name),
          email: String(data.get("email") ?? user.email),
          cpf: String(data.get("cpf") ?? user.cpf),
          phone: String(data.get("phone") || "") || null,
          role: data.get("role"),
          status: data.get("status"),
          ...(password ? { password } : {}),
        },
      });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel atualizar o usuario");
    } finally {
      setSaving(false);
    }
  }

  async function grantCreditsToUser(event: FormEvent<HTMLFormElement>, user: AdminUser) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const credits = Number.parseInt(String(data.get("credits") || "0"), 10);

    if (!Number.isInteger(credits) || credits <= 0) {
      setSaving(false);
      setError("Informe uma quantidade inteira maior que zero para enviar fichas");
      return;
    }

    try {
      await apiRequest<AdminUser>(`/admin/users/${user.id}/credits`, {
        method: "POST",
        body: { credits },
      });
      form.reset();
      await loadAdminData();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("A rota de envio de fichas ainda nao esta no backend publicado. Faca deploy do backend.");
      } else {
        setError(err instanceof Error ? err.message : "Nao foi possivel enviar fichas");
      }
    } finally {
      setSaving(false);
    }
  }

  async function submitSettings(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await apiRequest<AdminSettings>("/admin/settings", {
        method: "PUT",
        body: {
          tokenBundleAmountBrl: toNumber(tokenBundleAmountBrl),
          tokenBundleCredits: toNumber(tokenBundleCredits),
          pointsPerCredit: toNumber(pointsPerCredit || "0"),
        },
      });
      setSettings(updated);
      setTokenBundleAmountBrl(updated.tokenBundleAmountBrl.replace(".", ","));
      setTokenBundleCredits(String(updated.tokenBundleCredits));
      setPointsPerCredit(String(updated.pointsPerCredit));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar o valor da ficha");
    } finally {
      setSaving(false);
    }
  }

  async function submitFinanceSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const nextPaymentProvider = String(data.get("paymentProvider") || paymentProvider) as AdminSettings["paymentProvider"];
    const nextSantanderEnvironment = String(data.get("santanderEnvironment") || santanderEnvironment) as AdminSettings["santanderEnvironment"];
    const nextSantanderBaseUrl = String(data.get("santanderBaseUrl") || santanderBaseUrl);
    const nextSantanderPixBaseUrl = String(data.get("santanderPixBaseUrl") || santanderPixBaseUrl);
    const nextSantanderClientId = String(data.get("santanderClientId") || "");
    const nextSantanderClientSecret = String(data.get("santanderClientSecret") || "");
    const nextSantanderCertificatePem = String(data.get("santanderCertificatePem") || "");
    const nextSantanderPrivateKeyPem = String(data.get("santanderPrivateKeyPem") || "");
    const nextSantanderPfxBase64 = String(data.get("santanderPfxBase64") || santanderPfxBase64 || "");
    const nextSantanderPfxPassphrase = String(data.get("santanderPfxPassphrase") || "");
    const nextSantanderPixKey = String(data.get("santanderPixKey") || "");

    try {
      const updated = await apiRequest<AdminSettings>("/admin/settings", {
        method: "PUT",
        body: {
          paymentProvider: nextPaymentProvider,
          santanderEnvironment: nextSantanderEnvironment,
          santanderBaseUrl: nextSantanderBaseUrl,
          santanderPixBaseUrl: nextSantanderPixBaseUrl,
          santanderClientId: nextSantanderClientId || undefined,
          santanderClientSecret: nextSantanderClientSecret || undefined,
          santanderCertificatePem: nextSantanderCertificatePem || undefined,
          santanderPrivateKeyPem: nextSantanderPrivateKeyPem || undefined,
          santanderPfxBase64: nextSantanderPfxBase64 || undefined,
          santanderPfxPassphrase: nextSantanderPfxPassphrase || undefined,
          santanderPixKey: nextSantanderPixKey || undefined,
        },
      });
      setSettings(updated);
      setPaymentProvider(updated.paymentProvider);
      setSantanderEnvironment(updated.santanderEnvironment);
      setSantanderBaseUrl(updated.santanderBaseUrl);
      setSantanderPixBaseUrl(updated.santanderPixBaseUrl);
      setSantanderClientId("");
      setSantanderClientSecret("");
      setSantanderCertificatePem("");
      setSantanderPrivateKeyPem("");
      setSantanderPfxBase64("");
      setSantanderPfxPassphrase("");
      setSantanderPixKey("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar o financeiro");
    } finally {
      setSaving(false);
    }
  }

  async function submitLevel(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiRequest<LoyaltyLevel>("/admin/levels", {
        method: "POST",
        body: {
          levelName: levelForm.levelName,
          requiredCredits: toNumber(levelForm.requiredCredits),
          bonusCreditsReward: toNumber(levelForm.bonusCreditsReward || "0"),
          pointsAwarded: toNumber(levelForm.pointsAwarded || "0"),
          status: levelForm.status,
        },
      });
      setLevelForm({
        levelName: "",
        requiredCredits: "",
        bonusCreditsReward: "0",
        pointsAwarded: "0",
        status: "ACTIVE",
      });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar o nivel");
    } finally {
      setSaving(false);
    }
  }

  async function submitStore(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiRequest<Store>("/admin/stores", { method: "POST", body: storeForm });
      setStoreForm({ name: "", location: "" });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar a loja");
    } finally {
      setSaving(false);
    }
  }

  async function submitMachine(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiRequest<AdminMachine>("/admin/machines", {
        method: "POST",
        body: {
          storeId: machineForm.storeId,
          name: machineForm.name,
          imageUrl: machineForm.imageUrl || undefined,
          telemetryId: machineForm.telemetryId,
          costPerGame: toNumber(machineForm.costPerGame),
          pulsesPerCredit: toNumber(machineForm.pulsesPerCredit),
        },
      });
      setMachineForm((current) => ({
        ...current,
        name: "",
        imageUrl: "",
        telemetryId: "",
        costPerGame: "1",
        pulsesPerCredit: "5",
      }));
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar a maquina");
    } finally {
      setSaving(false);
    }
  }

  async function submitCampaign(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiRequest<Campaign>("/admin/campaigns", {
        method: "POST",
        body: {
          name: campaignForm.name,
          startsAt: new Date(campaignForm.startsAt).toISOString(),
          endsAt: new Date(campaignForm.endsAt).toISOString(),
          notes: campaignForm.notes || undefined,
          active: true,
          packageOverrides:
            campaignForm.packageId && campaignForm.packageAmountBrl && campaignForm.packageBaseCredits
              ? [
                  {
                    packageId: campaignForm.packageId,
                    amountBrl: toNumber(campaignForm.packageAmountBrl),
                    baseCredits: toNumber(campaignForm.packageBaseCredits),
                    bonusCredits: toNumber(campaignForm.packageBonusCredits || "0"),
                    isPopular: true,
                    active: true,
                  },
                ]
              : undefined,
          machineOverrides:
            campaignForm.machineId && campaignForm.machineCostPerGame && campaignForm.machinePulsesPerCredit
              ? [
                  {
                    machineId: campaignForm.machineId,
                    costPerGame: toNumber(campaignForm.machineCostPerGame),
                    pulsesPerCredit: toNumber(campaignForm.machinePulsesPerCredit),
                  },
                ]
              : undefined,
        },
      });
      setCampaignForm({
        name: "",
        startsAt: "",
        endsAt: "",
        notes: "",
        packageId: "",
        packageAmountBrl: "",
        packageBaseCredits: "",
        packageBonusCredits: "0",
        machineId: "",
        machineCostPerGame: "",
        machinePulsesPerCredit: "",
      });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar a campanha");
    } finally {
      setSaving(false);
    }
  }

  async function togglePackage(creditPackage: CreditPackage) {
    await apiRequest<CreditPackage>(`/admin/packages/${creditPackage.id}`, {
      method: "PUT",
      body: { active: !creditPackage.active },
    });
    await loadAdminData();
  }

  async function toggleLevel(level: LoyaltyLevel) {
    await apiRequest<LoyaltyLevel>(`/admin/levels/${level.id}`, {
      method: "PUT",
      body: { status: level.status === "ACTIVE" ? "DRAFT" : "ACTIVE" },
    });
    await loadAdminData();
  }

  async function updateLevelRules(event: FormEvent<HTMLFormElement>, level: LoyaltyLevel) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const data = new FormData(event.currentTarget);

    try {
      await apiRequest<LoyaltyLevel>(`/admin/levels/${level.id}`, {
        method: "PUT",
        body: {
          levelName: String(data.get("levelName") ?? level.levelName),
          requiredCredits: toNumber(String(data.get("requiredCredits") ?? level.requiredCredits)),
          bonusCreditsReward: toNumber(String(data.get("bonusCreditsReward") ?? level.bonusCreditsReward)),
          pointsAwarded: toNumber(String(data.get("pointsAwarded") ?? level.pointsAwarded)),
          status: data.get("status"),
        },
      });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel atualizar o nivel");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStore(store: Store) {
    await apiRequest<Store>(`/admin/stores/${store.id}`, {
      method: "PUT",
      body: { status: store.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
    });
    await loadAdminData();
  }

  async function updatePackagePricing(event: FormEvent<HTMLFormElement>, creditPackage: CreditPackage) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const data = new FormData(event.currentTarget);

    try {
      await apiRequest<CreditPackage>(`/admin/packages/${creditPackage.id}`, {
        method: "PUT",
        body: {
          amountBrl: toNumber(String(data.get("amountBrl") ?? creditPackage.amountBrl)),
          baseCredits: toNumber(String(data.get("baseCredits") ?? creditPackage.baseCredits)),
          bonusCredits: toNumber(String(data.get("bonusCredits") ?? creditPackage.bonusCredits)),
          pointsAwarded: toNumber(String(data.get("pointsAwarded") ?? creditPackage.pointsAwarded)),
          isPopular: data.get("isPopular") === "on",
          showOnHome: data.get("showOnHome") === "on",
        },
      });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel atualizar o pacote");
    } finally {
      setSaving(false);
    }
  }

  async function updateMachineRules(event: FormEvent<HTMLFormElement>, machine: AdminMachine) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const data = new FormData(event.currentTarget);

    try {
      const imageUrl = String(data.get("imageUrl") || "");
      await apiRequest<AdminMachine>(`/admin/machines/${machine.id}`, {
        method: "PUT",
        body: {
          name: String(data.get("name") ?? machine.name),
          imageUrl: imageUrl || undefined,
          costPerGame: toNumber(String(data.get("costPerGame") ?? machine.costPerGame)),
          pulsesPerCredit: toNumber(String(data.get("pulsesPerCredit") ?? machine.pulsesPerCredit)),
          status: data.get("status"),
        },
      });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel atualizar a maquina");
    } finally {
      setSaving(false);
    }
  }

  async function updateUser(user: AdminUser, input: Partial<Pick<AdminUser, "status" | "role">>) {
    setSaving(true);
    setError(null);
    try {
      await apiRequest<AdminUser>(`/admin/users/${user.id}`, { method: "PUT", body: input });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel atualizar o usuario");
    } finally {
      setSaving(false);
    }
  }

  async function toggleCampaign(campaign: Campaign) {
    setSaving(true);
    setError(null);
    try {
      await apiRequest<Campaign>(`/admin/campaigns/${campaign.id}`, {
        method: "PUT",
        body: { active: !campaign.active },
      });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel atualizar a campanha");
    } finally {
      setSaving(false);
    }
  }

  async function submitProduct(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiRequest<Product>("/admin/products", {
        method: "POST",
        body: {
          name: productForm.name,
          description: productForm.description || undefined,
          imageUrl: productForm.imageUrl || undefined,
          priceCredits: productForm.priceCredits ? toNumber(productForm.priceCredits) : undefined,
          pricePoints: productForm.pricePoints ? toNumber(productForm.pricePoints) : undefined,
          priceBrl: productForm.priceBrl ? toNumber(productForm.priceBrl) : undefined,
          cardPriceBrl: productForm.cardPriceBrl ? toNumber(productForm.cardPriceBrl) : undefined,
          active: true,
        },
      });
      setProductForm({ name: "", description: "", imageUrl: "", priceCredits: "", pricePoints: "", priceBrl: "", cardPriceBrl: "" });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar o produto");
    } finally {
      setSaving(false);
    }
  }

  async function toggleProduct(product: Product) {
    await apiRequest<Product>(`/admin/products/${product.id}`, {
      method: "PUT",
      body: { active: !product.active },
    });
    await loadAdminData();
  }

  async function updateProductPricing(event: FormEvent<HTMLFormElement>, product: Product) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const priceCredits = String(data.get("priceCredits") ?? "");
    const pricePoints = String(data.get("pricePoints") ?? "");
    const priceBrl = String(data.get("priceBrl") ?? "");
    const cardPriceBrl = String(data.get("cardPriceBrl") ?? "");

    try {
      await apiRequest<Product>(`/admin/products/${product.id}`, {
        method: "PUT",
        body: {
          name: String(data.get("name") ?? product.name),
          description: String(data.get("description") ?? "") || null,
          imageUrl: String(data.get("imageUrl") ?? "") || null,
          priceCredits: priceCredits ? toNumber(priceCredits) : null,
          pricePoints: pricePoints ? toNumber(pricePoints) : null,
          priceBrl: priceBrl ? toNumber(priceBrl) : null,
          cardPriceBrl: cardPriceBrl ? toNumber(cardPriceBrl) : null,
        },
      });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel atualizar o produto");
    } finally {
      setSaving(false);
    }
  }

  async function deliverOrder(order: AdminProductOrder) {
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/admin/orders/${order.id}/deliver`, { method: "POST" });
      await loadAdminOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel marcar como entregue");
    } finally {
      setSaving(false);
    }
  }

  async function cancelOrderAsAdmin(order: AdminProductOrder) {
    if (!window.confirm(`Cancelar o pedido "${order.productName}" de ${order.user.name}? Fichas/pontos gastos serao estornados.`)) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/admin/orders/${order.id}/cancel`, { method: "POST" });
      await loadAdminOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel cancelar o pedido");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAdminResource(path: string, confirmationMessage: string) {
    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiRequest(path, { method: "DELETE" });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel excluir");
    } finally {
      setSaving(false);
    }
  }

  async function submitCampaignPackageOverride(event: FormEvent<HTMLFormElement>, campaign: Campaign) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await apiRequest(`/admin/campaigns/${campaign.id}/package-overrides`, {
        method: "POST",
        body: {
          packageId: String(data.get("packageId")),
          amountBrl: toNumber(String(data.get("amountBrl"))),
          baseCredits: toNumber(String(data.get("baseCredits"))),
          bonusCredits: toNumber(String(data.get("bonusCredits") || "0")),
          isPopular: data.get("isPopular") === "on",
          active: data.get("active") === "on",
        },
      });
      form.reset();
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar override de pacote");
    } finally {
      setSaving(false);
    }
  }

  async function submitCampaignMachineOverride(event: FormEvent<HTMLFormElement>, campaign: Campaign) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const status = String(data.get("status") || "");
      await apiRequest(`/admin/campaigns/${campaign.id}/machine-overrides`, {
        method: "POST",
        body: {
          machineId: String(data.get("machineId")),
          costPerGame: toNumber(String(data.get("costPerGame"))),
          pulsesPerCredit: toNumber(String(data.get("pulsesPerCredit"))),
          status: status || undefined,
        },
      });
      form.reset();
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar override de maquina");
    } finally {
      setSaving(false);
    }
  }

  function formatDate(value: string): string {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  function getQrUrl(path: string): string {
    return `${window.location.origin}${path}`;
  }

  function escapePrintText(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function printMachineQr(machine: AdminMachine) {
    const machineQrUrl = getQrUrl(`/qr/maquina/${machine.id}`);
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=16&data=${encodeURIComponent(
      machineQrUrl,
    )}`;
    const printWindow = window.open("", "_blank", "width=520,height=760");

    if (!printWindow) {
      setError("Nao foi possivel abrir a janela de impressao. Libere pop-ups para imprimir o QR Code.");
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>QR Code - ${escapePrintText(machine.name)}</title>
          <style>
            @page { size: auto; margin: 12mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              color: #111827;
            }
            .label {
              width: 100%;
              max-width: 420px;
              border: 3px solid #111827;
              border-radius: 24px;
              padding: 24px;
              text-align: center;
            }
            .brand {
              font-size: 28px;
              font-weight: 900;
              margin: 0;
            }
            .subtitle {
              margin: 4px 0 18px;
              color: #f59e0b;
              font-size: 13px;
              font-weight: 900;
              letter-spacing: 0.18em;
              text-transform: uppercase;
            }
            .qr {
              width: 100%;
              max-width: 330px;
              aspect-ratio: 1;
              margin: 0 auto;
              display: block;
            }
            .machine {
              margin: 18px 0 4px;
              font-size: 26px;
              font-weight: 900;
            }
            .meta {
              margin: 4px 0;
              color: #4b5563;
              font-size: 15px;
              font-weight: 700;
            }
            .hint {
              margin: 18px 0 0;
              border-radius: 16px;
              background: #fef3c7;
              padding: 12px;
              font-size: 16px;
              font-weight: 900;
            }
            .url {
              margin-top: 14px;
              word-break: break-all;
              color: #6b7280;
              font-size: 10px;
            }
            @media print {
              .label { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <main class="label">
            <p class="brand">Agarra Mais</p>
            <p class="subtitle">Token Play</p>
            <img class="qr" src="${qrImageUrl}" alt="QR Code da maquina" />
            <p class="machine">${escapePrintText(machine.name)}</p>
            <p class="meta">${escapePrintText(machine.store.name)}</p>
            <p class="meta">ID ${escapePrintText(machine.telemetryId)}</p>
            <p class="hint">Aponte a camera e jogue com suas fichas</p>
            <p class="url">${escapePrintText(machineQrUrl)}</p>
          </main>
          <script>
            const img = document.querySelector(".qr");
            const printNow = () => setTimeout(() => { window.focus(); window.print(); }, 250);
            if (img.complete) printNow();
            else img.addEventListener("load", printNow, { once: true });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  async function updatePrivacyRequest(event: FormEvent<HTMLFormElement>, request: AdminPrivacyRequest) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      await apiRequest<AdminPrivacyRequest>(`/admin/privacy-requests/${request.id}`, {
        method: "PUT",
        body: {
          status: String(data.get("status") || request.status),
          response: String(data.get("response") || "") || null,
        },
      });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel atualizar a solicitacao LGPD");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 py-5">
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.22)] sm:px-7">
        <span aria-hidden className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-brand-yellow/30" />
        <span aria-hidden className="absolute right-16 top-8 h-20 w-20 rounded-full bg-orange-500/25" />
        <span aria-hidden className="absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-blue-500/20" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-3xl">🧸</span>
              <h1 className="text-3xl font-black text-white sm:text-4xl">Painel Admin</h1>
            </div>
            <p className="max-w-2xl text-sm font-medium text-white/70">
              Gestão da operação digital Agarra Mais com pagamentos, máquinas e campanhas em tempo real.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/10 p-2 text-center ring-1 ring-white/15">
            <div className="rounded-xl bg-white/10 px-3 py-2">
              <p className="text-lg font-black">{summary?.totalUsers ?? 0}</p>
              <p className="text-[11px] font-bold uppercase text-white/60">Usuários</p>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2">
              <p className="text-lg font-black">{summary?.activeMachines ?? 0}</p>
              <p className="text-[11px] font-bold uppercase text-white/60">Online</p>
            </div>
            <div className="rounded-xl bg-brand-yellow px-3 py-2 text-brand-black">
              <p className="text-lg font-black">{summary?.pendingTransactions ?? 0}</p>
              <p className="text-[11px] font-bold uppercase text-brand-black/65">Pend.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/70 bg-white/75 p-2 shadow-sm backdrop-blur no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-150 active:scale-[0.97] ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-brand-yellow to-orange-400 text-brand-black shadow-[0_10px_22px_rgba(245,158,11,0.24)]"
                : "bg-white text-gray-500 hover:bg-amber-50 hover:text-brand-black"
            }`}
          >
            <span aria-hidden className="text-base leading-none">
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          <span aria-hidden>⚠️</span>
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-3 py-16 text-sm text-gray-500">
          <span
            aria-hidden
            className="h-8 w-8 animate-spin-slow rounded-full border-2 border-brand-yellow border-t-transparent"
          />
          Carregando painel...
        </div>
      )}

      {!loading && activeTab === "summary" && summary && (
        <section className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <AdminStatCard icon="💰" label="Faturamento" value={`R$ ${summary.totalRevenueBrl}`} tone="amber" />
            <AdminStatCard icon="🎯" label="Ticket médio" value={`R$ ${summary.averageTicketBrl}`} tone="purple" />
            <AdminStatCard icon="👥" label="Usuários" value={String(summary.totalUsers)} tone="blue" />
            <AdminStatCard
              icon="J"
                  label="Jogadas"
              value={`${summary.successfulGameplay}/${summary.totalGameplay}`}
              tone="green"
            />
            <AdminStatCard
              icon="💳"
              label="Pagamentos"
              value={String(summary.approvedTransactions)}
              sublabel={`${summary.pendingTransactions} pendentes`}
              tone="slate"
            />
            <AdminStatCard
              icon="🏬"
              label="Operação"
              value={`${summary.activeMachines} online`}
              sublabel={`${summary.unavailableMachines} indisponíveis`}
              tone="red"
            />
          </div>

          <AdminCard className="border-amber-100 bg-white/90">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-black text-brand-black">Distribuição por nível</h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-700">Fidelidade</span>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              {loyaltyDistribution?.distribution.map((entry) => (
                <div key={entry.levelName}>
                  <div className="mb-1.5 flex justify-between text-xs font-medium text-gray-500">
                    <span>{entry.levelName}</span>
                    <span>
                      {entry.userCount} usuários · {entry.percentage}%
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-yellow to-orange-400 transition-all duration-500"
                      style={{ width: `${entry.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </section>
      )}

      {!loading && activeTab === "users" && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AdminFormSection title="Criar usuário" onSubmit={submitUser} className="sm:col-span-2 xl:col-span-3">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <input
                className={inputClass}
                required
                placeholder="Nome"
                value={userForm.name}
                onChange={(event) => setUserForm({ ...userForm, name: event.target.value })}
              />
              <input
                className={inputClass}
                required
                type="email"
                placeholder="E-mail"
                value={userForm.email}
                onChange={(event) => setUserForm({ ...userForm, email: event.target.value })}
              />
              <input
                className={inputClass}
                required
                placeholder="CPF"
                value={userForm.cpf}
                onChange={(event) => setUserForm({ ...userForm, cpf: event.target.value })}
              />
              <input
                className={inputClass}
                placeholder="Telefone"
                value={userForm.phone}
                onChange={(event) => setUserForm({ ...userForm, phone: event.target.value })}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                className={inputClass}
                required
                type="password"
                placeholder="Senha"
                value={userForm.password}
                onChange={(event) => setUserForm({ ...userForm, password: event.target.value })}
              />
              <select
                className={inputClass}
                value={userForm.role}
                onChange={(event) => setUserForm({ ...userForm, role: event.target.value as UserForm["role"] })}
              >
                <option value="CUSTOMER">Cliente</option>
                <option value="ADMIN">Admin</option>
              </select>
              <select
                className={inputClass}
                value={userForm.status}
                onChange={(event) => setUserForm({ ...userForm, status: event.target.value as UserForm["status"] })}
              >
                <option value="ACTIVE">Ativo</option>
                <option value="BLOCKED">Bloqueado</option>
              </select>
            </div>
            <AdminButton type="submit" variant="primary" disabled={saving} className="w-full py-3">
              Criar usuário
            </AdminButton>
          </AdminFormSection>

          <div className="sm:col-span-2 xl:col-span-3">
            <AdminFilterBar
              search={filters.users.search}
              status={filters.users.status}
              total={users.length}
              filtered={filteredUsers.length}
              searchPlaceholder="Buscar por nome, e-mail, CPF ou telefone"
              statusOptions={[
                { value: "ALL", label: "Todos" },
                { value: "ACTIVE", label: "Ativos" },
                { value: "BLOCKED", label: "Bloqueados" },
                { value: "ADMIN", label: "Admins" },
                { value: "CUSTOMER", label: "Clientes" },
              ]}
              onSearchChange={(value) => updateFilter("users", "search", value)}
              onStatusChange={(value) => updateFilter("users", "status", value)}
              onClear={() => clearFilter("users")}
            />
          </div>
          {users.length === 0 && (
            <AdminEmptyState icon="👥" message="Nenhum usuário encontrado." />
          )}

          {filteredUsers.map((user) => (
            <AdminCard key={user.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-brand-black">{user.name}</p>
                  <p className="truncate text-sm text-gray-500">{user.email}</p>
                  <p className="text-sm text-gray-500">
                    Saldo {user.creditBalance} fichas · Compradas {user.totalCreditsPurchased} · {user.pointsBalance} pontos
                  </p>
                  <p className="text-xs text-gray-500">CPF {maskCpf(user.cpf)}</p>
                  <p className="text-xs text-gray-500">Telefone {maskPhone(user.phone)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <AdminTag tone={user.role === "ADMIN" ? "black" : "gray"}>{user.role}</AdminTag>
                  <AdminTag tone={user.status === "ACTIVE" ? "green" : "red"}>{user.status}</AdminTag>
                  {user.protected && <AdminTag tone="amber">ADMIN MAXIMO</AdminTag>}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <AdminButton
                  variant={user.status === "ACTIVE" ? "danger" : "secondary"}
                  disabled={saving || user.protected}
                  onClick={() => updateUser(user, { status: user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE" })}
                >
                  {user.protected ? "Protegido" : user.status === "ACTIVE" ? "Bloquear" : "Desbloquear"}
                </AdminButton>
                <AdminButton
                  variant="primary"
                  disabled={saving || user.protected}
                  onClick={() => updateUser(user, { role: user.role === "ADMIN" ? "CUSTOMER" : "ADMIN" })}
                >
                  {user.protected ? "Admin maximo" : user.role === "ADMIN" ? "Rebaixar" : "Promover"}
                </AdminButton>
              </div>
              {user.protected && (
                <p className="mt-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                  Este cadastro e o admin maximo. Ele nao pode ser rebaixado nem bloqueado.
                </p>
              )}
              <form
                onSubmit={(event) => grantCreditsToUser(event, user)}
                className="mt-3 rounded-2xl bg-amber-50 p-3"
              >
                <p className="mb-2 text-xs font-black uppercase text-amber-700">Enviar fichas</p>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    name="credits"
                    className={inputClass}
                    required
                    inputMode="numeric"
                    placeholder="Quantidade"
                  />
                  <AdminButton type="submit" variant="primary" disabled={saving}>
                    Enviar
                  </AdminButton>
                </div>
              </form>
              <form onSubmit={(event) => updateUserProfile(event, user)} className="mt-3 grid gap-2">
                <input name="name" className={inputClass} defaultValue={user.name} placeholder="Nome" />
                <input name="email" className={inputClass} defaultValue={user.email} type="email" placeholder="E-mail" />
                <div className="grid grid-cols-2 gap-2">
                  <input name="cpf" className={inputClass} defaultValue={user.cpf} placeholder="CPF" />
                  <input name="phone" className={inputClass} defaultValue={user.phone ?? ""} placeholder="Telefone" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input name="password" className={inputClass} type="password" placeholder="Nova senha" />
                  <select name="role" className={inputClass} defaultValue={user.role} disabled={user.protected}>
                    <option value="CUSTOMER">Cliente</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <select name="status" className={inputClass} defaultValue={user.status} disabled={user.protected}>
                    <option value="ACTIVE">Ativo</option>
                    <option value="BLOCKED">Bloqueado</option>
                  </select>
                </div>
                <AdminButton type="submit" variant="primary" disabled={saving}>
                  Salvar cadastro
                </AdminButton>
              </form>
            </AdminCard>
          ))}
        </section>
      )}

      {!loading && activeTab === "transactions" && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="sm:col-span-2 xl:col-span-3">
            <AdminFilterBar
              search={filters.transactions.search}
              status={filters.transactions.status}
              dateFrom={filters.transactions.dateFrom}
              dateTo={filters.transactions.dateTo}
              total={transactions.length}
              filtered={filteredTransactions.length}
              searchPlaceholder="Buscar por cliente, pacote, valor ou ID do pagamento"
              statusOptions={[
                { value: "ALL", label: "Todas" },
                { value: "PENDING", label: "Pendentes" },
                { value: "APPROVED", label: "Aprovadas" },
                { value: "FAILED", label: "Falhas" },
              ]}
              onSearchChange={(value) => updateFilter("transactions", "search", value)}
              onStatusChange={(value) => updateFilter("transactions", "status", value)}
              onDateFromChange={(value) => updateFilter("transactions", "dateFrom", value)}
              onDateToChange={(value) => updateFilter("transactions", "dateTo", value)}
              onClear={() => clearFilter("transactions")}
            />
          </div>
          {transactions.length === 0 && (
            <AdminEmptyState icon="💳" message="Nenhuma transação encontrada." />
          )}

          {filteredTransactions.map((transaction) => (
            <AdminCard key={transaction.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-brand-black">{transaction.user.name}</p>
                  <p className="truncate text-sm text-gray-500">{transaction.user.email}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {transaction.package?.name ?? "Pacote removido"} · R${" "}
                    {Number(transaction.amountBrl).toFixed(2)} · {transaction.creditsAwarded} fichas
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
                </div>
                <AdminTag
                  tone={
                    transaction.status === "APPROVED"
                      ? "green"
                      : transaction.status === "PENDING"
                        ? "amber"
                        : "red"
                  }
                >
                  {transaction.status}
                </AdminTag>
              </div>

              {transaction.status === "PENDING" && (
                <div className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                  Aguardando Mercado Pago. Se nao confirmar, a compra nao foi paga.
                </div>
              )}
            </AdminCard>
          ))}
        </section>
      )}

      {!loading && activeTab === "gameplay" && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/80 bg-white/85 p-3 shadow-sm backdrop-blur sm:col-span-2 xl:col-span-3">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1.5fr_150px_150px_150px]">
              <div className="relative md:col-span-2 xl:col-span-1">
                <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                  🔎
                </span>
                <input
                  className={`${filterInputClass} w-full pl-9`}
                  placeholder="Buscar por usuario, email, maquina, loja ou telemetryId"
                  value={filters.gameplay.search}
                  onChange={(event) => updateFilter("gameplay", "search", event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void searchGameplayLogs();
                  }}
                />
              </div>
              <input
                className={`${filterInputClass} w-full`}
                aria-label="Data inicial"
                type="date"
                value={filters.gameplay.dateFrom ?? ""}
                onChange={(event) => updateFilter("gameplay", "dateFrom", event.target.value)}
              />
              <input
                className={`${filterInputClass} w-full`}
                aria-label="Data final"
                type="date"
                value={filters.gameplay.dateTo ?? ""}
                onChange={(event) => updateFilter("gameplay", "dateTo", event.target.value)}
              />
              <select
                className={`${filterInputClass} w-full`}
                value={filters.gameplay.status}
                onChange={(event) => updateFilter("gameplay", "status", event.target.value)}
              >
                <option value="ALL">Todos status</option>
                <option value="SUCCESS">Sucesso</option>
                <option value="FAILED">Falhas</option>
              </select>
            </div>

            <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_1fr_130px_130px_130px_auto_auto]">
              <select
                className={`${filterInputClass} w-full`}
                value={gameplayStoreId}
                onChange={(event) => {
                  setGameplayStoreId(event.target.value);
                  setGameplayMachineId("ALL");
                }}
              >
                <option value="ALL">Todas as lojas</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              <select
                className={`${filterInputClass} w-full`}
                value={gameplayMachineId}
                onChange={(event) => setGameplayMachineId(event.target.value)}
              >
                <option value="ALL">Todas as maquinas</option>
                {gameplayStoreMachines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name}
                  </option>
                ))}
              </select>
              <input
                className={`${filterInputClass} w-full`}
                inputMode="numeric"
                placeholder="Fichas min."
                value={gameplayMinCredits}
                onChange={(event) => setGameplayMinCredits(event.target.value.replace(/\D/g, ""))}
              />
              <input
                className={`${filterInputClass} w-full`}
                inputMode="numeric"
                placeholder="Fichas max."
                value={gameplayMaxCredits}
                onChange={(event) => setGameplayMaxCredits(event.target.value.replace(/\D/g, ""))}
              />
              <select
                className={`${filterInputClass} w-full`}
                value={gameplayLimit}
                onChange={(event) => setGameplayLimit(event.target.value)}
              >
                <option value="25">25 resultados</option>
                <option value="50">50 resultados</option>
                <option value="100">100 resultados</option>
                <option value="200">200 resultados</option>
              </select>
              <AdminButton
                type="button"
                variant="primary"
                disabled={gameplayLoading || !hasGameplayFilters}
                onClick={() => void searchGameplayLogs()}
                className="h-11"
              >
                {gameplayLoading ? "Buscando" : "Buscar"}
              </AdminButton>
              <AdminButton type="button" variant="secondary" onClick={clearGameplaySearch} className="h-11">
                Limpar
              </AdminButton>
            </div>

            <p className="mt-2 text-xs font-semibold text-gray-500">
              {gameplaySearched
                ? `Mostrando ${filteredGameplayLogs.length} de ${gameplayLogs.length} retornadas`
                : "As jogadas so serao carregadas depois de pesquisar ou aplicar filtros."}
            </p>
          </div>
          {!gameplaySearched && !gameplayLoading && (
            <AdminEmptyState icon="🕹️" message="Use os filtros acima para buscar jogadas." />
          )}

          {gameplaySearched && gameplayLogs.length === 0 && (
            <AdminEmptyState icon="🕹️" message="Nenhuma jogada encontrada para os filtros informados." />
          )}

          {filteredGameplayLogs.map((log) => (
            <AdminCard key={log.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-brand-black">{log.machine.name}</p>
                  <p className="truncate text-sm text-gray-500">
                    {log.machine.store.name} · {log.machine.telemetryId}
                  </p>
                  <p className="truncate text-sm text-gray-500">
                    {log.user.name} · {log.user.email}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {log.creditsDebited} fichas · {log.pulsesSent} pulsos
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(log.createdAt)}</p>
                </div>
                <AdminTag tone={log.status === "SUCCESS" ? "green" : "red"}>{log.status}</AdminTag>
              </div>
            </AdminCard>
          ))}
        </section>
      )}

      {!loading && activeTab === "campaigns" && (
        <section className="flex flex-col gap-4">
          <AdminFormSection title="Criar campanha" onSubmit={submitCampaign}>
            <input
              className={inputClass}
              required
              placeholder="Nome da campanha"
              value={campaignForm.name}
              onChange={(event) => setCampaignForm({ ...campaignForm, name: event.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className={inputClass}
                required
                type="datetime-local"
                value={campaignForm.startsAt}
                onChange={(event) => setCampaignForm({ ...campaignForm, startsAt: event.target.value })}
              />
              <input
                className={inputClass}
                required
                type="datetime-local"
                value={campaignForm.endsAt}
                onChange={(event) => setCampaignForm({ ...campaignForm, endsAt: event.target.value })}
              />
            </div>
            <input
              className={inputClass}
              placeholder="Observações"
              value={campaignForm.notes}
              onChange={(event) => setCampaignForm({ ...campaignForm, notes: event.target.value })}
            />
            <div className="rounded-2xl bg-amber-50 p-3">
              <p className="mb-2 text-sm font-black text-brand-black">Promoção de pacote</p>
              <div className="grid gap-2 lg:grid-cols-4">
                <select
                  className={inputClass}
                  value={campaignForm.packageId}
                  onChange={(event) => setCampaignForm({ ...campaignForm, packageId: event.target.value })}
                >
                  <option value="">Sem pacote promocional</option>
                  {packages.map((creditPackage) => (
                    <option key={creditPackage.id} value={creditPackage.id}>
                      {creditPackage.name}
                    </option>
                  ))}
                </select>
                <input
                  className={inputClass}
                  inputMode="decimal"
                  placeholder="Valor R$"
                  value={campaignForm.packageAmountBrl}
                  onChange={(event) => setCampaignForm({ ...campaignForm, packageAmountBrl: event.target.value })}
                />
                <input
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="Fichas"
                  value={campaignForm.packageBaseCredits}
                  onChange={(event) => setCampaignForm({ ...campaignForm, packageBaseCredits: event.target.value })}
                />
                <input
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="Bônus"
                  value={campaignForm.packageBonusCredits}
                  onChange={(event) => setCampaignForm({ ...campaignForm, packageBonusCredits: event.target.value })}
                />
              </div>
            </div>
            <div className="rounded-2xl bg-orange-50 p-3">
              <p className="mb-2 text-sm font-black text-brand-black">Promoção de máquina</p>
              <div className="grid gap-2 lg:grid-cols-3">
                <select
                  className={inputClass}
                  value={campaignForm.machineId}
                  onChange={(event) => setCampaignForm({ ...campaignForm, machineId: event.target.value })}
                >
                  <option value="">Sem máquina promocional</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name}
                    </option>
                  ))}
                </select>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="Fichas por jogada"
                  value={campaignForm.machineCostPerGame}
                  onChange={(event) => setCampaignForm({ ...campaignForm, machineCostPerGame: event.target.value })}
                />
                <input
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="Pulsos por ficha"
                  value={campaignForm.machinePulsesPerCredit}
                  onChange={(event) => setCampaignForm({ ...campaignForm, machinePulsesPerCredit: event.target.value })}
                />
              </div>
            </div>
            <AdminButton type="submit" variant="primary" disabled={saving} className="w-full py-3">
              Criar campanha
            </AdminButton>
          </AdminFormSection>

          <AdminFilterBar
            search={filters.campaigns.search}
            status={filters.campaigns.status}
            total={campaigns.length}
            filtered={filteredCampaigns.length}
            searchPlaceholder="Buscar por campanha, observação, pacote ou máquina"
            statusOptions={[
              { value: "ALL", label: "Todas" },
              { value: "ACTIVE", label: "Ativas" },
              { value: "INACTIVE", label: "Inativas" },
              { value: "RUNNING", label: "Em andamento" },
              { value: "UPCOMING", label: "Futuras" },
              { value: "EXPIRED", label: "Encerradas" },
            ]}
            onSearchChange={(value) => updateFilter("campaigns", "search", value)}
            onStatusChange={(value) => updateFilter("campaigns", "status", value)}
            onClear={() => clearFilter("campaigns")}
          />

          {campaigns.length === 0 && <AdminEmptyState icon="🎯" message="Nenhuma campanha cadastrada." />}

          {filteredCampaigns.map((campaign) => (
            <AdminCard key={campaign.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-brand-black">{campaign.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(campaign.startsAt)} até {formatDate(campaign.endsAt)}
                  </p>
                  {campaign.notes && <p className="mt-1 text-sm text-gray-500">{campaign.notes}</p>}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <AdminButton
                    variant={campaign.active ? "primary" : "secondary"}
                    disabled={saving}
                    onClick={() => toggleCampaign(campaign)}
                  >
                    {campaign.active ? "Ativa" : "Inativa"}
                  </AdminButton>
                  <AdminButton
                    variant="danger"
                    disabled={saving}
                    onClick={() =>
                      deleteAdminResource(`/admin/campaigns/${campaign.id}`, `Excluir a campanha "${campaign.name}"?`)
                    }
                  >
                    Excluir
                  </AdminButton>
                </div>
              </div>

              <AdminFormSection
                title="Override de pacote"
                onSubmit={(event) => submitCampaignPackageOverride(event, campaign)}
                className="mt-4 bg-white ring-1 ring-gray-100"
              >
                <select name="packageId" className={inputClass} required>
                  {packages.map((creditPackage) => (
                    <option key={creditPackage.id} value={creditPackage.id}>
                      {creditPackage.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-3 gap-2">
                  <input name="amountBrl" className={inputClass} inputMode="decimal" placeholder="R$" required />
                  <input
                    name="baseCredits"
                    className={inputClass}
                    inputMode="numeric"
                    placeholder="Fichas"
                    required
                  />
                  <input
                    name="bonusCredits"
                    className={inputClass}
                    inputMode="numeric"
                    placeholder="Bônus"
                    defaultValue="0"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-brand-black">
                    <input name="isPopular" type="checkbox" />
                    Popular
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-brand-black">
                    <input name="active" type="checkbox" defaultChecked />
                    Ativo
                  </label>
                </div>
                <AdminButton type="submit" variant="primary" disabled={saving}>
                  Salvar pacote da campanha
                </AdminButton>
              </AdminFormSection>

              <AdminFormSection
                title="Override de máquina"
                onSubmit={(event) => submitCampaignMachineOverride(event, campaign)}
                className="mt-3 bg-white ring-1 ring-gray-100"
              >
                <select name="machineId" className={inputClass} required>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-3 gap-2">
                  <input name="costPerGame" className={inputClass} inputMode="numeric" placeholder="Custo" required />
                  <input
                    name="pulsesPerCredit"
                    className={inputClass}
                    inputMode="numeric"
                    placeholder="Pulsos"
                    required
                  />
                  <select name="status" className={inputClass} defaultValue="">
                    <option value="">Status atual</option>
                    <option value="AVAILABLE">Disponível</option>
                    <option value="BUSY">Ocupada</option>
                    <option value="MAINTENANCE">Manutenção</option>
                  </select>
                </div>
                <AdminButton type="submit" variant="primary" disabled={saving}>
                  Salvar máquina da campanha
                </AdminButton>
              </AdminFormSection>

              {(campaign.packageOverrides.length > 0 || campaign.machineOverrides.length > 0) && (
                <div className="mt-3 flex flex-col gap-2 text-xs text-gray-500">
                  {campaign.packageOverrides.map((override) => (
                    <p key={override.id}>
                      Pacote: {override.package.name} · R$ {Number(override.amountBrl).toFixed(2)} ·{" "}
                      {override.baseCredits + override.bonusCredits} fichas
                    </p>
                  ))}
                  {campaign.machineOverrides.map((override) => (
                    <p key={override.id}>
                      Máquina: {override.machine.name} · {override.costPerGame} ficha/jogada ·{" "}
                      {override.pulsesPerCredit} pulsos/ficha
                    </p>
                  ))}
                </div>
              )}
            </AdminCard>
          ))}
        </section>
      )}

      {!loading && activeTab === "packages" && (
        <section className="flex flex-col gap-4">
          <AdminFormSection title="Valor da ficha" onSubmit={submitSettings}>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold uppercase text-gray-500">Reais</span>
                <input
                  className={inputClass}
                  required
                  inputMode="decimal"
                  placeholder="R$ 1,00"
                  value={tokenBundleAmountBrl}
                  onChange={(event) => setTokenBundleAmountBrl(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold uppercase text-gray-500">Fichas</span>
                <input
                  className={inputClass}
                  required
                  inputMode="numeric"
                  placeholder="2"
                  value={tokenBundleCredits}
                  onChange={(event) => setTokenBundleCredits(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold uppercase text-gray-500">Pontos por ficha avulsa</span>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="0"
                  value={pointsPerCredit}
                  onChange={(event) => setPointsPerCredit(event.target.value)}
                />
              </label>
              <AdminButton type="submit" variant="primary" disabled={saving} className="h-11 px-5">
                Salvar valor
              </AdminButton>
            </div>
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">
              R$ {Number(settings?.tokenBundleAmountBrl ?? tokenBundleAmountBrl.replace(",", ".")).toFixed(2)} ={" "}
              {settings?.tokenBundleCredits ?? Number(tokenBundleCredits || 0)} ficha(s) · 1 ficha = R${" "}
              {Number(settings?.tokenValueBrl ?? (toNumber(tokenBundleAmountBrl) / Math.max(1, toNumber(tokenBundleCredits)))).toFixed(2)}
              {" · "}
              cada ficha avulsa comprada gera {settings?.pointsPerCredit ?? Number(pointsPerCredit || 0)} ponto(s)
            </div>
          </AdminFormSection>

          <AdminFormSection title="Criar pacote de fichas" onSubmit={submitPackage}>
            <input
              className={inputClass}
              required
              placeholder="Nome do pacote"
              value={packageForm.name}
              onChange={(event) => setPackageForm({ ...packageForm, name: event.target.value })}
            />
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold uppercase text-gray-500">Valor do pacote</span>
                <input
                  className={inputClass}
                  required
                  inputMode="decimal"
                  placeholder="Ex: 10,00"
                  value={packageForm.amountBrl}
                  onChange={(event) => setPackageForm({ ...packageForm, amountBrl: event.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold uppercase text-gray-500">Fichas base</span>
                <input
                  className={inputClass}
                  required
                  inputMode="numeric"
                  placeholder="Ex: 10"
                  value={packageForm.baseCredits}
                  onChange={(event) => setPackageForm({ ...packageForm, baseCredits: event.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold uppercase text-gray-500">Fichas bônus</span>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="Ex: 2"
                  value={packageForm.bonusCredits}
                  onChange={(event) => setPackageForm({ ...packageForm, bonusCredits: event.target.value })}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold uppercase text-gray-500">Pontos ganhos na compra</span>
              <input
                className={inputClass}
                inputMode="numeric"
                placeholder="0"
                value={packageForm.pointsAwarded}
                onChange={(event) => setPackageForm({ ...packageForm, pointsAwarded: event.target.value })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-brand-black">
              <input
                type="checkbox"
                checked={packageForm.isPopular}
                onChange={(event) => setPackageForm({ ...packageForm, isPopular: event.target.checked })}
              />
              Mais popular
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-brand-black">
              <input
                type="checkbox"
                checked={packageForm.showOnHome}
                onChange={(event) => setPackageForm({ ...packageForm, showOnHome: event.target.checked })}
              />
              Mostrar na tela inicial
            </label>
            <AdminButton type="submit" variant="primary" disabled={saving} className="w-full py-3">
              Criar pacote
            </AdminButton>
          </AdminFormSection>

          <AdminFilterBar
            search={filters.packages.search}
            status={filters.packages.status}
            total={packages.length}
            filtered={filteredPackages.length}
            searchPlaceholder="Buscar por nome, valor, fichas ou bônus"
            statusOptions={[
              { value: "ALL", label: "Todos" },
              { value: "ACTIVE", label: "Ativos" },
              { value: "INACTIVE", label: "Inativos" },
              { value: "POPULAR", label: "Populares" },
            ]}
            onSearchChange={(value) => updateFilter("packages", "search", value)}
            onStatusChange={(value) => updateFilter("packages", "status", value)}
            onClear={() => clearFilter("packages")}
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {packages.length === 0 && <AdminEmptyState icon="🎁" message="Nenhum pacote cadastrado." />}

            {filteredPackages.map((creditPackage) => (
              <AdminCard key={creditPackage.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-brand-black">{creditPackage.name}</p>
                    <p className="text-sm text-gray-500">
                      R$ {Number(creditPackage.amountBrl).toFixed(2)} ·{" "}
                      {creditPackage.baseCredits + creditPackage.bonusCredits} fichas · +{creditPackage.pointsAwarded} pontos
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <AdminButton
                      variant={creditPackage.active ? "primary" : "secondary"}
                      onClick={() => togglePackage(creditPackage)}
                    >
                      {creditPackage.active ? "Ativo" : "Inativo"}
                    </AdminButton>
                    <AdminButton
                      variant="danger"
                      disabled={saving}
                      onClick={() =>
                        deleteAdminResource(
                          `/admin/packages/${creditPackage.id}`,
                          `Excluir o pacote "${creditPackage.name}"?`,
                        )
                      }
                    >
                      Excluir
                    </AdminButton>
                  </div>
                </div>
                <form onSubmit={(event) => updatePackagePricing(event, creditPackage)} className="mt-3 grid gap-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-extrabold uppercase text-gray-500">Valor R$</span>
                      <input
                        name="amountBrl"
                        className={inputClass}
                        inputMode="decimal"
                        defaultValue={String(creditPackage.amountBrl)}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-extrabold uppercase text-gray-500">Fichas base</span>
                      <input
                        name="baseCredits"
                        className={inputClass}
                        inputMode="numeric"
                        defaultValue={creditPackage.baseCredits}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-extrabold uppercase text-gray-500">Bônus</span>
                      <input
                        name="bonusCredits"
                        className={inputClass}
                        inputMode="numeric"
                        defaultValue={creditPackage.bonusCredits}
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-extrabold uppercase text-gray-500">Pontos ganhos na compra</span>
                    <input
                      name="pointsAwarded"
                      className={inputClass}
                      inputMode="numeric"
                      placeholder="0"
                      defaultValue={creditPackage.pointsAwarded}
                    />
                  </label>
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-brand-black">
                      <input name="isPopular" type="checkbox" defaultChecked={creditPackage.isPopular} />
                      Popular
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-brand-black">
                      <input name="showOnHome" type="checkbox" defaultChecked={creditPackage.showOnHome} />
                      Tela inicial
                    </label>
                    <AdminButton type="submit" variant="primary" disabled={saving}>
                      Salvar
                    </AdminButton>
                  </div>
                </form>
              </AdminCard>
            ))}
          </div>
        </section>
      )}

      {!loading && activeTab === "levels" && (
        <section className="flex flex-col gap-4">
          <AdminFormSection title="Criar nível de fidelidade" onSubmit={submitLevel}>
            <input
              className={inputClass}
              required
              placeholder="Nome do nível"
              value={levelForm.levelName}
              onChange={(event) => setLevelForm({ ...levelForm, levelName: event.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className={inputClass}
                required
                inputMode="numeric"
                placeholder="Fichas requeridas"
                value={levelForm.requiredCredits}
                onChange={(event) => setLevelForm({ ...levelForm, requiredCredits: event.target.value })}
              />
              <input
                className={inputClass}
                inputMode="numeric"
                placeholder="Bônus"
                value={levelForm.bonusCreditsReward}
                onChange={(event) => setLevelForm({ ...levelForm, bonusCreditsReward: event.target.value })}
              />
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold uppercase text-gray-500">Pontos ganhos ao subir de nível</span>
              <input
                className={inputClass}
                inputMode="numeric"
                placeholder="0"
                value={levelForm.pointsAwarded}
                onChange={(event) => setLevelForm({ ...levelForm, pointsAwarded: event.target.value })}
              />
            </label>
            <select
              className={inputClass}
              value={levelForm.status}
              onChange={(event) => setLevelForm({ ...levelForm, status: event.target.value as LevelForm["status"] })}
            >
              <option value="ACTIVE">Ativo</option>
              <option value="DRAFT">Rascunho</option>
            </select>
            <AdminButton type="submit" variant="primary" disabled={saving} className="w-full py-3">
              Criar nível
            </AdminButton>
          </AdminFormSection>

          <AdminFilterBar
            search={filters.levels.search}
            status={filters.levels.status}
            total={levels.length}
            filtered={filteredLevels.length}
            searchPlaceholder="Buscar por nível, fichas requeridas ou bônus"
            statusOptions={[
              { value: "ALL", label: "Todos" },
              { value: "ACTIVE", label: "Ativos" },
              { value: "DRAFT", label: "Rascunhos" },
            ]}
            onSearchChange={(value) => updateFilter("levels", "search", value)}
            onStatusChange={(value) => updateFilter("levels", "status", value)}
            onClear={() => clearFilter("levels")}
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {levels.length === 0 && <AdminEmptyState icon="🏆" message="Nenhum nível cadastrado." />}

            {filteredLevels.map((level) => (
              <AdminCard key={level.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-brand-black">{level.levelName}</p>
                    <p className="text-sm text-gray-500">
                      {level.requiredCredits} fichas · +{level.bonusCreditsReward} bônus · +{level.pointsAwarded} pontos
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <AdminButton
                      variant={level.status === "ACTIVE" ? "primary" : "secondary"}
                      onClick={() => toggleLevel(level)}
                    >
                      {level.status === "ACTIVE" ? "Ativo" : "Rascunho"}
                    </AdminButton>
                    <AdminButton
                      variant="danger"
                      disabled={saving}
                      onClick={() =>
                        deleteAdminResource(`/admin/levels/${level.id}`, `Excluir o nivel "${level.levelName}"?`)
                      }
                    >
                      Excluir
                    </AdminButton>
                  </div>
                </div>
                <form onSubmit={(event) => updateLevelRules(event, level)} className="mt-3 grid gap-2">
                  <input name="levelName" className={inputClass} defaultValue={level.levelName} />
                  <div className="grid grid-cols-3 gap-2">
                    <input name="requiredCredits" className={inputClass} inputMode="numeric" defaultValue={level.requiredCredits} />
                    <input name="bonusCreditsReward" className={inputClass} inputMode="numeric" defaultValue={level.bonusCreditsReward} />
                    <input name="pointsAwarded" className={inputClass} inputMode="numeric" defaultValue={level.pointsAwarded} />
                  </div>
                  <select name="status" className={inputClass} defaultValue={level.status}>
                    <option value="ACTIVE">Ativo</option>
                    <option value="DRAFT">Rascunho</option>
                  </select>
                  <AdminButton type="submit" variant="primary" disabled={saving}>
                    Salvar nível
                  </AdminButton>
                </form>
              </AdminCard>
            ))}
          </div>
        </section>
      )}

      {!loading && activeTab === "stores" && (
        <section className="flex flex-col gap-4">
          <AdminFormSection title="Criar loja" onSubmit={submitStore}>
            <input
              className={inputClass}
              required
              placeholder="Nome da loja"
              value={storeForm.name}
              onChange={(event) => setStoreForm({ ...storeForm, name: event.target.value })}
            />
            <input
              className={inputClass}
              required
              placeholder="Localização"
              value={storeForm.location}
              onChange={(event) => setStoreForm({ ...storeForm, location: event.target.value })}
            />
            <AdminButton type="submit" variant="primary" disabled={saving} className="w-full py-3">
              Criar loja
            </AdminButton>
          </AdminFormSection>

          <AdminFilterBar
            search={filters.stores.search}
            status={filters.stores.status}
            total={stores.length}
            filtered={filteredStores.length}
            searchPlaceholder="Buscar por loja, localização ou status"
            statusOptions={[
              { value: "ALL", label: "Todas" },
              { value: "ACTIVE", label: "Ativas" },
              { value: "INACTIVE", label: "Inativas" },
            ]}
            onSearchChange={(value) => updateFilter("stores", "search", value)}
            onStatusChange={(value) => updateFilter("stores", "status", value)}
            onClear={() => clearFilter("stores")}
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {stores.length === 0 && <AdminEmptyState icon="🏬" message="Nenhuma loja cadastrada." />}

            {filteredStores.map((store) => (
              <AdminCard key={store.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-brand-black">{store.name}</p>
                    <p className="text-sm text-gray-500">{store.location}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <AdminButton
                      variant={store.status === "ACTIVE" ? "primary" : "secondary"}
                      onClick={() => toggleStore(store)}
                    >
                      {store.status === "ACTIVE" ? "Ativa" : "Inativa"}
                    </AdminButton>
                    <AdminButton
                      variant="danger"
                      disabled={saving}
                      onClick={() => deleteAdminResource(`/admin/stores/${store.id}`, `Excluir a loja "${store.name}"?`)}
                    >
                      Excluir
                    </AdminButton>
                  </div>
                </div>
              </AdminCard>
            ))}
          </div>
        </section>
      )}

      {!loading && activeTab === "machines" && (
        <section className="flex flex-col gap-4">

<AdminFormSection title="Criar máquina" onSubmit={submitMachine}>
            <select
              className={inputClass}
              required
              value={machineForm.storeId}
              onChange={(event) => setMachineForm({ ...machineForm, storeId: event.target.value })}
            >
              {activeStores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              required
              placeholder="Nome da máquina"
              value={machineForm.name}
              onChange={(event) => setMachineForm({ ...machineForm, name: event.target.value })}
            />
            <input
              className={inputClass}
              required
              placeholder="ID CompactPay / telemetryId"
              value={machineForm.telemetryId}
              onChange={(event) => setMachineForm({ ...machineForm, telemetryId: event.target.value })}
            />
            <input
              className={inputClass}
              placeholder="URL da imagem"
              value={machineForm.imageUrl}
              onChange={(event) => setMachineForm({ ...machineForm, imageUrl: event.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className={inputClass}
                required
                inputMode="numeric"
                placeholder="Custo"
                value={machineForm.costPerGame}
                onChange={(event) => setMachineForm({ ...machineForm, costPerGame: event.target.value })}
              />
              <input
                className={inputClass}
                required
                inputMode="numeric"
                placeholder="Pulsos por ficha"
                value={machineForm.pulsesPerCredit}
                onChange={(event) => setMachineForm({ ...machineForm, pulsesPerCredit: event.target.value })}
              />
            </div>
            <AdminButton
              type="submit"
              variant="primary"
              disabled={saving || activeStores.length === 0}
              className="w-full py-3"
            >
              Criar máquina
            </AdminButton>
          </AdminFormSection>

          <AdminFilterBar
            search={filters.machines.search}
            status={filters.machines.status}
            total={machines.length}
            filtered={filteredMachines.length}
            searchPlaceholder="Buscar por máquina, loja, localização ou telemetryId"
            statusLabel="Status ou loja"
            statusOptions={[
              { value: "ALL", label: "Todas" },
              { value: "AVAILABLE", label: "Disponíveis" },
              { value: "BUSY", label: "Ocupadas" },
              { value: "MAINTENANCE", label: "Manutenção" },
              ...stores.map((store) => ({ value: store.id, label: `Loja: ${store.name}` })),
            ]}
            onSearchChange={(value) => updateFilter("machines", "search", value)}
            onStatusChange={(value) => updateFilter("machines", "status", value)}
            onClear={() => clearFilter("machines")}
          />

          <div className="grid gap-3 xl:grid-cols-2">
            {machines.length === 0 && <AdminEmptyState icon="🧸" message="Nenhuma máquina cadastrada." />}

            {filteredMachines.map((machine) => (
              <AdminCard key={machine.id}>
                <p className="font-bold text-brand-black">{machine.name}</p>
                <p className="text-sm text-gray-500">
                  {machine.store.name} · {machine.telemetryId}
                </p>
                <p className="text-sm text-gray-500">
                  {machine.costPerGame} ficha/jogada · {machine.pulsesPerCredit} pulsos/ficha
                </p>
                <div className="mt-2 rounded-lg bg-surface-soft p-2 text-xs text-gray-500">
                  <p className="break-all">QR máquina: {getQrUrl(`/qr/maquina/${machine.id}`)}</p>
                  <p className="break-all">QR loja: {getQrUrl(`/qr/loja/${machine.store.id}`)}</p>
                </div>
                <AdminButton
                  type="button"
                  variant="secondary"
                  className="mt-3 w-full py-3"
                  onClick={() => printMachineQr(machine)}
                >
                  Imprimir QR da maquina
                </AdminButton>
                <form onSubmit={(event) => updateMachineRules(event, machine)} className="mt-3 grid gap-2">
                  <input name="name" className={inputClass} defaultValue={machine.name} />
                  <input name="imageUrl" className={inputClass} defaultValue={machine.imageUrl ?? ""} placeholder="URL da imagem" />
                  <div className="grid grid-cols-3 gap-2">
                    <input name="costPerGame" className={inputClass} inputMode="numeric" defaultValue={machine.costPerGame} />
                    <input name="pulsesPerCredit" className={inputClass} inputMode="numeric" defaultValue={machine.pulsesPerCredit} />
                    <select name="status" className={inputClass} defaultValue={machine.status}>
                      <option value="AVAILABLE">Disponível</option>
                      <option value="BUSY">Ocupada</option>
                      <option value="MAINTENANCE">Manutenção</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <AdminButton type="submit" variant="primary" disabled={saving}>
                      Salvar regras
                    </AdminButton>
                    <AdminButton
                      type="button"
                      variant="danger"
                      disabled={saving}
                      onClick={() =>
                        deleteAdminResource(`/admin/machines/${machine.id}`, `Excluir a maquina "${machine.name}"?`)
                      }
                    >
                      Excluir
                    </AdminButton>
                  </div>
                </form>
              </AdminCard>
            ))}
          </div>
        </section>
      )}

      {!loading && activeTab === "products" && (
        <section className="flex flex-col gap-4">
          <AdminFormSection title="Cadastrar produto" onSubmit={submitProduct}>
            <input
              className={inputClass}
              required
              placeholder="Nome do produto"
              value={productForm.name}
              onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Descricao (opcional)"
              value={productForm.description}
              onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}
            />
            <input
              className={inputClass}
              placeholder="URL da imagem (opcional)"
              value={productForm.imageUrl}
              onChange={(event) => setProductForm({ ...productForm, imageUrl: event.target.value })}
            />
            <div className="grid grid-cols-3 gap-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold uppercase text-gray-500">Fichas</span>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="Ex: 50"
                  value={productForm.priceCredits}
                  onChange={(event) => setProductForm({ ...productForm, priceCredits: event.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold uppercase text-gray-500">Pontos</span>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="Ex: 200"
                  value={productForm.pricePoints}
                  onChange={(event) => setProductForm({ ...productForm, pricePoints: event.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold uppercase text-gray-500">Pix R$</span>
                <input
                  className={inputClass}
                  inputMode="decimal"
                  placeholder="Ex: 49,90"
                  value={productForm.priceBrl}
                  onChange={(event) => setProductForm({ ...productForm, priceBrl: event.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold uppercase text-gray-500">Cartao R$</span>
                <input
                  className={inputClass}
                  inputMode="decimal"
                  placeholder="Ex: 54,90"
                  value={productForm.cardPriceBrl}
                  onChange={(event) => setProductForm({ ...productForm, cardPriceBrl: event.target.value })}
                />
              </label>
            </div>
            <p className="text-xs font-semibold text-gray-500">
              Preencha ao menos um preco. Deixe em branco os que nao se aplicam a este produto.
            </p>
            <AdminButton type="submit" variant="primary" disabled={saving} className="w-full py-3">
              Criar produto
            </AdminButton>
          </AdminFormSection>

          <AdminFilterBar
            search={filters.products.search}
            status={filters.products.status}
            total={products.length}
            filtered={filteredProducts.length}
            searchPlaceholder="Buscar por nome ou descricao"
            statusOptions={[
              { value: "ALL", label: "Todos" },
              { value: "ACTIVE", label: "Ativos" },
              { value: "INACTIVE", label: "Inativos" },
            ]}
            onSearchChange={(value) => updateFilter("products", "search", value)}
            onStatusChange={(value) => updateFilter("products", "status", value)}
            onClear={() => clearFilter("products")}
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {products.length === 0 && <AdminEmptyState icon="🛍️" message="Nenhum produto cadastrado." />}

            {filteredProducts.map((product) => (
              <AdminCard key={product.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-brand-black">{product.name}</p>
                    <p className="text-sm text-gray-500">
                      {[
                        product.priceCredits != null ? `${product.priceCredits} fichas` : null,
                        product.pricePoints != null ? `${product.pricePoints} pontos` : null,
                        product.priceBrl != null ? `Pix R$ ${Number(product.priceBrl).toFixed(2)}` : null,
                        product.cardPriceBrl != null ? `Cartao R$ ${Number(product.cardPriceBrl).toFixed(2)}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <AdminButton variant={product.active ? "primary" : "secondary"} onClick={() => toggleProduct(product)}>
                      {product.active ? "Ativo" : "Inativo"}
                    </AdminButton>
                    <AdminButton
                      variant="danger"
                      disabled={saving}
                      onClick={() =>
                        deleteAdminResource(`/admin/products/${product.id}`, `Excluir o produto "${product.name}"?`)
                      }
                    >
                      Excluir
                    </AdminButton>
                  </div>
                </div>
                <form onSubmit={(event) => updateProductPricing(event, product)} className="mt-3 grid gap-2">
                  <input name="name" className={inputClass} defaultValue={product.name} />
                  <input name="description" className={inputClass} defaultValue={product.description ?? ""} placeholder="Descricao" />
                  <input name="imageUrl" className={inputClass} defaultValue={product.imageUrl ?? ""} placeholder="URL da imagem" />
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <input
                      name="priceCredits"
                      className={inputClass}
                      inputMode="numeric"
                      defaultValue={product.priceCredits ?? ""}
                      placeholder="Fichas"
                    />
                    <input
                      name="pricePoints"
                      className={inputClass}
                      inputMode="numeric"
                      defaultValue={product.pricePoints ?? ""}
                      placeholder="Pontos"
                    />
                    <input
                      name="priceBrl"
                      className={inputClass}
                      inputMode="decimal"
                      defaultValue={product.priceBrl ?? ""}
                      placeholder="R$"
                    />
                    <input
                      name="cardPriceBrl"
                      className={inputClass}
                      inputMode="decimal"
                      defaultValue={product.cardPriceBrl ?? ""}
                      placeholder="Cartao R$"
                    />
                  </div>
                  <AdminButton type="submit" variant="primary" disabled={saving}>
                    Salvar
                  </AdminButton>
                </form>
              </AdminCard>
            ))}
          </div>
        </section>
      )}

      {!loading && activeTab === "orders" && (
        <section className="flex flex-col gap-4">
          <form
            className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              void loadAdminOrders();
            }}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <input
                className={`${filterInputClass} xl:col-span-2`}
                placeholder="🔎 Produto, cliente ou email"
                value={filters.orders.search}
                onChange={(event) => updateFilter("orders", "search", event.target.value)}
              />
              <select
                className={filterInputClass}
                value={filters.orders.status}
                onChange={(event) => updateFilter("orders", "status", event.target.value)}
              >
                <option value="ALL">Todos os status</option>
                <option value="AWAITING_DELIVERY">A entregar</option>
                <option value="PENDING_PAYMENT">Aguardando pagamento</option>
                <option value="DELIVERED">Entregues</option>
                <option value="CANCELED">Cancelados</option>
                <option value="FAILED">Falhos</option>
              </select>
              <select
                className={filterInputClass}
                value={orderPaymentMethod}
                onChange={(event) => setOrderPaymentMethod(event.target.value)}
              >
                <option value="ALL">Todas as formas</option>
                <option value="MONEY">Dinheiro/Pix/cartao</option>
                <option value="CREDITS">Fichas</option>
                <option value="POINTS">Pontos</option>
              </select>
              <select
                className={`${filterInputClass} xl:col-span-2`}
                value={orderProductId}
                onChange={(event) => setOrderProductId(event.target.value)}
              >
                <option value="ALL">Todos os produtos</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <label className="flex flex-col gap-1 text-xs font-bold text-gray-500">
                De
                <input
                  className={filterInputClass}
                  type="date"
                  value={filters.orders.dateFrom ?? ""}
                  onChange={(event) => updateFilter("orders", "dateFrom", event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-gray-500">
                Ate
                <input
                  className={filterInputClass}
                  type="date"
                  value={filters.orders.dateTo ?? ""}
                  onChange={(event) => updateFilter("orders", "dateTo", event.target.value)}
                />
              </label>
              <input
                className={filterInputClass}
                inputMode="decimal"
                placeholder="Valor minimo R$"
                value={orderMinAmount}
                onChange={(event) => setOrderMinAmount(event.target.value)}
              />
              <input
                className={filterInputClass}
                inputMode="decimal"
                placeholder="Valor maximo R$"
                value={orderMaxAmount}
                onChange={(event) => setOrderMaxAmount(event.target.value)}
              />
              <select className={filterInputClass} value={orderLimit} onChange={(event) => setOrderLimit(event.target.value)}>
                <option value="50">50 resultados</option>
                <option value="100">100 resultados</option>
                <option value="200">200 resultados</option>
              </select>
              <div className="flex flex-wrap items-end gap-2 xl:col-span-6">
                <AdminButton type="submit" variant="primary" disabled={ordersLoading}>
                  {ordersLoading ? "Buscando..." : "Buscar"}
                </AdminButton>
                <AdminButton
                  type="button"
                  onClick={() => {
                    const nextFilter = { ...filters.orders, dateFrom: getDaysAgoInputValue(6), dateTo: todayInputValue };
                    setFilters((current) => ({ ...current, orders: nextFilter }));
                    void loadAdminOrders({ filter: nextFilter });
                  }}
                >
                  Ultimos 7 dias
                </AdminButton>
                <AdminButton
                  type="button"
                  onClick={() => {
                    const nextFilter = { ...filters.orders, dateFrom: todayInputValue, dateTo: todayInputValue };
                    setFilters((current) => ({ ...current, orders: nextFilter }));
                    void loadAdminOrders({ filter: nextFilter });
                  }}
                >
                  Hoje
                </AdminButton>
                <AdminButton
                  type="button"
                  onClick={() => {
                    const nextFilter = defaultFilters.orders;
                    setFilters((current) => ({ ...current, orders: nextFilter }));
                    setOrderPaymentMethod("ALL");
                    setOrderProductId("ALL");
                    setOrderMinAmount("");
                    setOrderMaxAmount("");
                    setOrderLimit("100");
                    void loadAdminOrders({
                      filter: nextFilter,
                      paymentMethod: "ALL",
                      productId: "ALL",
                      minAmount: "",
                      maxAmount: "",
                      limit: "100",
                    });
                  }}
                >
                  Limpar
                </AdminButton>
                <span className="text-xs font-bold text-gray-500">
                  Mostrando {filteredOrders.length} de {orders.length}
                </span>
              </div>
            </div>
          </form>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ordersLoading && <AdminEmptyState icon="📮" message="Carregando entregas..." />}
            {!ordersLoading && orders.length === 0 && <AdminEmptyState icon="📮" message="Nenhum pedido nesse filtro." />}

            {!ordersLoading && filteredOrders.map((order) => (
              <AdminCard key={order.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-brand-black">{order.productName}</p>
                    <p className="truncate text-sm text-gray-500">
                      {order.user.name} · {order.user.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.paymentMethod === "CREDITS" && `${order.creditsSpent} fichas`}
                      {order.paymentMethod === "POINTS" && `${order.pointsSpent} pontos`}
                      {order.paymentMethod === "MONEY" && `R$ ${Number(order.amountBrl ?? 0).toFixed(2)}`}
                    </p>
                  </div>
                  <AdminTag
                    tone={
                      order.status === "AWAITING_DELIVERY"
                        ? "black"
                        : order.status === "DELIVERED"
                          ? "green"
                          : order.status === "PENDING_PAYMENT"
                            ? "gray"
                            : "red"
                    }
                  >
                    {order.status}
                  </AdminTag>
                </div>
                {order.status === "AWAITING_DELIVERY" && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <AdminButton variant="primary" disabled={saving} onClick={() => deliverOrder(order)}>
                      Marcar entregue
                    </AdminButton>
                    <AdminButton variant="danger" disabled={saving} onClick={() => cancelOrderAsAdmin(order)}>
                      Cancelar
                    </AdminButton>
                  </div>
                )}
                {order.status === "PENDING_PAYMENT" && (
                  <div className="mt-3">
                    <AdminButton
                      variant="danger"
                      disabled={saving}
                      onClick={() => cancelOrderAsAdmin(order)}
                      className="w-full"
                    >
                      Cancelar
                    </AdminButton>
                  </div>
                )}
              </AdminCard>
            ))}
          </div>
        </section>
      )}

      {!loading && activeTab === "finance" && (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <AdminFormSection title="Setor financeiro" onSubmit={submitFinanceSettings}>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold uppercase text-gray-500">Banco usado no checkout</span>
              <select
                name="paymentProvider"
                className={inputClass}
                value={paymentProvider}
                onChange={(event) => setPaymentProvider(event.target.value as AdminSettings["paymentProvider"])}
              >
                <option value="MERCADO_PAGO">Mercado Pago</option>
                <option value="SANTANDER">Santander</option>
              </select>
            </label>

            {paymentProvider === "SANTANDER" && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-extrabold uppercase text-gray-500">Ambiente Santander</span>
                  <select
                    name="santanderEnvironment"
                    className={inputClass}
                    value={santanderEnvironment}
                    onChange={(event) => setSantanderEnvironment(event.target.value as AdminSettings["santanderEnvironment"])}
                  >
                    <option value="SANDBOX">Sandbox</option>
                    <option value="PRODUCTION">Producao</option>
                  </select>
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-extrabold uppercase text-gray-500">Client ID</span>
                    <input
                        className={inputClass}
                        name="santanderClientId"
                        value={santanderClientId}
                        onChange={(event) => setSantanderClientId(event.target.value)}
                        autoComplete="off"
                        required={!settings?.santanderClientIdSet}
                      placeholder={settings?.santanderClientIdSet ? "Ja cadastrado - preencha para trocar" : "Cole o Client ID"}
                    />
                    <span className="text-xs font-semibold text-gray-500">
                      Copie exatamente o Client ID do portal Santander. Nao use email/login.
                    </span>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-extrabold uppercase text-gray-500">Client Secret</span>
                    <input
                        className={inputClass}
                        name="santanderClientSecret"
                        type="password"
                        value={santanderClientSecret}
                        onChange={(event) => setSantanderClientSecret(event.target.value)}
                        autoComplete="new-password"
                        required={!settings?.santanderClientSecretSet}
                      placeholder={settings?.santanderClientSecretSet ? "Ja cadastrado - preencha para trocar" : "Cole o Client Secret"}
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-extrabold uppercase text-gray-500">Chave Pix recebedora</span>
                  <input
                    className={inputClass}
                    name="santanderPixKey"
                    value={santanderPixKey}
                    onChange={(event) => setSantanderPixKey(event.target.value)}
                    autoComplete="off"
                    required={!settings?.santanderPixKeySet}
                    placeholder={settings?.santanderPixKeySet ? "Ja cadastrada - preencha para trocar" : "CPF, CNPJ, email, telefone ou chave aleatoria"}
                  />
                  <span className="text-xs font-semibold text-gray-500">
                    Essa chave vem da conta Santander que vai receber o Pix, nao da tela de credenciais da API.
                  </span>
                </label>

                <details className="rounded-2xl border border-amber-100 bg-amber-50 p-3" open>
                  <summary className="cursor-pointer text-sm font-black text-amber-800">Certificado Santander para OAuth</summary>
                  <div className="mt-3 grid gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-extrabold uppercase text-gray-500">URL OAuth Santander</span>
                      <input
                        className={inputClass}
                        name="santanderBaseUrl"
                        type="url"
                        value={santanderBaseUrl}
                        onChange={(event) => setSantanderBaseUrl(event.target.value)}
                        placeholder="https://trust-sandbox.api.santander.com.br"
                      />
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-extrabold uppercase text-gray-500">URL Pix Santander</span>
                      <input
                        className={inputClass}
                        name="santanderPixBaseUrl"
                        type="url"
                        value={santanderPixBaseUrl}
                        onChange={(event) => setSantanderPixBaseUrl(event.target.value)}
                        placeholder="https://pix.santander.com.br/api/v1/sandbox"
                      />
                      <span className="text-xs font-semibold text-amber-800">
                        Sandbox Pix usa essa base e o sistema chama /cob/txid depois dela.
                      </span>
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-extrabold uppercase text-gray-500">Certificado PFX/P12</span>
                      <input
                        className={inputClass}
                        type="file"
                        accept=".pfx,.p12"
                        onChange={(event) => void readBinaryFileAsBase64(event.target.files?.[0], setSantanderPfxBase64)}
                      />
                      <input type="hidden" name="santanderPfxBase64" value={santanderPfxBase64} />
                      <input
                        className={inputClass}
                        name="santanderPfxPassphrase"
                        type="password"
                        value={santanderPfxPassphrase}
                        onChange={(event) => setSantanderPfxPassphrase(event.target.value)}
                        placeholder="Senha do PFX/P12, se tiver"
                        autoComplete="new-password"
                      />
                      <span className="text-xs font-semibold text-amber-800">
                        Use essa opcao se o arquivo que voce recebeu for .pfx ou .p12. Ela evita o erro DECODER unsupported.
                      </span>
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-extrabold uppercase text-gray-500">Certificado Santander PEM</span>
                      <input
                        className={inputClass}
                        type="file"
                        accept=".pem,.crt,.cer,.txt"
                        onChange={(event) => void readTextFile(event.target.files?.[0], setSantanderCertificatePem)}
                      />
                      <textarea
                        className={`${inputClass} min-h-28 resize-y`}
                        name="santanderCertificatePem"
                        value={santanderCertificatePem}
                        onChange={(event) => setSantanderCertificatePem(event.target.value)}
                        required={!settings?.santanderCertificatePemSet && !settings?.santanderPfxSet && !santanderPfxBase64}
                        placeholder={
                          settings?.santanderCertificatePemSet
                            ? "Certificado ja cadastrado - cole outro para trocar"
                            : "Cole somente se o certificado estiver em texto PEM"
                        }
                      />
                      <span className="text-xs font-semibold text-amber-800">
                        Selecione o arquivo do certificado que foi cadastrado no portal Santander. Sem ele a API retorna 403 Reference error.
                      </span>
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-extrabold uppercase text-gray-500">Chave privada PEM</span>
                      <input
                        className={inputClass}
                        type="file"
                        accept=".pem,.key,.txt"
                        onChange={(event) => void readTextFile(event.target.files?.[0], setSantanderPrivateKeyPem)}
                      />
                      <textarea
                        className={`${inputClass} min-h-28 resize-y`}
                        name="santanderPrivateKeyPem"
                        value={santanderPrivateKeyPem}
                        onChange={(event) => setSantanderPrivateKeyPem(event.target.value)}
                        placeholder={
                          settings?.santanderPrivateKeyPemSet
                            ? "Chave ja cadastrada - cole outra para trocar"
                            : "Cole a chave privada PEM, ou deixe vazio se o certificado acima ja vier com PRIVATE KEY"
                        }
                      />
                      <span className="text-xs font-semibold text-amber-800">
                        A chave privada nao aparece no portal. Ela fica no computador/empresa que gerou o certificado usado no cadastro.
                      </span>
                    </label>
                  </div>
                </details>
              </>
            )}

            <AdminButton type="submit" variant="primary" disabled={saving} className="w-full py-3">
              Salvar financeiro
            </AdminButton>
          </AdminFormSection>

          <AdminCard>
            <p className="text-xs font-black uppercase text-orange-600">Checkout ativo</p>
            <h3 className="mt-1 text-2xl font-black text-brand-black">
              {settings?.paymentProvider === "SANTANDER" ? "Santander" : "Mercado Pago"}
            </h3>
            {paymentProvider === "MERCADO_PAGO" ? (
              <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
                Mercado Pago usa as credenciais configuradas no Render. Nada precisa ser cadastrado aqui.
              </div>
            ) : (
              <>
                <div className="mt-4 grid gap-2 text-sm font-bold text-gray-600">
                  <p>Ambiente: {settings?.santanderEnvironment === "PRODUCTION" ? "Producao" : "Sandbox"}</p>
                  <p>Client ID: {settings?.santanderClientIdSet ? "Cadastrado" : "Nao cadastrado"}</p>
                  <p>Client Secret: {settings?.santanderClientSecretSet ? "Cadastrado" : "Nao cadastrado"}</p>
                  <p>Chave Pix: {settings?.santanderPixKeySet ? "Cadastrada" : "Nao cadastrada"}</p>
                  {settings?.santanderPfxSet && <p>Certificado PFX/P12: Cadastrado</p>}
                  {settings?.santanderCertificatePemSet && <p>Certificado: Cadastrado</p>}
                  {settings?.santanderPrivateKeyPemSet && <p>Chave privada: Cadastrada</p>}
                </div>
                <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">
                  Santander sera usado para Pix. Cartao continua pelo Mercado Pago.
                </div>
              </>
            )}
          </AdminCard>
        </section>
      )}

      {!loading && activeTab === "privacy" && (
        <section className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <AdminStatCard
              icon="LG"
              label="Abertas"
              value={String(privacyRequests.filter((request) => request.status === "OPEN").length)}
              tone="amber"
            />
            <AdminStatCard
              icon="..."
              label="Em analise"
              value={String(privacyRequests.filter((request) => request.status === "IN_REVIEW").length)}
              tone="blue"
            />
            <AdminStatCard
              icon="OK"
              label="Concluidas"
              value={String(privacyRequests.filter((request) => request.status === "COMPLETED").length)}
              tone="green"
            />
          </div>

          <AdminFormSection title="Solicitacoes LGPD">
            <p className="text-sm font-semibold text-gray-500">
              Pedidos de titulares sobre acesso, correcao, exclusao ou consentimento.
            </p>
            {privacyRequests.length === 0 && <AdminEmptyState icon="LG" message="Nenhuma solicitacao LGPD registrada." />}
            <div className="grid gap-3">
              {privacyRequests.map((request) => (
                <AdminCard key={request.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-brand-black">{privacyRequestTypeLabel[request.type]}</p>
                      <p className="truncate text-sm text-gray-500">
                        {request.user.name} · {request.user.email}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-gray-600">{request.message}</p>
                      <p className="mt-2 text-xs font-semibold text-gray-400">{formatDate(request.createdAt)}</p>
                    </div>
                    <AdminTag
                      tone={
                        request.status === "COMPLETED"
                          ? "green"
                          : request.status === "REJECTED"
                            ? "red"
                            : request.status === "IN_REVIEW"
                              ? "gray"
                              : "amber"
                      }
                    >
                      {privacyRequestStatusLabel[request.status]}
                    </AdminTag>
                  </div>
                  <form onSubmit={(event) => updatePrivacyRequest(event, request)} className="mt-3 grid gap-2">
                    <select name="status" className={inputClass} defaultValue={request.status}>
                      <option value="OPEN">Aberto</option>
                      <option value="IN_REVIEW">Em analise</option>
                      <option value="COMPLETED">Concluido</option>
                      <option value="REJECTED">Recusado</option>
                    </select>
                    <textarea
                      name="response"
                      className={`${inputClass} min-h-24`}
                      defaultValue={request.response ?? ""}
                      placeholder="Resposta ao titular ou anotacao de atendimento"
                    />
                    <AdminButton type="submit" variant="primary" disabled={saving}>
                      Salvar resposta
                    </AdminButton>
                  </form>
                </AdminCard>
              ))}
            </div>
          </AdminFormSection>
        </section>
      )}

      {!loading && activeTab === "reports" && (
        <section className="flex flex-col gap-4">
          <AdminCard className="border-amber-100 bg-white/90">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-black uppercase text-orange-600">Operacao</p>
                <h2 className="text-2xl font-black text-brand-black">Relatorios gerenciais</h2>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  Faturamento, fichas, jogadas, rankings de clientes, pacotes, lojas e maquinas.
                </p>
              </div>
              <div className="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                <input
                  className={filterInputClass}
                  type="date"
                  value={reportDateFrom}
                  onChange={(event) => setReportDateFrom(event.target.value)}
                />
                <input
                  className={filterInputClass}
                  type="date"
                  value={reportDateTo}
                  onChange={(event) => setReportDateTo(event.target.value)}
                />
                <select
                  className={filterInputClass}
                  value={reportStoreId}
                  onChange={(event) => {
                    setReportStoreId(event.target.value);
                    setReportMachineId("ALL");
                  }}
                >
                  <option value="ALL">Todas as lojas</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                <select
                  className={filterInputClass}
                  value={reportMachineId}
                  onChange={(event) => setReportMachineId(event.target.value)}
                >
                  <option value="ALL">Todas as maquinas</option>
                  {reportStoreMachines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name}
                    </option>
                  ))}
                </select>
                <select
                  className={filterInputClass}
                  value={reportTransactionStatus}
                  onChange={(event) => setReportTransactionStatus(event.target.value)}
                >
                  <option value="ALL">Compras: todas</option>
                  <option value="APPROVED">Compras aprovadas</option>
                  <option value="PENDING">Compras pendentes</option>
                  <option value="FAILED">Compras falhas</option>
                </select>
                <select
                  className={filterInputClass}
                  value={reportGameplayStatus}
                  onChange={(event) => setReportGameplayStatus(event.target.value)}
                >
                  <option value="ALL">Jogadas: todas</option>
                  <option value="SUCCESS">Jogadas sucesso</option>
                  <option value="FAILED">Jogadas falhas</option>
                </select>
                <AdminButton
                  type="button"
                  variant="primary"
                  disabled={reportsLoading}
                  onClick={loadOperationsReport}
                  className="h-11 w-full"
                >
                  {reportsLoading ? "Atualizando..." : "Atualizar"}
                </AdminButton>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <AdminButton type="button" variant="secondary" onClick={() => setReportQuickRange(1)}>
                  Hoje
                </AdminButton>
                <AdminButton type="button" variant="secondary" onClick={() => setReportQuickRange(7)}>
                  7 dias
                </AdminButton>
                <AdminButton type="button" variant="secondary" onClick={() => setReportQuickRange(30)}>
                  30 dias
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setReportStoreId("ALL");
                    setReportMachineId("ALL");
                    setReportTransactionStatus("ALL");
                    setReportGameplayStatus("ALL");
                  }}
                >
                  Limpar filtros
                </AdminButton>
              </div>
            </div>
          </AdminCard>

          {reportsLoading && !operationsReport && (
            <AdminCard>
              <p className="text-sm font-bold text-gray-500">Carregando relatorios...</p>
            </AdminCard>
          )}

          {operationsReport && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AdminStatCard
                  icon="💰"
                  label="Faturamento"
                  value={formatMoney(operationsReport.summary.revenueBrl)}
                  sublabel={`${operationsReport.summary.approvedPurchases} compras aprovadas`}
                  tone="amber"
                />
                <AdminStatCard
                  icon="🎟️"
                  label="Fichas vendidas"
                  value={String(operationsReport.summary.creditsSold)}
                  sublabel={`${operationsReport.summary.activeBuyers} compradores`}
                  tone="green"
                />
                <AdminStatCard
                  icon="🕹️"
                  label="Jogadas"
                  value={String(operationsReport.summary.totalGames)}
                  sublabel={`${operationsReport.summary.creditsUsed} fichas usadas`}
                  tone="blue"
                />
                <AdminStatCard
                  icon="🧾"
                  label="Ticket medio"
                  value={formatMoney(operationsReport.summary.averageTicketBrl)}
                  sublabel={`${operationsReport.summary.pendingPurchases} pendentes · ${operationsReport.summary.failedPurchases} falhas`}
                  tone="purple"
                />
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                <ReportDailyChart daily={operationsReport.series.daily} />
                <AdminCard>
                  <h3 className="text-base font-black text-brand-black">Saude da operacao</h3>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-amber-50 p-4">
                      <p className="text-xs font-black uppercase text-orange-700">Clientes ativos</p>
                      <p className="mt-1 text-3xl font-black text-brand-black">{operationsReport.summary.activePlayers}</p>
                      <p className="text-sm font-semibold text-gray-500">jogaram no periodo</p>
                    </div>
                    <div className="rounded-2xl bg-sky-50 p-4">
                      <p className="text-xs font-black uppercase text-sky-700">Media por jogada</p>
                      <p className="mt-1 text-3xl font-black text-brand-black">
                        {operationsReport.summary.averageCreditsPerGame.toFixed(1)}
                      </p>
                      <p className="text-sm font-semibold text-gray-500">fichas consumidas por jogada</p>
                    </div>
                    <div className="rounded-2xl bg-red-50 p-4">
                      <p className="text-xs font-black uppercase text-red-600">Falhas de jogo</p>
                      <p className="mt-1 text-3xl font-black text-brand-black">{operationsReport.summary.failedGames}</p>
                      <p className="text-sm font-semibold text-gray-500">logs com status de falha</p>
                    </div>
                  </div>
                </AdminCard>
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                <ReportRankingCard
                  title="Pacotes que mais saem"
                  items={operationsReport.rankings.packages}
                  metric="purchases"
                  metricLabel="compras"
                  emptyMessage="Nenhum pacote vendido no periodo."
                />
                <ReportRankingCard
                  title="Clientes que mais compram"
                  items={operationsReport.rankings.buyers}
                  metric="amountBrl"
                  metricLabel=""
                  emptyMessage="Nenhuma compra aprovada no periodo."
                />
                <ReportRankingCard
                  title="Clientes que mais jogam"
                  items={operationsReport.rankings.players}
                  metric="games"
                  metricLabel="jogadas"
                  emptyMessage="Nenhuma jogada no periodo."
                />
                <ReportRankingCard
                  title="Lojas com mais jogadas"
                  items={operationsReport.rankings.stores}
                  metric="games"
                  metricLabel="jogadas"
                  emptyMessage="Nenhuma loja com jogadas no periodo."
                />
                <ReportRankingCard
                  title="Maquinas com mais jogadas"
                  items={operationsReport.rankings.machines}
                  metric="games"
                  metricLabel="jogadas"
                  emptyMessage="Nenhuma maquina com jogadas no periodo."
                />
                <ReportRankingCard
                  title="Clientes por fichas compradas"
                  items={operationsReport.rankings.buyers}
                  metric="credits"
                  metricLabel="fichas"
                  emptyMessage="Nenhuma ficha vendida no periodo."
                />
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}




