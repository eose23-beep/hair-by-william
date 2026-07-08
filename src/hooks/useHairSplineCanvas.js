import { useEffect, useRef } from 'react';
export function useHairSplineCanvas() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, lastX: 0, lastY: 0, vx: 0, vy: 0 });
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); let animationFrameId; let time = 0;
    const STRAND_COUNT = 34; const SEGMENT_COUNT = 8; const strands = [];
    const resizeCanvas = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight; strands.length = 0;
      for (let i = 0; i < STRAND_COUNT; i++) {
        const baseY = (canvas.height / (STRAND_COUNT - 1)) * i; const segments = [];
        for (let j = 0; j < SEGMENT_COUNT; j++) { segments.push({ x: (canvas.width / (SEGMENT_COUNT - 1)) * j, y: baseY, origX: (canvas.width / (SEGMENT_COUNT - 1)) * j, origY: baseY }); }
        strands.push({ segments, driftOffset: Math.random() * Math.PI * 2 });
      }
    };
    window.addEventListener('resize', resizeCanvas); resizeCanvas();
    const handlePointerMove = (e) => {
      const m = mouseRef.current; m.x = e.clientX || 0; m.y = e.clientY || 0;
      m.vx = m.x - m.lastX; m.vy = m.y - m.lastY; m.lastX = m.x; m.lastY = m.y;
    };
    window.addEventListener('pointermove', handlePointerMove);
    const render = () => {
      time += 0.02; ctx.clearRect(0, 0, canvas.width, canvas.height);
      const m = mouseRef.current; m.vx *= 0.95; m.vy *= 0.95;
      strands.forEach((strand) => {
        ctx.beginPath();
        strand.segments.forEach((seg, j) => {
          seg.y = seg.origY + Math.sin(time + strand.driftOffset) * (j * 6.18);
          const dx = m.x - seg.x; const dy = m.y - seg.y; const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 150 && distance > 0) { const force = (150 - distance) / 150; seg.x += (m.vx * force * 0.4); seg.y += (m.vy * force * 0.4); }
          seg.x += (seg.origX - seg.x) * 0.08;
          if (j === 0) { ctx.moveTo(seg.x, seg.y); } else {
            const prev = strand.segments[j - 1]; ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + seg.x) / 2, (prev.y + seg.y) / 2);
          }
        });
        const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
        grad.addColorStop(0, 'rgba(212, 175, 55, 0.02)'); grad.addColorStop(0.5, 'rgba(212, 175, 55, 0.35)'); grad.addColorStop(1, 'rgba(212, 175, 55, 0.02)');
        ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke();
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => { window.removeEventListener('resize', resizeCanvas); window.removeEventListener('pointermove', handlePointerMove); cancelAnimationFrame(animationFrameId); };
  }, []);
  return canvasRef;
}
