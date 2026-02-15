import { useMemo, useRef, useState } from "react";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const rectNorm = (r) => ({
    left: Math.min(r.x1, r.x2),
    top: Math.min(r.y1, r.y2),
    right: Math.max(r.x1, r.x2),
    bottom: Math.max(r.y1, r.y2),
});

export default function useGridSelection({
    gridWrapRef,
    // Ajustes “mobile friendly”
    longPressMs = 220,
    moveThresholdPx = 8,
    dragStartThresholdPx = 6,
} = {}) {
    const cellRefs = useRef({});

    const pointerIdRef = useRef(null);
    const didCaptureRef = useRef(false);

    const [selectedCells, setSelectedCells] = useState(() => new Set());
    const [isSelecting, setIsSelecting] = useState(false);
    const [dragBox, setDragBox] = useState(null);
    const [dragStart, setDragStart] = useState(null);
    const [justDragged, setJustDragged] = useState(false);

    const wasDragRef = useRef(false);

    // ✅ refs para “long press” en móvil
    const pressTimerRef = useRef(null);
    const pendingTouchRef = useRef(false);
    const startClientRef = useRef({ x: 0, y: 0 });
    const startLocalRef = useRef({ x: 0, y: 0 });
    const pointerTypeRef = useRef("mouse"); // "mouse" | "touch" | "pen"

    const keyOf = (r, c) => `${r}-${c}`;
    const clearSelection = () => setSelectedCells(new Set());

    const cancelPendingTouch = () => {
        pendingTouchRef.current = false;
        if (pressTimerRef.current) {
            clearTimeout(pressTimerRef.current);
            pressTimerRef.current = null;
        }
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

    const beginSelection = (e, { append } = { append: true }) => {
        const wrap = gridWrapRef.current?.getBoundingClientRect();
        if (!wrap) return;

        if (!append) setSelectedCells(new Set());

        setIsSelecting(true);
        setJustDragged(false);
        wasDragRef.current = false;

        pointerIdRef.current = e.pointerId;
        didCaptureRef.current = false;

        const x = clamp(startLocalRef.current.x, 0, wrap.width);
        const y = clamp(startLocalRef.current.y, 0, wrap.height);

        setDragStart({ x, y });
        setDragBox({ x1: x, y1: y, x2: x, y2: y });
    };

    const onPointerDown = (e) => {
        // solo botón izquierdo en mouse
        if (e.pointerType === "mouse" && e.button !== undefined && e.button !== 0) return;

        const wrap = gridWrapRef.current?.getBoundingClientRect();
        if (!wrap) return;

        pointerTypeRef.current = e.pointerType || "mouse";

        const append = !!e.shiftKey;

        // Guardamos posición inicial (client + local)
        startClientRef.current = { x: e.clientX, y: e.clientY };
        startLocalRef.current = {
            x: clamp(e.clientX - wrap.left, 0, wrap.width),
            y: clamp(e.clientY - wrap.top, 0, wrap.height),
        };

        // ✅ Desktop: selección inmediata (como ya tenías)
        if (pointerTypeRef.current !== "touch") {
            beginSelection(e, { append });
            return;
        }

        // ✅ Móvil: NO empezar aún. Permitimos scroll.
        pendingTouchRef.current = true;
        setJustDragged(false);
        wasDragRef.current = false;

        // Long press -> activar selección
        pressTimerRef.current = setTimeout(() => {
            if (!pendingTouchRef.current) return;
            beginSelection(e, { append });
            pendingTouchRef.current = false;
        }, longPressMs);
    };

    const onPointerMove = (e) => {
        const wrap = gridWrapRef.current?.getBoundingClientRect();
        if (!wrap) return;

        // ✅ Si estamos en “pending touch”, decidir si el usuario quería scroll
        if (pointerTypeRef.current === "touch" && pendingTouchRef.current) {
            const dx = Math.abs(e.clientX - startClientRef.current.x);
            const dy = Math.abs(e.clientY - startClientRef.current.y);

            // Si se mueve “mucho” antes del long-press => es scroll, cancelamos selección
            if (dx > moveThresholdPx || dy > moveThresholdPx) {
                cancelPendingTouch();
                // Dejamos que el scroll ocurra (no hacemos preventDefault)
            }
            return;
        }

        // Si no estamos seleccionando, no hacemos nada
        if (!isSelecting || !dragStart) return;

        // ✅ mientras seleccionas, sí bloqueamos scroll
        // (esto se nota sobre todo en iOS)
        e.preventDefault?.();

        const x = clamp(e.clientX - wrap.left, 0, wrap.width);
        const y = clamp(e.clientY - wrap.top, 0, wrap.height);

        const dx = Math.abs(x - dragStart.x);
        const dy = Math.abs(y - dragStart.y);

        // cuando ya es drag, capturamos (una sola vez)
        if (!justDragged && (dx > dragStartThresholdPx || dy > dragStartThresholdPx)) {
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

    const finish = () => {
        setIsSelecting(false);
        setDragStart(null);
        setDragBox(null);

        // liberar captura si la pusimos
        if (didCaptureRef.current && gridWrapRef.current && pointerIdRef.current != null) {
            try {
                gridWrapRef.current.releasePointerCapture?.(pointerIdRef.current);
            } catch { }
        }
        didCaptureRef.current = false;
        pointerIdRef.current = null;

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

    const onPointerUp = () => {
        // Si soltó antes del long-press, cancelamos pending y listo
        cancelPendingTouch();

        if (!isSelecting) return;
        finish();
    };

    const onPointerCancel = () => {
        cancelPendingTouch();
        if (!isSelecting) return;
        finish();
    };

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
        handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
    };
}