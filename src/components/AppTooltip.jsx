import React from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

export default function AppTooltip({
  content,
  children,
  placement = "top",
  disabled = false,
}) {
  if (disabled) return children;

  return (
    <>
      <style>{`
        .tippy-box[data-theme~="garden"] {
          background: rgba(91, 123, 122, 0.96); /* #5B7B7A */
          color: #fff;
          border: 2px solid rgba(206, 181, 167, 0.55); /* #CEB5A7 */
          border-radius: 10px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .tippy-box[data-theme~="garden"] .tippy-content {
          padding: 8px 10px;
          font-size: 12px;
          line-height: 1.1;
          font-weight: 700;
          text-align: center;
          letter-spacing: 0.2px;
        }

        .tippy-box[data-theme~="garden"] .tippy-arrow {
          color: rgba(91, 123, 122, 0.96);
        }

        /* ✅ Fade in / out REAL */
        .tippy-box[data-theme~="garden"][data-state="hidden"] {
          opacity: 0;
          transform: translateY(2px) scale(0.98);
        }

        .tippy-box[data-theme~="garden"][data-state="visible"] {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      `}</style>

      <Tippy
        content={content}
        theme="garden"
        placement={placement}
        animation="fade"
        duration={[180, 140]}
        delay={[120, 60]}
        offset={[0, 10]}
        interactive={false}
        hideOnClick={false}
        appendTo={() => document.body}
      >
        {/* Wrapper necesario para botones disabled */}
        <span className="inline-flex">
          {children}
        </span>
      </Tippy>
    </>
  );
}