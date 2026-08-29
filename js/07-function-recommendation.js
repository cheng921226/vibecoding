// Person 7 — Function-based mechanism recommendation V2.8
// 需求權重 × 九型能力矩陣 + 必要條件 + 風險修正 + 分項比較。
// 注意：能力值是「前置選型啟發式」，不是尺寸可行性的理論保證；最終仍須做尺寸合成與數值/幾何驗證。

const RECOMMEND_META = {
  SIT4: { family: 'S', roman: 'I', inputKind: 'T', group: '4' },
  SIIT5: { family: 'S', roman: 'II', inputKind: 'T', group: '5' },
  SIIB5: { family: 'S', roman: 'II', inputKind: 'B', group: '5' },
  SIIIB4: { family: 'S', roman: 'III', inputKind: 'B', group: '4' },
  SIIIB5: { family: 'S', roman: 'III', inputKind: 'B', group: '5' },
  WIB4: { family: 'W', roman: 'I', inputKind: 'B', group: '4' },
  WIT4: { family: 'W', roman: 'I', inputKind: 'T', group: '4' },
  WIIB4: { family: 'W', roman: 'II', inputKind: 'B', group: '4' },
  WIIT4: { family: 'W', roman: 'II', inputKind: 'T', group: '4' }
};

// 0~100：只用來做「構型前置選型」的相對能力輪廓。
// 九型在各運動學特徵（角度函數/快回/增力/緊湊性 vs 複雜軌跡/多姿態/避障/運動自由度）上具有清晰對比，拉開有感分數差距。
const MODEL_CAPABILITY = {
  SIT4:   { trajectory: 84, angle: 60, pose: 80, quick: 58, force: 68, obstacle: 80, continuous: 62, oscillating: 80, simpleInput: 35, compact: 64, analyzability: 82, motionFreedom: 80, robustness: 64 },
  SIIT5:  { trajectory: 90, angle: 52, pose: 88, quick: 54, force: 60, obstacle: 90, continuous: 52, oscillating: 75, simpleInput: 28, compact: 46, analyzability: 50, motionFreedom: 94, robustness: 48 },
  SIIB5:  { trajectory: 88, angle: 58, pose: 84, quick: 58, force: 64, obstacle: 88, continuous: 74, oscillating: 74, simpleInput: 84, compact: 52, analyzability: 56, motionFreedom: 88, robustness: 54 },
  SIIIB4: { trajectory: 95, angle: 66, pose: 92, quick: 65, force: 75, obstacle: 94, continuous: 90, oscillating: 80, simpleInput: 95, compact: 76, analyzability: 94, motionFreedom: 88, robustness: 82 },
  SIIIB5: { trajectory: 98, angle: 62, pose: 96, quick: 62, force: 66, obstacle: 98, continuous: 78, oscillating: 82, simpleInput: 86, compact: 48, analyzability: 54, motionFreedom: 100, robustness: 50 },
  WIB4:   { trajectory: 32, angle: 98, pose: 35, quick: 96, force: 95, obstacle: 28, continuous: 98, oscillating: 90, simpleInput: 98, compact: 96, analyzability: 96, motionFreedom: 45, robustness: 94 },
  WIT4:   { trajectory: 40, angle: 92, pose: 44, quick: 88, force: 86, obstacle: 35, continuous: 76, oscillating: 88, simpleInput: 40, compact: 74, analyzability: 84, motionFreedom: 58, robustness: 70 },
  WIIB4:  { trajectory: 30, angle: 95, pose: 38, quick: 90, force: 88, obstacle: 26, continuous: 90, oscillating: 96, simpleInput: 94, compact: 90, analyzability: 93, motionFreedom: 42, robustness: 90 },
  WIIT4:  { trajectory: 38, angle: 88, pose: 46, quick: 84, force: 82, obstacle: 36, continuous: 72, oscillating: 92, simpleInput: 38, compact: 70, analyzability: 82, motionFreedom: 56, robustness: 68 }
};

const FUNCTION_PRESETS = {
  gripper: { label: '夾持／夾爪', text: '夾爪先快速接近工件，最後慢速夾緊，希望工作端有較高機械利益。', focus: 'angle', motion: 'continuous', quick: true, force: true, obstacle: false, compact: true, simple: true, pose: false, nearDead: false },
  feeder: { label: '送料／搬運', text: '末端先往前送料，再抬起避開工件，最後快速回到起點。', focus: 'trajectory', motion: 'continuous', quick: true, force: false, obstacle: true, compact: false, simple: true, pose: false, nearDead: false },
  wiper: { label: '雨刷／擺臂', text: '馬達連續旋轉，輸出桿規律往復擺動，重視輸入角與輸出角關係。', focus: 'angle', motion: 'continuous', quick: false, force: false, obstacle: false, compact: true, simple: true, pose: false, nearDead: false },
  press: { label: '壓合／壓床', text: '工作端在行程末端需要低速與高機械利益，但要保留死點安全裕量。', focus: 'angle', motion: 'continuous', quick: false, force: true, obstacle: false, compact: true, simple: true, pose: false, nearDead: true },
  gait: { label: '步態／足端軌跡', text: '末端形成封閉步態軌跡，支撐段平順，回程需要抬腳並控制足端姿態。', focus: 'trajectory', motion: 'continuous', quick: false, force: false, obstacle: true, compact: false, simple: true, pose: true, nearDead: false },
  door: { label: '開關門／蓋板', text: '希望輸入旋轉轉換成特定輸出擺角，並控制開啟與關閉段的速度。', focus: 'angle', motion: 'any', quick: false, force: false, obstacle: false, compact: true, simple: true, pose: false, nearDead: false },
  custom: { label: '自訂功能', text: '', focus: 'auto', motion: 'any', quick: false, force: false, obstacle: false, compact: false, simple: true, pose: false, nearDead: false }
};

const METRIC_LABEL = { trajectory: '軌跡能力', angle: '角度函數', pose: '姿態能力', quick: '快回能力', force: '末端增力', obstacle: '避障塑形', continuous: '連續驅動', oscillating: '往復驅動', simpleInput: '輸入簡潔', compact: '緊湊性', analyzability: '分析便利', motionFreedom: '運動自由度', robustness: '設計穩健性' };

const FAMILY_LABEL = { S: 'Stephenson', W: 'Watt' };
const ROMAN_LABEL = { I: 'Ⅰ', II: 'Ⅱ', III: 'Ⅲ' };

/** 構型結構一句話：家族／型序／輸入型式／迴路側 */
function structureLabel(id) {
  const m = RECOMMEND_META[id];
  if (!m) return id;
  const fam = FAMILY_LABEL[m.family] || m.family;
  const roman = ROMAN_LABEL[m.roman] || m.roman;
  const input = m.inputKind === 'B' ? 'B 型二接頭輸入（曲柄驅動較直接）' : 'T 型三接頭輸入（同時約束多個迴路）';
  const side = m.group === '4' ? '輸入位於四連桿側（幾何交叉驗證較便利）' : '輸入位於五連桿側（分支／死點較依賴數值延續）';
  return `${fam}-${roman}｜${input}｜${side}`;
}

function structureShort(id) {
  const m = RECOMMEND_META[id];
  if (!m) return id;
  const fam = m.family === 'S' ? 'Stephenson' : 'Watt';
  return `${fam}-${ROMAN_LABEL[m.roman] || m.roman}｜輸入 ${m.inputKind}｜${m.group === '4' ? '四連桿側' : '五連桿側'}`;
}

/** 推薦卡：構型與輸入／輸出簡介（對使用者可讀） */
function modelIntro(id) {
  const meta = RECOMMEND_META[id];
  const mod = typeof M !== 'undefined' ? M[id] : null;
  if (!meta) return '';
  const fam = meta.family === 'S' ? 'Stephenson' : 'Watt';
  const roman = ROMAN_LABEL[meta.roman] || meta.roman;
  const inputKind = meta.inputKind === 'B'
    ? '二接頭桿（B）作輸入，較適合直接以曲柄／馬達驅動'
    : '三接頭桿（T）作輸入，同時參與多個迴路約束';
  const side = meta.group === '4'
    ? '輸入位於四連桿側，早期可用傳動角等幾何方式檢查'
    : '輸入位於五連桿側，迴路耦合較深，宜搭配數值追蹤';
  const ground = mod ? `固定桿 ${mod.g}` : '';
  const input = mod ? `輸入桿 ${mod.i}` : '';
  const role = mod && mod.d ? String(mod.d).replace(/<[^>]+>/g, '') : '';
  const lines = [];
  lines.push(`${fam}-${roman} 六連桿：${ground}，${input}。`);
  lines.push(inputKind + '；' + side + '。');
  if (role) lines.push(role);
  return lines.join('');
}



/** 只還原表單欄位，不觸發評分 */
function loadFunctionPreset(key) {
  const p = FUNCTION_PRESETS[key] || FUNCTION_PRESETS.custom;
  if ($('functionDescription')) $('functionDescription').value = p.text || '';
  if ($('functionFocus')) $('functionFocus').value = p.focus || 'auto';
  if ($('functionInputMotion')) $('functionInputMotion').value = p.motion || 'any';
  if ($('functionQuickReturn')) $('functionQuickReturn').checked = !!p.quick;
  if ($('functionHighForce')) $('functionHighForce').checked = !!p.force;
  if ($('functionObstacle')) $('functionObstacle').checked = !!p.obstacle;
  if ($('functionCompact')) $('functionCompact').checked = !!p.compact;
  if ($('functionSimpleInput')) $('functionSimpleInput').checked = !!p.simple;
  if ($('functionPose')) $('functionPose').checked = !!p.pose;
  if ($('functionAllowNearDead')) $('functionAllowNearDead').checked = !!p.nearDead;
  if ($('functionSimplePriority')) $('functionSimplePriority').value = 'prefer';
  if ($('functionGroup4Priority')) $('functionGroup4Priority').value = 'prefer';
  if ($('functionComplexity')) $('functionComplexity').value = key === 'gait' ? 'complex' : (key === 'custom' ? 'any' : 'simple');
  if ($('functionPreset')) $('functionPreset').value = FUNCTION_PRESETS[key] ? key : 'custom';
}

