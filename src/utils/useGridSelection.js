import { useMemo, useRef, useState } from "react";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const rectNorm = (r) => ({
    left: Math.min(r.x1, r.x2),
    top: Math.min(r.y1, r.y2),
    right: Math.max(r.x1, r.x2),
    bottom: Math.max(r.y1, r.y2),
});

export default function useGridSelection({ gridWrapRef }) {
    const cellRefs = useRef({});
    const pointerIdRef = useRef(null);         // ✅ NUEVO
    const didCaptureRef = useRef(false);       // ✅ NUEVO

    const [selectedCells, setSelectedCells] = useState(() => new Set());
    const [isSelecting, setIsSelecting] = useState(false);
    const [dragBox, setDragBox] = useState(null);
    const [dragStart, setDragStart] = useState(null);
    const [justDragged, setJustDragged] = useState(false);

    const wasDragRef = useRef(false);

    const keyOf = (r, c) => `${r}-${c}`;

    const clearSelection = () => setSelectedCells(new Set());

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

    const onPointerDown = (e) => {
        if (e.button !== undefined && e.button !== 0) return;

        const wrap = gridWrapRef.current?.getBoundingClientRect();
        if (!wrap) return;

        if (!e.shiftKey) setSelectedCells(new Set());

        const x = clamp(e.clientX - wrap.left, 0, wrap.width);
        const y = clamp(e.clientY - wrap.top, 0, wrap.height);

        setIsSelecting(true);
        setJustDragged(false);
        wasDragRef.current = false;

        pointerIdRef.current = e.pointerId;     // ✅ guardar
        didCaptureRef.current = false;          // ✅ reset

        setDragStart({ x, y });
        setDragBox({ x1: x, y1: y, x2: x, y2: y });

        // ❌ QUITAR ESTO:
        // e.currentTarget.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e) => {
        if (!isSelecting || !dragStart) return;

        const wrap = gridWrapRef.current?.getBoundingClientRect();
        if (!wrap) return;

        const x = clamp(e.clientX - wrap.left, 0, wrap.width);
        const y = clamp(e.clientY - wrap.top, 0, wrap.height);

        const dx = Math.abs(x - dragStart.x);
        const dy = Math.abs(y - dragStart.y);

        // ✅ cuando ya es drag, capturamos (una sola vez)
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

        // solo tiene sentido seleccionar si ya estás arrastrando,
        // pero si quieres que seleccione desde el primer pixel, déjalo tal cual.
        updateSelectionFromBox(nextBox, { append: true });
    };

    const onPointerUp = () => {
        if (!isSelecting) return;

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