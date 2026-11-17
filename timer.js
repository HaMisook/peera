/* 피어라 매직! 수업 타이머
   - 화면 위에 떠 있는 창: 끌어서 옮기기, 오른쪽 아래 모서리로 크기 조절, 닫기
   - 나란히 놓기: 화면 옆(좁은 화면에서는 아래)에 붙이고 본 화면을 그만큼 줄임
   - 페이지를 옮겨도 남은 시간과 창 위치를 기억함
   사용법: 각 html의 </body> 앞에  <script src="timer.js" defer></script>  한 줄 */
(function () {
  if (window.__peeraTimer) return;
  window.__peeraTimer = true;

  var KEY = "peeraTimer";
  var S = { open: false, mode: "float", x: null, y: null, w: 260, h: 240, dw: 300, total: 300, remain: 300, endAt: 0, sound: true };
  try { var saved = JSON.parse(localStorage.getItem(KEY) || "{}"); for (var k in saved) if (k in S) S[k] = saved[k]; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  var css =
    "#pt-launch{position:fixed;right:16px;bottom:84px;z-index:2147483000;min-width:52px;height:52px;padding:0 14px;border-radius:26px;border:none;cursor:pointer;" +
    "background:#9d7fd8;color:#fff;font:700 17px/1 system-ui,sans-serif;box-shadow:0 6px 18px rgba(80,60,140,.35);display:flex;align-items:center;justify-content:center;gap:6px;font-variant-numeric:tabular-nums}" +
    "#pt-launch:focus-visible,#pt-panel button:focus-visible{outline:3px solid #f09a6a;outline-offset:2px}" +
    "#pt-panel{position:fixed;z-index:2147483001;background:#fff;color:#4a4458;border:2px solid #9d7fd8;border-radius:16px;box-shadow:0 10px 30px rgba(80,60,140,.3);" +
    "display:flex;flex-direction:column;overflow:hidden;font-family:system-ui,-apple-system,'Malgun Gothic',sans-serif;box-sizing:border-box;touch-action:none;user-select:none;-webkit-user-select:none}" +
    "#pt-panel *{box-sizing:border-box}" +
    "#pt-panel[hidden]{display:none}" +
    "#pt-head{display:flex;align-items:center;gap:6px;padding:6px 8px 6px 12px;background:#f1eaff;cursor:move;flex:none}" +
    "#pt-head b{font-size:14px;margin-right:auto}" +
    "#pt-panel button{font:inherit;color:inherit;cursor:pointer;border:1px solid #d9cdf3;background:#fff;border-radius:9px;min-height:34px;padding:0 9px;font-size:13px;font-weight:700}" +
    "#pt-panel button.pt-x{border-color:transparent;background:transparent;font-size:18px;padding:0 8px}" +
    "#pt-face{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;container-type:size}" +
    "#pt-time{font-weight:800;font-variant-numeric:tabular-nums;line-height:1;font-size:48px;font-size:min(30cqw,78cqh)}" +
    "#pt-ctl{flex:none;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:6px 8px 10px}" +
    "#pt-panel button.pt-go{background:#9d7fd8;border-color:#9d7fd8;color:#fff;min-width:74px}" +
    "#pt-grip{position:absolute;right:0;bottom:0;width:26px;height:26px;cursor:nwse-resize;background:linear-gradient(135deg,transparent 55%,#9d7fd8 55%,#9d7fd8 65%,transparent 65%,transparent 75%,#9d7fd8 75%,#9d7fd8 85%,transparent 85%)}" +
    "#pt-edge{position:absolute;left:0;top:0;bottom:0;width:12px;cursor:ew-resize;display:none}" +
    "#pt-panel.pt-dock{border-radius:0;box-shadow:none}" +
    "#pt-panel.pt-dock #pt-grip{display:none}#pt-panel.pt-dock #pt-head{cursor:default}" +
    "#pt-panel.pt-dock.pt-right{top:0;right:0;bottom:0;border-width:0 0 0 3px}#pt-panel.pt-dock.pt-right #pt-edge{display:block}" +
    "#pt-panel.pt-dock.pt-bottom{left:0;right:0;bottom:0;height:190px;border-width:3px 0 0 0}" +
    "#pt-panel.pt-done{background:#ffe1ec;border-color:#e484ac;animation:pt-blink 1s steps(2) 6}" +
    "@keyframes pt-blink{50%{background:#fff}}" +
    "@media (prefers-reduced-motion:reduce){#pt-panel.pt-done{animation:none}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  function el(tag, attrs, text) { var e = document.createElement(tag); for (var a in attrs) e.setAttribute(a, attrs[a]); if (text != null) e.textContent = text; return e; }

  var launch = el("button", { id: "pt-launch", type: "button", "aria-label": "타이머 열기" });
  var panel = el("div", { id: "pt-panel", role: "dialog", "aria-label": "타이머" });
  var head = el("div", { id: "pt-head" });
  var bDock = el("button", { type: "button" });
  var bSnd = el("button", { type: "button" });
  var bX = el("button", { type: "button", class: "pt-x", "aria-label": "타이머 닫기" }, "✕");
  head.appendChild(el("b", {}, "타이머")); head.appendChild(bDock); head.appendChild(bSnd); head.appendChild(bX);
  var face = el("div", { id: "pt-face" }), time = el("div", { id: "pt-time", "aria-live": "off" });
  face.appendChild(time);
  var ctl = el("div", { id: "pt-ctl" });
  var bGo = el("button", { type: "button", class: "pt-go" });
  var bReset = el("button", { type: "button" }, "처음으로");
  var bMinus = el("button", { type: "button", "aria-label": "1분 줄이기" }, "−1분");
  var bPlus = el("button", { type: "button", "aria-label": "1분 늘리기" }, "+1분");
  ctl.appendChild(bGo); ctl.appendChild(bReset); ctl.appendChild(bMinus); ctl.appendChild(bPlus);
  [1, 3, 5, 10].forEach(function (m) {
    var b = el("button", { type: "button" }, m + "분");
    b.addEventListener("click", function () { clearDone(); S.total = S.remain = m * 60; S.endAt = 0; save(); render(); });
    ctl.appendChild(b);
  });
  var grip = el("div", { id: "pt-grip", "aria-hidden": "true" }), edge = el("div", { id: "pt-edge", "aria-hidden": "true" });
  panel.appendChild(head); panel.appendChild(face); panel.appendChild(ctl); panel.appendChild(grip); panel.appendChild(edge);
  document.body.appendChild(launch); document.body.appendChild(panel);

  // ----- 시간
  function left() { return S.endAt ? Math.max(0, Math.ceil((S.endAt - Date.now()) / 1000)) : S.remain; }
  function fmt(s) { var m = Math.floor(s / 60), r = s % 60; return m + ":" + (r < 10 ? "0" : "") + r; }
  var ac = null;
  function unlock() { try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); } catch (e) {} }
  function beep() {
    if (!S.sound || !ac) return;
    try {
      for (var i = 0; i < 3; i++) {
        var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * 0.45;
        o.frequency.value = 880; o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.4, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        o.start(t); o.stop(t + 0.32);
      }
    } catch (e) {}
  }
  function clearDone() { panel.classList.remove("pt-done"); }
  function finish() { S.endAt = 0; S.remain = 0; save(); if (!S.open) { S.open = true; save(); } layout(); panel.classList.add("pt-done"); beep(); }

  bGo.addEventListener("click", function () {
    unlock(); clearDone();
    if (S.endAt) { S.remain = left(); S.endAt = 0; }
    else { if (S.remain <= 0) S.remain = S.total || 60; S.endAt = Date.now() + S.remain * 1000; }
    save(); render();
  });
  bReset.addEventListener("click", function () { clearDone(); S.endAt = 0; S.remain = S.total; save(); render(); });
  function adjust(d) {
    clearDone();
    if (S.endAt) { S.endAt = Math.max(Date.now() + 1000, S.endAt + d * 1000); }
    else { S.remain = Math.max(0, S.remain + d); S.total = S.remain; }
    save(); render();
  }
  bMinus.addEventListener("click", function () { adjust(-60); });
  bPlus.addEventListener("click", function () { adjust(60); });
  bSnd.addEventListener("click", function () { S.sound = !S.sound; if (S.sound) unlock(); save(); render(); });

  function render() {
    var l = left(), t = fmt(l);
    time.textContent = t;
    bGo.textContent = S.endAt ? "잠깐 멈춤" : "시작";
    bSnd.textContent = S.sound ? "소리 켬" : "소리 끔";
    bSnd.setAttribute("aria-pressed", String(S.sound));
    bDock.textContent = S.mode === "dock" ? "띄우기" : "나란히";
    launch.textContent = S.endAt ? "⏱ " + t : "⏱";
    launch.hidden = S.open;
  }
  setInterval(function () { if (S.endAt && left() <= 0) finish(); render(); }, 250);

  // ----- 창 배치
  var root = document.documentElement;
  function narrow() { return window.innerWidth < 700; }
  function layout() {
    panel.hidden = !S.open;
    panel.classList.remove("pt-dock", "pt-right", "pt-bottom");
    document.body.style.marginRight = ""; document.body.style.paddingBottom = "";
    panel.style.left = panel.style.top = panel.style.width = panel.style.height = "";
    if (S.open && S.mode === "dock") {
      panel.classList.add("pt-dock");
      if (narrow()) { panel.classList.add("pt-bottom"); document.body.style.paddingBottom = "190px"; }
      else {
        S.dw = Math.min(Math.max(200, S.dw), Math.round(window.innerWidth * 0.6));
        panel.classList.add("pt-right"); panel.style.width = S.dw + "px"; document.body.style.marginRight = S.dw + "px";
      }
    } else if (S.open) {
      var vw = window.innerWidth, vh = window.innerHeight;
      S.w = Math.min(Math.max(190, S.w), vw - 8); S.h = Math.min(Math.max(170, S.h), vh - 8);
      if (S.x == null) { S.x = vw - S.w - 16; S.y = vh - S.h - 16; }
      S.x = Math.min(Math.max(4, S.x), vw - S.w - 4); S.y = Math.min(Math.max(4, S.y), vh - S.h - 4);
      panel.style.left = S.x + "px"; panel.style.top = S.y + "px"; panel.style.width = S.w + "px"; panel.style.height = S.h + "px";
    }
    render();
  }
  launch.addEventListener("click", function () { S.open = true; save(); layout(); });
  bX.addEventListener("click", function () { S.open = false; clearDone(); save(); layout(); });
  bDock.addEventListener("click", function () { S.mode = S.mode === "dock" ? "float" : "dock"; save(); layout(); });
  window.addEventListener("resize", layout);

  function dragger(target, onMove, guard) {
    target.addEventListener("pointerdown", function (e) {
      if (guard && !guard(e)) return;
      var sx = e.clientX, sy = e.clientY, o = { x: S.x, y: S.y, w: S.w, h: S.h, dw: S.dw };
      target.setPointerCapture(e.pointerId);
      function mv(ev) { onMove(ev.clientX - sx, ev.clientY - sy, o); layout(); }
      function up() { target.removeEventListener("pointermove", mv); target.removeEventListener("pointerup", up); target.removeEventListener("pointercancel", up); save(); }
      target.addEventListener("pointermove", mv); target.addEventListener("pointerup", up); target.addEventListener("pointercancel", up);
      e.preventDefault();
    });
  }
  dragger(head, function (dx, dy, o) { S.x = o.x + dx; S.y = o.y + dy; }, function (e) { return S.mode !== "dock" && e.target.tagName !== "BUTTON"; });
  dragger(grip, function (dx, dy, o) { S.w = o.w + dx; S.h = o.h + dy; });
  dragger(edge, function (dx, dy, o) { S.dw = o.dw - dx; });

  if (S.endAt && S.endAt <= Date.now()) { S.endAt = 0; S.remain = 0; save(); }
  layout();
})();
