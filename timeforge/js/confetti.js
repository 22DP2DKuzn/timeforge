/* ============================================
   TimeForge — Confetti
   Canvas-based confetti for task completion
   ============================================ */

const Confetti = (() => {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animFrame = null;

    const COLORS = ['#5641FF','#FF6CD2','#4ade80','#facc15','#fb923c','#60a5fa','#f43f5e'];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticle(x, y) {
        return {
            x, y,
            vx: (Math.random() - 0.5) * 12,
            vy: Math.random() * -14 - 4,
            size: Math.random() * 8 + 4,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 10,
            gravity: 0.3,
            opacity: 1,
            shape: Math.random() > 0.5 ? 'rect' : 'circle',
        };
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            if (p.shape === 'rect') {
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });
    }

    function update() {
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.rotation += p.rotSpeed;
            p.opacity -= 0.008;
            p.vx *= 0.99;
        });
        particles = particles.filter(p => p.opacity > 0 && p.y < canvas.height + 20);
    }

    function loop() {
        if (particles.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            animFrame = null;
            return;
        }
        update();
        draw();
        animFrame = requestAnimationFrame(loop);
    }

    /**
     * Fire confetti burst from center-top of screen
     * @param {number} count - number of particles (default 80)
     */
    function fire(count = 80) {
        resize();
        const cx = canvas.width / 2;
        const cy = canvas.height * 0.35;
        for (let i = 0; i < count; i++) {
            particles.push(createParticle(cx + (Math.random() - 0.5) * 100, cy));
        }
        if (!animFrame) loop();
    }

    window.addEventListener('resize', resize);
    resize();

    return { fire };
})();
