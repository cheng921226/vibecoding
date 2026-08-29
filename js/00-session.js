// Session & reproducibility layer — InputSpec / ResultSpec / export-import
// 可回朔最小閉環：結構化輸入快照、演算法版本、參數、inputHash、session 匯出／匯入

const SOFTWARE_ID = 'Linkage六連桿選型評估';
const SOFTWARE_BUILD = '2026.08.23-commercial-session';
const ALGORITHM_VERSIONS = {
  'ui-geometry': '1.0.0',
  'nine-type-identification': '1.0.0',
  'numerical-solver': '1.0.0',
  'circuit-branch': '1.0.0',
  'geometry-validation': '1.0.0',
  'results-animation': '1.0.0',
  'function-recommendation': '1.0.0',
  session: '1.0.0'
};

const SEARCH_NOTE =
  '採確定性多重初值搜尋；結果為在設定範圍與容許值下找到的候選，不保證代數上的全部實根。';

function sessionNowIso() {
  try {
    return new Date().toISOString();
  } catch (e) {
    return String(Date.now());
  }
}

/** Session ID：機構型號-年月日時間，例如 SIIIB4-20260823-182600 */
function formatSessionStamp(d) {
  const x = d instanceof Date && !isNaN(d) ? d : new Date();
  const p = n => String(n).padStart(2, '0');
  return (
    x.getFullYear() +
    p(x.getMonth() + 1) +
    p(x.getDate()) +
    '-' +
    p(x.getHours()) +
    p(x.getMinutes()) +
    p(x.getSeconds())
  );
}

function buildSessionId(modelId, when) {
  const mid = String(modelId || 'UNKNOWN').replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'UNKNOWN';
  return mid + '-' + formatSessionStamp(when || new Date());
}

function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}

function simpleHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ('00000000' + (h >>> 0).toString(16)).slice(-8);
}

function readSolverOptionsFromDom() {
  const num = id => {
    const el = $(id);
    return el ? +el.value : NaN;
  };
  return {
    tol: num('solveTol'),
    maxIter: num('maxIter'),
    step: num('stepAngle'),
    minStep: num('minStep'),
    startAngle: num('startAngle'),
    endAngle: num('endAngle'),
    initial: num('initialAngle'),
    singularTol: num('singularTol'),
    endpointTol: num('endpointTol'),
    geoTol: num('geoTol') || 0.001
  };
}

function applySolverOptionsToDom(o) {
  if (!o) return;
  const map = {
    solveTol: 'tol',
    maxIter: 'maxIter',
    stepAngle: 'step',
    minStep: 'minStep',
    startAngle: 'startAngle',
    endAngle: 'endAngle',
    initialAngle: 'initial',
    singularTol: 'singularTol',
    endpointTol: 'endpointTol',
    geoTol: 'geoTol'
  };
  Object.entries(map).forEach(([domId, key]) => {
    const el = $(domId);
    if (el && o[key] != null && Number.isFinite(+o[key])) el.value = o[key];
  });
}

function collectSpecifiedFromDom() {
  if (typeof specified === 'function') return specified();
  return [...document.querySelectorAll('.position')].map(r => ({
    name: r.querySelector('.posName')?.value || '',
    angle: +(r.querySelector('.posAngle')?.value || 0)
  }));
}

function getTaskMode() {
  const checked = document.querySelector('input[name="taskMode"]:checked');
  return checked ? checked.value : 'branch';
}

/** 組裝正式 InputSpec（與 DOM 解耦後的分析契約） */
function buildInputSpec() {
  const solver = readSolverOptionsFromDom();
  const coordinates = typeof C !== 'undefined' ? clone(C) : {};
  const specifiedPositions = collectSpecifiedFromDom();
  const input = {
    schema: 'linkage.input/v1',
    model: typeof selected !== 'undefined' ? selected : null,
    inputMode: typeof inputMode !== 'undefined' ? inputMode : 'polar',
    taskMode: getTaskMode(),
    coordinates,
    specifiedPositions,
    solver
  };
  input.inputHash = simpleHash(stableStringify({
    model: input.model,
    coordinates: input.coordinates,
    specifiedPositions: input.specifiedPositions,
    solver: input.solver
  }));
  return input;
}

