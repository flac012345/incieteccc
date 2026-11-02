import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Contrast, ZoomIn, ZoomOut } from 'lucide-react';

/** Barra flotante de accesibilidad (tamaño de texto y contraste), similar a los portales distritales. */
export const AccessibilityBar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [scale, setScale] = useState(100);
  const [contrast, setContrast] = useState(false);

  useEffect(() => {
    document.documentElement.style.fontSize = `${scale}%`;
  }, [scale]);

  useEffect(() => {
    document.documentElement.classList.toggle('hc', contrast);
  }, [contrast]);

  const btn =
    'grid place-items-center h-8 w-8 rounded-md bg-white text-gov hover:bg-sun hover:text-navy transition';

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center" aria-label="Opciones de accesibilidad">
      <div
        className={`flex flex-col gap-1.5 rounded-r-xl bg-gov p-1.5 shadow-xl transition-all duration-300 ${
          collapsed ? '-translate-x-full opacity-0 pointer-events-none' : ''
        }`}
      >
        <button id="a11y-collapse" className={btn} onClick={() => setCollapsed(true)} title="Ocultar">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button id="a11y-font-up" className={btn} onClick={() => setScale((s) => Math.min(130, s + 10))} title="Aumentar texto">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button id="a11y-font-down" className={btn} onClick={() => setScale((s) => Math.max(80, s - 10))} title="Disminuir texto">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="a11y-contrast"
          className={`${btn} ${contrast ? '!bg-sun !text-navy' : ''}`}
          onClick={() => setContrast(!contrast)}
          title="Alto contraste"
        >
          <Contrast className="w-4 h-4" />
        </button>
      </div>
      {collapsed && (
        <button
          id="a11y-expand"
          onClick={() => setCollapsed(false)}
          className="absolute left-0 rounded-r-lg bg-gov text-white p-1.5 shadow-lg"
          title="Mostrar accesibilidad"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
