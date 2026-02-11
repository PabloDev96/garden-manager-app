import React, { useMemo, useState } from "react";

export default function HoverTooltip({
  label = "",
  children,
  className = "",
  tooltipClassName = "",
  disabled = false,
  mode = "dynamic", // "dynamic" | "auto"
}) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState("top");

  const positionClasses = useMemo(
    () => ({
      top: "bottom-full mb-3 left-1/2 -translate-x-1/2",
      bottom: "top-full mt-3 left-1/2 -translate-x-1/2",
      right: "left-full ml-3 top-1/2 -translate-y-1/2",
      left: "right-full mr-3 top-1/2 -translate-y-1/2",
    }),
    []
  );

  const arrowClasses = useMemo(
    () => ({
      top: "top-full left-1/2 -translate-x-1/2 border-t-[#5B7B7A]",
      bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-[#5B7B7A]",
      right: "right-full top-1/2 -translate-y-1/2 border-r-[#5B7B7A]",
      left: "left-full top-1/2 -translate-y-1/2 border-l-[#5B7B7A]",
    }),
    []
  );

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

  const handleMove = (e) => {
    if (mode === "auto") return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const vx = x / rect.width;
    const vy = y / rect.height;

    if (vy > 0.75) setPosition("bottom");
    else if (vx > 0.65) setPosition("right");
    else if (vx < 0.35) setPosition("left");
    else setPosition("top");
  };

  if (disabled) return children;

  return (
    <div
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
          className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-[#5B7B7A] px-3 py-1.5 text-xs font-bold text-white shadow-xl
            transition-all duration-150 ${positionClasses[position]} ${tooltipClassName}`}
          role="tooltip"
        >
          {label}
          <div
            className={`absolute w-0 h-0 border-[6px] border-transparent ${arrowClasses[position]}`}
          />
        </div>
      )}

      {children}
    </div>
  );
}