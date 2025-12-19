
import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
  title?: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, title = "Prendre une photo" }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Erreur accès caméra:", err);
      setError("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
        <h3 className="text-white font-bold">{title}</h3>
        <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Camera View / Preview */}
      <div className="flex-1 flex items-center justify-center relative bg-black overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-white space-y-4">
            <AlertCircle size={48} className="mx-auto text-red-500" />
            <p className="text-lg font-medium">{error}</p>
            <button onClick={startCamera} className="px-6 py-2 bg-white text-black rounded-xl font-bold">Réessayer</button>
          </div>
        ) : capturedImage ? (
          <img src={capturedImage} className="max-w-full max-h-full object-contain" alt="Capture" />
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover sm:object-contain"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="p-8 bg-black/80 backdrop-blur-xl flex justify-center items-center gap-8 border-t border-white/10">
        {!capturedImage ? (
          <button 
            onClick={takePhoto}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
          >
            <div className="w-16 h-16 border-4 border-black rounded-full" />
          </button>
        ) : (
          <>
            <button 
              onClick={retake}
              className="flex flex-col items-center gap-2 text-white hover:text-mint transition-colors"
            >
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center">
                <RefreshCw size={24} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">Reprendre</span>
            </button>
            <button 
              onClick={confirm}
              className="flex flex-col items-center gap-2 text-white hover:text-mint transition-colors"
            >
              <div className="w-20 h-20 bg-mint rounded-full flex items-center justify-center shadow-lg shadow-mint/20">
                <Check size={32} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">Valider</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
