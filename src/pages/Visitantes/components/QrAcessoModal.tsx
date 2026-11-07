import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Camera, CheckCircle2, Loader2, Search, AlertCircle } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Modal } from '../../../components/UI/Modal';
import api from '../../../services/api';
import { sanitizarEntrada, contemAmeacas } from '../../../utils/security';
import { formatTipoVisitante } from '../VisitantesList';

interface VisitanteResumo {
  id: string;
  nome: string;
  sobrenome: string;
  blocoDestino: string;
  unidadeDestino: string;
  tipo: string;
  status: string;
}

interface QrAcessoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApproved?: () => void;
}

export function QrAcessoModal({ isOpen, onClose, onApproved }: QrAcessoModalProps) {
  const [tab, setTab] = useState<'validar' | 'autocheckin'>('validar');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [encontrado, setEncontrado] = useState<VisitanteResumo | null>(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const pararCamera = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen || tab !== 'validar') {
      pararCamera();
    }
    if (!isOpen) {
      setCodigo('');
      setEncontrado(null);
      setErro('');
      setSucesso('');
    }
    return () => pararCamera();
  }, [isOpen, tab]);

  const consultarCodigo = async (valorBruto: string) => {
    const limpo = sanitizarEntrada(valorBruto.trim(), 120);
    if (!limpo) return;
    if (contemAmeacas(valorBruto)) {
      setErro('Código inválido.');
      return;
    }

    setLoading(true);
    setErro('');
    setSucesso('');
    setEncontrado(null);

    try {
      const res = await api.get('/api/v1/visitantes');
      const lista: VisitanteResumo[] = Array.isArray(res.data) ? res.data : [];
      const match = lista.find(
        (v) =>
          v.id.toLowerCase() === limpo.toLowerCase() ||
          v.id.toLowerCase().startsWith(limpo.toLowerCase())
      );

      if (!match) {
        setErro('Nenhum convite encontrado para este QR / código.');
      } else {
        setEncontrado(match);
      }
    } catch {
      setErro('Não foi possível validar o código no momento.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    consultarCodigo(codigo);
  };

  const iniciarCamera = async () => {
    setErro('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErro('Câmera não disponível neste navegador. Cole ou leia o código com leitor.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      setCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 60);

      const BarcodeDetectorCtor = (window as any).BarcodeDetector;
      if (BarcodeDetectorCtor) {
        const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
        const scanLoop = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              const lido = String(barcodes[0].rawValue);
              setCodigo(lido);
              pararCamera();
              consultarCodigo(lido);
              return;
            }
          } catch {
            // continua escaneando
          }
          rafRef.current = requestAnimationFrame(scanLoop);
        };
        rafRef.current = requestAnimationFrame(scanLoop);
      }
    } catch {
      setErro('Permissão de câmera negada ou indisponível. Digite/escaneie o código abaixo.');
      pararCamera();
    }
  };

  const liberarEntrada = async (id: string) => {
    try {
      setLoading(true);
      setErro('');
      await api.put(`/api/v1/visitantes/${id}/checkin`);
      setSucesso('Entrada liberada com sucesso!');
      setEncontrado((prev) => (prev ? { ...prev, status: 'NO_CONDOMINIO' } : null));
      onApproved?.();
    } catch {
      setErro('Erro ao registrar entrada do visitante.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR de acesso">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-ds-bg border border-ds-border rounded-[12px]">
          <button
            type="button"
            onClick={() => setTab('validar')}
            className={`py-2 px-3 rounded-[9px] text-[12px] font-bold transition-colors cursor-pointer ${
              tab === 'validar'
                ? 'bg-ds-card text-ds-primary border border-ds-border shadow-xs'
                : 'text-ds-dim hover:text-ds-text'
            }`}
          >
            Validar convite
          </button>
          <button
            type="button"
            onClick={() => setTab('autocheckin')}
            className={`py-2 px-3 rounded-[9px] text-[12px] font-bold transition-colors cursor-pointer ${
              tab === 'autocheckin'
                ? 'bg-ds-card text-ds-primary border border-ds-border shadow-xs'
                : 'text-ds-dim hover:text-ds-text'
            }`}
          >
            QR Auto Check-in
          </button>
        </div>

        {tab === 'validar' ? (
          <div className="flex flex-col gap-3.5">
            {cameraActive ? (
              <div className="relative rounded-[14px] overflow-hidden border border-ds-border bg-black aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                <button
                  type="button"
                  onClick={pararCamera}
                  className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-[9px] bg-black/75 text-white text-[11px] font-bold cursor-pointer"
                >
                  Parar câmera
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={iniciarCamera}
                className="w-full py-3 px-4 rounded-[12px] border border-dashed border-ds-border bg-ds-bg hover:border-ds-primary text-ds-text flex items-center justify-center gap-2 text-[12.5px] font-bold transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-ds-primary" />
                Abrir câmera para ler QR
              </button>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-ds-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Código ou UUID do convite..."
                  className="w-full pl-9 pr-3 py-2.5 bg-ds-bg border border-ds-border text-ds-text rounded-[11px] font-mono text-[12px] placeholder:font-sans placeholder:text-ds-faint focus:outline-none focus:border-ds-primary"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !codigo.trim()}
                className="px-4 py-2.5 rounded-[11px] bg-ds-primary text-ds-primary-ink text-[12.5px] font-bold hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validar'}
              </button>
            </form>

            {erro && (
              <div className="p-3 rounded-[11px] bg-ds-danger-dim text-ds-danger text-[12px] font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            {sucesso && (
              <div className="p-3 rounded-[11px] bg-ds-success-dim text-ds-success text-[12px] font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{sucesso}</span>
              </div>
            )}

            {encontrado && (
              <div className="p-3.5 rounded-[14px] border border-ds-border bg-ds-bg flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[13.5px] font-bold text-ds-text m-0">
                      {encontrado.nome} {encontrado.sobrenome !== 'Convidado' ? encontrado.sobrenome : ''}
                    </p>
                    <p className="text-[11px] text-ds-dim m-0 mt-0.5">
                      Bloco {encontrado.blocoDestino} · Apto {encontrado.unidadeDestino}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-ds-primary-dim text-ds-primary uppercase">
                    {formatTipoVisitante(encontrado.tipo)}
                  </span>
                </div>

                {(encontrado.status === 'AGUARDANDO_LIBERACAO' || encontrado.status === 'AGUARDANDO') && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => liberarEntrada(encontrado.id)}
                    className="w-full py-2.5 px-4 rounded-[11px] bg-ds-success text-white text-[12.5px] font-bold hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Permitir entrada
                  </button>
                )}

                {encontrado.status === 'NO_CONDOMINIO' && (
                  <div className="text-[11.5px] font-semibold text-ds-success">
                    Visitante já registrado no condomínio.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <div className="w-10 h-10 rounded-[11px] bg-ds-primary-dim text-ds-primary grid place-items-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13.5px] font-bold text-ds-text m-0">Auto Check-in na Portaria</p>
              <p className="text-[11.5px] text-ds-dim m-0 mt-1">
                Peça para o visitante escanear este QR Code com o celular para solicitar entrada.
              </p>
            </div>
            <div className="bg-white p-3.5 rounded-[16px] border border-ds-border">
              <QRCodeCanvas
                value={`${window.location.origin}/auto-checkin`}
                size={196}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="font-mono text-[10.5px] text-ds-primary bg-ds-primary-dim px-3 py-1.5 rounded-[9px] m-0">
              {window.location.origin}/auto-checkin
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
