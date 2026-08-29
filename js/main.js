// MAIN — shared state + application entry point
// 此檔只負責共用模型/狀態、跨模組分析整合與事件綁定。
// Git 開發時請盡量不要直接在 main.js 寫各人的功能演算法。

const $=id=>document.getElementById(id);
function escapeHtml(s){if(s==null)return '';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
let page=1,selected='SIIIB4',analysis=null,posNo=0,inputMode='polar';let animation={playing:false,index:0,lastTime:0,raf:0,branch:0};let specifiedPreview={timer:0,index:0};
const S=[{id:'L1',j:['A','D','G'],n:'ADG三接頭桿'},{id:'L2',j:['A','B'],n:'AB'},{id:'L3',j:['B','C','E'],n:'BCE三接頭桿'},{id:'L4',j:['C','D'],n:'CD'},{id:'L5',j:['E','F'],n:'EF'},{id:'L6',j:['F','G'],n:'FG'}];
const W=[{id:'L1',j:['A','D','G'],n:'ADG三接頭桿'},{id:'L2',j:['A','B'],n:'AB'},{id:'L3',j:['B','C'],n:'BC'},{id:'L4',j:['C','D','E'],n:'CDE三接頭桿'},{id:'L5',j:['E','F'],n:'EF'},{id:'L6',j:['F','G'],n:'FG'}];
const s0={A:[80,340],B:[145,180],C:[285,115],D:[350,340],E:[225,220],F:[395,175],G:[485,285]},w0={A:[80,340],B:[145,180],C:[270,145],D:[330,340],E:[350,190],F:[440,150],G:[510,285]};
// 各型使用獨立的代表性裝配姿態，讓第一頁與第二頁圖形可清楚區分。
const CFG={
 SIT4:{A:[85,185],B:[85,345],C:[245,275],D:[360,330],E:[205,160],F:[385,115],G:[500,205]},
 SIIT5:{A:[70,305],B:[145,185],C:[300,245],D:[365,105],E:[225,345],F:[390,330],G:[500,215]},
 SIIB5:{A:[70,305],B:[165,150],C:[315,105],D:[365,300],E:[255,230],F:[410,285],G:[505,155]},
 SIIIB4:{A:[80,340],B:[145,180],C:[285,115],D:[350,340],E:[225,220],F:[395,175],G:[485,285]},
 SIIIB5:{A:[75,335],B:[155,205],C:[300,125],D:[370,335],E:[245,255],F:[420,225],G:[500,120]},
 WIB4:{A:[80,340],B:[145,180],C:[270,145],D:[330,340],E:[350,190],F:[440,150],G:[510,285]},
 WIT4:{A:[75,330],B:[155,215],C:[285,285],D:[345,120],E:[390,235],F:[485,315],G:[520,150]},
 WIIB4:{A:[75,145],B:[170,245],C:[285,175],D:[345,340],E:[390,285],F:[465,160],G:[525,305]},
 WIIT4:{A:[75,330],B:[165,175],C:[285,115],D:[355,285],E:[410,155],F:[480,260],G:[530,105]}
};
const M={
SIT4:{h:'SⅠT<sub>4</sub>',f:'Stephenson-I',l:S,g:'L5',i:'L3',c:CFG.SIT4,d:'固定 L5，三接頭桿 L3 為輸入。'},
SIIT5:{h:'SⅡT<sub>5</sub>',f:'Stephenson-II',l:S,g:'L2',i:'L3',c:CFG.SIIT5,d:'固定 L2，三接頭桿 L3 為輸入。'},
SIIB5:{h:'SⅡB<sub>5</sub>',f:'Stephenson-II',l:S,g:'L2',i:'L6',c:CFG.SIIB5,d:'固定 L2，二接頭桿 L6 為輸入。'},
SIIIB4:{h:'SⅢB<sub>4</sub>',f:'Stephenson-III',l:S,g:'L1',i:'L2',c:CFG.SIIIB4,d:'固定 L1，二接頭桿 L2 為輸入。'},
SIIIB5:{h:'SⅢB<sub>5</sub>',f:'Stephenson-III',l:S,g:'L1',i:'L6',c:CFG.SIIIB5,d:'固定 L1，二接頭桿 L6 為輸入。'},
WIB4:{h:'WⅠB<sub>4</sub>',f:'Watt-I',l:W,g:'L3',i:'L2',c:CFG.WIB4,d:'固定 L3，二接頭桿 L2 為輸入。'},
WIT4:{h:'WⅠT<sub>4</sub>',f:'Watt-I',l:W,g:'L3',i:'L4',c:CFG.WIT4,d:'固定 L3，三接頭桿 L4 為輸入。'},
WIIB4:{h:'WⅡB<sub>4</sub>',f:'Watt-II',l:W,g:'L1',i:'L6',c:CFG.WIIB4,d:'固定 L1，二接頭桿 L6 為輸入。'},
WIIT4:{h:'WⅡT<sub>4</sub>',f:'Watt-II',l:W,g:'L1',i:'L4',c:CFG.WIIT4,d:'固定 L1，三接頭桿 L4 為輸入。'}
};
let C={};const md=()=>M[selected],clone=o=>JSON.parse(JSON.stringify(o)),rad=d=>d*Math.PI/180,pairs=a=>{let r=[];for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)r.push([a[i],a[j]]);return r},dst=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const gj=()=>new Set(md().l.find(x=>x.id===md().g).j),il=()=>md().l.find(x=>x.id===md().i),pj=()=>{const g=gj(),inp=il();const hit=(inp.j||[]).find(j=>g.has(j));if(hit)return hit;return (inp.j&&inp.j[0])||null;},all=()=>[...new Set(md().l.flatMap(x=>x.j))];

