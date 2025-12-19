
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, CheckCircle, AlertCircle, Loader2, Database, MapPin, Building, Trash2, History, RotateCcw } from 'lucide-react';
import { CompanyLead, SearchFilters, AppState } from './types';
import { discoverLeads, validateLeads } from './services/gemini';
import { exportToExcel } from './utils/export';

// --- Constants ---
const STORAGE_KEY = 'b2b_crawler_history_eiks';

// --- Components ---

const Header: React.FC = () => (
  <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">B2B Crawler Agent</h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Bulgaria Lead Generation</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500 hidden sm:flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-green-500" /> API Connected
        </span>
      </div>
    </div>
  </header>
);

const FilterPanel: React.FC<{ 
  onSearch: (f: SearchFilters) => void, 
  loading: boolean,
  historyCount: number,
  onClearHistory: () => void
}> = ({ onSearch, loading, historyCount, onClearHistory }) => {
  const [industry, setIndustry] = useState('IT услуги');
  const [city, setCity] = useState('София');
  const [limit, setLimit] = useState(50);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Search className="w-4 h-4" /> Параметри за търсене
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded flex items-center gap-1">
            <History className="w-3 h-3" /> Вече открити: {historyCount}
          </span>
          {historyCount > 0 && (
            <button 
              onClick={onClearHistory}
              className="text-xs text-red-500 hover:underline flex items-center gap-1"
              title="Изчистване на историята за нови търсения"
            >
              <RotateCcw className="w-3 h-3" /> Нулирай
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Индустрия / Сфера</label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="пр: Логистика, Търговия..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Град / Област</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="пр: Пловдив, Варна..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Лимит резултати</label>
          <select 
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
          >
            <option value={50}>50 компании</option>
            <option value={100}>100 компании</option>
            <option value={200}>200 компании</option>
          </select>
        </div>
      </div>
      <button 
        onClick={() => onSearch({ industry, city, limit })}
        disabled={loading}
        className="w-full md:w-auto px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        Стартирай ново обхождане
      </button>
    </div>
  );
};

const LeadCard: React.FC<{ lead: CompanyLead; onDelete: (id: string) => void }> = ({ lead, onDelete }) => (
  <tr className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
    <td className="px-6 py-4">
      <div className="text-sm font-semibold text-slate-900">{lead.name}</div>
      <div className="text-xs text-slate-500">ЕИК: {lead.eik || 'N/A'}</div>
    </td>
    <td className="px-6 py-4">
      <div className="text-sm text-slate-700">{lead.phone}</div>
      <div className="text-xs text-blue-600 truncate max-w-[150px]">{lead.email}</div>
    </td>
    <td className="px-6 py-4">
      <div className="text-sm text-slate-700 truncate max-w-[200px]" title={lead.address}>{lead.address}</div>
      <a href={lead.website} target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-blue-500 truncate block">
        {lead.website}
      </a>
    </td>
    <td className="px-6 py-4">
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {lead.industry}
      </span>
    </td>
    <td className="px-6 py-4">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        lead.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {lead.status === 'active' ? 'Активна' : 'Проверка'}
      </span>
    </td>
    <td className="px-6 py-4 text-right">
      <button 
        onClick={() => onDelete(lead.id)}
        className="text-slate-400 hover:text-red-500 p-1"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </td>
  </tr>
);

// --- Main App ---

export default function App() {
  const [leads, setLeads] = useState<CompanyLead[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [historyEiks, setHistoryEiks] = useState<string[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistoryEiks(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historyEiks));
  }, [historyEiks]);

  const handleSearch = async (filters: SearchFilters) => {
    try {
      setAppState(AppState.SEARCHING);
      setError(null);
      
      // Pass history to avoid duplicates
      const filtersWithHistory = { ...filters, excludedEiks: historyEiks };
      
      const discovered = await discoverLeads(filtersWithHistory);
      
      // Filter out any accidental duplicates that might have slipped through
      const uniqueNewLeads = discovered.filter(lead => !historyEiks.includes(lead.eik));
      setLeads(uniqueNewLeads);
      
      if (uniqueNewLeads.length === 0) {
        setAppState(AppState.COMPLETED);
        return;
      }

      setAppState(AppState.VALIDATING);
      const validated = await validateLeads(uniqueNewLeads);
      setLeads(validated);
      
      // Update history with new EIKs
      const newEiks = validated.filter(l => l.eik).map(l => l.eik);
      setHistoryEiks(prev => Array.from(new Set([...prev, ...newEiks])));
      
      setAppState(AppState.COMPLETED);
    } catch (err: any) {
      setError(err.message || 'Възникна грешка при обхождането.');
      setAppState(AppState.ERROR);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Сигурни ли сте, че искате да изчистите историята на откритите фирми? Това ще позволи на агента отново да предлага същите фирми при следващи търсения.")) {
      setHistoryEiks([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleDelete = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const handleExport = () => {
    if (leads.length === 0) return;
    exportToExcel(leads);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Intro */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">Автоматизиран B2B Crawler 2.0</h2>
            <p className="text-blue-100 max-w-2xl">
              Разширени възможности за събиране на данни. Вече поддържа до 200 резултата и 
              <strong> интелигентно изключва</strong> фирми, които вече са били открити в предишни сесии.
            </p>
          </div>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-10">
            <Database className="w-64 h-64" />
          </div>
        </div>

        {/* Filters */}
        <FilterPanel 
          onSearch={handleSearch} 
          loading={appState === AppState.SEARCHING || appState === AppState.VALIDATING} 
          historyCount={historyEiks.length}
          onClearHistory={handleClearHistory}
        />

        {/* Status Indicators */}
        {appState === AppState.SEARCHING && (
          <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200 border-dashed animate-pulse">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Обхождане на Търговски регистър и Google Maps...</p>
              <p className="text-xs text-slate-400">Проверяваме срещу {historyEiks.length} вече известни записа</p>
            </div>
          </div>
        )}

        {appState === AppState.VALIDATING && (
          <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-4 animate-bounce" />
              <p className="text-slate-600 font-medium">Интелигентна валидация на нови {leads.length} контакта...</p>
              <p className="text-xs text-slate-400">Проверяваме актуалността на уебсайтовете</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Results */}
        {(appState === AppState.COMPLETED || leads.length > 0) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Новооткрити фирми ({leads.length})
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={handleExport}
                  disabled={leads.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-lg transition-colors font-medium shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Експорт в Excel (.xlsx)
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Фирма / ЕИК</th>
                      <th className="px-6 py-4">Контакти</th>
                      <th className="px-6 py-4">Адрес / Сайт</th>
                      <th className="px-6 py-4">Дейност</th>
                      <th className="px-6 py-4">Статус</th>
                      <th className="px-6 py-4 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map(lead => (
                      <LeadCard key={lead.id} lead={lead} onDelete={handleDelete} />
                    ))}
                  </tbody>
                </table>
              </div>
              
              {leads.length === 0 && appState === AppState.COMPLETED && (
                <div className="p-12 text-center text-slate-500">
                  Не бяха открити НОВИ резултати. Всички фирми в тази категория вероятно вече са в историята ви.
                </div>
              )}
            </div>
          </div>
        )}

        {appState === AppState.IDLE && leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="bg-slate-100 p-6 rounded-full mb-4">
              <Database className="w-12 h-12 text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900">Системата е готова за обхождане</h4>
            <p className="text-slate-500 max-w-sm text-center mt-2">
              Въведете индустрия и град. Агентът ще потърси фирми, които <strong>не присъстват</strong> в досегашната ви история.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} B2B Crawler Agent Bulgaria. 
            Вече с история и поддръжка на мащабни търсения.
          </p>
        </div>
      </footer>
    </div>
  );
}
