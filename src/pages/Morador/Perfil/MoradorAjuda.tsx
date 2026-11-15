import {
  Search,
  Plus,
  MessageSquare,
  BookOpen,
  Mail,
  PhoneCall,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import {
  BottomSheet,
  Button,
  GroupedList,
  IconChip,
  ListRow,
  PageHead,
} from '../../../components/ui';

const faqs = [
  {
    q: 'Como funciona a aprovação de reservas?',
    a: 'Toda reserva de área comum fica com status PENDENTE até o síndico analisar, em até 48h. O valor, se houver, entra automaticamente no seu próximo boleto após a aprovação.',
  },
  {
    q: 'Quando meu boleto é gerado?',
    a: 'Os boletos são gerados todo início de mês, com vencimento no dia 10. Você recebe um aviso assim que ele fica disponível na aba Boletos.',
  },
  {
    q: 'Como cadastro meu veículo ou pet?',
    a: 'No seu Perfil, em "Meus veículos" ou "Meus pets", toque no botão + e preencha os dados. Pets: cor e foto ajudam a portaria a identificar em caso de ocorrência.',
  },
  {
    q: 'Por que não recebi uma notificação?',
    a: 'Confira em Perfil > Notificações se o canal daquele tipo de aviso está ativado. Avisos de emergência sempre chegam, os demais dependem da sua configuração.',
  },
  {
    q: 'Posso dar acesso ao app pra outro morador?',
    a: 'Sim. Em "Moradores adicionais", cadastre a pessoa dependente da sua unidade. O síndico poderá emitir credenciais individuais sob demanda.',
  },
];

export function MoradorAjuda() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [modalDoc, setModalDoc] = useState<'regimento' | 'convencao' | null>(null);

  const filteredFaqs = useMemo(() => {
    if (!searchTerm.trim()) return faqs;
    return faqs.filter((f) => f.q.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm]);

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="bg-canvas min-h-full flex flex-col text-ink pb-10">
      <PageHead title="Central de ajuda" onBack={() => navigate(-1)}>
        <div className="relative mb-2">
          <Search className="w-4 h-4 text-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar em perguntas frequentes"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-[44px] bg-surface border border-line rounded-[11px] pl-10 pr-4 text-[13.5px] text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-brand"
          />
        </div>
      </PageHead>

      <main className="px-[18px] flex-1 space-y-6 mt-3">
        {/* Perguntas frequentes */}
        <section>
          <p className="text-[11px] font-bold text-faint uppercase tracking-[0.06em] mb-2 pl-1">
            Perguntas frequentes
          </p>
          <GroupedList>
            {filteredFaqs.length === 0 ? (
              <div className="p-6 text-center text-[13px] text-dim">
                Nenhuma pergunta encontrada.
              </div>
            ) : (
              filteredFaqs.map((faq, i) => {
                const isOpen = openIndex === i;
                return (
                  <div key={faq.q} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => toggleFaq(i)}
                      className="flex justify-between items-center px-4 py-3.5 w-full text-left hover:bg-canvas transition-colors cursor-pointer"
                    >
                      <span className="text-[13.5px] font-bold text-ink pr-3 leading-snug">
                        {faq.q}
                      </span>
                      <div
                        className={`w-[26px] h-[26px] rounded-[8px] bg-canvas border border-line flex items-center justify-center text-ink shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-45' : ''
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-0 text-[12.5px] leading-relaxed text-dim">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </GroupedList>
        </section>

        {/* Canais Oficiais */}
        <section>
          <p className="text-[11px] font-bold text-faint uppercase tracking-[0.06em] mb-2 pl-1">
            Canais oficiais
          </p>
          <GroupedList>
            <ListRow
              icon={
                <IconChip tone="neutral">
                  <MessageSquare className="w-[18px] h-[18px]" />
                </IconChip>
              }
              title="Falar com o síndico"
              subtitle="Abrir chamado via ouvidoria"
              showChevron
              onClick={() => navigate('/app/ouvidoria')}
            />
            <a href="tel:0800000000" className="block">
              <ListRow
                icon={
                  <IconChip tone="neutral">
                    <PhoneCall className="w-[18px] h-[18px]" />
                  </IconChip>
                }
                title="Ligar para portaria"
                subtitle="Atendimento 24h"
                showChevron
              />
            </a>
          </GroupedList>
        </section>

        {/* Documentos */}
        <section>
          <p className="text-[11px] font-bold text-faint uppercase tracking-[0.06em] mb-2 pl-1">
            Documentos
          </p>
          <GroupedList>
            <ListRow
              icon={
                <IconChip tone="neutral">
                  <BookOpen className="w-[18px] h-[18px]" />
                </IconChip>
              }
              title="Regimento interno"
              subtitle="Normas de convivência e horários"
              showChevron
              onClick={() => setModalDoc('regimento')}
            />
            <ListRow
              icon={
                <IconChip tone="neutral">
                  <FileText className="w-[18px] h-[18px]" />
                </IconChip>
              }
              title="Convenção do condomínio"
              subtitle="Estatuto, direitos e quóruns legais"
              showChevron
              onClick={() => setModalDoc('convencao')}
            />
          </GroupedList>
        </section>

        {/* Card de Suporte */}
        <div className="bg-brand-soft border border-brand/20 rounded-[14px] p-4">
          <div className="w-9 h-9 rounded-[10px] bg-surface text-brand flex items-center justify-center mb-3">
            <Mail className="w-[18px] h-[18px]" />
          </div>
          <h2 className="text-[14.5px] font-extrabold text-brand mb-1">Problemas com o app?</h2>
          <p className="text-[12.5px] text-ink/80 leading-relaxed mb-3.5">
            Encontrou um bug ou algo que não funciona como deveria? Manda pra gente com print, se puder.
          </p>
          <a
            href="mailto:suporte@condoeconomy.com"
            className="inline-flex items-center justify-center bg-surface text-brand border border-line px-4 py-2 rounded-[9px] font-bold text-[12.5px] hover:bg-canvas transition-colors"
          >
            Enviar e-mail
          </a>
        </div>

        <div className="text-center font-mono text-[10.5px] font-semibold text-faint tracking-wider pt-2">
          CONDOECONOMY — V1.0.0
        </div>
      </main>

      {/* Sheet de Leitura de Documento */}
      <BottomSheet
        open={modalDoc !== null}
        onClose={() => setModalDoc(null)}
        title={modalDoc === 'regimento' ? 'Regimento Interno' : 'Convenção do Condomínio'}
        footer={
          <div className="col-span-2">
            <Button variant="primary" fullWidth onClick={() => setModalDoc(null)}>
              Fechar Leitura
            </Button>
          </div>
        }
      >
        <div className="space-y-3 mt-2 text-[12.5px] leading-relaxed">
          {modalDoc === 'regimento' ? (
            <>
              <div className="p-3 bg-canvas border border-line rounded-[12px]">
                <p className="font-bold text-brand mb-1">Capítulo I — Do Silêncio e Convivência</p>
                <p className="text-dim">
                  É vedado ruído excessivo das 22h às 08h de segunda a sexta, e até às 09h aos sábados e domingos. Obras ruidosas são permitidas exclusivamente em dias úteis das 08h às 17h.
                </p>
              </div>
              <div className="p-3 bg-canvas border border-line rounded-[12px]">
                <p className="font-bold text-brand mb-1">Capítulo II — Áreas Comuns e Reservas</p>
                <p className="text-dim">
                  O uso do Salão de Festas e Churrasqueira requer solicitação prévia via aplicativo com lista de convidados para controle de portaria. O titular responde por danos ao patrimônio.
                </p>
              </div>
              <div className="p-3 bg-canvas border border-line rounded-[12px]">
                <p className="font-bold text-brand mb-1">Capítulo III — Animais de Estimação (Pets)</p>
                <p className="text-dim">
                  Circulação de pets permitida nas áreas comuns com coleira/guia e acompanhados por responsável. Obrigatório o recolhimento imediato de dejetos.
                </p>
              </div>
              <div className="p-3 bg-canvas border border-line rounded-[12px]">
                <p className="font-bold text-brand mb-1">Capítulo IV — Coleta de Lixo e Estacionamento</p>
                <p className="text-dim">
                  Lixo deve ser ensacado e depositado nos contentores designados. Vagas de garagem são privativas da unidade cadastrada no sistema.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-canvas border border-line rounded-[12px]">
                <p className="font-bold text-brand mb-1">Artigo 1º — Constituição e Finalidade</p>
                <p className="text-dim">
                  O Condomínio Residencial destina-se exclusivamente a fins residenciais unifamiliares, regendo-se pela Lei nº 4.591/64 e Código Civil Brasileiro (Lei 10.406/2002).
                </p>
              </div>
              <div className="p-3 bg-canvas border border-line rounded-[12px]">
                <p className="font-bold text-brand mb-1">Artigo 2º — Direitos e Deveres dos Condôminos</p>
                <p className="text-dim">
                  São deveres: contribuir tempestivamente para a cota condominial ordinária e extraordinária fixada em assembleia; não realizar obras que comprometam a segurança estrutural da edificação.
                </p>
              </div>
              <div className="p-3 bg-canvas border border-line rounded-[12px]">
                <p className="font-bold text-brand mb-1">Artigo 3º — Assembleias e Direito a Voto</p>
                <p className="text-dim">
                  Conforme o Art. 1.335, III do Código Civil, votam nas Assembleias Gerais (presenciais ou eletrônicas) apenas os condôminos adimplentes e quites com as taxas condominiais.
                </p>
              </div>
              <div className="p-3 bg-canvas border border-line rounded-[12px]">
                <p className="font-bold text-brand mb-1">Artigo 4º — Da Administração e Prestação de Contas</p>
                <p className="text-dim">
                  Compete ao Síndico representar o condomínio ativa e passivamente, praticando os atos necessários à defesa dos interesses comuns e prestando contas anualmente.
                </p>
              </div>
            </>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