function buildResultMeta(inputSpec) {
  const ts = new Date();
  const modelId = inputSpec?.model || (typeof selected !== 'undefined' ? selected : null);
  const sessionId = buildSessionId(modelId, ts);
  return {
    schema: 'linkage.meta/v1',
    softwareId: SOFTWARE_ID,
    softwareBuild: SOFTWARE_BUILD,
    sessionId,
    algorithmVersions: { ...ALGORITHM_VERSIONS },
    timestamp: ts.toISOString(),
    inputHash: inputSpec?.inputHash || null,
    searchNote: SEARCH_NOTE,
    disclaimer:
      '依《平面六連桿機構之迴路與分支辨識》與《平面六連桿機構之分支辨識》論文方法建置。本軟體僅供工程輔助選型與數值分析參考，不構成設計、製造或安全上之保證。功能推薦結果不保證枚舉全部實根。使用者應依適用之設計規範、標準與實務自行驗證後採用。本團隊不負擔任何直接或間接之法律責任。'
  };
}

/**
 * 以 InputSpec 執行分析（必要時同步 DOM 參數），回傳 ResultSpec
 * 既有 analyze 核心邏輯不變，僅包裝可回朔契約。
 */
function analyzeWithSpec(inputSpec) {
  const spec = inputSpec || buildInputSpec();
  if (spec.model && typeof selected !== 'undefined' && spec.model !== selected) {
    selected = spec.model;
    if (typeof init === 'function') init();
  }
  if (spec.coordinates && typeof C !== 'undefined') {
    C = clone(spec.coordinates);
    if (typeof renderGeometryInputs === 'function') renderGeometryInputs();
    if (typeof renderLengths === 'function') renderLengths();
  }
  if (spec.solver) applySolverOptionsToDom(spec.solver);
  if (Array.isArray(spec.specifiedPositions) && typeof addPos === 'function') {
    const host = $('positions');
    if (host) {
      host.innerHTML = '';
      if (typeof posNo !== 'undefined') posNo = 0;
      spec.specifiedPositions.forEach(p => addPos(p.angle, p.name));
    }
  }

  const core = analyze();
  // 保留完整 core 供 UI（含 branch.samples、refBranch 物件參考）
  if (core && !core.searchNote) core.searchNote = SEARCH_NOTE;
  const meta = buildResultMeta(spec);
  const result = {
    schema: 'linkage.result/v1',
    meta,
    input: {
      model: spec.model,
      inputHash: spec.inputHash,
      solver: spec.solver || core.o,
      coordinates: spec.coordinates,
      specifiedPositions: spec.specifiedPositions
    },
    // 直接引用完整分析物件，避免破壞 UI 依賴的物件參考
    analysis: core,
    quality: summarizeQuality(core),
    // 匯出用精簡快照（序列化時去掉過大或循環風險欄位由 buildSession 處理）
    analysisExport: serializeAnalysisForExport(core)
  };
  return result;
}

function serializeAnalysisForExport(core) {
  if (!core) return null;
  return {
    o: core.o,
    samples: core.samples,
    dead: core.dead,
    verifiedDeadCount: core.verifiedDeadCount,
    circuits: core.circuits,
    branches: (core.branches || []).map(b => ({
      id: b.id,
      circuit: b.circuit,
      from: b.from,
      to: b.to,
      key: b.key,
      endpoint: b.endpoint,
      trend: b.trend,
      samples: b.samples
    })),
    refBranch: core.refBranch
      ? {
          id: core.refBranch.id,
          circuit: core.refBranch.circuit,
          from: core.refBranch.from,
          to: core.refBranch.to,
          key: core.refBranch.key
        }
      : null,
    specified: core.specified,
    constraints: core.constraints,
    limitCircle: core.limitCircle,
    searchNote: core.searchNote || SEARCH_NOTE
  };
}

