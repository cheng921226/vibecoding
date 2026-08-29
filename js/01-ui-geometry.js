// Person 1 — UI / Geometry
// 幾何輸入、座標/極座標、拓樸顯示與基本驗證。
if(typeof window.escapeHtml!=='function'){window.escapeHtml=function(s){if(s==null)return '';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');};}

function svgCard(m){
 let q=Object.values(m.c),xs=q.map(x=>x[0]),ys=q.map(x=>x[1]),mnx=Math.min(...xs)-35,mxx=Math.max(...xs)+35,mny=Math.min(...ys)-35,mxy=Math.max(...ys)+35;
 const X=x=>(x-mnx)/(mxx-mnx)*210+15,Y=y=>(y-mny)/(mxy-mny)*105+12;
 let L=m.l.flatMap(l=>pairs(l.j).map(([a,b])=>`<line x1="${X(m.c[a][0])}" y1="${Y(m.c[a][1])}" x2="${X(m.c[b][0])}" y2="${Y(m.c[b][1])}" stroke="${l.id===m.g?'#788b92':l.id===m.i?'#b65a42':'#12676c'}" stroke-width="${l.j.length===3?5.5:4.5}" stroke-linecap="round"/>`)).join('');
 let dots=Object.entries(m.c).map(([j,p])=>`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="3.2" fill="#fff" stroke="#17343b" stroke-width="1.4"/><text x="${X(p[0])+5}" y="${Y(p[1])-4}" font-size="8" fill="#233940">${j}</text>`).join('');
 return `<svg viewBox="0 0 240 125" aria-label="${m.f} 構型圖">${L}${dots}</svg>`
}
function renderCards(){$('modelCards').innerHTML=Object.entries(M).map(([id,m])=>`<button class="model-card ${id===selected?'active':''}" data-id="${id}">${svgCard(m)}<h3>${m.h}</h3><p>${m.f}</p><span>可分析</span></button>`).join('');document.querySelectorAll('.model-card').forEach(b=>b.onclick=()=>{selected=b.dataset.id;init();renderCards()});$('modelNote').innerHTML=`<b>${md().h}｜${md().f}</b><br>${md().d}<br>固定桿 <b>${md().g}</b>；輸入桿 <b>${md().i}</b>。<br><span class="name-hint">命名：L1～L6 為六根連桿；A～G 為七個旋轉接頭。B＝二接頭輸入桿，T＝三接頭輸入桿；下標 4／5 表示輸入位於四連桿組或五連桿組。</span>`}
function init(){C=clone(md().c);renderGeometryInputs();renderLengths();drawTopo();valid();$('runTitle').innerHTML=`分析 ${md().h}｜${md().f}`}
function cons(){let r=[];md().l.forEach(l=>pairs(l.j).forEach(([a,b])=>r.push({a,b,L:dst(C[a],C[b]),link:l.id})));return r}
function geometryParentMap(){
 let joints=all(),root=joints.includes('A')?'A':joints[0],edges=[];
 md().l.forEach(l=>pairs(l.j).forEach(([a,b])=>edges.push([a,b])));
 let parent={[root]:null},queue=[root];
 while(queue.length){let u=queue.shift();for(let [a,b] of edges){let w=a===u?b:b===u?a:null;if(w&&!(w in parent)){parent[w]=u;queue.push(w)}}}
 joints.forEach((j,i)=>{if(!(j in parent))parent[j]=i?joints[i-1]:null});
 return{root,parent}
}
function polarData(){
 let {root,parent}=geometryParentMap(),data={root,items:[]};
 all().forEach(j=>{if(j===root)return;let p=parent[j],dx=C[j][0]-C[p][0],dy=C[j][1]-C[p][1];data.items.push({j,parent:p,L:Math.hypot(dx,dy),angle:Math.atan2(dy,dx)*180/Math.PI})});
 return data
}
function rebuildFromPolar(){
 let {root,parent}=geometryParentMap(),baseX=+$('polarBaseX').value,baseY=+$('polarBaseY').value,next={[root]:[baseX,baseY]},pending=all().filter(j=>j!==root),guard=0;
 while(pending.length&&guard++<50){pending=pending.filter(j=>{let p=parent[j];if(!next[p])return true;let L=+document.querySelector(`[data-polar-j="${j}"][data-polar-k="L"]`).value,a=+document.querySelector(`[data-polar-j="${j}"][data-polar-k="angle"]`).value*Math.PI/180;next[j]=[next[p][0]+L*Math.cos(a),next[p][1]+L*Math.sin(a)];return false})}
 Object.assign(C,next);renderCoords();renderLengths();drawTopo();valid()
}
function renderPolar(){
 let d=polarData();
 $('polarFields').innerHTML=`<div class="polar-row base"><b>${d.root}</b><label>基準 x<input id="polarBaseX" type="number" value="${C[d.root][0]}"></label><label>基準 y<input id="polarBaseY" type="number" value="${C[d.root][1]}"></label><small>其他接頭皆由此基準逐步建立。</small></div>`+
 d.items.map(x=>`<div class="polar-row"><b>${x.j}</b><label>${x.parent}→${x.j} 長度<input data-polar-j="${x.j}" data-polar-k="L" type="number" min="0.000001" value="${x.L.toFixed(8)}"></label><label>角度（°）<input data-polar-j="${x.j}" data-polar-k="angle" type="number" value="${x.angle.toFixed(8)}"></label><small>參考接頭：${x.parent}；角度相對全域 +x 軸。</small></div>`).join('');
 document.querySelectorAll('#polarFields input').forEach(x=>x.oninput=rebuildFromPolar)
}
function renderCoords(){$('coordFields').innerHTML=all().map(j=>`<div class="coord-row ${gj().has(j)?'fixed':''} ${il().j.includes(j)?'driver':''}"><b>${j}</b><label>x<input data-j="${j}" data-k="0" value="${C[j][0]}" type="number"></label><label>y<input data-j="${j}" data-k="1" value="${C[j][1]}" type="number"></label></div>`).join('');document.querySelectorAll('#coordFields input').forEach(x=>x.oninput=()=>{C[x.dataset.j][+x.dataset.k]=+x.value;renderPolar();renderLengths();drawTopo();valid()})}
function setInputMode(mode){
 inputMode=mode;let polar=mode==='polar',polarPanel=$('polarInputPanel'),coordPanel=$('coordinateInputPanel');
 polarPanel.hidden=!polar;coordPanel.hidden=polar;
 $('modePolar').checked=polar;$('modeCoordinate').checked=!polar;
 $('modePolarLabel').classList.toggle('active',polar);$('modeCoordinateLabel').classList.toggle('active',!polar);
 polarPanel.querySelectorAll('input,select,button').forEach(x=>x.disabled=!polar);
 coordPanel.querySelectorAll('input,select,button').forEach(x=>x.disabled=polar);
 if(polar)renderPolar();else renderCoords()
}
function renderGeometryInputs(){renderCoords();renderPolar();setInputMode(inputMode)}
function renderLengths(){$('lengthTable').innerHTML=md().l.map(l=>`<div class="length-item"><b>${l.id}</b> ${l.n}<br>${pairs(l.j).map(([a,b])=>`${a}${b}=${dst(C[a],C[b]).toFixed(4)}`).join('；')}</div>`).join('')}
function drawTopo(){let s=$('topologySvg'),q=Object.values(C),xs=q.map(x=>x[0]),ys=q.map(x=>x[1]),mnx=Math.min(...xs)-70,mxx=Math.max(...xs)+70,mny=Math.min(...ys)-70,mxy=Math.max(...ys)+70,X=x=>(x-mnx)/(mxx-mnx)*560+30,Y=y=>(y-mny)/(mxy-mny)*400+30;s.innerHTML='';md().l.forEach(l=>pairs(l.j).forEach(([a,b])=>{let A=C[a],B=C[b],co=l.id===md().g?'#788b92':l.id===md().i?'#b65a42':'#12676c';s.insertAdjacentHTML('beforeend',`<line x1="${X(A[0])}" y1="${Y(A[1])}" x2="${X(B[0])}" y2="${Y(B[1])}" stroke="${co}" stroke-width="${l.j.length===3?8:6}" stroke-linecap="round"/>`);let mx=(X(A[0])+X(B[0]))/2,my=(Y(A[1])+Y(B[1]))/2,dx=Y(B[1])-Y(A[1]),dy=-(X(B[0])-X(A[0])),n=Math.hypot(dx,dy)||1;s.insertAdjacentHTML('beforeend',`<text x="${mx+dx/n*28}" y="${my+dy/n*28}" font-size="13" text-anchor="middle">${a}${b}</text>`)}));Object.entries(C).forEach(([j,p])=>s.insertAdjacentHTML('beforeend',`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="7" fill="#fff" stroke="#17343b" stroke-width="3"/><text x="${X(p[0])+12}" y="${Y(p[1])-10}" font-size="16" font-weight="bold">${j}</text>`));$('diagramTitle').innerHTML=`${md().h}｜固定 ${md().g}／輸入 ${md().i}`;$('modelBadge').innerHTML=md().h}
function valid(){let bad=cons().some(x=>x.L<1e-6),cm=il().j.filter(j=>gj().has(j)).length,m;if(bad){m='存在重合接頭，請調整座標或桿長。';}else if(cm!==1){m=cm===0?'注意：固定桿與輸入桿目前沒有共用接頭，將以輸入桿端點作為驅動樞紐（部分型式如 SⅡB₅ 屬此情形）。':'注意：固定桿與輸入桿共用超過一個接頭，請檢查拓樸。';}else{m='✓ 幾何與拓樸檢查通過';}$('geometryStatus').textContent=m;$('geometryStatus').className='status '+(bad?'bad':(cm===1?'ok':''));return!bad}


/** 代入目前九型的範例座標／尺寸 */
function loadExampleGeometry() {
  if (typeof init === 'function') init();
  const st = $('geometryStatus');
  if (st && !st.textContent) { /* init/valid sets status */ }
}

/** 清除目前輸入的尺寸與座標（歸零，不改構型） */
function clearGeometry() {
  const joints = typeof all === 'function' ? all() : Object.keys(C || {});
  joints.forEach(j => { C[j] = [0, 0]; });
  if (typeof renderGeometryInputs === 'function') renderGeometryInputs();
  if (typeof renderLengths === 'function') renderLengths();
  if (typeof drawTopo === 'function') drawTopo();
  if (typeof valid === 'function') valid();
  const st = $('geometryStatus');
  if (st) {
    st.textContent = '已清除數值，請重新輸入或代入範例尺寸。';
    st.className = 'status';
  }
}

/** 依目前欄位重算並更新圖與桿長表 */
function updateGeometry() {
  if (typeof inputMode !== 'undefined' && inputMode === 'polar' && typeof rebuildFromPolar === 'function') {
    rebuildFromPolar();
  } else {
    document.querySelectorAll('#coordFields input').forEach(x => {
      if (x.dataset.j != null) C[x.dataset.j][+x.dataset.k] = +x.value;
    });
    if (typeof renderPolar === 'function') renderPolar();
    if (typeof renderLengths === 'function') renderLengths();
    if (typeof drawTopo === 'function') drawTopo();
    if (typeof valid === 'function') valid();
  }
}

function wireGeometryActionButtons() {
  const loadBtn = $('geoLoadExample');
  const clearBtn = $('geoClear');
  const updateBtn = $('geoUpdate');
  if (loadBtn) loadBtn.onclick = () => loadExampleGeometry();
  if (clearBtn) clearBtn.onclick = () => clearGeometry();
  if (updateBtn) updateBtn.onclick = () => updateGeometry();
}
