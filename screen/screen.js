/* ===== 驾驶舱大屏 ===== */
(function(){
const S = DB.stats, inc = DB.incomeByMonth;
const money = UI.money;

// 自适应缩放
function fit(){
  const s = Math.min(innerWidth/1920, innerHeight/1080);
  const el = document.getElementById('scr');
  el.style.transform = `scale(${s})`;
  el.style.marginLeft = ((innerWidth-1920*s)/2)+'px';
}
addEventListener('resize', fit); fit();

function tick(){
  const d = new Date();
  document.getElementById('clock').textContent =
    d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+' '+
    String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0');
}
setInterval(tick,1000); tick();

// KPI
let income = S.monthIncome;
function renderKpis(){
  document.getElementById('kpis').innerHTML = [
    ['本月总收入', `<span id="k-inc">${money(income*10000)}</span> <small>元</small>`, '同比 <b class="up">+12.4%</b>'],
    ['综合出租率', S.rentRate+'<small>%</small>', '车位 '+S.spotRate+'%'],
    ['回款率', '91.2<small>%</small>', '应收 105.7 万'],
    ['欠费总额', money(S.arrearsTotal)+' <small>元</small>', '逾期 <b class="down">'+DB.receivables.filter(r=>r.status==='逾期').length+'</b> 笔'],
    ['表计在线率', Math.round(S.metersOnline/S.meterTotal*100)+'<small>%</small>', S.metersOnline+' / '+S.meterTotal+' 块在线'],
  ].map(k=>`<div class="kpi"><div class="l">${k[0]}</div><div class="v">${k[1]}</div><div class="s">${k[2]}</div></div>`).join('');
}
renderKpis();
// 数字滚动
setInterval(()=>{ income += Math.random()*0.02; const e=document.getElementById('k-inc'); if(e) e.textContent = money(income*10000); }, 3000);

// 房源状态条形
(function(){
  const rows = [['公寓', catStat('公寓')], ['厂房', catStat('厂房')], ['写字楼', catStat('写字楼')], ['商业', catStat('商业')], ['其他', catStat('其他')]];
  function catStat(c){ const rs=DB.rooms.filter(r=>r.cat===c); const r=rs.filter(x=>x.status==='已租'||x.status==='到期').length; return {t:rs.length, r, p: rs.length?Math.round(r/rs.length*100):0}; }
  document.getElementById('roomBars').innerHTML = rows.map(([n,v])=>
    `<div class="bar-row"><span class="bl">${n}</span><span class="bt"><i style="width:${v.p}%"></i></span><span class="bv">${v.p}%</span><span class="mini">${v.r}/${v.t}</span></div>`).join('');
  document.getElementById('roomNote').textContent = `空置 ${S.vacant} · 即将到期 ${S.expire} · 维修 ${S.repair} · 预定 ${S.booked}`;
})();

// 园区分布图（抽象地图点位）
(function(){
  const map = document.getElementById('map');
  const areas = [
    {n:'城东产业园', x:26, y:30, s:200},
    {n:'滨江科创园', x:62, y:52, s:150},
    {n:'临港智造园', x:38, y:72, s:120},
  ];
  let h = '';
  areas.forEach((a,i)=>{
    h += `<div class="ring" style="left:${a.x}%;top:${a.y}%;width:${a.s}px;height:${a.s}px;transform:translate(-50%,-50%)"></div>
          <div class="ring" style="left:${a.x}%;top:${a.y}%;width:${a.s*.6}px;height:${a.s*.6}px;transform:translate(-50%,-50%);border-color:rgba(80,140,255,.4)"></div>`;
  });
  // 房源点位
  const rooms = DB.rooms.slice(0, 60);
  rooms.forEach((r,i)=>{
    const a = areas[i%3];
    const ang = (i*137.5)%360, rad = (a.s*.42)*(0.3+((i*37)%70)/100);
    const x = a.x + Math.cos(ang*Math.PI/180)*rad/9;
    const y = a.y + Math.sin(ang*Math.PI/180)*rad/14;
    const cls = r.status==='到期'?'warn':(r.status==='维修'?'bad':'');
    h += `<div class="dot ${cls}" style="left:calc(${x}% );top:${y}%" title="${r.bname} ${r.no} ${r.status}">${i%13===0?`<span class="lb">${r.bname}</span>`:''}</div>`;
  });
  h += `<div style="position:absolute;bottom:8px;left:10px;font-size:12px;color:#7ea2e8">
    ● <span style="color:#3ddc97">正常</span>　● <span style="color:#ffb04d">即将到期</span>　● <span style="color:#ff6b6b">维修/异常</span></div>`;
  map.innerHTML = h;
})();

// 缴费状态
(function(){
  const bills = DB.bills;
  const paid = bills.filter(b=>b.status==='已缴').reduce((a,b)=>a+b.amount,0);
  const pend = bills.filter(b=>b.status==='待缴').reduce((a,b)=>a+b.amount,0);
  const over = bills.filter(b=>b.status==='逾期').reduce((a,b)=>a+b.amount,0);
  const total = paid+pend+over;
  const donutEl = UI.donut([
    {l:'已缴', v:Math.round(paid/10000*10)/10, c:'#3ddc97'},
    {l:'待缴', v:Math.round(pend/10000*10)/10, c:'#ffb04d'},
    {l:'逾期', v:Math.round(over/10000*10)/10, c:'#ff6b6b'}
  ], {center:'¥'+Math.round(total/10000)+'万', centerLabel:'本月账单', size:150, unit:'万'});
  document.getElementById('payDonut').innerHTML = donutEl +
    `<div style="font-size:12.5px;line-height:2.1;color:#9fc0ff">收缴率 <b style="color:#3ddc97;font-size:18px">${Math.round(paid/total*100)}%</b><br>逾期占比 <b style="color:#ff6b6b">${(over/total*100).toFixed(1)}%</b></div>`;
  document.getElementById('payDonut').querySelectorAll('svg text').forEach(t=>{ t.setAttribute('fill','#dbe7ff'); });
  document.getElementById('payDonut').querySelectorAll('div').forEach(d=>{ if(d.style.color) d.style.color='#9fc0ff'; });
})();

// 欠费预警
(function(){
  const list = DB.receivables.filter(r=>r.status==='逾期').sort((a,b)=>b.balance-a.balance).slice(0,8);
  const el = document.getElementById('arrears');
  el.innerHTML = list.map(r=>`<div class="sl-row"><span class="nm">${r.tenant} <span class="mini">${r.room}</span></span>
    <span><span class="amt">¥${money(r.balance)}</span> <span class="pill ${r.days>60?'pr':'po'}">${r.days}天</span></span></div>`).join('');
  // 滚动
  let y = 0;
  setInterval(()=>{ y = (y+1) % (list.length*37); el.scrollTop = y; }, 120);
})();

// 收入趋势
document.getElementById('incomeChart').innerHTML = UI.lineChart(
  [{name:'总收入', data:inc.map(x=>x.total), color:'#4fd8e8'},{name:'租金', data:inc.map(x=>x.租金), color:'#3ddc97'}],
  inc.map(x=>x.m), {h:200});
document.querySelectorAll('#incomeChart svg text').forEach(t=>t.setAttribute('fill','#7ea2e8'));
document.querySelectorAll('#incomeChart svg line').forEach(l=>l.setAttribute('stroke','rgba(80,130,220,.15)'));

// 合同 & 异常预警
(function(){
  const items = [];
  DB.contracts.filter(c=>c.status==='即将到期').slice(0,4).forEach(c=> items.push(['合同', c.tname+' · '+c.roomName+' 合同 '+c.end+' 到期', 'po']));
  items.push(['异常','1 号宿舍楼 405 用电异常 +182%','pr']);
  items.push(['设备','创新大厦 803 电表掉线 24h+','po']);
  items.push(['报修','工单 GD20260712 待派单超 2 小时','pb']);
  document.getElementById('warns').innerHTML = items.map(w=>
    `<div class="sl-row"><span class="nm"><span class="pill ${w[2]}">${w[0]}</span> ${w[1]}</span><span class="dt">待跟进</span></div>`).join('');
})();

// 车位
(function(){
  const free = S.spotFree, used = S.spotTotal - free;
  document.getElementById('park').innerHTML = `
    <div style="display:flex;gap:18px;align-items:center">
      <div style="text-align:center"><div style="font-size:30px;font-weight:800;color:#3ddc97">${free}</div><div class="mini">空余车位</div></div>
      <div style="flex:1">
        <div class="bar-row"><span class="bl">已租</span><span class="bt"><i style="width:${S.spotRate}%"></i></span><span class="bv">${S.spotRate}%</span></div>
        <div class="bar-row"><span class="bl">临停在场</span><span class="bt"><i style="width:22%;background:linear-gradient(90deg,#0e7490,#4fd8e8)"></i></span><span class="bv">${DB.spots.filter(s=>s.status==='临时').length}</span></div>
        <div class="mini">今日进 312 · 出 298 · 临停收入 ¥486.5</div>
      </div></div>`;
})();

// 智能表计能耗
(function(){
  document.getElementById('meters').innerHTML = `
    <div class="bar-row"><span class="bl">今日用电</span><span class="bt"><i style="width:78%"></i></span><span class="bv">1,842</span><span class="mini">kWh</span></div>
    <div class="bar-row"><span class="bl">今日用水</span><span class="bt"><i style="width:46%;background:linear-gradient(90deg,#0e7490,#4fd8e8)"></i></span><span class="bv">126</span><span class="mini">m³</span></div>
    <div class="bar-row"><span class="bl">远程抄表</span><span class="bt"><i style="width:96%;background:linear-gradient(90deg,#15803d,#3ddc97)"></i></span><span class="bv">96%</span><span class="mini">成功率</span></div>
    <div class="mini" style="margin-top:4px">今日远程分闸 1 次 · 合闸 2 次 · 充值到账 18 笔 · API 调用成功率 99.7%<br>数据源：pepems.chinapeople.com（项目 ${DB.api.projectId}）</div>`;
})();
})();