function sampleResidual(s) {
  if (!s) return 0;
  if (s.residual != null && Number.isFinite(s.residual)) return s.residual;
  if (s.res != null && Number.isFinite(s.res)) return s.res;
  return 0;
}

function summarizeQuality(core) {
  // 追蹤樣本多半寫在 res；指定位置／死點則用 residual
  const residualMax =
    core.samples && core.samples.length
      ? Math.max(...core.samples.map(sampleResidual))
      : null;
  const sigmaMin =
    core.samples && core.samples.length
      ? Math.min(...core.samples.map(s => (Number.isFinite(s.sigma) ? s.sigma : Infinity)))
      : null;
  return {
    sampleCount: core.samples ? core.samples.length : 0,
    circuitCount: core.circuits ? core.circuits.length : 0,
    branchCount: core.branches ? core.branches.length : 0,
    verifiedDeadCount: core.verifiedDeadCount || 0,
    residualMax,
    sigmaMin: Number.isFinite(sigmaMin) ? sigmaMin : null,
    note: SEARCH_NOTE
  };
}

/** 完整可回朔 session（輸入 + 結果 + meta） */
function buildSession(resultSpec) {
  const input = resultSpec?.input ? resultSpec.input : buildInputSpec();
  const result = resultSpec || null;
  return {
    schema: 'linkage.session/v1',
    meta: result?.meta || buildResultMeta(input),
    input: {
      schema: 'linkage.input/v1',
      model: input.model,
      inputMode: typeof inputMode !== 'undefined' ? inputMode : 'polar',
      taskMode: getTaskMode(),
      coordinates: input.coordinates || (typeof C !== 'undefined' ? clone(C) : {}),
      specifiedPositions: input.specifiedPositions || collectSpecifiedFromDom(),
      solver: input.solver || readSolverOptionsFromDom(),
      inputHash: input.inputHash
    },
    result: result
      ? {
          schema: result.schema,
          quality: result.quality,
          analysis: result.analysisExport || serializeAnalysisForExport(result.analysis) || result.analysis
        }
      : null
  };
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function exportSession() {
  if (!analysis && !window.__lastResultSpec) {
    alert('尚無分析結果可匯出。請先執行分析。');
    return;
  }
  const resultSpec =
    window.__lastResultSpec ||
    (analysis
      ? {
          schema: 'linkage.result/v1',
          meta: buildResultMeta(buildInputSpec()),
          input: {
            model: selected,
            inputHash: null,
            solver: analysis.o,
            coordinates: clone(C),
            specifiedPositions: collectSpecifiedFromDom()
          },
          analysis: {
            o: analysis.o,
            samples: analysis.samples,
            dead: analysis.dead,
            verifiedDeadCount: analysis.verifiedDeadCount,
            circuits: analysis.circuits,
            branches: analysis.branches,
            refBranch: analysis.refBranch
              ? {
                  id: analysis.refBranch.id,
                  circuit: analysis.refBranch.circuit,
                  from: analysis.refBranch.from,
                  to: analysis.refBranch.to,
                  key: analysis.refBranch.key
                }
              : null,
            specified: analysis.specified,
            constraints: analysis.constraints,
            limitCircle: analysis.limitCircle,
            searchNote: analysis.searchNote
          },
          quality: summarizeQuality(analysis)
        }
      : null);
  const session = buildSession(resultSpec);
  const name = `${session.input.model || 'session'}-${(session.meta.timestamp || '').slice(0, 19).replace(/[:T]/g, '')}.json`;
  downloadJson(name, session);
}

function applySessionInput(input) {
  if (!input) return false;
  if (input.model && M[input.model]) {
    selected = input.model;
  }
  if (input.inputMode === 'polar' || input.inputMode === 'coordinate') {
    inputMode = input.inputMode;
    if (typeof setInputMode === 'function') setInputMode(inputMode);
  }
  if (input.taskMode && typeof setTaskMode === 'function') {
    setTaskMode(input.taskMode);
  }
  if (typeof init === 'function') init();
  if (input.coordinates) {
    C = clone(input.coordinates);
    if (typeof renderGeometryInputs === 'function') renderGeometryInputs();
    if (typeof renderLengths === 'function') renderLengths();
    if (typeof drawTopo === 'function') drawTopo();
    if (typeof valid === 'function') valid();
  }
  if (input.solver) applySolverOptionsToDom(input.solver);
  if (Array.isArray(input.specifiedPositions)) {
    const host = $('positions');
    if (host && typeof addPos === 'function') {
      host.innerHTML = '';
      if (typeof posNo !== 'undefined') posNo = 0;
      input.specifiedPositions.forEach(p => addPos(p.angle, p.name || ''));
    }
  }
  if (typeof renderCards === 'function') renderCards();
  return true;
}

function importSessionFromObject(data) {
  if (!data || typeof data !== 'object') throw new Error('無效的 session 檔');
  const input = data.input || data;
  if (!input.model && !input.coordinates) throw new Error('檔案缺少 model 或 coordinates');
  applySessionInput(input);

  // 若檔案含完整分析結果，還原到畫面；否則僅還原輸入供重跑
  if (data.result && data.result.analysis) {
    const a = data.result.analysis;
    const branches = a.branches || [];
    let refBranch = null;
    if (a.refBranch && branches.length) {
      refBranch = branches.find(b => b.id === a.refBranch.id && b.circuit === a.refBranch.circuit) || branches[0];
    } else if (branches.length) {
      refBranch = branches[0];
    }
    analysis = {
      o: a.o,
      samples: a.samples || [],
      dead: a.dead || [],
      verifiedDeadCount: a.verifiedDeadCount || 0,
      circuits: a.circuits || [],
      branches,
      refBranch,
      specified: a.specified || [],
      constraints: a.constraints || [],
      limitCircle: a.limitCircle,
      searchNote: a.searchNote || SEARCH_NOTE
    };
    window.__lastResultSpec = {
      schema: 'linkage.result/v1',
      meta: data.meta || buildResultMeta(input),
      input,
      analysis: a,
      quality: data.result.quality || summarizeQuality(analysis)
    };
    if (typeof fillSessionMetaStrip === 'function') fillSessionMetaStrip(window.__lastResultSpec);
    if (typeof update === 'function') update();
    if (typeof go === 'function') go(7);
  } else {
    analysis = null;
    window.__lastResultSpec = null;
    if (typeof go === 'function') go(2);
  }
  return true;
}

function importSessionFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        importSessionFromObject(data);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error || new Error('讀檔失敗'));
    reader.readAsText(file);
  });
}

