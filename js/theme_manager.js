(function () {
  var STORAGE_KEY = "theme_profile_v1";
  var STYLE_ID = "theme-dynamic-style";
  var POW2_TILE_VALUES = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];
  var FIB_TILE_VALUES = [
    1, 2, 3, 5, 8, 13, 21, 34,
    55, 89, 144, 233, 377, 610, 987, 1597,
    2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025
  ];
  var FIB_PREVIEW_VALUES = FIB_TILE_VALUES.slice(0, 16);
  var TIMER_VALUES = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
  var DEFAULT_THEME = "classic";

  function clamp(num, min, max) {
    return Math.max(min, Math.min(max, num));
  }

  function hexToRgb(hex) {
    var clean = (hex || "").replace("#", "");
    if (clean.length === 3) {
      clean = clean.charAt(0) + clean.charAt(0) +
              clean.charAt(1) + clean.charAt(1) +
              clean.charAt(2) + clean.charAt(2);
    }
    var n = parseInt(clean, 16);
    if (isNaN(n)) {
      return { r: 0, g: 0, b: 0 };
    }
    return {
      r: (n >> 16) & 255,
      g: (n >> 8) & 255,
      b: n & 255
    };
  }

  function rgbToHex(r, g, b) {
    function p(v) {
      var s = clamp(v, 0, 255).toString(16);
      return s.length === 1 ? "0" + s : s;
    }
    return "#" + p(r) + p(g) + p(b);
  }

  function mixHex(hexA, hexB, ratio) {
    var a = hexToRgb(hexA);
    var b = hexToRgb(hexB);
    var t = clamp(ratio, 0, 1);
    return rgbToHex(
      Math.round(a.r + (b.r - a.r) * t),
      Math.round(a.g + (b.g - a.g) * t),
      Math.round(a.b + (b.b - a.b) * t)
    );
  }

  function rgba(hex, alpha) {
    var rgb = hexToRgb(hex);
    return "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + clamp(alpha, 0, 1) + ")";
  }

  function samplePalette(colors, ratio) {
    if (!Array.isArray(colors) || colors.length === 0) return "#000000";
    if (colors.length === 1) return colors[0];
    var t = clamp(ratio, 0, 1);
    var span = colors.length - 1;
    var scaled = t * span;
    var left = Math.floor(scaled);
    var right = Math.min(span, left + 1);
    var local = scaled - left;
    return mixHex(colors[left], colors[right], local);
  }

  function colorForIndex(theme, index, totalCount) {
    if (index < theme.colors.length) return theme.colors[index];
    var denom = Math.max(1, totalCount - 1);
    return samplePalette(theme.colors, index / denom);
  }

  function tileTextColor(index, lightTextFrom) {
    return index >= lightTextFrom ? "#f9f6f2" : "#776e65";
  }

  function makeTheme(id, label, colors, config) {
    return {
      id: id,
      label: label,
      colors: colors,
      lightTextFrom: config.lightTextFrom,
      gradient: !!config.gradient,
      neon: !!config.neon,
      blackTiles: !!config.blackTiles,
      flashy: !!config.flashy,
      timer: config.timer
    };
  }

  var themes = {
    classic: makeTheme("classic", "经典", [
      "#eee4da", "#ede0c8", "#f2b179", "#f59563",
      "#f67c5f", "#f65e3b", "#edcf72", "#edcc61",
      "#edc850", "#edc53f", "#edc22e", "#aa44cc",
      "#662288", "#331155", "#000000", "#111111"
    ], {
      lightTextFrom: 2,
      gradient: false,
      neon: false,
      timer: {
        panelBg: "#bbada0",
        panelText: "#f9f6f2",
        panelLabel: "#eee4da",
        cellBg: "#eee4da",
        cellText: "#776e65",
        cellShadow: "0 0 0 1px rgba(255,255,255,0.16) inset",
        buttonBg: "#eee4da",
        buttonText: "#776e65",
        buttonHoverBg: "#ded4c8",
        buttonHoverText: "#5a534c"
      }
    }),
    ocean: makeTheme("ocean", "冷海", [
      "#e8f8ff", "#d1f1ff", "#b8e8ff", "#8fdcff",
      "#6accfb", "#4fb8ef", "#3ca3df", "#2f8fce",
      "#2a7bb9", "#2569a5", "#21588f", "#1c4878",
      "#173b64", "#133052", "#0f2642", "#0b1d34"
    ], {
      lightTextFrom: 5,
      gradient: true,
      neon: false,
      timer: {
        panelBg: "#2c5e76",
        panelText: "#f3fbff",
        panelLabel: "#a8d8ea",
        cellBg: "#d8eef9",
        cellText: "#2b4f61",
        cellShadow: "0 0 0 1px rgba(255,255,255,0.2) inset",
        buttonBg: "#d8eef9",
        buttonText: "#2b4f61",
        buttonHoverBg: "#c8e6f4",
        buttonHoverText: "#1d3a49"
      }
    }),
    forest: makeTheme("forest", "森林", [
      "#edf7e6", "#ddf0cf", "#cde8b8", "#b6dea0",
      "#9ed287", "#84c56f", "#6ab65a", "#52a848",
      "#47943f", "#3c8138", "#336f31", "#2b5e2b",
      "#244f26", "#1e4121", "#18351c", "#132a17"
    ], {
      lightTextFrom: 6,
      gradient: true,
      neon: false,
      timer: {
        panelBg: "#4e7a52",
        panelText: "#f6fff1",
        panelLabel: "#d2eec8",
        cellBg: "#dff0d4",
        cellText: "#355138",
        cellShadow: "0 0 0 1px rgba(255,255,255,0.22) inset",
        buttonBg: "#dff0d4",
        buttonText: "#355138",
        buttonHoverBg: "#cfe7c2",
        buttonHoverText: "#27402a"
      }
    }),
    mono: makeTheme("mono", "极简灰", [
      "#f0f0f0", "#e7e7e7", "#dcdcdc", "#cecece",
      "#c0c0c0", "#b1b1b1", "#a2a2a2", "#949494",
      "#868686", "#777777", "#696969", "#5b5b5b",
      "#4e4e4e", "#414141", "#353535", "#2a2a2a"
    ], {
      lightTextFrom: 8,
      gradient: false,
      neon: false,
      timer: {
        panelBg: "#8e8e8e",
        panelText: "#f7f7f7",
        panelLabel: "#e0e0e0",
        cellBg: "#e8e8e8",
        cellText: "#4a4a4a",
        cellShadow: "0 0 0 1px rgba(255,255,255,0.24) inset",
        buttonBg: "#e8e8e8",
        buttonText: "#4a4a4a",
        buttonHoverBg: "#d9d9d9",
        buttonHoverText: "#2f2f2f"
      }
    }),
    pop: makeTheme("pop", "高对比", [
      "#fff2e0", "#ffe2b8", "#ffd08d", "#ffbd63",
      "#ffa53d", "#ff8820", "#ff6a2e", "#f84b4b",
      "#e33580", "#c92bbb", "#9c38de", "#6d45ef",
      "#4160f8", "#2b84ff", "#16abff", "#0bcbd3"
    ], {
      lightTextFrom: 5,
      gradient: true,
      neon: false,
      timer: {
        panelBg: "#6d4e8b",
        panelText: "#fff7ff",
        panelLabel: "#f3dcff",
        cellBg: "#f6e7ff",
        cellText: "#5d3e75",
        cellShadow: "0 0 0 1px rgba(255,255,255,0.24) inset",
        buttonBg: "#f6e7ff",
        buttonText: "#5d3e75",
        buttonHoverBg: "#ecd6fd",
        buttonHoverText: "#44295a"
      }
    }),
    neon_flux: makeTheme("neon_flux", "Neon Flux（动态霓虹）", [
      "#50f2ff", "#33e2ff", "#2dd0ff", "#38bbff",
      "#4da2ff", "#6b88ff", "#8a70ff", "#ab56ff",
      "#cf42ff", "#f22eff", "#ff37d8", "#ff42aa",
      "#ff4f84", "#ff626a", "#ff784f", "#ff9236"
    ], {
      lightTextFrom: 0,
      gradient: true,
      neon: true,
      timer: {
        panelBg: "#201d2f",
        panelText: "#f8f5ff",
        panelLabel: "#8ff7ff",
        cellBg: "#2a2640",
        cellText: "#d6d2ff",
        cellShadow: "0 0 0 1px rgba(173,139,255,0.35) inset",
        buttonBg: "#2a2640",
        buttonText: "#d6d2ff",
        buttonHoverBg: "#353050",
        buttonHoverText: "#f2efff"
      }
    }),
    neon_black: makeTheme("neon_black", "Cyber Noir（炫彩闪烁）", [
      "#00f0ff", "#11d9ff", "#2cc1ff", "#45a9ff",
      "#5f90ff", "#7d78ff", "#a05fff", "#c247ff",
      "#e931ff", "#ff35da", "#ff45b1", "#ff5a8d",
      "#ff736f", "#ff8d53", "#ffa63d", "#ffc134"
    ], {
      lightTextFrom: 0,
      gradient: true,
      neon: true,
      blackTiles: true,
      flashy: true,
      timer: {
        panelBg: "#141722",
        panelText: "#f2f7ff",
        panelLabel: "#84f6ff",
        cellBg: "#111726",
        cellText: "#d8e0ff",
        cellShadow: "0 0 0 1px rgba(112,146,255,0.32) inset",
        buttonBg: "#141c2e",
        buttonText: "#dfe8ff",
        buttonHoverBg: "#1a2440",
        buttonHoverText: "#ffffff"
      }
    })
  };

  function legendCss(theme) {
    var css = "";
    for (var i = 0; i < TIMER_VALUES.length; i++) {
      var val = TIMER_VALUES[i];
      var tileIdx = POW2_TILE_VALUES.indexOf(val);
      var base = theme.colors[tileIdx >= 0 ? tileIdx : 0];
      var light = mixHex(base, "#ffffff", 0.18);
      css += ".timer-legend-" + val + "{background:" + light + ";";
      css += "box-shadow:0 0 12px 2px " + rgba(base, theme.neon ? 0.45 : 0.35) + ", inset 0 0 0 1px " + rgba("#ffffff", 0.22) + ";";
      css += "color:#f9f6f2;}\n";
    }
    return css;
  }

  function tileCssForValues(theme, values, scopeSelector) {
    var css = "";
    for (var i = 0; i < values.length; i++) {
      var val = values[i];
      var base = colorForIndex(theme, i, values.length);
      var hi = mixHex(base, "#ffffff", theme.neon ? 0.2 : 0.14);
      var lo = mixHex(base, "#000000", theme.neon ? 0.25 : 0.1);
      var bg = theme.gradient ? "linear-gradient(140deg," + hi + "," + base + "," + lo + ")" : base;
      var text = tileTextColor(i, theme.lightTextFrom);
      var shadow = theme.neon
        ? "0 0 24px 4px " + rgba(base, 0.55) + ", inset 0 0 0 1px " + rgba("#ffffff", 0.22)
        : "0 0 22px 3px " + rgba(base, 0.32) + ", inset 0 0 0 1px " + rgba("#ffffff", 0.16);
      var border = "";

      if (theme.blackTiles) {
        var darkHi = mixHex("#101523", "#ffffff", 0.08);
        var darkLo = mixHex("#040509", "#000000", 0.25);
        bg = "linear-gradient(145deg," + darkHi + "," + "#090b12" + "," + darkLo + ")";
        text = "#f4f7ff";
        border = "2px solid " + mixHex(base, "#ffffff", 0.35) + ";";
        shadow =
          "0 0 18px 2px " + rgba(base, 0.78) +
          ", 0 0 30px 6px " + rgba(base, 0.38) +
          ", inset 0 0 0 1px " + rgba("#ffffff", 0.24);
      }
      var tileSelector = scopeSelector + " .tile.tile-" + val + " .tile-inner";
      var previewSelector = scopeSelector + " .theme-color-" + val;

      css += tileSelector + "," + previewSelector + "{";
      css += "color:" + text + ";background:" + bg + ";box-shadow:" + shadow + ";" + border + "box-sizing:border-box;";
      if (theme.neon) {
        css += "text-shadow:0 0 10px " + rgba(base, 0.85) + ";";
      }
      css += "}\n";

      if (theme.neon) {
        css += scopeSelector + " .theme-preview-tile.theme-color-" + val + "{background-size:200% 200%;}\n";
      }
      if (theme.blackTiles && theme.flashy) {
        css += scopeSelector + " .theme-preview-tile.theme-color-" + val + "{background-size:200% 200%;}\n";
      }
    }
    return css;
  }

  function timerCss(theme) {
    var t = theme.timer;
    var css = "";
    css += "#timer{background:" + t.panelBg + ";color:" + t.panelText + ";box-shadow:0 0 10px " + rgba(t.panelBg, 0.3) + ";}\n";
    css += "#timer:after{color:" + t.panelLabel + ";}\n";
    css += ".timertile{background:" + t.cellBg + ";color:" + t.cellText + ";box-shadow:" + t.cellShadow + ";}\n";
    css += ".timer-scroll-btn{background:" + t.buttonBg + ";color:" + t.buttonText + ";}\n";
    css += ".timer-scroll-btn:hover{background:" + t.buttonHoverBg + ";color:" + t.buttonHoverText + ";}\n";
    return css;
  }

  function getUiTokens(theme) {
    var accentA = colorForIndex(theme, 0, theme.colors.length);
    var accentB = colorForIndex(theme, 5, theme.colors.length);
    var accentC = colorForIndex(theme, 10, theme.colors.length);
    var darkUi = !!(theme.neon || theme.blackTiles);
    var baseBgA = darkUi ? "#0f1220" : "#faf8ef";
    var baseBgB = darkUi ? "#191d30" : "#f1eee3";

    return {
      pageBgA: mixHex(baseBgA, accentA, darkUi ? 0.14 : 0.06),
      pageBgB: mixHex(baseBgB, accentB, darkUi ? 0.16 : 0.08),
      text: darkUi ? "#e8efff" : mixHex("#776e65", accentB, 0.18),
      muted: darkUi ? "#a7b3cf" : mixHex("#8a8178", accentB, 0.18),
      border: mixHex(darkUi ? "#2c3350" : "#d8d4d0", accentA, darkUi ? 0.3 : 0.16),
      surface: mixHex(darkUi ? "#151a2a" : "#fffdf7", accentA, darkUi ? 0.24 : 0.08),
      surfaceSoft: mixHex(darkUi ? "#111725" : "#f4f1e8", accentB, darkUi ? 0.2 : 0.07),
      buttonBg: mixHex(darkUi ? "#1a2237" : "#8f7a66", accentB, darkUi ? 0.35 : 0.22),
      buttonHoverBg: mixHex(darkUi ? "#25304d" : "#7f6a56", accentC, darkUi ? 0.38 : 0.24),
      buttonText: darkUi ? "#f4f8ff" : "#f9f6f2",
      gameBg: mixHex(darkUi ? "#141b2c" : "#bbada0", accentA, darkUi ? 0.3 : 0.14),
      gridCellBg: darkUi ? rgba("#b6c6ff", 0.13) : rgba(mixHex("#eee4da", accentB, 0.2), 0.44),
      link: mixHex(darkUi ? "#8de9ff" : "#776e65", accentC, darkUi ? 0.28 : 0.2),
      linkHover: mixHex(darkUi ? "#d8fbff" : "#5d554e", accentA, darkUi ? 0.3 : 0.2),
      shadow: darkUi ? "0 10px 34px rgba(7,10,24,0.52)" : "0 6px 20px rgba(110,94,78,0.12)",
      panelLine: darkUi ? "rgba(168,184,230,0.26)" : "rgba(216,212,208,0.72)"
    };
  }

  function pageCss(theme) {
    var t = getUiTokens(theme);
    var css = "";

    css += "html,body{background:radial-gradient(circle at 14% 10%," + mixHex(t.pageBgA, "#ffffff", 0.06) + ",transparent 36%),linear-gradient(160deg," + t.pageBgA + "," + t.pageBgB + ");color:" + t.text + ";}\n";
    css += "h1.title,.mode-hub h2,.portal-section-title,.replay-modal-content h3,.mode-group-title{color:" + t.text + ";}\n";
    css += "p,.game-intro,.game-explanation,.settings-note,.portal-muted,.history-item-head,.mode-hub p,.stats-left,.stats-right,.score-container .score-addition,.best-container .score-addition{color:" + t.muted + ";}\n";
    css += "a,.portal-nav a{color:" + t.link + ";}\n";
    css += "a:hover,.portal-nav a:hover{color:" + t.linkHover + ";}\n";
    css += "hr{border-bottom-color:" + t.panelLine + ";}\n";

    css += ".score-container,.best-container{background:" + t.surface + ";color:" + t.text + ";box-shadow:" + t.shadow + ";}\n";
    css += ".score-container:after,.best-container:after{color:" + t.muted + ";}\n";

    css += ".game-container{background:" + t.gameBg + ";box-shadow:" + t.shadow + ", inset 0 0 0 1px " + rgba(t.border, 0.42) + ";}\n";
    css += ".grid-cell{background:" + t.gridCellBg + ";}\n";
    css += ".game-container .game-message{background:" + rgba(t.pageBgA, 0.72) + ";}\n";
    css += ".game-container .game-message.game-won{background:" + rgba(colorForIndex(theme, 8, theme.colors.length), 0.42) + ";}\n";

    css += ".restart-button,.top-action-btn,.replay-button,.replay-modal-actions .replay-button,.replay-control-btn,.game-container .game-message a,.game-container .game-message a.export-replay-button,.game-container .game-message a.import-replay-button,.game-container .game-message a.undo-button,.mode-hub-btn{background:" + t.buttonBg + ";color:" + t.buttonText + ";box-shadow:0 0 0 1px " + rgba(t.border, 0.44) + " inset, 0 6px 16px " + rgba(t.buttonBg, 0.28) + ";}\n";
    css += ".restart-button:hover,.top-action-btn:hover,.replay-button:hover,.replay-modal-actions .replay-button:hover,.replay-control-btn:hover,.game-container .game-message a:hover,.mode-hub-btn:hover{background:" + t.buttonHoverBg + ";color:" + t.buttonText + ";}\n";

    css += ".replay-modal-content,.portal-card,.history-item,.mode-hub,.replay-controls-panel{background:" + t.surface + ";border-color:" + t.border + ";color:" + t.text + ";box-shadow:" + t.shadow + ";}\n";
    css += ".stats-panel-row{border-bottom-color:" + t.panelLine + ";color:" + t.text + ";}\n";
    css += ".replay-textarea,.settings-select,.portal-form input,.portal-inline-input,.portal-inline-select,.portal-api-input{background:" + t.surfaceSoft + ";border-color:" + t.border + ";color:" + t.text + ";}\n";
    css += ".theme-preview-grid,.final-board-grid{background:" + mixHex(t.gameBg, t.surface, 0.3) + ";}\n";
    css += ".final-board-cell,.final-board-cell-empty{background:" + t.gridCellBg + ";color:" + t.muted + ";}\n";
    css += ".portal-table th,.portal-table td{border-bottom-color:" + t.panelLine + ";color:" + t.text + ";}\n";
    css += "input[type=range]::-webkit-slider-runnable-track{background:" + mixHex(t.border, t.surface, 0.4) + ";}\n";
    css += "input[type=range]::-webkit-slider-thumb{background:" + colorForIndex(theme, 8, theme.colors.length) + ";}\n";

    if (theme.neon) {
      css += ".game-container,.top-action-btn,.restart-button,.mode-hub-btn,.portal-card,.history-item{box-shadow:0 0 0 1px " + rgba(t.border, 0.6) + ",0 0 18px " + rgba(colorForIndex(theme, 0, theme.colors.length), 0.22) + ",0 10px 28px rgba(6,8,18,0.52);}\n";
    }
    return css;
  }

  function buildThemeCss(theme) {
    var css = "";
    if (theme.neon) {
      css += "@keyframes themeNeonPulse{0%{filter:drop-shadow(0 0 4px rgba(255,255,255,0.24));}50%{filter:drop-shadow(0 0 14px rgba(255,255,255,0.95));}100%{filter:drop-shadow(0 0 4px rgba(255,255,255,0.24));}}\n";
      css += "@keyframes themeNeonFlow{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}\n";
    }
    css += pageCss(theme);
    css += tileCssForValues(theme, POW2_TILE_VALUES, "body:not([data-ruleset=\"fibonacci\"])");
    css += tileCssForValues(theme, FIB_TILE_VALUES, "body[data-ruleset=\"fibonacci\"]");
    css += timerCss(theme);
    css += legendCss(theme);
    return css;
  }

  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
    } catch (e) {
      return DEFAULT_THEME;
    }
  }

  function saveTheme(themeId) {
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
    } catch (e) {}
  }

  function ensureStyleTag() {
    var style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    return style;
  }

  var currentThemeId = DEFAULT_THEME;

  function applyTheme(themeId) {
    var id = themes[themeId] ? themeId : DEFAULT_THEME;
    var theme = themes[id];
    var style = ensureStyleTag();
    style.textContent = buildThemeCss(theme);
    currentThemeId = id;
    saveTheme(id);
    document.documentElement.setAttribute("data-theme", id);
    if (typeof window.CustomEvent === "function") {
      window.dispatchEvent(new CustomEvent("themechange", { detail: { themeId: id } }));
    }
  }

  function getThemes() {
    var list = [];
    for (var key in themes) {
      if (themes.hasOwnProperty(key)) {
        list.push({ id: themes[key].id, label: themes[key].label });
      }
    }
    return list;
  }

  window.ThemeManager = {
    getThemes: getThemes,
    getTileValues: function (ruleset) {
      if (ruleset === "fibonacci") return FIB_PREVIEW_VALUES.slice();
      return POW2_TILE_VALUES.slice();
    },
    getCurrentTheme: function () { return currentThemeId; },
    applyTheme: applyTheme
  };

  applyTheme(getSavedTheme());
})();