// ===== 跨模組分析整合 =====
function analyze(){
 let o={tol:+$('solveTol').value,maxIter:+$('maxIter').value,step:+$('stepAngle').value,minStep:+$('minStep').value,startAngle:+$('startAngle').value,endAngle:+$('endAngle').value,initial:+$('initialAngle').value,singularTol:+$('singularTol').value,endpointTol:+$('endpointTol').value,geoTol:+($('geoTol')?.value||0.001)};
 let la=buildLoopAnalysis(o);
 let refSol=solve(rad(o.initial),guess0(),o),refBranch=refSol.ok?la.branches.find(b=>b.samples.some(x=>Math.abs(x.angle-o.initial)<o.step*0.7&&asmClose(x.pos,refSol.pos))):null;
 let tol=Math.max(o.step*2,1);
 let sp=specified().map(q=>{
  let cands=la.branches.filter(b=>q.angle>=Math.min(b.from,b.to)-1e-6&&q.angle<=Math.max(b.from,b.to)+1e-6).map(b=>{let s=b.samples.reduce((x,y)=>Math.abs(y.angle-q.angle)<Math.abs(x.angle-q.angle)?y:x);return{branch:b,sample:s,d:Math.abs(s.angle-q.angle)}}).filter(c=>c.d<tol);
  cands.sort((a,b)=>a.d-b.d);
  if(!cands.length)return{...q,ok:false,candidates:[]};
  let def=(refBranch&&cands.findIndex(c=>c.branch===refBranch)>=0)?cands.findIndex(c=>c.branch===refBranch):0,ch=cands[def];
  return{...q,ok:true,candidates:cands,chosen:def,circuit:ch.branch.circuit,branch:ch.branch.id,endpoint:ch.branch.endpoint,s:ch.sample}
 });
 sp.forEach(p=>{if(p.ok&&p.s)p.geom=geometryIndicators(p.s.pos,o.geoTol)});
 let samples=[];la.branches.forEach(b=>b.samples.forEach(x=>{x.branch=b.id;x.circuit=b.circuit;x.signature=b.key;samples.push(x)}));
 let refSamples=(refBranch||la.branches[0]||{samples:[]}).samples;
 return{o,samples,dead:la.dead,verifiedDeadCount:la.verifiedDeadCount,circuits:Array.from({length:la.circuitCount},(_,i)=>({id:i+1})),branches:la.branches,refBranch,specified:sp,constraints:cons(),limitCircle:limitCircleAnalysis(refSamples),searchNote:'採確定性多重初值搜尋；結果為在設定範圍與容許值下找到的候選，不保證代數上的全部實根。'}
}

