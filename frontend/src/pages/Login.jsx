import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { FaHeartbeat, FaLock, FaEnvelope } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { login, loading: authLoading, usuario } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  if (!authLoading && usuario) {
    return <Navigate to="/pacientes" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      await login({ email, senha });
      navigate("/pacientes", { replace: true });
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Círculos decorativos de fundo para dar um ar moderno */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 relative z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="bg-sky-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <FaHeartbeat className="text-3xl text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">SGR - UBS</h1>
          <p className="text-slate-500 text-sm mt-1">Acesso Restrito</p>
        </div>

        {erro && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100 flex items-center gap-2">
            <FaLock /> {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              E-mail Profissional
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                placeholder="Digite seu e-mail profissional"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-slate-400" />
              </div>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold py-3 px-4 rounded-lg shadow-md transition flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              "Entrar no Sistema"
            )}
          </button>
        </form>

        <footer className="mt-8 pt-4 border-t border-slate-100 text-center space-y-1.5 animate-in fade-in duration-500 delay-300">
          <p className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
            Desenvolvido em parceria com o{" "}
            <span className="text-slate-600 font-semibold">PET-INOVASC</span>
          </p>
          <p className="text-xs text-slate-400">
            Suporte e TI:{" "}
            <a
              href="mailto:lucemariodev@gmail.com"
              className="text-sky-600 hover:text-sky-800 font-medium underline transition-colors"
            >
              lucemariodev@gmail.com
            </a>
          </p>
        </footer>

        <p className="text-center text-xs text-slate-400 mt-8">
          Módulo de Gestão • PET-INOVASC
        </p>
      </div>
    </div>
  );
}