function normalizeFunctionText(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ') }
function hasAny(s, words) { return words.some(w => s.includes(w)) }
function inferFunctionIntent(text) {
  const s = normalizeFunctionText(text), flags = { trajectory: false, angle: false, pose: false, quick: false, force: false, obstacle: false, continuous: false, oscillating: false, simple: false, compact: false };
  flags.trajectory = hasAny(s, ['軌跡', '路徑', '直線', '送料', '搬運', '步態', '足端', '抬起', '抬升', '移動一個點', '末端點', 'track', 'path']);
  flags.angle = hasAny(s, ['角度', '輸出角', '擺動', '擺臂', '雨刷', '開門', '關門', '蓋板', '旋轉一根桿', '搖桿', 'angle', 'swing']);
  flags.pose = hasAny(s, ['姿態', '方向', '保持水平', '保持垂直', '夾爪方向', 'orientation', 'pose']);
  flags.quick = hasAny(s, ['快回', '快速回程', '回程快', '前慢後快', '先快後慢', '快速接近']);
  flags.force = hasAny(s, ['夾緊', '夾持', '壓合', '壓床', '增力', '高機械利益', '大力量', '省力', 'force', 'mechanical advantage']);
  flags.obstacle = hasAny(s, ['避障', '避開', '繞過', '抬起避開', '障礙']);
  flags.continuous = hasAny(s, ['連續旋轉', '馬達一直轉', '持續旋轉', '360', '一圈', 'continuous']);
  flags.oscillating = hasAny(s, ['往復輸入', '往復旋轉', '來回輸入']);
  flags.simple = hasAny(s, ['簡單', '容易加工', '好裝配', '直接接馬達']);
  flags.compact = hasAny(s, ['緊湊', '空間小', '空間有限', 'compact']);
  return flags;
}

function recommendationInput() {
  const inferred = inferFunctionIntent($('functionDescription')?.value || ''), focusSel = $('functionFocus')?.value || 'auto', motion = $('functionInputMotion')?.value || 'any';
  const focus = focusSel === 'auto' ? (inferred.trajectory && !inferred.angle ? 'trajectory' : inferred.angle && !inferred.trajectory ? 'angle' : inferred.pose ? 'pose' : inferred.trajectory ? 'trajectory' : 'balanced') : focusSel;
  return {
    description: $('functionDescription')?.value || '', focus,
    continuous: motion === 'continuous' || (motion === 'any' && inferred.continuous), oscillating: motion === 'oscillating' || (motion === 'any' && inferred.oscillating),
    quick: !!$('functionQuickReturn')?.checked || inferred.quick, force: !!$('functionHighForce')?.checked || inferred.force,
    obstacle: !!$('functionObstacle')?.checked || inferred.obstacle, compact: !!$('functionCompact')?.checked || inferred.compact,
    simple: !!$('functionSimpleInput')?.checked || inferred.simple, pose: !!$('functionPose')?.checked || inferred.pose,
    allowNearDead: !!$('functionAllowNearDead')?.checked,
    simplePriority: $('functionSimplePriority')?.value || 'ignore', group4Priority: $('functionGroup4Priority')?.value || 'ignore', complexity: $('functionComplexity')?.value || 'any'
  };
}

/**
 * 更穩的工程前置選型權重（v2）
 * 原則：
 * 1) 主需求主導但不「一票否決式」壓過其餘項（單項原始加權有上限）
 * 2) 最後正規化到總權重 = 100，分數可解釋為加權百分貢獻
 * 3) 規格確定度 → 分析／可驗證性；製造複雜 → 放寬簡潔／緊湊壓力，不直接加軌跡
 * 4) 連續旋轉 → 連續驅動能力 + 風險門檻（曲柄／滿周需後續驗證）
 */
const BASE_WEIGHTS = { analyzability: 6, robustness: 6 };
const WEIGHT_ITEM_CAP = 30; // 正規化前單一指標上限，避免複選後某一維度獨大

function buildWeights(req) {
  const w = { ...BASE_WEIGHTS };
  const add = (k, v) => { if (v) w[k] = (w[k] || 0) + v; };

  // —— 第1題：功能主軸（幅度收斂）——
  if (req.focus === 'trajectory') {
    add('trajectory', 28); add('motionFreedom', 8); add('obstacle', 4);
  } else if (req.focus === 'angle') {
    add('angle', 28); add('quick', 6); add('continuous', 4);
  } else if (req.focus === 'pose') {
    add('pose', 24); add('trajectory', 10); add('motionFreedom', 8);
  } else {
    // balanced / auto
    add('trajectory', 12); add('angle', 12); add('pose', 10); add('motionFreedom', 6);
  }

  // —— 第3題：性能（中等加權；姿態若已是 focus 則不再重疊加滿）——
  if (req.quick) add('quick', 12);
  if (req.force) { add('force', 12); add('robustness', 5); }
  if (req.obstacle) { add('obstacle', 14); add('trajectory', 6); }
  if (req.pose && req.focus !== 'pose') { add('pose', 10); add('motionFreedom', 4); }
  else if (req.pose && req.focus === 'pose') { add('pose', 4); } // 僅輕微強調「要保持」

  // —— 第2題：驅動型態 ——
  if (req.continuous) { add('continuous', 12); add('analyzability', 3); }
  if (req.oscillating) add('oscillating', 10);

  // —— 第3/4題：輸入簡潔（must 的硬條件在 hardChecks；此處只留軟權重）——
  if (req.simplePriority === 'must' || (req.simple && req.simplePriority !== 'ignore')) {
    add('simpleInput', req.simplePriority === 'must' ? 14 : 8);
  }
  if (req.compact) add('compact', 8);

  // —— 第5題：輸出規格確定度 → 可驗證／可分析（不與「必須四連桿側」混為同一語意）——
  // prefer：規格較清楚，提高分析便利；must：更強調可驗證；ignore：概念期不鎖
  if (req.group4Priority === 'must') add('analyzability', 14);
  else if (req.group4Priority === 'prefer') add('analyzability', 10);

  // —— 第6題：製造條件 ——
  // simple：偏向標準件 → 緊湊／簡潔／穩健
  // complex：允許更複雜構型 → 降低「必須簡潔」的相對壓力（加一點自由度），不直接拉高軌跡
  if (req.complexity === 'simple') {
    add('compact', 6); add('simpleInput', 4); add('robustness', 6);
  } else if (req.complexity === 'complex') {
    add('motionFreedom', 6); add('robustness', 2);
  }

  // 單項封頂
  Object.keys(w).forEach(k => { if (w[k] > WEIGHT_ITEM_CAP) w[k] = WEIGHT_ITEM_CAP; });

  // 正規化到總和 100（便於解讀與跨次比較）
  const sum = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  const norm = {};
  Object.entries(w).forEach(([k, v]) => { norm[k] = +(100 * v / sum).toFixed(2); });
  return norm;
}

function hardChecks(id, req) {
  const m = RECOMMEND_META[id], fails = [];
  // 驅動安裝「必須」對準可整圈軸 → 實務上要求 B 型二接頭輸入
  if (req.simplePriority === 'must' && m.inputKind !== 'B') {
    fails.push('必要條件：驅動需直接對準可整圈輸入軸時，輸入桿應為 B 型二接頭桿');
  }
  // 僅在明確 must 時要求四連桿側（預設引導題為 prefer/ignore，不會誤殺）
  if (req.group4Priority === 'must' && m.group !== '4') {
    fails.push('必要條件：規格已鎖定且要求高可驗證性時，偏好輸入位於四連桿側');
  }
  return fails;
}

function riskAdjust(id, req) {
  const m = RECOMMEND_META[id], c = MODEL_CAPABILITY[id], notes = []; let penalty = 0;
  if (req.focus === 'trajectory' && c.trajectory < 62) {
    penalty += 10; notes.push('主需求偏軌跡，此構型前置軌跡輪廓偏低，尺寸階段需更積極的耦桿點與桿長迭代');
  }
  if (req.focus === 'angle' && c.angle < 72) {
    penalty += 10; notes.push('主需求偏角函數，此構型角度生成輪廓有限，θ_out–θ_in 可能不易貼近規格');
  }
  if (req.obstacle && c.obstacle < 62) {
    penalty += 9; notes.push('避障／抬升需求下，此構型前置避障輪廓偏低');
  }
  if ((req.pose || req.focus === 'pose') && c.pose < 62) {
    penalty += 9; notes.push('姿態需求下，此構型姿態設計自由度偏緊');
  }
  if (req.force) {
    const gap = Math.max(0, 72 - (c.robustness || 50));
    penalty += gap * 0.12;
    notes.push(req.allowNearDead
      ? '增力可接近死點附近，但仍須以最小傳動角與奇異門檻設硬限制'
      : '增力需求下應避免以死點為工作點，並檢查傳動角與條件數');
  }
  if (req.continuous) {
    if (c.continuous < 70) {
      penalty += 8; notes.push('需要連續整圈輸入時，須驗證曲柄存在條件與目標尺寸下能否滿周運轉');
    } else {
      notes.push('連續旋轉假設下，仍建議以數值掃描確認無鎖死區間');
    }
    if (m.group === '5') {
      penalty += 3; notes.push('五連桿側＋連續輸入時，分支對初始構形較敏感，需多重初值驗證');
    }
  }
  if (m.inputKind === 'T' && (req.simple || req.simplePriority === 'must')) {
    penalty += (req.simplePriority === 'must' ? 8 : 3);
    notes.push('T 型輸入同時約束多迴路，與「簡單直接驅動」目標存在結構性張力');
  }
  if (req.group4Priority === 'prefer' && m.group === '5') {
    penalty += 2;
    notes.push('輸出規格已較明確時，五連桿側輸入的早期幾何驗證較不方便，建議預留完整數值分析時程');
  }
  if (m.group === '5' && !notes.some(n => n.includes('五連桿'))) {
    notes.push('五連桿側輸入的分支／死點判斷宜以數值延續為主');
  }
  // 扣分上限，避免風險項把排名打亂成「只看懲罰」
  penalty = Math.min(penalty, 22);
  return { penalty, notes };
}

function scoreMechanism(id, req, weights) {
  const cap = MODEL_CAPABILITY[id], hardFail = hardChecks(id, req), parts = []; let sum = 0, ws = 0;
  Object.entries(weights).forEach(([k, w]) => { let v = cap[k] ?? 50; sum += v * w; ws += w; parts.push({ key: k, label: METRIC_LABEL[k] || k, value: v, weight: w, contribution: v * w }); });
  const base = ws ? sum / ws : 50, risk = riskAdjust(id, req);
  let finalScore = base - risk.penalty;
  if (hardFail.length) finalScore = Math.min(finalScore, 48);
  const score = Math.max(0, Math.min(100, Math.round(finalScore)));
  parts.sort((a, b) => b.weight - a.weight);
  return { id, score, base: +base.toFixed(1), hardFail, risk: risk.notes, parts, weights, cap };
}

function recommendTieBreak(a, b) {
  const ma = RECOMMEND_META[a.id], mb = RECOMMEND_META[b.id];
  if (ma.inputKind !== mb.inputKind) return ma.inputKind === 'B' ? -1 : 1;
  if (ma.group !== mb.group) return ma.group === '4' ? -1 : 1;
  return a.id.localeCompare(b.id);
}
// hardFail 為主排序鍵：不符合必要條件者一律排在合格者之後，不會因分數(封頂49)高於某個低分合格者而插隊。
function recommendModels(req) { const w = buildWeights(req); return Object.keys(RECOMMEND_META).map(id => scoreMechanism(id, req, w)).sort((a, b) => (a.hardFail.length - b.hardFail.length) || (b.score - a.score) || recommendTieBreak(a, b)); }

function reqSummary(req) {
  const q = [req.focus === 'trajectory' ? '末端軌跡' : req.focus === 'angle' ? '輸入角→輸出角' : req.focus === 'pose' ? '位置＋姿態' : '綜合需求'];
  if (req.continuous) q.push('連續旋轉輸入'); if (req.oscillating) q.push('往復輸入'); if (req.quick) q.push('快回／非均勻速度'); if (req.force) q.push('末端增力'); if (req.obstacle) q.push('避障'); if (req.pose) q.push('姿態要求'); if (req.simple) q.push(`簡單輸入(${req.simplePriority === 'must' ? '必要' : '偏好'})`); if (req.compact) q.push('緊湊'); if (req.group4Priority !== 'ignore') q.push(`四連桿側輸入(${req.group4Priority === 'must' ? '必要' : '偏好'})`); return q.join('、');
}
function confidenceLabel(gap) {
  if (gap >= 18) return '高｜第一名在加權適配上明顯領先，可優先進入尺寸合成';
  if (gap >= 10) return '中高｜第一名有穩定領先，仍建議以工作區間複核第二名';
  if (gap >= 5) return '中｜領先幅度有限，請以指定位置與傳動角條件交叉確認';
  return '低｜前兩名加權總分接近，不宜只憑分數定案，應並行尺寸與可達性驗證';
}

function strongestParts(x, n = 3) {
  return x.parts.filter(p => p.weight >= 8).sort((a, b) => (b.value * b.weight) - (a.value * a.weight)).slice(0, n);
}
function weakestParts(x, n = 2) {
  return x.parts.filter(p => p.weight >= 8).sort((a, b) => a.value - b.value).slice(0, n);
}

/** 相對同組／相對對照：找出真正拉開差距的指標 */
function distinctiveParts(x, peers, n = 3) {
  if (!x || !x.cap) return [];
  const pool = (peers || []).filter(p => p && p.id !== x.id && p.cap);
  const keys = Object.keys(x.cap);
  const scored = keys.map(k => {
    const v = x.cap[k] ?? 50;
    let peerAvg = 50;
    if (pool.length) {
      peerAvg = pool.reduce((s, p) => s + (p.cap[k] ?? 50), 0) / pool.length;
    }
    const w = (x.weights && x.weights[k]) || (x.parts.find(p => p.key === k)?.weight) || 0;
    const delta = v - peerAvg;
    // 權重存在時略加重，但仍允許結構性強項浮出
    const rank = delta * (1 + Math.min(w, 40) / 40);
    return { key: k, label: METRIC_LABEL[k] || k, value: v, delta: +delta.toFixed(1), weight: w, rank };
  });
  return scored.filter(s => s.delta >= 4).sort((a, b) => b.rank - a.rank).slice(0, n);
}

function structuralEdge(id) {
  const m = RECOMMEND_META[id];
  if (!m) return [];
  const edges = [];
  if (m.inputKind === 'B') edges.push('B 型輸入有利於以單一曲柄／馬達直接驅動，裝配與控制介面較單純');
  else edges.push('T 型輸入同時參與多個閉迴路約束，尺寸合成自由度較高，但驅動與裝配耦合較強');
  if (m.group === '4') edges.push('輸入在四連桿側，可用傳動角與速度瞬心做幾何交叉驗證，縮短早期篩選時間');
  else edges.push('輸入在五連桿側，迴路耦合較深，分支與死點判斷宜以數值延續為主、幾何指標為輔');
  if (m.family === 'S') edges.push('Stephenson 拓樸偏向複雜軌跡與多姿態工作端，適合路徑／姿態主導的功能');
  else edges.push('Watt 拓樸偏向清楚的角度傳遞與快回／增力區間，適合角函數與負載主導的功能');
  return edges;
}

function compareReason(a, b) {
  if (!b) return '目前沒有第二候選可比較。';
  const diffs = a.parts.map(p => ({
    label: p.label,
    key: p.key,
    d: (a.cap[p.key] ?? 50) - (b.cap[p.key] ?? 50),
    w: p.weight
  })).filter(x => x.w >= 6).sort((x, y) => Math.abs(y.d) * y.w - Math.abs(x.d) * x.w);

  const ma = RECOMMEND_META[a.id], mb = RECOMMEND_META[b.id];
  const structBits = [];
  if (ma && mb) {
    if (ma.inputKind !== mb.inputKind) {
      structBits.push(ma.inputKind === 'B'
        ? '輸入型式為 B（二接頭），驅動介面較直接'
        : '輸入型式為 T（三接頭），幾何耦合較深');
    }
    if (ma.group !== mb.group) {
      structBits.push(ma.group === '4'
        ? '輸入位於四連桿側，較利於早期幾何驗證'
        : '輸入位於五連桿側，需更完整的分支／死點數值追蹤');
    }
    if (ma.family !== mb.family) {
      structBits.push(ma.family === 'S' ? 'Stephenson 拓樸較利於軌跡／姿態塑形' : 'Watt 拓樸較利於角函數與快回／增力');
    }
  }

  const pos = diffs.filter(d => d.d > 2).slice(0, 2);
  const neg = diffs.filter(d => d.d < -2).slice(0, 1);
  const metricBits = [];
  if (pos.length) metricBits.push('能力矩陣上領先於「' + pos.map(d => `${d.label}（+${d.d.toFixed(0)}）`).join('、') + '」');
  if (neg.length) metricBits.push('相對落後於「' + neg.map(d => `${d.label}（${d.d.toFixed(0)}）`).join('、') + '」');

  if (!structBits.length && !metricBits.length) {
    return '與第二名在加權輪廓上接近；最終差異取決於實際桿長、工作區間與傳動角約束，不宜只依總分取捨。';
  }
  const parts = [];
  if (structBits.length) parts.push('結構面：' + structBits.join('；'));
  if (metricBits.length) parts.push('指標面：' + metricBits.join('；'));
  return parts.join(' ');
}

function designStrategy(x, req) {
  const m = RECOMMEND_META[x.id], steps = [];
  steps.push(`確認拓樸假設：${structureShort(x.id)}；固定桿與輸入桿與文件定義一致後再進入尺寸。`);
  if (req.focus === 'trajectory' || req.obstacle) {
    steps.push('指定工作端耦桿點，建立完整輸入角掃描軌跡；量化工作段、回程段與避障裕量，而不是只對單一點。');
  }
  if (req.focus === 'angle') {
    steps.push('建立 θ_out–θ_in 曲線，檢查工作行程的角度增益、速度比與是否出現平台段或回擺。');
  }
  if (req.pose) {
    steps.push('末端方位角與位置一併列為指定條件；避免只匹配點座標而忽略姿態分支。');
  }
  if (req.force) {
    steps.push(req.allowNearDead
      ? '增力區可接近死點附近取得機械利益，但必須以最小傳動角與奇異門檻設硬限制，禁止跨入奇異構形。'
      : '增力需求下仍避免以死點作為工作位置；以傳動角與 Jacobian 條件數設安全裕量。');
  }
  if (m.group === '4') {
    steps.push('優先用核心四連桿的傳動角與速度瞬心 I₁₃ 做幾何交叉驗證，再與數值分支結果對讀。');
  } else {
    steps.push('五連桿側輸入請以多重初值＋continuation 追蹤分支與死點；幾何指標僅作輔助，不單獨定案。');
  }
  if (m.inputKind === 'B') {
    steps.push('B 型輸入可先按曲柄連續旋轉假設給定初始尺寸，再檢查能否在目標範圍內滿周運轉。');
  } else {
    steps.push('T 型輸入需同時滿足多個迴路閉合；建議先鎖關鍵桿長比，再微調耦桿點。');
  }
  steps.push('通過前置選型後，仍須完成：可達性、迴路／分支、死點與傳動角的完整數值驗證。');
  return steps.slice(0, 5);
}

function fitNarrative(x, top) {
  if (x.reasons && x.reasons.length) {
    return x.reasons.slice(0, 3).join('；') + '。';
  }
  const strong = strongestParts(x, 3);
  const edge = structuralEdge(x.id);
  const bits = [];
  if (strong.length) {
    bits.push(strong.map(p => `${p.label} ${p.value}`).join('、'));
  }
  if (edge[0]) bits.push(edge[0]);
  if (edge[1]) bits.push(edge[1]);
  return bits.join('。 ') + (bits.length ? '。' : '—');
}

function riskNarrative(x, req) {
  const weak = weakestParts(x, 2);
  const notes = [];
  if (x.risk && x.risk.length) notes.push(...x.risk.slice(0, 2));
  if (weak.length) {
    notes.push('加權項中相對偏低：' + weak.map(p => `${p.label}（${p.value}）`).join('、') + '，尺寸階段需特別檢查');
  }
  const m = RECOMMEND_META[x.id];
  if (m && m.group === '5') notes.push('五連桿側輸入的可達分支可能對初始構形敏感');
  if (m && m.inputKind === 'T' && req && req.simple) notes.push('若現場偏好簡單驅動，T 型輸入的裝配與控制成本需納入評估');
  if (!notes.length) return '主要風險在實際尺寸下的可達區間與傳動角，而非拓樸本身被否決。';
  return notes.slice(0, 3).join('；') + '。';
}

function renderComparison(top) {
  const keys = ['trajectory', 'angle', 'pose', 'quick', 'force', 'obstacle', 'simpleInput', 'analyzability'];
  return `<div class="recommend-compare"><div class="compare-table-wrap"><table class="compare-table"><thead><tr><th>指標</th>${top.map(x => `<th>${M[x.id].h}<small>${x.score}</small></th>`).join('')}</tr></thead><tbody>${keys.map(k => `<tr><td>${METRIC_LABEL[k]}</td>${top.map(x => `<td><span class="mini-meter"><i style="width:${x.cap[k]}%"></i></span><b>${x.cap[k]}</b></td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}

function stripHtml(s) { return String(s || '').replace(/<[^>]+>/g, ''); }

function renderRecommendationCards(top, req, opts = {}) {
  const source = opts.source || 'system';
  const hostCards = $('functionRecommendations');
  if (!hostCards) {
    console.warn('functionRecommendations 節點不存在，無法繪製右側候選');
    return;
  }
  if (!top || !top.length) {
    hostCards.innerHTML = '';
    const empty = $('recResultEmpty'); if (empty) empty.hidden = false;
    const host = $('recCompareTableHost');
    if (host) host.innerHTML = `<p class="rec-compare-placeholder">尚無排名結果，請先完成需求描述並送出。</p>`;
    const badge = $('chatResultBadge'); if (badge) badge.textContent = '尚未產生';
    return;
  }
  hostCards.innerHTML = top.map((x, i) => {
    const m = M[x.id];
    const hard = x.hardFail && x.hardFail.length ? `<div class="recommend-hard">不符合必要條件：${x.hardFail.map(escapeHtml).join('；')}</div>` : '';
    const scoreLabel = x.score != null ? `${x.score}/100` : (x.aiRank != null ? `#${x.aiRank}` : '—');
    const intro = modelIntro(x.id);
    const fitText = x.cap ? fitNarrative(x, top) : ((x.reasons || []).join('；') || '—');
    return `<article class="recommend-card ${i === 0 ? 'best' : ''} ${x.hardFail && x.hardFail.length ? 'disqualified' : ''}"><div class="recommend-rank">#${i + 1}</div><div><h3>${m.h} <small>${m.f}</small></h3><p class="recommend-intro">${escapeHtml(intro)}</p><div class="recommend-score"><span style="width:${Math.min(100, x.score || (100 - i * 8))}%"></span></div><div class="score-line"><b>${scoreLabel}</b></div>${hard}<p class="recommend-fit"><b>判讀：</b>${escapeHtml(fitText)}</p><button class="primary-action" data-recommend-model="${x.id}" ${x.hardFail && x.hardFail.length ? 'disabled' : ''}>選用此構型並進入分析</button></div></article>`;
  }).join('');
  document.querySelectorAll('[data-recommend-model]').forEach(b => b.onclick = () => applyRecommendedModel(b.dataset.recommendModel));
  const host = $('recCompareTableHost');
  if (host) {
    if (top[0].cap) host.innerHTML = renderComparison(top);
    else host.innerHTML = `<p class="rec-compare-placeholder">暫無分項數據</p>`;
  }
  const src = $('recCompareSource');
  if (src) src.textContent = source === 'ai' ? 'AI' : '';
  const badge = $('chatResultBadge'); if (badge) badge.textContent = `已產生 ${top.length} 筆候選`;
  const empty = $('recResultEmpty'); if (empty) empty.hidden = true;
  const interp = $('functionInterpretation'); if (interp) interp.hidden = true;
  // 捲到結果區頂部，避免使用者以為沒有輸出
  const scroll = $('recResultScroll');
  if (scroll) scroll.scrollTop = 0;
}

/** 選用推薦構型 → 切到機構迴路分析，並進入幾何尺寸頁 */
function applyRecommendedModel(id) {
  if (!id || !M[id]) {
    console.warn('applyRecommendedModel: invalid id', id);
    return;
  }
  selected = id;
  if (typeof init === 'function') init();
  if (typeof renderCards === 'function') renderCards();
  // 切換任務模式與商業風 body class，顯示分支面板與導覽
  if (typeof setTaskMode === 'function') setTaskMode('branch');
  const wt = $('workspaceTitle');
  if (wt) wt.textContent = '機構迴路分析';
  try {
    const u = new URL(location.href);
    u.searchParams.set('mode', 'branch');
    history.replaceState(null, '', u);
  } catch (e) { }
  document.body.classList.remove('mode-recommend', 'mode-identify');
  document.body.classList.add('mode-branch', 'app-mode');
  const landing = document.getElementById('landing');
  const workspace = document.getElementById('appWorkspace');
  if (landing) landing.classList.add('is-hidden');
  if (workspace) workspace.classList.add('is-visible');
  const note = $('modelNote');
  if (note) {
    note.innerHTML = `<b>${M[id].h}｜${M[id].f}</b><br>${M[id].d}<br>固定桿 ${M[id].g}；輸入桿 ${M[id].i}。<br><b>已由構型智慧推薦套用。</b> 請接著輸入實際尺寸，並驗證軌跡、迴路／分支、死點與傳動角。`;
  }
  // 確保步驟導覽可用
  document.querySelectorAll('nav .nav').forEach((b, i) => {
    b.disabled = false;
    b.style.opacity = '1';
  });
  const nx = $('next'), pv = $('prev');
  if (nx) nx.style.display = '';
  if (pv) pv.style.display = '';
  if (typeof go === 'function') go(2);
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderRecommendation() {
  const req = recommendationInput(), results = recommendModels(req), top = results.slice(0, 3), gap = top.length > 1 ? top[0].score - top[1].score : 0;
  window.lastFunctionRecommendation = { req, results, mode: 'system' };
  const weights = buildWeights(req), weightText = Object.entries(weights).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, w]) => `${METRIC_LABEL[k]} ${w}`).join('、');
  renderRecommendationCards(top, req, { source: 'system' });
  $('functionRecommendationStatus').className = 'status ok';
  $('functionRecommendationStatus').textContent = `✓ 系統評分完成。首選 ${top[0] ? stripHtml(M[top[0].id].h) : '—'}，與次選分差 ${gap}；${confidenceLabel(gap)}。`;
  return { top, gap, req, weightText, summary: reqSummary(req) };
}

