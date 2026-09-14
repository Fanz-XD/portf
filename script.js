/* ======================================================
   Affan.dev — main script
   Sections: theme, weather canvas, clouds, typing, reveal,
   nav/scrollspy, skill tabs, terminal, contact form/copy,
   cursor glow, hero stat counters, back-to-top
   ====================================================== */

/* ===== Dark mode ===== */
(function(){
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const iconPath = document.querySelector('#themeIcon path');

  const SUN = "M12 4V2M12 22v-2M4.93 4.93 3.51 3.51M20.49 20.49l-1.42-1.42M4 12H2m20 0h-2M4.93 19.07l-1.42 1.42M20.49 3.51l-1.42 1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z";
  const MOON = "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z";

  function apply(theme){
    if(theme === 'dark'){ root.setAttribute('data-theme','dark'); }
    else{ root.removeAttribute('data-theme'); }
    if(iconPath) iconPath.setAttribute('d', theme === 'dark' ? SUN : MOON);
    btn.setAttribute('aria-pressed', theme === 'dark');
  }

  const saved = localStorage.getItem('affan-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  apply(saved || (prefersDark ? 'dark' : 'light'));

  btn.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    apply(next);
    localStorage.setItem('affan-theme', next);
  });
})();

/* ===== Stars (dark mode clear sky) ===== */
(function(){
  const holder = document.getElementById('stars');
  const count = 60;
  for(let i = 0; i < count; i++){
    const s = document.createElement('span');
    s.className = 'star';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 70 + '%';
    s.style.animationDelay = (-Math.random() * 3.5) + 's';
    s.style.width = s.style.height = (Math.random() < 0.15 ? 3 : 2) + 'px';
    holder.appendChild(s);
  }
})();

