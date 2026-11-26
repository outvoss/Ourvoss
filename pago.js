/* =====================================================================
   OUTVOSS · Flujo de pago por transferencia  (pago.js)
   Se carga en productos.html y catalogo.html. El pedido solo se envía
   cuando el cliente sube su comprobante. Los datos de las cuentas, el
   domicilio y el tiempo de entrega se editan en el panel (Ajustes).
   ===================================================================== */
(function () {
  'use strict';
  if (window.OutvossPay) return;

  var TIERS = {
    platinum:  { id: 'platinum',  name: 'Platino',   subtitle: 'Transferencia bancaria',   side: 'PLATINO',   sub: 'Tarjeta Platino',   btn: '' },
    nequi:     { id: 'nequi',     name: 'Nequi',     subtitle: 'Transferencia Nequi',      side: 'NEQUI',     sub: 'Tarjeta Nequi',     btn: 'op-b-nequi' },
    daviplata: { id: 'daviplata', name: 'Daviplata', subtitle: 'Transferencia Daviplata',  side: 'DAVIPLATA', sub: 'Tarjeta Daviplata', btn: 'op-b-daviplata' }
  };
  var ORDER = ['platinum', 'nequi', 'daviplata'];
  var MAX_BYTES = 6 * 1024 * 1024;
  var cfgPromise = null;
  var root = null, ui = {};
  var S = {};

  /* ---------------------------------------------------------------- estilos */
  var CSS = '' +
  '#opayRoot{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(5,6,8,.84);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}' +
  '#opayRoot.open{display:flex}' +
  '.opay,.opay *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased;letter-spacing:normal;text-transform:none;line-height:1.3}' +
  '.opay{--bg:#f6f7f9;--dark:#14161a;--surf:#fff;--tx:#111318;--tx2:#6b7280;--line:#e5e7eb;--ok:#16a34a;--bad:#dc2626;position:relative;width:min(100%,430px);height:min(780px,calc(100dvh - 28px));background:var(--bg);color:var(--tx);border-radius:34px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.65);transition:background-color .35s,color .35s}' +
  '.opay.op-dark{background:var(--dark);color:#f9fafb}' +
  '.opay button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}' +
  '.op-nav{height:60px;padding:8px 18px 0;display:flex;align-items:center;justify-content:space-between}' +
  '.op-title{font-size:16px;font-weight:600}' +
  '.op-ib{width:38px;height:38px;border-radius:999px;background:rgba(0,0,0,.06)!important;display:grid;place-items:center;font-size:16px;transition:transform .15s}' +
  '.op-dark .op-ib{background:rgba(255,255,255,.1)!important}' +
  '.op-ib:active{transform:scale(.93)}.op-ib.op-hide{opacity:0;pointer-events:none}' +
  '.op-s{position:absolute;inset:60px 0 0 0;padding:8px 20px 22px;display:flex;flex-direction:column;opacity:0;transform:translateX(28px);pointer-events:none;transition:opacity .28s,transform .32s cubic-bezier(.22,1,.36,1);overflow-y:auto}' +
  '.op-s.op-active{opacity:1;transform:none;pointer-events:auto}' +
  '.op-tabs{display:flex;justify-content:center;gap:22px;margin-bottom:12px}' +
  '.op-tab{font-size:15px;font-weight:500;color:var(--tx2)!important;padding-bottom:6px;position:relative}' +
  '.op-tab.op-on{color:var(--tx)!important;font-weight:600}' +
  '.op-tab.op-on::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--tx);border-radius:2px}' +
  '.op-head{text-align:center;margin-bottom:14px}.op-name{font-size:28px;font-weight:700;letter-spacing:-.02em}.op-price{font-size:14px;color:var(--tx2);margin-top:2px}' +
  '.op-stage{flex:1;display:flex;align-items:center;justify-content:center;perspective:1100px;min-height:300px;cursor:grab;user-select:none;touch-action:pan-y}' +
  '.op-card{width:215px;height:338px;border-radius:20px;padding:20px 18px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;box-shadow:0 24px 45px rgba(0,0,0,.24),inset 0 1px 1px rgba(255,255,255,.45);transition:transform .2s,background .35s,color .35s}' +
  '.op-card::before{content:"";position:absolute;inset:-40%;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.25) 50%,transparent 65%);transform:translateX(-45%);transition:transform .45s;pointer-events:none}' +
  '.op-stage:hover .op-card::before{transform:translateX(45%)}' +
  '.op-platinum{background:linear-gradient(145deg,#d7dce2 0%,#aeb6c0 45%,#e5e9ee 100%);color:#181a1f}' +
  '.op-nequi{background:linear-gradient(145deg,#2a0428 0%,#200020 55%,#da0081 135%);color:#fff}' +
  '.op-nequi::after{content:"";position:absolute;top:22px;right:18px;width:10px;height:10px;border-radius:2px;background:#da0081;box-shadow:0 0 12px rgba(218,0,129,.85);pointer-events:none}' +
  '.op-daviplata{background:linear-gradient(145deg,#ed1c24 0%,#c81018 65%,#8a8d8f 140%);color:#fff}' +
  '.op-top{display:flex;align-items:center;justify-content:space-between;z-index:2}' +
  '.op-chip{width:42px;height:32px;border-radius:6px;border:1.5px solid rgba(255,255,255,.35);background:linear-gradient(135deg,rgba(255,255,255,.45),rgba(0,0,0,.12));position:relative}' +
  '.op-chip::after{content:"";position:absolute;inset:6px;border:1px solid rgba(255,255,255,.28);border-radius:3px}' +
  '.op-platinum .op-chip{border-color:rgba(0,0,0,.25)}.op-platinum .op-chip::after{border-color:rgba(0,0,0,.2)}' +
  '.op-tap{font-size:16px;opacity:.8;transform:rotate(90deg)}' +
  '.op-side{writing-mode:vertical-rl;transform:rotate(180deg);font-size:12px;font-weight:700;letter-spacing:.14em;opacity:.72;position:absolute;left:16px;top:50%;margin-top:-48px}' +
  '.op-bot{display:flex;align-items:flex-end;justify-content:space-between;z-index:2}.op-bsub{font-size:11px;font-weight:600;opacity:.85}' +
  '.op-mark{font-size:15px;font-weight:900;font-style:italic;letter-spacing:.08em}' +
  '.op-dots{display:flex;justify-content:center;gap:8px;margin:12px 0 16px}.op-dot{width:7px;height:7px;border-radius:999px;background:#cbd5e1;transition:width .25s,background .25s}.op-dot.op-on{width:20px;background:var(--tx)}' +
  '.op-primary{width:100%;min-height:52px;border-radius:16px;background:#111318!important;color:#fff!important;font-size:15px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px;transition:transform .15s,background-color .25s,opacity .2s;padding:0 14px}' +
  '.op-primary.op-b-nequi{background:#da0081!important}.op-primary.op-b-daviplata{background:#ed1c24!important}' +
  '.op-primary:active{transform:scale(.98)}.op-primary:disabled{opacity:.6;cursor:default}' +
  '.op-secondary{width:100%;min-height:48px;border-radius:15px;border:1px solid var(--line)!important;background:#fff!important;color:var(--tx)!important;font-size:14px;font-weight:600}' +
  '.op-dark .op-secondary{background:#1f242d!important;border-color:rgba(255,255,255,.14)!important;color:#f9fafb!important}' +
  '.op-h1{font-size:24px;font-weight:700;margin-bottom:4px}.op-sub{font-size:14px;color:var(--tx2);margin-bottom:16px}' +
  '.op-sum,.op-meta{background:var(--surf);border:1px solid var(--line);border-radius:20px;padding:16px 18px;margin-bottom:16px}' +
  '.op-mini{display:flex;align-items:center;gap:14px;padding-bottom:14px;margin-bottom:10px;border-bottom:1px solid var(--line)}' +
  '.op-minicard{width:68px;height:44px;border-radius:8px;padding:6px 8px;font-size:7.5px;font-weight:800;box-shadow:0 6px 14px rgba(0,0,0,.14);flex:none;display:flex;flex-direction:column;justify-content:space-between}' +
  '.op-minicard::before,.op-minicard::after,.op-rcard::before,.op-rcard::after{display:none!important}' +
  '.op-b{font-weight:700;font-size:15px}.op-s2{font-size:12.5px;color:var(--tx2)}' +
  '.op-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;font-size:14px}.op-row span:first-child{color:var(--tx2)}.op-row span:last-child{font-weight:600;text-align:right}' +
  '.op-total{border-top:1px dashed var(--line);margin-top:6px;padding-top:13px;font-size:16px}.op-total span:last-child{font-size:18px;font-weight:700}' +
  '.op-spin{width:18px;height:18px;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:opspin .75s linear infinite}@keyframes opspin{to{transform:rotate(360deg)}}' +
  '.op-note{text-align:center;font-size:12px;color:var(--tx2);margin-top:12px}' +
  '.op-hero{background:#fff;border:1px solid var(--line);border-radius:22px;padding:20px 18px;display:flex;justify-content:center;margin-bottom:14px}' +
  '.op-reader{width:112px;height:122px;border-radius:18px;background:#1f242d;position:relative;display:flex;align-items:flex-end;justify-content:center;padding-bottom:14px;box-shadow:0 12px 24px rgba(17,19,24,.18)}' +
  '.op-slot{width:72px;height:8px;border-radius:99px;background:#0b0d10}' +
  '.op-rcard{width:54px;height:82px;border-radius:8px;position:absolute;top:4px;animation:opcard 2.2s ease-in-out infinite;box-shadow:0 6px 12px rgba(0,0,0,.25);padding:0}@keyframes opcard{0%,100%{transform:translateY(0)}50%{transform:translateY(16px)}}' +
  '.op-ptitle{font-size:23px;font-weight:700;text-align:center;margin-bottom:6px}.op-pdesc{font-size:13.5px;color:var(--tx2);text-align:center;line-height:1.45;margin-bottom:14px}' +
  '.op-acc{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}' +
  '.op-copy{border:1px solid var(--line)!important;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700;background:#f4f4f5!important;color:var(--tx)!important}' +
  '.op-stack{display:flex;flex-direction:column;gap:10px;margin-top:auto}' +
  '.op-printer{background:#232730;border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:12px 16px;margin-bottom:12px;box-shadow:0 10px 24px rgba(0,0,0,.45);color:#9ca3af}' +
  '.op-pslot{height:10px;border-radius:99px;background:#0c0e12;box-shadow:inset 0 2px 5px rgba(0,0,0,.9);margin-bottom:8px}.op-pstatus{font-size:12px;text-align:center}' +
  '.op-rv{flex:1;overflow-y:auto;position:relative;margin-bottom:12px;border-radius:10px;min-height:120px}' +
  '.op-paper{background:#fffdf7;color:#18181b;border-radius:6px 6px 14px 14px;padding:16px 16px 22px;box-shadow:0 16px 35px rgba(0,0,0,.45);transform:translateY(-105%);transition:transform 1.25s cubic-bezier(.22,1,.36,1);position:relative}' +
  '.op-paper.op-printing{transform:none}' +
  '.op-rbrand{text-align:center;font-size:17px;font-weight:800;letter-spacing:.2em;border-bottom:1px dashed #d4d4d8;padding-bottom:8px;margin-bottom:10px}' +
  '.op-rl{display:flex;justify-content:space-between;gap:8px;font-size:12px;margin:6px 0;font-family:"Courier New",Courier,monospace}.op-rl span:last-child{font-weight:700;text-align:right;word-break:break-all}' +
  '.op-rt{display:flex;justify-content:space-between;font-size:15px;font-weight:700;border-top:1px dashed #a1a1aa;border-bottom:1px dashed #a1a1aa;padding:9px 0;margin:10px 0;font-family:"Courier New",Courier,monospace}' +
  '.op-up{display:flex;flex-direction:column;align-items:center;margin:10px 0 8px;gap:6px}' +
  '.op-cam{width:54px;height:54px;border-radius:50%;border:2px dashed #71717a!important;background:#f4f4f5!important;color:#18181b!important;display:grid;place-items:center;transition:transform .15s,border-color .2s,background .2s}' +
  '.op-cam:hover{border-color:#18181b!important;background:#e4e4e7!important}.op-cam:active{transform:scale(.92)}' +
  '.op-cam.op-uploaded{border:2px solid var(--ok)!important;background:#dcfce7!important;color:var(--ok)!important}' +
  '.op-hint{font-size:11.5px;color:#52525b;text-align:center;line-height:1.35;max-width:100%;word-break:break-word}.op-hint.op-err{color:var(--bad);font-weight:600}' +
  '.op-upacts{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}' +
  '.op-mini2{border:1px solid #d4d4d8!important;background:#fff!important;color:#18181b!important;border-radius:999px;padding:5px 11px;font-size:11px;font-weight:600}.op-mini2:disabled{opacity:.5}' +
  '.op-preview{max-width:100%;max-height:78px;border-radius:8px;border:1px solid #d4d4d8;object-fit:cover;display:none;margin-top:2px}.op-preview.op-vis{display:block}' +
  '.op-barcode{height:30px;margin:8px auto 6px;width:82%;background:repeating-linear-gradient(90deg,#18181b 0,#18181b 2px,transparent 2px,transparent 4px,#18181b 4px,#18181b 7px,transparent 7px,transparent 9px);opacity:.85}' +
  '.op-thanks{text-align:center;font-size:11px;color:#52525b}' +
  '.op-stamp{position:absolute;right:12px;bottom:44px;border:2.5px solid var(--bad);color:var(--bad);border-radius:999px;padding:5px 11px;font-size:11.5px;font-weight:800;letter-spacing:.12em;transform:rotate(-16deg) scale(1.4);opacity:0;transition:transform .3s cubic-bezier(.34,1.56,.64,1),opacity .25s,color .25s,border-color .25s;pointer-events:none;background:rgba(255,253,247,.92)}' +
  '.op-stamp.op-st{opacity:.95;transform:rotate(-16deg) scale(1)}.op-stamp.op-paid{border-color:var(--ok);color:var(--ok)}' +
  '.op-ract{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
  '@media(max-width:480px){#opayRoot{padding:0}.opay{width:100%;height:100dvh;border-radius:0}}' +
  '@media print{body>*:not(#opayRoot){display:none!important}#opayRoot{position:static!important;display:block!important;background:none!important;padding:0!important;backdrop-filter:none!important}' +
  '.opay{width:100%!important;height:auto!important;box-shadow:none!important;background:#fff!important;border-radius:0!important;overflow:visible!important;color:#18181b!important}' +
  '.opay .op-nav,.opay .op-printer,.opay .op-ract,.opay .op-upacts,.opay .op-s:not(#op-receipt){display:none!important}' +
  '#op-receipt{position:static!important;opacity:1!important;transform:none!important;padding:0!important;display:block!important;overflow:visible!important}.op-rv{overflow:visible!important}' +
  '.op-paper{transform:none!important;box-shadow:none!important;border:1px solid #d4d4d8;max-width:380px;margin:0 auto;-webkit-print-color-adjust:exact;print-color-adjust:exact}}';

  /* ---------------------------------------------------------------- DOM */
  var HTML = '' +
  '<div class="opay" id="op-box" role="dialog" aria-modal="true" aria-labelledby="op-title">' +
    '<div class="op-nav"><button class="op-ib op-hide" id="op-back" type="button" aria-label="Volver">←</button><span class="op-title" id="op-title"></span><button class="op-ib" id="op-close" type="button" aria-label="Cerrar">✕</button></div>' +
    '<section class="op-s op-active" id="op-select">' +
      '<div class="op-tabs" id="op-tabs"></div>' +
      '<div class="op-head"><div class="op-name" id="op-name"></div><div class="op-price" id="op-subt"></div></div>' +
      '<div class="op-stage" id="op-stage"><div class="op-card" id="op-card"><div class="op-top"><div class="op-chip"></div><div class="op-tap">)))</div></div><div class="op-side" id="op-side"></div><div class="op-bot"><div class="op-bsub" id="op-bsub"></div><div class="op-mark">OUTVOSS</div></div></div></div>' +
      '<div class="op-dots" id="op-dots"></div>' +
      '<button class="op-primary" id="op-choose" type="button"></button>' +
    '</section>' +
    '<section class="op-s" id="op-confirm">' +
      '<h1 class="op-h1">Confirmar pedido</h1><p class="op-sub">Revisa los detalles antes de pagar.</p>' +
      '<div class="op-sum"><div class="op-mini"><div class="op-minicard op-card" id="op-mini"><span id="op-minilabel"></span><span>OUTVOSS</span></div><div><div class="op-b" id="op-ctitle"></div><div class="op-s2" id="op-citems"></div></div></div>' +
        '<div class="op-row"><span>Método</span><span id="op-rmethod"></span></div>' +
        '<div class="op-row"><span>Subtotal</span><span id="op-rsub"></span></div>' +
        '<div class="op-row"><span>Domicilio</span><span id="op-rship"></span></div>' +
        '<div class="op-row"><span>Entrega</span><span id="op-rdel"></span></div>' +
        '<div class="op-row op-total"><span>Total a pagar</span><span id="op-rtotal"></span></div></div>' +
      '<button class="op-primary" id="op-pay" type="button"></button>' +
      '<p class="op-note">🔒 Tu pago se confirma con el comprobante de transferencia</p>' +
    '</section>' +
    '<section class="op-s" id="op-placed">' +
      '<div class="op-hero"><div class="op-reader"><div class="op-rcard op-card" id="op-pcard"></div><div class="op-slot"></div></div></div>' +
      '<h1 class="op-ptitle">Realiza tu transferencia</h1>' +
      '<p class="op-pdesc">Transfiere el valor exacto a la cuenta indicada<br>y luego sube tu comprobante para enviar el pedido.</p>' +
      '<div class="op-meta"><div class="op-row"><span>Total a transferir</span><span id="op-ptotal"></span></div>' +
        '<div class="op-row"><span id="op-pmname">Cuenta</span><span class="op-acc"><b id="op-pacc"></b><button class="op-copy" id="op-copy" type="button">Copiar</button></span></div>' +
        '<div class="op-row" id="op-holderrow"><span>Titular</span><span id="op-pholder"></span></div>' +
        '<div class="op-row"><span>Entrega</span><span id="op-pdel"></span></div></div>' +
      '<div class="op-stack"><button class="op-primary" id="op-togo" type="button">Ya transferí · subir comprobante</button><button class="op-secondary" id="op-cancel" type="button">Cancelar</button></div>' +
    '</section>' +
    '<section class="op-s" id="op-receipt">' +
      '<div class="op-printer"><div class="op-pslot"></div><div class="op-pstatus" id="op-pstatus"></div></div>' +
      '<div class="op-rv"><div class="op-paper" id="op-paper">' +
        '<div class="op-rbrand">COMPROBANTE</div>' +
        '<div class="op-rl"><span>MODO DE PAGO</span><span id="op-rc-m"></span></div>' +
        '<div class="op-rl"><span>CUENTA DESTINO</span><span id="op-rc-a"></span></div>' +
        '<div class="op-rl"><span>ENTREGA ESTIMADA</span><span id="op-rc-e"></span></div>' +
        '<div class="op-rl"><span>NÚMERO DE PEDIDO</span><span id="op-rc-p"></span></div>' +
        '<div class="op-rt"><span>TOTAL</span><span id="op-rc-t"></span></div>' +
        '<div class="op-up"><input type="file" id="op-file" accept="image/*,application/pdf" hidden><input type="file" id="op-camera" accept="image/*" capture="environment" hidden>' +
          '<button class="op-cam" id="op-cam" type="button" aria-label="Tomar foto o subir comprobante"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg></button>' +
          '<div class="op-upacts"><button class="op-mini2" id="op-photo" type="button">Tomar foto</button><button class="op-mini2" id="op-upload" type="button">Subir archivo</button><button class="op-mini2" id="op-retry" type="button" hidden>Reintentar envío</button></div>' +
          '<span class="op-hint" id="op-hint"></span><img class="op-preview" id="op-preview" alt="Vista previa del comprobante">' +
        '</div>' +
        '<div class="op-barcode"></div><div class="op-thanks">Conserva este comprobante en tu teléfono</div>' +
        '<div class="op-stamp" id="op-stamp">PENDIENTE</div>' +
      '</div></div>' +
      '<div class="op-ract"><button class="op-secondary" id="op-print" type="button">Imprimir</button><button class="op-primary" id="op-done" type="button">Listo</button></div>' +
    '</section>' +
  '</div>';

  function $(id) { return document.getElementById(id); }
  function money(n) { return (S.opts && S.opts.money) ? S.opts.money(n) : '$' + Number(n).toLocaleString('es-CO'); }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  }

  function build() {
    if (root) return;
    var st = document.createElement('style'); st.id = 'opay-css'; st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement('div'); root.id = 'opayRoot'; root.innerHTML = HTML; document.body.appendChild(root);
    ['box', 'back', 'close', 'title', 'select', 'confirm', 'placed', 'receipt', 'tabs', 'name', 'subt', 'stage', 'card', 'side', 'bsub', 'dots', 'choose', 'mini', 'minilabel', 'ctitle', 'citems',
     'rmethod', 'rsub', 'rship', 'rdel', 'rtotal', 'pay', 'pcard', 'ptotal', 'pmname', 'pacc', 'copy', 'holderrow', 'pholder', 'pdel', 'togo', 'cancel', 'pstatus', 'paper', 'rc-m', 'rc-a', 'rc-e', 'rc-p', 'rc-t',
     'file', 'camera', 'cam', 'photo', 'upload', 'retry', 'hint', 'preview', 'stamp', 'print', 'done'].forEach(function (k) { ui[k] = $('op-' + k); });
    bind();
  }

  function setCard(el, id) { el.classList.remove('op-platinum', 'op-nequi', 'op-daviplata'); el.classList.add('op-' + id); }
  function setBtn(el, t) { el.classList.remove('op-b-nequi', 'op-b-daviplata'); if (t.btn) el.classList.add(t.btn); }
  function cur() { return S.list[S.idx]; }

  function renderTier() {
    var t = cur(), multi = S.list.length > 1;
    ui.tabs.replaceChildren(); ui.dots.replaceChildren();
    ui.tabs.style.display = ui.dots.style.display = multi ? '' : 'none';
    S.list.forEach(function (m, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'op-tab' + (i === S.idx ? ' op-on' : ''); b.textContent = m.name;
      b.onclick = function () { setIdx(i); }; ui.tabs.appendChild(b);
      var d = document.createElement('span'); d.className = 'op-dot' + (i === S.idx ? ' op-on' : ''); ui.dots.appendChild(d);
    });
    ui.name.textContent = t.name; ui.subt.textContent = t.subtitle; ui.side.textContent = t.side; ui.bsub.textContent = t.sub;
    ui.choose.textContent = 'Elegir ' + t.name; setCard(ui.card, t.id); setBtn(ui.choose, t);
  }
  function setIdx(i) { S.idx = (i + S.list.length) % S.list.length; renderTier(); }

  var screens = ['select', 'confirm', 'placed', 'receipt'];
  function show(name) {
    S.screen = name;
    screens.forEach(function (k) { ui[k].classList.toggle('op-active', k === name); });
    ui.box.classList.toggle('op-dark', name === 'receipt');
    ui.back.classList.toggle('op-hide', name !== 'confirm');
    ui.title.textContent = name === 'receipt' ? 'Recibo' : '';
    var f = ui[name].querySelector('button:not([hidden])'); if (f && name !== 'receipt') setTimeout(function () { f.focus(); }, 60);
    if (name === 'receipt') printAnim();
  }

  function shipText() { return S.ship == null ? 'A coordinar' : money(S.ship); }

  function fillConfirm() {
    var t = cur();
    ui.ctitle.textContent = t.sub; ui.citems.textContent = S.opts.itemsLabel || 'Tu pedido';
    ui.minilabel.textContent = t.side; setCard(ui.mini, t.id);
    ui.rmethod.textContent = t.name; ui.rsub.textContent = money(S.opts.subtotal);
    ui.rship.textContent = shipText(); ui.rdel.textContent = S.delivery; ui.rtotal.textContent = money(S.total);
    ui.pay.textContent = 'Pagar ' + money(S.total); setBtn(ui.pay, t);
  }
  function fillPlaced() {
    var t = cur();
    setCard(ui.pcard, t.id); ui.ptotal.textContent = money(S.total);
    ui.pmname.textContent = 'Cuenta ' + t.name; ui.pacc.textContent = t.account;
    ui.holderrow.style.display = t.holder ? '' : 'none'; ui.pholder.textContent = t.holder; ui.pdel.textContent = S.delivery;
    setBtn(ui.togo, t); ui.copy.textContent = 'Copiar';
  }
  function fillReceipt() {
    var t = cur();
    ui['rc-m'].textContent = t.side; ui['rc-a'].textContent = t.account; ui['rc-e'].textContent = String(S.delivery).toUpperCase();
    ui['rc-p'].textContent = S.orderId ? 'PED-' + String(S.orderId).slice(0, 8).toUpperCase() : 'SE ASIGNA AL ENVIAR';
    ui['rc-t'].textContent = money(S.total); setBtn(ui.done, t);
  }

  var printTimer, stampTimer;
  function printAnim() {
    clearTimeout(printTimer); clearTimeout(stampTimer);
    ui.paper.classList.remove('op-printing'); ui.stamp.classList.remove('op-st');
    ui.pstatus.textContent = 'Imprimiendo orden de pago...';
    requestAnimationFrame(function () { requestAnimationFrame(function () { ui.paper.classList.add('op-printing'); }); });
    printTimer = setTimeout(function () { ui.pstatus.textContent = S.done ? 'Comprobante recibido · lo verificaremos pronto' : 'Esperando tu comprobante de transferencia'; }, 1250);
    stampTimer = setTimeout(function () { ui.stamp.classList.add('op-st'); }, 1450);
  }

  function hint(msg, err) { ui.hint.textContent = msg || ''; ui.hint.classList.toggle('op-err', !!err); }
  function setBusy(b) {
    S.busy = b;
    [ui.cam, ui.photo, ui.upload, ui.retry, ui.done, ui.print].forEach(function (x) { x.disabled = b || (S.done && x !== ui.done && x !== ui.print); });
  }

  function handleFile(file) {
    if (!file || S.busy || S.done) return;
    if (!/^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/i.test(file.type || '')) { hint('Formato no válido. Usa una foto (JPG, PNG, WEBP) o un PDF.', true); return; }
    if (file.size > MAX_BYTES) { hint('El archivo pesa más de 6 MB. Toma una foto más liviana.', true); return; }
    if (/^image\//i.test(file.type)) {
      var rd = new FileReader(); rd.onload = function (e) { ui.preview.src = e.target.result; ui.preview.classList.add('op-vis'); }; rd.readAsDataURL(file);
    } else { ui.preview.removeAttribute('src'); ui.preview.classList.remove('op-vis'); }
    S.pending = file; send();
  }

  async function send() {
    var file = S.pending; if (!file) return;
    setBusy(true); ui.retry.hidden = true; hint('Subiendo comprobante…');
    var stage = 'upload';
    try {
      if (!S.proofPath || S.proofFile !== file) {
        var safe = (file.name || 'comprobante').replace(/[^A-Za-z0-9._-]/g, '_').slice(-80) || 'comprobante';
        var path = uuid() + '/' + safe;
        var up = await S.opts.sb.storage.from('payment-proofs').upload(path, file, { contentType: file.type, upsert: false });
        if (up.error) throw new Error('No pudimos subir el comprobante. Revisa tu conexión e inténtalo de nuevo.');
        S.proofPath = path; S.proofFile = file;
      }
      stage = 'submit'; hint('Enviando tu pedido…');
      var res = await S.opts.onSubmit({ method: cur().id, proofPath: S.proofPath });
      if (res && res.error) throw new Error(res.error.message || 'No pudimos enviar el pedido.');
      S.orderId = res && res.data; S.done = true; setBusy(false);
      ui.cam.classList.add('op-uploaded'); ui.stamp.textContent = 'RECIBIDO'; ui.stamp.classList.add('op-paid', 'op-st');
      ui.pstatus.textContent = 'Comprobante recibido · lo verificaremos pronto';
      hint('Comprobante enviado ✓ ' + (file.name ? '(' + file.name + ')' : ''));
      fillReceipt(); setBusy(false);
      [ui.cam, ui.photo, ui.upload].forEach(function (x) { x.disabled = true; });
    } catch (err) {
      setBusy(false);
      var msg = (err && err.message) || 'Ocurrió un error.';
      if (stage === 'submit') { msg += ' Si ya hiciste la transferencia, escríbenos con tu comprobante y te ayudamos.'; if (S.opts.onSubmitError) S.opts.onSubmitError(err); }
      hint(msg, true); ui.retry.hidden = false;
    }
  }

  function leave() {
    if (S.busy) return;
    if (!S.done && (S.screen === 'placed' || S.screen === 'receipt')) {
      if (!window.confirm('Aún no has enviado tu comprobante, así que tu pedido no se ha enviado. ¿Quieres salir?')) return;
    }
    hideRoot();
    if (S.done && S.opts.onFinished) S.opts.onFinished(S.orderId);
  }
  function hideRoot() {
    root.classList.remove('open'); document.documentElement.style.overflow = S.prevOverflow || '';
    document.removeEventListener('keydown', onKey);
    if (S.opener && S.opener.focus) { try { S.opener.focus(); } catch (e) { /* nada */ } }
  }
  function onKey(e) { if (e.key === 'Escape') leave(); }

  function bind() {
    ui.close.onclick = leave;
    ui.back.onclick = function () { if (S.screen === 'confirm') show('select'); };
    ui.choose.onclick = function () { fillConfirm(); show('confirm'); };
    ui.pay.onclick = function () { fillPlaced(); show('placed'); };
    ui.cancel.onclick = leave;
    ui.togo.onclick = function () { fillReceipt(); show('receipt'); };
    ui.done.onclick = leave;
    ui.copy.onclick = function () {
      var t = cur().account;
      var ok = function () { ui.copy.textContent = '¡Copiado!'; setTimeout(function () { ui.copy.textContent = 'Copiar'; }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, function () { /* sin permiso */ }); else ok();
    };
    ui.cam.onclick = ui.upload.onclick = function () { ui.file.click(); };
    ui.photo.onclick = function () { ui.camera.click(); };
    ui.file.onchange = function (e) { var f = e.target.files && e.target.files[0]; handleFile(f); e.target.value = ''; };
    ui.camera.onchange = function (e) { var f = e.target.files && e.target.files[0]; handleFile(f); e.target.value = ''; };
    ui.retry.onclick = function () { send(); };
    ui.print.onclick = function () { var t = document.title; document.title = 'Comprobante_' + (S.orderId ? 'PED-' + String(S.orderId).slice(0, 8).toUpperCase() : 'OUTVOSS'); window.print(); document.title = t; };
    // deslizar la tarjeta para cambiar de método
    var x0 = null;
    ui.stage.addEventListener('pointerdown', function (e) { x0 = e.clientX; try { ui.stage.setPointerCapture(e.pointerId); } catch (er) { /* nada */ } });
    ui.stage.addEventListener('pointermove', function (e) {
      if (x0 === null) return; var dx = e.clientX - x0;
      ui.card.style.transform = 'translateX(' + (dx * 0.25) + 'px) rotateY(' + Math.max(-18, Math.min(18, dx * 0.14)) + 'deg)';
    });
    function end(e) {
      if (x0 === null) return; var dx = e.clientX - x0; x0 = null; ui.card.style.transform = '';
      if (S.list.length > 1) { if (dx < -45) setIdx(S.idx + 1); else if (dx > 45) setIdx(S.idx - 1); }
    }
    ui.stage.addEventListener('pointerup', end); ui.stage.addEventListener('pointercancel', end);
  }

  /* ---------------------------------------------------------------- API */
  function loadCfg(sb) {
    if (!cfgPromise) {
      cfgPromise = Promise.resolve(sb.from('site_settings').select('value').eq('key', 'payments').maybeSingle())
        .then(function (r) { return (r && r.data && r.data.value) || null; })
        .catch(function () { return null; });
    }
    return cfgPromise;
  }
  function methodList(cfg) {
    var out = [], ms = (cfg && cfg.methods) || {};
    ORDER.forEach(function (id) {
      var m = ms[id]; if (!m || !m.enabled || !String(m.account || '').trim()) return;
      var t = TIERS[id];
      out.push({ id: id, name: (m.name || t.name), subtitle: (m.subtitle || t.subtitle), side: String(m.name || t.name).toUpperCase(), sub: 'Tarjeta ' + (m.name || t.name),
                 btn: t.btn, account: String(m.account).trim(), holder: String(m.holder || '').trim() });
    });
    return out;
  }

  window.OutvossPay = {
    /* ¿Hay al menos un método de pago configurado en el panel? */
    available: function (sb) { return loadCfg(sb).then(function (c) { return methodList(c).length > 0; }); },

    /* opts: { sb, money(n), subtotal, itemsLabel, onSubmit({method,proofPath}) -> {data,error}, onSubmitError(err), onFinished(orderId) } */
    open: async function (opts) {
      var cfg = await loadCfg(opts.sb), list = methodList(cfg);
      if (!list.length) return false;
      build();
      var ship = cfg && cfg.shipping_cost != null && cfg.shipping_cost !== '' ? Number(cfg.shipping_cost) : null;
      if (ship != null && (isNaN(ship) || ship < 0)) ship = null;
      S = { opts: opts, list: list, idx: 0, screen: 'select', ship: ship, delivery: (cfg && cfg.delivery_time) || 'A coordinar',
            total: Number(opts.subtotal) + (ship || 0), proofPath: null, proofFile: null, pending: null, busy: false, done: false, orderId: null,
            opener: document.activeElement, prevOverflow: document.documentElement.style.overflow };
      ui.cam.classList.remove('op-uploaded'); ui.stamp.textContent = 'PENDIENTE'; ui.stamp.classList.remove('op-paid', 'op-st');
      ui.preview.removeAttribute('src'); ui.preview.classList.remove('op-vis'); ui.retry.hidden = true; hint('Toma una foto o sube el archivo del recibo');
      [ui.cam, ui.photo, ui.upload, ui.done, ui.print].forEach(function (x) { x.disabled = false; });
      ui.box.classList.remove('op-dark');
      screens.forEach(function (k) { ui[k].classList.remove('op-active'); });
      renderTier(); show('select');
      document.documentElement.style.overflow = 'hidden';
      root.classList.add('open'); document.addEventListener('keydown', onKey);
      return true;
    }
  };
})();
