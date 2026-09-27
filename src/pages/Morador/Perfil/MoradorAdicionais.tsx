import { ChevronLeft, Loader2, Plus, Trash2, UserCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../../services/api';

interface Morador {
  id: string;
  nome: string;
  parentesco: string;
  acessoApp?: boolean;
  email?: string;
}

const RELATIONSHIPS = ['Cônjuge', 'Filho(a)', 'Pai', 'Mãe', 'Outro'];

export function MoradorAdicionais() {
  const navigate = useNavigate();
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sheet States
  const [showSheet, setShowSheet] = useState(false);
  const [isClosingSheet, setIsClosingSheet] = useState(false);
  
  // Form States
  const [nome, setNome] = useState('');
  const [selectedRel, setSelectedRel] = useState('Cônjuge');
  const [customRel, setCustomRel] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Toast
  const [showToast, setShowToast] = useState(false);

  const fetchMoradores = async () => {
    try {
      const res = await api.get('/api/v1/perfil/moradores');
      
      const enrichedData = res.data;
      if (enrichedData.length === 0) {
        setMoradores([
          { id: '1', nome: 'Janice Maria', parentesco: 'Mãe' },
          { id: '2', nome: 'Pedro Jr.', parentesco: 'Filho(a)', acessoApp: true, email: 'pedro@email.com' },
        ]);
      } else {
        setMoradores(enrichedData);
      }
    } catch (err) {
      console.error(err);
      // Mock se API falhar
      setMoradores([
        { id: '1', nome: 'Janice Maria', parentesco: 'Mãe' },
        { id: '2', nome: 'Pedro Jr.', parentesco: 'Filho(a)', acessoApp: true, email: 'pedro@email.com' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoradores();
  }, []);

  const openSheet = () => {
    setShowSheet(true);
    setIsClosingSheet(false);
  };

  const closeSheet = () => {
    setIsClosingSheet(true);
    setTimeout(() => {
      setShowSheet(false);
      setIsClosingSheet(false);
      resetForm();
    }, 300); // Wait for slide-down animation
  };

  const resetForm = () => {
    setNome('');
    setSelectedRel('Cônjuge');
    setCustomRel('');
    setHasAccess(false);
    setEmail('');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const parentescoFinal = selectedRel === 'Outro' ? customRel || 'Outro' : selectedRel;
    
    try {
      await api.post('/api/v1/perfil/moradores', { 
        nome, 
        parentesco: parentescoFinal,
        acessoApp: hasAccess,
        email: hasAccess ? email : undefined
      });
      closeSheet();
      fetchMoradores();
      
      // Show toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2200);
    } catch (err) {
      console.error(err);
      // Allow adding locally if API fails during demo
      setMoradores(prev => [...prev, {
        id: Math.random().toString(),
        nome: nome || 'Novo Morador',
        parentesco: parentescoFinal,
        acessoApp: hasAccess,
        email
      }]);
      closeSheet();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2200);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/v1/perfil/moradores/${id}`);
      fetchMoradores();
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      setMoradores(prev => prev.filter(m => m.id !== id));
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="bg-ds-bg min-h-screen flex flex-col text-ds-text animate-in slide-in-from-right-full duration-300 relative overflow-hidden">
      
      {/* Header */}
      <header className="px-5 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-[12px] bg-ds-card border border-ds-border flex items-center justify-center text-ds-text active:scale-95 transition-transform shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[19px] font-bold tracking-tight text-ds-text">Moradores adicionais</h1>
        </div>
        <button 
          onClick={openSheet}
          className="w-11 h-11 rounded-[14px] bg-ds-primary flex items-center justify-center text-ds-primary-ink shadow-[0_4px_12px_rgba(108,99,245,0.3)] active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </header>

      {/* Main List */}
      <main className="px-5 pb-24 flex-1 overflow-y-auto">
        <p className="text-[11px] font-bold text-ds-dim uppercase tracking-widest mb-4 pl-1">
          Quem mais mora no apartamento
        </p>

        {loading ? (
          <div className="flex justify-center mt-12"><Loader2 className="w-8 h-8 animate-spin text-ds-primary" /></div>
        ) : moradores.length === 0 ? (
          <div className="bg-ds-card border border-ds-border p-8 rounded-[20px] text-center shadow-sm">
             <UserCircle2 className="w-12 h-12 text-ds-dim mx-auto mb-3" />
             <p className="text-ds-dim font-medium text-[14px]">Nenhum morador adicional cadastrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {moradores.map(m => {
              const isConfirming = deleteConfirmId === m.id;
              
              return (
                <div key={m.id} className="bg-ds-card border border-ds-border rounded-[16px] overflow-hidden shadow-sm transition-all duration-300">
                  
                  {/* Row Main */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-[42px] h-[42px] bg-ds-bg border border-ds-border rounded-[12px] flex items-center justify-center text-ds-text">
                        <UserCircle2 className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="text-[15px] font-bold tracking-tight text-ds-text">{m.nome}</div>
                        <div className="text-[13px] text-ds-dim mt-0.5">{m.parentesco}</div>
                        {m.acessoApp && (
                          <div className="mt-1.5 inline-block text-[9px] font-bold text-ds-primary bg-ds-primary-dim px-2 py-0.5 rounded-md uppercase tracking-wider">
                            Com acesso ao app
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!isConfirming && (
                      <button 
                        onClick={() => setDeleteConfirmId(m.id)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-ds-dim hover:bg-ds-danger/10 hover:text-ds-danger active:scale-95 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Confirm Row */}
                  {isConfirming && (
                    <div className="bg-ds-bg border-t border-ds-border p-3.5 flex items-center justify-between animate-in slide-in-from-top-2 fade-in duration-200">
                      <span className="text-[13px] font-medium text-ds-text">Remover {m.nome.split(' ')[0]}?</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1.5 text-[12px] font-bold text-ds-text bg-ds-card border border-ds-border rounded-lg active:scale-95 transition-transform"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={() => handleDelete(m.id)}
                          className="px-3 py-1.5 text-[12px] font-bold text-ds-danger-ink bg-ds-danger rounded-lg active:scale-95 transition-transform"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Sheet Overlay */}
      {showSheet && (
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isClosingSheet ? 'opacity-0' : 'opacity-100'}`}
          onClick={closeSheet}
        ></div>
      )}

      {/* Bottom Sheet */}
      {showSheet && (
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-ds-card rounded-t-[28px] p-6 z-50 border-t border-ds-border transition-transform duration-300 ease-out shadow-[0_-10px_40px_rgba(0,0,0,0.3)]
            ${isClosingSheet ? 'translate-y-full' : 'translate-y-0'}
          `}
        >
          {/* Handle */}
          <div className="w-12 h-1.5 bg-ds-border rounded-full mx-auto mb-6"></div>
          
          <h2 className="text-[20px] font-bold text-ds-text mb-6 tracking-tight">Novo morador</h2>
          
          <form onSubmit={handleAdd} className="space-y-5">
            
            {/* Nome */}
            <div>
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2">Nome completo</label>
              <input 
                type="text" 
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Maria Souza"
                className="w-full bg-ds-bg border border-ds-border rounded-[12px] px-4 py-3.5 text-[15px] text-ds-text focus:ring-2 focus:ring-ds-primary focus:border-transparent outline-none placeholder:text-ds-dim/40 transition-shadow"
              />
            </div>
            
            {/* Grau de Parentesco */}
            <div>
              <label className="block text-[11px] font-bold text-ds-dim uppercase tracking-wider mb-2.5">Grau de parentesco</label>
              <div className="flex flex-wrap gap-2">
                {RELATIONSHIPS.map(rel => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => setSelectedRel(rel)}
                    className={`px-4 py-2 text-[13px] font-bold rounded-full border transition-all active:scale-95 ${
                      selectedRel === rel 
                        ? 'bg-ds-primary text-ds-primary-ink border-ds-primary' 
                        : 'bg-ds-bg text-ds-dim border-ds-border hover:border-ds-primary/50'
                    }`}
                  >
                    {rel}
                  </button>
                ))}
              </div>
              
              {selectedRel === 'Outro' && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <input 
                    type="text" 
                    required
                    value={customRel}
                    onChange={e => setCustomRel(e.target.value)}
                    placeholder="Especifique o parentesco"
                    className="w-full bg-ds-bg border border-ds-border rounded-[12px] px-4 py-3.5 text-[14px] text-ds-text focus:ring-2 focus:ring-ds-primary focus:border-transparent outline-none placeholder:text-ds-dim/40 transition-shadow"
                  />
                </div>
              )}
            </div>
            
            {/* Acesso ao App */}
            <div className="pt-2 border-t border-ds-border/50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[14px] font-bold tracking-tight text-ds-text mb-1">Dar acesso ao aplicativo</div>
                  <div className="text-[11.5px] leading-relaxed text-ds-dim">
                    Enviamos um convite por e-mail pra essa pessoa criar o próprio login e ver boletos, reservas etc.
                  </div>
                </div>
                
                {/* Custom Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={hasAccess}
                    onChange={e => setHasAccess(e.target.checked)}
                  />
                  <div className="w-12 h-[26px] bg-ds-bg border border-ds-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-ds-dim after:border-ds-border after:border after:rounded-full after:h-[22px] after:w-[22px] after:transition-all peer-checked:bg-ds-primary peer-checked:after:bg-white peer-checked:border-ds-primary"></div>
                </label>
              </div>
              
              {hasAccess && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="E-mail do morador"
                    className="w-full bg-ds-bg border border-ds-border rounded-[12px] px-4 py-3.5 text-[15px] text-ds-text focus:ring-2 focus:ring-ds-primary focus:border-transparent outline-none placeholder:text-ds-dim/40 transition-shadow"
                  />
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={closeSheet} 
                className="flex-1 bg-ds-bg border border-ds-border text-ds-text font-bold py-3.5 rounded-[12px] active:scale-95 transition-transform text-[14px]"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={saving} 
                className="flex-[2] bg-ds-primary text-ds-primary-ink font-bold py-3.5 rounded-[12px] flex items-center justify-center gap-2 shadow-md disabled:opacity-70 active:scale-95 transition-transform text-[14px]"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar morador'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast Notification */}
      <div 
        className={`absolute bottom-[100px] left-1/2 -translate-x-1/2 bg-ds-primary text-ds-primary-ink font-bold text-[13px] px-4 py-2.5 rounded-full shadow-lg transition-all duration-300 z-50 whitespace-nowrap
          ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        Morador adicionado
      </div>

    </div>
  );
}
