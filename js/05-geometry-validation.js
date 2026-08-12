// TODO(feature/geometry-validation): 實作速度瞬心、傳動角、極限圓與幾何交叉驗證。
// Person 5 — Geometry Cross-validation
// 四連桿核心、速度瞬心、傳動角與極限圓交叉驗證。

// ===== 幾何交叉驗證：核心四連桿速度瞬心 + 兩組傳動角 =====
// 論文重點：四連桿傳動角 sin(mu) 的正負可區分兩個組合構形；六連桿含四連桿組時，
// 兩組傳動角 sin(mu1), sin(mu2) 的正負組合可提供最多四種構形指紋。
// 核心四連桿速度瞬心 I13 由 Kennedy 三心定理求得：I13 = (I12-I23) 與 (I14-I34) 兩直線交點；
// 四連桿死點時 I13 與 I23 重合。瞬心在平行位置可位於無窮遠，故此指標只作交叉驗證。
function sharedJoint(a,b){let A=typeof a==='string'?md().l.find(x=>x.id===a):a,B=typeof b==='string'?md().l.find(x=>x.id===b):b;if(!A||!B)return null;let q=A.j.filter(j=>B.j.includes(j));return q.length===1?q[0]:null}
function geometricApplicable(){return ['Stephenson-I','Stephenson-III','Watt-I','Watt-II'].includes(md().f)}
function fourBarCycles(){
 let links=md().l,out=[];
 for(let a=0;a<links.length-3;a++)for(let b=a+1;b<links.length-2;b++)for(let c=b+1;c<links.length-1;c++)for(let d=c+1;d<links.length;d++){
  let set=[links[a],links[b],links[c],links[d]],adj=new Map(set.map(x=>[x.id,[]]));
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){let q=sharedJoint(set[i],set[j]);if(q){adj.get(set[i].id).push({id:set[j].id,j:q});adj.get(set[j].id).push({id:set[i].id,j:q})}}
  if([...adj.values()].every(x=>x.length===2)){let js=[];for(let x of set)for(let y of adj.get(x.id))js.push(y.j);if(new Set(js).size===4)out.push({links:set.map(x=>x.id),adj})}
 }
 return out
}
function coreFourBarDefinition(){
 if(!geometricApplicable())return null;let cycles=fourBarCycles();if(!cycles.length)return null;
 const score=x=>x.links.includes(md().g)&&x.links.includes(md().i)?20:x.links.includes(md().g)?10:0;
 cycles.sort((x,y)=>score(y)-score(x));
 let c=cycles[0],ground=c.links.includes(md().g)?md().g:c.links[0],nbr=c.adj.get(ground).map(x=>x.id),input=nbr.includes(md().i)?md().i:nbr.slice().sort()[0];
 let coupler=c.adj.get(input).map(x=>x.id).find(x=>x!==ground),output=c.adj.get(coupler).map(x=>x.id).find(x=>x!==input);
 if(!output||!c.adj.get(output).some(x=>x.id===ground))return null;
 let A=sharedJoint(ground,input),B=sharedJoint(input,coupler),Cj=sharedJoint(coupler,output),D=sharedJoint(output,ground);
 if(!A||!B||!Cj||!D)return null;
 return{ground,input,coupler,output,A,B,C:Cj,D,links:[ground,input,coupler,output],virtualInput:input!==md().i}
}
function secondDyadDefinition(core){
 if(!core)return null;let rem=md().l.filter(l=>!core.links.includes(l.id));if(rem.length!==2)return null;let middle=sharedJoint(rem[0],rem[1]);if(!middle)return null;
 let a=rem[0].j.find(j=>j!==middle),b=rem[1].j.find(j=>j!==middle);if(!a||!b)return null;
 let g=md().l.find(l=>l.id===core.ground),ag=g.j.includes(a),bg=g.j.includes(b);
 if(ag&&!bg)return{middle,first:b,second:a,link1:rem[1].id,link2:rem[0].id};
 return{middle,first:a,second:b,link1:rem[0].id,link2:rem[1].id}
}
function signedSinAt(p,vertex,a,b){let u=[p[a][0]-p[vertex][0],p[a][1]-p[vertex][1]],v=[p[b][0]-p[vertex][0],p[b][1]-p[vertex][1]],den=Math.hypot(...u)*Math.hypot(...v);return den>1e-14?(u[0]*v[1]-u[1]*v[0])/den:NaN}
function lineIntersection(P,U,Q,V){let ux=U[0]-P[0],uy=U[1]-P[1],vx=V[0]-Q[0],vy=V[1]-Q[1],den=ux*vy-uy*vx;if(Math.abs(den)<1e-10)return null;let qx=Q[0]-P[0],qy=Q[1]-P[1],t=(qx*vy-qy*vx)/den;return{point:[P[0]+t*ux,P[1]+t*uy],t}}
function geometryIndicators(p,geoTol=1e-3){
 let core=coreFourBarDefinition();if(!core||!p)return{available:false,reason:'此型式未建立核心四連桿幾何指標'};
 let mu1=signedSinAt(p,core.C,core.B,core.D),dy=secondDyadDefinition(core),mu2=dy?signedSinAt(p,dy.middle,dy.first,dy.second):NaN;
 let I=lineIntersection(p[core.A],p[core.B],p[core.D],p[core.C]),scale=mechScale(),icResidual=I?dst(I.point,p[core.B])/scale:Infinity;
 let sg=x=>!Number.isFinite(x)?'?' : Math.abs(x)<=geoTol?'0':x>0?'+':'-';
 return{available:true,core,dyad:dy,mu1,mu2,sign1:sg(mu1),sign2:sg(mu2),signPair:`${sg(mu1)}/${sg(mu2)}`,I13:I?I.point:null,I13t:I?I.t:null,icResidual,icFinite:!!I,nearGeometricSingular:(Number.isFinite(mu1)&&Math.abs(mu1)<=geoTol)||(Number.isFinite(mu2)&&Math.abs(mu2)<=geoTol)||(Number.isFinite(icResidual)&&icResidual<=geoTol)}
}
function geometryCrossValidation(recs,dead,opt){
 let geoTol=opt.geoTol||1e-3;if(!geometricApplicable())return{available:false,status:'不適用',note:'此版幾何交叉驗證只套用 Stephenson-I/III、Watt-I/II。',conflicts:0,supports:0,deadSupports:0,deadTotal:0,inconclusive:0};
 let ok=recs.filter(r=>r.ok&&r.geom&&r.geom.available),conflicts=0,supports=0,inconclusive=0;
 for(let i=0;i<ok.length;i++)for(let j=i+1;j<ok.length;j++){let a=ok[i],b=ok[j],za=a.geom.signPair,zb=b.geom.signPair,clean=!za.includes('0')&&!za.includes('?')&&!zb.includes('0')&&!zb.includes('?');if(!clean)continue;
  if(a.tCircuit===b.tCircuit&&a.tBranch===b.tBranch){if(za!==zb)conflicts++;else supports++}
  else if(a.tCircuit===b.tCircuit&&a.tBranch!==b.tBranch){if(za!==zb)supports++;else inconclusive++}
 }
 let deadTotal=0,deadSupports=0;for(let d of dead||[]){if(!d.verified)continue;deadTotal++;let g=geometryIndicators(d.pos,geoTol);d.geom=g;if(g.available&&g.nearGeometricSingular)deadSupports++}
 let status=conflicts?'有衝突':supports?'一致／部分一致':'不足以判定',note=conflicts?`有 ${conflicts} 組指定位置在數值法判為同分支，但傳動角符號指紋不同，建議檢查裝配選擇與容許值。`:`傳動角符號提供四構形指紋；瞬心 I13≈I23 只驗證核心四連桿死點。相同符號仍可能屬於不同高階分支，因此不把「同號」當成完整證明。`;
 return{available:true,status,note,conflicts,supports,inconclusive,deadSupports,deadTotal,geoTol}
}

