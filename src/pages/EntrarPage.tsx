import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiError } from "@/lib/api";

export function EntrarPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isRegisterMode = mode === "register";

  if (token) {
    return <Navigate to="/lojas" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (isRegisterMode) {
        await register({ name, email, cpf, password });
      } else {
        await login(email, password);
      }
      navigate("/lojas");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : isRegisterMode
            ? "Nao foi possivel criar o cadastro"
            : "Nao foi possivel entrar",
      );
    }
  }

  return (
    <div className="app-viewport flex flex-col justify-center px-6">
      <h1 className="mb-1 text-2xl font-bold text-brand-black">Agarra Mais</h1>
      <p className="mb-6 text-sm text-gray-500">
        {isRegisterMode ? "Crie sua conta para comprar fichas e jogar." : "Entre para ver suas fichas e jogar."}
      </p>

      <div className="mb-6 grid grid-cols-2 rounded-xl bg-surface-soft p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
          }}
          className={`rounded-lg py-2 text-sm font-bold transition ${
            !isRegisterMode ? "bg-white text-brand-black shadow-sm" : "text-gray-500"
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setError(null);
          }}
          className={`rounded-lg py-2 text-sm font-bold transition ${
            isRegisterMode ? "bg-white text-brand-black shadow-sm" : "text-gray-500"
          }`}
        >
          Criar cadastro
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isRegisterMode && (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-brand-black">
            Nome
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-xl border border-gray-200 bg-surface-soft px-4 py-3 text-base outline-none focus:border-brand-yellow"
              placeholder="Seu nome"
            />
          </label>
        )}

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

        {isRegisterMode && (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-brand-black">
            CPF
            <input
              type="text"
              required
              minLength={11}
              maxLength={14}
              inputMode="numeric"
              value={cpf}
              onChange={(event) => setCpf(event.target.value)}
              className="rounded-xl border border-gray-200 bg-surface-soft px-4 py-3 text-base outline-none focus:border-brand-yellow"
              placeholder="000.000.000-00"
            />
          </label>
        )}

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
          {loading ? (isRegisterMode ? "Criando..." : "Entrando...") : isRegisterMode ? "Criar cadastro" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