// ===== 頁面導覽與程式入口 =====
function unlockAnalysisNav(){
  if(typeof taskMode!=='undefined'&&taskMode!=='branch')return;
  document.querySelectorAll('nav .nav').forEach(b=>{b.disabled=false;b.style.opacity='1';b.style.pointerEvents='auto';});
  const nx=$('next'),pv=$('prev');
  if(nx){nx.style.display='';nx.disabled=false;}
  if(pv){pv.style.display='';pv.disabled=false;}
}
function go(n){
  if(n!==7&&typeof stopAnimation==='function')stopAnimation();
  page=Math.max(1,Math.min(7,n));
  // 迴路分析：允許任意跳步，不要求先完成前一步
  if(typeof taskMode==='undefined'||taskMode==='branch') unlockAnalysisNav();
  document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',+x.dataset.page===page));
  document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',+x.dataset.page===page));
  if($('prev'))$('prev').style.visibility=page===1?'hidden':'visible';
  if($('next'))$('next').textContent=page===7?'回到開始':'下一步';
  if(page===3&&typeof preview==='function')preview();
  if(page===6&&typeof resetProgressStages==='function')resetProgressStages();
  if(page===7&&analysis&&typeof update==='function')update();
  scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{if(b.disabled)return;go(+b.dataset.page);});$('prev').onclick=()=>go(page-1);$('next').onclick=()=>go(page===7?1:page+1);$('preview').onclick=preview;$('addPosition').onclick=()=>addPos();if($('resetExample')) $('resetExample').onclick=init;$('modePolar').addEventListener('change',()=>setInputMode('polar'));$('modeCoordinate').addEventListener('change',()=>setInputMode('coordinate'));$('runAnalysis').onclick=()=>{
  if(typeof valid==='function'&&!valid()){
    const st=$('geometryStatus');
    const msg=(st&&st.textContent)||'幾何或拓樸檢查未通過';
    if($('progress'))$('progress').textContent='無法開始分析：'+msg;
    go(2);
    return;
  }
  resetProgressStages();
  $('progress').textContent='建立位置分析方程中…';
  setProgressStage('position','active');
  setTimeout(()=>{
    try{
      setProgressStage('position','done');
      setProgressStage('dead','active');
      $('progress').textContent='追蹤構形並搜尋死點…';
      setTimeout(()=>{
        try{
          const inputSpec=typeof buildInputSpec==='function'?buildInputSpec():null;
          let resultSpec=null;
          if(typeof analyzeWithSpec==='function') resultSpec=analyzeWithSpec(inputSpec);
          if(resultSpec&&resultSpec.analysis){
            window.__lastResultSpec=resultSpec;
            analysis=resultSpec.analysis;
            if(typeof fillSessionMetaStrip==='function')fillSessionMetaStrip(resultSpec);
          }else{
            analysis=analyze();
            window.__lastResultSpec=null;
          }
          if(!analysis||!Array.isArray(analysis.samples)){
            $('progress').textContent='分析未產生有效結果，請檢查尺寸、初始角與角度範圍。';
            setProgressStage('dead','');
            return;
          }
          setProgressStage('dead','done');
          setProgressStage('circuit','active');
          $('progress').textContent='辨識連續可達迴路…';
          setTimeout(()=>{
            setProgressStage('circuit','done');
            setProgressStage('branch','active');
            $('progress').textContent='比對分支端點、速度瞬心與傳動角…';
            setTimeout(()=>{
              setProgressStage('branch','done');
              $('progress').textContent=`完成：${analysis.samples.length} 個有效位置`;
              go(7);
            },300);
          },300);
        }catch(err){
          console.error(err);
          $('progress').textContent='分析失敗：'+(err&&err.message?err.message:String(err));
          setProgressStage('dead','');
        }
      },30);
    }catch(err){
      console.error(err);
      $('progress').textContent='分析失敗：'+(err&&err.message?err.message:String(err));
    }
  },300);
};['showTraj','showDead','showSpecified','showMechanism','showLimits','showGeo'].forEach(id=>$(id).onchange=drawResult);
$('playAnimation').onclick=toggleAnimation;
$('restartAnimation').onclick=restartAnimation;
$('animationTimeline').oninput=e=>{stopAnimation();animation.index=+e.target.value;drawResult()};
$('animationSpeed').onchange=()=>{animation.lastTime=0};document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.id===b.dataset.tab))});if($('exportJson')&&typeof exportSession!=='function')$('exportJson').onclick=()=>{if(!analysis)return;let b=new Blob([JSON.stringify({model:selected,coordinates:C,analysis},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`${selected}-analysis.json`;a.click()};renderCards();init();addPos(-45,'P1');addPos(0,'P2');addPos(45,'P3');
// 可由 pages/*.html 透過 ?step=N 指定主程式開啟頁面。
const requestedStep=Number(new URLSearchParams(location.search).get('step'));
go(Number.isFinite(requestedStep)&&requestedStep>=1&&requestedStep<=7?requestedStep:1);

// ===== 九型辨識頁事件 =====
['taskIdentify','taskRecommend','taskBranch'].forEach(id=>{const el=$(id);if(el)el.addEventListener('change',()=>setTaskMode(el.value));});
$('identifyNineType').onclick=identifyNineType;$('loadIdentifyExample').onclick=loadIdentifyExample;$('clearTopology').onclick=()=>renderTopologyInputRows(false);$('applyIdentifiedModel').onclick=applyIdentifiedModel;
renderTopologyInputRows(false);
try{initFunctionRecommendation();}catch(err){console.error('initFunctionRecommendation',err);}
try{if(typeof wireGeometryActionButtons==='function')wireGeometryActionButtons();}catch(err){console.error('wireGeometryActionButtons',err);}

// mode bootstrap handled by commercial landing (enterTool / showLanding)



// ===== Commercial landing: tool entry =====
const TOOL_META = {
  identify: { title: '機構名稱解析' },
  recommend: { title: '構型智慧推薦' },
  branch: { title: '機構迴路分析' }
};

function showLanding() {
  document.getElementById('landing').classList.remove('is-hidden');
  document.getElementById('appWorkspace').classList.remove('is-visible');
  document.body.classList.remove('app-mode');
  if (typeof stopAnimation === 'function') stopAnimation();
}

function enterTool(mode) {
  const meta = TOOL_META[mode] || TOOL_META.identify;
  document.getElementById('landing').classList.add('is-hidden');
  document.getElementById('appWorkspace').classList.add('is-visible');
  document.body.classList.add('app-mode');
  const wt = document.getElementById('workspaceTitle');
  if (wt) wt.textContent = meta.title;
  setTaskMode(mode);
  if (mode === 'branch' && typeof unlockAnalysisNav === 'function') unlockAnalysisNav();
  go(mode === 'branch' ? 1 : 1);
  try {
    const u = new URL(location.href);
    u.searchParams.set('mode', mode);
    history.replaceState(null, '', u);
  } catch (e) {}
}

document.querySelectorAll('[data-enter-mode]').forEach(btn => {
  btn.addEventListener('click', () => enterTool(btn.dataset.enterMode));
});
const backBtn = document.getElementById('backToLanding');
if (backBtn) backBtn.addEventListener('click', () => {
  showLanding();
  try {
    const u = new URL(location.href);
    u.searchParams.delete('mode');
    history.replaceState(null, '', u);
  } catch (e) {}
});

(function bootstrapLanding() {
  const m = new URLSearchParams(location.search).get('mode');
  if (m === 'recommend' || m === 'branch' || m === 'identify') {
    enterTool(m);
  } else {
    showLanding();
  }
})();


// ===== Session / 可回朔層接線 =====
function fillSessionMetaStrip(resultSpec) {
  const strip = document.getElementById('sessionMetaStrip');
  if (!strip) return;
  const meta = resultSpec && resultSpec.meta;
  if (!meta) {
    strip.hidden = true;
    return;
  }
  strip.hidden = false;
  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '';
  };
  set('metaBuild', meta.sessionId || meta.softwareBuild || '');
  set('metaHash', meta.inputHash || '');
  let timeText = '';
  if (meta.timestamp) {
    try {
      const d = new Date(meta.timestamp);
      timeText = !isNaN(d) ? d.toLocaleString('zh-TW', { hour12: false }) : meta.timestamp;
    } catch (e) { timeText = meta.timestamp; }
  }
  set('metaTime', timeText);
}

try {
  if (typeof wireSessionUi === 'function') wireSessionUi();
} catch (err) {
  console.error('wireSessionUi', err);
}
