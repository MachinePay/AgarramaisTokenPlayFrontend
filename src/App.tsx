import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { EntrarPage } from "@/pages/EntrarPage";
import { LojasPage } from "@/pages/LojasPage";
import { VitrinePage } from "@/pages/VitrinePage";
import { CreditosPage } from "@/pages/CreditosPage";
import { CheckoutRetornoPage } from "@/pages/CheckoutRetornoPage";
import { AdminPage } from "@/pages/AdminPage";
import { HistoricoPage } from "@/pages/HistoricoPage";
import { QrLojaPage } from "@/pages/QrLojaPage";
import { QrMaquinaPage } from "@/pages/QrMaquinaPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/lojas" replace />} />
      <Route path="/entrar" element={<EntrarPage />} />

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
        path="/creditos"
        element={
          <RequireAuth>
            <CreditosPage />
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
          <RequireAuth>
            <AdminPage />
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
