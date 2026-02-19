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
      flashy: !!config.flashy,
      cyberpunk: !!config.cyberpunk,
      cyberpunk: !!config.cyberpunk,
      retro: !!config.retro,
      glass: !!config.glass,
      space: !!config.space,
      sakura: !!config.sakura,
      mecha: !!config.mecha,
      neumorphism: !!config.neumorphism,
      clay: !!config.clay,
      bauhaus: !!config.bauhaus,
      nordic: !!config.nordic,
      luxury: !!config.luxury,
      horse_year: !!config.horse_year,
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
        buttonBg: "#8f7a66",
        buttonText: "#fff",
        buttonHoverBg: "#7f6a56",
        buttonHoverText: "#fff"
      }
    }),
    ocean: makeTheme("ocean", "海洋之风", [
      "#e8f8ff", "#d1f1ff", "#b8e8ff", "#8fdcff",
      "#6accfb", "#4fb8ef", "#3ca3df", "#2f8fce",
      "#2a7bb9", "#2569a5", "#21588f", "#1c4878",
      "#173b64", "#133052", "#0f2642", "#0b1d34"
    ], {
      lightTextFrom: 5,
      gradient: true,
      neon: false,
      ocean: true,
      timer: {
        panelBg: "rgba(44, 94, 118, 0.8)",
        panelText: "#f3fbff",
        panelLabel: "#a8d8ea",
        cellBg: "rgba(216, 238, 249, 0.9)",
        cellText: "#2b4f61",
        cellShadow: "0 0 0 1px rgba(255,255,255,0.2) inset",
        buttonBg: "rgba(216, 238, 249, 0.9)",
        buttonText: "#2b4f61",
        buttonHoverBg: "#c8e6f4",
        buttonHoverText: "#1d3a49"
      }
    }),
    vaporwave: makeTheme("vaporwave", "蒸汽波", [
      "#ff71ce", "#01cdfe", "#05ffa1", "#b967ff",
      "#fffb96", "#ff71ce", "#01cdfe", "#05ffa1",
      "#b967ff", "#fffb96", "#ff71ce", "#01cdfe",
      "#05ffa1", "#b967ff", "#fffb96", "#ff71ce"
    ], {
      lightTextFrom: 0,
      gradient: true,
      neon: true,
      vaporwave: true,
      timer: {
        panelBg: "#2c2137",
        panelText: "#01cdfe",
        panelLabel: "#ff71ce",
        cellBg: "#1a1a2e",
        cellText: "#fffb96",
        cellShadow: "0 0 5px #b967ff",
        buttonBg: "linear-gradient(90deg, #ff71ce, #b967ff)",
        buttonText: "#fff",
        buttonHoverBg: "linear-gradient(90deg, #01cdfe, #05ffa1)",
        buttonHoverText: "#000"
      }
    }),
    matcha: makeTheme("matcha", "抹茶", [
      "#fafbf6", "#f1f8e9", "#dcedc8", "#c5e1a5",
      "#aed581", "#9ccc65", "#8bc34a", "#7cb342",
      "#689f38", "#558b2f", "#33691e", "#5d4037",
      "#6d4c41", "#795548", "#8d6e63", "#a1887f"
    ], {
      lightTextFrom: 7,
      gradient: false,
      neon: false,
      matcha: true,
      timer: {
        panelBg: "#6fa848",
        panelText: "#f7f8f0",
        panelLabel: "#d4e6c3",
        cellBg: "#e8f0e0",
        cellText: "#355c1e",
        cellShadow: "inset 0 0 2px rgba(0,0,0,0.1)",
        buttonBg: "#86c260",
        buttonText: "#fff",
        buttonHoverBg: "#6fa848",
        buttonHoverText: "#fff"
      }
    }),
    dracula: makeTheme("dracula", "吸血鬼", [
      "#282a36", "#44475a", "#f8f8f2", "#6272a4",
      "#8be9fd", "#50fa7b", "#ffb86c", "#ff79c6",
      "#bd93f9", "#ff5555", "#f1fa8c", "#282a36",
      "#44475a", "#bd93f9", "#ff79c6", "#ff5555"
    ], {
      lightTextFrom: 0,
      gradient: false,
      neon: false,
      dracula: true,
      timer: {
        panelBg: "#44475a",
        panelText: "#f8f8f2",
        panelLabel: "#bd93f9",
        cellBg: "#282a36",
        cellText: "#50fa7b",
        cellShadow: "0 0 0 1px #6272a4",
        buttonBg: "#44475a",
        buttonText: "#ff79c6",
        buttonHoverBg: "#6272a4",
        buttonHoverText: "#f8f8f2"
      }
    }),
    sunset: makeTheme("sunset", "日落", [
      "#ffe0b2", "#ffcc80", "#ffb74d", "#ffa726",
      "#ff9800", "#fb8c00", "#f57c00", "#ef6c00",
      "#e65100", "#d84315", "#bf360c", "#8e24aa",
      "#7b1fa2", "#6a1b9a", "#4a148c", "#311b92"
    ], {
      lightTextFrom: 5,
      gradient: true,
      neon: false,
      sunset: true,
      timer: {
        panelBg: "#bf360c",
        panelText: "#ffe0b2",
        panelLabel: "#ffcc80",
        cellBg: "#ffcc80",
        cellText: "#bf360c",
        cellShadow: "inset 0 0 5px rgba(0,0,0,0.2)",
        buttonBg: "linear-gradient(to right, #ff9800, #f57c00)",
        buttonText: "#fff",
        buttonHoverBg: "linear-gradient(to right, #e65100, #bf360c)",
        buttonHoverText: "#fff"
      }
    }),
    blueprint: makeTheme("blueprint", "蓝图", [
      "#e3f2fd", "#bbdefb", "#90caf9", "#64b5f6",
      "#42a5f5", "#2196f3", "#1e88e5", "#1976d2",
      "#1565c0", "#0d47a1", "#82b1ff", "#448aff",
      "#2979ff", "#2962ff", "#ffffff", "#e3f2fd"
    ], {
      lightTextFrom: 4,
      gradient: false,
      neon: false,
      blueprint: true,
      timer: {
        panelBg: "#0d47a1",
        panelText: "#ffffff",
        panelLabel: "#90caf9",
        cellBg: "#1565c0",
        cellText: "#ffffff",
        cellShadow: "none",
        buttonBg: "#1565c0",
        buttonText: "#ffffff",
        buttonHoverBg: "#0d47a1",
        buttonHoverText: "#ffffff"
      }
    }),
    candy: makeTheme("candy", "糖果", [
      "#ff9aa2", "#ffb7b2", "#ffdac1", "#e2f0cb",
      "#b5ead7", "#c7ceea", "#f8bbd0", "#f48fb1",
      "#f06292", "#ec407a", "#e91e63", "#d81b60",
      "#c2185b", "#ad1457", "#880e4f", "#ff80ab"
    ], {
      lightTextFrom: 0,
      gradient: false,
      neon: false,
      candy: true,
      timer: {
        panelBg: "#ffffff",
        panelText: "#ff9aa2",
        panelLabel: "#c7ceea",
        cellBg: "#ffdac1",
        cellText: "#ff6f61",
        cellShadow: "inset 0 0 10px rgba(0,0,0,0.05)",
        buttonBg: "#b5ead7",
        buttonText: "#fff",
        buttonHoverBg: "#ff9aa2",
        buttonHoverText: "#fff"
      }
    }),
    terminal: makeTheme("terminal", "终端", [
      "#000000", "#001100", "#002200", "#003300",
      "#004400", "#005500", "#006600", "#007700",
      "#008800", "#009900", "#00aa00", "#00bb00",
      "#00cc00", "#00dd00", "#00ee00", "#00ff00"
    ], {
      lightTextFrom: 0,
      gradient: false,
      neon: false,
      terminal: true,
      blackTiles: true,
      timer: {
        panelBg: "#000000",
        panelText: "#00ff00",
        panelLabel: "#00cc00",
        cellBg: "#001100",
        cellText: "#00ff00",
        cellShadow: "inset 0 0 0 1px #003300",
        buttonBg: "#000000",
        buttonText: "#00ff00",
        buttonHoverBg: "#002200",
        buttonHoverText: "#00ff00"
      }
    }),
    paper: makeTheme("paper", "纸张", [
      "#fdfbf7", "#f5f5dc", "#f0ead6", "#e8e0d5",
      "#dbd3c9", "#beb3a8", "#a89f91", "#8d857a",
      "#756d64", "#5e5750", "#4b453f", "#333333",
      "#2b2b2b", "#1a1a1a", "#000000", "#000000"
    ], {
      lightTextFrom: 8,
      gradient: false,
      neon: false,
      paper: true,
      timer: {
        panelBg: "#f0ead6",
        panelText: "#4b453f",
        panelLabel: "#8d857a",
        cellBg: "#f5f5dc",
        cellText: "#4b453f",
        cellShadow: "0 1px 2px rgba(0,0,0,0.1)",
        buttonBg: "#e8e0d5",
        buttonText: "#333",
        buttonHoverBg: "#dbd3c9",
        buttonHoverText: "#000"
      }
    }),
    coffee: makeTheme("coffee", "咖啡", [
      "#fff8e1", "#ffecb3", "#ffe082", "#ffd54f",
      "#ffca28", "#ffc107", "#ffb300", "#ffa000",
      "#ff8f00", "#ff6f00", "#3e2723", "#4e342e",
      "#5d4037", "#6d4c41", "#795548", "#8d6e63"
    ], {
      lightTextFrom: 10,
      gradient: false,
      neon: false,
      coffee: true,
      timer: {
        panelBg: "#3e2723",
        panelText: "#ffecb3",
        panelLabel: "#d7ccc8",
        cellBg: "#5d4037",
        cellText: "#ffecb3",
        cellShadow: "inset 0 0 5px rgba(0,0,0,0.3)",
        buttonBg: "#4e342e",
        buttonText: "#ffecb3",
        buttonHoverBg: "#5d4037",
        buttonHoverText: "#fff"
      }
    }),
    ink: makeTheme("ink", "水墨", [
      "#cfd8dc", "#b0bec5", "#90a4ae", "#78909c",
      "#546e7a", "#455a64", "#37474f", "#263238",
      "#b71c1c", "#c62828", "#d32f2f", "#e53935",
      "#f44336", "#ef5350", "#e57373", "#ef9a9a"
    ], {
      lightTextFrom: 4,
      gradient: false,
      neon: false,
      ink: true,
      timer: {
        panelBg: "#000000",
        panelText: "#ffffff",
        panelLabel: "#b0bec5",
        cellBg: "#212121",
        cellText: "#ffffff",
        cellShadow: "inset 0 0 5px rgba(255,255,255,0.2)",
        buttonBg: "#000000",
        buttonText: "#ffffff",
        buttonHoverBg: "#333",
        buttonHoverText: "#fff"
      }
    }),
    lava: makeTheme("lava", "岩浆", [
      "#3e2723", "#4e342e", "#5d4037", "#6d4c41",
      "#d84315", "#e64a19", "#f34607", "#ff5722",
      "#ff7043", "#ff8a65", "#ffab91", "#ffccbc",
      "#fff3e0", "#ffffff", "#ffd700", "#ffff00"
    ], {
      lightTextFrom: 4,
      gradient: true,
      neon: false,
      lava: true,
      blackTiles: true,
      timer: {
        panelBg: "#212121",
        panelText: "#ff5722",
        panelLabel: "#ffab91",
        cellBg: "#3e2723",
        cellText: "#ff5722",
        cellShadow: "inset 0 0 10px #d84315, 0 0 5px #d84315",
        buttonBg: "#d84315",
        buttonText: "#212121",
        buttonHoverBg: "#e64a19",
        buttonHoverText: "#000"
      }
    }),
    chalkboard: makeTheme("chalkboard", "黑板", [
      "#ffffff", "#f0f0f0", "#e0e0e0", "#d0d0d0",
      "#fff9c4", "#fff59d", "#fff176", "#ffee58",
      "#ffeb3b", "#fdd835", "#fbc02d", "#f9a825",
      "#fbc02d", "#ffa000", "#ff6f00", "#e65100"
    ], {
      lightTextFrom: 0,
      gradient: false,
      neon: false,
      chalkboard: true,
      timer: {
        panelBg: "#2e7d32",
        panelText: "#ffffff",
        panelLabel: "#a5d6a7",
        cellBg: "#1b5e20",
        cellText: "#ffffff",
        cellShadow: "inset 0 0 2px rgba(255,255,255,0.3)",
        buttonBg: "#1b5e20",
        buttonText: "#ffffff",
        buttonHoverBg: "#2e7d32",
        buttonHoverText: "#fff"
      }
    }),
    comic: makeTheme("comic", "美漫", [
      "#ffffff", "#e0f7fa", "#b2ebf2", "#80deea",
      "#4dd0e1", "#26c6da", "#00bcd4", "#00acc1",
      "#0097a7", "#00838f", "#006064", "#ffeb3b",
      "#fdd835", "#fbc02d", "#f9a825", "#f57f17"
    ], {
      lightTextFrom: 6,
      gradient: false,
      neon: false,
      comic: true,
      timer: {
        panelBg: "#000000",
        panelText: "#ffeb3b",
        panelLabel: "#ffffff",
        cellBg: "#00bcd4",
        cellText: "#000000",
        cellShadow: "4px 4px 0 #000",
        buttonBg: "#ffeb3b",
        buttonText: "#000",
        buttonHoverBg: "#fdd835",
        buttonHoverText: "#000"
      }
    }),
    leather: makeTheme("leather", "皮革", [
      "#d7ccc8", "#bcaaa4", "#a1887f", "#8d6e63",
      "#795548", "#6d4c41", "#5d4037", "#4e342e",
      "#3e2723", "#5d4037", "#795548", "#8d6e63",
      "#a1887f", "#bcaaa4", "#d7ccc8", "#efebe9"
    ], {
      lightTextFrom: 4,
      gradient: false,
      neon: false,
      leather: true,
      timer: {
        panelBg: "#3e2723",
        panelText: "#d7ccc8",
        panelLabel: "#a1887f",
        cellBg: "#5d4037",
        cellText: "#ffecb3",
        cellShadow: "inset 2px 2px 5px rgba(0,0,0,0.5), inset -1px -1px 0 rgba(255,255,255,0.1)",
        buttonBg: "#5d4037",
        buttonText: "#ffecb3",
        buttonHoverBg: "#6d4c41",
        buttonHoverText: "#fff"
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
    neon_flux: makeTheme("neon_flux", "动态霓虹", [
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
    neon_black: makeTheme("neon_black", "炫彩闪烁", [
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
    }),
    cyberpunk: makeTheme("cyberpunk", "赛博朋克", [
      "#00f0ff", "#00ff9f", "#e400ff", "#ff0055",
      "#ffff00", "#001eff", "#bd00ff", "#ffae00",
      "#00ffff", "#ff0099", "#7df9ff", "#bf00ff",
      "#ff003c", "#ccff00", "#00ccff", "#ff007f"
    ], {
      lightTextFrom: 0,
      gradient: true,
      neon: true,
      blackTiles: true,
      flashy: true,
      cyberpunk: true,
      timer: {
        panelBg: "#050505",
        panelText: "#00f0ff",
        panelLabel: "#ff0055",
        cellBg: "#0a0a0a",
        cellText: "#00ff9f",
        cellShadow: "0 0 4px 1px rgba(0, 240, 255, 0.3) inset, 0 0 10px 2px rgba(228, 0, 255, 0.1)",
        buttonBg: "#000000",
        buttonText: "#00f0ff",
        buttonHoverBg: "#111",
        buttonHoverText: "#fff"
      }
    }),
    retro: makeTheme("retro", "复古像素", [
      "#0f380f", "#306230", "#8bac0f", "#9bbc0f",
      "#0f380f", "#306230", "#8bac0f", "#9bbc0f",
      "#0f380f", "#306230", "#8bac0f", "#9bbc0f",
      "#0f380f", "#306230", "#8bac0f", "#9bbc0f"
    ], {
      lightTextFrom: 0, // All text logic specific to retro
      gradient: false,
      neon: false,
      retro: true,
      timer: {
        panelBg: "#8bac0f",
        panelText: "#0f380f",
        panelLabel: "#0f380f",
        cellBg: "#9bbc0f",
        cellText: "#0f380f",
        cellShadow: "none",
        buttonBg: "#8bac0f",
        buttonText: "#0f380f",
        buttonHoverBg: "#9bbc0f",
        buttonHoverText: "#0f380f"
      }
    }),
    glass: makeTheme("glass", "磨砂玻璃", [
      "#ffe0e9", "#ffe0e9", "#e0f7fa", "#e1bee7",
      "#ffcdd2", "#f8bbd0", "#e1bee7", "#d1c4e9",
      "#c5cae9", "#b3e5fc", "#b2dfdb", "#c8e6c9",
      "#dcedc8", "#fff9c4", "#ffe0b2", "#ffccbc"
    ], {
      lightTextFrom: 6,
      gradient: true,
      neon: false,
      glass: true,
      timer: {
        panelBg: "rgba(255, 255, 255, 0.2)",
        panelText: "#333",
        panelLabel: "#555",
        cellBg: "rgba(255, 255, 255, 0.3)",
        cellText: "#333",
        cellShadow: "0 4px 6px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.4)",
        buttonBg: "rgba(255, 255, 255, 0.3)",
        buttonText: "#333",
        buttonHoverBg: "rgba(255, 255, 255, 0.45)",
        buttonHoverText: "#000"
      }
    }),
    space: makeTheme("space", "深邃太空", [
      "#cfd8dc", "#b0bec5", "#90a4ae", "#78909c",
      "#37474f", "#263238", "#cfd8dc", "#b0bec5",
      "#546e7a", "#455a64", "#37474f", "#263238",
      "#102027", "#000a12", "#eceff1", "#ffffff"
    ], {
      lightTextFrom: 4,
      gradient: true,
      neon: true,
      space: true,
      blackTiles: true,
      timer: {
        panelBg: "#102027",
        panelText: "#eceff1",
        panelLabel: "#b0bec5",
        cellBg: "#263238",
        cellText: "#eceff1",
        cellShadow: "0 0 10px 2px rgba(255, 255, 255, 0.1)",
        buttonBg: "#263238",
        buttonText: "#eceff1",
        buttonHoverBg: "#37474f",
        buttonHoverText: "#ffffff"
      }
    }),
    sakura: makeTheme("sakura", "樱花漫舞", [
      "#ffebee", "#ffcdd2", "#ef9a9a", "#e57373",
      "#ef5350", "#f44336", "#e53935", "#d32f2f",
      "#c62828", "#b71c1c", "#ff8a80", "#ff5252",
      "#ff1744", "#d50000", "#f8bbd0", "#f48fb1"
    ], {
      lightTextFrom: 2,
      gradient: true,
      neon: false,
      sakura: true,
      timer: {
        panelBg: "#f8bbd0",
        panelText: "#880e4f",
        panelLabel: "#c2185b",
        cellBg: "#fce4ec",
        cellText: "#880e4f",
        cellShadow: "0 2px 5px rgba(0,0,0,0.05), inset 0 0 0 1px #f48fb1",
        buttonBg: "#f8bbd0",
        buttonText: "#880e4f",
        buttonHoverBg: "#f48fb1",
        buttonHoverText: "#880e4f"
      }
    }),
    mecha: makeTheme("mecha", "机械装甲", [
      "#cfd8dc", "#b0bec5", "#ffcc80", "#ffb74d",
      "#ffa726", "#ff9800", "#fb8c00", "#f57c00",
      "#ef6c00", "#e65100", "#ffd600", "#ffea00",
      "#ffff00", "#ff3d00", "#dd2c00", "#bf360c"
    ], {
      lightTextFrom: 4,
      gradient: true,
      neon: false,
      mecha: true,
      blackTiles: true,
      timer: {
        panelBg: "#263238",
        panelText: "#ffab00",
        panelLabel: "#ffcc80",
        cellBg: "#37474f",
        cellText: "#ffab00",
        cellShadow: "inset 0 0 5px #000",
        buttonBg: "#263238",
        buttonText: "#ffab00",
        buttonHoverBg: "#37474f",
        buttonHoverText: "#ffd740"
      }
    }),
    neumorphism: makeTheme("neumorphism", "新拟态", [
      "#e0e5ec", "#e0e5ec", "#e0e5ec", "#e0e5ec",
      "#e0e5ec", "#e0e5ec", "#e0e5ec", "#e0e5ec",
      "#e0e5ec", "#e0e5ec", "#e0e5ec", "#e0e5ec",
      "#e0e5ec", "#e0e5ec", "#e0e5ec", "#e0e5ec"
    ], {
      lightTextFrom: 16, // Always dark text
      gradient: false,
      neon: false,
      neumorphism: true,
      timer: {
        panelBg: "#e0e5ec",
        panelText: "#4d5b6b",
        panelLabel: "#4d5b6b",
        cellBg: "#e0e5ec",
        cellText: "#4d5b6b",
        cellShadow: "inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff",
        buttonBg: "#e0e5ec",
        buttonText: "#4d5b6b",
        buttonHoverBg: "#e0e5ec",
        buttonHoverText: "#4d5b6b"
      }
    }),
    clay: makeTheme("clay", "黏土拟态", [
      "#ff8a80", "#ff80ab", "#ea80fc", "#b388ff",
      "#8c9eff", "#82b1ff", "#80d8ff", "#84ffff",
      "#a7ffeb", "#b9f6ca", "#ccff90", "#f4ff81",
      "#ffe57f", "#ffd180", "#ff9e80", "#ff6e40"
    ], {
      lightTextFrom: 0,
      gradient: false,
      neon: false,
      clay: true,
      timer: {
        panelBg: "#ffffff",
        panelText: "#333",
        panelLabel: "#666",
        cellBg: "#f0f0f3",
        cellText: "#333",
        cellShadow: "inset 6px 6px 12px #d1d9e6, inset -6px -6px 12px #ffffff",
        buttonBg: "#ffffff",
        buttonText: "#333",
        buttonHoverBg: "#f8f9fa",
        buttonHoverText: "#000"
      }
    }),
    bauhaus: makeTheme("bauhaus", "包豪斯", [
      "#E4002B", "#FFD700", "#0057B7", "#000000",
      "#E4002B", "#FFD700", "#0057B7", "#000000",
      "#E4002B", "#FFD700", "#0057B7", "#000000",
      "#ffffff", "#000000", "#E4002B", "#0057B7"
    ], {
      lightTextFrom: 0,
      gradient: false,
      neon: false,
      bauhaus: true,
      timer: {
        panelBg: "#000000",
        panelText: "#ffffff",
        panelLabel: "#FFD700",
        cellBg: "#E4002B",
        cellText: "#ffffff",
        cellShadow: "4px 4px 0 #0057B7",
        buttonBg: "#0057B7",
        buttonText: "#ffffff",
        buttonHoverBg: "#003d80",
        buttonHoverText: "#ffffff"
      }
    }),
    nordic: makeTheme("nordic", "北欧冰霜", [
      "#eceff1", "#cfd8dc", "#b0bec5", "#90a4ae",
      "#78909c", "#607d8b", "#546e7a", "#455a64",
      "#37474f", "#263238", "#dbeff3", "#b2ebf2",
      "#80deea", "#4dd0e1", "#26c6da", "#00bcd4"
    ], {
      lightTextFrom: 4,
      gradient: false,
      neon: false,
      nordic: true,
      timer: {
        panelBg: "#eceff1",
        panelText: "#37474f",
        panelLabel: "#78909c",
        cellBg: "#dbeff3",
        cellText: "#37474f",
        cellShadow: "0 1px 3px rgba(0,0,0,0.08)",
        buttonBg: "#dbeff3",
        buttonText: "#37474f",
        buttonHoverBg: "#b2ebf2",
        buttonHoverText: "#263238"
      }
    }),
    luxury: makeTheme("luxury", "黑金奢华", [
      "#1a1a1a", "#1a1a1a", "#262626", "#333333",
      "#d4af37", "#c5a028", "#b69121", "#a6821a",
      "#e5c15b", "#f2d378", "#ffeaa0", "#fff2c2",
      "#ffffff", "#000000", "#d4af37", "#000000"
    ], {
      lightTextFrom: 4,
      gradient: true,
      neon: false,
      luxury: true,
      timer: {
        panelBg: "#1a1a1a",
        panelText: "#d4af37",
        panelLabel: "#887020",
        cellBg: "#262626",
        cellText: "#d4af37",
        cellShadow: "inset 0 0 10px #000, 0 0 0 1px #d4af37",
        buttonBg: "#1a1a1a",
        buttonText: "#d4af37",
        buttonHoverBg: "#262626",
        buttonHoverText: "#f2d378"
      }
    }),
    horse_year: makeTheme("horse_year", "马年大吉", [
      "#F9F7F4", "#FFF59D", "#FFCC80", "#FFA726",
      "#FF7043", "#EF5350", "#E53935", "#C62828",
      "#8E24AA", "#6A1B9A", "#FDD835", "#4E342E",
      "#3E2723", "#212121", "#000000", "#000000"
    ], {
      lightTextFrom: 4,
      gradient: true,
      neon: false,
      horse_year: true,
      timer: {
        panelBg: "#5e0d16",
        panelText: "#ffd700",
        panelLabel: "#ffcc80",
        cellBg: "#7a0c1e",
        cellText: "#ffd700",
        cellShadow: "inset 0 0 5px rgba(0,0,0,0.5), 0 0 0 1px #b71c1c",
        buttonBg: "#b71c1c",
        buttonText: "#ffd700",
        buttonHoverBg: "#d32f2f",
        buttonHoverText: "#fff"
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
    
    // Icon styles - general alignment
    css += ".top-action-btn svg, .restart-button svg { width: 28px; height: 28px; vertical-align: middle; }\n";
    css += ".top-action-btn, .restart-button { display: inline-flex !important; justify-content: center; align-items: center; padding: 0 !important; width: 50px !important; height: 50px !important; min-width: 50px !important; border-radius: 12px !important; }\n";


    css += ".replay-modal-content,.portal-card,.history-item,.mode-hub,.replay-controls-panel{background:" + t.surface + ";border-color:" + t.border + ";color:" + t.text + ";box-shadow:" + t.shadow + ";}\n";
    css += ".stats-panel-row{border-bottom-color:" + t.panelLine + ";color:" + t.text + ";}\n";
    css += ".replay-textarea,.settings-select,.portal-form input,.portal-inline-input,.portal-inline-select,.portal-api-input{background:" + t.surfaceSoft + ";border-color:" + t.border + ";color:" + t.text + ";}\n";
    css += "#timerbox .timerbox-leaderboard-header{background:" + t.surface + ";color:" + t.text + ";border:1px solid " + rgba(t.border, 0.55) + ";box-shadow:" + t.shadow + ";}\n";
    css += "#timerbox .timerbox-leaderboard-title{color:" + t.text + ";}\n";
    css += "#timerbox .timerbox-leaderboard-rank{background:" + mixHex(t.surfaceSoft, t.buttonBg, 0.46) + ";color:" + t.text + ";box-shadow:inset 0 0 0 1px " + rgba(t.border, 0.46) + ";}\n";
    css += "#timerbox .timerbox-leaderboard-rank.timerbox-leaderboard-rank-top1{background:" + colorForIndex(theme, 10, theme.colors.length) + ";color:" + tileTextColor(10, theme.lightTextFrom) + ";}\n";
    css += "#timerbox .timerbox-leaderboard-rank.timerbox-leaderboard-rank-top2{background:" + colorForIndex(theme, 8, theme.colors.length) + ";color:" + tileTextColor(8, theme.lightTextFrom) + ";}\n";
    css += "#timerbox .timerbox-leaderboard-rank.timerbox-leaderboard-rank-top3{background:" + colorForIndex(theme, 6, theme.colors.length) + ";color:" + tileTextColor(6, theme.lightTextFrom) + ";}\n";
    css += "#timerbox .timerbox-leaderboard-entry{background:" + t.surfaceSoft + ";color:" + t.text + ";box-shadow:inset 0 0 0 1px " + rgba(t.border, 0.4) + ";}\n";
    css += "#timerbox .timerbox-leaderboard-row.is-self .timerbox-leaderboard-entry{color:" + colorForIndex(theme, 0, theme.colors.length) + ";}\n";
    css += "#timerbox .timerbox-leaderboard-empty{background:" + t.surfaceSoft + ";color:" + t.muted + ";border:1px solid " + rgba(t.border, 0.42) + ";}\n";
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
    if (theme.id === "classic") {
      // Authentic 2048 looks
      css += "html, body { background: #faf8ef !important; color: #776e65 !important; }\n";
      css += ".game-container { background: #bbada0 !important; border-radius: 6px !important; border: none !important; box-shadow: none !important; }\n";
      css += ".grid-cell { background: #cdc1b4 !important; box-shadow: none !important; border-radius: 3px !important; }\n";
      css += ".tile .tile-inner { border-radius: 3px !important; box-shadow: none !important; font-weight: bold !important; text-shadow: none !important; }\n";
      css += "h1.title { color: #776e65 !important; font-family: 'Clear Sans', 'Helvetica Neue', Arial, sans-serif !important; font-weight: 700 !important; }\n";
      css += "p, .game-intro, .game-explanation { color: #776e65 !important; font-family: 'Clear Sans', 'Helvetica Neue', Arial, sans-serif !important; }\n";
      css += ".score-container, .best-container { background: #bbada0 !important; color: #f9f6f2 !important; box-shadow: none !important; border-radius: 3px !important; }\n";
      css += ".score-container:after, .best-container:after { color: #eee4da !important; opacity: 0.7; }\n";
      css += ".restart-button { background: #8f7a66 !important; color: #f9f6f2 !important; border-radius: 3px !important; box-shadow: none !important; font-weight: bold; }\n";
      css += "a { color: #8f7a66 !important; font-weight: bold; text-shadow: none !important; }\n";
      css += ".mode-hub-btn { color: #f9f6f2 !important; }\n";
      css += ".mode-hub-btn:hover { color: #f9f6f2 !important; }\n";
      css += ".top-action-btn { background: #8f7a66 !important; color: #f9f6f2 !important; border-radius: 3px !important; box-shadow: none !important; }\n";
    }
    if (theme.neon) {
      css += "@keyframes themeNeonPulse{0%{filter:drop-shadow(0 0 4px rgba(255,255,255,0.24));}50%{filter:drop-shadow(0 0 14px rgba(255,255,255,0.95));}100%{filter:drop-shadow(0 0 4px rgba(255,255,255,0.24));}}\n";
      css += "@keyframes themeNeonFlow{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}\n";
    }
    if (theme.cyberpunk) {
      css += "@keyframes cyberpunkBgMove { 0% { background-position: 0 0; } 100% { background-position: 40px 40px; } }\n";
      css += "@keyframes cyberpunkGlow { 0% { box-shadow: 0 0 5px #00f0ff, 0 0 10px #00f0ff, 0 0 20px #00f0ff; } 50% { box-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff; } 100% { box-shadow: 0 0 5px #00f0ff, 0 0 10px #00f0ff, 0 0 20px #00f0ff; } }\n";
      
      // Cyberpunk specific page overrides
      css += "html,body{background-color: #030303 !important; background-image: linear-gradient(#111 2px, transparent 2px), linear-gradient(90deg, #111 2px, transparent 2px), linear-gradient(rgba(0,240,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,255,0.1) 1px, transparent 1px) !important; background-size: 100px 100px, 100px 100px, 20px 20px, 20px 20px !important; background-position: -2px -2px, -2px -2px, -1px -1px, -1px -1px !important; animation: cyberpunkBgMove 20s linear infinite;}\n";
      css += ".game-container{border: 2px solid #00f0ff; box-shadow: 0 0 20px rgba(0,240,255,0.4), inset 0 0 40px rgba(0,240,255,0.1) !important; background: rgba(0,0,0,0.8) !important;}\n";
      css += ".grid-cell{background: rgba(0, 255, 159, 0.1) !important; box-shadow: 0 0 0 1px rgba(0, 255, 159, 0.2);}\n";
      css += ".title{text-shadow: 4px 4px 0px #ff00ff, -2px -2px 0px #00f0ff; color: #fff !important;}\n";
      css += ".score-container, .best-container{background: #000 !important; border: 1px solid #ff00ff; box-shadow: 0 0 10px rgba(255,0,255,0.3) !important; color: #fff !important;}\n";
      css += ".score-container:after, .best-container:after{color: #00f0ff !important;}\n";
      css += ".score-container .score-addition, .best-container .score-addition{color: #00ff9f !important; text-shadow: 0 0 5px #00ff9f;}\n";
      css += "a{color: #00f0ff !important; text-decoration: none; text-shadow: 0 0 4px rgba(0,240,255,0.8);}\n";
    }
    if (theme.retro) {
       css += "@keyframes scanline { 0% { background-position: 0 -100vh; } 100% { background-position: 0 100vh; } }\n";
       css += "@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }\n";
       
       css += "html, body { background: #0f380f !important; color: #9bbc0f !important; font-family: 'Courier New', Courier, monospace !important; }\n";
       css += ".game-container { background: #0f380f !important; border: 4px solid #9bbc0f !important; box-shadow: none !important; border-radius: 0 !important; }\n";
       css += ".grid-cell { background: #306230 !important; box-shadow: 0 0 0 2px #0f380f !important; border-radius: 0 !important; border: none !important; }\n";
       css += ".tile .tile-inner { border-radius: 0 !important; background: #9bbc0f !important; color: #0f380f !important; box-shadow: inset 0 0 0 2px #0f380f !important; border: none !important; font-family: 'Courier New', Courier, monospace !important; font-weight: bold !important; }\n";
       css += ".tile-2 .tile-inner, .tile-4 .tile-inner { background: #9bbc0f !important; color: #0f380f !important; }\n";
       css += ".tile-8 .tile-inner, .tile-16 .tile-inner { background: #8bac0f !important; color: #0f380f !important; }\n";
       css += ".tile-32 .tile-inner, .tile-64 .tile-inner { background: #306230 !important; color: #9bbc0f !important; box-shadow: inset 0 0 0 2px #9bbc0f !important; }\n";
       css += ".tile-128 .tile-inner, .tile-256 .tile-inner, .tile-512 .tile-inner { background: #0f380f !important; color: #9bbc0f !important; box-shadow: inset 0 0 0 2px #9bbc0f !important; }\n";
       css += ".tile-1024 .tile-inner, .tile-2048 .tile-inner { background: #0f380f !important; color: #9bbc0f !important; box-shadow: inset 0 0 0 4px #9bbc0f !important; }\n";
       
       css += "h1.title { color: #9bbc0f !important; text-transform: uppercase; letter-spacing: 2px; }\n";
       css += ".game-intro, .game-explanation, p { color: #8bac0f !important; font-family: 'Courier New', Courier, monospace !important; }\n";
       css += ".score-container, .best-container { background: #306230 !important; color: #9bbc0f !important; border: 2px solid #9bbc0f !important; border-radius: 0 !important; box-shadow: none !important; }\n";
       css += ".score-container:after, .best-container:after { color: #8bac0f !important; }\n";
       css += ".restart-button, .game-message a { background: #9bbc0f !important; color: #0f380f !important; border: 2px solid #306230 !important; border-radius: 0 !important; box-shadow: 4px 4px 0px #306230 !important; font-family: 'Courier New', Courier, monospace !important; text-transform: uppercase; }\n";
       css += ".restart-button:hover, .game-message a:hover { background: #8bac0f !important; transform: translate(2px, 2px); box-shadow: 2px 2px 0px #306230 !important; }\n";
       
       css += "body:after { content: ' '; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); background-size: 100% 2px, 3px 100%; pointer-events: none; z-index: 999; }\n";
    }
    if (theme.glass) {
      css += "@keyframes float { 0% { transform: translate(0, 0) rotate(0deg); } 33% { transform: translate(30px, -50px) rotate(10deg); } 66% { transform: translate(-20px, 20px) rotate(-5deg); } 100% { transform: translate(0, 0) rotate(0deg); } }\n";
      
      css += "html { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%) !important; } body { background: transparent !important; overflow-x: hidden; }\n";
      // Add floating blobs via pseudo-elements on body
      css += "body:before { content: ''; position: fixed; top: -10%; left: -10%; width: 50vw; height: 50vw; background: linear-gradient(180deg, #ffc0cb 0%, #ff69b4 100%); border-radius: 50%; filter: blur(80px); opacity: 0.4; animation: float 15s ease-in-out infinite; z-index: -1; }\n";
      css += "body:after { content: ''; position: fixed; bottom: -10%; right: -10%; width: 60vw; height: 60vw; background: linear-gradient(180deg, #87cefa 0%, #00bfff 100%); border-radius: 50%; filter: blur(90px); opacity: 0.4; animation: float 20s ease-in-out infinite reverse; z-index: -1; }\n";
      
      css += ".game-container { background: rgba(255, 255, 255, 0.25) !important; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.5); box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15) !important; border-radius: 16px !important; }\n";
      css += ".grid-cell { background: rgba(255, 255, 255, 0.3) !important; border-radius: 12px !important; box-shadow: inset 0 0 10px rgba(255,255,255,0.2) !important; }\n";
      
      css += ".tile .tile-inner { border-radius: 12px !important; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.4) !important; box-shadow: 0 4px 6px rgba(0,0,0,0.05) !important; }\n";
      // Ensure text is readable on light glass tiles
      css += ".tile .tile-inner { color: #555 !important; font-weight: 600 !important; }\n";
      css += ".tile-2 .tile-inner, .tile-4 .tile-inner { background: rgba(255, 255, 255, 0.4) !important; }\n";
      css += ".tile-8 .tile-inner, .tile-16 .tile-inner { background: rgba(255, 224, 189, 0.5) !important; }\n";
      css += ".tile-32 .tile-inner, .tile-64 .tile-inner { background: rgba(255, 204, 188, 0.5) !important; }\n";
      css += ".tile-128 .tile-inner, .tile-256 .tile-inner { background: rgba(255, 249, 196, 0.5) !important; }\n";
      css += ".tile-512 .tile-inner, .tile-1024 .tile-inner { background: rgba(200, 230, 201, 0.6) !important; }\n";
      css += ".tile-2048 .tile-inner { background: rgba(179, 229, 252, 0.6) !important; box-shadow: 0 0 15px rgba(0, 191, 255, 0.3) !important; }\n";
      
      css += "h1.title, h2, h3, p, .game-intro, .game-explanation { color: #444 !important; text-shadow: 0 1px 1px rgba(255,255,255,0.8); }\n";
      css += ".score-container, .best-container { background: rgba(255, 255, 255, 0.3) !important; backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.6); color: #333 !important; border-radius: 10px !important; box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important; }\n";
      css += ".score-container:after, .best-container:after { color: #666 !important; }\n";
      css += ".score-container .score-addition, .best-container .score-addition { color: #333 !important; }\n";
      
      css += ".restart-button, .game-message a { background: rgba(255, 255, 255, 0.35) !important; backdrop-filter: blur(5px); color: #333 !important; border: 1px solid rgba(255,255,255,0.6); border-radius: 8px !important; box-shadow: 0 4px 6px rgba(0,0,0,0.05) !important; }\n";
      css += ".restart-button:hover, .game-message a:hover { background: rgba(255, 255, 255, 0.55) !important; transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.1) !important; }\n";
    }
    if (theme.space) {
       css += "@keyframes twinkling { 0% { opacity: 0; transform: scale(0.5); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0; transform: scale(0.5); } }\n";
       css += "@keyframes warp { 0% { transform: scale(1); opacity: 0; } 50% { opacity: 0.5; } 100% { transform: scale(3); opacity: 0; } }\n";
       
       css += "html { background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%) !important; } body { background: transparent !important; overflow: hidden; }\n";
       // Stars
       css += "body:before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: transparent; box-shadow: 124px 235px #FFF, 532px 123px #FFF, 843px 432px #FFF, 234px 843px #FFF, 123px 432px #FFF, 654px 123px #FFF, 893px 645px #FFF; animation: twinkling 10s linear infinite; z-index: -2; opacity: 0.5; }\n";
       css += "body:after { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: transparent; box-shadow: 345px 654px #FFF, 123px 512px #263238, 765px 234px #FFF, 342px 765px #FFF; animation: twinkling 7s linear infinite reverse; z-index: -2; opacity: 0.3; transform: scale(0.8); }\n";
       
       css += ".game-container { background: rgba(16, 32, 39, 0.85) !important; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 0 20px rgba(0,0,0,0.8), inset 0 0 50px rgba(0,0,0,0.5) !important; }\n";
       css += ".grid-cell { background: rgba(255, 255, 255, 0.05) !important; border-radius: 50% !important; box-shadow: inset 0 0 10px rgba(0,0,0,0.8) !important; }\n";
       css += ".tile .tile-inner { border-radius: 50% !important; box-shadow: inset -4px -4px 10px rgba(0,0,0,0.5), 0 0 10px rgba(255,255,255,0.2) !important; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent) !important; }\n";
       
       // Planet-like tiles
       css += ".tile-2 .tile-inner { background-color: #cfd8dc !important; }\n";
       css += ".tile-4 .tile-inner { background-color: #b0bec5 !important; }\n";
       css += ".tile-8 .tile-inner { background-color: #90a4ae !important; }\n";
       css += ".tile-16 .tile-inner { background-color: #78909c !important; box-shadow: 0 0 10px #78909c !important; }\n";
       css += ".tile-32 .tile-inner { background-color: #546e7a !important; box-shadow: 0 0 15px #546e7a !important; }\n";
       css += ".tile-64 .tile-inner { background-color: #455a64 !important; box-shadow: 0 0 20px #455a64 !important; }\n";
       css += ".tile-128 .tile-inner, .tile-256 .tile-inner { background-color: #37474f !important; box-shadow: 0 0 25px rgba(255,255,255,0.4) !important; }\n";
       css += ".tile-512 .tile-inner, .tile-1024 .tile-inner { background-color: #263238 !important; box-shadow: 0 0 30px rgba(255,255,255,0.6) !important; }\n";
       css += ".tile-2048 .tile-inner { background-color: #000 !important; border: 1px solid #fff; box-shadow: 0 0 40px #fff, inset 0 0 20px #fff !important; }\n";

       css += "h1.title { color: #eceff1 !important; text-shadow: 0 0 10px rgba(255,255,255,0.5); }\n";
       css += "p, .game-intro, .game-explanation { color: #b0bec5 !important; }\n";
       css += ".score-container, .best-container { background: rgba(38, 50, 56, 0.8) !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 0 15px rgba(255,255,255,0.1) !important; }\n";
       css += ".restart-button, .game-message a { background: linear-gradient(to bottom, #37474f, #263238) !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 0 10px rgba(255,255,255,0.1) !important; }\n";
    }
    if (theme.sakura) {
       css += "@keyframes fall { 0% { opacity: 1; top: -10%; transform: translateX(20px) rotate(0deg); } 20% { opacity: 0.8; transform: translateX(-20px) rotate(45deg); } 40% { transform: translateX(-20px) rotate(90deg); } 60% { transform: translateX(20px) rotate(180deg); } 100% { opacity: 0; top: 110%; transform: translateX(-20px) rotate(225deg); } }\n";
       
       css += "html { background: linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%) !important; } body { background: transparent !important; position: relative; overflow-x: hidden; }\n";
       // Petals
       css += "body:before { content: ''; position: fixed; top: -10%; left: 20%; width: 15px; height: 15px; background: #ffcdd2; border-radius: 15px 0 15px 0; animation: fall 10s linear infinite; z-index: -1; }\n";
       css += "body:after { content: ''; position: fixed; top: -10%; left: 80%; width: 10px; height: 10px; background: #ef9a9a; border-radius: 10px 0 10px 0; animation: fall 7s linear infinite 2s; z-index: -1; }\n";
       
       css += ".game-container { background: rgba(255, 255, 255, 0.6) !important; border: 2px solid #f48fb1; border-radius: 20px !important; box-shadow: 0 10px 30px rgba(233, 30, 99, 0.15) !important; }\n";
       css += ".grid-cell { background: rgba(244, 143, 177, 0.15) !important; border-radius: 15px !important; }\n";
       css += ".tile .tile-inner { border-radius: 15px !important; font-family: 'Georgia', serif !important; box-shadow: 0 4px 6px rgba(0,0,0,0.05) !important; }\n";
       
       css += ".tile-2 .tile-inner { background: #ffebee !important; color: #d81b60 !important; }\n";
       css += ".tile-4 .tile-inner { background: #ffcdd2 !important; color: #c2185b !important; }\n";
       css += ".tile-8 .tile-inner { background: #ef9a9a !important; color: #fff !important; }\n";
       css += ".tile-16 .tile-inner { background: #e57373 !important; color: #fff !important; }\n";
       css += ".tile-32 .tile-inner { background: #ef5350 !important; color: #fff !important; }\n";
       css += ".tile-64 .tile-inner { background: #f44336 !important; color: #fff !important; }\n";
       css += ".tile-128 .tile-inner, .tile-256 .tile-inner { background: #e53935 !important; color: #fff !important; box-shadow: 0 0 10px rgba(229, 57, 53, 0.4) !important; }\n";
       css += ".tile-512 .tile-inner, .tile-1024 .tile-inner { background: #d32f2f !important; color: #fff !important; box-shadow: 0 0 15px rgba(211, 47, 47, 0.5) !important; }\n";
       css += ".tile-2048 .tile-inner { background: #c62828 !important; color: #fff !important; box-shadow: 0 0 20px rgba(198, 40, 40, 0.6) !important; }\n";
       
       css += "h1.title { color: #d81b60 !important; font-family: 'Georgia', serif !important; font-style: italic; }\n";
       css += "p, .game-intro, .game-explanation { color: #880e4f !important; font-family: 'Georgia', serif !important; }\n";
       css += ".score-container, .best-container { background: #fff !important; border: 1px solid #f48fb1; color: #d81b60 !important; border-radius: 15px !important; box-shadow: 0 4px 10px rgba(233, 30, 99, 0.1) !important; }\n";
       css += ".score-container:after, .best-container:after { color: #ec407a !important; text-transform: none !important; font-family: 'Georgia', serif !important; font-style: italic; }\n";
       css += ".restart-button, .game-message a { background: #f8bbd0 !important; color: #880e4f !important; border-radius: 20px !important; box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important; font-family: 'Georgia', serif !important; border: 1px solid #fff; }\n";
       css += ".restart-button:hover, .game-message a:hover { background: #f48fb1 !important; color: #fff !important; transform: scale(1.05); }\n";
    }
    if (theme.mecha) {
       css += "@keyframes pulse-warning { 0% { box-shadow: 0 0 0 rgba(255, 152, 0, 0); } 50% { box-shadow: 0 0 10px rgba(255, 152, 0, 0.8); } 100% { box-shadow: 0 0 0 rgba(255, 152, 0, 0); } }\n";
       css += "@keyframes slide-panel { 0% { background-position: 0 0; } 100% { background-position: 50px 50px; } }\n";
       
       css += "html { background: #263238 !important; } body { background: transparent !important; color: #cfd8dc !important; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important; overflow-x: hidden !important; }\n";
       // Industrial background pattern
       css += "body:before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: repeating-linear-gradient(45deg, #263238, #263238 10px, #37474f 10px, #37474f 20px); opacity: 0.3; z-index: -1; animation: slide-panel 20s linear infinite; }\n";
       
       css += ".game-container { background: #37474f !important; border: 4px solid #455a64; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); box-shadow: 0 10px 20px rgba(0,0,0,0.5) !important; }\n";
       css += ".grid-cell { background: #263238 !important; box-shadow: 0 0 0 1px #546e7a, inset 0 0 5px #000 !important; clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px); border: none !important; }\n";
       css += ".tile .tile-inner { clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px); box-shadow: inset 0 0 0 2px rgba(0,0,0,0.2) !important; border: none !important; font-family: 'Consolas', monospace !important; font-weight: bold; text-transform: uppercase; }\n";
       
       css += ".tile-2 .tile-inner { background: #cfd8dc !important; color: #263238 !important; border-color: #90a4ae !important; }\n";
       css += ".tile-4 .tile-inner { background: #b0bec5 !important; color: #263238 !important; border-color: #78909c !important; }\n";
       css += ".tile-8 .tile-inner { background: #ffcc80 !important; color: #e65100 !important; border-color: #ffb74d !important; }\n";
       css += ".tile-16 .tile-inner { background: #ffb74d !important; color: #e65100 !important; border-left: 5px solid #ff9800 !important; }\n";
       css += ".tile-32 .tile-inner { background: #ffa726 !important; color: #fff !important; border-left: 5px solid #ef6c00 !important; }\n";
       css += ".tile-64 .tile-inner { background: #ff9800 !important; color: #fff !important; border-left: 5px solid #e65100 !important; animation: pulse-warning 2s infinite; }\n";
       css += ".tile-128 .tile-inner, .tile-256 .tile-inner { background: #fb8c00 !important; color: #fff !important; box-shadow: inset 0 0 10px #000 !important; border: 2px dashed #37474f !important; }\n";
       css += ".tile-512 .tile-inner, .tile-1024 .tile-inner { background: #f57c00 !important; color: #fff !important; background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.1) 5px, rgba(0,0,0,0.1) 10px) !important; }\n";
       css += ".tile-2048 .tile-inner { background: #212121 !important; color: #ffab00 !important; border: 3px solid #ffd600 !important; box-shadow: 0 0 15px rgba(255, 214, 0, 0.5) !important; }\n";
       
       css += "h1.title { color: #ffab00 !important; text-transform: uppercase; letter-spacing: 4px; border-bottom: 4px solid #ffab00; padding-bottom: 5px; display: inline-block; }\n";
       css += "p, .game-intro, .game-explanation { color: #cfd8dc !important; font-family: 'Consolas', monospace !important; border-left: 3px solid #546e7a; padding-left: 10px; }\n";
       css += ".score-container, .best-container { background: #263238 !important; border: 2px solid #546e7a; color: #ffab00 !important; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }\n";
       css += ".score-container:after, .best-container:after { color: #90a4ae !important; text-transform: uppercase; लेटर-spacing: 1px; }\n";
       css += ".restart-button, .game-message a { background: #ff6f00 !important; color: #fff !important; text-transform: uppercase; font-weight: bold; letter-spacing: 2px; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); border: none; box-shadow: inset 0 -4px 0 rgba(0,0,0,0.2) !important; }\n";
       css += ".restart-button:hover, .game-message a:hover { background: #ff8f00 !important; transform: translateY(-2px); }\n";
    }
    if (theme.neumorphism) {
       var bg = "#e0e5ec";
       var text = "#4d5b6b";
       var shadowLight = "#ffffff";
       var shadowDark = "#a3b1c6";
       
       css += "html, body { background: " + bg + " !important; color: " + text + " !important; }\n";
       css += ".game-container { background: " + bg + " !important; border: none !important; border-radius: 20px !important; box-shadow: 9px 9px 16px " + shadowDark + ", -9px -9px 16px " + shadowLight + " !important; }\n";
       css += ".grid-cell { background: " + bg + " !important; border-radius: 12px !important; box-shadow: inset 6px 6px 10px " + shadowDark + ", inset -6px -6px 10px " + shadowLight + " !important; }\n";
       
       css += ".tile .tile-inner { background: " + bg + " !important; color: " + text + " !important; border-radius: 12px !important; box-shadow: 6px 6px 10px " + shadowDark + ", -6px -6px 10px " + shadowLight + " !important; font-weight: 600 !important; }\n";
       // Color accents for higher values
       css += ".tile-2 .tile-inner { color: #6d7fcc !important; }\n";
       css += ".tile-4 .tile-inner { color: #5dade2 !important; }\n";
       css += ".tile-8 .tile-inner { color: #48c9b0 !important; }\n";
       css += ".tile-16 .tile-inner { color: #52be80 !important; }\n";
       css += ".tile-32 .tile-inner { color: #f4d03f !important; }\n";
       css += ".tile-64 .tile-inner { color: #eb984e !important; }\n";
       css += ".tile-128 .tile-inner { color: #ec7063 !important; }\n";
       css += ".tile-256 .tile-inner { color: #a569bd !important; }\n";
       css += ".tile-512 .tile-inner { color: #5499c7 !important; }\n";
       css += ".tile-1024 .tile-inner { color: #45b39d !important; }\n";
       css += ".tile-2048 .tile-inner { color: #eebb44 !important; }\n";
       
       css += "h1.title { color: " + text + " !important; }\n";
       css += "p, .game-intro, .game-explanation { color: " + text + " !important; }\n";
       css += ".score-container, .best-container { background: " + bg + " !important; color: " + text + " !important; border-radius: 15px !important; box-shadow: inset 4px 4px 8px " + shadowDark + ", inset -4px -4px 8px " + shadowLight + " !important; }\n";
       css += ".score-container:after, .best-container:after { color: #888 !important; }\n";
       css += ".score-container .score-addition { color: #5dade2 !important; }\n";
       css += ".restart-button, .game-message a { background: " + bg + " !important; color: " + text + " !important; border-radius: 30px !important; box-shadow: 6px 6px 10px " + shadowDark + ", -6px -6px 10px " + shadowLight + " !important; }\n";
       css += ".restart-button:hover, .game-message a:hover { transform: translateY(1px); box-shadow: inset 4px 4px 8px " + shadowDark + ", inset -4px -4px 8px " + shadowLight + " !important; }\n";
    }
    if (theme.clay) {
       css += "@keyframes float-clay { 0% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } 100% { transform: translateY(0px) rotate(0deg); } }\n";
       
       css += "html { background: #ffffff !important; } body { background: transparent !important; color: #333 !important; font-family: 'Varela Round', sans-serif !important; overflow-x: hidden !important; }\n";
       // Background blobs
       css += "body:before { content: ''; position: fixed; top: 10%; left: -10%; width: 50vw; height: 50vw; background: #b388ff; border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; opacity: 0.2; animation: float-clay 8s ease-in-out infinite; z-index: -1; }\n";
       css += "body:after { content: ''; position: fixed; bottom: 10%; right: -10%; width: 60vw; height: 60vw; background: #ff80ab; border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; opacity: 0.2; animation: float-clay 10s ease-in-out infinite reverse; z-index: -1; }\n";
       
       css += ".game-container { background: rgba(255, 255, 255, 0.4) !important; backdrop-filter: blur(20px); border-radius: 30px !important; box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important; border: 2px solid #fff; }\n";
       css += ".grid-cell { background: rgba(255, 255, 255, 0.5) !important; border-radius: 20px !important; box-shadow: inset 4px 4px 8px rgba(0,0,0,0.05) !important; }\n";
       
       css += ".tile .tile-inner, .theme-preview-tile { border-radius: 20px !important; box-shadow: inset -6px -6px 10px rgba(0,0,0,0.1), inset 6px 6px 10px rgba(255,255,255,0.5), 8px 8px 16px rgba(0,0,0,0.1) !important; color: #fff !important; font-weight: 800 !important; }\n";
       
       css += ".tile-2 .tile-inner, .theme-preview-tile.theme-color-2 { background: #ff8a80 !important; }\n";
       css += ".tile-4 .tile-inner, .theme-preview-tile.theme-color-4 { background: #ff80ab !important; }\n";
       css += ".tile-8 .tile-inner, .theme-preview-tile.theme-color-8 { background: #b388ff !important; }\n";
       css += ".tile-16 .tile-inner, .theme-preview-tile.theme-color-16 { background: #8c9eff !important; }\n";
       css += ".tile-32 .tile-inner, .theme-preview-tile.theme-color-32 { background: #82b1ff !important; }\n";
       css += ".tile-64 .tile-inner, .theme-preview-tile.theme-color-64 { background: #80d8ff !important; }\n";
       css += ".tile-128 .tile-inner, .theme-preview-tile.theme-color-128 { background: #84ffff !important; color: #333 !important; }\n";
       css += ".tile-256 .tile-inner, .theme-preview-tile.theme-color-256 { background: #a7ffeb !important; color: #333 !important; }\n";
       css += ".tile-512 .tile-inner, .theme-preview-tile.theme-color-512 { background: #ccff90 !important; color: #333 !important; }\n";
       css += ".tile-1024 .tile-inner, .theme-preview-tile.theme-color-1024 { background: #f4ff81 !important; color: #333 !important; }\n";
       css += ".tile-2048 .tile-inner, .theme-preview-tile.theme-color-2048 { background: #ffd180 !important; color: #333 !important; box-shadow: inset -6px -6px 10px rgba(0,0,0,0.2), inset 6px 6px 10px rgba(255,255,255,0.6), 0 0 20px rgba(255, 209, 128, 0.6) !important; }\n";
       
       css += "h1.title { color: #333 !important; font-family: 'Varela Round', sans-serif !important; letter-spacing: -1px; }\n";
       css += "p, .game-intro, .game-explanation { color: #555 !important; font-family: 'Varela Round', sans-serif !important; }\n";
       css += ".score-container, .best-container { background: #fff !important; color: #333 !important; border-radius: 20px !important; box-shadow: 6px 6px 12px rgba(0,0,0,0.08) !important; }\n";
       css += ".score-container:after, .best-container:after { color: #888 !important; }\n";
       css += ".score-container .score-addition { color: #b388ff !important; }\n";
       css += ".restart-button, .game-message a { background: #82b1ff !important; color: #fff !important; border-radius: 25px !important; box-shadow: 6px 6px 12px rgba(130, 177, 255, 0.4) !important; font-weight: bold; }\n";
       css += ".restart-button:hover, .game-message a:hover { transform: translateY(-3px) scale(1.02); box-shadow: 8px 8px 16px rgba(130, 177, 255, 0.5) !important; }\n";
    }
    if (theme.bauhaus) {
       css += "@keyframes geo-move { 0% { background-position: 0 0; } 100% { background-position: 100px 100px; } }\n";
       
       css += "html { background: #f0f0f0 !important; } body { background: transparent !important; color: #1a1a1a !important; font-family: 'Helvetica Neue', Arial, sans-serif !important; overflow-x: hidden !important; }\n";
       // Geometric background
       css += "body:before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle, #E4002B 20%, transparent 20%), radial-gradient(circle, #FFD700 20%, transparent 20%), radial-gradient(circle, #0057B7 20%, transparent 20%); background-position: 0 0, 50px 50px, 100px 0; background-size: 100px 100px; opacity: 0.1; animation: geo-move 30s linear infinite; z-index: -1; }\n";
       
       css += ".game-container { background: #ffffff !important; border: 4px solid #1a1a1a; border-radius: 0 !important; box-shadow: 8px 8px 0 #1a1a1a !important; }\n";
       css += ".grid-cell { background: #e0e0e0 !important; border-radius: 50% !important; box-shadow: 0 0 0 2px #1a1a1a, 2px 2px 0 #1a1a1a !important; border: none !important; }\n";
       
       css += ".tile .tile-inner, .theme-preview-tile { border-radius: 0 !important; box-shadow: inset 0 0 0 2px #1a1a1a, 4px 4px 0 #1a1a1a !important; border: none !important; font-weight: 900 !important; color: #ffffff !important; }\n";
       
       // vary shapes and colors
       css += ".tile-2 .tile-inner, .theme-preview-tile.theme-color-2 { background: #E4002B !important; border-radius: 50% !important; }\n";
       css += ".tile-4 .tile-inner, .theme-preview-tile.theme-color-4 { background: #FFD700 !important; color: #1a1a1a !important; border-radius: 0 !important; }\n";
       css += ".tile-8 .tile-inner, .theme-preview-tile.theme-color-8 { background: #0057B7 !important; clip-path: polygon(50% 0%, 0% 100%, 100% 100%); line-height: 130px !important; }\n";
       css += ".tile-16 .tile-inner, .theme-preview-tile.theme-color-16 { background: #1a1a1a !important; border-radius: 0 20px 0 20px !important; }\n";
       css += ".tile-32 .tile-inner, .theme-preview-tile.theme-color-32 { background: #ffffff !important; color: #1a1a1a !important; border: 4px double #1a1a1a !important; }\n";
       css += ".tile-64 .tile-inner, .theme-preview-tile.theme-color-64 { background: #E4002B !important; clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%); }\n";
       css += ".tile-128 .tile-inner, .theme-preview-tile.theme-color-128 { background: #FFD700 !important; color: #1a1a1a !important; border-radius: 50% 0 50% 0 !important; }\n";
       css += ".tile-256 .tile-inner, .theme-preview-tile.theme-color-256 { background: #0057B7 !important; transform: rotate(5deg); }\n";
       css += ".tile-512 .tile-inner, .theme-preview-tile.theme-color-512 { background: #1a1a1a !important; border-radius: 50% !important; border: 4px dashed #fff !important; }\n";
       
       css += "@keyframes bauhaus-pop { 0% { transform: scale(0.8); opacity: 0.6; } 100% { transform: scale(1); opacity: 1; } }\n";
       css += ".tile-merged .tile-inner { animation: bauhaus-pop 0.3s cubic-bezier(0.25, 1, 0.5, 1) !important; transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1) !important; }\n";
       css += ".tile-tobe-merged { display: none !important; }\n";
       
       css += "h1.title { color: #1a1a1a !important; text-transform: uppercase; font-weight: 900; letter-spacing: -2px; text-decoration: underline; }\n";
       css += "p, .game-intro, .game-explanation { color: #333 !important; font-weight: bold; }\n";
       css += ".score-container, .best-container { background: #FFD700 !important; color: #1a1a1a !important; border: 2px solid #1a1a1a !important; border-radius: 0 !important; box-shadow: 4px 4px 0 #1a1a1a !important; }\n";
       css += ".score-container:after, .best-container:after { color: #1a1a1a !important; font-weight: bold; }\n";
       css += ".restart-button, .game-message a { background: #0057B7 !important; color: #fff !important; border: 2px solid #1a1a1a; border-radius: 0 !important; box-shadow: 4px 4px 0 #1a1a1a !important; text-transform: uppercase; font-weight: 900; }\n";
       css += ".restart-button:hover, .game-message a:hover { transform: translate(2px, 2px); box-shadow: 2px 2px 0 #1a1a1a !important; background: #004494 !important; }\n";
    }
    if (theme.nordic) {
       css += "@keyframes snow { 0% { transform: translateY(-10vh) translateX(0); opacity: 1; } 100% { transform: translateY(110vh) translateX(20px); opacity: 0; } }\n";
       
       css += "html { background: #f5f7fa !important; } body { background: transparent !important; color: #37474f !important; font-family: 'Raleway', sans-serif !important; overflow-x: hidden !important; }\n";
       // Snowflakes
       css += "body:before { content: '❄'; position: fixed; top: -5%; left: 10%; color: #b2ebf2; font-size: 20px; animation: snow 10s linear infinite; opacity: 0.6; z-index: -1; text-shadow: 0 0 5px rgba(255,255,255,0.8); }\n";
       css += "body:after { content: '❄'; position: fixed; top: -10%; left: 80%; color: #80deea; font-size: 15px; animation: snow 15s linear infinite 5s; opacity: 0.4; z-index: -1; text-shadow: 0 0 5px rgba(255,255,255,0.8); }\n";
       
       css += ".game-container { background: rgba(255, 255, 255, 0.7) !important; backdrop-filter: blur(5px); border: 1px solid #cfd8dc; box-shadow: 0 10px 30px rgba(176, 190, 197, 0.3) !important; border-radius: 4px !important; }\n";
       css += ".grid-cell { background: rgba(236, 239, 241, 0.6) !important; border-radius: 2px !important; }\n";
       
       css += ".tile .tile-inner, .theme-preview-tile { border-radius: 2px !important; background: #fff !important; color: #37474f !important; box-shadow: 0 2px 5px rgba(0,0,0,0.05) !important; font-weight: 300 !important; border: 1px solid transparent; }\n";
       
       // Icy ramp
       css += ".tile-2 .tile-inner, .theme-preview-tile.theme-color-2 { background: #ffffff !important; border-color: #eceff1 !important; }\n";
       css += ".tile-4 .tile-inner, .theme-preview-tile.theme-color-4 { background: #eceff1 !important; }\n";
       css += ".tile-8 .tile-inner, .theme-preview-tile.theme-color-8 { background: #cfd8dc !important; }\n";
       css += ".tile-16 .tile-inner, .theme-preview-tile.theme-color-16 { background: #b0bec5 !important; color: #fff !important; }\n";
       css += ".tile-32 .tile-inner, .theme-preview-tile.theme-color-32 { background: #90a4ae !important; color: #fff !important; }\n";
       css += ".tile-64 .tile-inner, .theme-preview-tile.theme-color-64 { background: #78909c !important; color: #fff !important; }\n";
       css += ".tile-128 .tile-inner, .theme-preview-tile.theme-color-128 { background: #607d8b !important; color: #fff !important; }\n";
       css += ".tile-256 .tile-inner, .theme-preview-tile.theme-color-256 { background: #546e7a !important; color: #fff !important; box-shadow: 0 0 15px rgba(84, 110, 122, 0.4) !important; }\n";
       css += ".tile-512 .tile-inner, .theme-preview-tile.theme-color-512 { background: #455a64 !important; color: #fff !important; }\n";
       css += ".tile-1024 .tile-inner, .theme-preview-tile.theme-color-1024 { background: #37474f !important; color: #fff !important; }\n";
       css += ".tile-2048 .tile-inner, .theme-preview-tile.theme-color-2048 { background: #263238 !important; color: #80deea !important; border: 1px solid #80deea !important; box-shadow: 0 0 20px rgba(38, 198, 218, 0.5) !important; }\n";
       
       css += "h1.title { color: #37474f !important; font-weight: 300; letter-spacing: 5px; }\n";
       css += "p, .game-intro, .game-explanation { color: #546e7a !important; font-weight: 300; }\n";
       css += ".score-container, .best-container { background: #fff !important; color: #37474f !important; border: 1px solid #eceff1; box-shadow: 0 2px 10px rgba(0,0,0,0.03) !important; }\n";
       css += ".score-container:after, .best-container:after { color: #90a4ae !important; letter-spacing: 1px; }\n";
       css += ".score-container .score-addition { color: #00bcd4 !important; }\n";
       css += ".restart-button, .game-message a { background: #fff !important; color: #546e7a !important; border: 1px solid #cfd8dc; box-shadow: 0 2px 5px rgba(0,0,0,0.05) !important; font-weight: 300; letter-spacing: 1px; }\n";
       css += ".restart-button:hover, .game-message a:hover { background: #eceff1 !important; color: #37474f !important; }\n";
    }
    if (theme.luxury) {
       css += "@keyframes shine { 0% { background-position: -100px; } 20% { background-position: 200px; } 100% { background-position: 200px; } }\n";
       css += "@keyframes sparkle { 0%, 100% { opacity: 0.8; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); box-shadow: 0 0 10px #f2d378; } }\n";
       
       css += "html { background: #0c0c0c !important; } body { background: transparent !important; color: #d4af37 !important; font-family: 'Playfair Display', serif !important; overflow-x: hidden !important; }\n";
       // Elegant texture
       css += "body:before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 50% 50%, #1a1a1a 0%, #000000 100%); opacity: 1; z-index: -2; }\n";
       css += "body:after { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPC9zdmc+'); opacity: 0.1; z-index: -1; }\n";
       
       css += ".game-container { background: #141414 !important; border: 1px solid #d4af37; box-shadow: 0 0 30px rgba(212, 175, 55, 0.15) !important; border-radius: 2px !important; }\n";
       css += ".grid-cell { background: #000 !important; box-shadow: 0 0 0 1px #333, inset 0 0 10px #000 !important; border: none !important; border-radius: 0 !important; }\n";
       
       css += ".tile .tile-inner, .theme-preview-tile { border-radius: 0 !important; font-family: 'Playfair Display', serif !important; box-shadow: inset 0 0 0 1px #d4af37, inset 0 0 15px rgba(0,0,0,0.8), 0 0 5px rgba(212, 175, 55, 0.3) !important; border: none !important; background: linear-gradient(135deg, #1a1a1a 0%, #000 100%) !important; color: #d4af37 !important; }\n";
       
       // Gold gradations
       css += ".tile-2 .tile-inner, .theme-preview-tile.theme-color-2 { color: #887020 !important; border-color: #887020 !important; }\n";
       css += ".tile-4 .tile-inner, .theme-preview-tile.theme-color-4 { color: #a6821a !important; border-color: #a6821a !important; }\n";
       css += ".tile-8 .tile-inner, .theme-preview-tile.theme-color-8 { color: #b69121 !important; border-color: #b69121 !important; }\n";
       css += ".tile-16 .tile-inner, .theme-preview-tile.theme-color-16 { color: #c5a028 !important; border-color: #c5a028 !important; background: linear-gradient(135deg, #262626 0%, #1a1a1a 100%) !important; }\n";
       css += ".tile-32 .tile-inner, .theme-preview-tile.theme-color-32 { color: #d4af37 !important; border-color: #d4af37 !important; background: linear-gradient(135deg, #333 0%, #222 100%) !important; }\n";
       css += ".tile-64 .tile-inner, .theme-preview-tile.theme-color-64 { color: #e5c15b !important; border-color: #e5c15b !important; text-shadow: 0 0 5px rgba(229, 193, 91, 0.5); }\n";
       css += ".tile-128 .tile-inner, .theme-preview-tile.theme-color-128 { color: #f2d378 !important; border-color: #f2d378 !important; text-shadow: 0 0 8px rgba(242, 211, 120, 0.6); }\n";
       css += ".tile-256 .tile-inner, .theme-preview-tile.theme-color-256 { color: #ffeaa0 !important; border-color: #ffeaa0 !important; background: #262626 !important; animation: sparkle 3s infinite; }\n";
       css += ".tile-512 .tile-inner, .theme-preview-tile.theme-color-512, .tile-1024 .tile-inner, .theme-preview-tile.theme-color-1024 { color: #fff !important; border-color: #fff !important; background: #d4af37 !important; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }\n";
       css += ".tile-2048 .tile-inner, .theme-preview-tile.theme-color-2048 { color: #000 !important; background: linear-gradient(45deg, #d4af37, #f2d378, #d4af37) !important; box-shadow: 0 0 20px #d4af37 !important; border: 1px solid #fff !important; }\n";

       css += "h1.title { font-weight: normal; letter-spacing: 2px; background: linear-gradient(to right, #887020 0%, #f2d378 50%, #887020 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shine 5s infinite linear; background-size: 200px; }\n";
       css += "p, .game-intro, .game-explanation { color: #a6821a !important; font-style: italic; }\n";
       css += ".score-container, .best-container { background: #0c0c0c !important; color: #d4af37 !important; border: 1px solid #d4af37; box-shadow: 0 5px 15px rgba(0,0,0,0.5) !important; }\n";
       css += ".score-container:after, .best-container:after { color: #887020 !important; text-transform: uppercase; letter-spacing: 2px; font-size: 10px; }\n";
       css += ".restart-button, .game-message a { background: #1a1a1a !important; color: #d4af37 !important; border: 1px solid #d4af37 !important; text-transform: uppercase; letter-spacing: 2px; font-size: 14px; box-shadow: inset 0 0 10px rgba(0,0,0,0.8); }\n";
       css += ".restart-button:hover, .game-message a:hover { background: #d4af37 !important; color: #000 !important; box-shadow: 0 0 15px #d4af37 !important; }\n";
    }
    if (theme.ocean) {
       css += "@keyframes wave { 0% { transform: translateX(0) translateZ(0) scaleY(1); } 50% { transform: translateX(-25%) translateZ(0) scaleY(0.55); } 100% { transform: translateX(-50%) translateZ(0) scaleY(1); } }\n";
       
       css += "html { background: linear-gradient(to bottom, #72cce8 0%, #4facfe 100%) !important; } body { background: transparent !important; color: #0b1d34 !important; overflow-x: hidden !important; }\n";
       // Wave background
       css += "body:before { content: ''; position: fixed; bottom: 0; left: 0; width: 200%; height: 30%; background-color: rgba(255,255,255,0.4); border-radius: 45%; animation: wave 10s linear infinite; z-index: -1; }\n";
       css += "body:after { content: ''; position: fixed; bottom: 0; left: 0; width: 200%; height: 35%; background-color: rgba(255,255,255,0.2); border-radius: 43%; animation: wave 15s linear infinite; z-index: -2; }\n";
       
       css += ".game-container { background: rgba(255, 255, 255, 0.4) !important; backdrop-filter: blur(8px); border: 2px solid rgba(255,255,255,0.6); box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2) !important; border-radius: 20px !important; }\n";
       css += ".grid-cell { background: rgba(255, 255, 255, 0.3) !important; border-radius: 15px !important; box-shadow: inset 0 0 10px rgba(0,0,0,0.05) !important; }\n";
       css += ".tile .tile-inner, .theme-preview-tile { border-radius: 15px !important; box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3), 0 1px 3px rgba(0,0,0,0.1) !important; background-image: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%) !important; }\n";
       
       css += "h1.title { color: #fff !important; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }\n";
       css += "p, .game-intro, .game-explanation { color: #0f2642 !important; }\n";
       css += ".score-container, .best-container { background: rgba(255, 255, 255, 0.5) !important; color: #1c4878 !important; border: 1px solid #fff; border-radius: 15px !important; }\n";
       css += ".score-container:after, .best-container:after { color: #173b64 !important; }\n";
       
       css += ".restart-button, .game-message a { background: linear-gradient(135deg, #8fdcff 0%, #6accfb 100%) !important; color: #0f2642 !important; border-radius: 25px !important; box-shadow: 0 4px 10px rgba(0,0,0,0.1) !important; border: 1px solid rgba(255,255,255,0.5); font-weight: bold; }\n";
       css += ".restart-button:hover, .game-message a:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,0,0,0.15) !important; background: linear-gradient(135deg, #6accfb 0%, #4fb8ef 100%) !important; }\n";
       css += ".top-action-btn { background: rgba(255,255,255,0.4) !important; border-radius: 15px !important; color: #0f2642 !important; }\n";
    }
    if (theme.vaporwave) {
       css += "html { background: #2c2137 !important; } body { background: transparent !important; color: #01cdfe !important; font-family: 'Verdana', sans-serif !important; letter-spacing: 1px; overflow-x: hidden !important; }\n";
       css += "body:before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, #2c2137 0%, #1a1a2e 100%); z-index: -2; }\n";
       css += "body:after { content: ''; position: fixed; bottom: 0; left: 0; width: 100%; height: 30%; background: repeating-linear-gradient(0deg, transparent, transparent 1px, #b967ff 2px, #b967ff 4px); opacity: 0.2; transform: perspective(500px) rotateX(60deg); z-index: -1; }\n";
       
       css += ".game-container { background: #1a1a2e !important; border: 2px solid #ff71ce; box-shadow: 0 0 20px #ff71ce, inset 0 0 20px #b967ff !important; border-radius: 0 !important; transform: skewX(-2deg); }\n";
       css += ".grid-cell { background: transparent !important; border: 1px solid #01cdfe; box-shadow: 0 0 5px #01cdfe !important; border-radius: 0 !important; }\n";
       css += ".tile .tile-inner, .theme-preview-tile { border-radius: 0 !important; font-style: italic; background: linear-gradient(45deg, #ff71ce, #b967ff) !important; color: #fff !important; text-shadow: 2px 2px 0px #000; box-shadow: 4px 4px 0 rgba(0,0,0,0.5) !important; }\n";
       css += ".tile-2 .tile-inner, .theme-preview-tile.theme-color-2, .tile-4 .tile-inner, .theme-preview-tile.theme-color-4 { background: linear-gradient(45deg, #01cdfe, #05ffa1) !important; color: #000 !important; text-shadow: none !important; }\n";
       
       css += "h1.title { color: #ff71ce !important; text-shadow: 3px 3px 0px #01cdfe; font-style: italic; }\n";
       css += ".score-container, .best-container { background: #000 !important; border: 1px solid #05ffa1; color: #fffb96 !important; box-shadow: 4px 4px 0 #b967ff !important; border-radius: 0 !important; }\n";
       css += ".score-container:after, .best-container:after { color: #05ffa1 !important; }\n";
       
       css += ".restart-button, .game-message a { background: linear-gradient(90deg, #ff71ce, #b967ff) !important; color: #fff !important; border: none; border-radius: 0 !important; text-transform: uppercase; font-style: italic; box-shadow: 4px 4px 0 #000 !important; }\n";
       css += ".restart-button:hover, .game-message a:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #01cdfe !important; }\n";
       css += ".top-action-btn { background: #000 !important; border: 1px solid #ff71ce !important; color: #ff71ce !important; box-shadow: 2px 2px 0 #01cdfe !important; }\n";
    }
    if (theme.matcha) {
       css += "html, body { background: #fafbf6 !important; color: #5d4037 !important; font-family: 'Hiragino Sans', 'Noto Sans JP', sans-serif !important; }\n";
       css += ".game-container { background: #f1f8e9 !important; border-radius: 10px !important; border: 8px solid #c5e1a5; box-shadow: 0 10px 20px rgba(93, 64, 55, 0.1) !important; }\n";
       css += ".grid-cell { background: #dcedc8 !important; border-radius: 6px !important; }\n";
       css += ".tile .tile-inner, .theme-preview-tile { border-radius: 6px !important; font-weight: normal; box-shadow: 0 4px 8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1) !important; }\n";
       
       css += ".tile-2 .tile-inner, .theme-preview-tile.theme-color-2 { background: #ffffff !important; color: #795548 !important; border: 2px solid #dcedc8 !important; }\n";
       css += ".tile-4 .tile-inner, .theme-preview-tile.theme-color-4 { background: #fafbf6 !important; color: #5d4037 !important; border: 2px solid #c5e1a5 !important; }\n";
       css += ".tile-8 .tile-inner, .theme-preview-tile.theme-color-8 { background: #c5e1a5 !important; color: #33691e !important; }\n";
       css += ".tile-16 .tile-inner, .theme-preview-tile.theme-color-16 { background: #aed581 !important; color: #33691e !important; }\n";
       css += ".tile-32 .tile-inner, .theme-preview-tile.theme-color-32 { background: #9ccc65 !important; color: #fff !important; }\n";
       css += ".tile-64 .tile-inner, .theme-preview-tile.theme-color-64 { background: #8bc34a !important; color: #fff !important; }\n";
       css += ".tile-128 .tile-inner, .theme-preview-tile.theme-color-128 { background: #7cb342 !important; color: #fff !important; }\n";
       css += ".tile-256 .tile-inner, .theme-preview-tile.theme-color-256 { background: #689f38 !important; color: #fff !important; }\n";
       css += ".tile-512 .tile-inner, .theme-preview-tile.theme-color-512 { background: #558b2f !important; color: #fff !important; }\n";
       
       css += "h1.title { color: #689f38 !important; font-weight: normal; }\n";
       css += ".score-container, .best-container { background: #9ccc65 !important; color: #fff !important; border-radius: 5px !important; }\n";
       css += ".score-container:after, .best-container:after { color: #f1f8e9 !important; }\n";
       
       css += ".restart-button, .game-message a { background: #8bc34a !important; color: #fff !important; border-radius: 5px !important; box-shadow: 0 4px 0 #7cb342 !important; font-weight: bold; }\n";
       css += ".restart-button:hover, .game-message a:hover { background: #9ccc65 !important; transform: translateY(2px); box-shadow: 0 2px 0 #7cb342 !important; }\n";
       css += ".top-action-btn { background: #dcedc8 !important; color: #689f38 !important; border-radius: 5px !important; }\n";
    }
    if (theme.dracula) {
       css += "html, body { background: #282a36 !important; color: #f8f8f2 !important; font-family: 'Fira Code', monospace !important; }\n";
       css += ".game-container { background: #44475a !important; border-radius: 4px !important; box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important; border: 2px solid #6272a4; }\n";
       css += ".grid-cell { background: #282a36 !important; border-radius: 4px !important; box-shadow: inset 0 0 5px rgba(0,0,0,0.5) !important; }\n";
       css += ".tile .tile-inner, .theme-preview-tile { border-radius: 4px !important; font-weight: bold; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; }\n";
       
       css += ".tile-2 .tile-inner, .theme-preview-tile.theme-color-2 { background: #282a36 !important; border-color: #bd93f9 !important; color: #bd93f9 !important; }\n";
       css += ".tile-4 .tile-inner, .theme-preview-tile.theme-color-4 { background: #282a36 !important; border-color: #ff79c6 !important; color: #ff79c6 !important; }\n";
       css += ".tile-8 .tile-inner, .theme-preview-tile.theme-color-8 { background: #44475a !important; color: #f8f8f2 !important; border-bottom: 4px solid #6272a4 !important; }\n";
       css += ".tile-16 .tile-inner, .theme-preview-tile.theme-color-16 { background: #6272a4 !important; color: #f8f8f2 !important; }\n";
       css += ".tile-32 .tile-inner, .theme-preview-tile.theme-color-32 { background: #8be9fd !important; color: #282a36 !important; }\n";
       css += ".tile-64 .tile-inner, .theme-preview-tile.theme-color-64 { background: #50fa7b !important; color: #282a36 !important; }\n";
       css += ".tile-128 .tile-inner, .theme-preview-tile.theme-color-128 { background: #ffb86c !important; color: #282a36 !important; }\n";
       css += ".tile-256 .tile-inner, .theme-preview-tile.theme-color-256 { background: #ff79c6 !important; color: #282a36 !important; }\n";
       css += ".tile-512 .tile-inner, .theme-preview-tile.theme-color-512 { background: #bd93f9 !important; color: #282a36 !important; box-shadow: 0 0 10px #bd93f9 !important; }\n";
       css += ".tile-1024 .tile-inner, .theme-preview-tile.theme-color-1024 { background: #ff5555 !important; color: #f8f8f2 !important; box-shadow: 0 0 15px #ff5555 !important; }\n";
       
       css += "h1.title { color: #ff79c6 !important; text-shadow: 2px 2px 0 #44475a; }\n";
       css += "p, .game-intro, .game-explanation { color: #f8f8f2 !important; }\n";
       css += ".score-container, .best-container { background: #282a36 !important; color: #f8f8f2 !important; border: 2px solid #6272a4; box-shadow: 4px 4px 0 #44475a !important; }\n";
       css += ".score-container:after, .best-container:after { color: #6272a4 !important; }\n";
       css += ".score-container .score-addition { color: #50fa7b !important; }\n";
       
       css += ".restart-button, .game-message a { background: #44475a !important; color: #ff79c6 !important; border: 2px solid #ff79c6; border-radius: 4px !important; font-weight: bold; }\n";
       css += ".restart-button:hover, .game-message a:hover { background: #ff79c6 !important; color: #282a36 !important; box-shadow: 0 0 10px #ff79c6 !important; }\n";
       css += ".top-action-btn { background: #282a36 !important; color: #8be9fd !important; border: 1px solid #6272a4 !important; }\n";
    }
    if (theme.sunset) {
       css += "html { background: linear-gradient(to bottom, #4a148c, #bf360c) !important; min-height: 100vh; } body { background: transparent !important; color: #ffe0b2 !important; overflow-x: hidden !important; }\n";
       css += ".game-container { background: rgba(0, 0, 0, 0.3) !important; border-radius: 12px !important; box-shadow: 0 0 30px rgba(255, 152, 0, 0.3) !important; border: 1px solid rgba(255, 255, 255, 0.1); }\n";
       css += ".grid-cell { background: rgba(255, 255, 255, 0.1) !important; border-radius: 8px !important; }\n";
       css += ".tile .tile-inner, .theme-preview-tile { border-radius: 8px !important; box-shadow: 0 5px 15px rgba(255, 87, 34, 0.3), 0 2px 4px rgba(0,0,0,0.2) !important; background-image: linear-gradient(180deg, rgba(255,255,255,0.1), rgba(0,0,0,0.1)) !important; }\n";
       
       css += "h1.title { color: #ffcc80 !important; text-shadow: 0 2px 10px rgba(255, 152, 0, 0.5); }\n";
       css += "p, .game-intro, .game-explanation { color: #a6821a !important; font-style: italic; }\n";
       css += ".score-container, .best-container { background: rgba(74, 20, 140, 0.6) !important; color: #ffcc80 !important; border: 1px solid #ff9800; }\n";
       css += ".score-container:after, .best-container:after { color: #ba68c8 !important; }\n";
       
       css += ".restart-button, .game-message a { background: linear-gradient(to right, #ff9800, #f57c00) !important; color: #fff !important; border-radius: 20px !important; box-shadow: 0 4px 10px rgba(245, 124, 0, 0.4) !important; border: none; font-weight: bold; text-transform: uppercase; }\n";
       css += ".restart-button:hover, .game-message a:hover { background: linear-gradient(to right, #ef6c00, #e65100) !important; transform: scale(1.05); box-shadow: 0 6px 15px rgba(230, 81, 0, 0.5) !important; }\n";
       css += ".top-action-btn { background: rgba(0,0,0,0.4) !important; color: #ffcc80 !important; border: 1px solid rgba(255, 152, 0, 0.5) !important; }\n";
       
       css += "body:after { content: ''; position: fixed; bottom: 0; width: 100%; height: 200px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); pointer-events: none; z-index: -1; }\n";
    }
    if (theme.blueprint) {
       css += "html { background: #1565c0 !important; } body { background: transparent !important; color: #ffffff !important; font-family: 'Courier New', Courier, monospace !important; overflow-x: hidden !important; }\n";
       css += ".game-container { background: #1976d2 !important; border: 2px dashed #90caf9; box-shadow: none !important; border-radius: 0 !important; }\n";
       css += "body:before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px); background-size: 20px 20px; background-position: -1px -1px; opacity: 0.1; z-index: -1; }\n";
       
       css += ".grid-cell { background: transparent !important; border: 1px solid #64b5f6; border-radius: 0 !important; }\n";
       css += ".tile .tile-inner, .theme-preview-tile { border-radius: 0 !important; background: #0d47a1 !important; color: #ffffff !important; border: 1px solid #ffffff !important; font-weight: normal !important; box-shadow: 4px 4px 0 rgba(0,0,0,0.3) !important; }\n";
       
       css += ".tile-2 .tile-inner, .theme-preview-tile.theme-color-2 { background: #1976d2 !important; }\n";
       css += ".tile-4 .tile-inner, .theme-preview-tile.theme-color-4 { background: #1e88e5 !important; }\n";
       css += ".tile-8 .tile-inner, .theme-preview-tile.theme-color-8 { background: #2196f3 !important; }\n";
       css += ".tile-16 .tile-inner, .theme-preview-tile.theme-color-16 { background: #42a5f5 !important; }\n";
       css += ".tile-32 .tile-inner, .theme-preview-tile.theme-color-32 { background: #64b5f6 !important; color: #000 !important; }\n";
       css += ".tile-64 .tile-inner, .theme-preview-tile.theme-color-64 { background: #90caf9 !important; color: #000 !important; }\n";
       css += ".tile-128 .tile-inner, .theme-preview-tile.theme-color-128 { background: #bbdefb !important; color: #000 !important; border: 2px solid #000 !important; }\n";
       css += ".tile-256 .tile-inner, .theme-preview-tile.theme-color-256 { background: #e3f2fd !important; color: #000 !important; border: 2px solid #000 !important; }\n";
       
       css += "h1.title { color: #ffffff !important; border-bottom: 2px dashed #ffffff; display: inline-block; }\n";
       css += "p, .game-intro, .game-explanation { color: #00ff00 !important; }\n";
       css += ".score-container, .best-container { background: #0d47a1 !important; color: #ffffff !important; border: 1px solid #ffffff; border-radius: 0 !important; }\n";
       css += ".score-container:after, .best-container:after { color: #bbdefb !important; }\n";

       // SVG stroke fix for blueprint
       css += ".top-action-btn svg, .restart-button svg { stroke: #ffffff !important; }\n";

       
       css += ".restart-button, .game-message a { background: #0d47a1 !important; color: #ffffff !important; border: 1px solid #ffffff; border-radius: 0 !important; font-family: 'Courier New', Courier, monospace !important; }\n";
       css += ".restart-button:hover, .game-message a:hover { background: #1565c0 !important; box-shadow: inset 0 0 10px rgba(0,0,0,0.3) !important; }\n";
       css += ".top-action-btn { background: #1976d2 !important; color: #fff !important; border: 1px dashed #fff !important; }\n";
    }
    if (theme.candy) {
       css += "html { background: #ffe0e9 !important; } body { background: transparent !important; color: #d81b60 !important; font-family: 'Comic Sans MS', 'Chalkboard SE', sans-serif !important; overflow-x: hidden !important; }\n";
       css += "body:before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: repeating-linear-gradient(45deg, #ffe0e9, #ffe0e9 10px, #fff 10px, #fff 20px); opacity: 0.5; z-index: -1; }\n";
       
       css += ".game-container { background: #fff !important; border-radius: 30px !important; border: 4px solid #f8bbd0; box-shadow: 0 10px 0 #f48fb1 !important; }\n";
       css += ".grid-cell { background: #fce4ec !important; border-radius: 50% !important; }\n";
       css += ".tile .tile-inner, .theme-preview-tile { border-radius: 50% !important; border: 2px solid #fff; box-shadow: inset 0 0 10px rgba(0,0,0,0.05), 0 6px 0 rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.1) !important; font-weight: bold; }\n";
       
       css += ".tile-2 .tile-inner, .theme-preview-tile.theme-color-2 { background: #ff9aa2 !important; color: #fff !important; }\n";
       css += ".tile-4 .tile-inner, .theme-preview-tile.theme-color-4 { background: #ffb7b2 !important; color: #fff !important; }\n";
       css += ".tile-8 .tile-inner, .theme-preview-tile.theme-color-8 { background: #ffdac1 !important; color: #fff !important; }\n";
       css += ".tile-16 .tile-inner, .theme-preview-tile.theme-color-16 { background: #e2f0cb !important; color: #fff !important; }\n";
       css += ".tile-32 .tile-inner, .theme-preview-tile.theme-color-32 { background: #b5ead7 !important; color: #fff !important; }\n";
       css += ".tile-64 .tile-inner, .theme-preview-tile.theme-color-64 { background: #c7ceea !important; color: #fff !important; }\n";
       css += ".tile-128 .tile-inner, .theme-preview-tile.theme-color-128 { background: #ff80ab !important; color: #fff !important; border: 4px dotted #fff !important; }\n";
       css += ".tile-256 .tile-inner, .theme-preview-tile.theme-color-256 { background: #ea80fc !important; color: #fff !important; border: 4px dotted #fff !important; }\n";
       
       css += "h1.title { color: #ec407a !important; text-shadow: 2px 2px 0 #fff; }\n";
       css += "p, .game-intro, .game-explanation { color: #d81b60 !important; }\n";
       css += ".score-container, .best-container { background: #b5ead7 !important; color: #fff !important; border-radius: 20px !important; border: 2px solid #fff; }\n";
       css += ".score-container:after, .best-container:after { color: #009688 !important; }\n";
       
       css += ".restart-button, .game-message a { background: #ff9aa2 !important; color: #fff !important; border-radius: 20px !important; border: 2px solid #fff; box-shadow: 0 4px 0 #ff6f61 !important; }\n";
       css += ".restart-button:hover, .game-message a:hover { transform: translateY(2px); box-shadow: 0 2px 0 #ff6f61 !important; }\n";
       css += ".top-action-btn { background: #fff !important; color: #ff6f61 !important; border-radius: 20px !important; border: 2px solid #ff9aa2 !important; }\n";
    }
    if (theme.terminal) {
       css += "@keyframes cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }\n";
       css += "html, body { background: #000000 !important; color: #00ff00 !important; font-family: 'Consolas', 'Monaco', monospace !important; }\n";
       css += ".game-container { background: #000000 !important; border: 2px solid #00ff00; border-radius: 0 !important; box-shadow: 0 0 10px #00ff00 !important; }\n";
       css += ".grid-cell { background: #001100 !important; border: 1px solid #003300; border-radius: 0 !important; }\n";
       css += ".tile .tile-inner, .theme-preview-tile { border-radius: 0 !important; background: #000 !important; color: #00ff00 !important; border: 1px solid #00ff00; font-family: 'Consolas', monospace !important; box-shadow: inset 0 0 5px #00ff00 !important; }\n";
       
       css += ".tile-2 .tile-inner, .theme-preview-tile.theme-color-2 { color: #00ff00 !important; }\n";
       css += ".tile-4 .tile-inner, .theme-preview-tile.theme-color-4 { color: #00dd00 !important; }\n";
       css += ".tile-8 .tile-inner, .theme-preview-tile.theme-color-8 { color: #00bb00 !important; }\n";
       css += ".tile-16 .tile-inner, .theme-preview-tile.theme-color-16 { color: #009900 !important; }\n";
       css += ".tile-32 .tile-inner, .theme-preview-tile.theme-color-32 { color: #007700 !important; border: 2px solid #00ff00 !important; }\n";
       css += ".tile-64 .tile-inner, .theme-preview-tile.theme-color-64 { color: #005500 !important; background: #00ff00 !important; color: #000 !important; }\n";
       
       css += "h1.title:after { content: '_'; animation: cursor-blink 1s step-end infinite; }\n";
       css += "h1.title { color: #00ff00 !important; text-shadow: 0 0 5px #00ff00; }\n";
       css += "p, .game-intro, .game-explanation { color: #00cc00 !important; }\n";
       css += ".score-container, .best-container { background: #000 !important; color: #00ff00 !important; border: 1px solid #00ff00; border-radius: 0 !important; }\n";
       css += ".score-container:after, .best-container:after { color: #00aa00 !important; }\n";
       
       css += ".restart-button, .game-message a { background: #000 !important; color: #00ff00 !important; border: 1px solid #00ff00; border-radius: 0 !important; text-transform: lowercase; }\n";
       css += ".restart-button:hover, .game-message a:hover { background: #00ff00 !important; color: #000 !important; }\n";
       css += ".top-action-btn { background: #000 !important; color: #00ff00 !important; border: 1px solid #00ff00 !important; border-radius: 0 !important; }\n";
    }
    if (theme.paper) {
       css += "html, body { background: url('https://www.transparenttextures.com/patterns/cardboard.png'), #fdfbf7 !important; color: #333 !important; font-family: 'Courier New', Courier, monospace !important; }\n";
       css += ".game-container { background: #fff !important; border: 1px solid #ccc; box-shadow: 5px 5px 10px rgba(0,0,0,0.1) !important; transform: rotate(1deg); border-radius: 2px !important; }\n";
       css += ".grid-cell { background: #f5f5f5 !important; border: 1px dashed #ccc; border-radius: 0 !important; }\n";
       css += ".tile .tile-inner, .theme-preview-tile { border-radius: 0 !important; background: #fff !important; border: 2px solid #333; color: #333 !important; font-weight: bold; transform: rotate(-2deg); box-shadow: 2px 2px 0 rgba(0,0,0,0.1) !important; }\n";
       
       css += ".tile-2 .tile-inner, .theme-preview-tile.theme-color-2 { transform: rotate(1deg); }\n";
       css += ".tile-4 .tile-inner, .theme-preview-tile.theme-color-4 { transform: rotate(-1deg); border-color: #555 !important; }\n";
       css += ".tile-8 .tile-inner, .theme-preview-tile.theme-color-8 { transform: rotate(2deg); background: #eee !important; }\n";
       css += ".tile-16 .tile-inner, .theme-preview-tile.theme-color-16 { transform: rotate(-2deg); background: #ddd !important; }\n";
       css += ".tile-32 .tile-inner, .theme-preview-tile.theme-color-32 { border: 3px solid #000 !important; transform: rotate(0deg); }\n";
       
       css += "h1.title { color: #000 !important; font-style: italic; text-decoration: underline; }\n";
       css += ".score-container, .best-container { background: #fff !important; color: #000 !important; border: 1px solid #333; border-radius: 0 !important; box-shadow: 3px 3px 0 rgba(0,0,0,0.1) !important; }\n";
       css += ".score-container:after, .best-container:after { color: #555 !important; }\n";
       
       css += ".restart-button, .game-message a { background: #fff !important; color: #000 !important; border: 2px solid #333; border-radius: 0 !important; box-shadow: 3px 3px 0 #333 !important; }\n";
       css += ".restart-button:hover, .game-message a:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 #333 !important; }\n";
       css += ".top-action-btn { background: #fff !important; color: #333 !important; border: 1px dashed #333 !important; }\n";
    }
    if (theme.coffee) {
       css += "html { background: #d7ccc8 !important; } body { background: transparent !important; color: #3e2723 !important; font-family: 'Verdana', sans-serif !important; overflow-x: hidden !important; }\n";
       css += "body:before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle, #efebe9 20%, transparent 20%); background-size: 20px 20px; opacity: 0.5; z-index: -1; }\n";
       
       css += ".game-container { background: #4e342e !important; border-radius: 12px !important; border: 4px solid #3e2723; box-shadow: 0 10px 20px rgba(62, 39, 35, 0.4) !important; }\n";
       css += ".grid-cell { background: #5d4037 !important; border-radius: 8px !important; box-shadow: inset 0 2px 5px rgba(0,0,0,0.2) !important; }\n";
       css += ".tile .tile-inner, .theme-preview-tile { border-radius: 8px !important; box-shadow: 0 4px 8px rgba(62, 39, 35, 0.4), 0 1px 3px rgba(0,0,0,0.2) !important; font-weight: bold; }\n";
       
       css += ".tile-2 .tile-inner, .theme-preview-tile.theme-color-2 { background: #fff8e1 !important; color: #4e342e !important; }\n";
       css += ".tile-4 .tile-inner, .theme-preview-tile.theme-color-4 { background: #ffecb3 !important; color: #4e342e !important; }\n";
       css += ".tile-8 .tile-inner, .theme-preview-tile.theme-color-8 { background: #ffcc80 !important; color: #3e2723 !important; }\n";
       css += ".tile-16 .tile-inner, .theme-preview-tile.theme-color-16 { background: #ffa726 !important; color: #3e2723 !important; }\n";
       css += ".tile-32 .tile-inner, .theme-preview-tile.theme-color-32 { background: #ff9800 !important; color: #fff !important; }\n";
       css += ".tile-64 .tile-inner, .theme-preview-tile.theme-color-64 { background: #ef6c00 !important; color: #fff !important; }\n";
       css += ".tile-128 .tile-inner, .theme-preview-tile.theme-color-128 { background: #e65100 !important; color: #fff !important; box-shadow: 0 0 10px #e65100 !important; }\n";
       
       css += "h1.title { color: #3e2723 !important; text-shadow: 1px 1px 0 #d7ccc8; }\n";
       css += ".score-container, .best-container { background: #5d4037 !important; color: #fff8e1 !important; border-radius: 6px !important; box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important; }\n";
       css += ".score-container:after, .best-container:after { color: #d7ccc8 !important; }\n";
       css += ".restart-button:hover, .game-message a:hover { background: #795548 !important; transform: translateY(2px); box-shadow: 0 1px 0 #3e2723 !important; }\n";
       css += ".top-action-btn { background: #efebe9 !important; color: #3e2723 !important; border: 1px solid #a1887f !important; border-radius: 6px !important; }\n";
    }
    
    css += pageCss(theme);

    if (theme.horse_year) {
        // --- Assets: User Provided Images ---
        // 1. Center: Calligraphy 'Ma' (Horse)
        var bgCenter = "images/horse/马.png"; // Needs URL encoding if not handled by browser, but usually safe in quotes. 
        // Actually, let's play it safe and encodeURI component for Chinese chars in URL()
        // But path is relative to the CSS/HTML? No, inline style on page, so relative to index.html.
        // index.html is in root. images/ is in root.
        // So: "images/horse/%E9%A9%AC.png"
        
        // Let's use exact filenames but URL encoded for safety in CSS string
        var bgCenterUrl = "images/horse/" + encodeURIComponent("马") + ".png";
        var bgHeadUrl = "images/horse/" + encodeURIComponent("马头") + ".png";
        var bgGallopUrl = "images/horse/" + encodeURIComponent("战马") + ".png";

        // --- CSS Generation ---
        // HTML: Gradient Background
        css += "html { background: radial-gradient(circle at 50% 30%, #a71e32, #7a0c1e) !important; }\n";
        
        // Body: Center Ma
        css += "body { " + 
               "background-color: transparent !important; " +
               "background-image: url('" + bgCenterUrl + "') !important; " +
               "background-repeat: no-repeat !important; " +
               "background-position: center center !important; " +
               "background-size: 80vh 80vh !important; " + 
               "color: #f2d378 !important; " +
               "font-family: 'KaiTi', 'STKaiti', 'Microsoft YaHei', serif !important; " +
               "overflow-x: hidden !important; " +
               "}\n";
        
        // Body:Before -> War Horse (Bottom Left)
        css += "body:before { " +
               "content: ''; position: fixed; " +
               "left: 1.4vw; bottom: 0vh; " +
               "width: 55vh; height: 55vh; " +
               "background-image: url('" + bgGallopUrl + "'); " +
               "background-repeat: no-repeat; " +
               "background-size: contain; " +
               "z-index: -1; " +
               "opacity: 1; " +
               "}\n";

        // Body:After -> Horse Head (Top Right)
        css += "body:after { " +
               "content: ''; position: fixed; " +
               "right: 1.5vw; top: 5vh; " +
               "width: 28vh; height: 28vh; " +
               "background-image: url('" + bgHeadUrl + "'); " +
               "background-repeat: no-repeat; " +
               "background-size: contain; " +
               "transform: rotate(0deg); " +
               "z-index: -1; " +
               "opacity: 1; " +
               "}\n";
       
       // Decorate Title
       css += "h1.title { color: #f2d378 !important; text-shadow: 0 2px 4px rgba(0,0,0,0.5); font-weight: normal; letter-spacing: 4px; }\n";
       css += "p, .game-intro, .game-explanation { color: #ffcc80 !important; }\n";

       // Game Container (Sandalwood / Dark Red) - TRANSPARENT as requested
       css += ".game-container { background: rgba(94, 13, 22, 0.3) !important; border: 4px solid rgba(212, 175, 55, 0.6); border-radius: 8px !important; box-shadow: 0 10px 40px rgba(0,0,0,0.3) !important; }\n";
       css += ".game-container .game-message { background: rgba(66, 8, 14, 0.78) !important; }\n";
       css += ".game-container .game-message p { color: #fffdf2 !important; text-shadow: 0 0 6px rgba(255, 231, 138, 0.95), 0 0 14px rgba(255, 205, 64, 0.8), 0 2px 2px rgba(120, 24, 24, 0.28); -webkit-text-stroke: 0; }\n";
       css += ".grid-cell { background: rgba(62, 8, 15, 0.25) !important; border: 1px solid rgba(122, 12, 30, 0.3); border-radius: 4px !important; box-shadow: none !important; border: none !important; }\n";

       // UI Elements
       css += ".score-container, .best-container { background: #5e0d16 !important; color: #f2d378 !important; border: 2px solid #d4af37; border-radius: 6px !important; box-shadow: 0 4px 10px rgba(0,0,0,0.4) !important; }\n";
       css += ".score-container:after, .best-container:after { color: #ffab91 !important; }\n";
       
       css += ".restart-button, .game-message a { background: #b71c1c !important; color: #f2d378 !important; border: 2px solid #f2d378 !important; border-radius: 20px !important; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important; background-image: linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(0,0,0,0.1)); }\n";
       css += ".restart-button:hover, .game-message a:hover { background: #d32f2f !important; transform: scale(1.05); }\n";
       css += ".top-action-btn { background: #5e0d16 !important; color: #f2d378 !important; border: 1px solid #b71c1c !important; box-shadow: inset 0 0 10px rgba(0,0,0,0.5); }\n";
    }
    
    if (theme.horse_year) {
         css += horseYearTileCss(theme, POW2_TILE_VALUES, "html[data-theme='horse_year']");
         css += horseYearTileCss(theme, FIB_TILE_VALUES, "html[data-theme='horse_year']");
    } else {
         css += tileCssForValues(theme, POW2_TILE_VALUES, "body:not([data-ruleset=\"fibonacci\"])");
         css += tileCssForValues(theme, FIB_TILE_VALUES, "body[data-ruleset=\"fibonacci\"]");
    }
    
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

  function getPreviewCss(themeId, options) {
    var theme = themes[themeId];
    if (!theme) return "";
    options = options || {};
    var pow2Selector = options.pow2Selector || "#theme-preview-grid";
    var fibSelector = options.fibSelector || options.pow2Selector || "#theme-preview-grid";
    var selectors = [pow2Selector, fibSelector];
    var uniqueSelectors = [];
    for (var si = 0; si < selectors.length; si++) {
      if (uniqueSelectors.indexOf(selectors[si]) === -1) uniqueSelectors.push(selectors[si]);
    }
    var css = "";
    var t = getUiTokens(theme);

    var tilesResetSelector = uniqueSelectors.map(function (sel) {
      return sel + " .theme-preview-tile";
    }).join(",");
    var afterResetSelector = uniqueSelectors.map(function (sel) {
      return sel + " .theme-preview-tile::after";
    }).join(",");
    css += tilesResetSelector + "{transform:none !important;clip-path:none !important;animation:none !important;background-image:none !important;border:none !important;border-radius:3px !important;box-shadow:none !important;text-shadow:none !important;font-family:inherit !important;}\n";
    css += afterResetSelector + "{content:none;background-image:none;opacity:0;}\n";

    // Default container style for preview
    for (var i = 0; i < uniqueSelectors.length; i++) {
      css += uniqueSelectors[i] + " { background: " + t.gameBg + " !important; box-shadow: " + t.shadow + "; border: 1px solid " + t.border + "; }\n";
    }
    
    // Theme-specific container overrides
    if (theme.horse_year) {
      for (i = 0; i < uniqueSelectors.length; i++) {
        css += uniqueSelectors[i] + " { background: #5e0d16 !important; border: 2px solid #d4af37; box-shadow: inset 0 0 20px rgba(0,0,0,0.5); }\n";
      }
      var cloudPattern = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0yMCAzMGMtNS41IDAtMTAuNS00LjUtMTAuNS0xMFMyMCAxNSAyMCAxNXQxMC41IDUuNVMzMi41IDMwIDIwIDMweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZDRhZjM3IiBzdHJva2Utb3BhY2l0eT0iMC4xIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+";
      for (i = 0; i < uniqueSelectors.length; i++) {
        css += uniqueSelectors[i] + " { background-image: url('" + cloudPattern + "'); }\n";
      }
    }
    if (theme.neon) {
      for (i = 0; i < uniqueSelectors.length; i++) {
        css += uniqueSelectors[i] + " { box-shadow: 0 0 0 1px " + rgba(t.border, 0.6) + ",0 0 18px " + rgba(colorForIndex(theme, 0, theme.colors.length), 0.22) + ",0 10px 28px rgba(6,8,18,0.52); } \n";
      }
    }

    // Tiles
    if (theme.horse_year) {
      css += horseYearTileCss(theme, POW2_TILE_VALUES, pow2Selector);
      css += horseYearTileCss(theme, FIB_PREVIEW_VALUES, fibSelector);
    } else {
      css += tileCssForValues(theme, POW2_TILE_VALUES, pow2Selector);
      css += tileCssForValues(theme, FIB_PREVIEW_VALUES, fibSelector);
    }

    return css;
  }
  
  function horseYearTileCss(theme, values, scopeSelector) {
      var css = "";
      // Assets
      var horseIcon = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzViMTAwZSI+PHBhdGggZD0iTTE4LCAzIEMxNi41LCAzLCAxNS41LCAzLjUsIDE0LjUsIDQgQzEzLjUsIDQuNSwgMTIuNSwgNSwgMTEuNSwgNSBDMTAuNSwgNSwgOS41LCA0LjUsIDguNSwgNCBDNy41LCAzLjUsIDYuNSwgMywgNSwgMyBMNSwgNSBDNiwgNSwgNywgNS41LCA4LCA2IEM5LCA2LjUsIDEwLCA3LCAxMSw3IEMxMiw3LCAxMywgNi41LCAxNCwgNiBDMTUsIDUuNSwgMTYsIDUsIDE3LCA1IEwxOCwgMyBaIE02LCA4IEM1LCA4LCA0LCA4LjUsIDMsIDkgQzIsIDkuNSwgMSwgMTAsIDAsIDEwIEwwLCAxMiBDMSwgMTIsIDIsIDExLjUsIDMsIDExIEM0LCAxMC41LCA1LCAxMCwgNiwgMTAgQzcsIDEwLCA4LCAxMC41LCA5LCAxMSBDMTAsIDExLjUsIDExLCAxMiwgMTIsIDEyIEwxMiwgMTAgQzExLCAxMCwgMTAsIDkuNSwgOSwgOSBDOCwgOC41LCA3LCA4LCA2LCA4IFogTTIwLCAxMiBDMTksIDEyLCAxOCwgMTIuNSwgMTcsIDEzIEMxNiwgMTMuNSwgMTUsIDE0LCAxNCwgMTQgQzEzLCAxNCwgMTIsIDEzLjUsIDExLCAxMyBDMTAsIDEyLjUsIDksIDEyLCA4LCAxMiBMOCwgMTQgQzksIDE0LCAxMCwgMTQuNSwgMTEsIDE1IEMxMiwgMTUuNSwgMTMsIDE2LCAxNCwgMTYgQzE1LCAxNiwgMTYsIDE1LjUsIDE3LCAxNSBDMTgsIDE0LjUsIDE5LCAxNCwgMjAsIDE0IEwyMCwgMTIgWiIvPjwvc3ZnPg==";


      for (var i = 0; i < values.length; i++) {
        var val = values[i];
        var base = colorForIndex(theme, i, values.length);
        var text = tileTextColor(i, theme.lightTextFrom);
        
        // Base selector construction
        var tileSelector = scopeSelector ? (scopeSelector + " .tile.tile-" + val + " .tile-inner") : (".tile.tile-" + val + " .tile-inner");
        var previewSelector = scopeSelector ? (scopeSelector + " .theme-preview-tile.theme-color-" + val) : (".theme-preview-tile.theme-color-" + val);
        
        var combinedSelector = tileSelector + "," + previewSelector;

        css += combinedSelector + " { ";
        css += "color: " + text + " !important;";
        css += "border-radius: 4px !important;";
        css += "font-family: 'KaiTi', 'STKaiti', serif !important;";
        css += "font-weight: bold;";
        css += "box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;";

        // Special handling based on value
        if (val === 2048) {
            // 2048: Golden Horse
            css += "background: linear-gradient(135deg, #ffd700, #ffca28) !important;"; 
            css += "color: #5e0d16 !important;";
            css += "border: 2px solid #fff !important;";
            css += "box-shadow: 0 0 25px rgba(255, 215, 0, 0.6) !important;";
            css += "text-shadow: none !important;";
            css += "position: relative;";
            css += "z-index: 0;"; // Create stacking context
        } else {
            // All other values: Standard color with gradient
            css += "background-color: " + base + " !important;";
             if (val >= 128) {
                css += "border: 1px solid rgba(255,215,0, 0.3) !important;";
             } else {
                css += "border: 1px solid rgba(0,0,0,0.1) !important;";
             }
        }
        css += "}\n"; // End of main block

        // 2048 Pseudo-element for icon (needs separate rule block)
        if (val === 2048) {
            var afterSelector = scopeSelector ? (scopeSelector + " .tile.tile-" + val + " .tile-inner::after") : (".tile.tile-" + val + " .tile-inner::after");
            var previewAfterSelector = scopeSelector ? (scopeSelector + " .theme-preview-tile.theme-color-" + val + "::after") : (".theme-preview-tile.theme-color-" + val + "::after");
            
            css += afterSelector + "," + previewAfterSelector + " { ";
            css += "content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;";
            css += "background-image: url('" + horseIcon + "');";
            css += "background-repeat: no-repeat; background-position: center; background-size: 80%;";
            css += "opacity: 0.8; z-index: -1; pointer-events: none;";
            css += "}\n";
            
            // z-index adjustment for text not needed if we rely on stacking context of parent
            // But to be safe, treat children (text) as higher
            css += combinedSelector + " > * { position: relative; z-index: 2; }\n";
        }
      }
      return css;
  }


  window.ThemeManager = {
    getPreviewCss: getPreviewCss,
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
