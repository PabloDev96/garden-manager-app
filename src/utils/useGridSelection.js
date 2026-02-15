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
    const wasDragRef = useRef(false);

    const [selectedCells, setSelectedCells] = useState(() => new Set());
    const [isSelecting, setIsSelecting] = useState(false);
    const [dragBox, setDragBox] = useState(null);
    const [dragStart, setDragStart] = useState(null);
    const [justDragged, setJustDragged] = useState(false);

    const keyOf = (r, c) => `${r}-${c}`;
    const clearSelection = () => setSelectedCells(new Set());

    const updateSelectionFromBox = (box, { append } = { append: true }) => {
        const wrap = gridWrapRef.current?.getBoundingClientRect();
        if (!wrap) return;

        const { left, top, right, bottom } = rectNorm(box);
        const next = append ? new Set(selectedCells) : new Set();

        for (const [k, el] of Object.entries(cellRefs.current)) {
            if (!el) continue;
            const r = el.getBoundingClientRect();

            const cx1 = r.left - wrap.left;
            const cy1 = r.top - wrap.top;
            const cx2 = r.right - wrap.left;
            const cy2 = r.bottom - wrap.top;

            const intersects = cx2 >= left && cx1 <= right && cy2 >= top && cy1 <= bottom;
            if (intersects) next.add(k);
        }

        setSelectedCells(next);
    };

    // =========================
    // SCROLL LOCK (MÓVIL)
    // =========================
    const scrollLockRef = useRef({
        locked: false,
        scrollY: 0,
        prevOverflow: "",
        prevPosition: "",
        prevTop: "",
        prevWidth: "",
    });

    const lockBodyScroll = () => {
        if (scrollLockRef.current.locked) return;

        const scrollY = window.scrollY || window.pageYOffset || 0;
        const body = document.body;

        scrollLockRef.current.locked = true;
        scrollLockRef.current.scrollY = scrollY;
        scrollLockRef.current.prevOverflow = body.style.overflow;
        scrollLockRef.current.prevPosition = body.style.position;
        scrollLockRef.current.prevTop = body.style.top;
        scrollLockRef.current.prevWidth = body.style.width;

        body.style.overflow = "hidden";
        body.style.position = "fixed";
        body.style.top = `-${scrollY}px`;
        body.style.width = "100%";
    };

    const unlockBodyScroll = () => {
        if (!scrollLockRef.current.locked) return;

        const body = document.body;
        const { scrollY, prevOverflow, prevPosition, prevTop, prevWidth } = scrollLockRef.current;

        body.style.overflow = prevOverflow;
        body.style.position = prevPosition;
        body.style.top = prevTop;
        body.style.width = prevWidth;

        window.scrollTo(0, scrollY);

        scrollLockRef.current.locked = false;
    };

    // =========================
    // DESKTOP: POINTER (como antes)
    // =========================
    const pointerIdRef = useRef(null);
    const didCaptureRef = useRef(false);

    const onPointerDown = (e) => {
        // SOLO ratón / pen. El touch lo manejamos con touch nativo.
        if (e.pointerType === "touch") return;
        if (e.button !== undefined && e.button !== 0) return;

        const wrap = gridWrapRef.current?.getBoundingClientRect();
        if (!wrap) return;

        if (!e.shiftKey) setSelectedCells(new Set());

        const x = clamp(e.clientX - wrap.left, 0, wrap.width);
        const y = clamp(e.clientY - wrap.top, 0, wrap.height);

        setIsSelecting(true);
        setJustDragged(false);
        wasDragRef.current = false;

        pointerIdRef.current = e.pointerId;
        didCaptureRef.current = false;

        setDragStart({ x, y });
        setDragBox({ x1: x, y1: y, x2: x, y2: y });
    };

    const onPointerMove = (e) => {
        if (!isSelecting || !dragStart) return;
        if (e.pointerType === "touch") return;

        const wrap = gridWrapRef.current?.getBoundingClientRect();
        if (!wrap) return;

        const x = clamp(e.clientX - wrap.left, 0, wrap.width);
        const y = clamp(e.clientY - wrap.top, 0, wrap.height);

        const dx = Math.abs(x - dragStart.x);
        const dy = Math.abs(y - dragStart.y);

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
        if (!isSelecting) return;

        setIsSelecting(false);
        setDragStart(null);
        setDragBox(null);

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

    // =========================
    // MÓVIL: TOUCH NATIVO (long press + bloquear scroll)
    // =========================
    const longPressTimerRef = useRef(null);
    const touchStartRef = useRef(null); // {x,y}
    const touchIdRef = useRef(null);
    const longPressedRef = useRef(false);

    const clearLongPressTimer = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const cancelTouchMode = () => {
        clearLongPressTimer();
        touchStartRef.current = null;
        touchIdRef.current = null;
        longPressedRef.current = false;
    };

    const finishTouchSelection = () => {
        setIsSelecting(false);
        setDragStart(null);
        setDragBox(null);

        unlockBodyScroll();
        cancelTouchMode();

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

    useEffect(() => {
        const el = gridWrapRef.current;
        if (!el) return;

        const getTouchById = (touches, id) => {
            if (id == null) return null;
            for (let i = 0; i < touches.length; i++) {
                if (touches[i].identifier === id) return touches[i];
            }
            return null;
        };

        const onTouchStart = (ev) => {
            // 1 dedo
            if (ev.touches.length !== 1) return;

            const wrap = el.getBoundingClientRect();
            const t = ev.touches[0];

            touchIdRef.current = t.identifier;

            const x = clamp(t.clientX - wrap.left, 0, wrap.width);
            const y = clamp(t.clientY - wrap.top, 0, wrap.height);

            touchStartRef.current = { x, y };
            longPressedRef.current = false;

            // long press
            clearLongPressTimer();
            longPressTimerRef.current = setTimeout(() => {
                // si sigue tocando
                const tNow = getTouchById(ev.touches, touchIdRef.current) || ev.touches[0];
                if (!tNow) return;

                longPressedRef.current = true;
                wasDragRef.current = true;
                setJustDragged(true);

                // ✅ BLOQUEA SCROLL DEL BODY
                lockBodyScroll();

                // empezar selección
                setSelectedCells(new Set()); // sin shift en móvil
                setIsSelecting(true);
                setDragStart({ x, y });
                setDragBox({ x1: x, y1: y, x2: x, y2: y });
            }, 350);
        };

        const onTouchMove = (ev) => {
            // Si no ha hecho long press: permitir scroll normal, pero si se mueve mucho -> cancelar long press
            if (!longPressedRef.current) {
                if (!touchStartRef.current) return;

                const wrap = el.getBoundingClientRect();
                const t = getTouchById(ev.touches, touchIdRef.current) || ev.touches[0];
                if (!t) return;

                const x = clamp(t.clientX - wrap.left, 0, wrap.width);
                const y = clamp(t.clientY - wrap.top, 0, wrap.height);

                const dx = Math.abs(x - touchStartRef.current.x);
                const dy = Math.abs(y - touchStartRef.current.y);

                if (dx > 10 || dy > 10) {
                    // el usuario está scrolleando
                    cancelTouchMode();
                }
                return;
            }

            // ✅ Ya estamos seleccionando: bloquear scroll real
            ev.preventDefault();

            if (!isSelecting || !dragStart) return;

            const wrap = el.getBoundingClientRect();
            const t = getTouchById(ev.touches, touchIdRef.current) || ev.touches[0];
            if (!t) return;

            const x = clamp(t.clientX - wrap.left, 0, wrap.width);
            const y = clamp(t.clientY - wrap.top, 0, wrap.height);

            const nextBox = { x1: dragStart.x, y1: dragStart.y, x2: x, y2: y };
            setDragBox(nextBox);
            updateSelectionFromBox(nextBox, { append: true });
        };

        const onTouchEnd = (ev) => {
            // si terminó antes del long press
            if (!longPressedRef.current) {
                cancelTouchMode();
                return;
            }

            // si ya no existe ese touch, terminar
            const stillThere = getTouchById(ev.touches, touchIdRef.current);
            if (!stillThere) finishTouchSelection();
        };

        const onTouchCancel = () => {
            if (longPressedRef.current) finishTouchSelection();
            else cancelTouchMode();
        };

        // 🔥 IMPORTANTE: passive:false para que preventDefault funcione
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
    }, [gridWrapRef, isSelecting, dragStart, selectedCells]);

    // si el componente se desmonta seleccionando, asegurar unlock
    useEffect(() => {
        return () => {
            unlockBodyScroll();
            clearLongPressTimer();
        };
    }, []);

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