/* ===== Weather effect canvas (clear / drizzle / rain / windy) =====
   Aims for a believable feel rather than a cartoon one:
   - rain/drizzle: angled streaks with motion-appropriate length,
     faint ground splashes, and a soft overcast tint over the page
   - windy: smooth, wandering gusts that carry leaf-like particles
     and gently sway the cloud layer — no straight guide lines
*/
const WeatherFX = (function(){
  const canvas = document.getElementById('weatherCanvas');
  const ctx = canvas.getContext('2d');
  const tint = document.getElementById('weatherTint');
  let w, h, dpr;
  let drops = [];
  let splashes = [];
  let leaves = [];
  let mode = 'clear';
  let raf = null;
  let gust = 0, gustTarget = 0;

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function makeDrops(count, opts){
    drops = [];
    for(let i = 0; i < count; i++){
      drops.push({
        x: Math.random() * (w + 200) - 100,
        y: Math.random() * h,
        len: opts.lenMin + Math.random() * (opts.lenMax - opts.lenMin),
        speed: opts.speedMin + Math.random() * (opts.speedMax - opts.speedMin),
        drift: opts.drift + (Math.random() - 0.5) * 0.12,
        opacity: opts.opMin + Math.random() * (opts.opMax - opts.opMin),
        width: opts.width
      });
    }
  }

  function makeLeaves(count){
    leaves = [];
    for(let i = 0; i < count; i++){
      leaves.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 5 + Math.random() * 7,
        baseSpeed: 1.6 + Math.random() * 2.2,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.02 + Math.random() * 0.025,
        swayAmp: 10 + Math.random() * 18,
        fallSpeed: 0.3 + Math.random() * 0.5,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.06,
        hue: Math.random() < 0.5,
        opacity: 0.55 + Math.random() * 0.35
      });
    }
  }

  function isDark(){ return document.documentElement.getAttribute('data-theme') === 'dark'; }

  function drawDrops(dt){
    const color = isDark() ? '176,205,240' : '90,140,185';
    ctx.lineCap = 'round';
    drops.forEach(d => {
      const fall = d.speed * dt;
      ctx.strokeStyle = `rgba(${color},${d.opacity})`;
      ctx.lineWidth = d.width;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.drift * d.len, d.y + d.len);
      ctx.stroke();

      d.x += d.drift * fall;
      d.y += fall;

      if(d.y > h - 4){
        if(mode === 'rain' && Math.random() < 0.35){
          splashes.push({ x: d.x, y: h - 2 + Math.random() * 6, r: 0, maxR: 3 + Math.random() * 4, opacity: 0.5 });
        }
        d.y = -20 - Math.random() * 40;
        d.x = Math.random() * (w + 200) - 100;
      } else if(d.x > w + 60 || d.x < -60){
        d.x = Math.random() * (w + 200) - 100;
        d.y = -20;
      }
    });

    // ground splashes
    const splashColor = isDark() ? '190,215,245' : '110,160,205';
    for(let i = splashes.length - 1; i >= 0; i--){
      const s = splashes[i];
      s.r += 0.5;
      s.opacity -= 0.03;
      if(s.opacity <= 0 || s.r > s.maxR){ splashes.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(${splashColor},${s.opacity})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.r, s.r * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function leafPath(size){
    // a soft teardrop / leaf silhouette instead of a plain ellipse
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(size * 0.9, -size * 0.3, 0, size);
    ctx.quadraticCurveTo(-size * 0.9, -size * 0.3, 0, -size);
    ctx.closePath();
  }

  function drawLeaves(dt){
    const colorA = isDark() ? '150,190,255' : '78,157,224';
    const colorB = isDark() ? '190,170,255' : '61,134,198';
    // gusts: strength wanders smoothly instead of a constant wind speed
    if(Math.random() < 0.006) gustTarget = 0.7 + Math.random() * 0.9;
    gust += (gustTarget - gust) * 0.012;

    leaves.forEach(l => {
      l.sway += l.swaySpeed * dt * 22;
      l.rot += l.rotSpeed * dt * 18;
      const speed = l.baseSpeed * (0.7 + gust * 0.3);
      l.x += speed * dt * 22;
      l.y += (Math.sin(l.sway) * l.swayAmp * 0.015) + l.fallSpeed * dt * 8;

      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rot);
      ctx.fillStyle = `rgba(${l.hue ? colorA : colorB},${l.opacity})`;
      leafPath(l.size);
      ctx.fill();
      ctx.restore();

      if(l.x > w + 30){ l.x = -30; l.y = Math.random() * h; }
      if(l.y > h + 30){ l.y = -30; }
    });

    // sway the cloud layer gently with the same gust for a cohesive feel
    document.getElementById('sky').style.setProperty('--gust', (Math.sin(Date.now() / 900) * gust * 3) + 'px');
  }

  let lastT = performance.now();
  function loop(now){
    const dt = Math.min(2, (now - lastT) / 16.67);
    lastT = now;
    ctx.clearRect(0, 0, w, h);
    if(mode === 'drizzle' || mode === 'rain') drawDrops(dt);
    if(mode === 'windy') drawLeaves(dt);
    raf = requestAnimationFrame(loop);
  }

  function setMode(next){
    mode = next;
    document.body.dataset.weather = mode;
    splashes = [];

    // wind speeds up cloud drift, rain slows it slightly (heavier air)
    const speedMultiplier = mode === 'windy' ? 0.5 : (mode === 'rain' ? 1.2 : 1);
    document.querySelectorAll('.cloud').forEach(c => {
      c.style.animationDuration = (parseFloat(c.dataset.baseDuration) * speedMultiplier) + 's';
    });

    tint.classList.toggle('show', mode === 'rain' || mode === 'drizzle');
    tint.classList.toggle('heavy', mode === 'rain');

    if(mode === 'drizzle'){
      makeDrops(55, { lenMin: 7, lenMax: 13, speedMin: 2.6, speedMax: 4.2, drift: 0.22, opMin: 0.12, opMax: 0.25, width: 1 });
    } else if(mode === 'rain'){
      makeDrops(190, { lenMin: 14, lenMax: 28, speedMin: 7.5, speedMax: 12.5, drift: 0.42, opMin: 0.22, opMax: 0.4, width: 1.3 });
    } else if(mode === 'windy'){
      makeLeaves(20);
    }
  }

  function init(){
    if(!raf) raf = requestAnimationFrame(loop);
    setMode('clear');
  }

  return { init, setMode, get mode(){ return mode; } };
})();
WeatherFX.init();

