import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Eye, Sliders, CloudRain, ShieldAlert, Activity } from 'lucide-react';

interface RealTimeLandslideCanvasProps {
  zoneName: string;
  threatLevel: string;
  rainIntensity: number;
  onAdjustGeotech: () => void;
}

export const RealTimeLandslideCanvas: React.FC<RealTimeLandslideCanvasProps> = ({
  zoneName,
  threatLevel,
  rainIntensity,
  onAdjustGeotech,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simTime, setSimTime] = useState(0); // 0 a 20 segundos
  const [viewFilter, setViewFilter] = useState<'normal' | 'thermal' | 'velocity'>('normal');

  const simTimeRef = useRef(0);
  const isPlayingRef = useRef(true);
  const viewFilterRef = useRef(viewFilter);
  viewFilterRef.current = viewFilter;
  isPlayingRef.current = isPlaying;

  // Estado de partículas de escombros y polvo
  const rocksRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; rot: number; vrot: number; color: string; alive: boolean }>>([]);
  const dustRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number; maxAlpha: number }>>([]);
  const rainDropsRef = useRef<Array<{ x: number; y: number; speed: number; len: number }>>([]);

  // Cargar imagen base
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/realistic_landslide.jpg';
    img.onload = () => {
      bgImageRef.current = img;
    };
  }, []);

  // Inicializar lluvia
  useEffect(() => {
    const drops = [];
    for (let i = 0; i < 450; i++) {
      drops.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        speed: 24 + Math.random() * 18,
        len: 16 + Math.random() * 22,
      });
    }
    rainDropsRef.current = drops;
  }, []);

  // Bucle de animación en Canvas a 60 FPS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = timestamp;

      if (isPlayingRef.current) {
        simTimeRef.current += dt;
        if (simTimeRef.current > 20) {
          simTimeRef.current = 0; // bucle continuo suave
          rocksRef.current = [];
          dustRef.current = [];
        }
        setSimTime(Number(simTimeRef.current.toFixed(1)));
      }

      const t = simTimeRef.current;
      const w = canvas.width;
      const h = canvas.height;

      // 1. DIBUJAR IMAGEN BASE O FONDO
      ctx.clearRect(0, 0, w, h);

      if (bgImageRef.current && bgImageRef.current.complete) {
        // Leve temblor sísmico cuando la masa está en movimiento máximo (entre t=6 y t=15)
        let shakeX = 0;
        let shakeY = 0;
        if (t > 4 && t < 16) {
          const intensity = Math.sin(t * 25) * (t < 10 ? (t - 4) * 0.8 : (16 - t) * 0.8);
          shakeX = (Math.random() - 0.5) * intensity * 5;
          shakeY = (Math.random() - 0.5) * intensity * 5;
        }

        ctx.drawImage(bgImageRef.current, shakeX, shakeY, w, h);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);
      }

      // 2. SIMULACIÓN DEL DESPRENDIMIENTO EN TIEMPO REAL (MASA DE SUELO)
      // Definimos la trayectoria de la ladera: desde la cabecera (aprox x: 25% w, y: 15% h) hasta el valle (x: 60% w, y: 75% h)
      const slideStart = { x: w * 0.28, y: h * 0.22 };
      const slideEnd = { x: w * 0.62, y: h * 0.72 };

      // Movimiento no lineal acelerado por gravedad
      let slideProgress = 0;
      if (t > 3) {
        // Empieza a romperse a los 3 segundos
        const normalized = Math.min((t - 3) / 10, 1);
        slideProgress = Math.pow(normalized, 1.8); // aceleración gravitacional
      }

      const curSlideX = slideStart.x + (slideEnd.x - slideStart.x) * slideProgress;
      const curSlideY = slideStart.y + (slideEnd.y - slideStart.y) * slideProgress;

      // Si está en movimiento, generamos escombros de roca y polvo continuo
      if (t > 3.5 && t < 17 && isPlayingRef.current) {
        // Generar rocas rodantes ladera abajo
        for (let i = 0; i < 3; i++) {
          const angle = Math.PI * 0.28 + (Math.random() - 0.5) * 0.4;
          const speed = 180 + Math.random() * 320;
          rocksRef.current.push({
            x: curSlideX + (Math.random() - 0.5) * (w * 0.15),
            y: curSlideY + (Math.random() - 0.5) * (h * 0.1),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 6 + Math.random() * 16,
            rot: Math.random() * Math.PI * 2,
            vrot: (Math.random() - 0.5) * 8,
            color: Math.random() > 0.5 ? '#453223' : '#6b5744',
            alive: true,
          });
        }

        // Generar partículas de nube de polvo / alud
        for (let i = 0; i < 5; i++) {
          dustRef.current.push({
            x: curSlideX + (Math.random() - 0.5) * (w * 0.18),
            y: curSlideY + (Math.random() - 0.5) * (h * 0.12),
            vx: (Math.random() - 0.2) * 90 + 40,
            vy: (Math.random() - 0.5) * 60 - 20,
            size: 25 + Math.random() * 50,
            alpha: 0.5,
            maxAlpha: 0.4 + Math.random() * 0.3,
          });
        }
      }

      // 3. DIBUJAR FLUJO DE MASA DE BARRO Y ROCAS EN TIEMPO REAL
      if (slideProgress > 0) {
        ctx.save();

        // Capa de lodo activo bajando por el canal del escarpe
        const gradient = ctx.createLinearGradient(slideStart.x, slideStart.y, curSlideX, curSlideY);
        gradient.addColorStop(0, 'rgba(56, 40, 27, 0.85)');
        gradient.addColorStop(0.5, 'rgba(92, 68, 47, 0.9)');
        gradient.addColorStop(1, 'rgba(74, 52, 35, 0.95)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Polígono dinámico del flujo de lodo
        const widthTop = w * 0.12 * Math.min(1, slideProgress * 1.5);
        const widthBottom = w * 0.24 * Math.min(1.4, slideProgress * 1.2);

        ctx.moveTo(slideStart.x - widthTop * 0.5, slideStart.y);
        ctx.lineTo(slideStart.x + widthTop * 0.5, slideStart.y);
        // Borde ondulado de lodo
        const segments = 8;
        for (let i = 1; i <= segments; i++) {
          const ratio = i / segments;
          const px = slideStart.x + (curSlideX - slideStart.x) * ratio + widthBottom * 0.5 * ratio;
          const py = slideStart.y + (curSlideY - slideStart.y) * ratio + Math.sin(t * 8 + i) * 6;
          ctx.lineTo(px, py);
        }
        for (let i = segments; i >= 0; i--) {
          const ratio = i / segments;
          const px = slideStart.x + (curSlideX - slideStart.x) * ratio - widthBottom * 0.5 * ratio;
          const py = slideStart.y + (curSlideY - slideStart.y) * ratio + Math.cos(t * 8 + i) * 6;
          ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // 4. DIBUJAR ROCAS REBOTANDO Y RODANDO
        for (let i = rocksRef.current.length - 1; i >= 0; i--) {
          const r = rocksRef.current[i];
          r.x += r.vx * dt;
          r.y += r.vy * dt;
          r.vy += 450 * dt; // gravedad
          r.rot += r.vrot * dt;

          if (r.y > h * 0.95 || r.x > w) {
            rocksRef.current.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.translate(r.x, r.y);
          ctx.rotate(r.rot);
          ctx.fillStyle = r.color;
          ctx.beginPath();
          ctx.rect(-r.size / 2, -r.size / 2, r.size, r.size * 0.8);
          ctx.fill();
          // Sombra de la roca
          ctx.strokeStyle = '#1e140d';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }

        // 5. DIBUJAR NUBE DE POLVO Y AVALANCHA (Aerosol y escombros)
        for (let i = dustRef.current.length - 1; i >= 0; i--) {
          const d = dustRef.current[i];
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          d.size += 45 * dt;
          d.alpha -= 0.15 * dt;

          if (d.alpha <= 0) {
            dustRef.current.splice(i, 1);
            continue;
          }

          const dustGrad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.size);
          dustGrad.addColorStop(0, `rgba(140, 110, 85, ${d.alpha})`);
          dustGrad.addColorStop(0.6, `rgba(110, 85, 65, ${d.alpha * 0.6})`);
          dustGrad.addColorStop(1, 'rgba(80, 60, 45, 0)');

          ctx.fillStyle = dustGrad;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // 6. DEPOSICIÓN FINAL Y SEPULTAMIENTO SOBRE EL VALLE (t > 12)
      if (t > 11) {
        ctx.save();
        const depositRatio = Math.min((t - 11) / 5, 1);
        const conoW = w * 0.35 * depositRatio;
        const conoH = h * 0.18 * depositRatio;

        const depositGrad = ctx.createRadialGradient(
          slideEnd.x, slideEnd.y + conoH * 0.3, 0,
          slideEnd.x, slideEnd.y + conoH * 0.3, conoW
        );
        depositGrad.addColorStop(0, 'rgba(45, 32, 22, 0.96)');
        depositGrad.addColorStop(0.7, 'rgba(78, 58, 40, 0.9)');
        depositGrad.addColorStop(1, 'rgba(45, 32, 22, 0)');

        ctx.fillStyle = depositGrad;
        ctx.beginPath();
        ctx.ellipse(slideEnd.x, slideEnd.y + conoH * 0.3, conoW, conoH, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 7. LLUVIA TORRENCIAL EN TIEMPO REAL
      ctx.save();
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (const drop of rainDropsRef.current) {
        drop.y += drop.speed;
        drop.x += drop.speed * 0.25; // viento diagonal
        if (drop.y > h) {
          drop.y = -drop.len;
          drop.x = Math.random() * w;
        }
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.len * 0.25, drop.y + drop.len);
      }
      ctx.stroke();
      ctx.restore();

      // 8. RELÁMPAGO OCASIONAL ILUMINANDO EL LIENZO
      if (Math.sin(t * 12) > 0.94 && t > 2) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(0, 0, w, h);
      }

      // 9. FILTRO TÉRMICO / RADAR SI ESTÁ ACTIVO
      if (viewFilterRef.current === 'thermal') {
        ctx.save();
        ctx.globalCompositeOperation = 'difference';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      } else if (viewFilterRef.current === 'velocity') {
        // Resaltar vector de velocidad de la masa
        ctx.save();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(curSlideX, curSlideY);
        ctx.lineTo(curSlideX + (slideEnd.x - slideStart.x) * 0.2, curSlideY + (slideEnd.y - slideStart.y) * 0.2);
        ctx.stroke();
        ctx.fillStyle = '#22c55e';
        ctx.font = '12px monospace';
        ctx.fillText(`VEL: ${(slideProgress * 38).toFixed(1)} m/s (136 km/h)`, curSlideX + 15, curSlideY);
        ctx.restore();
      }
    };

    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, []);

  // Fases descriptivas
  const getPhaseInfo = (time: number) => {
    if (time < 3) return { stage: 'FASE 1: PRE-FALLA E INFILTRACIÓN', desc: 'Precipitación extrema de 95 mm/h. El nivel freático sube y la presión de poros anula la cohesión del suelo.', alert: 'VIGILANCIA' };
    if (time < 8) return { stage: 'FASE 2: RUPTURA Y FRACTURA DE CORONA', desc: 'Apertura de la grieta de tracción en la cabecera. La masa de 45.000 m³ se desprende y comienza a deslizarse.', alert: 'FALLA INMINENTE' };
    if (time < 15) return { stage: 'FASE 3: AVALANCHA DE DETRITOS EN MOVIMIENTO', desc: 'La masa se acelera a más de 35 m/s por la pendiente transportando rocas gigantescas y lodo desintegrado.', alert: 'COLAPSO ACTIVO' };
    return { stage: 'FASE 4: IMPACTO EN VALLE Y SEPULTAMIENTO', desc: 'Depósito masivo en abanico aluvial sobre la vía y viviendas al pie de la ladera.', alert: 'ZONA SEPULTADA' };
  };

  const phase = getPhaseInfo(simTime);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col select-none font-sans">
      {/* CONTENEDOR DEL CANVAS DE ALTA VELOCIDAD */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="w-full h-full object-cover"
        />

        {/* TELEMETRÍA MILITAR / CIENTÍFICA EN VIVO */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
          <div className="flex items-center gap-2 bg-black/85 border border-red-500/80 px-3 py-1.5 rounded-xl text-white font-mono text-xs backdrop-blur-md shadow-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span className="font-bold tracking-widest text-red-400">DESLIZAMIENTO EN TIEMPO REAL · FÍSICA ACTIVA</span>
            <span className="text-slate-500">|</span>
            <span className="text-white font-bold">{zoneName.toUpperCase()}</span>
          </div>

          <div className="bg-black/85 border border-slate-700/80 px-3.5 py-2.5 rounded-xl text-[11px] font-mono text-slate-200 backdrop-blur-md space-y-1.5 shadow-2xl">
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">ESTADO DE TALUD:</span>
              <span className="text-red-400 font-bold">{phase.alert}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">VELOCIDAD MASA:</span>
              <span className="text-amber-400 font-bold">
                {simTime > 3 ? `${Math.min(38, Math.pow((simTime - 3) / 10, 1.8) * 38).toFixed(1)} m/s` : '0.0 m/s'}
              </span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">VOLUMEN DESPRENDIDO:</span>
              <span className="text-emerald-400 font-bold">
                {simTime > 3 ? `${Math.min(45200, Math.round(Math.pow((simTime - 3) / 10, 1.5) * 45200))} m³` : '0 m³'}
              </span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">PRECIPITACIÓN:</span>
              <span className="text-blue-400 font-bold">{rainIntensity > 0 ? rainIntensity : 95} mm/h</span>
            </div>
          </div>
        </div>

        {/* TARJETA INFORMATIVA DE LA FASE ACTIVA */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-xl bg-black/90 border border-red-500/80 rounded-2xl p-4 text-center backdrop-blur-xl shadow-2xl space-y-1">
          <div className="text-xs font-black tracking-widest text-red-400 uppercase">{phase.stage}</div>
          <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">{phase.desc}</p>
        </div>

        {/* SELECTORES DE VISIÓN SUPERIOR DERECHA */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={() => setViewFilter(viewFilter === 'normal' ? 'velocity' : viewFilter === 'velocity' ? 'thermal' : 'normal')}
            className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-white text-xs font-mono font-bold transition shadow-xl backdrop-blur-md"
          >
            MODO: {viewFilter.toUpperCase()}
          </button>
          <button
            onClick={onAdjustGeotech}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xl"
          >
            Ajustar Geotecnia
          </button>
        </div>
      </div>

      {/* CONTROLES DE LÍNEA DE TIEMPO Y REPRODUCCIÓN */}
      <div className="h-20 bg-slate-950 border-t border-slate-800 px-4 md:px-8 flex items-center justify-between gap-4 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition"
            title={isPlaying ? 'Pausar' : 'Reanudar'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button
            onClick={() => {
              simTimeRef.current = 0;
              setSimTime(0);
              rocksRef.current = [];
              dustRef.current = [];
              setIsPlaying(true);
            }}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
            title="Reiniciar Deslizamiento"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de progreso de la catástrofe */}
        <div className="flex-1 max-w-2xl flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Inicio Ruptura (0s)</span>
            <span className="text-red-400 font-bold">Desprendimiento y Avalancha (8s)</span>
            <span>Sepultamiento Valle (20s)</span>
          </div>
          <div
            className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              simTimeRef.current = Number((pct * 20).toFixed(1));
              setSimTime(simTimeRef.current);
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-rose-600 to-red-600 transition-all duration-75"
              style={{ width: `${(simTime / 20) * 100}%` }}
            />
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-300 font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
            {simTime}s / 20.0s
          </span>
        </div>
      </div>
    </div>
  );
};
