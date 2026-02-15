import { useEffect, useMemo, useRef, useState } from "react";

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
    moveCancelPx = 10,        // si mueves el dedo más que esto antes del long press => cancel (y dejas scroll)
    dragStartPx = 6,          // cuando ya estás seleccionando, a partir de X px lo consideramos drag real
} = {}) {
    const cellRefs = useRef({});

    const [selectedCells, setSelectedCells] = useState(() => new Set());
    const [isSelecting, setIsSelecting] = useState(false);
    const [dragBox, setDragBox] = useState(null);
    const [dragStart, setDragStart] = useState(null);
    const [justDragged, setJustDragged] = useState(false);

    const wasDragRef = useRef(false);

    const keyOf = (r, c) => `${r}-${c}`;
    const clearSelection = () => setSelectedCells(new Set());

    // ====== “touch mode” state ======
    const pendingTouchRef = useRef(false);
    const pressTimerRef = useRef(null);

    const downClientRef = useRef({ x: 0, y: 0 });
    const downLocalRef = useRef({ x: 0, y: 0 });
    const downShiftRef = useRef(false);

    // scroll lock (solo durante selección)
    const lockedRef = useRef(false);
    const prevTouchActionRef = useRef(null);

    const lockTouch = () => {
        const el = gridWrapRef.current;
        if (!el || lockedRef.current) return;
        prevTouchActionRef.current = el.style.touchAction;
        el.style.touchAction = "none"; // bloquear scroll SOLO mientras seleccionas
        lockedRef.current = true;
    };

    const unlockTouch = () => {
        const el = gridWrapRef.current;
        if (!el || !lockedRef.current) return;
        el.style.touchAction = prevTouchActionRef.current ?? "";
        prevTouchActionRef.current = null;
        lockedRef.current = false;
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

    const startSelectionFromDown = () => {
        const wrap = gridWrapRef.current?.getBoundingClientRect();
        if (!wrap) return;

        // shift append (si lo usas)
        if (!downShiftRef.current) setSelectedCells(new Set());

        setIsSelecting(true);
        setJustDragged(false);
        wasDragRef.current = false;

        lockTouch(); // ✅ clave en móvil: bloquear scroll SOLO cuando empieza selección

        const x = clamp(downLocalRef.current.x, 0, wrap.width);
        const y = clamp(downLocalRef.current.y, 0, wrap.height);

        setDragStart({ x, y });
        setDragBox({ x1: x, y1: y, x2: x, y2: y });
    };

    const finish = () => {
        setIsSelecting(false);
        setDragStart(null);
        setDragBox(null);

        unlockTouch(); // ✅ devolver scroll

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
    // DESKTOP: Pointer (mouse)
    // =========================
    const onPointerDown = (e) => {
        // 🚫 IMPORTANTE: en móvil NO usamos pointer para touch
        if (e.pointerType === "touch") return;

        if (e.button !== undefined && e.button !== 0) return;

        const wrap = gridWrapRef.current?.getBoundingClientRect();
        if (!wrap) return;

        if (!e.shiftKey) setSelectedCells(new Set());

        setIsSelecting(true);
        setJustDragged(false);
        wasDragRef.current = false;

        const x = clamp(e.clientX - wrap.left, 0, wrap.width);
        const y = clamp(e.clientY - wrap.top, 0, wrap.height);

        setDragStart({ x, y });
        setDragBox({ x1: x, y1: y, x2: x, y2: y });
    };

    const onPointerMove = (e) => {
        if (!isSelecting || !dragStart) return;

        const wrap = gridWrapRef.current?.getBoundingClientRect();
        if (!wrap) return;

        const x = clamp(e.clientX - wrap.left, 0, wrap.width);
        const y = clamp(e.clientY - wrap.top, 0, wrap.height);

        const dx = Math.abs(x - dragStart.x);
        const dy = Math.abs(y - dragStart.y);

        if (!justDragged && (dx > dragStartPx || dy > dragStartPx)) {
            setJustDragged(true);
            wasDragRef.current = true;
        }

        const nextBox = { x1: dragStart.x, y1: dragStart.y, x2: x, y2: y };
        setDragBox(nextBox);
        updateSelectionFromBox(nextBox, { append: true });
    };

    const onPointerUp = () => {
        if (!isSelecting) return;
        finish();
    };

    // =========================
    // MOBILE: Native Touch (passive:false)
    // =========================
    useEffect(() => {
        const el = gridWrapRef.current;
        if (!el) return;

        const getTouch = (ev) => ev.touches?.[0] || ev.changedTouches?.[0];

        const onTouchStart = (ev) => {
            // solo 1 dedo
            if (ev.touches && ev.touches.length > 1) return;

            const t = getTouch(ev);
            if (!t) return;

            const wrap = el.getBoundingClientRect();

            downShiftRef.current = false; // en móvil ignoramos shift
            downClientRef.current = { x: t.clientX, y: t.clientY };
            downLocalRef.current = {
                x: clamp(t.clientX - wrap.left, 0, wrap.width),
                y: clamp(t.clientY - wrap.top, 0, wrap.height),
            };

            pendingTouchRef.current = true;
            cancelPendingTouch(); // por si había uno anterior
            pendingTouchRef.current = true;

            // long press => empezar selección
            pressTimerRef.current = setTimeout(() => {
                if (!pendingTouchRef.current) return;
                pendingTouchRef.current = false;
                startSelectionFromDown();
            }, longPressMs);
        };

        const onTouchMove = (ev) => {
            const t = getTouch(ev);
            if (!t) return;

            // si todavía estamos “pendientes” de long press: permitir scroll.
            if (pendingTouchRef.current) {
                const dx = Math.abs(t.clientX - downClientRef.current.x);
                const dy = Math.abs(t.clientY - downClientRef.current.y);

                // si el usuario se ha movido, asumimos scroll => cancelamos long press
                if (dx > moveCancelPx || dy > moveCancelPx) {
                    cancelPendingTouch();
                }
                return;
            }

            // si ya estamos seleccionando: bloquear scroll (aquí SÍ hacemos preventDefault)
            if (!isSelecting || !dragStart) return;

            ev.preventDefault(); // ✅ requiere passive:false

            const wrap = el.getBoundingClientRect();
            const x = clamp(t.clientX - wrap.left, 0, wrap.width);
            const y = clamp(t.clientY - wrap.top, 0, wrap.height);

            const dx = Math.abs(x - dragStart.x);
            const dy = Math.abs(y - dragStart.y);

            if (!justDragged && (dx > dragStartPx || dy > dragStartPx)) {
                setJustDragged(true);
                wasDragRef.current = true;
            }

            const nextBox = { x1: dragStart.x, y1: dragStart.y, x2: x, y2: y };
            setDragBox(nextBox);
            updateSelectionFromBox(nextBox, { append: true });
        };

        const onTouchEnd = () => {
            cancelPendingTouch();
            if (isSelecting) finish();
            else unlockTouch();
        };

        const onTouchCancel = () => {
            cancelPendingTouch();
            if (isSelecting) finish();
            else unlockTouch();
        };

        // 🔥 listeners nativos (passive:false) para que preventDefault funcione
        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("touchmove", onTouchMove, { passive: false });
        el.addEventListener("touchend", onTouchEnd, { passive: true });
        el.addEventListener("touchcancel", onTouchCancel, { passive: true });

        return () => {
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchmove", onTouchMove);
            el.removeEventListener("touchend", onTouchEnd);
            el.removeEventListener("touchcancel", onTouchCancel);
        };
        // OJO: isSelecting/dragStart/justDragged cambian; pero no queremos re-registrar listeners continuamente.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gridWrapRef]);

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