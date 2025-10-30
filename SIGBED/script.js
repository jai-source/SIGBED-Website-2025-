/* Intro animation: robotic arm picks up MUJ ACM SIGBED, then reveal landing */
(function() {
  const splash = document.getElementById('splash');
  const landing = document.getElementById('landing');
  const skipBtn = document.getElementById('skipIntro');

  // Helper for selecting SVG elements
  function q(selector) {
    return document.querySelector(selector);
  }

  // Cache SVG nodes
  const arm = q('#arm');
  const upper = q('#upper');
  const fore = q('#fore');
  const gripper = q('#gripper');
  const fingerL = q('#fingerL');
  const fingerR = q('#fingerR');
  const sigbedGroup = q('#sigbedGroup');
  const sigbedText = q('#sigbedText');
  const sparksLayer = q('#sparks');

  let revealed = false;

  function revealSite() {
    if (revealed) return;
    revealed = true;
    // Instantly swap to landing (exact 6s request)
    if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
    landing.hidden = false;
    document.body.style.overflow = 'auto';
  }

  skipBtn.addEventListener('click', revealSite);

  // Build a pure-JS animation (offline) lasting exactly 6s
  function runAnimation() {
    const totalMs = 6000;

    // Helpers
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2; // easeInOutQuad

    // Setters for SVG transforms (preserve base translations from markup)
    function setUpper(angleDeg) {
      upper.setAttribute('transform', `rotate(${angleDeg})`);
    }
    function setFore(angleDeg) {
      fore.setAttribute('transform', `translate(180,0) rotate(${angleDeg})`);
    }
    function setGripper(angleDeg, tx, ty) {
      const x = tx || 0, y = ty || 0;
      gripper.setAttribute('transform', `translate(160,0) translate(${x},${y}) rotate(${angleDeg})`);
    }
    function setFingerL(angleDeg) {
      fingerL.setAttribute('transform', `rotate(${angleDeg} 8 -14)`);
    }
    function setFingerR(angleDeg) {
      fingerR.setAttribute('transform', `rotate(${angleDeg} 8 14)`);
    }
    function setSigbed(dx, dy, angleDeg, scale) {
      const a = angleDeg || 0; const s = scale || 1; const x = dx || 0; const y = dy || 0;
      // Base translate from SVG: translate(520,290)
      sigbedGroup.setAttribute('transform', `translate(520,290) translate(${x},${y}) rotate(${a}) scale(${s})`);
    }

    // Initial states
    setUpper(0); setFore(0); setGripper(0, 0, 0);
    setFingerL(0); setFingerR(0);
    // Start with text below, arm off-balance downward
    setSigbed(0, 110, 0, 1);

    // Camera micro-shake helper
    const scene = document.querySelector('.scene');
    function cameraShake(intensity) {
      const ix = (Math.random() * 2 - 1) * intensity;
      const iy = (Math.random() * 2 - 1) * intensity;
      scene.style.transform = `translate(${ix}px, ${iy}px)`;
    }

    // Particle sparks near gripper
    function spawnSpark() {
      if (!sparksLayer) return;
      const x = 520 + -100 + Math.random() * 40; // around text center area
      const y = 290 + 40 + Math.random() * 20;   // slightly below text
      const life = 400 + Math.random() * 300;
      const size = 1 + Math.random() * 2.2;
      const dx = -40 + Math.random() * 80;
      const dy = -60 + Math.random() * 20;
      const hue = 25 + Math.random() * 40; // warm fire
      const spark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      spark.setAttribute('cx', String(x));
      spark.setAttribute('cy', String(y));
      spark.setAttribute('r', String(size));
      spark.setAttribute('fill', `hsl(${hue} 90% 60%)`);
      spark.setAttribute('opacity', '0.9');
      sparksLayer.appendChild(spark);
      const born = performance.now();
      (function animSpark(now) {
        const e = now - born;
        const k = e / life;
        const nx = x + dx * k;
        const ny = y + dy * k;
        spark.setAttribute('cx', String(nx));
        spark.setAttribute('cy', String(ny));
        spark.setAttribute('opacity', String(1 - k));
        if (e < life) requestAnimationFrame(animSpark); else spark.remove();
      })(born);
    }

    const start = performance.now();
    function frame(now) {
      const elapsed = now - start;
      const t = clamp(elapsed / totalMs, 0, 1);

      // Phases (in seconds):
      // 0.0-0.5 intro; 0.5-1.2 approach; 1.2-1.45 open; 1.45-2.1 clamp;
      // 2.1-3.0 lift; 3.0-4.0 pose; 4.0-4.6 jitter; 4.6-5.2 center; 5.2-6.0 hold
      const sec = t * 6.0;

      let upperRot = 0, foreRot = 0, gripRot = 0, gripX = 0, gripY = 0;
      let fingerLA = 0, fingerRA = 0;
      let textX = 0, textY = 110, textA = 0, textS = 1;

      // Intro (camera feel) 0-0.5s -> small movement
      if (sec <= 0.5) {
        const k = ease(sec / 0.5);
        textY = lerp(110, 105, k);
      }

      // Approach from below 0.5-1.2s
      if (sec > 0.5 && sec <= 1.2) {
        const k = ease((sec - 0.5) / 0.7);
        upperRot = lerp(0, 16, k);
        foreRot = lerp(0, -10, k);
        gripRot = lerp(0, 6, k);
        textY = 105;
      }

      // Open gripper 1.2-1.45s
      if (sec > 1.2 && sec <= 1.45) {
        const k = ease((sec - 1.2) / 0.25);
        fingerLA = lerp(0, -18, k);
        fingerRA = lerp(0, 18, k);
      }

      // Clamp 1.45-2.1s
      if (sec > 1.45 && sec <= 2.1) {
        const k = ease((sec - 1.45) / 0.65);
        upperRot = lerp(16, 10, k);
        foreRot = lerp(-10, -4, k);
        gripX = lerp(0, 4, k);
        gripY = lerp(0, 2, k);
        fingerLA = lerp(-18, -3, k);
        fingerRA = lerp(18, 3, k);
        textY = 105;
      }

      // Lift 2.1-3.0s
      if (sec > 2.1 && sec <= 3.0) {
        const k = ease((sec - 2.1) / 0.9);
        upperRot = lerp(10, 6, k);
        foreRot = lerp(-4, 8, k);
        textY = lerp(105, 60, k);
      }

      // Pose 3.0-4.0s
      if (sec > 3.0 && sec <= 4.0) {
        const k = ease((sec - 3.0) / 1.0);
        textY = lerp(60, 40, k);
        textS = lerp(1, 1.05, k * 0.5);
      }

      // Jitter 4.0-4.6s
      if (sec > 4.0 && sec <= 4.6) {
        const k = (sec - 4.0) / 0.6;
        const jitter = Math.sin(k * Math.PI * 10) * 1.0;
        textY = 40 + jitter;
        cameraShake(0.6);
        if (Math.random() < 0.6) spawnSpark();
      }

      // Center 4.6-5.2s
      if (sec > 4.6 && sec <= 5.2) {
        const k = ease((sec - 4.6) / 0.6);
        textX = lerp(0, -100, k);
        textY = lerp(40, 30, k);
        textS = lerp(1.05, 1.08, k);
      }

      // Hold 5.2-6.0s
      if (sec > 5.2) {
        textX = -100; textY = 30; textS = 1.08;
      }

      // Apply transforms
      setUpper(upperRot);
      setFore(foreRot);
      setGripper(gripRot, gripX, gripY);
      setFingerL(fingerLA);
      setFingerR(fingerRA);
      setSigbed(textX, textY, textA, textS);

      if (elapsed < totalMs) {
        requestAnimationFrame(frame);
      } else {
        scene.style.transform = 'translate(0,0)';
        revealSite();
      }
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAnimation);
  } else {
    runAnimation();
  }
})();


