import { useEffect, useMemo, useRef, useState } from "react";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const rectNorm = (r) => ({
    left: Math.min(r.x1, r.x2),
    top: Math.min(r.y1, r.y2),
    right: Math.max(r.x1, r.x2),
    bottom: Math.max(r.y1, r.y2),
});

export default function useGridSelection({ gridWrapRef }) {
    const cellRefs = useRef({});

    // Pointer
    const pointerIdRef = useRef(null);
    const didCaptureRef = useRef(false);

    // Mobile long-press
    const longPressTimerRef = useRef(null);
    const pendingTouchRef = useRef(null); // {x,y}
    const isLongPressModeRef = useRef(false);

    // Scroll lock while selecting
    const lockedRef = useRef(false);
    const prevTouchActionRef = useRef(null);

    const [selectedCells, setSelectedCells] = useState(() => new Set());
    const [isSelecting, setIsSelecting] = useState(false);
    const [dragBox, setDragBox] = useState(null);
    const [dragStart, setDragStart] = useState(null);
    const [justDragged, setJustDragged] = useState(false);

    const wasDragRef = useRef(false);

    const keyOf = (r, c) => `${r}-${c}`;
    const clearSelection = () => setSelectedCells(new Set());

    const lockScrollWhileSelecting = () => {
        const el = gridWrapRef.current;
        if (!el || lockedRef.current) return;
        prevTouchActionRef.current = el.style.touchAction;
        el.style.touchAction = "none"; // ✅ bloquea scroll DURANTE selección
        lockedRef.current = true;
    };

    const unlockScroll = () => {
        const el = gridWrapRef.current;
        if (!el || !lockedRef.current) return;
        el.style.touchAction = prevTouchActionRef.current || "pan-x pan-y";
        prevTouchActionRef.current = null;
        lockedRef.current = false;
    };

    const cleanupLongPress = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
        pendingTouchRef.current = null;
        isLongPressModeRef.current = false;
    };

    const updateSelectionFromBox = (box, { append } = { append: true }) => {
        const wrap = gridWrapRef.current?.getBoundingClientRect();
        if (!wrap) return;

        const { left, top, right, bottom } = rectNorm(box);
        const next = append ? new Set(selectedCells) : new Set();

        Object.entries(cellRefs.current).forEach(([k, el]) => {
            if (!el) return;
            const r = el.getBoundingClientRect();

            const cx1 = r.left - wrap.left;
            const cy1 = r.top - wrap.top;
            const cx2 = r.right - wrap.left;
            const cy2 = r.bottom - wrap.top;

            const intersects = cx2 >= left && cx1 <= right && cy2 >= top && cy1 <= bottom;
            if (intersects) next.add(k);
        });

        setSelectedCells(next);
    };

    const startSelectionAt = (x, y, { resetSelection } = { resetSelection: true }) => {
        if (resetSelection) setSelectedCells(new Set());
        setIsSelecting(true);
        lockScrollWhileSelecting();

        setJustDragged(false);
        wasDragRef.current = false;

        setDragStart({ x, y });
        setDragBox({ x1: x, y1: y, x2: x, y2: y });
    };

    const finishSelection = () => {
        setIsSelecting(false);
        setDragStart(null);
        setDragBox(null);

        // liberar captura pointer
        if (didCaptureRef.current && gridWrapRef.current && pointerIdRef.current != null) {
            try {
                gridWrapRef.current.releasePointerCapture?.(pointerIdRef.current);
            } catch { }
        }
        didCaptureRef.current = false;
        pointerIdRef.current = null;

        unlockScroll();
        cleanupLongPress();

        if (justDragged) {
            setTimeout(() => {
                setJustDragged(false);
                wasDragRef.current = false;
            }, 150);
        } else {
            setTimeout(() => {
                wasDragRef.current = false;
            }, 0);
        }
    };

    // =========================
    // POINTER (desktop + mobile pointer)
    // =========================
    const onPointerDown = (e) => {
        // solo click izquierdo si existe button
        if (e.button !== undefined && e.button !== 0) return;

        const wrap = gridWrapRef.current?.getBoundingClientRect();
        if (!wrap) return;

        // Si es touch en móvil, NO iniciamos selección inmediata:
        // esperamos long-press.
        const isTouchPointer = e.pointerType === "touch";

        if (isTouchPointer) {
            // guardamos punto inicial
            const x = clamp(e.clientX - wrap.left, 0, wrap.width);
            const y = clamp(e.clientY - wrap.top, 0, wrap.height);
            pendingTouchRef.current = { x, y };

            // programar long press
            cleanupLongPress();
            longPressTimerRef.current = setTimeout(() => {
                // si sigue “pendiente”, arranca selección
                if (!pendingTouchRef.current) return;
                isLongPressModeRef.current = true;
                wasDragRef.current = true;
                startSelectionAt(pendingTouchRef.current.x, pendingTouchRef.current.y, {
                    resetSelection: !e.shiftKey,
                });

                // capturamos pointer una vez que estamos seleccionando
                pointerIdRef.current = e.pointerId;
                didCaptureRef.current = false;
                if (!didCaptureRef.current && pointerIdRef.current != null) {
                    e.currentTarget.setPointerCapture?.(pointerIdRef.current);
                    didCaptureRef.current = true;
                }
            }, 350); // ✅ long press ms

            return;
        }

        // Desktop: inicia selection normal
        if (!e.shiftKey) setSelectedCells(new Set());

        const x = clamp(e.clientX - wrap.left, 0, wrap.width);
        const y = clamp(e.clientY - wrap.top, 0, wrap.height);

        pointerIdRef.current = e.pointerId;
        didCaptureRef.current = false;

        startSelectionAt(x, y, { resetSelection: !e.shiftKey });
        // NO capturamos aquí: capturamos cuando ya es drag real en move
    };

    const onPointerMove = (e) => {
        const wrap = gridWrapRef.current?.getBoundingClientRect();
        if (!wrap) return;

        // Si estamos esperando long-press, cancelamos si se mueve “demasiado”
        if (!isSelecting && pendingTouchRef.current && e.pointerType === "touch") {
            const x = clamp(e.clientX - wrap.left, 0, wrap.width);
            const y = clamp(e.clientY - wrap.top, 0, wrap.height);
            const dx = Math.abs(x - pendingTouchRef.current.x);
            const dy = Math.abs(y - pendingTouchRef.current.y);

            // si el usuario quiere scrollear, se moverá -> cancelamos long press
            if (dx > 10 || dy > 10) cleanupLongPress();
            return;
        }

        if (!isSelecting || !dragStart) return;

        // ✅ mientras seleccionas en móvil: bloquea scroll real
        if (e.pointerType === "touch") {
            e.preventDefault?.();
        }

        const x = clamp(e.clientX - wrap.left, 0, wrap.width);
        const y = clamp(e.clientY - wrap.top, 0, wrap.height);

        const dx = Math.abs(x - dragStart.x);
        const dy = Math.abs(y - dragStart.y);

        // ✅ cuando ya es drag real, marcamos y capturamos una vez
        if (!justDragged && (dx > 6 || dy > 6)) {
            setJustDragged(true);
            wasDragRef.current = true;

            if (!didCaptureRef.current && pointerIdRef.current != null) {
                e.currentTarget.setPointerCapture?.(pointerIdRef.current);
                didCaptureRef.current = true;
            }
        }

        const nextBox = { x1: dragStart.x, y1: dragStart.y, x2: x, y2: y };
        setDragBox(nextBox);
        updateSelectionFromBox(nextBox, { append: true });
    };

    const onPointerUp = () => {
        // si no llegamos a long-press y levantó el dedo -> solo cancelamos
        if (!isSelecting && pendingTouchRef.current) {
            cleanupLongPress();
            return;
        }
        if (!isSelecting) return;
        finishSelection();
    };

    // =========================
    // Touch fallback (para bloquear scroll 100% en iOS / algunos browsers)
    // =========================
    useEffect(() => {
        const el = gridWrapRef.current;
        if (!el) return;

        const onTouchMove = (ev) => {
            if (!isSelecting) return;
            // ✅ imprescindible: bloquear scroll mientras seleccionas
            ev.preventDefault();
        };

        el.addEventListener("touchmove", onTouchMove, { passive: false });
        return () => el.removeEventListener("touchmove", onTouchMove);
    }, [gridWrapRef, isSelecting]);

    const overlayStyle = useMemo(() => {
        if (!dragBox) return null;
        const r = rectNorm(dragBox);
        return {
            left: r.left,
            top: r.top,
            width: r.right - r.left,
            height: r.bottom - r.top,
        };
    }, [dragBox]);

    return {
        selectedCells,
        isSelecting,
        justDragged,
        overlayStyle,
        wasDragRef,
        keyOf,
        clearSelection,
        setSelectedCells,
        cellRefs,
        handlers: { onPointerDown, onPointerMove, onPointerUp },
    };
}