// ==========================================
// 1. 全域變數狀態宣告
// ==========================================
let taskMode = 'identify';
let identifiedModel = null;
let identificationCandidates = [];

// ==========================================
// 2. UI 渲染與狀態重設功能
// ==========================================

// 產生 L1 到 L6 的下拉選單選項
function linkOptions() {
  return Array.from({ length: 6 }, (_, i) => `<option value="L${i + 1}">L${i + 1}</option>`).join('');
}

// 渲染拓樸輸入的欄位 (包含是否使用範例資料的邏輯)
function renderTopologyInputRows(useExample = false) {
  const source = useExample ? md().l : [];
  
  $('topologyInputs').innerHTML = Array.from({ length: 6 }, (_, i) => {
    const l = source[i] || { id: `L${i + 1}`, j: [] };
    return `<div class="topology-row">
              <b>L${i + 1}</b>
              <label>此桿上的接頭
                <input data-topology-link="L${i + 1}" value="${l.j.join(', ')}" placeholder="例如 A, B；三接頭桿填 A, D, G">
              </label>
            </div>`;
  }).join('');
  
  // 設定固定桿與輸入桿的下拉選單
  $('identifyGround').innerHTML = linkOptions();
  $('identifyInput').innerHTML = linkOptions();
  
  $('identifyGround').value = useExample ? md().g : 'L1';
  $('identifyInput').value = useExample ? md().i : 'L2';
  
  // 綁定事件：當輸入改變時，清除當前的辨識結果
  document.querySelectorAll('[data-topology-link]').forEach(x => x.addEventListener('input', clearIdentification));
  $('identifyGround').onchange = clearIdentification;
  $('identifyInput').onchange = clearIdentification;
  
  clearIdentification();
}

// 清除所有辨識結果與 UI 狀態
function clearIdentification() {
  identifiedModel = null;
  identificationCandidates = [];
  $('identifyResult').className = 'identify-result-empty';
  $('identifyResult').textContent = '尚未辨識';
  $('identifyDetails').innerHTML = '';
  $('identifyStatus').textContent = '';
  $('identifyStatus').className = 'status';
  $('applyIdentifiedModel').disabled = true;
}

// 設定當前的任務模式 (辨識模式 identify 或 分支模式 branch)
function setTaskMode(mode) {
  taskMode = mode;
  const identify = mode === 'identify';
  
  // 切換面板顯示狀態
  $('identifyPanel').hidden = !identify;
  $('branchModelPanel').hidden = identify;
  $('taskIdentify').checked = identify;
  $('taskBranch').checked = !identify;
  $('taskIdentifyLabel').classList.toggle('active', identify);
  $('taskBranchLabel').classList.toggle('active', !identify);
  
  // 更新導覽列按鈕的可用性與透明度
  document.querySelectorAll('nav .nav').forEach((b, i) => {
    if (i > 0) b.disabled = identify;
    b.style.opacity = (i > 0 && identify) ? '.45' : '1';
  });
  
  // 控制上下一步按鈕的顯示
  $('next').style.display = identify ? 'none' : '';
  $('prev').style.display = identify ? 'none' : '';
}

// ==========================================
// 3. 資料解析與圖論演算法 (拓樸圖建立與迴路搜尋)
// ==========================================

// 解析使用者在畫面上輸入的拓樸資料
function parsedUserTopology() {
  const links = [];
  document.querySelectorAll('[data-topology-link]').forEach(inp => {
    // 支援多種分隔符號分割字串，並過濾空白
    const joints = inp.value.split(/[,，;；\s]+/).map(x => x.trim()).filter(Boolean);
    links.push({ id: inp.dataset.topologyLink, j: [...new Set(joints)] });
  });
  return { links, ground: $('identifyGround').value, input: $('identifyInput').value };
}

// 建立拓樸圖形結構 (包含相鄰矩陣、接頭擁有者等)
function topologyGraph(links) {
  const jointOwners = new Map();
  const ids = links.map(x => x.id);
  const adj = {};
  
  ids.forEach(id => adj[id] = new Set());
  
  // 記錄每個接頭被哪些連桿共用
  links.forEach(l => l.j.forEach(j => {
    if (!jointOwners.has(j)) jointOwners.set(j, []);
    jointOwners.get(j).push(l.id);
  }));
  
  // 建立連桿之間的相鄰關係 (若兩個連桿共用一個接頭，則彼此相鄰)
  for (const owners of jointOwners.values()) {
    if (owners.length === 2) {
      adj[owners[0]].add(owners[1]);
      adj[owners[1]].add(owners[0]);
    }
  }
  
  return { ids, adj, jointOwners, degrees: Object.fromEntries(links.map(l => [l.id, l.j.length])) };
}

