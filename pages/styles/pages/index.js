import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Target, Activity, DollarSign, Star, Calendar, MapPin, Zap, CheckCircle, Clock, RefreshCw, Wifi, WifiOff, Heart, Moon, Footprints, Flame, Scale, Battery, Dumbbell, User } from 'lucide-react';

// ============================================================
// CONFIGURAÇÃO - COLE O ID DA SUA PLANILHA AQUI
// ============================================================
const GOOGLE_SHEETS_ID = https://docs.google.com/spreadsheets/d/1Jl6mXYkQQrpKDA4tpaFFy4NwjXOsYeSxP6tZc7JK3ec/edit?usp=sharing;
// ============================================================

const SHEETS_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/gviz/tq?tqx=out:json`;

// Função para buscar dados do Google Sheets
const fetchSheetData = async (sheetName) => {
  try {
    const response = await fetch(`${SHEETS_URL}&sheet=${encodeURIComponent(sheetName)}`);
    const text = await response.text();
    const json = JSON.parse(text.substring(47, text.length - 2));
    
    const headers = json.table.cols.map(col => col.label);
    const rows = json.table.rows.map(row => {
      const obj = {};
      row.c.forEach((cell, idx) => {
        obj[headers[idx]] = cell ? (cell.v !== null ? cell.v : '') : '';
      });
      return obj;
    });
    
    return rows;
  } catch (error) {
    console.error(`Erro ao buscar ${sheetName}:`, error);
    return null;
  }
};

// Funções auxiliares
const formatCurrency = (value) => {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(num || 0);
};

const parseNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
  return 0;
};

const calcularROAS = (retorno, investido) => {
  if (!investido || investido === 0) return '0.00';
  return (retorno / investido).toFixed(2);
};

const diasAteData = (dataStr) => {
  if (!dataStr) return 999;
  const partes = dataStr.split('/');
  const data = new Date(partes[2], partes[1] - 1, partes[0]);
  const hoje = new Date();
  const diff = Math.ceil((data - hoje) / (1000 * 60 * 60 * 24));
  return diff;
};

const getStatusColor = (value, min, max, inverse = false) => {
  if (inverse) {
    if (value <= min) return 'text-emerald-400';
    if (value <= max) return 'text-amber-400';
    return 'text-rose-400';
  }
  if (value >= max) return 'text-emerald-400';
  if (value >= min) return 'text-amber-400';
  return 'text-rose-400';
};

// Componentes
const CardKPI = ({ title, value, subtitle, icon: Icon, trend, trendValue, color, loading }) => {
  const bgGradients = {
    blue: 'from-blue-600 to-blue-800',
    green: 'from-emerald-500 to-emerald-700',
    purple: 'from-violet-600 to-purple-800',
    orange: 'from-amber-500 to-orange-600',
    cyan: 'from-cyan-500 to-teal-600',
    rose: 'from-rose-500 to-pink-700',
    health: 'from-pink-500 to-rose-600'
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bgGradients[color]} p-5 shadow-2xl`}>
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/80 text-xs font-medium uppercase tracking-wider">{title}</span>
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        
        {loading ? (
          <div className="h-8 w-24 bg-white/20 animate-pulse rounded-lg" />
        ) : (
          <div className="text-3xl font-bold text-white mb-1">{value}</div>
        )}
        
        {subtitle && <div className="text-white/70 text-xs">{subtitle}</div>}
        
        {trend && !loading && (
          <div className={`flex items-center gap-1 mt-2 ${trend === 'up' ? 'text-emerald-300' : 'text-rose-300'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="text-xs font-medium">{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ProgressRing = ({ progress, size = 100, strokeWidth = 10, color = '#10b981' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{progress}%</span>
      </div>
    </div>
  );
};

// Card de Saúde Individual
const HealthCard = ({ nome, dados, loading }) => {
  const sonoOk = dados.sono >= 7;
  const hrvOk = dados.hrv >= (nome === 'João' ? 60 : 50);
  const passosOk = dados.passos >= (nome === 'João' ? 10000 : 8000);
  const protocoloOk = dados.protocolo >= 9;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold">{nome}</h3>
          <div className="text-slate-400 text-xs">Métricas de hoje</div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-6 bg-slate-700 animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Sono */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-300 text-sm">Sono</span>
            </div>
            <span className={`font-semibold ${sonoOk ? 'text-emerald-400' : 'text-amber-400'}`}>
              {dados.sono}h {sonoOk ? '✓' : '⚠'}
            </span>
          </div>

          {/* HRV */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <span className="text-slate-300 text-sm">HRV</span>
            </div>
            <span className={`font-semibold ${hrvOk ? 'text-emerald-400' : 'text-amber-400'}`}>
              {dados.hrv}ms {hrvOk ? '✓' : '⚠'}
            </span>
          </div>

          {/* Recovery */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300 text-sm">Recovery</span>
            </div>
            <span className={`font-semibold ${dados.recovery >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {dados.recovery}%
            </span>
          </div>

          {/* Passos */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 text-sm">Passos</span>
            </div>
            <span className={`font-semibold ${passosOk ? 'text-emerald-400' : 'text-slate-300'}`}>
              {dados.passos.toLocaleString('pt-BR')}
            </span>
          </div>

          {/* Peso */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300 text-sm">Peso</span>
            </div>
            <span className="text-slate-200 font-semibold">
              {dados.peso}kg
            </span>
          </div>

          {/* Protocolo */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 text-sm">Protocolo</span>
            </div>
            <span className={`font-semibold ${protocoloOk ? 'text-emerald-400' : 'text-amber-400'}`}>
              {dados.protocolo}/11
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Card de Treinos Semanal
const WeeklyTrainingCard = ({ joao, arusha, loading }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-4">
        <Dumbbell className="w-5 h-5 text-orange-400" />
        <h3 className="text-white font-semibold">Treinos Semana</h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-6 bg-slate-700 animate-pulse rounded" />
          <div className="h-6 bg-slate-700 animate-pulse rounded" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* João */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">João</span>
              <span className="text-white">{joao.forca + joao.cardio}/6</span>
            </div>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div key={`jf${i}`} className={`h-2 flex-1 rounded ${i < joao.forca ? 'bg-orange-500' : 'bg-slate-700'}`} />
              ))}
              {[...Array(3)].map((_, i) => (
                <div key={`jc${i}`} className={`h-2 flex-1 rounded ${i < joao.cardio ? 'bg-cyan-500' : 'bg-slate-700'}`} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Força: {joao.forca}/3</span>
              <span>Cardio: {joao.cardio}/3</span>
            </div>
          </div>

          {/* Arusha */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Arusha</span>
              <span className="text-white">{arusha.forca + arusha.cardio}/6</span>
            </div>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div key={`af${i}`} className={`h-2 flex-1 rounded ${i < arusha.forca ? 'bg-orange-500' : 'bg-slate-700'}`} />
              ))}
              {[...Array(3)].map((_, i) => (
                <div key={`ac${i}`} className={`h-2 flex-1 rounded ${i < arusha.cardio ? 'bg-cyan-500' : 'bg-slate-700'}`} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Força: {arusha.forca}/3</span>
              <span>Cardio: {arusha.cardio}/3</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Streak de Jejum
const FastingStreak = ({ joao, arusha, loading }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="text-white font-semibold">Streak Jejum 18:6</h3>
      </div>

      {loading ? (
        <div className="h-16 bg-slate-700 animate-pulse rounded" />
      ) : (
        <div className="flex justify-around">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400">{joao}</div>
            <div className="text-slate-400 text-xs">João</div>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400">{arusha}</div>
            <div className="text-slate-400 text-xs">Arusha</div>
          </div>
        </div>
      )}
      <div className="text-center text-slate-500 text-xs mt-2">dias consecutivos</div>
    </div>
  );
};

const UnidadeCard = ({ nome, cidade, lucroAtual, lucroMeta, nota, status, loading }) => {
  const progresso = lucroMeta > 0 ? Math.round((lucroAtual / lucroMeta) * 100) : 0;
  
  const getStatusColor = () => {
    if (status === 'pre-operacao') return 'bg-slate-500';
    if (nota >= 80) return 'bg-emerald-500';
    if (nota >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${status !== 'pre-operacao' ? 'animate-pulse' : ''}`} />
          <div>
            <h3 className="text-white font-semibold">{nome}</h3>
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <MapPin className="w-3 h-3" />
              {cidade}
            </div>
          </div>
        </div>
        <div className="text-right">
          {loading ? (
            <div className="h-8 w-12 bg-slate-700 animate-pulse rounded" />
          ) : (
            <>
              <div className="text-2xl font-bold text-white">{nota}</div>
              <div className="text-slate-400 text-xs">NOTA</div>
            </>
          )}
        </div>
      </div>
      
      {status !== 'pre-operacao' ? (
        <>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Lucro Atual</span>
            {loading ? (
              <div className="h-4 w-16 bg-slate-700 animate-pulse rounded" />
            ) : (
              <span className="text-emerald-400 font-semibold">{formatCurrency(lucroAtual)}</span>
            )}
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-1000" style={{ width: `${Math.min(progresso, 100)}%` }} />
          </div>
          <div className="text-right text-xs text-slate-400 mt-1">{progresso}% da meta</div>
        </>
      ) : (
        <div className="text-center py-2">
          <Clock className="w-6 h-6 text-slate-500 mx-auto mb-1" />
          <span className="text-slate-400 text-xs">Inauguração: Set/2026</span>
        </div>
      )}
    </div>
  );
};

const CampanhaRow = ({ nome, investido, retorno, status }) => {
  const roas = calcularROAS(retorno, investido);
  const isPositive = retorno > investido;

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'ativo' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
        <span className="text-slate-200 text-sm">{nome}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-slate-400 text-xs">Inv.</div>
          <div className="text-slate-200 text-sm">{formatCurrency(investido)}</div>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${parseFloat(roas) >= 3 ? 'bg-emerald-500/20 text-emerald-400' : parseFloat(roas) >= 2 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
          {roas}x
        </div>
      </div>
    </div>
  );
};

const MarcoItem = ({ nome, prazo, status }) => {
  const dias = diasAteData(prazo);
  
  const getStatusIcon = () => {
    if (status === 'concluido') return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (status === 'em-andamento') return <Activity className="w-4 h-4 text-amber-500 animate-pulse" />;
    return <Clock className="w-4 h-4 text-slate-500" />;
  };

  const getStatusBg = () => {
    if (status === 'concluido') return 'bg-emerald-500/10 border-emerald-500/30';
    if (status === 'em-andamento') return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-slate-500/10 border-slate-500/30';
  };

  return (
    <div className={`flex items-center justify-between p-2 rounded-lg border ${getStatusBg()}`}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className={`text-sm ${status === 'concluido' ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{nome}</span>
      </div>
      <div className={`text-xs ${dias < 0 ? 'text-rose-400' : dias <= 7 ? 'text-amber-400' : 'text-slate-400'}`}>
        {status === 'concluido' ? '✓' : dias < 0 ? `${Math.abs(dias)}d atrasado` : dias === 0 ? 'Hoje!' : `${dias}d`}
      </div>
    </div>
  );
};

// Dashboard Principal
export default function DashboardCentroprev() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Estados dos dados
  const [unidades, setUnidades] = useState([]);
  const [campanhas, setCampanhas] = useState([]);
  const [marcos, setMarcos] = useState([]);
  const [kpis, setKpis] = useState({ checkupsHoje: 0, checkupsMeta: 9, checkupsMedia: 0 });
  
  // Estados de saúde
  const [saudeJoao, setSaudeJoao] = useState({ sono: 0, hrv: 0, recovery: 0, passos: 0, peso: 0, protocolo: 0 });
  const [saudeArusha, setSaudeArusha] = useState({ sono: 0, hrv: 0, recovery: 0, passos: 0, peso: 0, protocolo: 0 });
  const [treinosJoao, setTreinosJoao] = useState({ forca: 0, cardio: 0 });
  const [treinosArusha, setTreinosArusha] = useState({ forca: 0, cardio: 0 });
  const [streakJoao, setStreakJoao] = useState(0);
  const [streakArusha, setStreakArusha] = useState(0);

  // Função para carregar todos os dados
  const loadData = useCallback(async () => {
    setLoading(true);
    
    try {
      const [unidadesData, campanhasData, marcosData, kpisData, saudeData] = await Promise.all([
        fetchSheetData('Unidades'),
        fetchSheetData('Campanhas'),
        fetchSheetData('Marcos'),
        fetchSheetData('KPIs'),
        fetchSheetData('Saude')
      ]);

      if (unidadesData) {
        setUnidades(unidadesData.map(u => ({
          nome: u.nome || 'Centroprev',
          cidade: u.cidade || '',
          lucroAtual: parseNumber(u.lucro_atual),
          lucroMeta: parseNumber(u.lucro_meta),
          faturamentoAtual: parseNumber(u.faturamento_atual),
          faturamentoMeta: parseNumber(u.faturamento_meta),
          status: u.status || 'operando',
          nota: parseNumber(u.nota) || 0
        })));
      }

      if (campanhasData) {
        setCampanhas(campanhasData.map(c => ({
          nome: c.nome || '',
          investido: parseNumber(c.investido),
          retorno: parseNumber(c.retorno),
          status: c.status || 'ativo'
        })));
      }

      if (marcosData) {
        setMarcos(marcosData.map(m => ({
          nome: m.nome || '',
          prazo: m.prazo || '',
          status: m.status || 'pendente'
        })));
      }

      if (kpisData && kpisData[0]) {
        setKpis({
          checkupsHoje: parseNumber(kpisData[0].checkups_hoje),
          checkupsMeta: parseNumber(kpisData[0].checkups_meta) || 9,
          checkupsMedia: parseNumber(kpisData[0].checkups_media)
        });
      }

      if (saudeData) {
        const joaoData = saudeData.find(s => s.pessoa === 'João') || {};
        const arushaData = saudeData.find(s => s.pessoa === 'Arusha') || {};
        
        setSaudeJoao({
          sono: parseNumber(joaoData.sono) || 0,
          hrv: parseNumber(joaoData.hrv) || 0,
          recovery: parseNumber(joaoData.recovery) || 0,
          passos: parseNumber(joaoData.passos) || 0,
          peso: parseNumber(joaoData.peso) || 0,
          protocolo: parseNumber(joaoData.protocolo) || 0
        });
        
        setSaudeArusha({
          sono: parseNumber(arushaData.sono) || 0,
          hrv: parseNumber(arushaData.hrv) || 0,
          recovery: parseNumber(arushaData.recovery) || 0,
          passos: parseNumber(arushaData.passos) || 0,
          peso: parseNumber(arushaData.peso) || 0,
          protocolo: parseNumber(arushaData.protocolo) || 0
        });
        
        setTreinosJoao({
          forca: parseNumber(joaoData.treinos_forca) || 0,
          cardio: parseNumber(joaoData.treinos_cardio) || 0
        });
        
        setTreinosArusha({
          forca: parseNumber(arushaData.treinos_forca) || 0,
          cardio: parseNumber(arushaData.treinos_cardio) || 0
        });
        
        setStreakJoao(parseNumber(joaoData.streak_jejum) || 0);
        setStreakArusha(parseNumber(arushaData.streak_jejum) || 0);
      }

      setConnected(true);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setConnected(false);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const dataInterval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(dataInterval);
  }, [loadData]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cálculos derivados
  const lucroTotal = unidades.reduce((acc, u) => acc + (u.status !== 'pre-operacao' ? u.lucroAtual : 0), 0);
  const metaLucroTotal = unidades.reduce((acc, u) => acc + u.lucroMeta, 0);
  
  const progressoGeral = marcos.length > 0 
    ? Math.round(((marcos.filter(m => m.status === 'concluido').length + marcos.filter(m => m.status === 'em-andamento').length * 0.5) / marcos.length) * 100)
    : 0;

  const roasMedia = campanhas.length > 0
    ? (campanhas.reduce((acc, c) => acc + parseFloat(calcularROAS(c.retorno, c.investido)), 0) / campanhas.length).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              CENTRO<span className="text-emerald-400">PREV</span>
            </h1>
            <p className="text-slate-400 text-sm">Dashboard Integrado 2026</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {connected ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-rose-500" />}
              <button onClick={loadData} className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors">
                <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono text-white">{currentTime.toLocaleTimeString('pt-BR')}</div>
              <div className="text-slate-400 text-xs">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
            </div>
          </div>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <CardKPI title="Lucro Total" value={formatCurrency(lucroTotal)} subtitle={`Meta: ${formatCurrency(metaLucroTotal)}`} icon={DollarSign} color="green" loading={loading} />
          <CardKPI title="Progresso Metas" value={`${progressoGeral}%`} subtitle="Fase 1: Liberdade Geográfica" icon={Target} color="purple" loading={loading} />
          <CardKPI title="Checkups Hoje" value={kpis.checkupsHoje} subtitle={`Meta: ${kpis.checkupsMeta}/dia`} icon={Activity} color="cyan" loading={loading} />
          <CardKPI title="ROAS Médio" value={`${roasMedia}x`} subtitle="Retorno campanhas" icon={Zap} color="orange" loading={loading} />
          <CardKPI title="Saúde" value={`${Math.round((saudeJoao.protocolo + saudeArusha.protocolo) / 2)}/11`} subtitle="Protocolo hoje" icon={Heart} color="health" loading={loading} />
        </div>

        {/* Grid Principal - 4 colunas */}
        <div className="grid grid-cols-4 gap-4">
          
          {/* Coluna 1: Unidades */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              Unidades
            </h2>
            {unidades.length > 0 ? unidades.map((u, i) => (
              <UnidadeCard key={i} {...u} loading={loading} />
            )) : (
              <>
                <UnidadeCard nome="Centroprev" cidade="Manaus" lucroAtual={0} lucroMeta={100000} nota={0} status="operando" loading={loading} />
                <UnidadeCard nome="Centroprev" cidade="Curitiba" lucroAtual={0} lucroMeta={100000} nota={0} status="pre-operacao" loading={loading} />
              </>
            )}
            
            {/* Campanhas */}
            <h2 className="text-base font-semibold text-white flex items-center gap-2 pt-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Campanhas
            </h2>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-3 border border-slate-700/50">
              {campanhas.length > 0 ? campanhas.map((c, i) => (
                <CampanhaRow key={i} {...c} />
              )) : (
                <div className="text-center py-4 text-slate-500 text-sm">Nenhuma campanha</div>
              )}
            </div>
          </div>

          {/* Coluna 2: Saúde */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              Saúde Hoje
            </h2>
            <HealthCard nome="João" dados={saudeJoao} loading={loading} />
            <HealthCard nome="Arusha" dados={saudeArusha} loading={loading} />
          </div>

          {/* Coluna 3: Saúde Semanal + Progresso */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-orange-400" />
              Semana
            </h2>
            <WeeklyTrainingCard joao={treinosJoao} arusha={treinosArusha} loading={loading} />
            <FastingStreak joao={streakJoao} arusha={streakArusha} loading={loading} />
            
            {/* Progresso Geral */}
            <h2 className="text-base font-semibold text-white flex items-center gap-2 pt-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Progresso
            </h2>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50 flex items-center justify-center">
              <ProgressRing progress={progressoGeral} size={100} strokeWidth={10} />
            </div>
          </div>

          {/* Coluna 4: Marcos */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Próximos Marcos
            </h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {marcos.length > 0 ? marcos.slice(0, 10).map((m, i) => (
                <MarcoItem key={i} {...m} />
              )) : (
                <div className="text-center py-4 text-slate-500 text-sm">Nenhum marco</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-slate-500 text-xs">
          <span className={connected ? 'text-emerald-500' : 'text-rose-500'}>{connected ? '● Conectado' : '● Offline'}</span>
          <span className="mx-2">|</span>
          Atualizado: {lastUpdate ? lastUpdate.toLocaleTimeString('pt-BR') : '—'}
          <span className="mx-2">|</span>
          João & Arusha 🚀
        </div>
      </div>
    </div>
  );
}
