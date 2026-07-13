import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiError } from "@/lib/api";

export function EntrarPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (token) {
    return <Navigate to="/lojas" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate("/lojas");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel entrar");
    }
  }

  return (
    <div className="app-viewport flex flex-col justify-center px-6">
      <h1 className="mb-1 text-2xl font-bold text-brand-black">Agarra Mais</h1>
      <p className="mb-8 text-sm text-gray-500">Entre para ver suas fichas e jogar.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-brand-black">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-xl border border-gray-200 bg-surface-soft px-4 py-3 text-base outline-none focus:border-brand-yellow"
            placeholder="voce@email.com"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-brand-black">
          Senha
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-xl border border-gray-200 bg-surface-soft px-4 py-3 text-base outline-none focus:border-brand-yellow"
            placeholder="••••••••"
          />
        </label>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-xl bg-brand-yellow py-3.5 text-base font-bold text-brand-black transition-opacity disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
