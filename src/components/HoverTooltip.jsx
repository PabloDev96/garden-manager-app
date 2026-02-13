import React, { useLayoutEffect, useMemo, useRef, useState } from "react";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export default function HoverTooltip({
  label = "",
  children,
  className = "",
  tooltipClassName = "",
  disabled = false,
  mode = "dynamic", // "dynamic" | "auto"
  offset = 12,      // separación del tooltip respecto al wrapper
  arrowSize = 6,    // tamaño de la flecha (px)
}) {
  const wrapperRef = useRef(null);
  const tooltipRef = useRef(null);

  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState("top"); // top|bottom|left|right

  // mouse dentro del wrapper (px)
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // tamaño real del tooltip (para flip sin meterlo dentro)
  const [ttSize, setTtSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    if (!visible) return;
    const el = tooltipRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    setTtSize({ w: r.width, h: r.height });
  }, [visible, label]);

  const detectAutoPosition = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceTop = rect.top;
    const spaceBottom = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;

    const maxSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);

    if (maxSpace === spaceTop) setPosition("top");
    else if (maxSpace === spaceBottom) setPosition("bottom");
    else if (maxSpace === spaceRight) setPosition("right");
    else setPosition("left");
  };

  const detectDynamicSide = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const vx = x / rect.width;   // 0..1
    const vy = y / rect.height;  // 0..1

    // prioridad vertical: arriba/abajo ganan a lateral
    if (vy < 0.10) setPosition("top");
    else if (vy > 0.90) setPosition("bottom");
    else if (vx > 0.65) setPosition("right");
    else if (vx < 0.35) setPosition("left");
    else setPosition("top");
  };

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMouse({ x, y });

    if (mode !== "auto") detectDynamicSide(e);
  };

  const baseTooltipClass =
    "pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-[#5B7B7A] px-3 py-1.5 text-xs font-bold text-white shadow-xl";

  // ✅ Calculamos el ancla (ax, ay) UNA vez y lo reutilizamos
  const anchor = useMemo(() => {
    const wrap = wrapperRef.current?.getBoundingClientRect();
    if (!wrap) return { ax: 0, ay: 0, w: 0, h: 0 };

    const w = wrap.width;
    const h = wrap.height;

    const pad = 10;
    const ax = clamp(mouse.x, pad, Math.max(pad, w - pad));
    const ay = clamp(mouse.y, pad, Math.max(pad, h - pad));

    return { ax, ay, w, h };
  }, [mouse.x, mouse.y]);

  // ---- FLIP SOLO SI SE SALE DE PANTALLA (manteniendo tooltip fuera) ----
  const opposite = (p) => {
    switch (p) {
      case "top":
        return "bottom";
      case "bottom":
        return "top";
      case "left":
        return "right";
      case "right":
        return "left";
      default:
        return "top";
    }
  };

  const effectivePosition = useMemo(() => {
    const wr = wrapperRef.current?.getBoundingClientRect();
    if (!wr) return position;

    const { ax, ay } = anchor;
    const w = ttSize.w;
    const h = ttSize.h;

    // Si aún no sabemos tamaño, no intentamos flip
    if (!w || !h) return position;

    const fits = (pos) => {
      let left, top;

      if (pos === "right") {
        left = wr.right + offset;      // fuera a la derecha
        top = wr.top + ay - h / 2;     // centrado en Y del ratón
      } else if (pos === "left") {
        left = wr.left - offset - w;   // fuera a la izquierda
        top = wr.top + ay - h / 2;
      } else if (pos === "bottom") {
        left = wr.left + ax - w / 2;   // centrado en X del ratón
        top = wr.bottom + offset;      // fuera abajo
      } else {
        // top
        left = wr.left + ax - w / 2;
        top = wr.top - offset - h;     // fuera arriba
      }

      const right = left + w;
      const bottom = top + h;

      return (
        left >= 0 &&
        top >= 0 &&
        right <= window.innerWidth &&
        bottom <= window.innerHeight
      );
    };

    // Preferida
    if (fits(position)) return position;

    // Flip al lado opuesto si cabe
    const flipped = opposite(position);
    if (fits(flipped)) return flipped;

    // Si tampoco cabe (pantalla muy pequeña), mantén la original
    return position;
  }, [position, anchor, ttSize.w, ttSize.h, offset]);

  // estilos dinámicos del tooltip (posición exacta) — ahora usa effectivePosition
  const tooltipStyle = useMemo(() => {
    const { ax, ay } = anchor;

    switch (effectivePosition) {
      case "right":
        return {
          left: "100%",
          top: ay,
          marginLeft: offset,
          transform: "translateY(-50%)",
        };
      case "left":
        return {
          right: "100%",
          top: ay,
          marginRight: offset,
          transform: "translateY(-50%)",
        };
      case "bottom":
        return {
          top: "100%",
          left: ax,
          marginTop: offset,
          transform: "translateX(-50%)",
        };
      case "top":
      default:
        return {
          bottom: "100%",
          left: ax,
          marginBottom: offset,
          transform: "translateX(-50%)",
        };
    }
  }, [anchor, effectivePosition, offset]);

  // ✅ Flecha en px dentro del tooltip (se mueve EXACTO con el tooltip)
  const arrowStyle = useMemo(() => {
    const tt = tooltipRef.current?.getBoundingClientRect();
    const wr = wrapperRef.current?.getBoundingClientRect();
    if (!tt || !wr) return {};

    const { ax, ay } = anchor;

    // posición del ancla en viewport (px)
    const anchorClientX = wr.left + ax;
    const anchorClientY = wr.top + ay;

    // anchor dentro del tooltip en px
    const localX = anchorClientX - tt.left;
    const localY = anchorClientY - tt.top;

    const padding = 10; // evita esquinas en tooltip
    const safeX = clamp(localX, padding, Math.max(padding, tt.width - padding));
    const safeY = clamp(localY, padding, Math.max(padding, tt.height - padding));

    const base = { borderWidth: arrowSize };

    switch (effectivePosition) {
      case "right":
        return { ...base, right: "100%", top: safeY, transform: "translateY(-50%)" };
      case "left":
        return { ...base, left: "100%", top: safeY, transform: "translateY(-50%)" };
      case "bottom":
        return { ...base, bottom: "100%", left: safeX, transform: "translateX(-50%)" };
      case "top":
      default:
        return { ...base, top: "100%", left: safeX, transform: "translateX(-50%)" };
    }
  }, [anchor, effectivePosition, arrowSize, ttSize.w, ttSize.h]);

  const arrowClass = useMemo(() => {
    // triángulo con borders
    switch (effectivePosition) {
      case "right":
        return "border-y-transparent border-l-transparent border-r-[#5B7B7A]";
      case "left":
        return "border-y-transparent border-r-transparent border-l-[#5B7B7A]";
      case "bottom":
        return "border-x-transparent border-t-transparent border-b-[#5B7B7A]";
      case "top":
      default:
        return "border-x-transparent border-b-transparent border-t-[#5B7B7A]";
    }
  }, [effectivePosition]);

  if (disabled) return children;

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
      onMouseEnter={(e) => {
        setVisible(true);
        if (mode === "auto") detectAutoPosition(e);
      }}
      onMouseLeave={() => setVisible(false)}
      onMouseMove={handleMove}
    >
      {visible && !!label && (
        <div
          ref={tooltipRef}
          className={`${baseTooltipClass} ${tooltipClassName}`}
          style={tooltipStyle}
          role="tooltip"
        >
          {label}

          {/* Flecha */}
          <div
            className={`absolute w-0 h-0 border-transparent ${arrowClass}`}
            style={arrowStyle}
          />
        </div>
      )}

      {children}
    </div>
  );
}