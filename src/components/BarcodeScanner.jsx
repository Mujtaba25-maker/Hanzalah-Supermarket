import { useEffect, useRef, useState } from "react";
import { FaBarcode, FaCamera, FaStop } from "react-icons/fa";

export default function BarcodeScanner({ label = "Scan Barcode", value, onChange, onManualSubmit, onDetected, buttonLabel = "Add" }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(0);
  const lastCodeRef = useRef("");
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("");

  const stopCamera = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setActive(false);
  };

  useEffect(() => stopCamera, []);

  const startCamera = async () => {
    if (!("BarcodeDetector" in window)) {
      setStatus("Camera barcode scanning is not supported in this browser. Use the input field or a USB scanner.");
      return;
    }

    try {
      setStatus("Opening camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setActive(true);
      setStatus("Point the camera at the product barcode.");

      const detector = new window.BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"]
      });

      const scanFrame = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          frameRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        try {
          const codes = await detector.detect(videoRef.current);
          const code = codes[0]?.rawValue;
          if (code && code !== lastCodeRef.current) {
            lastCodeRef.current = code;
            setStatus(`Scanned: ${code}`);
            await onDetected(code);
            window.setTimeout(() => {
              if (lastCodeRef.current === code) lastCodeRef.current = "";
            }, 1400);
          }
        } catch {
          setStatus("Scanner could not read the barcode. Try better light or use manual input.");
        }

        frameRef.current = requestAnimationFrame(scanFrame);
      };

      frameRef.current = requestAnimationFrame(scanFrame);
    } catch (error) {
      setStatus(error.message || "Camera permission was blocked.");
      stopCamera();
    }
  };

  return (
    <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
      <div className="flex flex-col gap-3">
        <label className="label text-teal-900">
          {label}
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <input
              className="field bg-white"
              value={value}
              onChange={event => onChange(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter") onManualSubmit(event);
              }}
              placeholder="Focus here and scan product barcode"
            />
            <button onClick={onManualSubmit} className="btn-primary" type="button"><FaBarcode /> {buttonLabel}</button>
            <button onClick={active ? stopCamera : startCamera} className="btn-muted" type="button">
              {active ? <FaStop /> : <FaCamera />}
              {active ? "Stop" : "Camera"}
            </button>
          </div>
        </label>

        <div className={`${active ? "block" : "hidden"} overflow-hidden rounded-xl border border-white/10 bg-black`}>
          <video ref={videoRef} className="h-52 w-full object-cover" muted playsInline />
        </div>

        {status && <p className="rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-neutral-300">{status}</p>}
      </div>
    </div>
  );
}
