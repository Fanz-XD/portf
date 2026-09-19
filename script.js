/* ======================================================
   Affan.dev — main script
   Sections: theme, music, weather canvas, local clock, typing,
   reveal, nav/scrollspy, skill tabs, terminal, contact, back-to-top
   ====================================================== */

/* ===== Toast (shared) ===== */
const AffanToast = (function(){
  const el = document.getElementById('toast');
  let timer = null;
  return function(msg){
    if(!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('show'), 2200);
  };
})();

/* ===== Dark mode ===== */
(function(){
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const iconPath = document.querySelector('#themeIcon path');
  if(!btn) return;

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

/* ===== Background music playlist (YouTube) ===== */
(function(){
  const TRACKS = [
    { id: 'j-2DGYNXRx0' },
    { id: 'mTtShnQmUDc' },
    { id: '5ZQlvQI7PGc' },
    { id: 'rODr5Zfj8RA' },
    { id: 'xlqgggOqIX0' },
    { id: 'OSb14XGzkrs' },
    { id: 'u9ARYzXyp08' },
    { id: '6vNnB4oLZNo' },
    { id: 'Fvt9hEAP6oQ' },
    { id: 'lrIKt5uDWZo' },
    { id: '3qiMJt-JBb4' },
    { id: 'IBLmo13vlq4' },
    { id: 'gbcexRAWJyY' },
    { id: 'hRr7qRb-7k4' },
    { id: 'GVQON-muEFc' },
    { id: 'pOm2JieAuCA' },
    { id: 'DCYmJDO2_IE' },
    { id: 'TdrL3QxjyVw' },
    { id: 'ko70cExuzZM' },
    { id: '4tPJPE4uOEo' },
    { id: 'DeumyOzKqgI' },
    { id: 'O1PkZaFy61Y' },
    { id: '1lrFsXkT_rM' },
    { id: 'a2giXO6eyuI' }
  ];

  const btn = document.getElementById('musicToggle');
  const panel = document.getElementById('musicPanel');
  const mount = document.getElementById('ytMusicPlayer');
  const listEl = document.getElementById('musicTracklist');
  const coverEl = document.getElementById('musicCover');
  const labelEl = document.getElementById('musicNowLabel');
  const titleEl = document.getElementById('musicNowTitle');
  const progressFill = document.getElementById('musicProgressFill');
  const progressBar = document.getElementById('musicProgress');
  const playPauseBtn = document.getElementById('musicPlayPause');
  const prevBtn = document.getElementById('musicPrev');
  const nextBtn = document.getElementById('musicNext');
  if(!btn || !panel || !mount || !listEl || !progressBar) return;

  let player = null;
  let apiReady = false;
  let playRequested = false;
  let currentIndex = 0;
  let progressTimer = null;

  function cover(id){ return 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg'; }
  function trackName(i){ return TRACKS[i].title || ('Track ' + (i + 1)); }

  function renderList(){
    listEl.innerHTML = '';
    TRACKS.forEach(function(t, i){
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'music-track' + (i === currentIndex ? ' active' : '');
      b.innerHTML =
        '<span class="music-track-num">' + (i + 1) + '</span>' +
        '<img class="music-track-thumb" src="' + cover(t.id) + '" alt="">' +
        '<span class="music-track-name">' + trackName(i) + '</span>';
      b.addEventListener('click', function(){
        playRequested = true;
        playIndex(i);
      });
      li.appendChild(b);
      listEl.appendChild(li);
    });
  }

  function updateNowCard(){
    coverEl.src = cover(TRACKS[currentIndex].id);
    titleEl.textContent = trackName(currentIndex);
    labelEl.textContent = 'Now playing';
    listEl.querySelectorAll('.music-track').forEach(function(el, i){
      el.classList.toggle('active', i === currentIndex);
    });
  }

  function fetchTitles(){
    TRACKS.forEach(function(t, i){
      fetch('https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=' + t.id + '&format=json')
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(data){
          if(data && data.title){
            TRACKS[i].title = data.title;
            renderList();
            if(i === currentIndex) updateNowCard();
          }
        })
        .catch(function(){});
    });
  }

  function setPlayingUI(isPlaying){
    btn.classList.toggle('is-playing', isPlaying);
    btn.setAttribute('aria-pressed', String(isPlaying));
    playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
    playPauseBtn.setAttribute('aria-pressed', String(isPlaying));
    playPauseBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    if(isPlaying){
      if(progressTimer) clearInterval(progressTimer);
      progressTimer = setInterval(updateProgress, 500);
    }else if(progressTimer){
      clearInterval(progressTimer);
    }
  }

  function updateProgress(){
    if(!player || typeof player.getDuration !== 'function') return;
    const d = player.getDuration();
    const c = player.getCurrentTime();
    if(d > 0) progressFill.style.width = Math.min(100, (c / d) * 100) + '%';
  }

  function createPlayer(){
    player = new YT.Player(mount, {
      height: '0',
      width: '0',
      videoId: TRACKS[currentIndex].id,
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, playsinline: 1 },
      events: {
        onReady: function(){
          if(playRequested) player.playVideo();
        },
        onStateChange: function(e){
          if(e.data === YT.PlayerState.PLAYING) setPlayingUI(true);
          else if(e.data === YT.PlayerState.PAUSED) setPlayingUI(false);
          else if(e.data === YT.PlayerState.ENDED){
            playRequested = true;
            playIndex((currentIndex + 1) % TRACKS.length);
          }
        }
      }
    });
  }

  function playIndex(i){
    currentIndex = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length;
    progressFill.style.width = '0%';
    updateNowCard();
    if(!apiReady){
      loadApi();
      return;
    }
    if(!player){
      createPlayer();
      return;
    }
    player.loadVideoById(TRACKS[currentIndex].id);
  }

  window.onYouTubeIframeAPIReady = function(){
    apiReady = true;
    createPlayer();
  };

  function loadApi(){
    if(document.getElementById('ytIframeApi')) return;
    const tag = document.createElement('script');
    tag.id = 'ytIframeApi';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  renderList();
  updateNowCard();
  fetchTitles();

  btn.addEventListener('click', function(e){
    e.stopPropagation();
    const isOpen = panel.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });
  document.addEventListener('click', function(e){
    if(!panel.contains(e.target) && e.target !== btn){
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
  panel.addEventListener('click', function(e){ e.stopPropagation(); });

  playPauseBtn.addEventListener('click', function(){
    playRequested = true;
    if(!apiReady){
      loadApi();
      return;
    }
    if(!player || typeof player.getPlayerState !== 'function') return;
    if(player.getPlayerState() === YT.PlayerState.PLAYING){
      player.pauseVideo();
    }else{
      player.playVideo();
    }
  });
  prevBtn.addEventListener('click', function(){
    playRequested = true;
    playIndex(currentIndex - 1);
  });
  nextBtn.addEventListener('click', function(){
    playRequested = true;
    playIndex(currentIndex + 1);
  });

  function seekFromEvent(e){
    if(!player || typeof player.getDuration !== 'function') return;
    const duration = player.getDuration();
    if(!duration || duration <= 0) return;
    const rect = progressBar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    player.seekTo(duration * ratio, true);
    progressFill.style.width = (ratio * 100) + '%';
  }

  progressBar.addEventListener('click', seekFromEvent);
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
    const skyEl = document.getElementById('sky');
    if(skyEl) skyEl.style.setProperty('--gust', (Math.sin(Date.now() / 900) * gust * 3) + 'px');
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

/* ===== Live local clock (WIB) ===== */
(function(){
  const el = document.getElementById('localClock');
  if(!el) return;
  function tick(){
    const now = new Date();
    // Asia/Jakarta = WIB, independent of the visitor's own timezone
    const t = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false
    }).format(now);
    el.textContent = t;
  }
  tick();
  setInterval(tick, 15000);
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

/* ===== Navigation: scrollspy + mobile menu + section rail ===== */
(function(){
  const links = document.querySelectorAll('[data-nav]');
  const railDots = document.querySelectorAll('[data-rail]');
  const sectionIds = ['about','education','certificates','skills','roadmap','contact'];
  const sections = sectionIds.map(id => document.getElementById(id));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        links.forEach(l => l.classList.remove('active'));
        railDots.forEach(d => d.classList.remove('active'));
        const match = document.querySelector(`[data-nav][href="#${entry.target.id}"]`);
        if(match) match.classList.add('active');
        const dot = document.querySelector(`[data-rail][href="#${entry.target.id}"]`);
        if(dot) dot.classList.add('active');
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
    indicator.style.transform = `translateX(${tab.offsetLeft}px)`;
  }

  function activate(tab){
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.skill-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    moveIndicator(tab);
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', (e) => {
      if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      activate(next);
      next.focus();
    });
  });
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
      out.className = 'terminal-line appear terminal-out';
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
      out.className = 'terminal-line appear terminal-out';
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

/* ===== Command palette ===== */
(function(){
  const root = document.getElementById('palette');
  const backdrop = document.getElementById('paletteBackdrop');
  const input = document.getElementById('paletteInput');
  const resultsEl = document.getElementById('paletteResults');
  const openBtn = document.getElementById('paletteToggle');
  const kbdEl = document.getElementById('paletteKbd');
  if(!root || !input || !resultsEl) return;

  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  if(kbdEl) kbdEl.textContent = isMac ? '\u2318K' : 'Ctrl K';

  const items = [
    { label: 'Home', hint: 'section', run: () => go('home') },
    { label: 'About', hint: 'section', run: () => go('about') },
    { label: 'Education', hint: 'section', run: () => go('education') },
    { label: 'Records', hint: 'certificates', run: () => go('certificates') },
    { label: 'Skills', hint: 'section', run: () => go('skills') },
    { label: 'Roadmap', hint: 'section', run: () => go('roadmap') },
    { label: 'Contact', hint: 'section', run: () => go('contact') },
    { label: 'Toggle dark mode', hint: 'command', run: () => click('themeToggle') },
    { label: 'Set weather: clear', hint: 'command', run: () => click(w('clear')) },
    { label: 'Set weather: drizzle', hint: 'command', run: () => click(w('drizzle')) },
    { label: 'Set weather: rain', hint: 'command', run: () => click(w('rain')) },
    { label: 'Set weather: windy', hint: 'command', run: () => click(w('windy')) },
    { label: 'Play / pause music', hint: 'command', run: () => click('musicToggle') },
    { label: 'Copy email address', hint: 'command', run: () => click(document.querySelector('.contact-copy')) },
    { label: 'Open Instagram', hint: 'link', run: () => window.open('https://instagram.com/affanprtgga', '_blank', 'noopener') },
    { label: 'Save contact card', hint: 'command', run: () => click('vcardBtn') },
    { label: 'Print portfolio', hint: 'command', run: () => window.print() },
    { label: 'Login', hint: 'page', run: () => { window.location.href = 'login.html'; } },
    { label: 'Create account', hint: 'page', run: () => { window.location.href = 'register.html'; } }
  ];

  function w(mode){ return document.querySelector('[data-weather="' + mode + '"]'); }
  function click(elOrId){
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if(el) el.click();
  }
  function go(id){
    const el = document.getElementById(id);
    if(el) el.scrollIntoView({ behavior: 'smooth' });
  }

  let filtered = items.slice();
  let activeIndex = 0;

  function render(){
    resultsEl.innerHTML = '';
    if(!filtered.length){
      const empty = document.createElement('div');
      empty.className = 'palette-empty';
      empty.textContent = 'No matching command.';
      resultsEl.appendChild(empty);
      return;
    }
    filtered.forEach((item, i) => {
      const li = document.createElement('li');
      li.className = 'palette-item' + (i === activeIndex ? ' active' : '');
      li.innerHTML = '<span>' + item.label + '</span><span>' + item.hint + '</span>';
      li.addEventListener('mouseenter', () => { activeIndex = i; render(); });
      li.addEventListener('click', () => execute(i));
      resultsEl.appendChild(li);
    });
    const activeEl = resultsEl.children[activeIndex];
    if(activeEl) activeEl.scrollIntoView({ block: 'nearest' });
  }

  function filter(){
    const q = input.value.trim().toLowerCase();
    filtered = !q ? items.slice() : items.filter(it => it.label.toLowerCase().includes(q) || it.hint.toLowerCase().includes(q));
    activeIndex = 0;
    render();
  }

  function execute(i){
    const item = filtered[i];
    if(!item) return;
    close();
    setTimeout(item.run, 120);
  }

  function open(){
    root.classList.add('open');
    root.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    input.value = '';
    filter();
    setTimeout(() => input.focus(), 30);
  }

  function close(){
    root.classList.remove('open');
    root.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
  }

  if(openBtn) openBtn.addEventListener('click', open);
  if(backdrop) backdrop.addEventListener('click', close);
  input.addEventListener('input', filter);

  document.addEventListener('keydown', (e) => {
    const meta = isMac ? e.metaKey : e.ctrlKey;
    if(meta && e.key.toLowerCase() === 'k'){
      e.preventDefault();
      root.classList.contains('open') ? close() : open();
      return;
    }
    if(!root.classList.contains('open')) return;
    if(e.key === 'Escape'){ close(); return; }
    if(e.key === 'ArrowDown'){ e.preventDefault(); activeIndex = Math.min(activeIndex + 1, filtered.length - 1); render(); }
    if(e.key === 'ArrowUp'){ e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); render(); }
    if(e.key === 'Enter'){ e.preventDefault(); execute(activeIndex); }
  });
})();

/* ===== Lightbox (portrait + certificate scans) ===== */
(function(){
  const root = document.getElementById('lightbox');
  const backdrop = document.getElementById('lightboxBackdrop');
  const closeBtn = document.getElementById('lightboxClose');
  const imgEl = document.getElementById('lightboxImg');
  const capEl = document.getElementById('lightboxCaption');
  const triggers = document.querySelectorAll('[data-lightbox-src]');
  if(!root || !imgEl || !triggers.length) return;

  function open(src, caption){
    imgEl.src = src;
    imgEl.alt = caption || '';
    capEl.textContent = caption || '';
    root.classList.add('open');
    root.setAttribute('aria-hidden', 'false');
  }
  function close(){
    root.classList.remove('open');
    root.setAttribute('aria-hidden', 'true');
  }

  triggers.forEach(t => t.addEventListener('click', () => {
    if(t.querySelector('img') && t.querySelector('img').style.display === 'none') return;
    open(t.dataset.lightboxSrc, t.dataset.lightboxCaption);
  }));
  if(backdrop) backdrop.addEventListener('click', close);
  if(closeBtn) closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') close(); });
})();

/* ===== Print / save as PDF ===== */
(function(){
  const btn = document.getElementById('printBtn');
  if(!btn) return;
  btn.addEventListener('click', () => window.print());
})();

/* ===== Save contact as vCard ===== */
(function(){
  const btn = document.getElementById('vcardBtn');
  if(!btn) return;
  btn.addEventListener('click', () => {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Pratangga;Affan;;;',
      'FN:Affan Pratangga',
      'TITLE:Cybersecurity Practitioner & Web Developer',
      'EMAIL;TYPE=INTERNET:affanpratangga12@gmail.com',
      'URL:https://instagram.com/affanprtgga',
      'ADR:;;Lamongan;East Java;;;Indonesia',
      'END:VCARD'
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'affan-pratangga.vcf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    AffanToast('Contact card downloaded');
  });
})();