/* ===== Weather widget dropdown ===== */
(function(){
  const toggle = document.getElementById('weatherToggle');
  const menu = document.getElementById('weatherMenu');
  const options = document.querySelectorAll('.weather-option');

  function close(){
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  function open(){
    menu.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.contains('open') ? close() : open();
  });
  document.addEventListener('click', (e) => {
    if(!menu.contains(e.target)) close();
  });

  const saved = localStorage.getItem('affan-weather') || 'clear';
  options.forEach(opt => {
    if(opt.dataset.weather === saved) opt.classList.add('active');
    else opt.classList.remove('active');
    opt.addEventListener('click', () => {
      options.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      WeatherFX.setMode(opt.dataset.weather);
      localStorage.setItem('affan-weather', opt.dataset.weather);
      close();
    });
  });
  WeatherFX.setMode(saved);
})();

/* ===== Floating clouds background ===== */
(function(){
  const sky = document.getElementById('sky');
  const cloudCount = 7;
  function cloudSVG(scale, opacity, id){
    const w = 200 * scale, h = 96 * scale;
    return `<svg width="${w}" height="${h}" viewBox="0 0 200 96" style="opacity:${opacity}">
      <defs>
        <radialGradient id="cg${id}a" cx="40%" cy="30%" r="75%">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="#EAF3FC"/>
        </radialGradient>
        <linearGradient id="cg${id}b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="55%" stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="#D7E7F5"/>
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="70" rx="62" ry="20" fill="url(#cg${id}b)"/>
      <ellipse cx="55" cy="58" rx="52" ry="28" fill="url(#cg${id}a)"/>
      <ellipse cx="100" cy="36" rx="46" ry="36" fill="url(#cg${id}a)"/>
      <ellipse cx="144" cy="56" rx="42" ry="25" fill="url(#cg${id}a)"/>
    </svg>`;
  }
  for(let i = 0; i < cloudCount; i++){
    const el = document.createElement('div');
    el.className = 'cloud';
    const scale = 0.5 + Math.random() * 1.1;
    const opacity = 0.55 + Math.random() * 0.35;
    const top = Math.random() * 85;
    const duration = 45 + Math.random() * 70;
    const delay = -Math.random() * duration;
    el.style.top = top + '%';
    el.style.left = '0';
    el.style.animationDuration = duration + 's';
    el.style.animationDelay = delay + 's';
    el.dataset.baseDuration = duration;
    el.innerHTML = cloudSVG(scale, opacity, i);
    sky.appendChild(el);
  }
  // gentle parallax following mouse movement
  document.addEventListener('mousemove', (e) => {
    const y = (e.clientY / window.innerHeight - 0.5) * 16;
    sky.style.setProperty('--parallax-y', y + 'px');
    document.querySelectorAll('.cloud').forEach(c => c.style.setProperty('--parallax-y', y + 'px'));
  });
})();

/* ===== Cursor glow (desktop only) ===== */
(function(){
  const glow = document.getElementById('cursorGlow');
  if(window.matchMedia('(pointer: coarse)').matches) return;
  let shown = false;
  document.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
    if(!shown){ glow.classList.add('on'); shown = true; }
  });
  document.addEventListener('mouseleave', () => glow.classList.remove('on'));
})();

