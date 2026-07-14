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
  "rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-yellow";

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: "summary", label: "Resumo" },
  { id: "users", label: "Usuarios" },
  { id: "transactions", label: "Transacoes" },
  { id: "gameplay", label: "Jogadas" },
  { id: "campaigns", label: "Campanhas" },
  { id: "packages", label: "Pacotes" },
  { id: "levels", label: "Niveis" },
  { id: "stores", label: "Lojas" },
  { id: "machines", label: "Maquinas" },
];

function toNumber(value: string): number {
  return Number(value.replace(",", "."));
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
    <div className="flex flex-col gap-5 px-4 py-5">
      <div>
        <h1 className="text-xl font-bold text-brand-black">Admin</h1>
        <p className="text-sm text-gray-500">Configuracao da operacao digital.</p>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold ${
              activeTab === tab.id ? "bg-brand-yellow text-brand-black" : "bg-surface-soft text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}
      {loading && <p className="py-8 text-center text-sm text-gray-500">Carregando admin...</p>}

      {!loading && activeTab === "summary" && summary && (
        <section className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-soft p-3">
              <p className="text-xs font-medium text-gray-500">Faturamento</p>
              <p className="mt-1 text-xl font-extrabold text-brand-black">R$ {summary.totalRevenueBrl}</p>
            </div>
            <div className="rounded-xl bg-surface-soft p-3">
              <p className="text-xs font-medium text-gray-500">Ticket medio</p>
              <p className="mt-1 text-xl font-extrabold text-brand-black">R$ {summary.averageTicketBrl}</p>
            </div>
            <div className="rounded-xl bg-surface-soft p-3">
              <p className="text-xs font-medium text-gray-500">Usuarios</p>
              <p className="mt-1 text-xl font-extrabold text-brand-black">{summary.totalUsers}</p>
            </div>
            <div className="rounded-xl bg-surface-soft p-3">
              <p className="text-xs font-medium text-gray-500">Jogadas</p>
              <p className="mt-1 text-xl font-extrabold text-brand-black">{summary.successfulGameplay}/{summary.totalGameplay}</p>
            </div>
            <div className="rounded-xl bg-surface-soft p-3">
              <p className="text-xs font-medium text-gray-500">Pagamentos</p>
              <p className="mt-1 text-xl font-extrabold text-brand-black">{summary.approvedTransactions}</p>
              <p className="text-xs text-gray-500">{summary.pendingTransactions} pendentes</p>
            </div>
            <div className="rounded-xl bg-surface-soft p-3">
              <p className="text-xs font-medium text-gray-500">Operacao</p>
              <p className="mt-1 text-xl font-extrabold text-brand-black">{summary.activeMachines} online</p>
              <p className="text-xs text-gray-500">{summary.unavailableMachines} indisponiveis</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-3">
            <h2 className="text-base font-bold text-brand-black">Distribuicao por nivel</h2>
            <div className="mt-3 flex flex-col gap-3">
              {loyaltyDistribution?.distribution.map((entry) => (
                <div key={entry.levelName}>
                  <div className="mb-1 flex justify-between text-xs font-medium text-gray-500">
                    <span>{entry.levelName}</span>
                    <span>{entry.userCount} usuarios - {entry.percentage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-soft">
                    <div className="h-full rounded-full bg-brand-yellow" style={{ width: `${entry.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!loading && activeTab === "users" && (
        <section className="flex flex-col gap-3">
          {users.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">Nenhum usuario encontrado.</p>
          )}

          {users.map((user) => (
            <div key={user.id} className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-brand-black">{user.name}</p>
                  <p className="truncate text-sm text-gray-500">{user.email}</p>
                  <p className="text-sm text-gray-500">
                    Saldo {user.creditBalance} - Comprados {user.totalCreditsPurchased}
                  </p>
                  <p className="text-xs text-gray-500">CPF {user.cpf}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="rounded-lg bg-surface-soft px-2 py-1 text-xs font-bold text-brand-black">
                    {user.role}
                  </span>
                  <span className="rounded-lg bg-surface-soft px-2 py-1 text-xs font-bold text-brand-black">
                    {user.status}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => updateUser(user, { status: user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE" })}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-brand-black disabled:opacity-60"
                >
                  {user.status === "ACTIVE" ? "Bloquear" : "Desbloquear"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => updateUser(user, { role: user.role === "ADMIN" ? "CUSTOMER" : "ADMIN" })}
                  className="rounded-lg bg-brand-yellow px-3 py-2 text-xs font-bold text-brand-black disabled:opacity-60"
                >
                  {user.role === "ADMIN" ? "Rebaixar" : "Promover"}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {!loading && activeTab === "transactions" && (
        <section className="flex flex-col gap-3">
          {transactions.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">Nenhuma transacao encontrada.</p>
          )}

          {transactions.map((transaction) => (
            <div key={transaction.id} className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-brand-black">{transaction.user.name}</p>
                  <p className="truncate text-sm text-gray-500">{transaction.user.email}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {transaction.package?.name ?? "Pacote removido"} - R$ {Number(transaction.amountBrl).toFixed(2)} - {transaction.creditsAwarded} creditos
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-surface-soft px-2 py-1 text-xs font-bold text-brand-black">
                  {transaction.status}
                </span>
              </div>

              {transaction.status === "PENDING" && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => processTransaction(transaction, "confirm")}
                    className="rounded-lg bg-brand-yellow px-3 py-2 text-xs font-bold text-brand-black disabled:opacity-60"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => processTransaction(transaction, "fail")}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-brand-black disabled:opacity-60"
                  >
                    Marcar falha
                  </button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {!loading && activeTab === "gameplay" && (
        <section className="flex flex-col gap-3">
          {gameplayLogs.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">Nenhuma jogada encontrada.</p>
          )}

          {gameplayLogs.map((log) => (
            <div key={log.id} className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-brand-black">{log.machine.name}</p>
                  <p className="truncate text-sm text-gray-500">
                    {log.machine.store.name} - {log.machine.telemetryId}
                  </p>
                  <p className="truncate text-sm text-gray-500">
                    {log.user.name} - {log.user.email}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {log.creditsDebited} creditos - {log.pulsesSent} pulsos
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(log.createdAt)}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-surface-soft px-2 py-1 text-xs font-bold text-brand-black">
                  {log.status}
                </span>
              </div>
            </div>
          ))}
        </section>
      )}

      {!loading && activeTab === "campaigns" && (
        <section className="flex flex-col gap-4">
          <form onSubmit={submitCampaign} className="grid gap-3 rounded-xl bg-surface-soft p-3">
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
              placeholder="Observacoes"
              value={campaignForm.notes}
              onChange={(event) => setCampaignForm({ ...campaignForm, notes: event.target.value })}
            />
            <button disabled={saving} className="rounded-xl bg-brand-yellow py-3 text-sm font-bold text-brand-black disabled:opacity-60">
              Criar campanha
            </button>
          </form>

          {campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-brand-black">{campaign.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(campaign.startsAt)} ate {formatDate(campaign.endsAt)}
                  </p>
                  {campaign.notes && <p className="mt-1 text-sm text-gray-500">{campaign.notes}</p>}
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => toggleCampaign(campaign)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-brand-black disabled:opacity-60"
                >
                  {campaign.active ? "Ativa" : "Inativa"}
                </button>
              </div>

              <form onSubmit={(event) => submitCampaignPackageOverride(event, campaign)} className="mt-4 grid gap-2 rounded-xl bg-surface-soft p-3">
                <p className="text-sm font-bold text-brand-black">Override de pacote</p>
                <select name="packageId" className={inputClass} required>
                  {packages.map((creditPackage) => (
                    <option key={creditPackage.id} value={creditPackage.id}>{creditPackage.name}</option>
                  ))}
                </select>
                <div className="grid grid-cols-3 gap-2">
                  <input name="amountBrl" className={inputClass} inputMode="decimal" placeholder="R$" required />
                  <input name="baseCredits" className={inputClass} inputMode="numeric" placeholder="Creditos" required />
                  <input name="bonusCredits" className={inputClass} inputMode="numeric" placeholder="Bonus" defaultValue="0" />
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
                <button disabled={saving} className="rounded-lg bg-brand-yellow px-3 py-2 text-xs font-bold text-brand-black disabled:opacity-60">
                  Salvar pacote da campanha
                </button>
              </form>

              <form onSubmit={(event) => submitCampaignMachineOverride(event, campaign)} className="mt-3 grid gap-2 rounded-xl bg-surface-soft p-3">
                <p className="text-sm font-bold text-brand-black">Override de maquina</p>
                <select name="machineId" className={inputClass} required>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>{machine.name}</option>
                  ))}
                </select>
                <div className="grid grid-cols-3 gap-2">
                  <input name="costPerGame" className={inputClass} inputMode="numeric" placeholder="Custo" required />
                  <input name="pulsesPerCredit" className={inputClass} inputMode="numeric" placeholder="Pulsos" required />
                  <select name="status" className={inputClass} defaultValue="">
                    <option value="">Status atual</option>
                    <option value="AVAILABLE">Disponivel</option>
                    <option value="BUSY">Ocupada</option>
                    <option value="MAINTENANCE">Manutencao</option>
                  </select>
                </div>
                <button disabled={saving} className="rounded-lg bg-brand-yellow px-3 py-2 text-xs font-bold text-brand-black disabled:opacity-60">
                  Salvar maquina da campanha
                </button>
              </form>

              {(campaign.packageOverrides.length > 0 || campaign.machineOverrides.length > 0) && (
                <div className="mt-3 flex flex-col gap-2 text-xs text-gray-500">
                  {campaign.packageOverrides.map((override) => (
                    <p key={override.id}>
                      Pacote: {override.package.name} - R$ {Number(override.amountBrl).toFixed(2)} - {override.baseCredits + override.bonusCredits} creditos
                    </p>
                  ))}
                  {campaign.machineOverrides.map((override) => (
                    <p key={override.id}>
                      Maquina: {override.machine.name} - {override.costPerGame} credito/jogada - {override.pulsesPerCredit} pulsos/credito
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {!loading && activeTab === "packages" && (
        <section className="flex flex-col gap-4">
          <form onSubmit={submitPackage} className="grid gap-3 rounded-xl bg-surface-soft p-3">
            <input className={inputClass} required placeholder="Nome do pacote" value={packageForm.name} onChange={(event) => setPackageForm({ ...packageForm, name: event.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <input className={inputClass} required inputMode="decimal" placeholder="R$" value={packageForm.amountBrl} onChange={(event) => setPackageForm({ ...packageForm, amountBrl: event.target.value })} />
              <input className={inputClass} required inputMode="numeric" placeholder="Creditos" value={packageForm.baseCredits} onChange={(event) => setPackageForm({ ...packageForm, baseCredits: event.target.value })} />
              <input className={inputClass} inputMode="numeric" placeholder="Bonus" value={packageForm.bonusCredits} onChange={(event) => setPackageForm({ ...packageForm, bonusCredits: event.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-brand-black">
              <input type="checkbox" checked={packageForm.isPopular} onChange={(event) => setPackageForm({ ...packageForm, isPopular: event.target.checked })} />
              Mais popular
            </label>
            <button disabled={saving} className="rounded-xl bg-brand-yellow py-3 text-sm font-bold text-brand-black disabled:opacity-60">Criar pacote</button>
          </form>

          {packages.map((creditPackage) => (
            <div key={creditPackage.id} className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-brand-black">{creditPackage.name}</p>
                  <p className="text-sm text-gray-500">
                    R$ {Number(creditPackage.amountBrl).toFixed(2)} - {creditPackage.baseCredits + creditPackage.bonusCredits} creditos
                  </p>
                </div>
                <button type="button" onClick={() => togglePackage(creditPackage)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-brand-black">
                  {creditPackage.active ? "Ativo" : "Inativo"}
                </button>
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
                  <button type="submit" disabled={saving} className="rounded-lg bg-brand-yellow px-3 py-2 text-xs font-bold text-brand-black disabled:opacity-60">
                    Salvar campanha
                  </button>
                </div>
              </form>
            </div>
          ))}
        </section>
      )}

      {!loading && activeTab === "levels" && (
        <section className="flex flex-col gap-4">
          <form onSubmit={submitLevel} className="grid gap-3 rounded-xl bg-surface-soft p-3">
            <input className={inputClass} required placeholder="Nome do nivel" value={levelForm.levelName} onChange={(event) => setLevelForm({ ...levelForm, levelName: event.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className={inputClass} required inputMode="numeric" placeholder="Creditos requeridos" value={levelForm.requiredCredits} onChange={(event) => setLevelForm({ ...levelForm, requiredCredits: event.target.value })} />
              <input className={inputClass} inputMode="numeric" placeholder="Bonus" value={levelForm.bonusCreditsReward} onChange={(event) => setLevelForm({ ...levelForm, bonusCreditsReward: event.target.value })} />
            </div>
            <select className={inputClass} value={levelForm.status} onChange={(event) => setLevelForm({ ...levelForm, status: event.target.value as LevelForm["status"] })}>
              <option value="ACTIVE">Ativo</option>
              <option value="DRAFT">Rascunho</option>
            </select>
            <button disabled={saving} className="rounded-xl bg-brand-yellow py-3 text-sm font-bold text-brand-black disabled:opacity-60">Criar nivel</button>
          </form>

          {levels.map((level) => (
            <div key={level.id} className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-brand-black">{level.levelName}</p>
                  <p className="text-sm text-gray-500">{level.requiredCredits} creditos - +{level.bonusCreditsReward} bonus</p>
                </div>
                <button type="button" onClick={() => toggleLevel(level)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-brand-black">
                  {level.status === "ACTIVE" ? "Ativo" : "Rascunho"}
                </button>
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
                <button type="submit" disabled={saving} className="rounded-lg bg-brand-yellow px-3 py-2 text-xs font-bold text-brand-black disabled:opacity-60">
                  Salvar nivel
                </button>
              </form>
            </div>
          ))}
        </section>
      )}

      {!loading && activeTab === "stores" && (
        <section className="flex flex-col gap-4">
          <form onSubmit={submitStore} className="grid gap-3 rounded-xl bg-surface-soft p-3">
            <input className={inputClass} required placeholder="Nome da loja" value={storeForm.name} onChange={(event) => setStoreForm({ ...storeForm, name: event.target.value })} />
            <input className={inputClass} required placeholder="Localizacao" value={storeForm.location} onChange={(event) => setStoreForm({ ...storeForm, location: event.target.value })} />
            <button disabled={saving} className="rounded-xl bg-brand-yellow py-3 text-sm font-bold text-brand-black disabled:opacity-60">Criar loja</button>
          </form>

          {stores.map((store) => (
            <div key={store.id} className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-brand-black">{store.name}</p>
                  <p className="text-sm text-gray-500">{store.location}</p>
                </div>
                <button type="button" onClick={() => toggleStore(store)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-brand-black">
                  {store.status === "ACTIVE" ? "Ativa" : "Inativa"}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {!loading && activeTab === "machines" && (
        <section className="flex flex-col gap-4">
          <button
            type="button"
            onClick={loadCompactPayMachines}
            disabled={loadingCompactPay}
            className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold text-brand-black disabled:opacity-60"
          >
            {loadingCompactPay ? "Consultando CompactPay..." : "Carregar maquinas da CompactPay"}
          </button>

          {compactPayMachines.length > 0 && (
            <div className="rounded-xl bg-surface-soft p-3">
              <p className="text-sm font-bold text-brand-black">IDs disponiveis</p>
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
                    className="rounded-lg bg-white px-3 py-2 text-left text-xs text-brand-black"
                  >
                    <span className="font-bold">{machine.telemetryId}</span>
                    <span className="text-gray-500"> - {machine.name || "Sem nome"} - {machine.online ? "online" : "offline"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={submitMachine} className="grid gap-3 rounded-xl bg-surface-soft p-3">
            <select className={inputClass} required value={machineForm.storeId} onChange={(event) => setMachineForm({ ...machineForm, storeId: event.target.value })}>
              {activeStores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select>
            <input className={inputClass} required placeholder="Nome da maquina" value={machineForm.name} onChange={(event) => setMachineForm({ ...machineForm, name: event.target.value })} />
            <input className={inputClass} required placeholder="ID CompactPay / telemetryId" value={machineForm.telemetryId} onChange={(event) => setMachineForm({ ...machineForm, telemetryId: event.target.value })} />
            <input className={inputClass} placeholder="URL da imagem" value={machineForm.imageUrl} onChange={(event) => setMachineForm({ ...machineForm, imageUrl: event.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className={inputClass} required inputMode="numeric" placeholder="Custo" value={machineForm.costPerGame} onChange={(event) => setMachineForm({ ...machineForm, costPerGame: event.target.value })} />
              <input className={inputClass} required inputMode="numeric" placeholder="Pulsos por credito" value={machineForm.pulsesPerCredit} onChange={(event) => setMachineForm({ ...machineForm, pulsesPerCredit: event.target.value })} />
            </div>
            <button disabled={saving || activeStores.length === 0} className="rounded-xl bg-brand-yellow py-3 text-sm font-bold text-brand-black disabled:opacity-60">Criar maquina</button>
          </form>

          {machines.map((machine) => (
            <div key={machine.id} className="rounded-xl border border-gray-200 p-3">
              <p className="font-bold text-brand-black">{machine.name}</p>
              <p className="text-sm text-gray-500">{machine.store.name} - {machine.telemetryId}</p>
              <p className="text-sm text-gray-500">{machine.costPerGame} credito/jogada - {machine.pulsesPerCredit} pulsos/credito</p>
              <div className="mt-2 rounded-lg bg-surface-soft p-2 text-xs text-gray-500">
                <p className="break-all">QR maquina: {getQrUrl(`/qr/maquina/${machine.id}`)}</p>
                <p className="break-all">QR loja: {getQrUrl(`/qr/loja/${machine.store.id}`)}</p>
              </div>
              <form onSubmit={(event) => updateMachineRules(event, machine)} className="mt-3 grid gap-2">
                <input name="name" className={inputClass} defaultValue={machine.name} />
                <input name="imageUrl" className={inputClass} defaultValue={machine.imageUrl ?? ""} placeholder="URL da imagem" />
                <div className="grid grid-cols-3 gap-2">
                  <input name="costPerGame" className={inputClass} inputMode="numeric" defaultValue={machine.costPerGame} />
                  <input name="pulsesPerCredit" className={inputClass} inputMode="numeric" defaultValue={machine.pulsesPerCredit} />
                  <select name="status" className={inputClass} defaultValue={machine.status}>
                    <option value="AVAILABLE">Disponivel</option>
                    <option value="BUSY">Ocupada</option>
                    <option value="MAINTENANCE">Manutencao</option>
                  </select>
                </div>
                <button type="submit" disabled={saving} className="rounded-lg bg-brand-yellow px-3 py-2 text-xs font-bold text-brand-black disabled:opacity-60">
                  Salvar regras
                </button>
              </form>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
