/* ===== 原型通用 UI 工具库 ===== */
window.UI = (function(){
  const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const money = n => (n==null?'-':Number(n).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2}));
  const num = n => (n==null?'-':Number(n).toLocaleString('zh-CN'));

  function badge(txt, color){ return `<span class="badge b-${color||'gray'}">${esc(txt)}</span>`; }
  const STATUS_COLOR = {空置:'green',已租:'blue',到期:'orange',维修:'red',预定:'purple',空闲:'green',临时:'cyan',待缴:'orange',已缴:'green',逾期:'red',部分核销:'cyan',已核销:'green',待派单:'orange',处理中:'cyan',已完成:'green',已评价:'purple',待审批:'orange',已通过:'green',已驳回:'red',在线:'green',掉线:'red',正常:'green',异常:'red',预警:'orange',公摊:'purple',独用:'blue',在租:'blue',已退租:'gray',已归档:'gray',待处理:'orange',已回复:'green',已关闭:'gray',在用:'blue',闲置:'green',调拨中:'cyan',维修中:'orange',已报废:'gray',进行中:'cyan',未开始:'gray',已结束:'green'};

  function table(cols, rows, opt){
    opt = opt||{};
    let h = '<table class="tb"><thead><tr>' + cols.map(c=>`<th style="${c.w?'width:'+c.w:''}">${esc(c.t)}</th>`).join('') + '</tr></thead><tbody>';
    if(!rows.length){ h += `<tr><td colspan="${cols.length}"><div class="empty">暂无数据</div></td></tr>`; }
    rows.forEach(r=>{ h += '<tr>' + cols.map(c=>`<td>${c.r? c.r(r): esc(r[c.k])}</td>`).join('') + '</tr>'; });
    return h + '</tbody></table>';
  }

  function pager(total, cur, onpage){
    const pages = Math.max(1, Math.ceil(total/8));
    let s = `<div class="pager">共 ${total} 条`;
    for(let i=1;i<=Math.min(pages,5);i++) s += `<span class="${i===cur?'on':''}" onclick="${onpage}(${i})">${i}</span>`;
    if(pages>5) s += '…';
    return s + '</div>';
  }

  function modal(opt){
    close();
    const m = document.createElement('div'); m.className='mask'; m.id='ui-mask';
    m.innerHTML = `<div class="modal ${opt.size||''}"><div class="mh">${esc(opt.title)}<span class="x" onclick="UI.close()">✕</span></div><div class="mb">${opt.body}</div>${opt.footer?`<div class="mf">${opt.footer}</div>`:''}</div>`;
    m.addEventListener('click', e=>{ if(e.target===m) close(); });
    document.body.appendChild(m);
  }
  function drawer(title, body, width){
    close();
    const m = document.createElement('div'); m.className='drawer-mask'; m.id='ui-mask'; m.onclick=close;
    const d = document.createElement('div'); d.className='drawer'; d.id='ui-drawer'; if(width) d.style.width=width;
    d.innerHTML = `<div class="dh">${title}<span class="x" onclick="UI.close()">✕</span></div><div class="db">${body}</div>`;
    document.body.appendChild(m); document.body.appendChild(d);
  }
  function close(){ ['ui-mask','ui-drawer'].forEach(id=>{ const e=document.getElementById(id); if(e) e.remove(); }); }
  function toast(msg){
    const old = document.getElementById('ui-toast'); if(old) old.remove();
    const t = document.createElement('div'); t.className='toast'; t.id='ui-toast'; t.textContent=msg;
    document.body.appendChild(t); setTimeout(()=>t.remove(), 2200);
  }
  function confirm(title, text, onOk){
    modal({title, size:'sm', body:`<div style="font-size:13.5px;color:var(--ink2);line-height:1.9">${text}</div>`,
      footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();${onOk}">确认</button>`});
  }

  // ---- SVG 图表（离线手写，保证原型独立可用）----
  const PALETTE = ['#2563eb','#16a34a','#ea8600','#7c3aed','#0891b2','#dc2626','#db2777','#65a30d'];
  function barChart(data, opt){ // data:[{l,v,c?}]
    opt=opt||{}; const W=opt.w||560,H=opt.h||220,P=34,max=Math.max(...data.map(d=>d.v),1);
    const bw=(W-P*2)/data.length;
    let s=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">`;
    for(let i=0;i<=4;i++){const y=P+(H-P*2)*i/4;s+=`<line x1="${P}" y1="${y}" x2="${W-8}" y2="${y}" stroke="#eef1f7"/><text x="${P-6}" y="${y+4}" font-size="9" fill="#9aa1b0" text-anchor="end">${Math.round(max*(1-i/4))}</text>`;}
    data.forEach((d,i)=>{const h=(H-P*2)*d.v/max,x=P+bw*i+bw*.2,y=H-P-h;
      s+=`<rect x="${x}" y="${y}" width="${bw*.6}" height="${h}" rx="4" fill="${d.c||PALETTE[i%PALETTE.length]}"><title>${d.l}: ${d.v}</title></rect><text x="${x+bw*.3}" y="${H-P+14}" font-size="10" fill="#6b7280" text-anchor="middle">${d.l}</text><text x="${x+bw*.3}" y="${y-5}" font-size="10" fill="#374151" text-anchor="middle" font-weight="600">${d.v}</text>`;});
    return s+'</svg>';
  }
  function lineChart(series, labels, opt){ // series:[{name,data,color}]
    opt=opt||{}; const W=opt.w||560,H=opt.h||220,P=34;
    const max=Math.max(...series.flatMap(s=>s.data),1), n=labels.length;
    const X=i=>P+(W-P-14)*(i/(n-1||1)), Y=v=>H-P-(H-P*2)*(v/max);
    let s=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">`;
    for(let i=0;i<=4;i++){const y=P+(H-P*2)*i/4;s+=`<line x1="${P}" y1="${y}" x2="${W-8}" y2="${y}" stroke="#eef1f7"/><text x="${P-6}" y="${y+4}" font-size="9" fill="#9aa1b0" text-anchor="end">${Math.round(max*(1-i/4))}</text>`;}
    labels.forEach((l,i)=>{ if(i%Math.ceil(n/8)===0) s+=`<text x="${X(i)}" y="${H-P+14}" font-size="9.5" fill="#6b7280" text-anchor="middle">${l}</text>`; });
    series.forEach((se,si)=>{const c=se.color||PALETTE[si];
      const pts=se.data.map((v,i)=>`${X(i)},${Y(v)}`).join(' ');
      s+=`<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linejoin="round"/>`;
      se.data.forEach((v,i)=>{ s+=`<circle cx="${X(i)}" cy="${Y(v)}" r="3" fill="#fff" stroke="${c}" stroke-width="2"><title>${labels[i]} ${se.name}: ${v}</title></circle>`; });
      s+=`<g font-size="10.5" fill="#4b5563"><rect x="${P+si*120}" y="6" width="9" height="9" rx="2" fill="${c}"/><text x="${P+si*120+14}" y="14">${se.name}</text></g>`;
    });
    return s+'</svg>';
  }
  function donut(data, opt){ // data:[{l,v,c?}]
    opt=opt||{}; const size=opt.size||170, R=64, r=40, cx=size/2, cy=size/2;
    const total=data.reduce((a,b)=>a+b.v,0)||1; let a0=-Math.PI/2;
    let s=`<svg viewBox="0 0 ${size} ${size}" style="width:${size}px">`;
    data.forEach((d,i)=>{const a1=a0+Math.PI*2*d.v/total,large=(a1-a0)>Math.PI?1:0,c=d.c||PALETTE[i%PALETTE.length];
      const p=(a,rr)=>`${cx+rr*Math.cos(a)},${cy+rr*Math.sin(a)}`;
      s+=`<path d="M${p(a0,R)} A${R},${R} 0 ${large} 1 ${p(a1,R)} L${p(a1,r)} A${r},${r} 0 ${large} 0 ${p(a0,r)} Z" fill="${c}"><title>${d.l}: ${d.v}</title></path>`;a0=a1;});
    s+=`<text x="${cx}" y="${cy-4}" font-size="20" font-weight="700" text-anchor="middle" fill="#1f2937">${opt.center||total}</text><text x="${cx}" y="${cy+15}" font-size="10.5" text-anchor="middle" fill="#9aa1b0">${opt.centerLabel||''}</text></svg>`;
    let lg='<div style="display:flex;flex-direction:column;gap:7px;justify-content:center">';
    data.forEach((d,i)=>{lg+=`<div style="font-size:12.5px;color:#4b5563"><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${d.c||PALETTE[i%PALETTE.length]};margin-right:7px"></i>${d.l} <b style="float:right;margin-left:18px">${d.v}${opt.unit||''}</b></div>`;});
    return `<div style="display:flex;gap:22px;align-items:center">${s}${lg}</div>`;
  }

  function desc(items, col){ // items:[[k,v],...]
    return `<div class="desc ${col?'c'+col:''}">` + items.map(([k,v])=>`<div class="it"><div class="k">${esc(k)}</div><div class="v">${v==null?'-':v}</div></div>`).join('') + '</div>';
  }
  function tabs(list, cur, fn){
    return `<div class="tabs">` + list.map(t=>`<div class="t ${t===cur?'on':''}" onclick="${fn}('${t}')">${t}</div>`).join('') + '</div>';
  }
  function stat(label, value, sub, onclick){
    return `<div class="stat" ${onclick?`onclick="${onclick}"`:''}><div class="l">${label}</div><div class="v">${value}</div><div class="s">${sub||''}</div></div>`;
  }
  function timeline(items){
    return `<div class="tl">` + items.map(it=>`<div class="ti ${it.act?'act':''}"><div class="tt">${it.t}</div><div class="td">${it.d||''}</div></div>`).join('') + '</div>';
  }
  function fld(label, inner, full, req){ return `<div class="fld ${full?'full':''}"><label>${esc(label)}${req?'<b>*</b>':''}</label>${inner}</div>`; }

  return {esc, money, num, badge, table, pager, modal, drawer, close, toast, confirm,
    barChart, lineChart, donut, desc, tabs, stat, timeline, fld, STATUS_COLOR, PALETTE};
})();