function recAppendBubble(role, htmlOrText, asHtml = false) {
  const box = $('recChatMessages'); if (!box) return;
  const div = document.createElement('div');
  div.className = 'rec-bubble ' + role;
  if (asHtml) div.innerHTML = htmlOrText; else div.textContent = htmlOrText;
  box.appendChild(div);
  const body = $('recChatBody'); if (body) body.scrollTop = body.scrollHeight;
}

function formatSystemExplain(meta) {
  const { top, gap, summary, weightText } = meta;
  if (!top || !top.length) return '目前條件下無法形成可靠排序，請補充運動型態（軌跡／角函數／姿態）、輸入是否需連續旋轉，以及是否有增力、避障等硬需求。';
  const lines = [];
  lines.push('已完成前置選型排序（方法：需求權重 × 九型能力矩陣，並套用必要條件與風險修正）。');
  lines.push('說明：能力矩陣為相對啟發式輪廓，用於在九型間快速收斂候選；不是尺寸合成或強度校核結果。');
  lines.push(`解讀到的工程需求：${summary}`);
  lines.push(`本次加權重心：${weightText}`);
  lines.push(`排序信心：${confidenceLabel(gap)}（首選與次選加權分差 ${gap}）。`);
  lines.push('');
  top.forEach((x, i) => {
    const name = stripHtml(M[x.id].h) + '（' + M[x.id].f + '）';
    const struct = structureShort(x.id);
    const dist = distinctiveParts(x, top, 2).map(d => `${d.label}${d.delta >= 0 ? '+' : ''}${d.delta}`).join('、');
    const risk = riskNarrative(x, meta.req).replace(/。$/, '');
    lines.push(`${i + 1}. ${name}｜加權 ${x.score}/100`);
    lines.push(`   結構：${struct}`);
    if (dist) lines.push(`   相對入圍者的突出項：${dist}`);
    else {
      const s = strongestParts(x, 2).map(p => p.label).join('、');
      if (s) lines.push(`   在本需求權重下主要貢獻項：${s}`);
    }
    if (i === 0 && top[1]) lines.push(`   相對次選：${compareReason(x, top[1])}`);
    lines.push(`   風險：${risk}`);
    lines.push('');
  });
  lines.push('請在右側選用構型進入尺寸與運動分析；下方分項表可對照各指標相對高低。最終可否採用，仍取決於可達區間、迴路／分支、死點與傳動角驗證。');
  return lines.join('\n');
}

