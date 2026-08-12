// ===== 完整迴路分析：以裝配座標區分分支、跨死點枚舉、依共用死點連成迴路 =====
// 這段主要負責以裝配座標建立距離判定、追蹤分支與死點，並將共用死點歸併為同一迴路。

function mechScale() {
  return Math.max(1, ...cons().map((c) => c.L));
}

function assemblyJoints() {
  return all().filter((j) => !gj().has(j) && !il().j.includes(j));
}

function assemblyVec(p) {
  return assemblyJoints().flatMap((j) => [p[j][0], p[j][1]]);
}

function asmDistance(a, b) {
  let da = assemblyVec(a);
  let db = assemblyVec(b);
  let s = 0;
  for (let i = 0; i < da.length; i++) {
    s += (da[i] - db[i]) ** 2;
  }
  return Math.sqrt(s / Math.max(1, da.length / 2));
}

function asmClose(a, b, tol) {
  return asmDistance(a, b) < (tol || Math.max(1e-3, mechScale() * 3e-3));
}

function periodicAngleDiff(a, b) {
  let d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

function sameDead(a, b, opt) {
  if (!a || !b || a.kind === 'range' || b.kind === 'range') {
    return false;
  }
  let rel = (opt && opt.endpointTol) || 1e-3;
  let ptol = Math.max(1e-8, mechScale() * rel);
  let atol = Math.max(0.05, 360 * rel);
  return periodicAngleDiff(a.angle, b.angle) <= atol && asmClose(a.pos, b.pos, ptol);
}

function outputAngle(p) {
  let g = gj();
  let ip = pj();
  let cand = md().l.filter(
    (l) => l.j.length === 2 && l.id !== md().i && l.j.some((j) => g.has(j) && j !== ip)
  );
  let l = cand[0] || md().l.find((x) => x.j.length === 2 && x.id !== md().i);
  if (!l) {
    return 0;
  }
  let base = l.j.find((j) => g.has(j)) || l.j[0];
  let tip = l.j.find((j) => j !== base);
  return Math.atan2(p[tip][1] - p[base][1], p[tip][0] - p[base][0]) * 180 / Math.PI;
}

function multiStart(t, ntry, opt) {
  let sols = [];
  let sc = mechScale();
  let cand = [guess0()];
  let free = all().filter((j) => !gj().has(j) && !il().j.includes(j));
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];

  for (let k = 0; k < ntry; k++) {
    let g = guess0();
    let amp = sc * (0.18 + 0.12 * Math.floor(k / dirs.length));
    let d = dirs[k % dirs.length];
    free.forEach((j, i) => {
      let q = dirs[(k + i * 3) % dirs.length];
      g[j] = [
        C[j][0] + amp * (0.7 * d[0] + 0.3 * q[0]),
        C[j][1] + amp * (0.7 * d[1] + 0.3 * q[1])
      ];
    });
    cand.push(g);
  }

  cand.forEach((g) => {
    let s = solve(rad(t), g, opt);
    if (s.ok && !sols.some((o) => asmClose(o.pos, s.pos, Math.max(1e-7, mechScale() * opt.endpointTol)))) {
      sols.push(s);
    }
  });

  return sols;
}

function refineSingularEndpoint(angle, pos, dir, opt, initialStep) {
  let bestSolve = solve(rad(angle), pos, opt);
  let best = {
    angle: angle,
    pos: clone(pos),
    sigma: bestSolve.sigma,
    residual: bestSolve.residual
  };

  let h = Math.max(Math.abs(initialStep) / 2, opt.minStep);
  let guard = 0;

  while (h >= opt.minStep && guard++ < 80) {
    let improved = false;
    for (const sign of [1, -1]) {
      let t = best.angle + sign * Math.sign(dir) * h;
      let lo = Math.min(opt.startAngle, opt.endAngle);
      let hi = Math.max(opt.startAngle, opt.endAngle);
      if (t < lo - 1e-12 || t > hi + 1e-12) {
        continue;
      }
      let n = solve(rad(t), best.pos, opt);
      if (n.ok && n.residual <= opt.tol && Number.isFinite(n.sigma) && n.sigma < best.sigma) {
        best = { angle: t, pos: clone(n.pos), sigma: n.sigma, residual: n.residual };
        improved = true;
      }
    }
    if (!improved) {
      h /= 2;
    }
  }

  return {
    angle: +best.angle.toFixed(6),
    pos: best.pos,
    sigma: best.sigma,
    residual: best.residual,
    kind: 'candidate',
    verified: Number.isFinite(best.sigma) && best.sigma <= opt.singularTol
  };
}

