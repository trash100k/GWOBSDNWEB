export const STYLES = `
:root{
  color-scheme: dark;
  /* GAELWORX official palette — Industrial Metallurgy */
  --gw-void:#0B0C10;        /* Forged Iron */
  --gw-obsidian:#0a0b10; --gw-iron:#1F2833;  /* Cold Steel */
  --gw-steel:#8D99AE;       /* Ash */
  --gw-bone:#F1F2F6;        /* Fog White */
  --gw-ember:#E85D04;       /* Ember Glow */
  --gw-ember-deep:#E34A27; --gw-forge:#C1292E;  /* Celtic Blood */
  /* Type — Cinzel Decorative (brand/display, 700-900 only) · Bricolage (headlines) · Hanken (body) */
  --gw-display:'Cinzel Decorative','Times New Roman',serif;
  --gw-headline:'Bricolage Grotesque Variable',ui-sans-serif,system-ui,sans-serif;
  --gw-sans:'Hanken Grotesk',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;
  --ease:cubic-bezier(0.16,1,0.3,1);
  --safe-t:env(safe-area-inset-top,0px); --safe-r:env(safe-area-inset-right,0px);
  --safe-b:env(safe-area-inset-bottom,0px); --safe-l:env(safe-area-inset-left,0px);
}
*{box-sizing:border-box;}
html,body,#root{margin:0; padding:0;}
body{background:var(--gw-void); color:var(--gw-bone); font-family:var(--gw-sans);
  -webkit-font-smoothing:antialiased; overflow-x:hidden;}
/* Lenis momentum scroll (darkroomengineering/lenis) — required base styles. When
   active it disables native smooth-scroll so the two don't fight. */
html.lenis,html.lenis body{height:auto;}
.lenis.lenis-smooth{scroll-behavior:auto !important;}
.lenis.lenis-smooth [data-lenis-prevent]{overscroll-behavior:contain;}
.lenis.lenis-stopped{overflow:hidden;}
.lenis.lenis-smooth iframe{pointer-events:none;}
::selection{background:rgba(193,41,46,0.4); color:#fff;}

/* A+E IGNITED — the forge fire. The first A and first E of brand proper-nouns
   carry this gradient glow in 900 Cinzel Decorative. DISPLAY/WORDMARK ONLY (the
   GAELWORX mark + the AUTOMATIC EXECUTION headline) — never in lowercase body
   prose, where Cinzel's caps-only glyphs would read as ransom-note text. */
.forge-letter{
  font-family:var(--gw-display); font-weight:900;
  /* sit flush with adjacent display letters — no baseline float from the
     gradient-clipped glyph. inline-block + baseline align + matched metrics. */
  display:inline-block; vertical-align:baseline; line-height:1;
  background:linear-gradient(to bottom, #E85D04, #C1292E, #E34A27, #C0392B);
  background-size:100% 200%;
  -webkit-background-clip:text; background-clip:text; color:transparent;
  -webkit-text-fill-color:transparent;
  text-shadow:0 0 6px rgba(0,0,0,0.5);
  animation:lavaFlow 3s infinite alternate ease-in-out;
}
@keyframes lavaFlow{0%{background-position:0% 0%}100%{background-position:0% 100%}}

/* Brand proper-nouns inline in body copy. A+E ignite is a display/wordmark rule
   only (Cinzel has no lowercase — igniting mid-sentence looks like ransom-note
   text), so here the term stays in the reading font and just carries a touch
   more weight + a faint warm tint so the name reads as a single unit. */
.brand-term{font-family:inherit; font-weight:700; letter-spacing:0.01em;
  color:var(--gw-bone);}

.forge-root{position:relative; width:100%;}

/* slab/mirror canvas, fixed behind everything */
.canvas-fixed{position:fixed; inset:0; z-index:0;}
.canvas-fixed canvas{display:block; touch-action:pan-y;}
/* mask the scene's warm top-light — darken the top of the canvas to true black so
   no orange horizon bar reads behind the nav. Veins/embers below are untouched. */
.canvas-fixed::after{content:""; position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(180deg, #050507 0%, rgba(5,5,7,0.95) 13%, rgba(5,5,7,0.62) 24%, rgba(5,5,7,0.2) 33%, rgba(5,5,7,0) 41%);}
.canvas-fallback{background:
  radial-gradient(70% 50% at 50% 75%, rgba(255,80,25,0.20), transparent 60%),
  linear-gradient(180deg,#05060a,#000); }

/* ── loader ──────────────────────────────────────────────────────────── */
.loader{position:fixed; inset:0; z-index:200; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:18px; background:#040507;
  transition:opacity 1s ease, visibility 1s ease;}
.loader.out{opacity:0; visibility:hidden;}
.loader-mark{font-family:var(--gw-display); font-weight:700; letter-spacing:0.22em;
  font-size:clamp(1.6rem,5vw,3rem); color:var(--gw-bone);
  text-shadow:0 0 30px rgba(255,90,30,0.25); animation:ignite 2.4s var(--ease) both;}
.loader-sub{font-size:11px; letter-spacing:0.5em; text-transform:uppercase; color:var(--gw-ember);}
.loader-bar{width:120px; height:1px; background:rgba(255,150,90,0.18); overflow:hidden;}
.loader-bar i{display:block; height:100%; width:40%; background:var(--gw-ember);
  box-shadow:0 0 12px var(--gw-ember); animation:load 1.6s var(--ease) infinite;}
@keyframes ignite{from{opacity:0; letter-spacing:0.5em; filter:blur(12px);} to{opacity:1; filter:blur(0);}}
@keyframes load{0%{transform:translateX(-120%);}100%{transform:translateX(330%);}}

/* ── nav (pure cinematic): mark + toggle + progress spine + overlay menu ─ */
.nav-mark{position:fixed; z-index:40; top:calc(var(--safe-t) + clamp(16px,2.4vw,28px));
  left:calc(var(--safe-l) + clamp(18px,4vw,42px)); font-family:var(--gw-display);
  font-weight:700; letter-spacing:0.16em; font-size:14px; color:var(--gw-bone);
  background:none; border:0; cursor:pointer;}
.nav-toggle{position:fixed; z-index:60; top:calc(var(--safe-t) + clamp(14px,2.2vw,24px));
  right:calc(var(--safe-r) + clamp(16px,4vw,40px)); width:46px; height:46px; border:0;
  background:none; cursor:pointer; display:flex; flex-direction:column; gap:5px;
  align-items:flex-end; justify-content:center;}
.nav-toggle i{display:block; height:1.5px; background:var(--gw-bone); transition:all .35s var(--ease);}
.nav-toggle i:nth-child(1){width:26px;} .nav-toggle i:nth-child(2){width:18px;} .nav-toggle i:nth-child(3){width:26px;}
.nav-toggle:hover i{background:var(--gw-ember);}
.nav-toggle.open i{width:26px;}
.nav-toggle.open i:nth-child(1){transform:translateY(6.5px) rotate(45deg);}
.nav-toggle.open i:nth-child(2){opacity:0;}
.nav-toggle.open i:nth-child(3){transform:translateY(-6.5px) rotate(-45deg);}

/* Progress spine: a deliberate scroll indicator, inset from the edge so it never
   reads as a border bleeding off-screen. Slim 1px rail + faint Ash track; the
   fill is scaled by scroll (Nav.jsx) with a measured ember glow. */
.nav-spine{position:fixed; z-index:40;
  right:calc(var(--safe-r) + clamp(10px,1.4vw,18px)); top:18vh; bottom:18vh; width:1px;
  background:rgba(141,153,174,0.16);}
.nav-spine__fill{position:absolute; top:0; left:0; right:0; height:100%;
  transform-origin:top; transform:scaleY(0); background:linear-gradient(180deg,var(--gw-ember),var(--gw-forge));
  box-shadow:0 0 5px rgba(232,93,4,0.45);}

.menu{position:fixed; inset:0; z-index:50; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:6px; opacity:0; visibility:hidden;
  background:rgba(4,5,7,0.94); backdrop-filter:blur(10px);
  transition:opacity .6s var(--ease), visibility .6s var(--ease);
  padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);}
.menu.open{opacity:1; visibility:visible;}
.menu-list{display:flex; flex-direction:column; align-items:center; gap:clamp(4px,1vw,10px);}
.menu-item{background:none; border:0; cursor:pointer; display:flex; align-items:baseline;
  gap:14px; color:var(--gw-bone); font-family:var(--gw-headline); font-weight:700;
  font-size:clamp(1.6rem,5.5vw,3rem); letter-spacing:0.02em; line-height:1.1;
  opacity:0; transform:translateY(18px); transition:color .3s, opacity .5s var(--ease), transform .5s var(--ease);
  transition-delay:calc(var(--mi)*40ms);}
.menu.open .menu-item{opacity:1; transform:none;}
.menu-item:hover{color:var(--gw-ember);}
.menu-item.is-current{color:var(--gw-ember);}
.menu-item.is-current .menu-num{color:var(--gw-bone);}
.menu-num{font-size:0.5em; color:var(--gw-ember); font-family:var(--gw-sans); letter-spacing:0.2em;}
.menu-foot{margin-top:clamp(24px,4vw,48px); font-family:var(--gw-headline); color:var(--gw-steel);
  letter-spacing:0.06em; font-size:clamp(12px,1.5vw,16px); opacity:0.8; text-align:center; padding:0 24px;}

/* ── magnetic cursor ─────────────────────────────────────────────────── */
.forge-cursor{position:fixed; top:0; left:0; width:10px; height:10px; margin:-5px 0 0 -5px;
  border-radius:50%; background:var(--gw-ember); box-shadow:0 0 14px var(--gw-ember);
  pointer-events:none; z-index:300; mix-blend-mode:screen;
  transition:width .25s var(--ease), height .25s var(--ease), margin .25s var(--ease), background .25s;}
.forge-cursor.big{width:48px; height:48px; margin:-24px 0 0 -24px; background:rgba(255,90,30,0.16);
  box-shadow:0 0 34px rgba(255,90,30,0.5);}
@media (pointer:coarse){.forge-cursor{display:none;}}

/* ── ambient stage — NO containers. The obsidian IS the environment; the copy
   "frames" are scroll-jacked IN (pinned, never physically moving) from a random
   entry vector each, blur→sharp. A tall invisible track supplies scroll distance
   so the 3D scene stays scroll-reactive and the nav still scrubs. ───────────── */
.stage{position:fixed; inset:0; z-index:2; pointer-events:none;
  padding:var(--safe-t) var(--safe-r) var(--safe-b) var(--safe-l);}
/* ambient vignette ONLY — no warm wash. Pure dark edges for legibility; the only
   fire on screen is the veins in the glass + the jewel type. */
.stage::before{content:""; position:absolute; inset:0; z-index:0; pointer-events:none;
  background:radial-gradient(82% 68% at 50% 50%, rgba(4,5,8,0.6), rgba(4,5,8,0.16) 56%, transparent 84%);}
.scroll-track{position:relative; z-index:0; width:1px; opacity:0; pointer-events:none;}

/* ── atmosphere: just a fine film grain (the warm haze + pointer forge-light pool
   were removed — no ambient orange light/glow anywhere) ─────────────────────── */
.grain{position:fixed; inset:0; z-index:4; pointer-events:none; opacity:0.05; mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");
  background-size:140px 140px; animation:grain .5s steps(3) infinite;}
@keyframes grain{0%{transform:translate(0,0)}33%{transform:translate(-3%,2%)}66%{transform:translate(2%,-3%)}100%{transform:translate(0,0)}}

.frame{position:absolute; inset:0; z-index:1; display:flex; flex-direction:column;
  justify-content:center; align-items:flex-start; padding:12vh clamp(24px,7vw,120px);
  opacity:0; pointer-events:none; will-change:transform,opacity,filter; backface-visibility:hidden;}
.frame--draw{align-items:center; justify-content:center; text-align:center;}
.frame--foot{align-items:center; justify-content:flex-end; text-align:center; padding-bottom:14vh;}
/* only the active frame's controls take pointer input (the canvas keeps its gestures) */
.frame .cta,.frame .branch-row{pointer-events:none;}
.frame.is-active .cta,.frame.is-active .branch-row{pointer-events:auto;}
.fbody{position:relative; width:100%; max-width:680px; will-change:transform;
  transform:translate3d(calc(var(--px,0) * 0.9vw), calc(var(--py,0) * 0.8vh), 0);}
.fbody--wide{max-width:1180px;}

.eyebrow{display:block; font-size:clamp(10px,1.1vw,12.5px); letter-spacing:0.46em;
  font-weight:700; text-transform:uppercase; color:var(--gw-ember); margin-bottom:clamp(16px,2vw,26px);}
.headline{margin:0; font-family:var(--gw-display); text-transform:uppercase; font-weight:900;
  font-size:clamp(1.7rem,6vw,4.6rem); line-height:1.04; letter-spacing:0.02em;}
.etched{color:rgba(236,226,214,0.96);
  text-shadow:0 1px 0 rgba(255,190,130,0.10),0 -1px 1px rgba(0,0,0,0.85),
    0 2px 2px rgba(0,0,0,0.65),0 0 44px rgba(255,90,30,0.16);}
.hero-sub{margin:clamp(20px,2.4vw,30px) 0 0; font-size:clamp(1.05rem,2vw,1.5rem);
  line-height:1.32; color:var(--gw-steel); max-width:32ch;}

.cta{position:relative; display:inline-flex; align-items:center; margin-top:clamp(26px,3.4vw,44px);
  padding:16px 30px; border:1px solid rgba(255,120,50,0.55); border-radius:0; color:#ffd9c2;
  text-decoration:none; cursor:pointer; font-family:inherit;
  font-size:0.8rem; font-weight:700; letter-spacing:0.3em; text-transform:uppercase;
  background:linear-gradient(180deg,rgba(255,90,30,0.07),rgba(255,90,30,0.02));
  transition:color .4s,border-color .4s,box-shadow .5s,transform .3s; overflow:hidden;}
.cta::after{content:""; position:absolute; inset:0;
  background:radial-gradient(120% 160% at 0% 50%,rgba(255,100,40,0.30),transparent 55%);
  opacity:0; transition:opacity .5s;}
.cta:hover{color:#fff; border-color:rgba(255,150,90,0.95);
  box-shadow:0 0 0 1px rgba(255,120,60,0.18),0 10px 50px -12px rgba(255,80,20,0.55); transform:translateY(-1px);}
.cta:hover::after{opacity:1;}
.cta span{position:relative; z-index:1;}
.cta--solid{background:linear-gradient(180deg,rgba(255,95,35,0.95),rgba(210,55,12,0.95));
  border-color:rgba(255,150,90,0.7); color:#1a0b04;}
.cta--solid:hover{color:#1a0b04;}
.cta:active{box-shadow:0 0 0 2px rgba(255,150,90,0.5),0 0 60px -8px rgba(255,90,30,0.8);}

.scrollcue{position:absolute; bottom:calc(var(--safe-b) + 5vh); left:50%; transform:translateX(-50%);
  display:flex; flex-direction:column; align-items:center; gap:10px; font-size:10px;
  letter-spacing:0.4em; text-transform:uppercase; color:rgba(255,200,170,0.45);}
.scrollcue i{width:1px; height:46px; background:linear-gradient(180deg,rgba(255,150,90,0.7),transparent);
  transform-origin:top; animation:cue 2.4s ease-in-out infinite;}
@keyframes cue{0%,100%{transform:scaleY(0.4); opacity:0.4;}50%{transform:scaleY(1); opacity:1;}}

.draw-line{margin:0; font-family:var(--gw-display); font-weight:600; text-transform:uppercase;
  letter-spacing:0.06em; font-size:clamp(1.4rem,4vw,2.6rem); color:rgba(236,226,214,0.92);
  text-shadow:0 0 44px rgba(255,90,30,0.25);}

.kicker{display:block; font-size:11px; letter-spacing:0.4em; font-weight:700;
  text-transform:uppercase; color:var(--gw-ember); margin-bottom:18px;}
.head{margin:0 0 18px; font-family:var(--gw-headline); font-weight:800; color:var(--gw-bone);
  font-size:clamp(1.6rem,4.4vw,3rem); line-height:1.04;}
.body,.intro{margin:0; font-size:clamp(1.02rem,1.6vw,1.2rem); line-height:1.62; color:var(--gw-steel);
  max-width:60ch; text-shadow:0 2px 24px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.7);}
.intro{margin-bottom:10px;}
.body strong{color:var(--gw-bone); font-weight:600;}

/* arsenal — vertical 3D carousel (rolodex). Scroll rotates the wheel up/down;
   the front branch is sharp + lit, the rest tilt away and blur (ethereal). */
.carousel{position:relative; width:100%; height:clamp(348px,56vh,476px);
  margin-top:clamp(22px,3.2vh,40px); perspective:1280px; perspective-origin:50% 50%;}
.wheel{position:absolute; inset:0; margin:0; padding:0; list-style:none;
  transform-style:preserve-3d; will-change:transform;}
.car-item{position:absolute; top:50%; left:0; right:0; margin:0 auto; max-width:680px;
  transform-origin:center center; backface-visibility:hidden; -webkit-backface-visibility:hidden;
  cursor:pointer; padding:0 4px; will-change:transform,opacity,filter;}
.branch-id{display:block; font-size:11px; letter-spacing:0.3em; font-weight:700;
  text-transform:uppercase; color:var(--gw-steel); margin-bottom:14px;}
.branch-line{display:block; font-family:var(--gw-headline); font-weight:800; color:var(--gw-bone);
  font-size:clamp(1.6rem,5vw,2.6rem); line-height:1.06; margin-bottom:14px;
  transition:color .4s var(--ease), text-shadow .4s var(--ease);}
.branch-body{display:block; font-size:clamp(0.98rem,1.5vw,1.14rem); line-height:1.55; max-width:36ch;
  color:rgba(160,167,180,0.85); text-shadow:0 2px 22px rgba(0,0,0,0.85);}
/* the front branch lights up — ember rim + warm glow */
.car-item.is-front .branch-id{color:var(--gw-ember);}
.car-item.is-front .branch-line{color:#fff; text-shadow:0 0 28px rgba(232,93,4,0.55), 0 2px 10px rgba(0,0,0,0.6);}

/* branch price — TEASE only: the "from" entry anchor, to pre-qualify + signal
   accessibility while exploring. The full anchored reveal (elsewhere-comparison +
   deposit) is held for the late rates ledger so the number lands last, after proof. */
.branch-foot{display:flex; flex-direction:column; gap:5px; margin-top:14px;
  border-top:1px solid rgba(141,153,174,0.2); padding-top:12px; max-width:36ch;}
.branch-price{font-family:var(--gw-headline); font-weight:800; letter-spacing:0.01em;
  font-size:clamp(1.05rem,2.1vw,1.4rem); color:var(--gw-bone);}
.branch-price em{font-style:normal; font-weight:600; font-size:0.66em; letter-spacing:0.04em;
  text-transform:uppercase; color:var(--gw-steel);}
.car-item.is-front .branch-price{color:var(--gw-ember); text-shadow:0 0 24px rgba(232,93,4,0.4);}

/* ── the rates beat — the whole ladder as a forged ledger. Premium register,
   accessible numbers; the "forge runs lean" lede reconciles the two. ────────── */
.frame--rates{align-items:center; justify-content:center; text-align:center;}
.frame--rates .fbody{margin:0 auto; max-width:880px; text-align:center;}
.frame--rates .head{font-size:clamp(1.7rem,4.8vw,3rem);}
.rates-lede{margin:0 auto clamp(20px,3vh,34px); max-width:54ch; color:var(--gw-steel); text-align:center;}
.rate-ledger{list-style:none; margin:0 auto; padding:0; width:100%; max-width:760px;
  border-top:1px solid rgba(141,153,174,0.22);}
.rate-row{display:grid; grid-template-columns:minmax(92px,0.7fr) 1.5fr auto; align-items:center;
  gap:clamp(10px,2.4vw,30px); padding:clamp(11px,1.7vh,17px) clamp(4px,1vw,12px);
  border-bottom:1px solid rgba(141,153,174,0.16); text-align:left;}
.rate-tag{font-family:var(--gw-display); font-weight:900; text-transform:uppercase;
  letter-spacing:0.02em; font-size:clamp(0.95rem,2vw,1.3rem); color:var(--gw-bone);}
.rate-anchor{font-size:clamp(11px,1.4vw,14px); line-height:1.3; color:rgba(141,153,174,0.72);
  text-decoration:line-through; text-decoration-color:rgba(193,41,46,0.5);}
.rate-price{font-family:var(--gw-headline); font-weight:800; white-space:nowrap; text-align:right;
  font-size:clamp(1.02rem,2.3vw,1.5rem); color:var(--gw-ember); text-shadow:0 0 22px rgba(232,93,4,0.35);}
.rate-price em{display:block; font-style:normal; font-weight:600; font-size:0.6em; letter-spacing:0.04em;
  text-transform:uppercase; color:var(--gw-steel); text-shadow:none; margin-top:2px;}
.rate-foot{display:block; margin-top:clamp(18px,2.4vh,28px); font-size:11px; letter-spacing:0.32em;
  font-weight:700; text-transform:uppercase; color:var(--gw-steel);}

.avail{display:block; margin-top:clamp(20px,2.4vw,28px); font-size:10.5px; letter-spacing:0.32em;
  font-weight:700; text-transform:uppercase; color:var(--gw-steel);}

.foot-mark{display:block; font-size:clamp(11px,1.3vw,14px); letter-spacing:0.42em; font-weight:600;
  text-transform:uppercase; color:rgba(255,200,170,0.6); margin-bottom:16px;}
.foot-tag{display:block; font-family:var(--gw-headline); font-weight:600; letter-spacing:0.06em;
  font-size:clamp(15px,1.8vw,20px); color:var(--gw-steel);}

/* ── routed pages — normal document flow above the fixed canvas. Home keeps the
   pinned .stage/.frame system; other routes render a scrollable .page. ──────── */
.page{position:relative; z-index:2; min-height:100vh; display:flex; align-items:center;
  justify-content:center; text-align:center; pointer-events:auto;
  padding:calc(var(--safe-t) + 18vh) clamp(24px,7vw,120px) 16vh;}
.page-inner{max-width:680px; margin:0 auto;}
.page--stub .headline{margin-bottom:18px;}
.page-note{margin:18px 0 0; font-family:var(--gw-headline); font-weight:600; letter-spacing:0.04em;
  font-size:clamp(12px,1.5vw,15px); text-transform:uppercase; color:var(--gw-steel);}
.page .cta{margin-top:clamp(28px,3.4vw,44px);}

/* ── SHARED PAGE PLACEMENT SYSTEM (PageShell + Section) ───────────────────
   One rhythm, one measure, one hierarchy for every routed page so spacing +
   placement are identical site-wide. Normal flow above the fixed canvas. */
.pg{position:relative; z-index:2; pointer-events:auto; padding-bottom:6vh;}
.pg-measure{width:min(92vw,1080px); margin-inline:auto;}
.pg-center{text-align:center;}
.pg-start{text-align:left;}
.pg-hero{padding:calc(var(--safe-t) + 22vh) 0 clamp(56px,9vh,110px); text-align:center;}
.pg-title{margin:14px 0 0; font-family:var(--gw-display); text-transform:uppercase; font-weight:900;
  font-size:clamp(2.2rem,7vw,5rem); line-height:1.02; letter-spacing:0.02em;}
.pg-lede{margin:clamp(18px,2.4vw,28px) auto 0; max-width:60ch;
  font-size:clamp(1.1rem,1.7vw,1.4rem); line-height:1.55; color:var(--gw-steel);}
.pg-section{padding:clamp(54px,9vh,120px) 0;}
/* Forge Reveal — sections wipe in blur→sharp + a slight rise (added by Section.jsx
   only with JS + motion allowed; default state stays visible for no-JS/crawlers). */
.pg-section.pg-reveal{opacity:0; transform:translateY(22px); filter:blur(6px);
  will-change:opacity,transform,filter;
  transition:opacity .7s var(--ease), transform .7s var(--ease), filter .7s var(--ease);}
.pg-section.pg-reveal.is-in{opacity:1; transform:none; filter:none;}
.pg-eyebrow{display:block; font-size:11px; letter-spacing:0.4em; font-weight:700; text-transform:uppercase;
  color:var(--gw-ember); margin-bottom:16px;}
.pg-h2{margin:0 0 clamp(20px,3vh,34px); font-family:var(--gw-headline); font-weight:800; color:var(--gw-bone);
  font-size:clamp(1.7rem,4.4vw,2.9rem); line-height:1.06;}
.pg-section p{font-size:clamp(1.02rem,1.5vw,1.18rem); line-height:1.62; color:var(--gw-steel);}
.pg-center p{max-width:62ch; margin-inline:auto;}
.pg-start p{max-width:64ch;}
.pg-start .pg-eyebrow,.pg-start .pg-h2{text-align:left;}
/* brutalist panel — sharp corners, Ash border, 8px hard shadow (L1/L3 depth) */
.pg-panel{border:1px solid rgba(141,153,174,0.25); background:rgba(15,17,22,0.5);
  box-shadow:8px 8px 0 rgba(0,0,0,0.55);}
.pg-section.pg-panel{padding:clamp(26px,4vw,52px); margin:clamp(40px,7vh,90px) auto;}
.pg-cta{padding:clamp(70px,12vh,150px) 0 clamp(36px,6vh,80px); text-align:center;}
.pg-cta-head{margin:0; font-family:var(--gw-display); text-transform:uppercase; font-weight:900;
  font-size:clamp(2rem,6vw,3.6rem); letter-spacing:0.03em;}
.pg-cta .cta{margin-top:clamp(22px,3vw,34px);}
.pg-cta .avail{margin-top:18px;}
/* simple two/three-up grid helper for "what you get" style sections */
.pg-grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:clamp(16px,2vw,28px);
  margin-top:clamp(24px,4vh,44px); text-align:left;}
.pg-grid .pg-panel{padding:clamp(20px,2.4vw,30px);}
.pg-grid h3{margin:0 0 10px; font-family:var(--gw-headline); font-weight:800; color:var(--gw-bone);
  font-size:clamp(1.05rem,1.7vw,1.3rem);}
@media (max-width:560px){.pg-hero{padding-top:calc(var(--safe-t) + 17vh);}}

/* ── kinetic type ────────────────────────────────────────────────────── */
.forge-text .word{display:inline-block; white-space:nowrap;}
.forge-text .word>span{display:inline-block; white-space:pre; opacity:0; transform:translateY(0.5em);
  filter:blur(7px);
  transition:opacity .7s var(--ease),transform .7s var(--ease),filter .7s var(--ease);
  transition-delay:calc(var(--i)*16ms + var(--d,0ms));}
.forge-text.shown .word>span{opacity:1; transform:none; filter:blur(0);}

/* ── headlines forged from the fire — display type filled with the live, flowing
   fire-opal gradient (the type IS the forge fire). Per-letter for kinetic heads. */
.flame,.flame .word>span{
  background:linear-gradient(178deg, #FFE3B8, #FF8A3C 26%, #E85D04 50%, #C1292E 78%, #E34A27);
  background-size:100% 250%;
  -webkit-background-clip:text; background-clip:text;
  color:transparent; -webkit-text-fill-color:transparent;
  animation:lavaFlow 5s infinite alternate ease-in-out;}
/* dark halo only (no orange glow) so the fire FILL pops over the dark obsidian */
.flame{text-shadow:0 0 11px rgba(0,0,0,0.92), 0 0 4px rgba(0,0,0,0.85), 0 2px 8px rgba(0,0,0,0.7);}

/* ── LIQUID OBSIDIAN — display heads cut from the SAME jewel as the slab, so the
   type and the glass read as one material:
   • the fire-opal flows THROUGH the glyphs, and a specular GLIMMER rakes across them
     — ONE diagonal background sweep moves the tall fire layer in Y (flow) and the
     wide glint layer in X (rake), with a faint cool opal edge on the glint;
   • the whole head brightens + blooms with the LIVE forge --heat (scroll energy +
     strikes, set per frame in Content.jsx) — type and slab on one clock;
   • on reveal each glyph SURFACES up through the glass: a blurred molten smear that
     sharpens + cools into solid jewel.
   Display/brand heads only — body copy stays grotesk + crisp. */
.jewel,.jewel .word>span{
  background:
    linear-gradient(74deg, transparent 36%, rgba(255,250,240,0.7) 45%, #ffffff 50%,
      rgba(255,250,240,0.7) 55%, transparent 64%),
    linear-gradient(96deg, transparent 36%, rgba(86,232,255,0.85) 47%, rgba(186,128,255,0.85) 53%,
      transparent 64%),
    linear-gradient(178deg, #FFE3B8, #FF8A3C 26%, #E85D04 50%, #C1292E 78%, #E34A27);
  background-size:320% 100%, 250% 100%, 100% 260%;
  background-position:-60% 0%, 140% 0%, 0% 0%;
  -webkit-background-clip:text; background-clip:text;
  color:transparent; -webkit-text-fill-color:transparent;
  animation:jewelSweep 5s ease-in-out infinite;}
/* warm glint rakes L→R, cool OPAL streak (play-of-color) counter-rakes R→L, the
   fire flows in Y — the two streaks crossing throw the iridescent jewel flash. */
@keyframes jewelSweep{
  0%,100%{background-position:-60% 0%, 140% 0%, 0% 0%;}
  50%{background-position:160% 0%, -40% 0%, 0% 100%;}}
/* the head brightens with the forge --heat (a FILL brighten, not an orange glow —
   no ambient halo); only dark halos for legibility over the dark glass. */
.jewel{filter:brightness(calc(1 + var(--heat,0)*0.55)) saturate(calc(1 + var(--heat,0)*0.3));
  text-shadow:0 0 10px rgba(0,0,0,0.92), 0 0 4px rgba(0,0,0,0.85), 0 2px 8px rgba(0,0,0,0.7);}
/* SURFACE FROM THE GLASS — heavier emerge-from-obsidian than the base reveal */
.jewel .word>span{transform:translateY(0.42em) scale(1.05); filter:blur(16px) brightness(1.7);}
.jewel.shown .word>span{transform:none; filter:blur(0) brightness(1);}

/* ── the trust ladder — a 5-step ESCALATING whirlwind on "why GAELWORX".
   Centered copy over a giant ghosted Cinzel numeral that slowly turns (priming
   the finale's spin); the frames whip in from alternating sides, harder each
   rung. A distinct, elevated register between the editorial opening frames and
   the radial whirlpool finale. ────────────────────────────────────────────── */
.frame--trust{align-items:center; justify-content:center; text-align:center;}
.frame--trust .fbody{max-width:760px; margin:0 auto; text-align:center; z-index:1;}
.frame--trust .kicker{color:var(--gw-ember);}
.frame--trust .head{font-size:clamp(1.9rem,5.2vw,3.4rem);}
.frame--trust .body{margin:0 auto;}
.trust-num{position:absolute; top:50%; left:50%; z-index:0; pointer-events:none;
  font-family:var(--gw-display); font-weight:900; line-height:1; white-space:nowrap;
  font-size:clamp(11rem,46vw,26rem); letter-spacing:-0.02em;
  color:transparent; -webkit-text-fill-color:transparent;
  background:linear-gradient(180deg,#E85D04,#C1292E 55%,#E34A27); background-size:100% 220%;
  -webkit-background-clip:text; background-clip:text; opacity:0.1;
  transform:translate(-50%,-50%);
  animation:trustWhirl 52s linear infinite, lavaFlow 6s infinite alternate ease-in-out;}
@keyframes trustWhirl{from{transform:translate(-50%,-50%) rotate(0deg);}
  to{transform:translate(-50%,-50%) rotate(360deg);}}

/* ── FINALE ACT ──────────────────────────────────────────────────────────
   A scroll-jacked closer of its own: the visitor's problems drain away into the
   forge, then the GAELWORX wordmark + the CTA rise to centre and HOLD on the
   living obsidian (no mandala). Content.jsx owns each layer's opacity + transform
   per scroll phase. Every layer is pinned dead-center — JS transforms compose
   onto translate(-50%,-50%). */
.frame--finale{padding:0; align-items:stretch; justify-content:stretch;}
.finale{position:relative; width:100%; height:100%; pointer-events:none;}

/* the four orbiting / stacked layers JS drives — pinned to center, JS owns transform */
.fin-layer{position:absolute; top:50%; left:50%; opacity:0;
  will-change:transform,opacity,filter; backface-visibility:hidden;}

/* problems — a vertical Cinzel stack that drains into the forge */
.fin-problems{display:flex; flex-direction:column; align-items:center;
  gap:clamp(10px,1.8vh,22px); width:min(92vw,860px); text-align:center;}
.fin-line{font-family:var(--gw-display); font-weight:700; line-height:1.05;
  text-transform:uppercase; letter-spacing:0.015em; font-size:clamp(1.35rem,4.6vw,2.9rem);}
/* the weight the visitor carries — cold + ashen */
.fin-problems .fin-line{color:rgba(180,190,205,0.82);
  text-shadow:0 0 16px rgba(0,0,0,0.85),0 2px 10px rgba(0,0,0,0.7);}

/* GAELWORX — the wordmark the journey resolves on */
.fin-mark{position:absolute; top:50%; left:50%; opacity:0; text-align:center;
  will-change:transform,opacity;}
.mark-btn{background:none; border:0; cursor:pointer; padding:0; white-space:nowrap;
  font-family:var(--gw-display); font-weight:900; text-transform:uppercase;
  font-size:clamp(2.4rem,9vw,6rem); line-height:1; letter-spacing:0.04em; color:var(--gw-bone);
  text-shadow:0 0 40px rgba(232,93,4,0.4),0 2px 12px rgba(0,0,0,0.7);}

/* the sword */
.fin-cta{position:absolute; top:50%; left:50%; opacity:0; width:min(92vw,640px);
  display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center;
  will-change:transform,opacity;}
.fin-cta .avail{margin-top:12px;}

/* FINAL RESTING STATE — GAELWORX + the sword rise to centre and hold on the living
   obsidian. Compact, with a heavy dark halo so they read over the forge-glow veins. */
.mark-btn--seal{font-size:clamp(1.9rem,6.4vw,3.6rem); letter-spacing:0.06em;
  filter:brightness(calc(1 + var(--heat,0)*0.4));
  text-shadow:0 0 16px rgba(0,0,0,0.96),0 0 36px rgba(0,0,0,0.85),0 2px 10px rgba(0,0,0,0.7);}
.fin-cta--seal{gap:14px; width:min(92vw,520px);}
.fin-cta--seal .avail{margin-top:4px;
  text-shadow:0 0 12px rgba(0,0,0,0.96),0 1px 8px rgba(0,0,0,0.9);}

/* ── responsive ──────────────────────────────────────────────────────── */
@media (max-width:560px){
  .mark-btn{font-size:clamp(2.1rem,13vw,3.6rem);}
  .frame{padding:11vh 18px;}
  .fbody,.fbody--wide{max-width:none; width:100%;}
  .hero-sub{max-width:none;}
  .carousel{height:clamp(366px,62vh,486px); perspective:1040px;}
  .branch-body{max-width:none;}
  .branch-foot{max-width:none;}
  /* rates ledger stacks on phones — tag + price on a row, anchor underneath */
  .rate-row{grid-template-columns:1fr auto; gap:4px 14px; row-gap:4px;}
  .rate-anchor{grid-column:1 / -1; order:3;}
  .rate-price{text-align:right;}
  /* stronger ambient vignette on phones so copy holds over the brightest veins */
  .stage::before{background:radial-gradient(98% 72% at 50% 48%, rgba(4,5,8,0.74), rgba(4,5,8,0.3) 56%, transparent 88%);}
}

@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto;}
  .forge-text .word>span{transition:none; opacity:1; transform:none; filter:none;}
  .loader-mark{animation:none;} .loader-bar i{animation:none; width:100%;}
  .scrollcue i{animation:none;} .menu-item{transition:none; opacity:1; transform:none;}
  .flame,.jewel,.jewel .word>span,.haze,.grain{animation:none;} .haze,.fbody{transform:none;}
  .trust-num{animation:none;}
}
`