let recMode = 'system'; // system | ai

function setRecMode(mode) {
  recMode = mode === 'ai' ? 'ai' : 'system';
  document.querySelectorAll('.rec-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.recMode === recMode));
  const hint = $('recModeHint'), aiBox = $('recAiSettings');
  if (hint) hint.textContent = recMode === 'ai'
    ? '使用您提供的 API：模型依對話與可查資料排序九型，並呼叫本頁推薦顯示工具。'
    : '以站內需求權重 × 九型能力矩陣評分，無需外部 API。';
  if (aiBox) aiBox.hidden = recMode !== 'ai';
  if (recMode !== 'ai') clearAiKeyFromDom();
}


/** AI 連線：Key 只在工作階段記憶體，不寫 localStorage。可選記住廠商／模型。 */
const AI_ENDPOINTS = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  openai: 'https://api.openai.com/v1',
  custom: ''
};
const AI_MODELS = {
  gemini: ['gemini-2.5-flash', 'gemini-2.0-flash'],
  openai: ['gpt-4o-mini', 'gpt-4o'],
  custom: ['custom']
};
let aiSession = { mode: 'builtin', provider: 'gemini', model: 'gemini-2.5-flash', baseUrl: '', apiKey: '' };

function readAiSettingsFromForm() {
  const service = $('aiServiceMode')?.value || 'builtin';
  const provider = $('aiProvider')?.value || 'gemini';
  const model = $('aiModel')?.value || 'gemini-2.5-flash';
  let baseUrl = ($('aiBaseUrl')?.value || '').trim().replace(/\/$/, '');
  if (!baseUrl) baseUrl = AI_ENDPOINTS[provider] || '';
  return {
    service,
    provider,
    model,
    baseUrl,
    apiKey: ($('aiApiKey')?.value || aiSession.apiKey || '').trim()
  };
}
function loadAiSettings() {
  // 可選：只還原廠商與模型，绝不还原 Key
  try {
    const raw = localStorage.getItem('linkage_ai_vendor_pref');
    if (raw) {
      const p = JSON.parse(raw);
      if (p.provider && $('aiProvider')) $('aiProvider').value = p.provider;
      if (p.model && $('aiModel')) {
        const sel = $('aiModel');
        const exists = [...sel.options].some(o => o.value === p.model);
        if (exists) sel.value = p.model;
        else { sel.value = 'custom'; if ($('aiCustomModel')) $('aiCustomModel').value = p.model; }
      }
      if (p.service && $('aiServiceMode')) $('aiServiceMode').value = p.service;
    }
  } catch (e) { }
  if ($('aiApiKey')) $('aiApiKey').value = '';
  syncAiFormUi();
  updateAiStatusLabel();
}
function clearAiKeyFromDom() {
  aiSession.apiKey = '';
  if ($('aiApiKey')) $('aiApiKey').value = '';
  updateAiStatusLabel();
}
function syncAiFormUi() {
  const custom = ($('aiServiceMode')?.value || 'builtin') === 'custom';
  const fields = $('aiCustomFields');
  if (fields) fields.hidden = !custom;
  if ($('aiTestConnection')) $('aiTestConnection').hidden = !custom;
  if ($('aiClearKey')) $('aiClearKey').hidden = !custom;
  if (!custom) {
    updateAiStatusLabel();
    return;
  }
  const provider = $('aiProvider')?.value || 'gemini';
  const modelSel = $('aiModel');
  if (modelSel) {
    const list = AI_MODELS[provider] || AI_MODELS.gemini;
    const cur = modelSel.value;
    modelSel.innerHTML = list.map(m => `<option value="${m}">${m}</option>`).join('');
    if ([...modelSel.options].some(o => o.value === cur)) modelSel.value = cur;
    else modelSel.value = list[0];
  }
  const isCustomProvider = provider === 'custom';
  if ($('aiBaseUrlWrap')) $('aiBaseUrlWrap').hidden = !isCustomProvider;
  if (!isCustomProvider && $('aiBaseUrl')) $('aiBaseUrl').value = AI_ENDPOINTS[provider] || '';
  if ($('aiApiKey')) $('aiApiKey').disabled = false;
  updateAiStatusLabel();
}
function updateModeHeaderBadge() {
  const badge = $('recActiveModeBadge');
  if (!badge) return;
  if (isAiModeActive()) {
    const prov = aiSession.provider === 'gemini' ? 'Gemini' : aiSession.provider === 'openai' ? 'OpenAI' : 'Custom AI';
    badge.textContent = `🤖 自訂 AI（${prov}）`;
    badge.className = 'rec-active-mode-badge is-ai';
  } else {
    badge.textContent = '⚡ 內建專家評分';
    badge.className = 'rec-active-mode-badge is-builtin';
  }
}
function updateAiStatusLabel() {
  const el = $('aiModalStatus');
  // 以「已套用的工作階段」為準，避免表單尚未套用或 Key 欄位被清空時誤切模式
  if (isAiModeActive()) {
    if (el) el.textContent = `已套用：${aiSession.provider} / ${aiSession.model}（Key 僅存於本工作階段）`;
  } else {
    const s = readAiSettingsFromForm();
    if (s.service === 'custom' && s.apiKey) {
      if (el) el.textContent = '已填 Key，請按「套用」後才會啟用 AI';
    } else if (s.service === 'custom') {
      if (el) el.textContent = '自訂模式：請填入 API Key 後套用';
    } else {
      if (el) el.textContent = '使用預設（內建專家評分）';
    }
  }
  updateModeHeaderBadge();
}
function isAiModeActive() {
  return aiSession.mode === 'custom' && !!(aiSession.apiKey && String(aiSession.apiKey).trim());
}