function traceBranch(t0, pos0, res0, dir, opt) {
  let startSolve = solve(rad(t0), pos0, opt);
  let a = t0;
  let g = clone(pos0);
  let step = Math.abs(opt.step) * dir;

  let startSigma = startSolve.ok ? startSolve.sigma : Infinity;
  let samples = [{ angle: a, pos: clone(g), res: res0, sigma: startSigma }];
  let prevOut = outputAngle(g);
  let lastSigma = startSigma;
  let guard = 0;
  let lo = Math.min(opt.startAngle, opt.endAngle);
  let hi = Math.max(opt.startAngle, opt.endAngle);

  while (guard++ < 20000) {
    let t = a + step;
    if (t < lo - 1e-12 || t > hi + 1e-12) {
      let end = {
        angle: +a.toFixed(6),
        pos: clone(g),
        sigma: lastSigma,
        residual: samples.at(-1).res || 0,
        kind: 'range',
        verified: false
      };
      return { samples, dead: end, trend: Math.sign(outputAngle(g) - prevOut), closed: false };
    }

    let n = solve(rad(t), g, opt);
    if (n.ok) {
      let oldOut = outputAngle(g);
      prevOut = oldOut;
      a = t;
      g = n.pos;
      lastSigma = n.sigma;
      samples.push({ angle: a, pos: clone(g), res: n.residual, sigma: n.sigma });

      if (Number.isFinite(n.sigma) && n.sigma <= opt.singularTol) {
        let end = refineSingularEndpoint(a, g, dir, opt, Math.abs(step));
        if (end.verified) {
          if (periodicAngleDiff(end.angle, a) > 1e-10 || !asmClose(end.pos, g, Math.max(1e-9, mechScale() * opt.endpointTol))) {
            samples.push({ angle: end.angle, pos: clone(end.pos), res: end.residual, sigma: end.sigma });
          }
          return { samples, dead: end, trend: Math.sign(outputAngle(end.pos) - oldOut), closed: false };
        }
      }

      if (Number.isFinite(n.sigma) && n.sigma <= opt.singularTol * 5) {
        step = Math.sign(step) * Math.max(opt.minStep, Math.abs(step) / 2);
      } else {
        step = Math.sign(step) * Math.min(Math.abs(opt.step), Math.abs(step) * 1.5);
      }
    } else {
      step /= 10;
      if (Math.abs(step) < opt.minStep) {
        let end = refineSingularEndpoint(a, g, dir, opt, Math.max(opt.minStep, Math.abs(opt.step) / 10));
        return { samples, dead: end, trend: Math.sign(outputAngle(end.pos) - prevOut), closed: false };
      }
    }
  }

  let end = {
    angle: +a.toFixed(6),
    pos: clone(g),
    sigma: lastSigma,
    residual: samples.at(-1).res || 0,
    kind: 'guard',
    verified: false
  };
  return { samples, dead: end, trend: 0, closed: false };
}