// 找出拓樸圖中的所有簡單迴路 (Simple Cycles)
function enumerateSimpleCycles(links) {
  const g = topologyGraph(links);
  const ids = g.ids.slice().sort();
  const found = new Map();
  
  // 將迴路標準化，避免同一個迴路因為起點不同被重複計算
  function canonical(c) {
    const variants = [];
    for (const q of [c, c.slice().reverse()]) {
      for (let i = 0; i < q.length; i++) {
        variants.push(q.slice(i).concat(q.slice(0, i)).join('|'));
      }
    }
    return variants.sort()[0];
  }
  
  // 深度優先搜尋 (DFS) 尋找迴路
  function dfs(start, current, path, seen) {
    for (const next of g.adj[current]) {
      if (next === start && path.length >= 3) {
        const key = canonical(path);
        found.set(key, path.slice());
        continue;
      }
      if (seen.has(next) || next < start) continue;
      
      seen.add(next);
      path.push(next);
      dfs(start, next, path, seen);
      path.pop();
      seen.delete(next);
    }
  }
  
  ids.forEach(start => dfs(start, start, [start], new Set([start])));
  return [...found.values()].sort((a, b) => a.length - b.length || a.join('').localeCompare(b.join('')));
}

// ==========================================
// 4. 拓樸驗證與機構辨識邏輯
// ==========================================

// 驗證使用者輸入的拓樸是否符合標準平面六連桿的規則
function validateTopology(user) {
  const g = topologyGraph(user.links);
  const errors = [];
  
  if (user.ground === user.input) errors.push('固定桿與輸入桿不可為同一根桿。');
  
  user.links.forEach(l => {
    if (l.j.length < 2 || l.j.length > 3) errors.push(`${l.id} 必須輸入 2 或 3 個不同接頭。`);
  });
  
  if (g.jointOwners.size !== 7) errors.push(`目前共有 ${g.jointOwners.size} 個不同接頭；標準平面六連桿應有 7 個旋轉接頭。`);
  
  for (const [j, o] of g.jointOwners) {
    if (o.length !== 2) errors.push(`接頭 ${j} 目前連接 ${o.length} 根桿；每個旋轉接頭必須剛好由兩根桿共用。`);
  }
  
  const ternary = user.links.filter(l => l.j.length === 3).length;
  if (ternary !== 2) errors.push(`目前有 ${ternary} 根三接頭桿；此規則要求 2 根三接頭桿。`);
  
  // 檢查是否為單一連通圖
  const seen = new Set();
  const stack = [user.links[0]?.id];
  while (stack.length) {
    const x = stack.pop();
    if (!x || seen.has(x)) continue;
    seen.add(x);
    g.adj[x].forEach(y => stack.push(y));
  }
  if (seen.size !== 6) errors.push('輸入的六根桿沒有形成單一連通運動鏈。');
  
  return errors;
}

// 產生拓樸的簽章特徵字串
function topologySignature(user) {
  const g = topologyGraph(user.links);
  return user.links.map(l => `${l.id}:${l.j.length}接頭/鄰接${[...g.adj[l.id]].sort().join(',')}`).join('；');
}

// 組合出機構模型的 ID 字串
function ruleModelId(chain, roman, inputKind, group) {
  return `${chain}${roman}${inputKind}${group}`
    .replace('SⅠ', 'SI')
    .replace('SⅡ', 'SII')
    .replace('SⅢ', 'SIII')
    .replace('WⅠ', 'WI')
    .replace('WⅡ', 'WII');
}