function findLimitCircleDefinition(pos=C){
 const groundJoints=gj(),binary=md().l.filter(l=>l.j.length===2),owners={};
 md().l.forEach(l=>l.j.forEach(j=>(owners[j]||(owners[j]=[])).push(l)));
 const candidates=[];
 for(let a=0;a<binary.length;a++)for(let b=a+1;b<binary.length;b++){
  const l1=binary[a],l2=binary[b],shared=l1.j.filter(j=>l2.j.includes(j));if(shared.length!==1)continue;
  const middle=shared[0],u=l1.j.find(j=>j!==middle),v=l2.j.find(j=>j!==middle);
  for(const [center,coupler,first,second] of [[u,v,l1,l2],[v,u,l2,l1]]){
   if(!groundJoints.has(center)||groundJoints.has(coupler))continue;
   const otherOwner=(owners[coupler]||[]).find(l=>l.id!==second.id);
   let score=(otherOwner&&otherOwner.j.length===3?10:0)+(first.id!==md().i&&second.id!==md().i?2:0);
   candidates.push({center,middle,coupler,linkA:first.id,linkB:second.id,rA:dst(pos[center],pos[middle]),rB:dst(pos[middle],pos[coupler]),score})
  }
 }
 if(!candidates.length)return null;candidates.sort((a,b)=>b.score-a.score);
 const d=candidates[0];d.inner=Math.abs(d.rA-d.rB);d.outer=d.rA+d.rB;return d
}
function limitCircleAnalysis(samples){
 const d=findLimitCircleDefinition(C);if(!d||!samples.length)return d?{...d,intersections:[],available:true}:null;
 const center=samples[0].pos[d.center],intersections=[];
 for(const radius of [d.inner,d.outer])for(let i=1;i<samples.length;i++){
  const a=samples[i-1],b=samples[i],da=dst(a.pos[d.coupler],center)-radius,db=dst(b.pos[d.coupler],center)-radius;
  if(da===0||da*db<0){const t=Math.abs(da)/(Math.abs(da)+Math.abs(db)||1),pa=a.pos[d.coupler],pb=b.pos[d.coupler];intersections.push({radius,type:radius===d.inner?'內極限圓':'外極限圓',angle:a.angle+(b.angle-a.angle)*t,point:[pa[0]+(pb[0]-pa[0])*t,pa[1]+(pb[1]-pa[1])*t]})}
 }
 samples.forEach(s=>{const rr=dst(s.pos[d.coupler],s.pos[d.center]);s.limitReachable=rr>=d.inner-1e-7&&rr<=d.outer+1e-7;s.limitDistance=rr});
 return{...d,centerPoint:center,intersections,available:true}
}