function buildLoopAnalysis(opt) {
  let lo = Math.min(opt.startAngle, opt.endAngle);
  let hi = Math.max(opt.startAngle, opt.endAngle);
  let N = Math.min(40, Math.max(10, Math.round((hi - lo) / Math.max(Math.abs(opt.step), 1) / 4)));
  let branches = [];

  let seeds = [opt.initial];
  for (let k = 0; k <= N; k++) {
    seeds.push(lo + (hi - lo) * k / N);
  }

  seeds.forEach((t) => {
    if (t < lo - 1e-9 || t > hi + 1e-9) {
      return;
    }
    multiStart(t, 18, opt).forEach((s) => {
      if (
        branches.some((b) =>
          b.samples.some(
            (x) => Math.abs(x.angle - t) < Math.abs(opt.step) * 0.6 &&
              asmClose(x.pos, s.pos, Math.max(1e-7, mechScale() * opt.endpointTol))
          )
        )
      ) {
        return;
      }

      let L = traceBranch(t, s.pos, s.residual, -1, opt);
      let R = traceBranch(t, s.pos, s.residual, 1, opt);
      let samples = L.samples.slice().reverse().concat(R.samples.slice(1));

      let closed = false;
      if (L.dead.kind === 'range' && R.dead.kind === 'range' && hi - lo >= 359.5) {
        let left = samples[0];
        let right = samples.at(-1);
        closed = periodicAngleDiff(left.angle, right.angle) < Math.max(1, Math.abs(opt.step) * 2) &&
          asmClose(left.pos, right.pos, Math.max(1e-7, mechScale() * opt.endpointTol * 2));
      }

      branches.push({
        samples,
        dA: L.dead,
        dB: R.dead,
        closed,
        trend: [L.trend, R.trend],
        from: samples[0].angle,
        to: samples.at(-1).angle
      });
    });
  });

  let uniq = [];
  branches.forEach((b) => {
    if (
      !uniq.some((u) =>
        b.closed && u.closed
          ? asmClose(b.samples[0].pos, u.samples[0].pos, mechScale() * opt.endpointTol)
          : ((sameDead(u.dA, b.dA, opt) && sameDead(u.dB, b.dB, opt)) ||
            (sameDead(u.dA, b.dB, opt) && sameDead(u.dB, b.dA, opt)))
      )
    ) {
      uniq.push(b);
    }
  });
  branches = uniq;

  let par = branches.map((_, i) => i);
  let find = (x) => {
    while (par[x] !== x) {
      par[x] = par[par[x]];
      x = par[x];
    }
    return x;
  };

  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      if (branches[i].closed || branches[j].closed) {
        continue;
      }
      let A = [branches[i].dA, branches[i].dB];
      let B = [branches[j].dA, branches[j].dB];
      if (A.some((a) => B.some((b) => sameDead(a, b, opt)))) {
        par[find(i)] = find(j);
      }
    }
  }

  let cmap = {};
  let cid = 0;
  branches.forEach((b, i) => {
    let r = find(i);
    if (!(r in cmap)) {
      cmap[r] = ++cid;
    }
    b.circuit = cmap[r];
    b.id = i + 1;
    b.endpoint = b.closed
      ? '完整旋轉（無死點端點）'
      : `${b.dA.kind === 'candidate' ? b.dA.angle.toFixed(3) : '範圍端'}|${b.dB.kind === 'candidate' ? b.dB.angle.toFixed(3) : '範圍端'}`;
    b.key = `C${b.circuit}B${b.id}`;
  });

  let dead = [];
  branches.forEach((b) => {
    if (b.closed) {
      return;
    }
    [b.dA, b.dB].filter((d) => d.kind === 'candidate').forEach((d) => {
      if (!dead.some((x) => sameDead(x, d, opt))) {
        dead.push({ ...d, circuit: b.circuit });
      }
    });
  });

  return {
    branches,
    circuitCount: cid,
    dead,
    verifiedDeadCount: dead.filter((d) => d.verified).length
  };
}

function specified() {
  return [...document.querySelectorAll('.position')].map((r) => ({
    name: r.querySelector('.posName').value,
    angle: +r.querySelector('.posAngle').value
  }));
}

// ===== 論文分支辨識法（翁維宏 2003《平面六連桿機構之分支辨識》§3-2）=====
// 對每個指定位置做位置分析，往輸入桿角度漸增／漸減兩方向以牛頓－拉福森法逼近
// 兩端死點；以「兩端逼近之死點是否相同」判迴路，以「趨近死點時輸出桿角度變化
// 的正負（Δθ_out 臨界符號）」判分支——與論文 §3-2-1 敘述及結論 3～5 一致。
function outApproachSign(tr) {
  // 取樣本末端的輸出桿角度變化，作為趨近死點時 Δθ_out 的臨界符號
  let s = tr && tr.samples;
  if (!s || s.length < 2) {
    return Math.sign((tr && tr.trend) || 0);
  }
  let n = s.length;
  let a = outputAngle(s[Math.max(0, n - 3)].pos);
  let b = outputAngle(s[n - 1].pos);
  let d = b - a;
  while (d > 180) {
    d -= 360;
  }
  while (d < -180) {
    d += 360;
  }
  return Math.sign(d) || Math.sign((tr && tr.trend) || 0);
}

