export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&display=swap');

:root{
  color-scheme: dark;
  --gw-void:#050608; --gw-obsidian:#0a0b10; --gw-iron:#15161c;
  --gw-steel:#9aa1ad; --gw-bone:#efe6da; --gw-ember:#ff5a1e;
  --gw-ember-deep:#ff3b0a; --gw-forge:#d72638;
  --gw-display:'Cinzel','Trajan Pro','Times New Roman',serif;
  --gw-sans:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Inter,Roboto,sans-serif;
  --ease:cubic-bezier(0.16,1,0.3,1);
}
*{box-sizing:border-box;}
html,body,#root{margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{background:var(--gw-void); color:var(--gw-bone); font-family:var(--gw-sans);
  -webkit-font-smoothing:antialiased; overflow-x:hidden;}
::selection{background:rgba(255,90,30,0.35); color:#fff;}

.forge-root{position:relative; width:100%;}

/* ── slab canvas (fixed behind everything) ──────────────────────────── */
.canvas-fixed{position:fixed; inset:0; z-index:0;}
.canvas-fixed canvas{display:block; touch-action:pan-y;}
.canvas-fallback{background:
  radial-gradient(60% 50% at 50% 60%, rgba(255,80,25,0.18), transparent 60%),
  linear-gradient(180deg,#05060a,#000); }

/* ── loader / ignition ──────────────────────────────────────────────── */
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

/* ── HUD ─────────────────────────────────────────────────────────────── */
.hud-nav{position:fixed; top:0; left:0; right:0; z-index:30; display:flex;
  align-items:center; justify-content:space-between; gap:20px;
  padding:clamp(16px,2.2vw,26px) clamp(18px,4vw,42px); pointer-events:none;}
.hud-nav>*{pointer-events:auto;}
.hud-mark{font-family:var(--gw-display); font-weight:700; letter-spacing:0.16em;
  font-size:14px; color:var(--gw-bone); background:none; border:0; cursor:pointer;}
.hud-nav ul{display:flex; gap:22px; list-style:none; margin:0; padding:0;}
.hud-nav li{font-size:11px; letter-spacing:0.18em; text-transform:uppercase;
  color:var(--gw-steel); display:flex; gap:6px; align-items:baseline;}
.hud-num{font-size:8.5px; color:var(--gw-ember); opacity:0.8;}
.hud-cta{font-size:10.5px; letter-spacing:0.28em; text-transform:uppercase; font-weight:700;
  color:#1a0b04; background:linear-gradient(180deg,#ff5f23,#d2370c); border:0;
  padding:11px 18px; border-radius:2px; cursor:pointer; transition:transform .3s var(--ease), box-shadow .4s;}
.hud-cta:hover{transform:translateY(-1px); box-shadow:0 10px 36px -12px rgba(255,80,20,0.7);}

.hud-rail{position:fixed; right:clamp(14px,2vw,30px); top:50%; transform:translateY(-50%);
  z-index:30; display:flex; flex-direction:column; gap:14px; pointer-events:none;}
.hud-step{pointer-events:auto; display:flex; align-items:center; gap:10px; background:none;
  border:0; cursor:pointer; color:var(--gw-steel); justify-content:flex-end;}
.hud-step i{width:18px; height:1px; background:rgba(255,150,90,0.35); transition:all .4s var(--ease);}
.hud-step span{font-size:9px; letter-spacing:0.22em; text-transform:uppercase; opacity:0;
  transform:translateX(6px); transition:all .4s var(--ease); white-space:nowrap;}
.hud-step:hover span,.hud-step.on span{opacity:0.9; transform:none;}
.hud-step.on i{width:34px; background:var(--gw-ember); box-shadow:0 0 10px var(--gw-ember);}
.hud-step.on{color:var(--gw-bone);}

/* ── magnetic cursor ─────────────────────────────────────────────────── */
.forge-cursor{position:fixed; top:0; left:0; width:10px; height:10px; margin:-5px 0 0 -5px;
  border-radius:50%; background:var(--gw-ember); box-shadow:0 0 14px var(--gw-ember);
  pointer-events:none; z-index:300; mix-blend-mode:screen;
  transition:width .25s var(--ease), height .25s var(--ease), margin .25s var(--ease), background .25s;}
.forge-cursor.big{width:48px; height:48px; margin:-24px 0 0 -24px; background:rgba(255,90,30,0.16);
  box-shadow:0 0 34px rgba(255,90,30,0.5);}
@media (pointer:coarse){.forge-cursor{display:none;}}

/* ── content ─────────────────────────────────────────────────────────── */
.content{position:relative; z-index:1; pointer-events:none;}
.content a,.content button,.content .branch{pointer-events:auto;}

.sec{position:relative; min-height:100vh; display:flex; align-items:center; padding:14vh clamp(22px,6vw,90px);}
.sec--hero{flex-direction:column; justify-content:center; text-align:left; align-items:flex-start;}
.sec--draw{min-height:155vh; justify-content:center; text-align:center;}
.sec--left{min-height:118vh; justify-content:flex-start;}
.sec--arsenal{min-height:165vh; justify-content:flex-start; align-items:flex-end; padding-bottom:18vh;}

/* legibility scrims — keep copy readable over the living 3D without boxing it in */
.sec--hero::before,.sec--left::before{content:""; position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(90deg, rgba(4,5,8,0.82), rgba(4,5,8,0.4) 38%, transparent 66%);}
.sec--arsenal::before{content:""; position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(0deg, rgba(4,5,8,0.85), rgba(4,5,8,0.2) 52%, transparent 78%);}
.sec--draw::before{content:""; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(60% 30% at 50% 22%, rgba(4,5,8,0.7), transparent 70%);}
.hero-inner,.block{position:relative; z-index:1;}

.hero-inner{max-width:980px; margin-top:6vh;}
.eyebrow{display:block; font-size:clamp(10px,1.1vw,12.5px); letter-spacing:0.46em;
  font-weight:700; text-transform:uppercase; color:var(--gw-ember); margin-bottom:clamp(16px,2vw,26px);}
.headline{margin:0; font-family:var(--gw-display); text-transform:uppercase; font-weight:700;
  font-size:clamp(2.3rem,8.4vw,6.8rem); line-height:0.98; letter-spacing:0.012em;}
.etched{color:rgba(236,226,214,0.95);
  text-shadow:0 1px 0 rgba(255,190,130,0.10),0 -1px 1px rgba(0,0,0,0.85),
    0 2px 2px rgba(0,0,0,0.65),0 0 40px rgba(255,90,30,0.14);}
.hero-sub{margin:clamp(20px,2.4vw,30px) 0 0; font-size:clamp(1.05rem,2vw,1.5rem);
  line-height:1.32; color:var(--gw-steel); max-width:30ch;}

.cta{position:relative; display:inline-flex; align-items:center; margin-top:clamp(26px,3.4vw,44px);
  padding:16px 30px; border:1px solid rgba(255,120,50,0.55); border-radius:2px; color:#ffd9c2;
  text-decoration:none; font-size:0.8rem; font-weight:700; letter-spacing:0.3em; text-transform:uppercase;
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

.scrollcue{position:absolute; bottom:5vh; left:50%; transform:translateX(-50%);
  display:flex; flex-direction:column; align-items:center; gap:10px; font-size:10px;
  letter-spacing:0.4em; text-transform:uppercase; color:rgba(255,200,170,0.45);}
.scrollcue i{width:1px; height:46px; background:linear-gradient(180deg,rgba(255,150,90,0.7),transparent);
  transform-origin:top; animation:cue 2.4s ease-in-out infinite;}
@keyframes cue{0%,100%{transform:scaleY(0.4); opacity:0.4;}50%{transform:scaleY(1); opacity:1;}}

.draw-line{margin:0; font-family:var(--gw-display); font-weight:600; text-transform:uppercase;
  letter-spacing:0.06em; font-size:clamp(1.4rem,4vw,2.6rem); color:rgba(236,226,214,0.9);
  text-shadow:0 0 40px rgba(255,90,30,0.2);}

.block{max-width:600px;}
.block--wide{max-width:1100px; width:100%;}
.kicker{display:block; font-size:11px; letter-spacing:0.4em; font-weight:700;
  text-transform:uppercase; color:var(--gw-ember); margin-bottom:18px;}
.head{margin:0 0 18px; font-family:var(--gw-display); font-weight:700; color:var(--gw-bone);
  font-size:clamp(1.6rem,4.4vw,3rem); line-height:1.04;}
.reveal,.intro{margin:0; font-size:clamp(1rem,1.5vw,1.18rem); line-height:1.62; color:var(--gw-steel);
  max-width:58ch; text-shadow:0 2px 30px rgba(0,0,0,0.6);}
.intro{margin-bottom:8px;}

/* arsenal cards */
.arsenal-cards{margin-top:clamp(26px,3vw,42px); display:grid; grid-template-columns:repeat(4,1fr);
  gap:1px; background:rgba(255,150,90,0.10); border:1px solid rgba(255,150,90,0.10);
  border-radius:4px; overflow:hidden;}
.branch{padding:clamp(18px,1.8vw,26px); background:linear-gradient(180deg,rgba(10,11,17,0.72),rgba(4,5,9,0.82));
  backdrop-filter:blur(3px); transition:background .35s var(--ease), transform .35s var(--ease);}
.branch.on{background:linear-gradient(180deg,rgba(28,18,12,0.92),rgba(10,6,4,0.95)); transform:translateY(-4px);}
.branch-id{font-size:10px; letter-spacing:0.28em; font-weight:700; text-transform:uppercase; color:var(--gw-ember);}
.branch-line{margin:12px 0 8px; font-family:var(--gw-display); font-weight:700;
  font-size:clamp(1rem,1.4vw,1.25rem); color:var(--gw-bone);}
.branch p{margin:0; font-size:0.92rem; line-height:1.55; color:rgba(154,161,173,0.85);}

.avail{display:block; margin-top:clamp(20px,2.4vw,28px); font-size:10.5px; letter-spacing:0.32em;
  font-weight:700; text-transform:uppercase; color:var(--gw-steel);}

.foot{display:flex; flex-direction:column; align-items:center; gap:16px; text-align:center;
  padding:clamp(70px,14vh,160px) 20px clamp(50px,9vh,110px);}
.foot>span:first-child{font-size:clamp(11px,1.3vw,14px); letter-spacing:0.42em; font-weight:600;
  text-transform:uppercase; color:rgba(255,200,170,0.5);}
.foot-tag{font-family:var(--gw-display); font-weight:600; letter-spacing:0.06em;
  font-size:clamp(14px,1.6vw,19px); color:var(--gw-steel);}

/* ── kinetic type ────────────────────────────────────────────────────── */
.forge-text .word{display:inline-block; white-space:nowrap;}
.forge-text span span,.forge-text>span:not(.word){display:inline-block;}
.forge-text .word>span{display:inline-block; white-space:pre; opacity:0; transform:translateY(0.5em);
  filter:blur(10px);
  transition:opacity .7s var(--ease),transform .7s var(--ease),filter .7s var(--ease);
  transition-delay:calc(var(--i)*16ms + var(--d,0ms));}
.forge-text.shown span{opacity:1; transform:none; filter:blur(0);}
.reveal{opacity:0; transform:translateY(22px); filter:blur(6px);
  transition:opacity .9s var(--ease) .12s, transform .9s var(--ease) .12s, filter .9s var(--ease) .12s;}
.reveal.shown{opacity:1; transform:none; filter:blur(0);}

/* ── responsive ──────────────────────────────────────────────────────── */
@media (max-width:880px){
  .hud-nav ul{display:none;}
  .hud-rail{display:none;}
  .arsenal-cards{grid-template-columns:repeat(2,1fr);}
  .sec--arsenal{align-items:center; padding-bottom:14vh;}
}
@media (max-width:520px){ .arsenal-cards{grid-template-columns:1fr;} }

@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto;}
  .forge-text span,.reveal{transition:none; opacity:1; transform:none; filter:none;}
  .loader-mark{animation:none;} .loader-bar i{animation:none; width:100%;}
  .scrollcue i{animation:none;}
}
`
