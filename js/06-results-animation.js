// Person 6 — Results / Animation
// 結果表格、建議、Canvas 繪圖、分支動畫與 UI 顯示。

function applyAssemblyChoice(i,idx){let p=analysis.specified[i];if(!p||!p.candidates||!p.candidates[idx])return;let ch=p.candidates[idx];p.chosen=idx;p.circuit=ch.branch.circuit;p.branch=ch.branch.id;p.endpoint=ch.branch.endpoint;p.s=ch.sample;update()}
function canvasDraw(cv,p){let ctx=cv.getContext('2d');ctx.clearRect(0,0,cv.width,cv.height);let q=Object.values(p),xs=q.map(x=>x[0]),ys=q.map(x=>x[1]),mnx=Math.min(...xs)-60,mxx=Math.max(...xs)+60,mny=Math.min(...ys)-60,mxy=Math.max(...ys)+60,sc=Math.min(cv.width/(mxx-mnx),cv.height/(mxy-mny)),X=x=>(x-mnx)*sc+20,Y=y=>(y-mny)*sc+20;md().l.forEach(l=>pairs(l.j).forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(X(p[a][0]),Y(p[a][1]));ctx.lineTo(X(p[b][0]),Y(p[b][1]));ctx.strokeStyle=l.id===md().g?'#788b92':l.id===md().i?'#b65a42':'#12676c';ctx.lineWidth=l.j.length===3?7:5;ctx.stroke()}));Object.entries(p).forEach(([j,z])=>{ctx.beginPath();ctx.arc(X(z[0]),Y(z[1]),7,0,7);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#17343b';ctx.stroke();ctx.fillStyle='#17343b';ctx.fillText(j,X(z[0])+9,Y(z[1])-7)})}
function preview(){let s=solve(rad(+$('initialAngle').value),guess0(),{tol:+$('previewTol').value,maxIter:100});if(s.ok){canvasDraw($('previewCanvas'),s.pos);$('previewInfo').innerHTML=`<span>收斂</span><span>殘差 ${s.residual.toExponential(3)}</span><span>奇異指標 ${s.sigma.toExponential(3)}</span><span>${signature(s.pos)}</span>`}else $('previewInfo').innerHTML=`<span>無法收斂</span>`}

function renderConditionDashboard(){if(!$('conditionCanvas'))return;$('conditionModel').innerHTML=`${md().h}｜固定 ${md().g}／輸入 ${md().i}`;$('rangeStartLabel').textContent=`${+$('startAngle').value}°`;$('rangeEndLabel').textContent=`${+$('endAngle').value}°`;$('conditionInitial').textContent=`${+$('initialAngle').value}°`;$('conditionStep').textContent=`${+$('stepAngle').value}°`;$('conditionMinStep').textContent=`${+$('minStep').value}°`;let a=+$('startAngle').value,b=+$('endAngle').value,c=+$('initialAngle').value,p=b!==a?Math.max(0,Math.min(100,(c-a)/(b-a)*100)):50;$('initialAngleMarker').style.left=`${p}%`;let s=solve(rad(c),guess(),{tol:+$('previewTol').value,maxIter:100});drawMech($('conditionCanvas'),s.ok?s.pos:coords)}
function specifiedItems(){return[...document.querySelectorAll('.position')].map((r,i)=>({name:r.querySelector('.posName').value||`P${i+1}`,angle:+r.querySelector('.posAngle').value}))}
function renderSpecifiedDiagram(active=-1){if(!$('specifiedCanvas'))return;let items=specifiedItems(),a=+$('startAngle').value,b=+$('endAngle').value,box=$('specifiedMarkers');box.innerHTML=items.map((p,i)=>{let pct=b!==a?Math.max(2,Math.min(98,(p.angle-a)/(b-a)*100)):50;return`<button class="spec-marker ${i===active?'active':''}" data-index="${i}" style="left:${pct}%"><i></i><b>${escapeHtml(p.name)}</b><small>${p.angle}°</small></button>`}).join('');box.querySelectorAll('button').forEach(x=>x.onclick=()=>previewSpecified(+x.dataset.index));if(items.length){let i=active>=0?active:0,s=solve(rad(items[i].angle),guess(),{tol:+$('previewTol').value,maxIter:100});drawMech($('specifiedCanvas'),s.ok?s.pos:coords);$('specifiedNow').textContent=s.ok?`${items[i].name}｜θ = ${items[i].angle}°`:`${items[i].name} 無法收斂`}else{drawMech($('specifiedCanvas'),coords);$('specifiedNow').textContent='尚未設定位置'}}
function previewSpecified(i){stopSpecifiedPreview();specifiedPreview.index=i;renderSpecifiedDiagram(i)}
function stopSpecifiedPreview(){if(specifiedPreview.timer)clearTimeout(specifiedPreview.timer);specifiedPreview.timer=0}
function playSpecifiedPreview(){stopSpecifiedPreview();let items=specifiedItems();if(!items.length)return;specifiedPreview.index=0;const next=()=>{if(specifiedPreview.index>=items.length){specifiedPreview.timer=0;return}renderSpecifiedDiagram(specifiedPreview.index++);specifiedPreview.timer=setTimeout(next,1100)};next()}
function resetProgressStages(){document.querySelectorAll('.analysis-progress-list>div').forEach(x=>{x.classList.remove('active','done');x.querySelector('b').textContent='等待'})}
function setProgressStage(n,s){let x=document.querySelector(`.analysis-progress-list>div[data-stage="${n}"]`);if(!x)return;x.classList.remove('active','done');if(s)x.classList.add(s);x.querySelector('b').textContent=s==='done'?'完成':s==='active'?'進行中':'等待'}
function addPos(a=0,n){posNo++;let x=$('positionTpl').content.cloneNode(true),r=x.querySelector('.position');r.querySelector('.posName').value=n||`P${posNo}`;r.querySelector('.posAngle').value=a;r.querySelector('.remove').onclick=()=>r.remove();$('positions').appendChild(x)}
function resultViewport(){
 if(!analysis||!analysis.samples.length)return null;
 let cv=$('resultCanvas'),pts=analysis.samples.flatMap(s=>Object.values(s.pos));
 if(analysis.limitCircle&&analysis.limitCircle.centerPoint){let c=analysis.limitCircle.centerPoint,r=analysis.limitCircle.outer;pts.push([c[0]-r,c[1]-r],[c[0]+r,c[1]+r])}
 let xs=pts.map(x=>x[0]),ys=pts.map(x=>x[1]),mnx=Math.min(...xs)-50,mxx=Math.max(...xs)+50,mny=Math.min(...ys)-50,mxy=Math.max(...ys)+50,sc=Math.min((cv.width-40)/(mxx-mnx),(cv.height-40)/(mxy-mny));
 return{cv,sc,X:x=>(x-mnx)*sc+20,Y:y=>(y-mny)*sc+20}
}
function drawFrameMechanism(ctx,v,s){
 if(!$('showMechanism')||!$('showMechanism').checked||!s)return;
 md().l.forEach(l=>pairs(l.j).forEach(([a,b])=>{
  let A=s.pos[a],B=s.pos[b];ctx.beginPath();ctx.moveTo(v.X(A[0]),v.Y(A[1]));ctx.lineTo(v.X(B[0]),v.Y(B[1]));
  ctx.strokeStyle=l.id===md().g?'#788b92':l.id===md().i?'#b65a42':'#12676c';ctx.lineWidth=l.j.length===3?8:6;ctx.globalAlpha=.95;ctx.stroke()
 }));
 ctx.globalAlpha=1;
 Object.entries(s.pos).forEach(([j,q])=>{
  ctx.beginPath();ctx.arc(v.X(q[0]),v.Y(q[1]),6.5,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#17343b';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#17343b';ctx.font='13px Arial';ctx.fillText(j,v.X(q[0])+9,v.Y(q[1])-8)
 })
}
function animBranch(){if(!analysis||!analysis.branches.length)return null;let i=Math.max(0,Math.min(analysis.branches.length-1,animation.branch||0));return analysis.branches[i]}
function animSamples(){let b=animBranch();return b?b.samples:[]}
function renderBranchSelector(){
  const box=$('branchSelector');
  if(!box)return;
  const wrap=box.closest('.branch-selector-wrap');
  const oldMore=wrap?wrap.querySelector('.branch-more-btn'):null;
  if(oldMore)oldMore.remove();
  if(!analysis||!analysis.branches||!analysis.branches.length){
    box.innerHTML='';
    if(wrap)wrap.classList.remove('is-expanded');
    return;
  }
  box.innerHTML=analysis.branches.map((b,i)=>`<button type="button" class="branch-chip${i===animation.branch?' active':''}" data-b="${i}">迴路${b.circuit}·分支${b.id}<small>${b.from.toFixed(1)}°～${b.to.toFixed(1)}°</small></button>`).join('');
  box.querySelectorAll('button.branch-chip').forEach(x=>x.onclick=()=>{
    stopAnimation();
    animation.branch=+x.dataset.b;
    animation.index=0;
    renderBranchSelector();
    drawResult();
  });
  const many=analysis.branches.length>3;
  if(many&&wrap){
    const more=document.createElement('button');
    more.type='button';
    more.className='branch-more-btn';
    more.id='branchSelectorMore';
    const open=wrap.classList.contains('is-expanded');
    more.innerHTML='<span class="branch-caret" aria-hidden="true"></span>'; more.classList.toggle('is-open', open); more.title=open?'收合':'展開其餘分支'; more.setAttribute('aria-label', open?'收合':'展開其餘分支');
    more.setAttribute('aria-expanded',open?'true':'false');
    more.onclick=()=>{
      const now=wrap.classList.toggle('is-expanded');
      more.classList.toggle('is-open', now);
      more.title=now?'收合':'展開其餘分支';
      more.setAttribute('aria-label', now?'收合':'展開其餘分支');
      more.setAttribute('aria-expanded',now?'true':'false');
    };
    wrap.appendChild(more);
  }else if(wrap){
    wrap.classList.remove('is-expanded');
  }
}
function currentAnimationSample(){
 let ss=animSamples();if(!ss.length)return null;
 animation.index=Math.max(0,Math.min(ss.length-1,animation.index));return ss[animation.index]
}
function updateAnimationReadout(){
 let ss=animSamples(),s=currentAnimationSample(),tl=$('animationTimeline');
 if(!s){
  if(tl){tl.max=0;tl.value=0}
  if($('animationAngle')) $('animationAngle').textContent='輸入角：—';
  if($('animationFrame')) $('animationFrame').textContent='位置：—';
  if($('animationBranch')) $('animationBranch').textContent='分支：—';
  return;
 }
 if(tl){tl.max=Math.max(0,ss.length-1);tl.value=animation.index}
 if($('animationAngle')) $('animationAngle').textContent=`輸入角：${s.angle.toFixed(5)}°`;
 if($('animationFrame')) $('animationFrame').textContent=`位置：${animation.index+1} / ${ss.length}`;
 let b=animBranch();
 if($('animationBranch')) $('animationBranch').textContent=b?`分支：迴路${b.circuit}·${b.id}`:'分支：—';
}

function drawLimitCircleLayer(ctx,v){
 const d=analysis.limitCircle;if(!d||!d.centerPoint||!$('showLimits')?.checked)return;
 const c=d.centerPoint,drawCircle=(r,label,dash)=>{ctx.save();ctx.beginPath();ctx.arc(v.X(c[0]),v.Y(c[1]),r*v.sc,0,Math.PI*2);ctx.setLineDash(dash);ctx.strokeStyle='#b65a42';ctx.lineWidth=2.4;ctx.globalAlpha=.9;ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#7f3525';ctx.font='13px Arial';ctx.fillText(`${label}  R=${r.toFixed(4)}`,v.X(c[0]+r)+7,v.Y(c[1])-6);ctx.restore()};
 drawCircle(d.outer,'Q3 外極限圓',[10,6]);drawCircle(d.inner,'Q2 內極限圓',[4,5]);
 ctx.beginPath();ctx.arc(v.X(c[0]),v.Y(c[1]),7,0,Math.PI*2);ctx.fillStyle='#b65a42';ctx.fill();ctx.fillStyle='#7f3525';ctx.fillText(`${d.center}（圓心）`,v.X(c[0])+10,v.Y(c[1])-10);
 const ss=animSamples();for(let i=1;i<ss.length;i++){let a=ss[i-1],b=ss[i],pa=a.pos[d.coupler],pb=b.pos[d.coupler],ok=a.limitReachable&&b.limitReachable;ctx.beginPath();ctx.moveTo(v.X(pa[0]),v.Y(pa[1]));ctx.lineTo(v.X(pb[0]),v.Y(pb[1]));ctx.strokeStyle=ok?'#0b6b62':'#999';ctx.lineWidth=ok?4:2.5;ctx.setLineDash(ok?[]:[7,6]);ctx.globalAlpha=.95;ctx.stroke()}ctx.setLineDash([]);ctx.globalAlpha=1;
 d.intersections.forEach((x,i)=>{ctx.beginPath();ctx.arc(v.X(x.point[0]),v.Y(x.point[1]),6,0,Math.PI*2);ctx.fillStyle='#e39a2d';ctx.fill();ctx.strokeStyle='#6f4510';ctx.stroke();ctx.fillStyle='#6f4510';ctx.fillText(`L${i+1}`,v.X(x.point[0])+8,v.Y(x.point[1])-8)});
 let cur=currentAnimationSample();if(cur){let q=cur.pos[d.coupler],cc=cur.pos[d.center];ctx.beginPath();ctx.moveTo(v.X(cc[0]),v.Y(cc[1]));ctx.lineTo(v.X(q[0]),v.Y(q[1]));ctx.strokeStyle='#b65a42';ctx.lineWidth=1.5;ctx.setLineDash([3,4]);ctx.stroke();ctx.setLineDash([])}
}
function drawGeometryIndicatorLayer(ctx,v,s){
 if(!$('showGeo')?.checked||!s)return;let g=geometryIndicators(s.pos,analysis?.o?.geoTol||1e-3);if(!g.available)return;
 ctx.save();ctx.globalAlpha=.8;
 // 畫目前分支的 I13 速度瞬心軌跡；平行而落到無窮遠時中斷，不把畫面硬連過去。
 let pathOpen=false;ctx.beginPath();for(let sm of animSamples()){let z=geometryIndicators(sm.pos,analysis?.o?.geoTol||1e-3);if(!z.available||!z.I13){pathOpen=false;continue}let x=v.X(z.I13[0]),y=v.Y(z.I13[1]);if(x<-100||x>v.cv.width+100||y<-100||y>v.cv.height+100){pathOpen=false;continue}if(!pathOpen){ctx.moveTo(x,y);pathOpen=true}else ctx.lineTo(x,y)}ctx.strokeStyle='#8a72b5';ctx.lineWidth=2;ctx.globalAlpha=.45;ctx.stroke();ctx.globalAlpha=.8;
 ctx.setLineDash([5,5]);ctx.strokeStyle='#6b4f9b';ctx.lineWidth=1.6;
 let A=s.pos[g.core.A],B=s.pos[g.core.B],D=s.pos[g.core.D],Cc=s.pos[g.core.C];
 ctx.beginPath();ctx.moveTo(v.X(A[0]),v.Y(A[1]));ctx.lineTo(v.X(B[0]),v.Y(B[1]));ctx.stroke();
 ctx.beginPath();ctx.moveTo(v.X(D[0]),v.Y(D[1]));ctx.lineTo(v.X(Cc[0]),v.Y(Cc[1]));ctx.stroke();ctx.setLineDash([]);
 if(g.I13){let x=v.X(g.I13[0]),y=v.Y(g.I13[1]);if(x>-60&&x<v.cv.width+60&&y>-60&&y<v.cv.height+60){ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fillStyle='#6b4f9b';ctx.fill();ctx.fillStyle='#4e3972';ctx.font='12px Arial';ctx.fillText('I13',x+8,y-7)}}
 let c=s.pos[g.core.C];ctx.fillStyle='#4e3972';ctx.font='12px Arial';ctx.fillText(`sin μ1=${Number.isFinite(g.mu1)?g.mu1.toFixed(3):'—'}`,v.X(c[0])+10,v.Y(c[1])+18);
 if(g.dyad){let f=s.pos[g.dyad.middle];ctx.fillText(`sin μ2=${Number.isFinite(g.mu2)?g.mu2.toFixed(3):'—'}`,v.X(f[0])+10,v.Y(f[1])+18)}ctx.restore()
}

function drawResult(){
 if(!analysis)return;let v=resultViewport(),cv=$('resultCanvas'),ctx=cv.getContext('2d');ctx.clearRect(0,0,cv.width,cv.height);if(!v)return;
 drawLimitCircleLayer(ctx,v);
 if($('showTraj').checked){let TS=animSamples();all().forEach((j,k)=>{ctx.beginPath();TS.forEach((s,i)=>{let q=s.pos[j];i?ctx.lineTo(v.X(q[0]),v.Y(q[1])):ctx.moveTo(v.X(q[0]),v.Y(q[1]))});ctx.strokeStyle=k%2?'#12676c':'#6b5b99';ctx.globalAlpha=.34;ctx.lineWidth=2;ctx.stroke();ctx.globalAlpha=1})};
 let tip=il().j.find(j=>j!==pj())||pj();
 if($('showDead').checked)analysis.dead.forEach(d=>{let q=d.pos[tip];ctx.beginPath();ctx.arc(v.X(q[0]),v.Y(q[1]),6,0,Math.PI*2);ctx.fillStyle='#a53d3d';ctx.fill()});
 if($('showSpecified').checked)analysis.specified.forEach(p=>{if(p.ok){let q=p.s.pos[tip];ctx.beginPath();ctx.arc(v.X(q[0]),v.Y(q[1]),9,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#111';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#111';ctx.fillText(p.name,v.X(q[0])+10,v.Y(q[1])-10)}});
 drawFrameMechanism(ctx,v,currentAnimationSample());drawGeometryIndicatorLayer(ctx,v,currentAnimationSample());updateAnimationReadout()
}
function stopAnimation(){
 animation.playing=false;animation.lastTime=0;if(animation.raf)cancelAnimationFrame(animation.raf);animation.raf=0;
 let b=$('playAnimation');if(b){b.textContent='▶ 播放';b.classList.remove('playing')}
}
function animateResult(ts){
 if(!animation.playing||!analysis||!animSamples().length)return;
 let speed=+$('animationSpeed').value||1,interval=100/speed;if(!animation.lastTime)animation.lastTime=ts;
 if(ts-animation.lastTime>=interval){
  let advance=Math.max(1,Math.floor((ts-animation.lastTime)/interval));animation.index+=advance;animation.lastTime=ts;
  if(animation.index>=animSamples().length){animation.index=animSamples().length-1;stopAnimation();drawResult();return}
  drawResult()
 }
 animation.raf=requestAnimationFrame(animateResult)
}
function toggleAnimation(){
 if(!analysis||!animSamples().length)return;if(animation.playing){stopAnimation();return}
 if(animation.index>=animSamples().length-1)animation.index=0;
 animation.playing=true;animation.lastTime=0;$('playAnimation').textContent='❚❚ 暫停';$('playAnimation').classList.add('playing');animation.raf=requestAnimationFrame(animateResult)
}
function restartAnimation(){stopAnimation();animation.index=0;drawResult();toggleAnimation()}
function adjustmentAdvice(){
 const sp=analysis.specified,labels=(analysis.defects&&analysis.defects.labels)||[],ok=sp.filter(x=>x.ok),items=[];
 const fmt=a=>`${(+a).toFixed(2)}°`;
 const tolInput=+$('solveTol').value;
 const maxRes=analysis.samples.length?Math.max(...analysis.samples.map(x=>x.res!=null?x.res:(x.residual||0))):Infinity;
 const ranges=analysis.branches.map(b=>[Math.min(b.from,b.to),Math.max(b.from,b.to)]).sort((a,b)=>a[0]-b[0]);
 const rangeText=ranges.length?[...new Set(ranges.map(r=>`${fmt(r[0])}～${fmt(r[1])}`))].join('、'):'（尚無）';
 const add=(sev,t,d)=>items.push({sev,t,d});

 if(!sp.length){
  add('warn','尚未設定指定位置',`目前有 ${analysis.circuits.length} 個迴路、${analysis.branches.length} 個分支；可達區間 ${rangeText}。請到「指定位置」加入要檢查的輸入角。`);
 }

 const bad=sp.filter(x=>!x.ok);
 if(bad.length){
  bad.forEach(p=>{
   let near=null,dist=Infinity;
   ranges.forEach(r=>{let d=p.angle<r[0]?r[0]-p.angle:p.angle>r[1]?p.angle-r[1]:0;if(d<dist){dist=d;near=r}});
   add('bad',`${escapeHtml(p.name)}（${fmt(p.angle)}）不可達`,
    near
      ? `${escapeHtml(p.name)} 落在可達範圍外。最近區間為 ${fmt(near[0])}～${fmt(near[1])}（約差 ${fmt(dist)}）。可將該角度改入此區間，或擴大分析範圍並調整初始構形，使 ${fmt(p.angle)} 落在可追蹤裝配內。`
      : `目前沒有可對照的有效分支。請先確認初始構形可收斂，再重新分析。`);
  });
  add('warn','若預期此角度應有解',`可將初始步長調為 0.2°～0.5°、最小步長調為 1e-5 後重跑；並檢查固定桿與輸入桿是否只共用一個接頭，以及是否有接頭重合或桿件近乎共線。`);
 }

 if(labels.includes('分支缺陷')){
  const byB={};ok.forEach(p=>{(byB[`${p.tCircuit}/${p.tBranch}`]||(byB[`${p.tCircuit}/${p.tBranch}`]=[])).push(p)});
  const groups=Object.entries(byB).map(([k,ps])=>{const[ci,bi]=k.split('/');return `迴路 ${ci}·分支 ${bi}（${ps.map(p=>`${escapeHtml(p.name)} ${fmt(p.angle)}`).join('、')}）`}).join('；');
  add('warn','指定位置分屬不同分支',`${groups}。分支之間由死點隔開，無法在不經過死點的情況下連續通過。`);
  const angs=ok.map(x=>x.angle),lo=Math.min(...angs),hi=Math.max(...angs);
  const between=analysis.dead.filter(d=>d.angle>=lo-1e-6&&d.angle<=hi+1e-6);
  if(between.length)add('warn','區間內的死點',`${fmt(lo)}～${fmt(hi)} 之間：${between.map(d=>fmt(d.angle)+(d.verified?'（已驗證）':'（候選）')).join('、')}。若要同一分支通過，需調整尺寸或目標角，使死點移出此區間。`);
  add('warn','建議作法',`將各指定角改到同一分支的可達區間；或更換初始裝配；或調整輸入桿與鄰近桿長，使死點離開 ${fmt(lo)}～${fmt(hi)}。`);
 }

 if(labels.includes('迴路缺陷')){
  const byC={};ok.forEach(p=>{(byC[p.tCircuit]||(byC[p.tCircuit]=[])).push(p)});
  const groups=Object.entries(byC).map(([k,ps])=>`迴路 ${k}（${ps.map(p=>`${escapeHtml(p.name)} ${fmt(p.angle)}`).join('、')}）`).join('；');
  add('bad','指定位置分屬不同迴路',`${groups}。不同迴路代表分離的裝配，需拆解重組才能切換，單靠轉動輸入桿無法到達。`);
  add('bad','建議作法',`選定一個工作迴路，將所有指定角改入其可達區間（${rangeText}）。若設計必須跨迴路，則需重新檢討尺寸，使目標位置落在同一連續迴路。`);
 }

 if(labels.includes('同一迴路、同一分支')&&ok.length){
  add('ok','可連續通過',`${ok.map(p=>escapeHtml(p.name)).join('、')} 位於同一迴路與同一分支。`);
  if(analysis.dead.length){
   let worst=null;ok.forEach(p=>analysis.dead.forEach(d=>{let dd=periodicAngleDiff(p.angle,d.angle);if(!worst||dd<worst.dd)worst={p,d,dd}}));
   if(worst)add(worst.dd<5?'warn':'ok','死點裕度',`${escapeHtml(worst.p.name)}（${fmt(worst.p.angle)}）距最近死點 ${fmt(worst.d.angle)} 約 ${fmt(worst.dd)}。${worst.dd<5?'裕度偏小，建議將工作點移向分支中段或加大安全角。':'目前裕度尚可。'}`);
  }
  add('ok','可選：提高解析',`若需更穩定的分支歸屬，可將初始步長設為 0.1°、最小步長設為 1e-5 後再分析一次。`);
 }

 if(Number.isFinite(maxRes)&&maxRes>tolInput*100){
  add('bad','位置殘差偏高',`最大殘差 ${maxRes.toExponential(2)}，明顯大於容許值 ${tolInput.toExponential(1)}。可提高最大疊代次數、縮小步長，並檢查桿長是否互相矛盾。`);
 }

 if(!analysis.samples.length){
  add('bad','沒有有效位置',`此角度範圍內無收斂裝配。可載入目前型式範例，或先在初始角附近 ±30° 小範圍重跑。`);
 }
 return items;
}
function update(){
 let thesis=thesisIdentify(analysis.specified,analysis.o);analysis.specified=thesis.recs;analysis.thesis=thesis;
 analysis.specified.forEach(p=>{if(p.ok&&p.s)p.geom=geometryIndicators(p.s.pos,analysis.o.geoTol)});
 let gx=geometryCrossValidation(analysis.specified,analysis.dead,analysis.o);analysis.geometryValidation=gx;
 let d=classifyDefects(analysis.specified);analysis.defects=d;
 let ttl=d.labels.join('＋');
 $('sampleCount').textContent=analysis.specified.filter(x=>x.ok).length;
 $('circuitCount').textContent=analysis.circuits.length;
 $('branchCount').textContent=analysis.branches.length;
 $('deadCount').textContent=`${analysis.verifiedDeadCount}/${analysis.dead.length}`;
 $('classification').textContent=ttl;$('classificationReason').textContent=d.reasons.join('；');
 $('interpretation').innerHTML=`<div class="side-block-title">${ttl}</div><p class="side-block-lead">${d.reasons.join('</p><p class="side-block-lead">')}</p><dl class="side-kv"><div><dt>構型</dt><dd>${md().h}（固定 ${md().g}／輸入 ${md().i}）</dd></div><div><dt>指定位置</dt><dd>迴路 ${thesis.circuitCount}、分支 ${thesis.branchCount}</dd></div><div><dt>幾何比對</dt><dd>${gx.status}${gx.available?` · 一致 ${gx.supports}、衝突 ${gx.conflicts}、死點提示 ${gx.deadSupports}/${gx.deadTotal}`:''}</dd></div><div><dt>全範圍</dt><dd>迴路 ${analysis.circuits.length}、分支 ${analysis.branches.length}、死點 ${analysis.verifiedDeadCount}/${analysis.dead.length}</dd></div></dl>`;
 let advice=adjustmentAdvice();
 $('adjustmentPlan').innerHTML=advice.length?advice.map((x,i)=>`<div class="advice-item sev-${x.sev}"><b>${i+1}</b><div class="advice-body"><div class="advice-title">${x.t}</div><p class="advice-desc">${x.d}</p></div></div>`).join(''):`<div class="advice-item sev-ok"><b>✓</b><div class="advice-body"><div class="advice-title">目前沒有需要調整的項目</div></div></div>`;
 const arrow=s=>{const v=Number(s);if(v>0)return'<span class="trend-up">▲遞增</span>';if(v<0)return'<span class="trend-dn">▼遞減</span>';return'<span class="trend-na">（趨勢—）</span>';};
 const deadCell=side=>{
  if(!side||!side.dead)return '—';
  const dd=side.dead;
  if(dd.kind!=='candidate')return '<span class="dead-open">範圍端／曲柄</span>';
  const ang=Number.isFinite(dd.angle)?dd.angle.toFixed(2)+'°':'—';
  // side.sign：趨近該死點時輸出角變化方向（論文分支判據）
  return `<span class="dead-cell"><span class="dead-ang">${ang}</span> ${arrow(side.sign)}</span>`;
 };
 $('specifiedRows').innerHTML=analysis.specified.map((p,i)=>{
  if(!p.ok)return `<tr><td>${escapeHtml(p.name)}</td><td>${(+p.angle).toFixed(2)}°</td><td>否</td><td colspan="6">不在任何分支的可達範圍</td></tr>`;
  let sel=p.candidates&&p.candidates.length>1?`<select data-spec="${i}">${p.candidates.map((cc,k)=>`<option value="${k}" ${k===p.chosen?'selected':''}>迴路${cc.branch.circuit}／分支${cc.branch.id}</option>`).join('')}</select>`:'單一裝配';
  return `<tr><td>${escapeHtml(p.name)}</td><td>${(+p.angle).toFixed(2)}°</td><td>是</td><td>${sel}</td><td>${p.tCircuit||'—'}</td><td>${p.tBranch||'—'}</td><td>${deadCell(p.ep&&p.ep.up)}</td><td>${deadCell(p.ep&&p.ep.dn)}</td><td>${p.s&&p.s.res!=null?p.s.res.toExponential(2):'—'}</td></tr>`
 }).join('');
 document.querySelectorAll('#specifiedRows select[data-spec]').forEach(s=>s.onchange=()=>applyAssemblyChoice(+s.dataset.spec,+s.value));
 $('branchRows').innerHTML=analysis.branches.map(b=>`<tr><td>${b.circuit}</td><td>${b.id}</td><td>${b.from.toFixed(3)}°～${b.to.toFixed(3)}°</td><td>${b.samples.length}</td><td>${b.endpoint}</td><td>近死點趨勢 ${b.trend[0]>=0?'＋':'－'}／${b.trend[1]>=0?'＋':'－'}</td></tr>`).join('');
 $('deadRows').innerHTML=analysis.dead.map((d,i)=>`<tr><td>${i+1}</td><td>${d.angle.toFixed(4)}°</td><td>${d.circuit}</td><td>${d.verified?'已通過':'未通過'}<br>${Number.isFinite(d.sigma)?d.sigma.toExponential(3):'—'}</td><td>${(d.residual||0).toExponential(3)}</td><td>${Object.entries(d.pos).map(([j,q])=>`${j}(${q[0].toFixed(2)},${q[1].toFixed(2)})`).join(' ')}</td></tr>`).join('');
 if($('geometryRows')){$('geometryRows').innerHTML=analysis.specified.map(p=>{if(!p.ok)return `<tr><td>${escapeHtml(p.name)}</td><td colspan="8">不可達</td></tr>`;let g=p.geom;if(!g||!g.available)return `<tr><td>${escapeHtml(p.name)}</td><td colspan="8">不適用</td></tr>`;let f=x=>Number.isFinite(x)?x.toFixed(6):'∞';let ip=g.icFinite?`(${g.I13[0].toFixed(2)}, ${g.I13[1].toFixed(2)})`:'∞（平行）';let verdict=(g.sign1==='0'||g.sign2==='0'||(Number.isFinite(g.icResidual)&&g.icResidual<=analysis.o.geoTol))?'接近幾何奇異':`符號指紋 ${g.signPair}`;return `<tr><td>${escapeHtml(p.name)}</td><td>${g.core.links.join('→')}${g.core.virtualInput?'（虛擬輸入）':''}</td><td>${f(g.mu1)}</td><td>${f(g.mu2)}</td><td>${g.signPair}</td><td>${ip}</td><td>${Number.isFinite(g.icResidual)?g.icResidual.toExponential(3):'∞'}</td><td>迴路${p.tCircuit||'—'}／分支${p.tBranch||'—'}</td><td>${verdict}</td></tr>`}).join('')}
 if($('geometryCrossInfo'))$('geometryCrossInfo').innerHTML=gx.available?`<div class="side-block-title">${gx.status}</div><p class="side-block-lead">${gx.note}</p><dl class="side-kv"><div><dt>分支比對</dt><dd>一致 ${gx.supports} · 衝突 ${gx.conflicts} · 無法判定 ${gx.inconclusive}</dd></div><div><dt>死點幾何</dt><dd>${gx.deadSupports}/${gx.deadTotal} 接近傳動角 0 或瞬心重合</dd></div></dl>`:`<div class="side-block-title">${gx.status}</div><p class="side-block-lead">${gx.note}</p>`;
 $('equationList').innerHTML=analysis.constraints.map(x=>`<div class="eq">(${x.a}x−${x.b}x)²+(${x.a}y−${x.b}y)²=${x.L.toFixed(6)}² [${x.link}]</div>`).join('');
 let lc=analysis.limitCircle;$('limitCircleInfo').innerHTML=lc?`<div class="side-block-title">極限圓</div><dl class="side-kv"><div><dt>耦桿點</dt><dd>${lc.coupler}</dd></div><div><dt>雙連桿</dt><dd>${lc.linkA}＋${lc.linkB}（${lc.center}－${lc.middle}－${lc.coupler}）</dd></div><div><dt>內半徑 Q2</dt><dd>${lc.inner.toFixed(4)}</dd></div><div><dt>外半徑 Q3</dt><dd>${lc.outer.toFixed(4)}</dd></div><div><dt>軌跡交點</dt><dd>${lc.intersections.length} 個</dd></div></dl><p class="side-block-foot">實線：圓環內可達 · 虛線：圓環外不可達</p>`:'<div class="side-block-title">極限圓</div><p class="side-block-lead">此構型未對應到固定軸－雙連桿－耦桿點組合，故不顯示。</p>';
 stopAnimation();
 let ri=analysis.branches.indexOf(analysis.refBranch);
 if(animation.branch==null||animation.branch>=analysis.branches.length)animation.branch=ri>=0?ri:0;
 animation.index=0;renderBranchSelector();drawResult()
}