function positionEndpoints(angle, seed, o) {
  let base = solve(rad(angle), seed || guess0(), o);
  let start = base.ok ? base.pos : (seed || guess0());
  let up = traceBranch(angle, start, base.residual || 0, +1, o);
  let dn = traceBranch(angle, start, base.residual || 0, -1, o);
  return {
    up: { dead: up.dead, sign: outApproachSign(up) },
    dn: { dead: dn.dead, sign: outApproachSign(dn) }
  };
}

function thesisIdentify(list, o) {
  let recs = list.map((p) => p.ok ? { ...p, ep: positionEndpoints(p.angle, p.s && p.s.pos, o) } : { ...p, ep: null });
  let ok = recs.filter((r) => r.ep);
  let deads = [];

  const idOf = (d) => {
    if (!d || d.kind !== 'candidate') {
      return null;
    }
    let i = deads.findIndex((x) => sameDead(x, d, o));
    if (i < 0) {
      deads.push({ ...d });
      return deads.length - 1;
    }
    return i;
  };

  ok.forEach((r) => {
    r.upId = idOf(r.ep.up.dead);
    r.dnId = idOf(r.ep.dn.dead);
  });

  // 迴路：以「共用逼近死點」用聯集－查找連成同一迴路（結論 §4）
  let par = ok.map((_, i) => i);
  let find = (x) => {
    while (par[x] !== x) {
      par[x] = par[par[x]];
      x = par[x];
    }
    return x;
  };

  for (let i = 0; i < ok.length; i++) {
    for (let j = i + 1; j < ok.length; j++) {
      let a = [ok[i].upId, ok[i].dnId].filter((x) => x != null);
      let b = [ok[j].upId, ok[j].dnId].filter((x) => x != null);
      if (a.some((x) => b.includes(x))) {
        par[find(i)] = find(j);
      }
    }
  }

  let cmap = {};
  let cid = 0;
  ok.forEach((r, i) => {
    let root = find(i);
    if (!(root in cmap)) {
      cmap[root] = ++cid;
    }
    r.tCircuit = cmap[root];
  });

  // 分支：同迴路內，兩端（死點, Δθ_out 符號）皆相同者為同分支（§3-2-1）
  let per = {};
  const sig = (r) => [[r.upId, r.ep.up.sign || 0], [r.dnId, r.ep.dn.sign || 0]]
    .sort((x, y) => (x[0] - y[0]) || (x[1] - y[1]))
    .map((z) => z.join(':'))
    .join('#');

  ok.forEach((r) => {
    let m = per[r.tCircuit] || (per[r.tCircuit] = {});
    let s = sig(r);
    if (!(s in m)) {
      m[s] = Object.keys(m).length + 1;
    }
    r.tBranch = m[s];
  });

  return {
    recs,
    circuitCount: cid,
    branchCount: ok.reduce((mx, r) => Math.max(mx, r.tBranch), 0),
    deads
  };
}

function classifyDefects(recs) {
  if (!recs.length) {
    return { labels: ['未設定'], reasons: ['尚未加入任何指定位置'], primary: '未設定' };
  }

  let ok = recs.filter((r) => r.ok);
  let bad = recs.filter((r) => !r.ok);
  let labels = [];
  let reasons = [];

  if (bad.length) {
    labels.push('含不可達位置');
    reasons.push(`${bad.map((b) => b.name).join('、')} 不落在任何分支的可達範圍內`);
  }

  if (ok.length > 1) {
    if (new Set(ok.map((r) => r.tCircuit)).size > 1) {
      labels.push('迴路缺陷');
      reasons.push('指定位置兩端逼近之死點不同，分屬不同迴路（結論 §4）');
    }

    let byC = {};
    ok.forEach((r) => {
      (byC[r.tCircuit] || (byC[r.tCircuit] = new Set())).add(r.tBranch);
    });

    if (Object.values(byC).some((s) => s.size > 1)) {
      labels.push('分支缺陷');
      reasons.push('同一迴路內指定位置逼近相同兩端死點，但趨近死點時輸出桿角度變化符號不同（§3-2-1）');
    }
  }

  if (!labels.length) {
    labels.push('同一迴路、同一分支');
    reasons.push('所有指定位置兩端逼近之死點相同，且趨近死點時輸出桿角度變化同號，無迴路／分支缺陷');
  }

  return { labels, reasons, primary: labels[0] };
}

