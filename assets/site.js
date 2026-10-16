(function () {
  "use strict";
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }

  // ---- old links to a band of the one-page site (worldfall3d.com/#install) go to its page ----
  var moved = {"install": "/install/", "updates": "/updates/", "compare": "/world/", "quality": "/world/#quality", "hours": "/world/#hours", "horizons": "/world/#horizons", "biomes": "/world/#biomes", "wonders": "/world/#wonders", "next": "/towns/", "towns": "/towns/#towns", "inside": "/towns/#inside", "war": "/war/", "dragons": "/war/#dragons", "chaos": "/war/#chaos"};
  if ((location.pathname === "/" || location.pathname === "/index.html") && location.hash) {
    var to = moved[location.hash.slice(1)];
    if (to && !document.getElementById(location.hash.slice(1))) { location.replace(to); return; }
  }

  // ---- flat map / 3D ----
  each(".cmp", function (cmp) {
    var range = cmp.querySelector("input[type=range]");
    if (!range) return;
    function setCmp() { cmp.style.setProperty("--pos", range.value + "%"); }
    range.addEventListener("input", setCmp);
    setCmp();
  });

  // ---- the hour ----
  var hour = document.getElementById("hour");
  if (hour) {
    var layers = document.querySelectorAll("#hours-stack img");
    var labels = [document.getElementById("h0"), document.getElementById("h1"), document.getElementById("h2")];
    var setHour = function () {
      var v = hour.value / 100;          // 0 noon .. 1 golden .. 2 night
      layers[1].style.opacity = Math.min(1, v).toFixed(3);
      layers[2].style.opacity = Math.max(0, v - 1).toFixed(3);
      var near = Math.round(v);
      labels.forEach(function (l, k) { if (l) l.classList.toggle("now", k === near); });
    };
    hour.addEventListener("input", setHour);
    setHour();
  }

  // ---- install tabs ----
  var tabs = [document.getElementById("tab-win"), document.getElementById("tab-mac"), document.getElementById("tab-nml")];
  var panels = [document.getElementById("steps-win"), document.getElementById("steps-mac"), document.getElementById("steps-nml")];
  if (tabs[0] && tabs[1] && tabs[2]) {
    var pick = function (k) {
      tabs.forEach(function (t, j) { t.setAttribute("aria-selected", j === k ? "true" : "false"); t.tabIndex = j === k ? 0 : -1; });
      panels.forEach(function (p, j) { if (p) p.hidden = j !== k; });
    };
    tabs.forEach(function (t, k) {
      t.addEventListener("click", function () { pick(k); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") { var j = (k + (e.key === "ArrowRight" ? 1 : 2)) % 3; pick(j); tabs[j].focus(); }
      });
    });
    if (/Mac/.test(navigator.platform || "")) pick(1); else pick(0);
  }

  // ---- looks ----
  (function () {
    var box = document.getElementById("looks");
    if (!box) return;
    var ltabs = box.querySelectorAll("[role=tab]"), imgs = box.querySelectorAll(".looks-stack img"), cap = document.getElementById("looks-cap");
    function pickLook(k) {
      Array.prototype.forEach.call(ltabs, function (t) { var on = t.getAttribute("data-look") === k; t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1; });
      Array.prototype.forEach.call(imgs, function (im) { var on = im.getAttribute("data-look") === k; im.hidden = !on; if (on) { im.loading = "eager"; if (cap) cap.textContent = im.getAttribute("data-cap"); } });
    }
    Array.prototype.forEach.call(ltabs, function (t, i) {
      t.addEventListener("click", function () { pickLook(t.getAttribute("data-look")); });
      t.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        var j = (i + (e.key === "ArrowRight" ? 1 : ltabs.length - 1)) % ltabs.length;
        pickLook(ltabs[j].getAttribute("data-look")); ltabs[j].focus();
      });
    });
  })();

  // ---- the menu shuts on a click outside or Escape ----
  each(".menu", function (menu) {
    document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.open) { menu.open = false; menu.querySelector("summary").focus(); } });
  });

  // ---- the soundtrack player: one track at a time, the next follows ----
  (function () {
    var list = document.getElementById("tracks");
    if (!list) return;
    var rows = Array.prototype.slice.call(list.querySelectorAll(".track"));
    var player = document.getElementById("player"), big = document.getElementById("player-play");
    var title = document.getElementById("player-title"), at = document.getElementById("player-at"), len = document.getElementById("player-len");
    var seek = document.getElementById("player-seek");
    var audio = new Audio();
    audio.preload = "none";
    var current = -1, seeking = false;
    function mmss(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
    function show() {
      var playing = !audio.paused;
      rows.forEach(function (r, i) {
        var on = i === current;
        r.classList.toggle("on", on);
        r.classList.toggle("playing", on && playing);
        r.querySelector(".play").setAttribute("aria-label", (on && playing ? "Pause " : "Play ") + r.getAttribute("data-title"));
      });
      big.classList.toggle("pause", playing);
      big.setAttribute("aria-label", playing ? "Pause" : "Play");
    }
    function play(i) {
      if (i < 0 || i >= rows.length) return;
      if (i !== current) {
        current = i;
        audio.src = rows[i].getAttribute("data-src");
        title.textContent = rows[i].getAttribute("data-title");
        at.textContent = "0:00";
        seek.value = 0;
        player.hidden = false;
      }
      audio.play().catch(function () { show(); });
    }
    rows.forEach(function (r, i) {
      r.querySelector(".play").addEventListener("click", function () {
        if (i === current && !audio.paused) audio.pause(); else play(i);
      });
    });
    big.addEventListener("click", function () { if (audio.paused) play(current < 0 ? 0 : current); else audio.pause(); });
    audio.addEventListener("play", show);
    audio.addEventListener("pause", show);
    audio.addEventListener("loadedmetadata", function () { len.textContent = mmss(audio.duration); });
    audio.addEventListener("timeupdate", function () {
      at.textContent = mmss(audio.currentTime);
      if (!seeking && audio.duration) seek.value = Math.round(audio.currentTime / audio.duration * 1000);
    });
    audio.addEventListener("ended", function () { if (current + 1 < rows.length) play(current + 1); else show(); });
    seek.addEventListener("input", function () { seeking = true; if (audio.duration) at.textContent = mmss(seek.value / 1000 * audio.duration); });
    seek.addEventListener("change", function () { if (audio.duration) audio.currentTime = seek.value / 1000 * audio.duration; seeking = false; });
  })();
})();