function enterAiChatMode(announce) {
  recMode = 'ai';
  guideDone = true;
  guideStep = GUIDE_STEPS.length;
  clearQuizHost();
  const host = $('recQuizHost');
  if (host) host.innerHTML = '';
  updateSendButtonLabel();
  updateModeHeaderBadge();
  const send = $('recommendByFunction');
  if (send) send.textContent = '送出';
  const input = $('recChatInput');
  if (input) {
    input.placeholder = '直接描述需求，由 AI 判斷並推薦構型…';
    input.value = '';
  }
  if (announce) {
    recAppendBubble('bot',
      `已偵測到 API Key，AI 模式已開啟（${aiSession.provider}／${aiSession.model}）。

之後請直接用文字描述機構需求；不再提供固定選項。AI 會自行判斷、撰寫說明，並呼叫右側「推薦候選」與評分表。`);
  }
}

function exitAiChatMode(announce) {
  recMode = 'system';
  updateModeHeaderBadge();
  if (announce) {
    recAppendBubble('bot', '已切回內建系統評分模式。可點「重新設定評估」或「新對話」以引導選項作答。');
  }
}

function applyAiSettings() {
  const s = readAiSettingsFromForm();
  if (s.service === 'custom') {
    const key = (s.apiKey || aiSession.apiKey || '').trim();
    if (!key) {
      if ($('aiModalStatus')) $('aiModalStatus').textContent = '請先輸入 API Key';
      return false;
    }
    aiSession = { mode: 'custom', provider: s.provider, model: s.model, baseUrl: s.baseUrl, apiKey: key };
    recMode = 'ai';
    if ($('aiRememberVendor')?.checked) {
      try {
        localStorage.setItem('linkage_ai_vendor_pref', JSON.stringify({
          service: s.service, provider: s.provider, model: s.model
        }));
      } catch (e) { }
    }
    updateAiStatusLabel();
    enterAiChatMode(true);
    return true;
  }
  // 預設內建
  aiSession = { mode: 'builtin', provider: s.provider, model: s.model, baseUrl: s.baseUrl, apiKey: '' };
  recMode = 'system';
  if ($('aiApiKey')) $('aiApiKey').value = '';
  if ($('aiRememberVendor')?.checked) {
    try {
      localStorage.setItem('linkage_ai_vendor_pref', JSON.stringify({
        service: s.service, provider: s.provider, model: s.model
      }));
    } catch (e) { }
  }
  updateAiStatusLabel();
  exitAiChatMode(true);
  return true;
}
function openAiModal() {
  const m = $('recAiModal'); if (!m) return;
  m.hidden = false;
  // 還原服務方式與廠商；Key 不回填明文，僅以狀態列提示是否已在工作階段
  if (aiSession.mode === 'custom' && $('aiServiceMode')) {
    $('aiServiceMode').value = 'custom';
    if ($('aiProvider') && aiSession.provider) $('aiProvider').value = aiSession.provider;
    if ($('aiBaseUrl') && aiSession.baseUrl) $('aiBaseUrl').value = aiSession.baseUrl;
  }
  syncAiFormUi();
  // 模型選項重建後再套用
  if (aiSession.mode === 'custom' && $('aiModel') && aiSession.model) {
    const sel = $('aiModel');
    if ([...sel.options].some(o => o.value === aiSession.model)) sel.value = aiSession.model;
  }
  if ($('aiApiKey')) $('aiApiKey').value = '';
  updateAiStatusLabel();
}
function closeAiModal() {
  const m = $('recAiModal'); if (m) m.hidden = true;
}
async function testAiConnection() {
  const s = readAiSettingsFromForm();
  const key = (s.apiKey || aiSession.apiKey || '').trim();
  if (s.service !== 'custom' || !key) {
    if ($('aiModalStatus')) $('aiModalStatus').textContent = '內建引擎無需測試；或改選自訂並填入 Key';
    return;
  }
  if ($('aiModalStatus')) $('aiModalStatus').textContent = '測試連線中…';
  const provider = s.provider || 'gemini';
  const model = s.model || 'gemini-2.5-flash';
  const baseUrl = (s.baseUrl || AI_ENDPOINTS[provider] || '').replace(/\/$/, '');
  try {
    if (provider === 'gemini' || (baseUrl && baseUrl.includes('googleapis'))) {
      const url = `${baseUrl || AI_ENDPOINTS.gemini}/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] })
      });
      const body = await res.text();
      if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + body.slice(0, 120));
    } else {
      // OpenAI 相容：優先 chat/completions 最小請求（多數閘道支援）；/models 常被代理關閉
      const base = baseUrl || AI_ENDPOINTS.openai;
      const res = await fetch(base + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
        body: JSON.stringify({
          model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }]
        })
      });
      const body = await res.text();
      if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + body.slice(0, 120));
    }
    if ($('aiModalStatus')) $('aiModalStatus').textContent = '連線成功（注意：瀏覽器直連若遇 CORS 仍可能無法正式推理）';
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    const corsHint = /Failed to fetch|NetworkError|CORS|cors/i.test(msg)
      ? '。若為 CORS／網路阻擋，請改用允許瀏覽器來源的閘道，或改回內建評分。'
      : '';
    if ($('aiModalStatus')) $('aiModalStatus').textContent = '連線失敗：' + msg.slice(0, 160) + corsHint;
  }
}

/** Tool the AI (or system) calls to show ranked models on the right + bottom table */
function displayRecommendationTool(payload) {
  // payload: { ranking:[{id,score?,reasons?,risk?,versus?}], explanation, source }
  const ranking = (payload && payload.ranking) || [];
  const req = recommendationInput();
  const scored = recommendModels(req);
  const top = ranking.map((r, i) => {
    const id = r.id;
    if (!M[id]) return null;
    const base = scored.find(x => x.id === id) || scoreMechanism(id, req, buildWeights(req));
    const riskList = r.risk ? [].concat(r.risk) : (base.risk || []);
    return Object.assign({}, base, {
      score: r.score != null ? r.score : base.score,
      reasons: r.reasons || [],
      risk: riskList,
      versus: r.versus,
      aiRank: i + 1,
      aiNote: payload.source === 'ai' ? 'AI 排序（結構與風險見說明）' : undefined
    });
  }).filter(Boolean).slice(0, 3);
  window.lastFunctionRecommendation = { req, results: top, mode: payload.source || 'ai' };
  renderRecommendationCards(top, req, { source: payload.source || 'ai' });
  if (payload.explanation) recAppendBubble('bot', payload.explanation);
  showRestartEvalButton();
  return top;
}

function parseAiJson(raw) {
  let t = String(raw || '').trim();
  // 去掉 ```json ... ``` 包裝
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try { return JSON.parse(t); } catch (e) { }
  const brace = t.match(/\{[\s\S]*\}/);
  if (brace) {
    try { return JSON.parse(brace[0]); } catch (e2) { }
  }
  return { explanation: t || 'AI 未回傳可解析內容。', ranking: [] };
}

async function runAiRecommend(userText) {
  const key = (aiSession.apiKey || '').trim() || (readAiSettingsFromForm().apiKey || '').trim();
  const provider = aiSession.provider || readAiSettingsFromForm().provider || 'gemini';
  const model = aiSession.model || readAiSettingsFromForm().model || 'gemini-2.5-flash';
  const baseUrl = (aiSession.baseUrl || readAiSettingsFromForm().baseUrl || AI_ENDPOINTS[provider] || '').replace(/\/$/, '');
  if (!key || aiSession.mode !== 'custom') {
    recAppendBubble('bot', '目前未啟用 AI 模式。請在「AI 連線設定」選擇自訂 API Key 並套用。已改以系統評分回覆。');
    runSystemRecommend(userText);
    return;
  }
  if ($('functionDescription')) $('functionDescription').value = userText;
  const modelList = Object.keys(M).map(id => ({
    id,
    name: stripHtml(M[id].h),
    family: M[id].f,
    capability: MODEL_CAPABILITY[id]
  }));
  const systemPrompt = `你是平面六連桿機構選型顧問（Watt／Stephenson 九型）。
只能從下列 id 推薦：${modelList.map(x => x.id).join(', ')}。
評分請參考所附 capability 數值（0–100 啟發式相對輪廓），並結合拓樸結構：
- family S=Stephenson（偏軌跡／姿態）、W=Watt（偏角函數／快回／增力）
- inputKind B=二接頭輸入（驅動較直接）、T=三接頭輸入（耦合較深）
- group 4=四連桿側輸入（利於傳動角／瞬心幾何驗證）、5=五連桿側（分支／死點需數值延續）
說明必須專業、具體，禁止三個候選寫同一句空泛「優勢」。
每位候選說明：結構定位、相對其他候選的差異、主要風險、建議的下一步驗證（軌跡／角函數／姿態／傳動角／分支死點）。
必須只輸出 JSON（不要 markdown）：
{"explanation":"完整繁中說明","ranking":[{"id":"SIIIB4","score":0到100,"reasons":["結構與適配要點"],"risk":["風險"],"versus":"與第二名差異"}]}
ranking 最多 3 筆，id 必須有效。`;
  const userPrompt = `使用者需求：\n${userText}\n\n九型能力與結構：\n${JSON.stringify(modelList.map(x => ({ ...x, meta: RECOMMEND_META[x.id] })))}`;
  recAppendBubble('bot', '正在呼叫 AI 推理，請稍候…');
  const thinkingEl = $('recChatMessages')?.lastElementChild;
  try {
    let content = '';
    if (provider === 'gemini' || (baseUrl && baseUrl.includes('googleapis'))) {
      const url = `${baseUrl || AI_ENDPOINTS.gemini}/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
        })
      });
      const errText = await res.text();
      if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + errText.slice(0, 220));
      let data; try { data = JSON.parse(errText); } catch (e) { data = {}; }
      content = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '{}';
    } else {
      const base = baseUrl || AI_ENDPOINTS.openai;
      const res = await fetch(base + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' }
        })
      });
      const errText = await res.text();
      if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + errText.slice(0, 220));
      let data; try { data = JSON.parse(errText); } catch (e) { data = {}; }
      content = data.choices?.[0]?.message?.content || '{}';
    }
    if (thinkingEl && thinkingEl.parentNode) thinkingEl.remove();
    const parsed = parseAiJson(content);
    if (!parsed.ranking || !parsed.ranking.length) {
      recAppendBubble('bot', parsed.explanation || 'AI 有回應但未给出有效排名。可改用更具體的運動描述，或切回內建專家評分。');
      return;
    }
    // 正規化 id（容忍小寫或連字號）
    parsed.ranking = parsed.ranking.map(r => {
      const id = String(r.id || '').trim();
      const fixed = Object.keys(M).find(k => k.toLowerCase() === id.toLowerCase()) || id;
      return Object.assign({}, r, { id: fixed });
    }).filter(r => M[r.id]);
    if (!parsed.ranking.length) {
      recAppendBubble('bot', 'AI 回傳的構型 id 無法對應本系統九型。請重試或改用內建評分。');
      return;
    }
    displayRecommendationTool({
      ranking: parsed.ranking,
      explanation: parsed.explanation || '已完成 AI 排序。',
      source: 'ai'
    });
  } catch (err) {
    if (thinkingEl && thinkingEl.parentNode) thinkingEl.remove();
    const msg = String(err && err.message ? err.message : err);
    const cors = /Failed to fetch|NetworkError|CORS|cors/i.test(msg);
    recAppendBubble('bot',
      'AI 呼叫失敗：' + msg.slice(0, 240) + '\n' +
      (cors
        ? '原因很可能是瀏覽器 CORS 或網路政策阻止直連 API。可改用支援瀏覽器來源的代理 Endpoint，或切回「內建專家評分」。'
        : '請檢查 API Key、模型名稱是否與廠商一致。也可改回內建系統評分。'));
  }
}