/* ===== Magnetic buttons ===== */
(function(){
  document.querySelectorAll('.magnetic').forEach(btn => {
    if(window.matchMedia('(pointer: coarse)').matches) return;
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.35 - 2}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
})();

/* ===== Typing effect for role ===== */
(function(){
  const roles = ['Cybersecurity Practitioner', 'Bug Hunter', 'Web Developer'];
  const el = document.getElementById('roleText');
  let ri = 0, ci = 0, deleting = false;

  function tick(){
    const current = roles[ri];
    if(!deleting){
      ci++;
      el.textContent = current.slice(0, ci);
      if(ci === current.length){ deleting = true; setTimeout(tick, 1400); return; }
    } else {
      ci--;
      el.textContent = current.slice(0, ci);
      if(ci === 0){ deleting = false; ri = (ri + 1) % roles.length; }
    }
    setTimeout(tick, deleting ? 40 : 70);
  }
  tick();
})();

/* ===== Hero stat counters ===== */
(function(){
  const stats = document.querySelectorAll('.stat-num');
  if(!stats.length) return;
  let done = false;
  function run(){
    if(done) return;
    done = true;
    stats.forEach(stat => {
      const target = parseInt(stat.dataset.count, 10);
      let cur = 0;
      const step = Math.max(1, Math.round(target / 30));
      const t = setInterval(() => {
        cur += step;
        if(cur >= target){ cur = target; clearInterval(t); }
        stat.textContent = cur;
      }, 35);
    });
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting) run(); });
  }, { threshold: 0.5 });
  io.observe(document.querySelector('.hero-stats'));
})();

/* ===== Reveal on scroll (generic, staggered) ===== */
(function(){
  const targets = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if(e.isIntersecting){
        setTimeout(() => e.target.classList.add('in-view'), (i % 6) * 60);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach(t => io.observe(t));
})();

/* ===== Scroll progress bar ===== */
(function(){
  const bar = document.getElementById('progressBar');
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    bar.style.width = scrolled + '%';
  });
})();

/* ===== Scroll cue click ===== */
(function(){
  const cue = document.getElementById('scrollCue');
  if(!cue) return;
  cue.addEventListener('click', () => {
    document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
  });
})();

/* ===== Navigation: scrollspy + mobile menu ===== */
(function(){
  const links = document.querySelectorAll('[data-nav]');
  const sections = ['about','education','certificates','skills','roadmap','contact'].map(id => document.getElementById(id));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        links.forEach(l => l.classList.remove('active'));
        const match = document.querySelector(`[data-nav][href="#${entry.target.id}"]`);
        if(match) match.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  sections.forEach(s => s && io.observe(s));

  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    menu.classList.toggle('open');
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    toggle.classList.remove('open');
    menu.classList.remove('open');
  }));
})();

/* ===== Skills tab (with sliding indicator) ===== */
(function(){
  const tabs = document.querySelectorAll('.skill-tab');
  const indicator = document.getElementById('tabIndicator');

  function moveIndicator(tab){
    indicator.style.width = tab.offsetWidth + 'px';
    indicator.style.transform = `translateX(${tab.offsetLeft - 5}px)`;
  }

  function activate(tab){
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.skill-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    moveIndicator(tab);
  }

  tabs.forEach(tab => tab.addEventListener('click', () => activate(tab)));
  window.addEventListener('resize', () => {
    const active = document.querySelector('.skill-tab.active');
    if(active) moveIndicator(active);
  });
  // init position once fonts/layout settle
  requestAnimationFrame(() => moveIndicator(document.querySelector('.skill-tab.active')));
})();

