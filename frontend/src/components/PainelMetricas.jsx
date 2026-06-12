import { 
  FaUsers, 
  FaExclamationCircle, 
  FaCheckCircle 
} from 'react-icons/fa';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getBadgeInfo } from '../utils/dateHelpers';

export default function PainelMetricas({ consultas }) {
  // 1. CÁLCULO DAS MÉTRICAS DOS CARDS
  const totalPacientes = consultas.length;
  
  const atrasados = consultas.filter(c => {
    const label = getBadgeInfo(c).label;
    return label === 'URGENTE' || label === 'ALERTA';
  }).length;

  const noPrazo = consultas.filter(c => {
    const label = getBadgeInfo(c).label;
    return label === 'OK' || label === 'LEMBRETE';
  }).length;

  // 2. DADOS PARA O GRÁFICO DE PIZZA (Status)
  const dadosPizza = [
    { name: 'No Prazo', value: noPrazo, color: '#10b981' }, // Emerald-500
    { name: 'Em Atraso', value: atrasados, color: '#ef4444' } // Red-500
  ];

  // 3. DADOS PARA O GRÁFICO DE BARRAS (Por Profissional)
  // Agrupa os pacientes pela especialidade (Enfermagem, Médico, Odonto)
  const contagemProfissional = consultas.reduce((acc, consulta) => {
    const prof = consulta.tipo_profissional || 'Outros';
    acc[prof] = (acc[prof] || 0) + 1;
    return acc;
  }, {});

  const dadosBarras = Object.keys(contagemProfissional).map(chave => ({
    name: chave,
    Pacientes: contagemProfissional[chave]
  }));

  return (
    <div className="space-y-6 mb-8">
      {/* LINHA 1: CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Total */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-sky-100 p-4 rounded-full text-sky-700 text-2xl">
            <FaUsers />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Total Monitorado</p>
            <p className="text-3xl font-bold text-slate-800">{totalPacientes}</p>
          </div>
        </div>

        {/* Card Atrasados */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-red-100 p-4 rounded-full text-red-600 text-2xl">
            <FaExclamationCircle />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Busca Ativa</p>
            <p className="text-3xl font-bold text-red-600">{atrasados}</p>
          </div>
        </div>

        {/* Card No Prazo */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 text-2xl">
            <FaCheckCircle />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Acompanhamento OK</p>
            <p className="text-3xl font-bold text-emerald-600">{noPrazo}</p>
          </div>
        </div>
      </div>

      {/* LINHA 2: GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Gráfico de Barras */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-700 font-bold mb-4 text-center">Distribuição por Profissional</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosBarras} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="Pacientes" fill="#0369a1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pizza */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-700 font-bold mb-4 text-center">Status Geral da Unidade</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosPizza}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dadosPizza.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legenda Manual para ficar mais bonita */}
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-slate-600 font-medium">No Prazo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-slate-600 font-medium">Em Atraso</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
