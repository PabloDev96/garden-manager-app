import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Devuelve un ref para medir el contenedor y un cellSize (px) que intenta ser "preferred",
 * pero si no cabe, reduce hasta "min".
 *
 * Si aun así no cabe el grid completo, el contenedor con overflow-x-auto mostrará scroll.
 */
export default function useCellSize({ cols, gapPx = 8, preferred = 56, min = 24 }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;

    // Por si ejecutas en entornos sin ResizeObserver
    if (typeof ResizeObserver === "undefined") {
      setWidth(ref.current.getBoundingClientRect().width || 0);
      return;
    }

    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });

    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const cellSize = useMemo(() => {
    if (!width || !cols) return preferred;

    const gapsTotal = gapPx * (cols - 1);
    const available = Math.max(0, width - gapsTotal);

    // Tamaño máximo para que quepan "cols" celdas
    const fit = Math.floor(available / cols);

    // Queremos preferred, pero si no cabe, bajamos hasta min
    return Math.max(min, Math.min(preferred, fit));
  }, [width, cols, gapPx, preferred, min]);

  return { ref, cellSize };
}