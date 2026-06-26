export const STYLES = `
:root{
  color-scheme: dark;
  --gw-void:#040507; --gw-obsidian:#0a0b10; --gw-iron:#15161c;
  --gw-steel:#9aa1ad; --gw-bone:#efe6da; --gw-ember:#ff5a1e;
  --gw-ember-deep:#ff3b0a; --gw-forge:#d72638;
  --gw-display:'Cinzel','Trajan Pro','Times New Roman',serif;
  --gw-sans:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Inter,Roboto,sans-serif;
  --ease:cubic-bezier(0.16,1,0.3,1);
  --safe-t:env(safe-area-inset-top,0px); --safe-r:env(safe-area-inset-right,0px);
  --safe-b:env(safe-area-inset-bottom,0px); --safe-l:env(safe-area-inset-left,0px);
}
*{box-sizing:border-box;}
html,body,#root{margin:0; padding:0;}
html{scroll-behavior:smooth;}
body{background:var(--gw-void); color:var(--gw-bone); font-family:var(--gw-sans);
  -webkit-font-smoothing:antialiased; overflow-x:hidden;}
::selection{background:rgba(255,90,30,0.35); color:#fff;}

.forge-root{position:relative; width:100%;}

/* slab/mirror canvas, fixed behind everything */
.canvas-fixed{position:fixed; inset:0; z-index:0;}
.canvas-fixed canvas{display:block; touch-action:pan-y;}
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

.nav-spine{position:fixed; z-index:40; right:0; top:0; bottom:0; width:2px;
  background:rgba(255,150,90,0.08);}
.nav-spine__fill{position:absolute; top:0; left:0; right:0; height:100%;
  transform-origin:top; transform:scaleY(0); background:linear-gradient(180deg,var(--gw-ember),var(--gw-forge));
  box-shadow:0 0 12px rgba(255,90,30,0.6);}

.menu{position:fixed; inset:0; z-index:50; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:6px; opacity:0; visibility:hidden;
  background:rgba(4,5,7,0.94); backdrop-filter:blur(10px);
  transition:opacity .6s var(--ease), visibility .6s var(--ease);
  padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);}
.menu.open{opacity:1; visibility:visible;}
.menu-list{display:flex; flex-direction:column; align-items:center; gap:clamp(4px,1vw,10px);}
.menu-item{background:none; border:0; cursor:pointer; display:flex; align-items:baseline;
  gap:14px; color:var(--gw-bone); font-family:var(--gw-display); font-weight:600;
  font-size:clamp(1.6rem,5.5vw,3rem); letter-spacing:0.02em; line-height:1.1;
  opacity:0; transform:translateY(18px); transition:color .3s, opacity .5s var(--ease), transform .5s var(--ease);
  transition-delay:calc(var(--mi)*40ms);}
.menu.open .menu-item{opacity:1; transform:none;}
.menu-item:hover{color:var(--gw-ember);}
.menu-num{font-size:0.5em; color:var(--gw-ember); font-family:var(--gw-sans); letter-spacing:0.2em;}
.menu-foot{margin-top:clamp(24px,4vw,48px); font-family:var(--gw-display); color:var(--gw-steel);
  letter-spacing:0.06em; font-size:clamp(12px,1.5vw,16px); opacity:0.8; text-align:center; padding:0 24px;}

/* ── magnetic cursor ─────────────────────────────────────────────────── */
.forge-cursor{position:fixed; top:0; left:0; width:10px; height:10px; margin:-5px 0 0 -5px;
  border-radius:50%; background:var(--gw-ember); box-shadow:0 0 14px var(--gw-ember);
  pointer-events:none; z-index:300; mix-blend-mode:screen;
  transition:width .25s var(--ease), height .25s var(--ease), margin .25s var(--ease), background .25s;}
.forge-cursor.big{width:48px; height:48px; margin:-24px 0 0 -24px; background:rgba(255,90,30,0.16);
  box-shadow:0 0 34px rgba(255,90,30,0.5);}
@media (pointer:coarse){.forge-cursor{display:none;}}

/* ── content (floating, no containers) ───────────────────────────────── */
.content{position:relative; z-index:1; pointer-events:none;}
.content a,.content button,.content .branch-row{pointer-events:auto;}

.sec{position:relative; min-height:100svh; display:flex; align-items:center;
  padding:14vh clamp(24px,6vw,96px);}
.sec--hero{flex-direction:column; justify-content:center; align-items:flex-start;}
.sec--draw{min-height:150svh; justify-content:center; text-align:center;}
.sec--left{min-height:118svh; justify-content:flex-start;}
.sec--arsenal{min-height:165svh; justify-content:flex-start; align-items:flex-end; padding-bottom:16vh;}

.sec--hero::before,.sec--left::before{content:""; position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(90deg, rgba(4,5,8,0.82), rgba(4,5,8,0.36) 40%, transparent 68%);}
.sec--arsenal::before{content:""; position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(0deg, rgba(4,5,8,0.88), rgba(4,5,8,0.22) 54%, transparent 80%);}
.sec--draw::before{content:""; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(60% 26% at 50% 24%, rgba(4,5,8,0.7), transparent 70%);}
.hero-inner,.block{position:relative; z-index:1;}

.hero-inner{max-width:980px;}
.eyebrow{display:block; font-size:clamp(10px,1.1vw,12.5px); letter-spacing:0.46em;
  font-weight:700; text-transform:uppercase; color:var(--gw-ember); margin-bottom:clamp(16px,2vw,26px);}
.headline{margin:0; font-family:var(--gw-display); text-transform:uppercase; font-weight:700;
  font-size:clamp(2.3rem,8.4vw,6.8rem); line-height:0.98; letter-spacing:0.012em;}
.etched{color:rgba(236,226,214,0.96);
  text-shadow:0 1px 0 rgba(255,190,130,0.10),0 -1px 1px rgba(0,0,0,0.85),
    0 2px 2px rgba(0,0,0,0.65),0 0 44px rgba(255,90,30,0.16);}
.hero-sub{margin:clamp(20px,2.4vw,30px) 0 0; font-size:clamp(1.05rem,2vw,1.5rem);
  line-height:1.32; color:var(--gw-steel); max-width:32ch;}

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

.scrollcue{position:absolute; bottom:calc(var(--safe-b) + 5vh); left:50%; transform:translateX(-50%);
  display:flex; flex-direction:column; align-items:center; gap:10px; font-size:10px;
  letter-spacing:0.4em; text-transform:uppercase; color:rgba(255,200,170,0.45);}
.scrollcue i{width:1px; height:46px; background:linear-gradient(180deg,rgba(255,150,90,0.7),transparent);
  transform-origin:top; animation:cue 2.4s ease-in-out infinite;}
@keyframes cue{0%,100%{transform:scaleY(0.4); opacity:0.4;}50%{transform:scaleY(1); opacity:1;}}

.draw-line{margin:0; font-family:var(--gw-display); font-weight:600; text-transform:uppercase;
  letter-spacing:0.06em; font-size:clamp(1.4rem,4vw,2.6rem); color:rgba(236,226,214,0.92);
  text-shadow:0 0 44px rgba(255,90,30,0.25);}

.block{max-width:620px;}
.block--wide{max-width:1180px; width:100%;}
.kicker{display:block; font-size:11px; letter-spacing:0.4em; font-weight:700;
  text-transform:uppercase; color:var(--gw-ember); margin-bottom:18px;}
.head{margin:0 0 18px; font-family:var(--gw-display); font-weight:700; color:var(--gw-bone);
  font-size:clamp(1.6rem,4.4vw,3rem); line-height:1.04;}
.reveal,.intro{margin:0; font-size:clamp(1rem,1.5vw,1.18rem); line-height:1.62; color:var(--gw-steel);
  max-width:58ch; text-shadow:0 2px 30px rgba(0,0,0,0.7);}
.intro{margin-bottom:8px;}
.reveal strong{color:var(--gw-bone); font-weight:600;}

/* floating branch list — no cards */
.branch-list{list-style:none; margin:clamp(26px,3vw,44px) 0 0; padding:0; display:grid;
  grid-template-columns:repeat(4,1fr); gap:clamp(18px,2vw,34px);}
.branch-row{position:relative; padding-top:18px; cursor:pointer;
  border-top:1px solid rgba(255,150,90,0.16); transition:border-color .35s var(--ease), transform .35s var(--ease);}
.branch-row::before{content:""; position:absolute; top:-1px; left:0; width:0; height:1px;
  background:var(--gw-ember); box-shadow:0 0 10px var(--gw-ember); transition:width .4s var(--ease);}
.branch-row.on::before{width:60%;}
.branch-row.on{transform:translateY(-3px);}
.branch-id{display:block; font-size:10px; letter-spacing:0.28em; font-weight:700;
  text-transform:uppercase; color:var(--gw-ember); margin-bottom:10px;}
.branch-line{display:block; font-family:var(--gw-display); font-weight:700;
  font-size:clamp(1.05rem,1.4vw,1.3rem); color:var(--gw-bone); margin-bottom:10px; line-height:1.1;}
.branch-body{display:block; font-size:0.92rem; line-height:1.55; color:rgba(154,161,173,0.82);
  opacity:0.7; transition:opacity .35s var(--ease);}
.branch-row.on .branch-body{opacity:1;}

.avail{display:block; margin-top:clamp(20px,2.4vw,28px); font-size:10.5px; letter-spacing:0.32em;
  font-weight:700; text-transform:uppercase; color:var(--gw-steel);}

.foot{display:flex; flex-direction:column; align-items:center; gap:16px; text-align:center;
  padding:clamp(70px,14vh,160px) 20px calc(var(--safe-b) + clamp(50px,9vh,110px));}
.foot>span:first-child{font-size:clamp(11px,1.3vw,14px); letter-spacing:0.42em; font-weight:600;
  text-transform:uppercase; color:rgba(255,200,170,0.5);}
.foot-tag{font-family:var(--gw-display); font-weight:600; letter-spacing:0.06em;
  font-size:clamp(14px,1.6vw,19px); color:var(--gw-steel);}

/* ── kinetic type ────────────────────────────────────────────────────── */
.forge-text .word{display:inline-block; white-space:nowrap;}
.forge-text .word>span{display:inline-block; white-space:pre; opacity:0; transform:translateY(0.5em);
  filter:blur(10px);
  transition:opacity .7s var(--ease),transform .7s var(--ease),filter .7s var(--ease);
  transition-delay:calc(var(--i)*16ms + var(--d,0ms));}
.forge-text.shown .word>span{opacity:1; transform:none; filter:blur(0);}
.reveal{opacity:0; transform:translateY(22px); filter:blur(6px);
  transition:opacity .9s var(--ease) .12s, transform .9s var(--ease) .12s, filter .9s var(--ease) .12s;}
.reveal.shown{opacity:1; transform:none; filter:blur(0);}

/* ── responsive ──────────────────────────────────────────────────────── */
@media (max-width:880px){
  .branch-list{grid-template-columns:repeat(2,1fr);}
  .sec--arsenal{align-items:center; padding-bottom:12vh;}
}
@media (max-width:560px){
  .branch-list{grid-template-columns:1fr; gap:0;}
  .branch-row{padding:16px 0;}
  .hero-sub,.reveal{max-width:none;}
  /* fuller scrim on phones so copy stays legible over the bright sun/aurora */
  .sec--hero::before,.sec--left::before{
    background:linear-gradient(180deg, rgba(4,5,8,0.66), rgba(4,5,8,0.5) 60%, rgba(4,5,8,0.62));}
  .sec--arsenal::before{background:linear-gradient(0deg, rgba(4,5,8,0.9), rgba(4,5,8,0.45) 70%, rgba(4,5,8,0.55));}
}

@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto;}
  .forge-text .word>span,.reveal{transition:none; opacity:1; transform:none; filter:none;}
  .loader-mark{animation:none;} .loader-bar i{animation:none; width:100%;}
  .scrollcue i{animation:none;} .menu-item{transition:none; opacity:1; transform:none;}
}
`
