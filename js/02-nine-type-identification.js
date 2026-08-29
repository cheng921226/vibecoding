// Person 2 — Nine-type Identification
// 使用者拓樸輸入與九型機構辨識規則。

// V1.7 — 第一階段：依使用者輸入的拓樸真正辨識九型
let taskMode = 'identify', identifiedModel = null, identificationCandidates = [];
function linkOptions() {
  return Array.from({ length: 6 }, (_, i) => `<option value="L${i + 1}">L${i + 1}</option>`).join('');
}
function parseJointsFromInput(val) {
  return String(val || '').split(/[,，;；\s]+/).map(x => x.trim()).filter(Boolean);
}
function renderTopologyInputRows(useExample = false) {
  const source = useExample ? md().l : [];
  $('topologyInputs').innerHTML = Array.from({ length: 6 }, (_, i) => {
    const l = source[i] || { id: `L${i + 1}`, j: [] };
    return `<div class="topology-row"><b>L${i + 1}</b><label>此桿上的接頭<input data-topology-link="L${i + 1}" value="${l.j.join(', ')}" placeholder="例如 A, B；三接頭桿填 A, D, G"></label></div>`;
  }).join('');
  $('identifyGround').innerHTML = linkOptions();
  $('identifyInput').innerHTML = linkOptions();
  $('identifyGround').value = useExample ? md().g : 'L1';
  $('identifyInput').value = useExample ? md().i : 'L2';
  const onEdit = () => { clearIdentification(); };
  document.querySelectorAll('[data-topology-link]').forEach(x => x.addEventListener('input', onEdit));
  $('identifyGround').onchange = onEdit;
  $('identifyInput').onchange = onEdit;
  clearIdentification();
}
function clearIdentification() { identifiedModel = null; identificationCandidates = []; $('identifyResult').className = 'identify-result-empty'; $('identifyResult').textContent = '尚未辨識'; $('identifyDetails').innerHTML = ''; $('identifyStatus').textContent = ''; $('identifyStatus').className = 'status'; $('applyIdentifiedModel').disabled = true }
function setTaskMode(mode) {
    taskMode = mode; const identify = mode === 'identify', recommend = mode === 'recommend', branch = mode === 'branch';
    const idp = $('identifyPanel'), rp = $('recommendPanel'), bp = $('branchModelPanel');
    if (idp) idp.hidden = !identify; if (rp) rp.hidden = !recommend; if (bp) bp.hidden = !branch;
    const ti = $('taskIdentify'), tr = $('taskRecommend'), tb = $('taskBranch');
    if (ti) ti.checked = identify; if (tr) tr.checked = recommend; if (tb) tb.checked = branch;
    $('taskIdentifyLabel')?.classList.toggle('active', identify);
    $('taskRecommendLabel')?.classList.toggle('active', recommend);
    $('taskBranchLabel')?.classList.toggle('active', branch);
    document.body.classList.toggle('mode-recommend', recommend);
    document.body.classList.toggle('mode-identify', identify);
    document.body.classList.toggle('mode-branch', branch);
    // 僅辨識／推薦模式鎖住步驟導覽；迴路分析可自由跳步（1～7）
    const locked = !branch;
    document.querySelectorAll('nav .nav').forEach((b) => {
      if (locked) {
        const step = +b.dataset.page;
        b.disabled = step !== 1;
        b.style.opacity = step !== 1 ? '.45' : '1';
      } else {
        b.disabled = false;
        b.style.opacity = '1';
        b.style.pointerEvents = 'auto';
      }
    });
    const nx = $('next'), pv = $('prev');
    if (nx) {
      nx.style.display = locked ? 'none' : '';
      nx.disabled = false;
    }
    if (pv) {
      pv.style.display = locked ? 'none' : '';
      pv.disabled = false;
    }
}