/* ===== Interactive terminal ===== */
(function(){
  const commands = [
    { cmd: 'whoami', out: 'affan_pratangga — cybersecurity practitioner & web developer' },
    { cmd: 'cat focus.txt', out: 'bug hunting, security monitoring, ethical hacking, web dev' },
    { cmd: 'uname -a', out: 'Arch Linux / Kali Linux — daily driver' },
    { cmd: 'cat plans.txt', out: 'official certification in cybersecurity & ethical hacking' },
    { cmd: 'echo $STATUS', out: 'open for web project collaboration & security discussions' }
  ];
  let idx = 0;
  const body = document.getElementById('terminalBody');
  const runBtn = document.getElementById('termRun');
  const firstLine = document.getElementById('termLine');
  const cursor = document.getElementById('termCursor');

  function typeLine(text, cb){
    let i = 0;
    firstLine.textContent = '';
    const t = setInterval(() => {
      firstLine.textContent = text.slice(0, i);
      i++;
      if(i > text.length){ clearInterval(t); cb && cb(); }
    }, 35);
  }

  typeLine(commands[0].cmd, () => {
    setTimeout(() => {
      const out = document.createElement('p');
      out.className = 'terminal-line appear';
      out.style.color = '#9FD3FF';
      out.textContent = commands[0].out;
      cursor.remove();
      body.appendChild(out);
    }, 300);
  });

  runBtn.addEventListener('click', () => {
    idx = (idx + 1) % commands.length;
    const line = document.createElement('p');
    line.className = 'terminal-line appear';
    line.innerHTML = '<span class="terminal-prompt">$</span> ' + commands[idx].cmd;
    body.appendChild(line);
    setTimeout(() => {
      const out = document.createElement('p');
      out.className = 'terminal-line appear';
      out.style.color = '#9FD3FF';
      out.textContent = commands[idx].out;
      body.appendChild(out);
      body.scrollTop = body.scrollHeight;
    }, 350);
    body.scrollTop = body.scrollHeight;
  });
})();

/* ===== Copy email to clipboard ===== */
(function(){
  const btn = document.querySelector('.contact-copy');
  if(!btn) return;
  const hint = btn.querySelector('.copy-hint');
  const originalHint = hint.textContent;
  btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    try{
      await navigator.clipboard.writeText(text);
    } catch(err){
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    btn.classList.add('copied');
    hint.textContent = 'Copied!';
    setTimeout(() => {
      btn.classList.remove('copied');
      hint.textContent = originalHint;
    }, 1800);
  });
})();

/* ===== Contact form (Formspree) ===== */
(function(){
  const FORM_ENDPOINT = 'https://formspree.io/f/mgaebwjq';
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const btn = document.getElementById('formSubmit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'Sending...';
    status.className = 'form-status';
    btn.disabled = true;

    try{
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });
      if(res.ok){
        status.textContent = 'Message sent. Thanks for reaching out!';
        status.className = 'form-status ok';
        form.reset();
      } else {
        status.textContent = "The form isn't connected to Formspree yet. Replace FORM_ENDPOINT first.";
        status.className = 'form-status err';
      }
    } catch(err){
      status.textContent = "The form isn't connected to Formspree yet. Replace FORM_ENDPOINT first.";
      status.className = 'form-status err';
    } finally {
      btn.disabled = false;
    }
  });
})();

/* ===== Back to top button ===== */
(function(){
  const btn = document.getElementById('toTop');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 500);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ===== Ripple effect on .btn elements ===== */
(function(){
  document.querySelectorAll('.btn, .skill-tab, .terminal-run').forEach(btn => {
    btn.addEventListener('click', function(e){
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.5;
      ripple.style.cssText = `
        position:absolute; border-radius:50%; pointer-events:none;
        width:${size}px; height:${size}px;
        left:${e.clientX - rect.left - size/2}px;
        top:${e.clientY - rect.top - size/2}px;
        background:rgba(255,255,255,0.3);
        transform:scale(0); animation:rippleAnim 0.55s ease-out forwards;
      `;
      // inject keyframes once
      if(!document.getElementById('rippleStyle')){
        const s = document.createElement('style');
        s.id = 'rippleStyle';
        s.textContent = '@keyframes rippleAnim{to{transform:scale(1);opacity:0;}}';
        document.head.appendChild(s);
      }
      const prev = this.style.position;
      if(!prev || prev === 'static') this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
})();

/* ===== 3D card tilt effect on cards (desktop only) ===== */
(function(){
  if(window.matchMedia('(pointer: coarse)').matches) return;
  const cards = document.querySelectorAll('.edu-card, .cert-card, .focus-item, .road-step, .contact-card, .contact-form-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ===== Smooth active nav link underline ===== */
(function(){
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('mouseenter', () => link.style.transition = 'all 0.18s ease');
    link.addEventListener('mouseleave', () => link.style.transition = 'all 0.18s ease');
  });
})();
