import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { EntrarPage } from "@/pages/EntrarPage";
import { LojasPage } from "@/pages/LojasPage";
import { VitrinePage } from "@/pages/VitrinePage";
import { CreditosPage } from "@/pages/CreditosPage";

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
    </Routes>
  );
}

export default App;