/** 是否落在專家系統可評估範圍（六連桿／運動／製造條件等） */
function isValidRequirement(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  if (/^(你好|您好|嗨|哈囉|hello|hi|hey|謝謝|感謝|ok|好|好的|測試|test|（略過）|（未特別指定）|其他)[\s!！.。？?]*$/i.test(t)) return false;
  // 與本站選型／九型能力相關的客觀描述
  const keywords = /夾|爪|送料|輸送|軌跡|路徑|直線|角度|擺臂|姿態|快回|增力|避障|抬升|馬達|旋轉|往復|雨刷|壓合|步態|門蓋|連桿|構型|機構|緊湊|死點|輸入|輸出|連續|四連|六連|B 型|B型|偏好|必須|忽略|簡單|複雜|平衡|機械利益|繞行|製造|軸承|桿長|異形|訂製|加工|外側|聯軸|搖臂|擺角|行程|規格|重視|驅動|整圈|Watt|Stephenson|曲柄|搖桿|耦桿|固定桿|傳動|裝配|接頭/;
  return keywords.test(t);
}

/** 不在專家系統範圍（含寒暄、無關話題） */
function isCasualChat(text) { return !isValidRequirement(text); }

/** 目前引導題的選項完整句 */
function currentGuidePhrases() {
  const step = GUIDE_STEPS[guideStep];
  if (!step) return [];
  return step.options.map(o => o.phrase || o.label || '');
}

function isCurrentGuideAnswer(text) {
  const t = String(text || '').trim();
  if (!t || t.length < 2) return false;
  // 純數字／無意義字串不視為作答
  if (/^[\d\s\-_.,;:]+$/.test(t)) return false;
  return currentGuidePhrases().some(p => {
    if (!p) return false;
    const pp = String(p).trim();
    if (!pp) return false;
    if (t === pp) return true;
    // 完整包含選項句，或選項句完整包含輸入且輸入夠長（避免單字誤判）
    if (t.includes(pp)) return true;
    if (t.length >= 4 && pp.includes(t)) return true;
    return false;
  });
}

/** 引導題是否可接受此輸入（僅本題選項或明確需求關鍵詞，不看先前勾選） */
function isAcceptableGuideInput(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  if (/^[\d\s\-_.,;:a-zA-Z]+$/.test(t) && !/[\u4e00-\u9fff]/.test(t)) return false;
  return isCurrentGuideAnswer(t) || isValidRequirement(t);
}

function runSystemRecommend(userText) {
  if (!isValidRequirement(userText) && !hasAnyEngineFlag()) {
    recAppendBubble('bot', '無法判讀這段輸入。請描述機構用途或運動需求，或點「重新設定評估」從引導題重來。');
    showRestartEvalButton();
    return;
  }
  if ($('functionDescription')) $('functionDescription').value = userText;
  const meta = renderRecommendation();
  recAppendBubble('bot', formatSystemExplain(meta));
  showRestartEvalButton();
}

/** 隱藏欄位是否已有任何有效勾選 */
function hasAnyEngineFlag() {
  return !!(
    ($('functionQuickReturn') && $('functionQuickReturn').checked) ||
    ($('functionHighForce') && $('functionHighForce').checked) ||
    ($('functionObstacle') && $('functionObstacle').checked) ||
    ($('functionPose') && $('functionPose').checked) ||
    ($('functionCompact') && $('functionCompact').checked) ||
    ($('functionAllowNearDead') && $('functionAllowNearDead').checked) ||
    ($('functionFocus') && $('functionFocus').value !== 'auto') ||
    ($('functionInputMotion') && $('functionInputMotion').value !== 'any')
  );
}

function applyQuizFlag(flag, on) {
  if (!flag) return;
  if (flag === 'quick') { if ($('functionQuickReturn')) $('functionQuickReturn').checked = on; }
  else if (flag === 'force') { if ($('functionHighForce')) $('functionHighForce').checked = on; }
  else if (flag === 'obstacle') { if ($('functionObstacle')) $('functionObstacle').checked = on; }
  else if (flag === 'pose') { if ($('functionPose')) $('functionPose').checked = on; }
  else if (flag === 'simple') { if ($('functionSimpleInput')) $('functionSimpleInput').checked = on; }
  else if (flag === 'compact') { if ($('functionCompact')) $('functionCompact').checked = on; }
  else if (flag === 'nearDead') { if ($('functionAllowNearDead')) $('functionAllowNearDead').checked = on; }
  else if (flag.startsWith('motion:')) {
    const cont = document.querySelector('.rec-quiz-opt[data-flag="motion:continuous"]')?.classList.contains('is-on');
    const osc = document.querySelector('.rec-quiz-opt[data-flag="motion:oscillating"]')?.classList.contains('is-on');
    if ($('functionInputMotion')) {
      if (cont && !osc) $('functionInputMotion').value = 'continuous';
      else if (osc && !cont) $('functionInputMotion').value = 'oscillating';
      else $('functionInputMotion').value = 'any';
    }
  } else if (flag.startsWith('focus:')) {
    const t = document.querySelector('.rec-quiz-opt[data-flag="focus:trajectory"]')?.classList.contains('is-on');
    const a = document.querySelector('.rec-quiz-opt[data-flag="focus:angle"]')?.classList.contains('is-on');
    const p = document.querySelector('.rec-quiz-opt[data-flag="focus:pose"]')?.classList.contains('is-on');
    if ($('functionFocus')) {
      const n = [t, a, p].filter(Boolean).length;
      if (n === 0) $('functionFocus').value = 'auto';
      else if (n > 1) $('functionFocus').value = 'balanced';
      else if (t) $('functionFocus').value = 'trajectory';
      else if (a) $('functionFocus').value = 'angle';
      else $('functionFocus').value = 'pose';
    }
    if (flag === 'focus:pose' || p) { if ($('functionPose')) $('functionPose').checked = !!p; }
  }
}

/** 選項寫入輸入框：以頓號「、」堆疊；再點一次移除該詞 */
/** 忽略空白與各種逗號後的正規化，用於比對是否同一句 */
function normPhrase(s) {
  return String(s || '')
    .replace(/\s+/g, '')
    .replace(/[，,、；;]/g, '')
    .replace(/[／/]/g, '/')
    .toLowerCase();
}

/** 依「頓號／逗號」切開，但避免把句中逗號誤切：優先用頓號，再嘗試整句對齊選項 */
function splitInputPhrases(raw) {
  const t = String(raw || '').trim();
  if (!t) return [];
  // 先以頓號切開；若只有逗號分隔的多段也切開
  if (t.includes('、')) return t.split('、').map(s => s.trim()).filter(Boolean);
  // 若有多個選項句用逗號串在一起，仍可能是「需要快回，去程與回程速度不同」整句
  return [t];
}

function findPartIndex(parts, phrase) {
  const target = normPhrase(phrase);
  if (!target) return -1;
  return parts.findIndex(p => {
    const n = normPhrase(p);
    if (n === target) return true;
    // 互為包含且長度接近 → 視為同句（避免「需要快回」vs 完整句誤判時仍可對完整 phrase 匹配）
    if (n.length >= 6 && target.length >= 6 && (n.includes(target) || target.includes(n))) return true;
    return false;
  });
}

/** 複選：點一下加入、再點取消；同義句（標點不同）不重複堆疊 */
function togglePhraseInInput(phrase) {
  const input = $('recChatInput');
  if (!input || !phrase) return false;
  let parts = splitInputPhrases(input.value);
  // 再把可能被「需要快回，去程…」整段存的，與已知選項對齊拆開不必要；這裡只做去重
  const idx = findPartIndex(parts, phrase);
  let nowOn;
  if (idx >= 0) {
    parts.splice(idx, 1);
    nowOn = false;
  } else {
    parts.push(phrase);
    nowOn = true;
  }
  const seen = new Set();
  const cleaned = [];
  for (const p of parts) {
    const k = normPhrase(p);
    if (!k || seen.has(k)) continue;
    // 若已有更長的同義句，略過較短重複
    let dominated = false;
    for (const c of cleaned) {
      const ck = normPhrase(c);
      if (ck.includes(k) && ck !== k) { dominated = true; break; }
    }
    if (dominated) continue;
    // 若新句更長，移除已被包含的短句
    for (let i = cleaned.length - 1; i >= 0; i--) {
      const ck = normPhrase(cleaned[i]);
      if (k.includes(ck) && k !== ck) cleaned.splice(i, 1);
    }
    seen.add(k);
    cleaned.push(p);
  }
  input.value = cleaned.join('、');
  input.focus();
  return nowOn;
}

