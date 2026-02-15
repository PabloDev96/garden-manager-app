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
    longPressMs = 260,
    moveThresholdPx = 10,
    dragStartThresholdPx = 6,
} = {}) {
    const cellRefs = useRef({});

    const [selectedCells, setSelectedCells] = useState(() => new Set());
    const [isSelecting, setIsSelecting] = useState(false);
    const [dragBox, setDragBox] = useState(null);
    const [dragStart, setDragStart] = useState(null);
    const [justDragged, setJustDragged] = useState(false);

    const wasDragRef = useRef(false);

    // pointer capture
    const pointerIdRef = useRef(null);
    const didCaptureRef = useRef(false);

    // long-press control (NO guardar event)
    const pressTimerRef = useRef(null);
    const pendingTouchRef = useRef(false);
    const pointerTypeRef = useRef("mouse");

    // guardamos datos del down
    const downTargetRef = useRef(null);
    const downShiftRef = useRef(false);
    const downClientRef = useRef({ x: 0, y: 0 });
    const downLocalRef = useRef({ x: 0, y: 0 });

    // ✅ bloqueo inmediato de scroll/callout (DOM)
    const prevTouchActionRef = useRef(null);
    const lockedRef = useRef(false);

    const keyOf = (r, c) => `${r}-${c}`;
    const clearSelection = () => setSelectedCells(new Set());

    const lockTouch = () => {
        const el = gridWrapRef.current;
        if (!el || lockedRef.current) return;

        // guardamos y bloqueamos
        prevTouchActionRef.current = el.style.touchAction;
        el.style.touchAction = "none"; // clave: INMEDIATO, sin esperar render
        lockedRef.current = true;
    };

    const unlockTouch = () => {
        const el = gridWrapRef.current;
        if (!el || !lockedRef.current) return;

        el.style.touchAction = prevTouchActionRef.current ?? "";
        lockedRef.current = false;
        prevTouchActionRef.current = null;
    };

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

    const beginSelectionFromStoredDown = () => {
        const wrap = gridWrapRef.current?.getBoundingClientRect();
        if (!wrap) return;

        // ✅ bloquear scroll YA (antes de que Safari te haga cancel)
        lockTouch();

        const append = downShiftRef.current; // shift = append
        if (!append) setSelectedCells(new Set());

        setIsSelecting(true);
        setJustDragged(false);
        wasDragRef.current = false;

        // capturamos puntero
        const target = downTargetRef.current;
        const pid = pointerIdRef.current;

        if (target && pid != null && !didCaptureRef.current) {
            try {
                target.setPointerCapture?.(pid);
                didCaptureRef.current = true;
            } catch { }
        }

        const x = clamp(downLocalRef.current.x, 0, wrap.width);
        const y = clamp(downLocalRef.current.y, 0, wrap.height);

        setDragStart({ x, y });
        setDragBox({ x1: x, y1: y, x2: x, y2: y });
    };

    const onPointerDown = (e) => {
        if (e.pointerType === "mouse" && e.button !== undefined && e.button !== 0) return;

        const wrap = gridWrapRef.current?.getBoundingClientRect();
        if (!wrap) return;

        pointerTypeRef.current = e.pointerType || "mouse";

        pointerIdRef.current = e.pointerId;
        didCaptureRef.current = false;

        downTargetRef.current = e.currentTarget;
        downShiftRef.current = !!e.shiftKey;

        downClientRef.current = { x: e.clientX, y: e.clientY };
        downLocalRef.current = {
            x: clamp(e.clientX - wrap.left, 0, wrap.width),
            y: clamp(e.clientY - wrap.top, 0, wrap.height),
        };

        setJustDragged(false);
        wasDragRef.current = false;

        // Desktop / mouse: empieza ya
        if (pointerTypeRef.current !== "touch") {
            beginSelectionFromStoredDown();
            return;
        }

        // Touch: long press
        pendingTouchRef.current = true;

        pressTimerRef.current = setTimeout(() => {
            if (!pendingTouchRef.current) return;
            pendingTouchRef.current = false;
            beginSelectionFromStoredDown();
        }, longPressMs);
    };

    const onPointerMove = (e) => {
        const wrap = gridWrapRef.current?.getBoundingClientRect();
        if (!wrap) return;

        // Touch + pending => permitir scroll. Si se mueve, cancelamos long press.
        if (pointerTypeRef.current === "touch" && pendingTouchRef.current) {
            const dx = Math.abs(e.clientX - downClientRef.current.x);
            const dy = Math.abs(e.clientY - downClientRef.current.y);
            if (dx > moveThresholdPx || dy > moveThresholdPx) {
                cancelPendingTouch();
            }
            return;
        }

        if (!isSelecting || !dragStart) return;

        // ✅ mientras seleccionas: bloquear scroll
        e.preventDefault?.();

        const x = clamp(e.clientX - wrap.left, 0, wrap.width);
        const y = clamp(e.clientY - wrap.top, 0, wrap.height);

        const dx = Math.abs(x - dragStart.x);
        const dy = Math.abs(y - dragStart.y);

        if (!justDragged && (dx > dragStartThresholdPx || dy > dragStartThresholdPx)) {
            setJustDragged(true);
            wasDragRef.current = true;
        }

        const nextBox = { x1: dragStart.x, y1: dragStart.y, x2: x, y2: y };
        setDragBox(nextBox);
        updateSelectionFromBox(nextBox, { append: true });
    };

    const finish = () => {
        setIsSelecting(false);
        setDragStart(null);
        setDragBox(null);

        // liberar captura
        if (didCaptureRef.current && gridWrapRef.current && pointerIdRef.current != null) {
            try {
                gridWrapRef.current.releasePointerCapture?.(pointerIdRef.current);
            } catch { }
        }
        didCaptureRef.current = false;
        pointerIdRef.current = null;

        // ✅ reactivar scroll
        unlockTouch();

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
        cancelPendingTouch();
        if (!isSelecting) {
            // por si se canceló antes
            unlockTouch();
            return;
        }
        finish();
    };

    const onPointerCancel = () => {
        cancelPendingTouch();
        if (!isSelecting) {
            unlockTouch();
            return;
        }
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