function parsedUserTopology() {
    const links = [];
    document.querySelectorAll('[data-topology-link]').forEach(inp => {
        const joints = inp.value.split(/[,，;；\s]+/).map(x => x.trim()).filter(Boolean);
        links.push({ id: inp.dataset.topologyLink, j: [...new Set(joints)] })
    });
    return { links, ground: $('identifyGround').value, input: $('identifyInput').value }
}
function topologyGraph(links) {
    const jointOwners = new Map(), ids = links.map(x => x.id), adj = {}; ids.forEach(id => adj[id] = new Set());
    links.forEach(l => l.j.forEach(j => { if (!jointOwners.has(j)) jointOwners.set(j, []); jointOwners.get(j).push(l.id) }));
    for (const owners of jointOwners.values()) if (owners.length === 2) { adj[owners[0]].add(owners[1]); adj[owners[1]].add(owners[0]) }
    return { ids, adj, jointOwners, degrees: Object.fromEntries(links.map(l => [l.id, l.j.length])) }
}
function enumerateSimpleCycles(links) {
    const g = topologyGraph(links), ids = g.ids.slice().sort(), found = new Map();
    function canonical(c) {
        const variants = [];
        for (const q of [c, c.slice().reverse()]) for (let i = 0; i < q.length; i++)variants.push(q.slice(i).concat(q.slice(0, i)).join('|'));
        return variants.sort()[0]
    }
    function dfs(start, current, path, seen) {
        for (const next of g.adj[current]) {
            if (next === start && path.length >= 3) { const key = canonical(path); found.set(key, path.slice()); continue }
            if (seen.has(next) || next < start) continue;
            seen.add(next); path.push(next); dfs(start, next, path, seen); path.pop(); seen.delete(next)
        }
    }
    ids.forEach(start => dfs(start, start, [start], new Set([start])));
    return [...found.values()].sort((a, b) => a.length - b.length || a.join('').localeCompare(b.join('')))
}
function validateTopology(user) {
    const g = topologyGraph(user.links), errors = [];
    if (user.ground === user.input) errors.push('固定桿與輸入桿不可為同一根桿。');
    user.links.forEach(l => { if (l.j.length < 2 || l.j.length > 3) errors.push(`${l.id} 必須輸入 2 或 3 個不同接頭。`) });
    if (g.jointOwners.size !== 7) errors.push(`目前共有 ${g.jointOwners.size} 個不同接頭；標準平面六連桿應有 7 個旋轉接頭。`);
    for (const [j, o] of g.jointOwners) if (o.length !== 2) errors.push(`接頭 ${j} 目前連接 ${o.length} 根桿；每個旋轉接頭必須剛好由兩根桿共用。`);
    const ternary = user.links.filter(l => l.j.length === 3).length; if (ternary !== 2) errors.push(`目前有 ${ternary} 根三接頭桿；此規則要求 2 根三接頭桿。`);
    const seen = new Set(), stack = [user.links[0]?.id]; while (stack.length) { const x = stack.pop(); if (!x || seen.has(x)) continue; seen.add(x); g.adj[x].forEach(y => stack.push(y)) } if (seen.size !== 6) errors.push('輸入的六根桿沒有形成單一連通運動鏈。');
    return errors
}
function topologySignature(user) { const g = topologyGraph(user.links); return user.links.map(l => `${l.id}:${l.j.length}接頭/鄰接${[...g.adj[l.id]].sort().join(',')}`).join('；') }
function ruleModelId(chain, roman, inputKind, group) { return `${chain}${roman}${inputKind}${group}`.replace('SⅠ', 'SI').replace('SⅡ', 'SII').replace('SⅢ', 'SIII').replace('WⅠ', 'WI').replace('WⅡ', 'WII') }
function identifyByDocumentRules(user) {
    const g = topologyGraph(user.links), cycles = enumerateSimpleCycles(user.links), c4 = cycles.filter(c => c.length === 4), c5 = cycles.filter(c => c.length === 5);
    const trace = []; let chain = '';
    if (c4.length === 2) { chain = 'W'; trace.push(`第一步：找到 ${c4.length} 個四連桿迴路，因此判定 W（Watt：兩個四連桿共用一個連桿）。`) }
    else if (c4.length === 1 && c5.length >= 1) { chain = 'S'; trace.push(`第一步：找到 1 個四連桿迴路及 ${c5.length} 個五連桿迴路，因此判定 S（Stephenson：一個四連桿加一個五連桿）。`) }
    else return { error: `迴路長度不符合文件規則：四連桿迴路 ${c4.length} 個、五連桿迴路 ${c5.length} 個。`, cycles };
    const ground = user.links.find(l => l.id === user.ground), input = user.links.find(l => l.id === user.input), inputKind = input.j.length === 3 ? 'T' : 'B';
    let roman = '', group = '';
    if (chain === 'W') {
        roman = ground.j.length === 3 ? 'Ⅱ' : 'Ⅰ';
        if (ground.j.length === 2) { const involvedTernary = new Set(c4.filter(c => c.includes(ground.id)).flatMap(c => c.filter(id => user.links.find(l => l.id === id).j.length === 3))); trace.push(`第四步：固定桿 ${ground.id} 是雙接頭桿；其四連桿組涉及 ${involvedTernary.size} 根三接頭桿，判定 Watt-Ⅰ。`) }
        else trace.push(`第四步：固定桿 ${ground.id} 是三接頭桿，判定 Watt-Ⅱ。`);
        group = '4'; trace.push(`第二步：Watt 的兩個基本迴路皆為四連桿組，輸入桿判定在 4 組。`)
    } else {
        const ternaryNeighbors = [...g.adj[ground.id]].filter(id => user.links.find(l => l.id === id).j.length === 3);
        if (ground.j.length === 3) { roman = 'Ⅲ'; trace.push(`第四步：固定桿 ${ground.id} 是三接頭桿，判定 Stephenson-Ⅲ。`) }
        else if (ternaryNeighbors.length === 2) { roman = 'Ⅱ'; trace.push(`第四步：固定桿 ${ground.id} 是雙接頭桿，且直接連接 2 根三接頭桿（${ternaryNeighbors.join('、')}），依文件判定 Stephenson-Ⅱ。`) }
        else { roman = 'Ⅰ'; trace.push(`第四步：固定桿 ${ground.id} 是雙接頭桿，直接連接的三接頭桿少於 2 根（${ternaryNeighbors.length} 根），依文件判定 Stephenson-Ⅰ。`) }
        if (roman === 'Ⅰ') group = '4';
        else if (roman === 'Ⅱ') group = '5';
        else group = c4.some(c => c.includes(input.id)) ? '4' : '5';
        trace.push(`第二步：依 Stephenson-${roman} 的九型組合與輸入桿所在基本迴路，判定輸入桿在 ${group} 連桿組。`)
    }
    trace.push(`第三步：輸入桿 ${input.id} 有 ${input.j.length} 個接頭，因此判定 ${inputKind}（${inputKind === 'B' ? '雙接頭桿' : '三接頭桿'}）。`);
    const id = ruleModelId(chain, roman, inputKind, group);
    return { chain, roman, inputKind, group, id, trace, cycles, c4, c5, ground, input }
}
function identifyNineType() {
    const user = parsedUserTopology(), errors = validateTopology(user); clearIdentification();
    if (errors.length) { $('identifyStatus').innerHTML = errors.map(x => `• ${escapeHtml(x)}`).join('<br>'); $('identifyStatus').className = 'status bad'; return }
    const r = identifyByDocumentRules(user);
    if (r.error) { $('identifyStatus').className = 'status bad'; $('identifyStatus').textContent = r.error; return }
    const hit = M[r.id];
    $('identifyResult').className = 'identify-result-model';
    $('identifyDetails').innerHTML = `<div><b>規則判斷流程：</b></div>${r.trace.map((x, i) => `<div class="rule-trace"><b>${i + 1}.</b> ${x}</div>`).join('')}<div><b>找到的簡單迴路：</b>${r.cycles.map(c => `${c.length}桿〔${c.join('－')}〕`).join('；')}</div><div><b>輸入資料指紋：</b>${topologySignature(user)}</div>`;
    if (!hit) { identifiedModel = null; $('identifyResult').innerHTML = `<h3>${r.chain}${r.roman}${r.inputKind}<sub>${r.group}</sub></h3><p>依文件規則得到的組合不在系統九型清單</p>`; $('identifyStatus').className = 'status bad'; $('identifyStatus').textContent = '已完成四步判斷，但此結果不屬於系統目前定義的九型，因此不自動套用或猜測。請檢查固定桿、輸入桿或文件規則。'; $('applyIdentifiedModel').disabled = true; return }
    identifiedModel = r.id; $('identifyResult').innerHTML = `<h3>${hit.h}</h3><p>${hit.f}</p>`; $('identifyStatus').className = 'status ok'; $('identifyStatus').textContent = '✓ 已完全依《辨識規則》的四步敘述完成判別。'; $('applyIdentifiedModel').disabled = false
}
function loadIdentifyExample() {
  renderTopologyInputRows(true);
  // 只填入示範拓樸，不自動執行四步辨識
  if (typeof clearIdentification === 'function') clearIdentification();
  const st = $('identifyStatus');
  if (st) {
    st.className = 'status';
    st.textContent = '已載入示範拓樸，請按「依文件四步規則辨識」執行判別。';
  }
}
function applyIdentifiedModel() {
  if (!identifiedModel || !M[identifiedModel]) return;
  selected = identifiedModel;
  if (typeof init === 'function') init();
  if (typeof renderCards === 'function') renderCards();
  if (typeof setTaskMode === 'function') setTaskMode('branch');
  document.body.classList.remove('mode-recommend', 'mode-identify');
  document.body.classList.add('mode-branch', 'app-mode');
  const landing = document.getElementById('landing');
  const workspace = document.getElementById('appWorkspace');
  if (landing) landing.classList.add('is-hidden');
  if (workspace) workspace.classList.add('is-visible');
  const wt = $('workspaceTitle');
  if (wt) wt.textContent = '機構迴路分析';
  try {
    const u = new URL(location.href);
    u.searchParams.set('mode', 'branch');
    history.replaceState(null, '', u);
  } catch (e) {}
  document.querySelectorAll('nav .nav').forEach(b => { b.disabled = false; b.style.opacity = '1'; });
  const nx = $('next'), pv = $('prev');
  if (nx) nx.style.display = '';
  if (pv) pv.style.display = '';
  const note = $('modelNote');
  if (note) {
    note.innerHTML = `<b>${M[identifiedModel].h}｜${M[identifiedModel].f}</b><br>${M[identifiedModel].d}<br>固定桿 ${M[identifiedModel].g}；輸入桿 ${M[identifiedModel].i}。<br><b>已由拓樸辨識結果套用。</b>`;
  }
  if (typeof go === 'function') go(2);
}