function syncOptButtonsFromInput(host) {
  if (!host) host = $('recQuizHost');
  if (!host) return;
  const parts = splitInputPhrases($('recChatInput')?.value || '');
  host.querySelectorAll('.rec-quiz-opt').forEach(btn => {
    const ph = btn.dataset.phrase || '';
    const on = findPartIndex(parts, ph) >= 0;
    btn.classList.toggle('is-on', on);
  });
}

function syncQuizFromInput() {
  const input = $('recChatInput');
  const parts = new Set((input?.value || '').split('、').map(s => s.trim()).filter(Boolean));
  document.querySelectorAll('.rec-quiz-opt').forEach(btn => {
    const phrase = btn.dataset.phrase || btn.textContent.trim();
    const on = parts.has(phrase);
    btn.classList.toggle('is-on', on);
    applyQuizFlag(btn.dataset.flag, on);
  });
}

/* ========== 一問一答引導流程（對應原表單欄位） ========== */
/* phrase=寫入輸入框的完整句；label=按鈕顯示文字 */
const GUIDE_STEPS = [
  {
    id: 'focus',
    title: '對於此機構，你較為重視的項目有哪些？',
    multi: false,
    options: [
      { label: '軌跡／路徑', phrase: '較重視末端軌跡與路徑形狀', flag: 'focus:trajectory' },
      { label: '輸入角與輸出角關係', phrase: '較重視輸入角與輸出角的對應關係', flag: 'focus:angle' },
      { label: '末端姿態', phrase: '較重視末端姿態是否穩定、可控', flag: 'focus:pose' },
      { label: '以上需綜合兼顧', phrase: '軌跡、角度與姿態需要綜合兼顧', flag: 'focus:balanced' }
    ]
  },
  {
    id: 'motion',
    title: '實際可用的輸入驅動方式是哪一種？',
    multi: false,
    options: [
      { label: '馬達連續整圈旋轉', phrase: '輸入為馬達連續整圈旋轉', flag: 'motion:continuous' },
      { label: '往復擺動（不整圈）', phrase: '輸入為往復擺動、不需整圈旋轉', flag: 'motion:oscillating' },
      { label: '兩種都可能或尚未決定', phrase: '輸入驅動方式尚未限定', flag: 'motion:any' }
    ]
  },
  {
    id: 'features',
    title: '下列哪些動作或性能需求是你需要的？（可複選）',
    multi: true,
    options: [
      { label: '快回（去程與回程速度不同）', phrase: '需要快回，去程與回程速度不同', flag: 'quick' },
      { label: '工作端需要較大力量／增力', phrase: '工作端需要較大力量或增力', flag: 'force' },
      { label: '末端需抬升、避障或繞行', phrase: '末端需要抬升、避障或繞行', flag: 'obstacle' },
      { label: '末端方向／姿態要保持', phrase: '末端方向或姿態需要保持', flag: 'pose' },
      { label: '輸入要容易直接接馬達', phrase: '輸入端要容易直接接馬達', flag: 'simple' },
      { label: '機構希望較緊湊', phrase: '機構希望盡量緊湊', flag: 'compact' }
    ]
  },
  {
    id: 'simpleB',
    title: '驅動與輸入軸的安裝條件目前是什麼？',
    multi: false,
    options: [
      { label: '只能裝在外側，並對準可整圈轉的軸', phrase: '驅動只能裝在外側並對準可整圈旋轉的輸入軸', flag: 'simplePri:must' },
      { label: '大致在外側，位置與接法尚可微調', phrase: '驅動大致在外側，安裝位置與接法尚可微調', flag: 'simplePri:prefer' },
      { label: '可內嵌或以聯軸／搖臂轉接', phrase: '驅動可內嵌或以聯軸、搖臂轉接', flag: 'simplePri:ignore' }
    ]
  },
  {
    id: 'group4',
    title: '輸出端的行程或角度規格，目前確定到什麼程度？',
    multi: false,
    options: [
      { label: '已有明確數字（擺角或行程）', phrase: '輸出已有明確擺角或行程規格', flag: 'group4Pri:prefer' },
      { label: '只有大致範圍，細節還會改', phrase: '輸出僅有大致工作範圍，細節仍可能修改', flag: 'group4Pri:ignore' },
      { label: '尚在概念階段', phrase: '輸出規格尚在概念階段', flag: 'group4Pri:ignore' }
    ]
  },
  {
    id: 'complexity',
    title: '製造端目前能支援的零件與加工條件是什麼？',
    multi: false,
    options: [
      { label: '以標準軸承、常見桿長為主', phrase: '製造以標準軸承與常見桿長為主', flag: 'complexity:simple' },
      { label: '訂製三接頭桿或異形件', phrase: '訂製三接頭桿、異形件或較精密配合', flag: 'complexity:complex' },
      { label: '加工條件未定，之後再決定', phrase: '加工與零件條件尚未定，之後再依構型決定', flag: 'complexity:any' }
    ]
  }
];

let guideStep = 0;
let guideAnswers = [];
let guideDone = false;

function clearQuizHost() {
  const host = $('recQuizHost');
  if (host) host.innerHTML = '';
}

function updateSendButtonLabel() {
  const btn = $('recommendByFunction');
  if (!btn) return;
  if (!guideDone && guideStep >= GUIDE_STEPS.length - 1) btn.textContent = '評估';
  else if (!guideDone) btn.textContent = '送出';
  else btn.textContent = '送出';
}

function applyStepFlag(flag, on) {
  if (!flag) return;
  if (flag === 'focus:trajectory' || flag === 'focus:angle' || flag === 'focus:pose' || flag === 'focus:balanced' || flag === 'focus:auto') {
    if (on && $('functionFocus')) $('functionFocus').value = flag.split(':')[1];
    if (flag === 'focus:pose' && $('functionPose')) $('functionPose').checked = !!on;
    return;
  }
  if (flag === 'complexity:simple') { if (on && $('functionComplexity')) $('functionComplexity').value = 'simple'; return; }
  if (flag === 'complexity:complex') { if (on && $('functionComplexity')) $('functionComplexity').value = 'complex'; return; }
  if (flag === 'complexity:any') { if (on && $('functionComplexity')) $('functionComplexity').value = 'any'; return; }
  if (flag === 'motion:any') { if (on && $('functionInputMotion')) $('functionInputMotion').value = 'any'; return; }
  if (flag === 'motion:continuous') { if (on && $('functionInputMotion')) $('functionInputMotion').value = 'continuous'; return; }
  if (flag === 'motion:oscillating') { if (on && $('functionInputMotion')) $('functionInputMotion').value = 'oscillating'; return; }
  if (flag.startsWith('simplePri:')) {
    if (on && $('functionSimplePriority')) $('functionSimplePriority').value = flag.split(':')[1];
    if (on && (flag.endsWith('prefer') || flag.endsWith('must'))) {
      if ($('functionSimpleInput')) $('functionSimpleInput').checked = true;
    }
    if (on && flag.endsWith('ignore') && $('functionSimpleInput')) $('functionSimpleInput').checked = false;
    return;
  }
  if (flag.startsWith('group4Pri:')) {
    if (on && $('functionGroup4Priority')) $('functionGroup4Priority').value = flag.split(':')[1];
    return;
  }
  applyQuizFlag(flag, on);
}

function renderGuideQuestion(stepIndex) {
  const host = $('recQuizHost');
  if (!host) return;
  const step = GUIDE_STEPS[stepIndex];
  if (!step) { clearQuizHost(); return; }
  const opts = step.options.map(o => {
    const label = o.label || o.phrase;
    const phrase = o.phrase || o.label;
    return `<button type="button" class="rec-quiz-opt" data-phrase="${phrase}" data-flag="${o.flag || ''}" data-multi="${step.multi ? '1' : '0'}">${label}</button>`;
  }).join('');
  // 題目已在對話氣泡中；此處只放選項，避免重複兩欄
  host.innerHTML = `<div class="rec-quiz-q is-active">
    <div class="rec-quiz-opts">${opts}</div>
  </div>`;
  host.querySelectorAll('.rec-quiz-opt').forEach(btn => {
    const phrase = btn.dataset.phrase;
    const multi = btn.dataset.multi === '1';
    // is-on 於下方 sync；此處先綁事件
    btn.onclick = () => {
      if (!multi) {
        // 單選：切換時整段覆蓋輸入欄（不與其他文字堆疊）
        const wasOn = btn.classList.contains('is-on');
        host.querySelectorAll('.rec-quiz-opt').forEach(other => {
          other.classList.remove('is-on');
          if (other.dataset.flag) applyStepFlag(other.dataset.flag, false);
        });
        const input = $('recChatInput');
        if (wasOn) {
          if (input) input.value = '';
          if (btn.dataset.flag) applyStepFlag(btn.dataset.flag, false);
        } else {
          btn.classList.add('is-on');
          if (input) { input.value = phrase; input.focus(); }
          if (btn.dataset.flag) applyStepFlag(btn.dataset.flag, true);
        }
      } else {
        const reallyOn = togglePhraseInInput(phrase);
        syncOptButtonsFromInput(host);
        if (btn.dataset.flag) applyStepFlag(btn.dataset.flag, reallyOn);
      }
    };
  });
  syncOptButtonsFromInput(host);
  updateSendButtonLabel();
}


/** 引導中輸入無法判斷：錯誤提示 + 再以對話泡泡重述當前題目 */
function recGuideErrorAndRepeat() {
  const err = '發生錯誤，請重新輸入或點擊下方引導範例選項。';
  recAppendBubble('bot', err);
  const step = GUIDE_STEPS[guideStep];
  if (step && step.title) {
    recAppendBubble('bot', step.title);
  }
  renderGuideQuestion(guideStep);
  const body = $('recChatBody');
  if (body) body.scrollTop = body.scrollHeight;
}

function askGuideQuestion(stepIndex) {
  if (isAiModeActive()) {
    clearQuizHost();
    return;
  }
  const step = GUIDE_STEPS[stepIndex];
  if (!step) return;
  recAppendBubble('bot', step.title);
  renderGuideQuestion(stepIndex);
}

function advanceGuide(skip) {
  const input = $('recChatInput');
  const text = (input?.value || '').trim();
  if (!skip && text) {
    recAppendBubble('user', text);
    guideAnswers.push(text);
    syncQuizFromInput();
  } else if (skip) {
    recAppendBubble('user', '（略過）');
  } else {
    if (guideStep < GUIDE_STEPS.length - 1) {
      // 不另開提示氣泡，維持當前題
      renderGuideQuestion(guideStep);
      return;
    }
    recAppendBubble('user', '（未特別指定）');
  }
  if (input) input.value = '';
  clearQuizHost();
  guideStep += 1;
  if (guideStep < GUIDE_STEPS.length) {
    askGuideQuestion(guideStep);
  } else {
    finishGuideAndRecommend();
  }
  updateSendButtonLabel();
  const body = $('recChatBody'); if (body) body.scrollTop = body.scrollHeight;
}

