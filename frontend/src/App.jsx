import {
  BrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import {
  FaBullhorn,
  FaCalendarPlus,
  FaChartLine,
  FaLayerGroup,
} from "react-icons/fa";

import Header from "./components/Header";
import PrivateRoute from "./components/PrivateRoute";
import RoleGuard from "./components/RoleGuard";
import AuthProvider from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import ListaPacientes from "./pages/ListaPacientes";
import CadastroPaciente from "./pages/CadastroPaciente";
import AgendarConsulta from "./pages/AgendarConsulta";
import Configuracoes from "./pages/Configuracoes";
import Notificacoes from "./pages/Notificacoes";
import Login from "./pages/Login";
import GestaoGrupos from "./components/GestaoGrupos";
import { useAuth } from "./hooks/useAuth";

const tabClass = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
    isActive
      ? "bg-sky-700 text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100"
  }`;

function RequireRole({ roles, children }) {
  const { usuario } = useAuth();

  if (!usuario || !roles.includes(usuario.funcao)) {
    return <Navigate to="/pacientes" replace />;
  }

  return children;
}

function AppLayout() {
  const navigate = useNavigate();
  const { logout, usuario } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <Header usuario={usuario} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-6 px-2 sm:px-6 lg:px-8 w-full">
        <Outlet />
      </main>
    </div>
  );
}

function PacientesListaRoute() {
  const navigate = useNavigate();

  return <ListaPacientes onNovoPaciente={() => navigate("/pacientes/novo")} />;
}

function CadastroPacienteRoute() {
  const navigate = useNavigate();

  return <CadastroPaciente onSuccess={() => navigate("/pacientes")} />;
}

function AgendaRoute({ view }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <NavLink to="/agenda" end className={tabClass}>
          <FaChartLine /> Painel
        </NavLink>
        <RoleGuard rolesAllowed={["ADMIN", "RECEPCAO"]}>
          <NavLink to="/agenda/agendar" className={tabClass}>
            <FaCalendarPlus /> Agendar
          </NavLink>
        </RoleGuard>
      </div>

      {view === "agendar" ? (
        <RequireRole roles={["ADMIN", "RECEPCAO"]}>
          <AgendarConsulta onSuccess={() => navigate("/agenda")} />
        </RequireRole>
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

function ComunicacaoRoute({ view }) {
  const { usuario } = useAuth();

  return (
    <RequireRole roles={["ADMIN", "RECEPCAO", "ACS"]}>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <NavLink to="/comunicacao/grupos" className={tabClass}>
            <FaLayerGroup /> Grupos
          </NavLink>
          <NavLink to="/comunicacao/mensageria" className={tabClass}>
            <FaBullhorn /> Mensageria
          </NavLink>
        </div>

        {view === "mensageria" ? (
          <Notificacoes usuario={usuario} />
        ) : (
          <GestaoGrupos usuario={usuario} />
        )}
      </div>
    </RequireRole>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/pacientes" replace />} />
          <Route path="/pacientes" element={<PacientesListaRoute />} />
          <Route
            path="/pacientes/novo"
            element={
              <RequireRole roles={["ADMIN", "RECEPCAO"]}>
                <CadastroPacienteRoute />
              </RequireRole>
            }
          />
          <Route path="/agenda" element={<AgendaRoute view="painel" />} />
          <Route
            path="/agenda/agendar"
            element={<AgendaRoute view="agendar" />}
          />
          <Route
            path="/comunicacao"
            element={<Navigate to="/comunicacao/grupos" replace />}
          />
          <Route
            path="/comunicacao/grupos"
            element={<ComunicacaoRoute view="grupos" />}
          />
          <Route
            path="/comunicacao/mensageria"
            element={<ComunicacaoRoute view="mensageria" />}
          />
          <Route
            path="/configuracoes"
            element={
              <RequireRole roles={["ADMIN"]}>
                <Configuracoes />
              </RequireRole>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/pacientes" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
