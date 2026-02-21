(function () {
  var STORAGE_KEY = "local_game_history_v1";
  var MAX_RECORDS = 5000;

  function safeParse(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch (_err) {
      return fallback;
    }
  }

  function readAll() {
    try {
      var parsed = safeParse(localStorage.getItem(STORAGE_KEY) || "[]", []);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_err) {
      return [];
    }
  }

  function writeAll(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function makeId() {
    var t = Date.now().toString(36);
    var r = Math.random().toString(36).slice(2, 10);
    return "lh_" + t + "_" + r;
  }

  function normalizeRecord(raw) {
    raw = raw || {};
    var modeKey = typeof raw.mode_key === "string" && raw.mode_key ? raw.mode_key : "unknown";
    var endedAt = typeof raw.ended_at === "string" && raw.ended_at ? raw.ended_at : nowIso();
    var replayString = typeof raw.replay_string === "string"
      ? raw.replay_string
      : (raw.replay ? JSON.stringify(raw.replay) : "");

    return {
      id: typeof raw.id === "string" && raw.id ? raw.id : makeId(),
      mode: raw.mode || "local",
      mode_key: modeKey,
      board_width: Number.isInteger(raw.board_width) ? raw.board_width : 4,
      board_height: Number.isInteger(raw.board_height) ? raw.board_height : 4,
      ruleset: raw.ruleset || "pow2",
      undo_enabled: !!raw.undo_enabled,
      ranked_bucket: raw.ranked_bucket || "none",
      mode_family: raw.mode_family || "pow2",
      rank_policy: raw.rank_policy || "unranked",
      special_rules_snapshot: raw.special_rules_snapshot && typeof raw.special_rules_snapshot === "object"
        ? raw.special_rules_snapshot
        : {},
      challenge_id: raw.challenge_id || null,
      score: Number.isFinite(raw.score) ? Math.floor(raw.score) : 0,
      best_tile: Number.isFinite(raw.best_tile) ? Math.floor(raw.best_tile) : 0,
      duration_ms: Number.isFinite(raw.duration_ms) ? Math.max(0, Math.floor(raw.duration_ms)) : 0,
      final_board: Array.isArray(raw.final_board) ? raw.final_board : [],
      ended_at: endedAt,
      saved_at: typeof raw.saved_at === "string" && raw.saved_at ? raw.saved_at : nowIso(),
      end_reason: raw.end_reason || "game_over",
      client_version: raw.client_version || "1.8",
      replay: raw.replay && typeof raw.replay === "object" ? raw.replay : null,
      replay_string: replayString
    };
  }

  function sortDesc(records) {
    records.sort(function (a, b) {
      var ta = Date.parse(a && a.ended_at ? a.ended_at : "") || 0;
      var tb = Date.parse(b && b.ended_at ? b.ended_at : "") || 0;
      if (tb !== ta) return tb - ta;
      var sa = Date.parse(a && a.saved_at ? a.saved_at : "") || 0;
      var sb = Date.parse(b && b.saved_at ? b.saved_at : "") || 0;
      return sb - sa;
    });
    return records;
  }

  function saveRecord(record) {
    var list = readAll();
    var item = normalizeRecord(record);
    list.unshift(item);
    if (list.length > MAX_RECORDS) list = list.slice(0, MAX_RECORDS);
    writeAll(list);
    return item;
  }

  function getById(id) {
    var list = readAll();
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].id === id) return list[i];
    }
    return null;
  }

  function deleteById(id) {
    var list = readAll();
    var next = [];
    var removed = false;
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (!removed && item && item.id === id) {
        removed = true;
        continue;
      }
      next.push(item);
    }
    if (removed) writeAll(next);
    return removed;
  }

  function clearAll() {
    writeAll([]);
  }

  function listRecords(options) {
    options = options || {};
    var modeKey = options.mode_key || "";
    var keyword = (options.keyword || "").toLowerCase();
    var sortBy = options.sort_by || "ended_desc";
    var page = Number.isInteger(options.page) && options.page > 0 ? options.page : 1;
    var pageSize = Number.isInteger(options.page_size) && options.page_size > 0
      ? Math.min(options.page_size, 500)
      : 50;

    var list = readAll();
    var filtered = [];
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (!item) continue;
      if (modeKey && item.mode_key !== modeKey) continue;
      if (keyword) {
        var haystack = [
          item.id,
          item.mode_key,
          item.mode,
          String(item.score),
          String(item.best_tile),
          item.ruleset,
          item.challenge_id || ""
        ].join(" ").toLowerCase();
        if (haystack.indexOf(keyword) === -1) continue;
      }
      filtered.push(item);
    }

    if (sortBy === "score_desc") {
      filtered.sort(function (a, b) {
        if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
        var ta = Date.parse(a.ended_at || "") || 0;
        var tb = Date.parse(b.ended_at || "") || 0;
        return tb - ta;
      });
    } else if (sortBy === "ended_asc") {
      filtered.sort(function (a, b) {
        var ta = Date.parse(a.ended_at || "") || 0;
        var tb = Date.parse(b.ended_at || "") || 0;
        return ta - tb;
      });
    } else {
      sortDesc(filtered);
    }

    var total = filtered.length;
    var start = (page - 1) * pageSize;
    var end = start + pageSize;
    return {
      total: total,
      page: page,
      page_size: pageSize,
      items: filtered.slice(start, end)
    };
  }

  function exportRecords(ids) {
    var source = readAll();
    var selected;
    if (Array.isArray(ids) && ids.length) {
      var idSet = {};
      for (var i = 0; i < ids.length; i++) idSet[String(ids[i])] = true;
      selected = [];
      for (var j = 0; j < source.length; j++) {
        if (source[j] && idSet[source[j].id]) selected.push(source[j]);
      }
    } else {
      selected = source;
    }

    return JSON.stringify({
      v: 1,
      exported_at: nowIso(),
      count: selected.length,
      records: selected
    }, null, 2);
  }

  function importRecords(text, options) {
    options = options || {};
    var merge = options.merge !== false;

    var parsed = safeParse(text, null);
    if (!parsed) throw new Error("invalid_json");

    var incoming = [];
    if (Array.isArray(parsed)) incoming = parsed;
    else if (parsed && Array.isArray(parsed.records)) incoming = parsed.records;
    else throw new Error("invalid_payload");

    var normalized = [];
    for (var i = 0; i < incoming.length; i++) {
      normalized.push(normalizeRecord(incoming[i]));
    }

    var before = readAll();
    var map = {};
    if (merge) {
      for (var b = 0; b < before.length; b++) {
        var oldItem = before[b];
        if (oldItem && oldItem.id) map[oldItem.id] = oldItem;
      }
    }

    var imported = 0;
    var replaced = 0;
    for (var n = 0; n < normalized.length; n++) {
      var item = normalized[n];
      if (map[item.id]) replaced += 1;
      else imported += 1;
      map[item.id] = item;
    }

    var next = [];
    for (var k in map) {
      if (Object.prototype.hasOwnProperty.call(map, k)) next.push(map[k]);
    }
    sortDesc(next);
    if (next.length > MAX_RECORDS) next = next.slice(0, MAX_RECORDS);
    writeAll(next);

    return {
      imported: imported,
      replaced: replaced,
      total: next.length
    };
  }

  function download(filename, content) {
    if (typeof document === "undefined") return;
    var blob = new Blob([content], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 300);
  }

  window.LocalHistoryStore = {
    saveRecord: saveRecord,
    getById: getById,
    deleteById: deleteById,
    clearAll: clearAll,
    listRecords: listRecords,
    exportRecords: exportRecords,
    importRecords: importRecords,
    download: download,
    getAll: readAll
  };
})();