function finishGuideAndRecommend() {
  guideDone = true;
  clearQuizHost();
  updateSendButtonLabel();
  const combined = guideAnswers.filter(t => t && t !== '（略過）' && t !== '（未特別指定）').join('、');
  if (!isValidRequirement(combined) && !hasAnyEngineFlag()) {
    recAppendBubble('bot', '目前還沒有足夠的需求資訊，無法評估構型。請再描述用途，或點「重新設定評估」重來。');
    showRestartEvalButton();
    return;
  }
  const finalText = combined || '已勾選條件之綜合需求';
  if ($('functionDescription')) $('functionDescription').value = finalText;
  // 只回一則：直接評估，不先插「正在評估…」再插結果
  const s = readAiSettingsFromForm();
  const useAi = (s.service === 'custom' && (s.apiKey || aiSession.apiKey)) || (aiSession.mode === 'custom' && aiSession.apiKey);
  if (useAi) runAiRecommend(finalText);
  else runSystemRecommend(finalText);
}

function showRestartEvalButton() {
  const host = $('recQuizHost');
  if (!host) return;
  host.innerHTML = `<div class="rec-restart-wrap">
    <button type="button" class="rec-restart-btn" id="recRestartEval">重新設定評估</button>
  </div>`;
  // 只綁一次，避免 bubble 導致連觸兩次
  host.onclick = null;
  const btn = $('recRestartEval');
  if (btn) {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      restartEvaluationKeepHistory();
    };
  }
}

function startGuidedConversation() {
  guideStep = 0;
  guideAnswers = [];
  guideDone = false;
  const box = $('recChatMessages');
  if (box) box.innerHTML = '';
  clearQuizHost();
  // 開場只一則說明
  recAppendBubble('bot',
    `你好，歡迎使用構型智慧推薦。

這裡會依你的用途，從九型六連桿中評估並推薦適合構型。

兩種模式：
① 內建系統評分：採用專家系統模式，將需求權重 × 能力評估矩陣，無需 API。
② 自訂 AI：點右上「AI 連線設定」填入個人 API Key；Key 只在本機有效，不另外存在網站中。

請依序回答下列問題。點選選項會寫入輸入框；最後一題按「評估」。
若已設定 API Key，套用後會改由 AI 自由對話，不再顯示選項。`);
  if (isAiModeActive()) {
    enterAiChatMode(true);
  } else {
    askGuideQuestion(0);
  }
  updateSendButtonLabel();
}

function handleRecSend() {
  const input = $('recChatInput');
  const text = (input && input.value.trim()) || '';
  if (!text) { if (input) input.focus(); return; }

  // AI 模式：不提供選項，全文交給模型判斷並更新右側推薦
  if (isAiModeActive()) {
    clearQuizHost();
    const qh = $('recQuizHost'); if (qh) qh.innerHTML = '';
    recAppendBubble('user', text);
    if (input) input.value = '';
    if (isCasualChat(text)) {
      recAppendBubble('bot', '請描述機構用途或運動需求（例如夾持要增力、末端近似直線），我會依此排序九型構型。');
      return;
    }
    runAiRecommend(text);
    return;
  }

  // 引導中：本題選項或專家範圍內描述 → 進下一題；無關內容不推進
  if (!guideDone && guideStep < GUIDE_STEPS.length) {
    const isLast = guideStep === GUIDE_STEPS.length - 1;
    if (!text && !isLast) {
      recGuideErrorAndRepeat();
      return;
    }
    if (text && !isAcceptableGuideInput(text)) {
      recAppendBubble('user', text);
      if (input) input.value = '';
      recGuideErrorAndRepeat();
      return;
    }
    advanceGuide(false);
    return;
  }

  if (isCasualChat(text) && !hasAnyEngineFlag()) {
    recAppendBubble('user', text);
    if (input) input.value = '';
    recAppendBubble('bot', '無法判讀這段輸入。請描述機構用途或運動需求，或點「重新設定評估」從引導題重來。');
    showRestartEvalButton();
    return;
  }

  if (!isValidRequirement(text) && !hasAnyEngineFlag()) {
    recAppendBubble('user', text);
    if (input) input.value = '';
    recAppendBubble('bot', '無法判讀這段輸入。請描述機構用途或運動需求，或點「重新設定評估」從引導題重來。');
    showRestartEvalButton();
    return;
  }
  syncQuizFromInput();
  if ($('functionDescription')) $('functionDescription').value = text;
  recAppendBubble('user', text);
  if (input) input.value = '';
  document.querySelectorAll('.rec-quiz-opt').forEach(btn => btn.classList.remove('is-on'));
  runSystemRecommend(text);
}

function clearEngineFlags() {
  if ($('functionSimpleInput')) $('functionSimpleInput').checked = false;
  if ($('functionFocus')) $('functionFocus').value = 'auto';
  if ($('functionInputMotion')) $('functionInputMotion').value = 'any';
  if ($('functionComplexity')) $('functionComplexity').value = 'any';
  // 中性預設：未作答前不偏向「分析便利／輸入簡潔」
  if ($('functionSimplePriority')) $('functionSimplePriority').value = 'ignore';
  if ($('functionGroup4Priority')) $('functionGroup4Priority').value = 'ignore';
  ['functionQuickReturn', 'functionHighForce', 'functionObstacle', 'functionPose', 'functionCompact', 'functionAllowNearDead'].forEach(id => {
    if ($(id)) $(id).checked = false;
  });
  if ($('functionDescription')) $('functionDescription').value = '';
}

/** 新對話：清空對話與結果，從頭開始 */
function resetRecommendationConversation() {
  try {
    guideStep = 0;
    guideAnswers = [];
    guideDone = false;
    if (typeof loadFunctionPreset === 'function') loadFunctionPreset('custom');
    clearEngineFlags();
    if ($('recChatInput')) $('recChatInput').value = '';
    if ($('functionDescription')) $('functionDescription').value = '';
    if ($('functionRecommendations')) $('functionRecommendations').innerHTML = '';
    if ($('functionInterpretation')) { $('functionInterpretation').innerHTML = ''; $('functionInterpretation').hidden = true; }
    if ($('functionRecommendationStatus')) $('functionRecommendationStatus').textContent = '';
    const badge = $('chatResultBadge'); if (badge) badge.textContent = '尚未產生';
    const empty = $('recResultEmpty'); if (empty) empty.hidden = false;
    const compareHost = $('recCompareTableHost');
    if (compareHost) compareHost.innerHTML = '<p class="rec-compare-placeholder">送出需求後顯示評分表</p>';
    window.lastFunctionRecommendation = null;
    startGuidedConversation();
    const body = $('recChatBody'); if (body) body.scrollTop = 0;
    updateSendButtonLabel();
  } catch (err) {
    console.error('resetRecommendationConversation', err);
    try { startGuidedConversation(); } catch (e2) { console.error(e2); }
  }
}

/**
 * 重新設定評估：保留對話紀錄與上一次右側推薦，
 * 只重設本輪條件並再從第一題問起；完成後會更新結果。
 */
let restartEvalLock = false;
function restartEvaluationKeepHistory() {
  if (restartEvalLock) return;
  restartEvalLock = true;
  try {
    guideStep = 0;
    guideAnswers = [];
    guideDone = false;
    clearEngineFlags();
    if ($('recChatInput')) $('recChatInput').value = '';
    if ($('functionDescription')) $('functionDescription').value = '';
    clearQuizHost();
    // 重新評估：清空右側候選與比較表
    if ($('functionRecommendations')) $('functionRecommendations').innerHTML = '';
    if ($('functionInterpretation')) { $('functionInterpretation').innerHTML = ''; $('functionInterpretation').hidden = true; }
    const badge = $('chatResultBadge'); if (badge) badge.textContent = '尚未產生';
    const empty = $('recResultEmpty'); if (empty) empty.hidden = false;
    const compareHost = $('recCompareTableHost');
    if (compareHost) compareHost.innerHTML = '<p class="rec-compare-placeholder">送出需求後顯示評分表</p>';
    window.lastFunctionRecommendation = null;
    // 視同使用者說一次「我想重新評估」，系統只接一則第一題
    recAppendBubble('user', '我想重新評估');
    if (isAiModeActive()) {
      enterAiChatMode(false);
      recAppendBubble('bot', 'AI 模式仍開啟中。請直接用文字描述新的需求，我會重新判斷並更新推薦。');
    } else {
      askGuideQuestion(0);
    }
    updateSendButtonLabel();
    const body = $('recChatBody'); if (body) body.scrollTop = body.scrollHeight;
  } catch (err) {
    console.error('restartEvaluationKeepHistory', err);
  } finally {
    setTimeout(() => { restartEvalLock = false; }, 400);
  }
}

function initFunctionRecommendation() {
  if (!$('functionPreset')) return;
  loadAiSettings();
  recMode = 'system';
  syncAiFormUi();

  const openBtn = $('btnOpenAiModal');
  if (openBtn) openBtn.onclick = openAiModal;
  const closeBtn = $('recAiModalClose');
  if (closeBtn) closeBtn.onclick = closeAiModal;
  const backdrop = $('recAiModalBackdrop');
  if (backdrop) backdrop.onclick = closeAiModal;
  if ($('aiApplySettings')) $('aiApplySettings').onclick = () => { if (applyAiSettings()) closeAiModal(); };
  if ($('aiTestConnection')) $('aiTestConnection').onclick = () => testAiConnection();
  if ($('aiClearKey')) $('aiClearKey').onclick = () => {
    clearAiKeyFromDom();
    if ($('aiServiceMode')) $('aiServiceMode').value = 'builtin';
    applyAiSettings();
    syncAiFormUi();
    if ($('aiModalStatus')) $('aiModalStatus').textContent = '使用預設（內建引擎）';
  };
  ['aiProvider', 'aiModel', 'aiServiceMode'].forEach(id => {
    const el = $(id); if (el) el.onchange = () => syncAiFormUi();
  });

  $('functionPreset').onchange = e => {
    loadFunctionPreset(e.target.value);
    if ($('functionDescription') && $('functionDescription').value && $('recChatInput'))
      $('recChatInput').value = $('functionDescription').value;
  };
  const send = $('recommendByFunction');
  if (send) send.onclick = handleRecSend;
  const chatInput = $('recChatInput');
  if (chatInput) {
    chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); handleRecSend(); } });
  }

  if ($('clearFunctionRecommendation')) $('clearFunctionRecommendation').onclick = resetRecommendationConversation;

  loadFunctionPreset('custom');
  if ($('functionRecommendations')) $('functionRecommendations').innerHTML = '';
  if ($('functionDescription')) $('functionDescription').value = '';
  startGuidedConversation();
}






// 事件委派：避免重新渲染後按鈕失效
(function recommendPanelClickDelegate() {
  document.addEventListener('click', function (ev) {
    const btn = ev.target && ev.target.closest && ev.target.closest('[data-recommend-model]');
    if (!btn) return;
    const id = btn.getAttribute('data-recommend-model');
    if (id && typeof applyRecommendedModel === 'function') {
      ev.preventDefault();
      applyRecommendedModel(id);
    }
  });
})();
