'use client';

import { useState, useCallback, useRef, RefObject } from 'react';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
}

export function useDragSvg(
  ref: RefObject<SVGSVGElement | null>,
  onMove: (dx: number, dy: number) => void,
  onEnd?: () => void
) {
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<DragState | null>(null);

  const getPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!ref.current) return { x: 0, y: 0 };
      const pt = ref.current.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      return pt.matrixTransform(ref.current.getScreenCTM()?.inverse());
    },
    [ref]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent, initialX: number, initialY: number) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      const pt = getPoint(e.clientX, e.clientY);
      dragRef.current = {
        isDragging: false,
        startX: pt.x,
        startY: pt.y,
        initialX,
        initialY,
      };
      setDragging(true);
    },
    [getPoint]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const pt = getPoint(e.clientX, e.clientY);
      const dx = pt.x - dragRef.current.startX;
      const dy = pt.y - dragRef.current.startY;

      if (!dragRef.current.isDragging) {
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          dragRef.current.isDragging = true;
        }
      }

      if (dragRef.current.isDragging) {
        onMove(dx, dy);
      }
    },
    [getPoint, onMove]
  );

  const onPointerUp = useCallback(() => {
    if (!dragRef.current) return;
    const wasDragging = dragRef.current.isDragging;
    dragRef.current = null;
    setDragging(false);
    if (wasDragging) onEnd?.();
  }, [onEnd]);

  return { dragging, onPointerDown, onPointerMove, onPointerUp };
}