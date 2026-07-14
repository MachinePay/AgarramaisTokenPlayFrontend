import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { apiRequest, ApiError } from "@/lib/api";
import type {
  AdminDashboardSummary,
  AdminGameplayLog,
  AdminMachine,
  AdminTransaction,
  AdminUser,
  Campaign,
  CompactPayMachine,
  CreditPackage,
  LoyaltyDistribution,
  LoyaltyLevel,
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
  | "machines";

type PackageForm = {
  name: string;
  amountBrl: string;
  baseCredits: string;
  bonusCredits: string;
  isPopular: boolean;
};

type LevelForm = {
  levelName: string;
  requiredCredits: string;
  bonusCreditsReward: string;
  status: "ACTIVE" | "DRAFT";
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
};

const inputClass =
  "rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-black outline-none transition-colors focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20";

const filterInputClass =
  "h-11 rounded-xl border border-amber-100 bg-white px-3 text-sm font-medium text-brand-black outline-none shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20";

type FilterableTab = Exclude<AdminTab, "summary">;
type AdminFilters = Record<FilterableTab, { search: string; status: string }>;

const defaultFilters: AdminFilters = {
  users: { search: "", status: "ALL" },
  transactions: { search: "", status: "ALL" },
  gameplay: { search: "", status: "ALL" },
  campaigns: { search: "", status: "ALL" },
  packages: { search: "", status: "ALL" },
  levels: { search: "", status: "ALL" },
  stores: { search: "", status: "ALL" },
  machines: { search: "", status: "ALL" },
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

function AdminFilterBar({
  search,
  status,
  total,
  filtered,
  searchPlaceholder,
  statusLabel = "Status",
  statusOptions,
  onSearchChange,
  onStatusChange,
  onClear,
}: {
  search: string;
  status: string;
  total: number;
  filtered: number;
  searchPlaceholder: string;
  statusLabel?: string;
  statusOptions: Array<{ value: string; label: string }>;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClear: () => void;
}) {
  const hasFilters = Boolean(search.trim()) || status !== "ALL";

  return (
    <div className="rounded-2xl border border-white/80 bg-white/85 p-3 shadow-sm backdrop-blur">
      <div className="grid gap-2 md:grid-cols-[1fr_220px_auto] md:items-center">
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

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("summary");
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loyaltyDistribution, setLoyaltyDistribution] = useState<LoyaltyDistribution | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [gameplayLogs, setGameplayLogs] = useState<AdminGameplayLog[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [levels, setLevels] = useState<LoyaltyLevel[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [machines, setMachines] = useState<AdminMachine[]>([]);
  const [compactPayMachines, setCompactPayMachines] = useState<CompactPayMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCompactPay, setLoadingCompactPay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminFilters>(defaultFilters);

  const [packageForm, setPackageForm] = useState<PackageForm>({
    name: "",
    amountBrl: "",
    baseCredits: "",
    bonusCredits: "0",
    isPopular: false,
  });
  const [levelForm, setLevelForm] = useState<LevelForm>({
    levelName: "",
    requiredCredits: "",
    bonusCreditsReward: "0",
    status: "ACTIVE",
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
  });

  const activeStores = useMemo(() => stores.filter((store) => store.status === "ACTIVE"), [stores]);

  const updateFilter = (tab: FilterableTab, field: "search" | "status", value: string) => {
    setFilters((current) => ({
      ...current,
      [tab]: { ...current[tab], [field]: value },
    }));
  };

  const clearFilter = (tab: FilterableTab) => {
    setFilters((current) => ({ ...current, [tab]: defaultFilters[tab] }));
  };

  const filteredUsers = useMemo(() => {
    const filter = filters.users;
    return users.filter((user) => {
      const statusMatches = filter.status === "ALL" || user.status === filter.status || user.role === filter.status;
      return statusMatches && matchesSearch(filter.search, [user.name, user.email, user.cpf, user.status, user.role]);
    });
  }, [filters.users, users]);

  const filteredTransactions = useMemo(() => {
    const filter = filters.transactions;
    return transactions.filter((transaction) => {
      const statusMatches = filter.status === "ALL" || transaction.status === filter.status;
      return (
        statusMatches &&
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

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        usersData,
        transactionsData,
        gameplayData,
        campaignsData,
        packagesData,
        levelsData,
        storesData,
        machinesData,
      ] = await Promise.all([
        apiRequest<AdminUser[]>("/admin/users"),
        apiRequest<AdminTransaction[]>("/admin/transactions"),
        apiRequest<AdminGameplayLog[]>("/admin/gameplay"),
        apiRequest<Campaign[]>("/admin/campaigns"),
        apiRequest<CreditPackage[]>("/admin/packages"),
        apiRequest<LoyaltyLevel[]>("/admin/levels"),
        apiRequest<Store[]>("/admin/stores"),
        apiRequest<AdminMachine[]>("/admin/machines"),
      ]);
      const [summaryData, distributionData] = await Promise.all([
        apiRequest<AdminDashboardSummary>("/admin/dashboard/summary"),
        apiRequest<LoyaltyDistribution>("/admin/dashboard/loyalty-distribution"),
      ]);

      setSummary(summaryData);
      setLoyaltyDistribution(distributionData);
      setUsers(usersData);
      setTransactions(transactionsData);
      setGameplayLogs(gameplayData);
      setCampaigns(campaignsData);
      setPackages(packagesData);
      setLevels(levelsData);
      setStores(storesData);
      setMachines(machinesData);

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
          isPopular: packageForm.isPopular,
          active: true,
        },
      });
      setPackageForm({ name: "", amountBrl: "", baseCredits: "", bonusCredits: "0", isPopular: false });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar o pacote");
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
          status: levelForm.status,
        },
      });
      setLevelForm({ levelName: "", requiredCredits: "", bonusCreditsReward: "0", status: "ACTIVE" });
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
        },
      });
      setCampaignForm({ name: "", startsAt: "", endsAt: "", notes: "" });
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
          isPopular: data.get("isPopular") === "on",
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

  async function loadCompactPayMachines() {
    setLoadingCompactPay(true);
    setError(null);
    try {
      const data = await apiRequest<CompactPayMachine[]>("/admin/compactpay/machines");
      setCompactPayMachines(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar maquinas da CompactPay");
    } finally {
      setLoadingCompactPay(false);
    }
  }

  async function processTransaction(transaction: AdminTransaction, action: "confirm" | "fail") {
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/admin/transactions/${transaction.id}/${action}`, { method: "POST" });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel processar a transacao");
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
    const data = new FormData(event.currentTarget);
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
      event.currentTarget.reset();
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
    const data = new FormData(event.currentTarget);
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
      event.currentTarget.reset();
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
            <span aria-hidden>{tab.icon}</span>
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
              icon="🕹️"
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
          <div className="sm:col-span-2 xl:col-span-3">
            <AdminFilterBar
              search={filters.users.search}
              status={filters.users.status}
              total={users.length}
              filtered={filteredUsers.length}
              searchPlaceholder="Buscar por nome, e-mail ou CPF"
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
                    Saldo {user.creditBalance} · Comprados {user.totalCreditsPurchased}
                  </p>
                  <p className="text-xs text-gray-500">CPF {user.cpf}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <AdminTag tone={user.role === "ADMIN" ? "black" : "gray"}>{user.role}</AdminTag>
                  <AdminTag tone={user.status === "ACTIVE" ? "green" : "red"}>{user.status}</AdminTag>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <AdminButton
                  variant={user.status === "ACTIVE" ? "danger" : "secondary"}
                  disabled={saving}
                  onClick={() => updateUser(user, { status: user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE" })}
                >
                  {user.status === "ACTIVE" ? "Bloquear" : "Desbloquear"}
                </AdminButton>
                <AdminButton
                  variant="primary"
                  disabled={saving}
                  onClick={() => updateUser(user, { role: user.role === "ADMIN" ? "CUSTOMER" : "ADMIN" })}
                >
                  {user.role === "ADMIN" ? "Rebaixar" : "Promover"}
                </AdminButton>
              </div>
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
                    {Number(transaction.amountBrl).toFixed(2)} · {transaction.creditsAwarded} créditos
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
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <AdminButton
                    variant="primary"
                    disabled={saving}
                    onClick={() => processTransaction(transaction, "confirm")}
                  >
                    Confirmar
                  </AdminButton>
                  <AdminButton
                    variant="danger"
                    disabled={saving}
                    onClick={() => processTransaction(transaction, "fail")}
                  >
                    Marcar falha
                  </AdminButton>
                </div>
              )}
            </AdminCard>
          ))}
        </section>
      )}

      {!loading && activeTab === "gameplay" && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="sm:col-span-2 xl:col-span-3">
            <AdminFilterBar
              search={filters.gameplay.search}
              status={filters.gameplay.status}
              total={gameplayLogs.length}
              filtered={filteredGameplayLogs.length}
              searchPlaceholder="Buscar por usuário, máquina, loja ou telemetryId"
              statusOptions={[
                { value: "ALL", label: "Todas" },
                { value: "SUCCESS", label: "Sucesso" },
                { value: "FAILED", label: "Falhas" },
              ]}
              onSearchChange={(value) => updateFilter("gameplay", "search", value)}
              onStatusChange={(value) => updateFilter("gameplay", "status", value)}
              onClear={() => clearFilter("gameplay")}
            />
          </div>
          {gameplayLogs.length === 0 && (
            <AdminEmptyState icon="🕹️" message="Nenhuma jogada encontrada." />
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
                    {log.creditsDebited} créditos · {log.pulsesSent} pulsos
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
                    placeholder="Créditos"
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
                      {override.baseCredits + override.bonusCredits} créditos
                    </p>
                  ))}
                  {campaign.machineOverrides.map((override) => (
                    <p key={override.id}>
                      Máquina: {override.machine.name} · {override.costPerGame} crédito/jogada ·{" "}
                      {override.pulsesPerCredit} pulsos/crédito
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
          <AdminFormSection title="Criar pacote de créditos" onSubmit={submitPackage}>
            <input
              className={inputClass}
              required
              placeholder="Nome do pacote"
              value={packageForm.name}
              onChange={(event) => setPackageForm({ ...packageForm, name: event.target.value })}
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                className={inputClass}
                required
                inputMode="decimal"
                placeholder="R$"
                value={packageForm.amountBrl}
                onChange={(event) => setPackageForm({ ...packageForm, amountBrl: event.target.value })}
              />
              <input
                className={inputClass}
                required
                inputMode="numeric"
                placeholder="Créditos"
                value={packageForm.baseCredits}
                onChange={(event) => setPackageForm({ ...packageForm, baseCredits: event.target.value })}
              />
              <input
                className={inputClass}
                inputMode="numeric"
                placeholder="Bônus"
                value={packageForm.bonusCredits}
                onChange={(event) => setPackageForm({ ...packageForm, bonusCredits: event.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-brand-black">
              <input
                type="checkbox"
                checked={packageForm.isPopular}
                onChange={(event) => setPackageForm({ ...packageForm, isPopular: event.target.checked })}
              />
              Mais popular
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
            searchPlaceholder="Buscar por nome, valor, créditos ou bônus"
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
                      {creditPackage.baseCredits + creditPackage.bonusCredits} créditos
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
                  <div className="grid grid-cols-3 gap-2">
                    <input name="amountBrl" className={inputClass} inputMode="decimal" defaultValue={String(creditPackage.amountBrl)} />
                    <input name="baseCredits" className={inputClass} inputMode="numeric" defaultValue={creditPackage.baseCredits} />
                    <input name="bonusCredits" className={inputClass} inputMode="numeric" defaultValue={creditPackage.bonusCredits} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-brand-black">
                      <input name="isPopular" type="checkbox" defaultChecked={creditPackage.isPopular} />
                      Popular
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
                placeholder="Créditos requeridos"
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
            searchPlaceholder="Buscar por nível, créditos requeridos ou bônus"
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
                      {level.requiredCredits} créditos · +{level.bonusCreditsReward} bônus
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
                    <select name="status" className={inputClass} defaultValue={level.status}>
                      <option value="ACTIVE">Ativo</option>
                      <option value="DRAFT">Rascunho</option>
                    </select>
                  </div>
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
          <AdminCard className="flex flex-col gap-3">
            <AdminButton
              variant="secondary"
              onClick={loadCompactPayMachines}
              disabled={loadingCompactPay}
              className="w-full py-3"
            >
              {loadingCompactPay ? "Consultando CompactPay..." : "Carregar máquinas da CompactPay"}
            </AdminButton>

            {compactPayMachines.length > 0 && (
              <div className="rounded-xl bg-surface-soft p-3">
                <p className="text-sm font-bold text-brand-black">IDs disponíveis</p>
                <div className="mt-2 flex flex-col gap-2">
                  {compactPayMachines.map((machine) => (
                    <button
                      key={machine.telemetryId}
                      type="button"
                      onClick={() =>
                        setMachineForm((current) => ({
                          ...current,
                          telemetryId: machine.telemetryId,
                          name: current.name || machine.name || machine.telemetryId,
                        }))
                      }
                      className="rounded-lg bg-white px-3 py-2 text-left text-xs text-brand-black shadow-sm transition-transform active:scale-[0.98]"
                    >
                      <span className="font-bold">{machine.telemetryId}</span>
                      <span className="text-gray-500">
                        {" "}
                        · {machine.name || "Sem nome"} · {machine.online ? "online" : "offline"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </AdminCard>

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
                placeholder="Pulsos por crédito"
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
                  {machine.costPerGame} crédito/jogada · {machine.pulsesPerCredit} pulsos/crédito
                </p>
                <div className="mt-2 rounded-lg bg-surface-soft p-2 text-xs text-gray-500">
                  <p className="break-all">QR máquina: {getQrUrl(`/qr/maquina/${machine.id}`)}</p>
                  <p className="break-all">QR loja: {getQrUrl(`/qr/loja/${machine.store.id}`)}</p>
                </div>
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
    </div>
  );
}