function wireSessionUi() {
  const exportBtn = $('exportJson');
  if (exportBtn) {
    exportBtn.textContent = '匯出 Session';
    exportBtn.onclick = () => exportSession();
  }
  // 在結果頁標題列加入匯入
  const head = document.querySelector('section.page[data-page="7"] .head');
  if (head && !$('importSessionBtn')) {
    const wrap = document.createElement('div');
    wrap.className = 'session-actions';
    wrap.style.display = 'flex';
    wrap.style.gap = '8px';
    wrap.style.flexWrap = 'wrap';
    wrap.style.alignItems = 'center';

    const importBtn = document.createElement('button');
    importBtn.type = 'button';
    importBtn.id = 'importSessionBtn';
    importBtn.textContent = '匯入 Session';
    importBtn.className = '';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json,.json';
    fileInput.id = 'importSessionFile';
    fileInput.style.display = 'none';

    importBtn.onclick = () => fileInput.click();
    fileInput.onchange = () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      importSessionFromFile(f)
        .then(() => {
          fileInput.value = '';
        })
        .catch(err => {
          alert('匯入失敗：' + (err && err.message ? err.message : String(err)));
          fileInput.value = '';
        });
    };

    // 把既有 export 按鈕移入同一列
    if (exportBtn && exportBtn.parentElement === head) {
      head.removeChild(exportBtn);
    }
    wrap.appendChild(importBtn);
    wrap.appendChild(exportBtn || document.createElement('span'));
    wrap.appendChild(fileInput);
    head.appendChild(wrap);
  }
}
