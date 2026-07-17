import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { EntrarPage } from "@/pages/EntrarPage";
import { LandingPage } from "@/pages/LandingPage";
import { InicioPage } from "@/pages/InicioPage";
import { LojasPage } from "@/pages/LojasPage";
import { VitrinePage } from "@/pages/VitrinePage";
import { FichasPage } from "@/pages/FichasPage";
import { LojaProdutosPage } from "@/pages/LojaProdutosPage";
import { MeusPedidosPage } from "@/pages/MeusPedidosPage";
import { CheckoutRetornoPage } from "@/pages/CheckoutRetornoPage";
import { AdminPage } from "@/pages/AdminPage";
import { HistoricoPage } from "@/pages/HistoricoPage";
import { QrLojaPage } from "@/pages/QrLojaPage";
import { QrMaquinaPage } from "@/pages/QrMaquinaPage";
import { PrivacidadePage } from "@/pages/PrivacidadePage";
import { TermosPage } from "@/pages/TermosPage";
import { MinhaPrivacidadePage } from "@/pages/MinhaPrivacidadePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/entrar" element={<EntrarPage />} />
      <Route path="/privacidade" element={<PrivacidadePage />} />
      <Route path="/termos" element={<TermosPage />} />

      <Route
        path="/inicio"
        element={
          <RequireAuth>
            <InicioPage />
          </RequireAuth>
        }
      />

      <Route
        path="/lojas"
        element={
          <RequireAuth>
            <LojasPage />
          </RequireAuth>
        }
      />
      <Route
        path="/lojas/:storeId"
        element={
          <RequireAuth>
            <VitrinePage />
          </RequireAuth>
        }
      />
      <Route
        path="/fichas"
        element={
          <RequireAuth>
            <FichasPage />
          </RequireAuth>
        }
      />
      <Route path="/creditos" element={<Navigate to="/fichas" replace />} />
      <Route
        path="/loja"
        element={
          <RequireAuth>
            <LojaProdutosPage />
          </RequireAuth>
        }
      />
      <Route
        path="/meus-pedidos"
        element={
          <RequireAuth>
            <MeusPedidosPage />
          </RequireAuth>
        }
      />
      <Route
        path="/historico"
        element={
          <RequireAuth>
            <HistoricoPage />
          </RequireAuth>
        }
      />
      <Route
        path="/minha-privacidade"
        element={
          <RequireAuth>
            <MinhaPrivacidadePage />
          </RequireAuth>
        }
      />
      <Route
        path="/checkout/sucesso"
        element={
          <RequireAuth>
            <CheckoutRetornoPage expectedStatus="success" />
          </RequireAuth>
        }
      />
      <Route
        path="/checkout/pendente"
        element={
          <RequireAuth>
            <CheckoutRetornoPage expectedStatus="pending" />
          </RequireAuth>
        }
      />
      <Route
        path="/checkout/falha"
        element={
          <RequireAuth>
            <CheckoutRetornoPage expectedStatus="failure" />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth wide>
            <AdminPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/relatorios"
        element={
          <RequireAuth wide>
            <AdminPage initialTab="reports" />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/pedidos"
        element={
          <RequireAuth wide>
            <AdminPage initialTab="orders" />
          </RequireAuth>
        }
      />
      <Route
        path="/qr/loja/:storeId"
        element={
          <RequireAuth>
            <QrLojaPage />
          </RequireAuth>
        }
      />
      <Route
        path="/qr/maquina/:machineId"
        element={
          <RequireAuth>
            <QrMaquinaPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;
