// MAIN — shared state + application entry point
// 此檔只負責共用模型/狀態、跨模組分析整合與事件綁定。
// Git 開發時請盡量不要直接在 main.js 寫各人的功能演算法。

const $=id=>document.getElementById(id);let page=1,selected='SIIIB4',analysis=null,posNo=0,inputMode='polar';let animation={playing:false,index:0,lastTime:0,raf:0,branch:0};let specifiedPreview={timer:0,index:0};
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
const M={SIT4:{h:'SⅠT<sub>4</sub>',f:'Stephenson-I',l:S,g:'L2',i:'L3',c:CFG.SIT4,d:'固定 L2，三接頭桿 L3 為輸入。'},SIIT5:{h:'SⅡT<sub>5</sub>',f:'Stephenson-II',l:S,g:'L5',i:'L3',c:CFG.SIIT5,d:'固定 L5，三接頭桿 L3 為輸入。'},SIIB5:{h:'SⅡB<sub>5</sub>',f:'Stephenson-II',l:S,g:'L5',i:'L6',c:CFG.SIIB5,d:'固定 L5，二接頭桿 L6 為輸入。'},SIIIB4:{h:'SⅢB<sub>4</sub>',f:'Stephenson-III',l:S,g:'L1',i:'L2',c:CFG.SIIIB4,d:'固定 L1，二接頭桿 L2 為輸入。'},SIIIB5:{h:'SⅢB<sub>5</sub>',f:'Stephenson-III',l:S,g:'L1',i:'L6',c:CFG.SIIIB5,d:'固定 L1，二接頭桿 L6 為輸入。'},WIB4:{h:'WⅠB<sub>4</sub>',f:'Watt-I',l:W,g:'L3',i:'L2',c:CFG.WIB4,d:'固定 L3，二接頭桿 L2 為輸入。'},WIT4:{h:'WⅠT<sub>4</sub>',f:'Watt-I',l:W,g:'L3',i:'L4',c:CFG.WIT4,d:'固定 L3，三接頭桿 L4 為輸入。'},WIIB4:{h:'WⅡB<sub>4</sub>',f:'Watt-II',l:W,g:'L5',i:'L6',c:CFG.WIIB4,d:'固定 L5，二接頭桿 L6 為輸入。'},WIIT4:{h:'WⅡT<sub>4</sub>',f:'Watt-II',l:W,g:'L5',i:'L4',c:CFG.WIIT4,d:'固定 L5，三接頭桿 L4 為輸入。'}};
let C={};const md=()=>M[selected],clone=o=>JSON.parse(JSON.stringify(o)),rad=d=>d*Math.PI/180,pairs=a=>{let r=[];for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)r.push([a[i],a[j]]);return r},dst=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const gj=()=>new Set(md().l.find(x=>x.id===md().g).j),il=()=>md().l.find(x=>x.id===md().i),pj=()=>il().j.find(j=>gj().has(j)),all=()=>[...new Set(md().l.flatMap(x=>x.j))];

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
function go(n){if(n!==7)stopAnimation();page=Math.max(1,Math.min(7,n));document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',+x.dataset.page===page));document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',+x.dataset.page===page));$('prev').style.visibility=page===1?'hidden':'visible';$('next').textContent=page===7?'回到開始':'下一步';if(page===3)preview();if(page===6)resetProgressStages();if(page===7&&analysis)update();scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>go(+b.dataset.page));$('prev').onclick=()=>go(page-1);$('next').onclick=()=>go(page===7?1:page+1);$('preview').onclick=preview;$('addPosition').onclick=()=>addPos();$('resetExample').onclick=init;$('modePolar').addEventListener('change',()=>setInputMode('polar'));$('modeCoordinate').addEventListener('change',()=>setInputMode('coordinate'));$('runAnalysis').onclick=()=>{if(!valid())return;resetProgressStages();$('progress').textContent='建立位置分析方程中…';setProgressStage('position','active');setTimeout(()=>{setProgressStage('position','done');setProgressStage('dead','active');$('progress').textContent='追蹤構形並搜尋死點…';setTimeout(()=>{analysis=analyze();setProgressStage('dead','done');setProgressStage('circuit','active');$('progress').textContent='辨識連續可達迴路…';setTimeout(()=>{setProgressStage('circuit','done');setProgressStage('branch','active');$('progress').textContent='比對分支端點、速度瞬心與傳動角…';setTimeout(()=>{setProgressStage('branch','done');$('progress').textContent=`完成：${analysis.samples.length} 個有效位置`;go(7)},300)},300)},30)},300)};['showTraj','showDead','showSpecified','showMechanism','showLimits','showGeo'].forEach(id=>$(id).onchange=drawResult);
$('playAnimation').onclick=toggleAnimation;
$('restartAnimation').onclick=restartAnimation;
$('animationTimeline').oninput=e=>{stopAnimation();animation.index=+e.target.value;drawResult()};
$('animationSpeed').onchange=()=>{animation.lastTime=0};document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.id===b.dataset.tab))});$('exportJson').onclick=()=>{if(!analysis)return;let b=new Blob([JSON.stringify({model:selected,coordinates:C,analysis},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`${selected}-analysis.json`;a.click()};renderCards();init();addPos(-45,'P1');addPos(0,'P2');addPos(45,'P3');
// 可由 pages/*.html 透過 ?step=N 指定主程式開啟頁面。
const requestedStep=Number(new URLSearchParams(location.search).get('step'));
go(Number.isFinite(requestedStep)&&requestedStep>=1&&requestedStep<=7?requestedStep:1);

// ===== 九型辨識頁事件 =====
$('taskIdentify').addEventListener('change',()=>setTaskMode('identify'));
$('taskBranch').addEventListener('change',()=>setTaskMode('branch'));
$('identifyNineType').onclick=identifyNineType;$('loadIdentifyExample').onclick=loadIdentifyExample;$('clearTopology').onclick=()=>renderTopologyInputRows(false);$('applyIdentifiedModel').onclick=applyIdentifiedModel;
renderTopologyInputRows(false);setTaskMode('identify');

