import { useEffect, useRef } from "react";
import { useTheme } from "../../theme/ThemeProvider";

export function RealmBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particles
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    const particleCount = 40; // Subtle

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2,
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5 + 0.1
        });
    }

    let animationId: number;

    const draw = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);

        // Fill background based on theme (optional, mainly handled by parent container)
        // Check if we should use theme bg or just clear
        // We generally overlay on top of CSS background, so just clear is fine.
        
        ctx.fillStyle = theme.tokens.colors.primary;

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // Wrap
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            ctx.globalAlpha = p.alpha * 0.15; // Very subtle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        animationId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => {
        window.removeEventListener("resize", handleResize);
        cancelAnimationFrame(animationId);
    };
  }, [theme]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {/* CSS Noise Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* Radial Gradient Glow (Center) */}
      <div 
        className="absolute inset-0"
        style={{
            background: `radial-gradient(circle at center, ${theme.tokens.colors.primary}10 0%, transparent 60%)`
        }}
      />
    </div>
  );
}
