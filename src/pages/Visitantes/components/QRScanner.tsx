import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
}

export function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode("reader");

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    scannerRef.current.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        onScanSuccess(decodedText);
      },
      (errorMessage) => {
        if (onScanError) onScanError(errorMessage);
      }
    ).catch((err) => {
      console.error("Erro ao iniciar o scanner:", err);
    });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return <div id="reader" className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden border-4 border-blue-500 shadow-xl" />;
}