// 核心功能：依據文件規則進行九型機構判定 (四步判定法)
function identifyByDocumentRules(user) {
  const g = topologyGraph(user.links);
  const cycles = enumerateSimpleCycles(user.links);
  const c4 = cycles.filter(c => c.length === 4);
  const c5 = cycles.filter(c => c.length === 5);
  const trace = [];
  let chain = '';
  
  // 第一步：判斷 Watt 或 Stephenson
  if (c4.length === 2) {
    chain = 'W';
    trace.push(`第一步：找到 ${c4.length} 個四連桿迴路，因此判定 W（Watt：兩個四連桿共用一個連桿）。`);
  } else if (c4.length === 1 && c5.length >= 1) {
    chain = 'S';
    trace.push(`第一步：找到 1 個四連桿迴路及 ${c5.length} 個五連桿迴路，因此判定 S（Stephenson：一個四連桿加一個五連桿）。`);
  } else {
    return { error: `迴路長度不符合文件規則：四連桿迴路 ${c4.length} 個、五連桿迴路 ${c5.length} 個。`, cycles };
  }
  
  const ground = user.links.find(l => l.id === user.ground);
  const input = user.links.find(l => l.id === user.input);
  const inputKind = input.j.length === 3 ? 'T' : 'B';
  let roman = '';
  let group = '';
  
  // Watt 判定邏輯
  if (chain === 'W') {
    roman = ground.j.length === 3 ? 'Ⅱ' : 'Ⅰ';
    if (ground.j.length === 2) {
      const involvedTernary = new Set(c4.filter(c => c.includes(ground.id)).flatMap(c => c.filter(id => user.links.find(l => l.id === id).j.length === 3)));
      trace.push(`第四步：固定桿 ${ground.id} 是雙接頭桿；其四連桿組涉及 ${involvedTernary.size} 根三接頭桿，判定 Watt-Ⅰ。`);
    } else {
      trace.push(`第四步：固定桿 ${ground.id} 是三接頭桿，判定 Watt-Ⅱ。`);
    }
    group = '4';
    trace.push(`第二步：Watt 的兩個基本迴路皆為四連桿組，輸入桿判定在 4 組。`);
  } 
  // Stephenson 判定邏輯
  else {
    const ternaryNeighbors = [...g.adj[ground.id]].filter(id => user.links.find(l => l.id === id).j.length === 3);
    if (ground.j.length === 3) {
      roman = 'Ⅲ';
      trace.push(`第四步：固定桿 ${ground.id} 是三接頭桿，判定 Stephenson-Ⅲ。`);
    } else if (ternaryNeighbors.length === 2) {
      roman = 'Ⅱ';
      trace.push(`第四步：固定桿 ${ground.id} 是雙接頭桿，且直接連接 2 根三接頭桿（${ternaryNeighbors.join('、')}），依文件判定 Stephenson-Ⅱ。`);
    } else {
      roman = 'Ⅰ';
      trace.push(`第四步：固定桿 ${ground.id} 是雙接頭桿，直接連接的三接頭桿少於 2 根（${ternaryNeighbors.length} 根），依文件判定 Stephenson-Ⅰ。`);
    }
    
    if (roman === 'Ⅰ') group = '4';
    else if (roman === 'Ⅱ') group = '5';
    else group = c4.some(c => c.includes(input.id)) ? '4' : '5';
    
    trace.push(`第二步：依 Stephenson-${roman} 的九型組合與輸入桿所在基本迴路，判定輸入桿在 ${group} 連桿組。`);
  }
  
  trace.push(`第三步：輸入桿 ${input.id} 有 ${input.j.length} 個接頭，因此判定 ${inputKind}（${inputKind === 'B' ? '雙接頭桿' : '三接頭桿'}）。`);
  
  const id = ruleModelId(chain, roman, inputKind, group);
  return { chain, roman, inputKind, group, id, trace, cycles, c4, c5, ground, input };
}

// 執行九型辨識並將結果輸出至 UI
function identifyNineType() {
  const user = parsedUserTopology();
  const errors = validateTopology(user);
  clearIdentification();
  
  if (errors.length) {
    $('identifyStatus').innerHTML = errors.map(x => `• ${x}`).join('<br>');
    $('identifyStatus').className = 'status bad';
    return;
  }
  
  const r = identifyByDocumentRules(user);
  if (r.error) {
    $('identifyStatus').className = 'status bad';
    $('identifyStatus').textContent = r.error;
    return;
  }
  
  const hit = M[r.id]; // M 物件應定義於外部，包含九型清單資料
  $('identifyResult').className = 'identify-result-model';
  $('identifyDetails').innerHTML = `
    <div><b>規則判斷流程：</b></div>
    ${r.trace.map((x, i) => `<div class="rule-trace"><b>${i + 1}.</b> ${x}</div>`).join('')}
    <div><b>找到的簡單迴路：</b>${r.cycles.map(c => `${c.length}桿〔${c.join('－')}〕`).join('；')}</div>
    <div><b>輸入資料指紋：</b>${topologySignature(user)}</div>
  `;
  
  // 若辨識結果不在已知的九型清單內
  if (!hit) {
    identifiedModel = null;
    $('identifyResult').innerHTML = `<h3>${r.chain}${r.roman}${r.inputKind}<sub>${r.group}</sub></h3><p>依文件規則得到的組合不在系統九型清單</p>`;
    $('identifyStatus').className = 'status bad';
    $('identifyStatus').textContent = '已完成四步判斷，但此結果不屬於系統目前定義的九型，因此不自動套用或猜測。請檢查固定桿、輸入桿或文件規則。';
    $('applyIdentifiedModel').disabled = true;
    return;
  }
  
  // 辨識成功
  identifiedModel = r.id;
  $('identifyResult').innerHTML = `<h3>${hit.h}</h3><p>${hit.f}</p>`;
  $('identifyStatus').className = 'status ok';
  $('identifyStatus').textContent = '✓ 已完全依《辨識規則》的四步敘述完成判別。';
  $('applyIdentifiedModel').disabled = false;
}

// ==========================================
// 5. 使用者觸發動作 (按鈕事件綁定目標)
// ==========================================

// 載入範例資料
function loadIdentifyExample() {
  renderTopologyInputRows(true);
}

// 套用辨識出的模型並切換至分支模式
function applyIdentifiedModel() {
  if (!identifiedModel) return;
  selected = identifiedModel; // selected 物件應定義於外部
  init();
  renderCards();
  setTaskMode('branch');
  $('modelNote').insertAdjacentHTML('beforeend', '<br><b>已由使用者輸入的拓樸辨識結果自動套用。</b>');
}
