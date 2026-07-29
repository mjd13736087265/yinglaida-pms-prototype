/* ===== 小程序管理端 ===== */
(function(){
const {badge, money, timeline, barChart, lineChart, donut, desc} = UI;
const S = DB.stats;
const state = {tab:'work', stack:[]};
const body = () => document.getElementById('mpa-body');

function tabbar(){
  const tabs = [['work','🏠','工作台'],['estate','🏢','产业'],['rent','💰','收租'],['me','👤','我的']];
  document.getElementById('mpa-tabbar').innerHTML = tabs.map(([k,i,t])=>
    `<div class="pt ${state.tab===k&&!state.stack.length?'on':''}" onclick="MA.go('${k}')"><span class="pi">${i}</span>${t}</div>`).join('');
}
function render(){
  tabbar();
  const top = state.stack[state.stack.length-1];
  if(top) PAGES[top.p](top.arg); else PAGES[state.tab]();
  body().scrollTop = 0;
}
const navBar = (t,r) => `<div class="pnav"><span class="bk" onclick="MA.back()">‹</span><span class="ti">${t}</span>${r||''}</div>`;
const stBadge = s => badge(s, UI.STATUS_COLOR[s]||'gray');

const PAGES = {
/* ================= 工作台 ================= */
work(){
  const todayTodo = DB.approvals.filter(a=>a.status==='待审批').length + DB.orders.filter(o=>o.status==='待派单').length;
  body().innerHTML = `
  <div class="whead">
    <div class="wl">本月实收（万元）</div>
    <div class="wv">96.40 <span style="font-size:12px;font-weight:400;opacity:.8">应收 105.7 · 回款率 91.2%</span></div>
    <div style="font-size:11px;opacity:.75;margin-top:6px">📍 全部片区 · 陈志远（片区经理）· 切换 ▾</div>
  </div>
  <div class="wstats">
    <div class="ws" onclick="MA.push('rent_arrears')"><div class="l">欠费总额</div><div class="v" style="color:var(--red)">${money(S.arrearsTotal/10000)}万</div></div>
    <div class="ws" onclick="MA.push('estateMap','公寓')"><div class="l">出租率</div><div class="v">${S.rentRate}%</div></div>
    <div class="ws" onclick="MA.push('todo')"><div class="l">待办</div><div class="v" style="color:var(--orange)">${todayTodo}</div></div>
  </div>
  <div class="mcard"><h4>快捷入口</h4>
    <div class="qa">
      <div class="q" style="background:linear-gradient(135deg,#f5604d,#e0331f)" onclick="MA.push('dun')"><b>⏰ 一键催缴</b>单条/批量 微信·短信</div>
      <div class="q" style="background:linear-gradient(135deg,#2f9e57,#187a3c)" onclick="MA.push('checkin')"><b>🛏️ 入住办理</b>选房·录租户·签合同</div>
      <div class="q" style="background:linear-gradient(135deg,#e89b1c,#c97a06)" onclick="MA.push('checkout')"><b>📤 退房办理</b>交接·结算·退押金</div>
      <div class="q" style="background:linear-gradient(135deg,#3f7bff,#2456d6)" onclick="MA.push('orders')"><b>🔧 报修派单</b>现场派单指定维修</div>
    </div>
  </div>
  <div class="mcard"><h4>管理功能</h4>
    <div class="mgrid">
      ${[['🏢','产业管理','estateHub'],['💰','收租管理','rentHub'],['📄','合同管理','contractHub'],['💧','水电管理','waterHub'],
         ['🔧','物业报修','orders'],['🧹','客房清扫','housekeeping'],['📈','数据报表','reportHub'],['✅','审批中心','approval'],['🗺️','片区切换','areaSwitch']].map(([i,t,p])=>
        `<div class="g" onclick="MA.push('${p}')"><div class="gi" style="background:#f0f4fd">${i}</div><div class="gt">${t}</div></div>`).join('')}
    </div>
  </div>
  <div class="mcard"><h4>🔔 预警消息 <span style="float:right;font-size:12px;color:var(--ink3);font-weight:400;cursor:pointer" onclick="MA.push('alarms')">全部 ›</span></h4>
    ${[['欠费','恒力机械 逾期 45 天，欠费 ¥12,600','red'],['合同','2 号宿舍楼 302 合同 30 天后到期','orange'],['报修','工单 GD20260712 待派单超 2 小时','orange'],['审批','押金退还审批待您处理','blue'],['用量','1 号楼 405 用电异常 +182%','red']].map(a=>`
    <div class="mrow" onclick="MA.push('alarms')"><div class="ic" style="background:var(--${a[2]==='red'?'red':a[2]==='orange'?'orange':'blue'}-bg)">${{欠费:'⏰',合同:'📄',报修:'🔧',审批:'✅',用量:'⚡'}[a[0]]}</div>
    <div class="tx"><div class="tt" style="font-size:13px">${a[1]}</div><div class="ts">${a[0]}预警 · 刚刚</div></div><span class="ar">›</span></div>`).join('')}
  </div>`;
},

/* ================= 客房清扫任务（R-12 酒店退房→清扫→空净闭环） ================= */
housekeeping(){
  const tasks = [
    {no:'8601', type:'大床房', st:'待清扫', out:'今日 12:40 退房', cleaner:'—'},
    {no:'8603', type:'双床房', st:'清扫中', out:'今日 11:05 退房', cleaner:'王秀兰', since:'13:20 开始'},
    {no:'8506', type:'套房',   st:'待质检', out:'昨日 18:20 退房', cleaner:'李桂芳', since:'已完成清扫 12:10'},
    {no:'8502', type:'大床房', st:'已转空净', out:'昨日 12:10 退房', cleaner:'王秀兰', since:'质检通过 10:40'}
  ];
  const c = {待清扫:'red', 清扫中:'cyan', 待质检:'orange', 已转空净:'green'};
  body().innerHTML = navBar('客房清扫任务') + `
  <div class="mcard" style="display:flex;gap:10px;text-align:center">
    ${[['待清扫',2,'red'],['清扫中',1,'cyan'],['待质检',1,'orange'],['今日转空净',6,'green']].map(([l,n,cc])=>`
    <div style="flex:1"><div style="font-size:22px;font-weight:800;color:var(--${cc})">${n}</div><div style="font-size:11px;color:var(--ink3)">${l}</div></div>`).join('')}
  </div>
  ${tasks.map(t=>`<div class="mcard">
    <div style="display:flex;justify-content:space-between;margin-bottom:6px">
      <b>${t.no} · ${t.type}</b>${badge(t.st, c[t.st])}</div>
    <div style="font-size:12px;color:var(--ink3)">${t.out} · 清扫员：${t.cleaner}${t.since?' · '+t.since:''}</div>
    <div style="display:flex;gap:8px;margin-top:10px">
      ${t.st==='待清扫'?`<button class="btn sm pri" onclick="UI.toast('已接单并开始清扫 ${t.no}')">接单开始清扫</button>`:''}
      ${t.st==='清扫中'?`<button class="btn sm pri" onclick="UI.toast('清扫完成，拍照上传 3 张，待质检')">清扫完成（拍照上传）</button>`:''}
      ${t.st==='待质检'?`<button class="btn sm pri" onclick="UI.toast('质检通过，${t.no} 已转空净并可开房')">质检通过转空净</button><button class="btn sm danger" onclick="UI.toast('已打回重新清扫')">质检打回</button>`:''}
      ${t.st==='已转空净'?`<span style="font-size:12px;color:var(--green)">✓ 已同步前台可售</span>`:''}
    </div></div>`).join('')}
  <div style="font-size:11px;color:var(--ink3);text-align:center;padding:6px 0 16px">PC 端退房结账后自动生成清扫任务 · 状态实时同步房态图</div>`;
},

/* ================= 产业 Tab（选择业态） ================= */
estate(){
  body().innerHTML = `<div class="pnav"><span class="ti" style="margin:0">产业管理</span></div>
  ${[['公寓','🛏️','宿舍房源、房态、入住退房'],['厂房','🏭','图形化房态、定价、销售'],['车位','🅿️','出租、临停计费'],['写字楼','🏢','办公房源管理'],['商业','🏬','商铺房源管理'],['酒店','🏨','长租协议房'],['其他','📦','仓库等']].map(([c,i,d])=>`
  <div class="mcard" style="cursor:pointer" onclick="MA.push('estateMap','${c}')">
    <div class="mrow" style="padding:4px 0"><div class="ic" style="background:#f0f4fd">${i}</div>
    <div class="tx"><div class="tt">${c}管理</div><div class="ts">${d}</div></div><span class="ar">›</span></div></div>`).join('')}`;
},
estateMap(cat){
  const rs = DB.rooms.filter(r=>r.cat===cat);
  const g = s => rs.filter(r=>r.status===s).length;
  const cls = {空置:'c-vacant',已租:'c-rented',到期:'c-expire',维修:'c-repair',预定:'c-booked'};
  body().innerHTML = navBar(cat+'房态', `<span style="font-size:12px;color:var(--primary)" onclick="MA.push('estateList','${cat}')">列表</span>`) + `
  <div style="display:flex;gap:8px;padding:12px 12px 0;font-size:12px">
    ${[['空置',g('空置'),'var(--green)'],['已租',g('已租'),'var(--blue)'],['到期',g('到期'),'var(--orange)'],['维修',g('维修'),'var(--red)'],['预定',g('预定'),'var(--purple)']].map(x=>`<span class="chip" style="margin:0"><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${x[2]};margin-right:4px"></i>${x[0]} ${x[1]}</span>`).join('')}
  </div>
  ${DB.buildings.filter(b=>b.cat===cat).map(b=>{
    const brs = rs.filter(r=>r.bid===b.id);
    return `<div class="mcard"><h4 style="font-size:13.5px">${b.name}</h4>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">
      ${brs.slice(0,24).map(r=>`<div class="cell ${cls[r.status]}" style="padding:7px 4px;text-align:center" onclick="MA.push('room','${r.id}')">
        <div style="font-size:11px;font-weight:700">${r.no}</div></div>`).join('')}
    </div>
    ${brs.length>24?`<div style="font-size:11.5px;color:var(--ink3);margin-top:8px;cursor:pointer" onclick="MA.push('estateList','${cat}')">查看全部 ${brs.length} 间 ›</div>`:''}
  </div>`;}).join('')}`;
},
estateList(cat){
  const rs = DB.rooms.filter(r=>r.cat===cat);
  body().innerHTML = navBar(cat+'房源列表') + `
  <div style="padding:10px 12px 0"><input class="ipt" style="width:100%" placeholder="搜索房号 / 租户"></div>
  <div class="seg" style="padding:10px 12px 0">${['全部','空置','已租','到期','维修'].map((t,i)=>`<span class="chip ${i===0?'on':''}" style="margin:0" onclick="this.parentNode.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));this.classList.add('on')">${t}</span>`).join('')}</div>
  ${rs.slice(0,12).map(r=>`<div class="mcard" style="cursor:pointer;padding:12px 14px;margin-top:10px" onclick="MA.push('room','${r.id}')">
    <div style="display:flex;justify-content:space-between"><b>${r.bname} ${r.no}</b>${stBadge(r.status)}</div>
    <div style="font-size:12px;color:var(--ink3);margin-top:5px">${r.size}㎡ · ¥${r.rent}${(r.cat==='厂房'||r.cat==='其他')?'/㎡·月':'/月'} ${r.tname?'· '+r.tname:''}</div></div>`).join('')}`;
},
room(id){
  const r = DB.rooms.find(x=>x.id===id);
  const c = DB.contracts.find(x=>x.room===id);
  body().innerHTML = navBar('房源详情') + `
  <div class="mcard">
    <div style="display:flex;justify-content:space-between;margin-bottom:10px"><b style="font-size:16px">${r.bname} ${r.no}</b>${stBadge(r.status)}</div>
    ${[['面积',r.size+' ㎡'],['租金','¥'+r.rent+((r.cat==='厂房'||r.cat==='其他')?'/㎡·月':'/月')],['配套',r.cat==='厂房'?'行车·动力电·卸货平台':'空调·热水器·宽带'],['当前租户',r.tname||'—'],['合同',c?c.id:'—'],['合同到期',r.endDate||'—'],['押金',r.deposit?'¥'+money(r.deposit):'—']].map(([k,v])=>`<div class="mrow" style="padding:9px 0;cursor:default"><div class="tx"><div class="ts">${k}</div></div><b style="font-size:13px;max-width:60%;text-align:right">${v}</b></div>`).join('')}
  </div>
  <div style="padding:12px;display:flex;gap:10px">
    ${r.status==='空置'?`<button class="mbtn" style="flex:1" onclick="MA.push('checkin')">办理入住</button>`:''}
    ${(r.status==='已租'||r.status==='到期')?`<button class="mbtn line" style="flex:1" onclick="UI.toast('续租合同已生成推送签署')">续租</button><button class="mbtn" style="flex:1;background:var(--orange)" onclick="MA.push('checkout')">退房办理</button>`:''}
    ${r.status==='维修'?`<button class="mbtn" style="flex:1" onclick="UI.toast('已转为空置')">维修完成</button>`:''}
  </div>
  ${c? `<div class="mcard"><h4>缴费记录</h4>
    ${DB.bills.filter(b=>b.contract===c.id).slice(0,4).map(b=>`<div class="mrow" style="cursor:default"><div class="tx"><div class="tt" style="font-size:13px">${b.month} ${b.type}</div></div><span style="font-size:13px">¥${money(b.amount)} ${stBadge(b.status)}</span></div>`).join('')}</div>`:''}`;
},

/* ================= 收租 Tab ================= */
rent(){
  body().innerHTML = `<div class="pnav"><span class="ti" style="margin:0">收租管理</span></div>
  <div class="mcard"><div class="qa">
    <div class="q" style="background:linear-gradient(135deg,#2f9e57,#187a3c)" onclick="MA.push('rent_bills')"><b>📋 账单管理</b>租金/水电/其他账单</div>
    <div class="q" style="background:linear-gradient(135deg,#3f7bff,#2456d6)" onclick="MA.push('rent_stat')"><b>📊 应收统计</b>收缴率·回款率</div>
    <div class="q" style="background:linear-gradient(135deg,#f5604d,#e0331f)" onclick="MA.push('rent_arrears')"><b>⏰ 欠费台账</b>欠费·催收记录</div>
    <div class="q" style="background:linear-gradient(135deg,#e89b1c,#c97a06)" onclick="MA.push('rent_verify')"><b>✅ 到账核销</b>扫码/手动核销</div>
  </div></div>
  <div class="mcard"><h4>本月收款概览</h4>
    ${UI.lineChart([{name:'实收(万)',data:[2.1,3.4,2.8,5.2,4.6,3.9,6.1,4.2,3.3,5.8,4.9,3.6,6.4,5.1]}], ['07-16','07-17','07-18','07-19','07-20','07-21','07-22','07-23','07-24','07-25','07-26','07-27','07-28','07-29'], {h:150})}
  </div>
  <div class="mcard"><h4>最新到账</h4>
    ${DB.bills.filter(b=>b.status==='已缴').slice(0,4).map(b=>`<div class="mrow" style="cursor:default"><div class="tx"><div class="tt" style="font-size:13px">${b.tname} · ${b.type}</div><div class="ts">${b.payTime} · ${b.channel}</div></div><b style="color:var(--green)">+¥${money(b.amount)}</b></div>`).join('')}
  </div>`;
},
rent_bills(){
  body().innerHTML = navBar('账单管理') + `
  <div class="mtabs">${['租金账单','水电账单','其他账单'].map((t,i)=>`<div class="mt ${i===0?'on':''}" onclick="this.parentNode.querySelectorAll('.mt').forEach(x=>x.classList.remove('on'));this.classList.add('on')">${t}</div>`).join('')}</div>
  <div style="padding:10px 12px 0"><input class="ipt" style="width:100%" placeholder="搜索租户 / 房号 / 账单号"></div>
  ${DB.bills.filter(b=>b.type==='租金').slice(0,8).map(b=>`<div class="mcard" style="cursor:pointer;padding:12px 14px;margin-top:10px" onclick="MA.push('bill','${b.id}')">
    <div style="display:flex;justify-content:space-between"><b style="font-size:13.5px">${b.tname} · ${b.room}</b>${stBadge(b.status)}</div>
    <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:12.5px;color:var(--ink3)"><span>${b.month} · ${b.id}</span><b style="color:${b.status==='已缴'?'var(--ink)':'var(--red)'};font-size:14px">¥${money(b.amount)}</b></div></div>`).join('')}`;
},
bill(id){
  const b = DB.bills.find(x=>x.id===id);
  body().innerHTML = navBar('账单详情') + `
  <div class="mcard" style="text-align:center;padding:20px">
    <div style="font-size:12px;color:var(--ink3)">${b.month} ${b.type} · ${b.tname}</div>
    <div style="font-size:28px;font-weight:800;margin:8px 0;color:${b.status==='已缴'?'var(--ink)':'var(--red)'}">¥${money(b.amount)}</div>
    ${stBadge(b.status)}</div>
  <div class="mcard">${[['账单号',b.id],['房源',b.room],['关联合同',b.contract],['应缴截止',b.due],['支付',b.channel?b.channel+' '+b.payTime:'未支付']].map(([k,v])=>`<div class="mrow" style="padding:9px 0;cursor:default"><div class="tx"><div class="ts">${k}</div></div><b style="font-size:13px">${v}</b></div>`).join('')}</div>
  ${b.status!=='已缴'?`<div style="padding:12px;display:flex;gap:10px">
    <button class="mbtn line" style="flex:1" onclick="UI.toast('催缴消息已发送')">催缴</button>
    <button class="mbtn" style="flex:1" onclick="MA.push('rent_verify')">收款核销</button></div>`:''}`;
},
rent_stat(){
  body().innerHTML = navBar('应收统计') + `
  <div class="wstats" style="margin-top:12px">
    <div class="ws"><div class="l">本月应收</div><div class="v">105.7万</div></div>
    <div class="ws"><div class="l">已收</div><div class="v" style="color:var(--green)">96.4万</div></div>
    <div class="ws"><div class="l">收缴率</div><div class="v">91.2%</div></div>
  </div>
  <div class="mcard"><h4>收缴率趋势</h4>${lineChart([{name:'收缴率 %',data:[88,90,87,91,89,92,90,93,91,89,90,91.2]}], DB.months, {h:160})}</div>
  <div class="mcard"><h4>费用类型构成</h4>${donut([{l:'租金',v:82,c:'#2563eb'},{l:'水电',v:9,c:'#ea8600'},{l:'物业',v:6,c:'#16a34a'},{l:'停车',v:3,c:'#7c3aed'}],{center:'105.7万',centerLabel:'本月应收'})}</div>`;
},
rent_arrears(){
  const arr = DB.receivables.filter(r=>r.status==='逾期').sort((a,b)=>b.balance-a.balance);
  body().innerHTML = navBar('欠费台账', `<span style="font-size:12px;color:var(--primary)" onclick="MA.push('dun')">一键催缴</span>`) + `
  <div class="mcard" style="display:flex;justify-content:space-around;text-align:center">
    <div><div style="font-size:11px;color:var(--ink3)">欠费总额</div><b style="color:var(--red);font-size:17px">¥${money(S.arrearsTotal)}</b></div>
    <div><div style="font-size:11px;color:var(--ink3)">欠费租户</div><b style="font-size:17px">${new Set(arr.map(r=>r.tenant)).size}</b></div>
    <div><div style="font-size:11px;color:var(--ink3)">最长逾期</div><b style="font-size:17px">${Math.max(...arr.map(r=>r.days))} 天</b></div>
  </div>
  ${arr.slice(0,10).map(r=>`<div class="mcard" style="cursor:pointer;padding:12px 14px;margin-top:10px" onclick="MA.push('arrear','${r.id}')">
    <div style="display:flex;justify-content:space-between"><b style="font-size:13.5px">${r.tenant}</b><b style="color:var(--red)">¥${money(r.balance)}</b></div>
    <div style="font-size:12px;color:var(--ink3);margin-top:5px">${r.room} · ${r.type} · 逾期 ${r.days} 天 · 已催 ${DB.collections.filter(c=>c.recv===r.id).length} 次</div></div>`).join('')}`;
},
arrear(id){
  const r = DB.receivables.find(x=>x.id===id);
  const logs = DB.collections.filter(c=>c.recv===id);
  body().innerHTML = navBar('欠费详情') + `
  <div class="mcard">${[['租户',r.tenant],['房源',r.room],['费用类型',r.type],['欠费金额','¥'+money(r.balance)],['逾期天数',r.days+' 天'],['合同',r.contract]].map(([k,v])=>`<div class="mrow" style="padding:9px 0;cursor:default"><div class="tx"><div class="ts">${k}</div></div><b style="font-size:13px">${v}</b></div>`).join('')}</div>
  <div class="mcard"><h4>催收记录</h4>
    ${logs.length? timeline(logs.map(l=>({t:l.way, d:l.time+' · '+l.result+' · '+l.by, act:true}))) : '<div style="font-size:12.5px;color:var(--ink3)">暂无催收记录</div>'}</div>
  <div style="padding:12px;display:flex;gap:10px">
    <button class="mbtn line" style="flex:1" onclick="UI.toast('已拨打租户电话（演示）')">📞 电话催收</button>
    <button class="mbtn" style="flex:1" onclick="UI.toast('催缴消息已发送（微信+短信）')">发催缴通知</button></div>`;
},
rent_verify(){
  body().innerHTML = navBar('到账核销') + `
  <div style="padding:12px"><button class="mbtn" onclick="UI.toast('扫码成功：匹配 YS2031 ¥1,350，已核销')">📷 扫码核销</button></div>
  <div class="mcard"><h4>待核销（手动核销 / 部分核销）</h4>
    ${DB.receivables.filter(r=>r.balance>0).slice(0,6).map(r=>`<div class="mrow"><div class="tx"><div class="tt" style="font-size:13px">${r.tenant} · ${r.type}</div><div class="ts">${r.id} · 余额 ¥${money(r.balance)}</div></div>
    <button class="btn sm pri" onclick="UI.toast('核销成功')">核销</button></div>`).join('')}
  </div>`;
},

/* ================= 快捷：一键催缴 / 入住 / 退房 ================= */
dun(){
  body().innerHTML = navBar('一键催缴') + `
  <div class="mtabs">${['单条催缴','批量催缴'].map((t,i)=>`<div class="mt ${i===0?'on':''}" onclick="this.parentNode.querySelectorAll('.mt').forEach(x=>x.classList.remove('on'));this.classList.add('on')">${t}</div>`).join('')}</div>
  <div class="mcard">
    <div class="fld"><label>选择欠费租户</label><select class="ipt">${DB.receivables.filter(r=>r.status==='逾期').slice(0,5).map(r=>`<option>${r.tenant}（欠 ¥${money(r.balance)}）</option>`).join('')}</select></div>
    <div class="fld" style="margin-top:12px"><label>催缴方式</label><div>${['微信模板消息','短信','都发送'].map((t,i)=>`<span class="chip ${i===2?'on':''}" onclick="this.parentNode.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));this.classList.add('on')">${t}</span>`).join('')}</div></div>
    <div class="fld" style="margin-top:12px"><label>催缴内容</label><textarea class="ipt" rows="3">【英莱达】您有账单已逾期，请尽快登录小程序缴纳，逾期将影响续租与门禁使用。</textarea></div>
  </div>
  <div style="padding:12px"><button class="mbtn" onclick="UI.toast('催缴已发送，结果可在催收记录查看');MA.back()">立即发送</button></div>`;
},
checkin(){
  body().innerHTML = navBar('入住办理') + `
  ${timeline([{t:'① 现场选房',d:'从空置房源中选择',act:true},{t:'② 录入租户',d:'证件 OCR 识别'},{t:'③ 上传证件',d:'身份证/营业执照'},{t:'④ 生成合同',d:'电子签章'},{t:'⑤ 收押金',d:'更新房态·开通门禁'}]).replace('class="tl"','class="tl" style="background:#fff;margin:12px;border-radius:12px;padding:18px 14px 4px 34px"')}
  <div class="mcard">
    <div class="fld"><label>选择房间（空置）</label><select class="ipt">${DB.rooms.filter(r=>r.cat==='公寓'&&r.status==='空置').slice(0,5).map(r=>`<option>${r.bname} ${r.no}（¥${r.rent}/月）</option>`).join('')}</select></div>
    <div class="fld" style="margin-top:12px"><label>租户姓名</label><input class="ipt" placeholder="姓名/企业名称"></div>
    <div class="fld" style="margin-top:12px"><label>联系电话</label><input class="ipt"></div>
    <div class="fld" style="margin-top:12px"><label>证件号（支持 OCR）</label><input class="ipt" placeholder="点击右侧图标拍照识别 📷"></div>
    <div class="fld" style="margin-top:12px"><label>租期 / 付款方式</label><select class="ipt"><option>12 个月 · 月付</option><option>12 个月 · 季付</option><option>6 个月 · 月付</option></select></div>
  </div>
  <div style="padding:12px"><button class="mbtn" onclick="UI.toast('合同已生成，待租户小程序端电子签署');MA.back()">生成合同并发起签署</button></div>`;
},
checkout(){
  body().innerHTML = navBar('退房办理') + `
  <div class="mcard">
    <div class="fld"><label>选择退租房间</label><select class="ipt">${DB.rooms.filter(r=>r.cat==='公寓'&&r.tenant).slice(0,5).map(r=>`<option>${r.bname} ${r.no}（${r.tname}）</option>`).join('')}</select></div>
    <div class="fld" style="margin-top:12px"><label>退房日期</label><input class="ipt" type="date" value="2026-07-29"></div>
  </div>
  <div class="mcard"><h4>物品交接清单</h4>
    ${['钥匙 ×2','门禁卡 ×1','空调遥控器','热水器完好','家具家电完好','卫生验收'].map(x=>`<div class="mrow" style="cursor:default;padding:9px 0"><div class="tx"><div class="tt" style="font-size:13px">☑ ${x}</div></div></div>`).join('')}</div>
  <div class="mcard"><h4>费用结算</h4>
    ${[['未缴账单','- ¥1,350.00','red'],['水电结算（抄表）','- ¥286.40','red'],['押金退还','+ ¥2,000.00','green']].map(([k,v,c])=>`<div class="mrow" style="cursor:default;padding:9px 0"><div class="tx"><div class="tt" style="font-size:13px">${k}</div></div><b style="color:var(--${c})">${v}</b></div>`).join('')}
    <div class="mrow" style="cursor:default"><div class="tx"><b>应退押金</b></div><b style="color:var(--green);font-size:16px">¥363.60</b></div></div>
  <div style="padding:12px"><button class="mbtn" onclick="UI.toast('退房完成：押金退款已提审，房态已更新，门禁已回收');MA.back()">确认结算退房</button></div>`;
},

/* ================= 合同管理 ================= */
contractHub(){
  body().innerHTML = navBar('合同管理') + `
  <div class="mcard"><div class="qa">
    <div class="q" style="background:linear-gradient(135deg,#3f7bff,#2456d6)" onclick="MA.push('tenants')"><b>👥 租户管理</b>${DB.tenants.length} 户在租</div>
    <div class="q" style="background:linear-gradient(135deg,#7c5ce0,#5b3cc4)" onclick="MA.push('contracts')"><b>📄 合同查看</b>预览·下载·签章</div>
    <div class="q" style="background:linear-gradient(135deg,#e89b1c,#c97a06)" onclick="MA.push('expiring')"><b>⏰ 到期提醒</b>${S.contractsExpiring} 份 30 天内</div>
    <div class="q" style="background:linear-gradient(135deg,#2f9e57,#187a3c)" onclick="MA.push('expiring')"><b>🔁 续/退租</b>线上发起办理</div>
  </div></div>`;
},
tenants(){
  body().innerHTML = navBar('租户管理') + `
  <div style="padding:10px 12px 0"><input class="ipt" style="width:100%" placeholder="搜索姓名 / 电话 / 房源"></div>
  ${DB.tenants.slice(0,12).map(t=>{const c=DB.contracts.find(x=>x.tenant===t.id);return `<div class="mcard" style="cursor:pointer;padding:12px 14px;margin-top:10px" onclick="MA.push('tenant','${t.id}')">
    <div style="display:flex;justify-content:space-between"><b style="font-size:13.5px">${t.name}</b>${badge(t.type, t.type==='企业'?'purple':'blue')}</div>
    <div style="font-size:12px;color:var(--ink3);margin-top:5px">${t.phone} · ${c?c.roomName:'—'}</div></div>`;}).join('')}`;
},
tenant(id){
  const t = DB.tenants.find(x=>x.id===id);
  const c = DB.contracts.find(x=>x.tenant===id);
  body().innerHTML = navBar('租户详情') + `
  <div class="mcard" style="text-align:center;padding:20px"><div style="font-size:38px">${t.type==='企业'?'🏢':'👤'}</div>
    <h4 style="margin:8px 0 4px">${t.name}</h4><div style="font-size:12px;color:var(--ink3)">${t.phone} · 信用 ${t.credit} 级</div></div>
  <div class="mcard"><h4>基础信息</h4>${[['证件号',t.idno],['当前租赁',c?c.roomName:'—'],['合同',c?c.id:'—'],['欠费','¥0.00']].map(([k,v])=>`<div class="mrow" style="padding:9px 0;cursor:default"><div class="tx"><div class="ts">${k}</div></div><b style="font-size:12.5px">${v}</b></div>`).join('')}</div>
  <div class="mcard"><h4>关联记录</h4>
    <div class="mrow" onclick="MA.push('contracts')"><div class="tx"><div class="tt" style="font-size:13px">📄 合同记录</div></div><span class="ar">›</span></div>
    <div class="mrow" onclick="MA.push('rent_bills')"><div class="tx"><div class="tt" style="font-size:13px">💳 缴费记录</div></div><span class="ar">›</span></div>
    <div class="mrow" onclick="MA.push('orders')"><div class="tx"><div class="tt" style="font-size:13px">🔧 报修/投诉</div></div><span class="ar">›</span></div></div>`;
},
contracts(){
  body().innerHTML = navBar('合同查看') + `
  <div style="padding:10px 12px 0"><input class="ipt" style="width:100%" placeholder="合同号 / 租户"></div>
  <div class="seg" style="padding:10px 12px 0">${['全部','宿舍','厂房','车位'].map((t,i)=>`<span class="chip ${i===0?'on':''}" style="margin:0" onclick="this.parentNode.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));this.classList.add('on')">${t}</span>`).join('')}</div>
  ${DB.contracts.slice(0,10).map(c=>`<div class="mcard" style="cursor:pointer;padding:12px 14px;margin-top:10px" onclick="UI.toast('合同预览（电子签章版）')">
    <div style="display:flex;justify-content:space-between"><b style="font-size:13px">${c.id}</b>${stBadge(c.status)}</div>
    <div style="font-size:12px;color:var(--ink3);margin-top:5px">${c.tname} · ${c.roomName}<br>${c.start} ~ ${c.end} · ¥${money(c.rent)}${c.unit}</div></div>`).join('')}`;
},
expiring(){
  const exp = DB.contracts.filter(c=>c.status==='即将到期');
  body().innerHTML = navBar('合同到期提醒') + `
  <div class="seg" style="padding:12px 12px 0">${['30 天内','60 天内','90 天内'].map((t,i)=>`<span class="chip ${i===0?'on':''}" style="margin:0" onclick="this.parentNode.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));this.classList.add('on')">${t}</span>`).join('')}</div>
  ${exp.map(c=>`<div class="mcard" style="padding:12px 14px;margin-top:10px">
    <div style="display:flex;justify-content:space-between"><b style="font-size:13.5px">${c.tname}</b>${badge('30 天内','orange')}</div>
    <div style="font-size:12px;color:var(--ink3);margin:5px 0">${c.roomName} · 到期 ${c.end}</div>
    <div style="display:flex;gap:8px;margin-top:6px">
      <button class="btn sm pri" onclick="UI.toast('续租提醒已发送')">一键续租提醒</button>
      <button class="btn sm" onclick="MA.push('checkout')">办理退租</button></div></div>`).join('')}`;
},

/* ================= 水电管理 ================= */
waterHub(){
  body().innerHTML = navBar('水电管理') + `
  <div class="wstats" style="margin-top:12px">
    <div class="ws"><div class="l">表计总数</div><div class="v">${S.meterTotal}</div></div>
    <div class="ws"><div class="l">在线率</div><div class="v" style="color:var(--green)">${Math.round(S.metersOnline/S.meterTotal*100)}%</div></div>
    <div class="ws" onclick="MA.push('waterAlarms')"><div class="l">异常</div><div class="v" style="color:var(--red)">3</div></div>
  </div>
  <div class="mcard">
    <div class="mrow" onclick="MA.push('readings')"><div class="ic" style="background:var(--blue-bg)">📟</div><div class="tx"><div class="tt" style="font-size:13.5px">抄表记录</div><div class="ts">历史读数·异常标记</div></div><span class="ar">›</span></div>
    <div class="mrow" onclick="MA.push('share')"><div class="ic" style="background:var(--purple-bg)">⚖️</div><div class="tx"><div class="tt" style="font-size:13.5px">公摊明细</div><div class="ts">公共水电分摊</div></div><span class="ar">›</span></div>
    <div class="mrow" onclick="MA.push('waterAlarms')"><div class="ic" style="background:var(--red-bg)">⚠️</div><div class="tx"><div class="tt" style="font-size:13.5px">异常提醒</div><div class="ts">用量超标·快速定位租户</div></div><span class="ar">›</span></div>
    <div class="mrow" onclick="UI.toast('远程抄表指令已下发')"><div class="ic" style="background:var(--green-bg)">🔄</div><div class="tx"><div class="tt" style="font-size:13.5px">立即远程抄表</div><div class="ts">callTermTask 批量下发</div></div><span class="ar">›</span></div>
  </div>`;
},
readings(){
  body().innerHTML = navBar('抄表记录') + DB.readings.slice(0,12).map(r=>`
  <div class="mcard" style="padding:12px 14px;margin-top:10px">
    <div style="display:flex;justify-content:space-between"><b style="font-size:13px">${r.mname}</b>${r.abnormal?badge('异常','red'):badge('正常','green')}</div>
    <div style="font-size:12px;color:var(--ink3);margin-top:5px">读数 ${r.value} · ${r.date} · ${r.by}</div></div>`).join('');
},
share(){
  body().innerHTML = navBar('公摊明细') + DB.meters.filter(m=>m.nature==='公摊').slice(0,5).map(m=>`
  <div class="mcard" style="cursor:pointer;padding:12px 14px;margin-top:10px" onclick="UI.toast('查看分摊到各租户的明细')">
    <div style="display:flex;justify-content:space-between"><b style="font-size:13px">${m.name}</b>${badge('按面积分摊','purple')}</div>
    <div style="font-size:12px;color:var(--ink3);margin-top:5px">本月公共用量 ${(m.reading%300+80).toFixed(1)} · 应摊 ¥${money((m.reading%300+80)*m.price)}</div></div>`).join('');
},
waterAlarms(){
  body().innerHTML = navBar('异常提醒') + `
  ${[['1 号宿舍楼 405','王磊','用电异常 +182%','red'],['创新大厦 803','云帆软件','电表掉线 24h+','orange'],['2 号宿舍楼 210','李芳','连续 3 日零用水','orange']].map(a=>`
  <div class="mcard" style="padding:12px 14px;margin-top:10px">
    <div style="display:flex;justify-content:space-between"><b style="font-size:13px">${a[0]} · ${a[1]}</b>${badge(a[3]==='red'?'高':'中', a[3])}</div>
    <div style="font-size:12px;color:var(--ink3);margin:5px 0">${a[2]}</div>
    <div style="display:flex;gap:8px;margin-top:6px"><button class="btn sm" onclick="UI.toast('已通知租户')">通知租户</button><button class="btn sm ghost" onclick="UI.toast('已办结')">办结</button></div></div>`).join('')}`;
},

/* ================= 物业报修 ================= */
orders(){
  body().innerHTML = navBar('物业报修') + `
  <div class="mtabs">${['待派','待修','已完成','评价'].map((t,i)=>`<div class="mt ${i===0?'on':''}" onclick="this.parentNode.querySelectorAll('.mt').forEach(x=>x.classList.remove('on'));this.classList.add('on')">${t}</div>`).join('')}</div>
  <div style="padding:10px 12px 0"><input class="ipt" style="width:100%" placeholder="搜索工单 / 位置"></div>
  ${DB.orders.slice(0,8).map(o=>`<div class="mcard" style="cursor:pointer;padding:12px 14px;margin-top:10px" onclick="MA.push('order','${o.id}')">
    <div style="display:flex;justify-content:space-between"><b style="font-size:13px">${o.id.slice(-4)} · ${o.type}</b>${stBadge(o.status)}</div>
    <div style="font-size:12px;color:var(--ink3);margin-top:5px">${o.room} · ${o.desc.slice(0,16)}…<br>${o.create} · ${o.tenant}</div></div>`).join('')}
  <div class="mcard" style="cursor:pointer" onclick="MA.push('complaints')"><div class="mrow" style="padding:4px 0"><div class="tx"><div class="tt">📮 投诉管理（${DB.complaints.filter(c=>c.status==='待处理').length} 待处理）</div></div><span class="ar">›</span></div></div>`;
},
order(id){
  const o = DB.orders.find(x=>x.id===id);
  body().innerHTML = navBar('工单详情') + `
  <div class="mcard">
    <div style="display:flex;justify-content:space-between;margin-bottom:8px"><b>${o.type}</b>${stBadge(o.status)}</div>
    <div style="font-size:13px;color:var(--ink2);line-height:1.9">${o.desc}<br>📍 ${o.room} · ${o.tenant}<br>🕐 ${o.create} · 📷 ${o.imgs} 张照片</div></div>
  <div class="mcard"><h4>处理记录</h4>
    ${timeline([{t:'提交报修',d:o.create,act:true},{t:'派单',d:o.worker?'至 '+o.worker:'待派单',act:!!o.worker},{t:'完工确认',d:['已完成','已评价'].includes(o.status)?'拍照验收，租户确认':'待完工',act:['已完成','已评价'].includes(o.status)}])}</div>
  ${o.status==='待派单'? `<div class="mcard"><h4>现场派单</h4>
    <div class="fld"><label>指定维修人员</label><select class="ipt"><option>张维修（水电）</option><option>李电工（电气）</option><option>周管道（管道）</option></select></div></div>
    <div style="padding:12px"><button class="mbtn" onclick="UI.toast('派单成功，已通知维修师傅');MA.back()">确认派单</button></div>`
  : o.status==='处理中'? `<div style="padding:12px"><button class="mbtn" onclick="UI.toast('完工确认：请上传维修结果照片');MA.back()">📷 完工确认</button></div>`:''}`;
},
complaints(){
  body().innerHTML = navBar('投诉管理') + DB.complaints.map(c=>`
  <div class="mcard" style="cursor:pointer;padding:12px 14px;margin-top:10px" onclick="UI.toast('打开投诉处理')">
    <div style="display:flex;justify-content:space-between"><b style="font-size:13px">${c.type} · ${c.tenant}</b>${stBadge(c.status)}</div>
    <div style="font-size:12px;color:var(--ink3);margin-top:5px">${c.desc} · ${c.create}</div></div>`).join('');
},

/* ================= 数据报表 ================= */
reportHub(){
  body().innerHTML = navBar('数据报表') + `
  <div class="wstats" style="margin-top:12px">
    <div class="ws"><div class="l">总收入(月)</div><div class="v">96.4万</div></div>
    <div class="ws"><div class="l">出租率</div><div class="v">${S.rentRate}%</div></div>
    <div class="ws"><div class="l">回款率</div><div class="v">91.2%</div></div>
  </div>
  <div class="mcard"><h4>收支统计（近 12 月）</h4>${lineChart([{name:'收入(万)',data:DB.incomeByMonth.map(x=>x.total)}], DB.months, {h:170})}</div>
  <div class="mcard"><h4>房源状态</h4>${donut([{l:'已租',v:S.rented,c:'#2563eb'},{l:'空置',v:S.vacant,c:'#16a34a'},{l:'到期',v:S.expire,c:'#ea8600'},{l:'维修',v:S.repair,c:'#dc2626'}],{center:S.roomTotal,centerLabel:'总房源'})}</div>
  <div class="mcard"><h4>欠费指标</h4>
    <div class="mrow" style="cursor:default"><div class="tx">欠费总额</div><b style="color:var(--red)">¥${money(S.arrearsTotal)}</b></div>
    <div class="mrow" style="cursor:default"><div class="tx">逾期 30 天以上</div><b>${DB.receivables.filter(r=>r.days>30).length} 笔</b></div>
    <div class="mrow" onclick="MA.push('rent_arrears')"><div class="tx">重点欠费租户</div><span class="ar">›</span></div>
    <div style="padding-top:10px"><button class="mbtn" onclick="MA.push('dun')">一键催收</button></div></div>
  <div class="mcard"><h4>合同到期预警</h4>${barChart(['30天内','60天内','90天内'].map((l,i)=>({l, v:[S.contractsExpiring,S.contractsExpiring+4,S.contractsExpiring+7][i], c:'#ea8600'})), {h:140})}</div>`;
},

/* ================= 审批中心 ================= */
approval(){
  const pend = DB.approvals.filter(a=>a.status==='待审批');
  const done = DB.approvals.filter(a=>a.status!=='待审批');
  body().innerHTML = navBar('审批中心') + `
  <div class="mtabs">${['待我审批 '+pend.length,'已办审批'].map((t,i)=>`<div class="mt ${i===0?'on':''}" onclick="this.parentNode.querySelectorAll('.mt').forEach(x=>x.classList.remove('on'));this.classList.add('on')">${t}</div>`).join('')}</div>
  ${pend.map(a=>`<div class="mcard" style="cursor:pointer;padding:13px 14px;margin-top:10px" onclick="MA.push('approvalDetail','${a.id}')">
    <div style="display:flex;justify-content:space-between"><b style="font-size:13.5px">${a.type}</b>${badge('待审批','orange')}</div>
    <div style="font-size:12px;color:var(--ink3);margin-top:5px">${a.desc.slice(0,26)}…<br>${a.from} · ${a.create} · 节点：${a.node}</div></div>`).join('')}
  <div style="padding:6px 14px;font-size:12px;color:var(--ink3)">—— 已办 ——</div>
  ${done.map(a=>`<div class="mcard" style="padding:12px 14px;margin-top:8px;opacity:.75">
    <div style="display:flex;justify-content:space-between"><b style="font-size:13px">${a.type}</b>${stBadge(a.status)}</div>
    <div style="font-size:12px;color:var(--ink3);margin-top:4px">${a.from} · ${a.create}</div></div>`).join('')}`;
},
approvalDetail(id){
  const a = DB.approvals.find(x=>x.id===id);
  body().innerHTML = navBar('审批详情') + `
  <div class="mcard">${[['审批类型',a.type],['申请人',a.from],['提交时间',a.create],['当前节点',a.node]].map(([k,v])=>`<div class="mrow" style="padding:9px 0;cursor:default"><div class="tx"><div class="ts">${k}</div></div><b style="font-size:13px">${v}</b></div>`).join('')}
  <div style="background:#f8fafc;border-radius:8px;padding:12px;font-size:13px;line-height:1.9;margin-top:8px">${a.desc}</div>
  <div style="font-size:12.5px;color:var(--ink3);margin-top:10px">📎 附件：申请书.pdf · 现场照片.jpg</div></div>
  <div class="mcard"><div class="fld"><label>审批意见</label><textarea class="ipt" rows="2" placeholder="驳回时必填"></textarea></div></div>
  <div style="padding:12px;display:flex;gap:10px">
    <button class="mbtn gray" style="flex:1" onclick="UI.toast('已驳回');MA.back()">驳回</button>
    <button class="mbtn" style="flex:1" onclick="UI.toast('已通过，流转下一节点');MA.back()">通过</button></div>`;
},

/* ================= 待办 / 预警 / 片区切换 ================= */
todo(){
  body().innerHTML = navBar('待办事项') + `
  <div class="mcard"><h4>待审批（${DB.approvals.filter(a=>a.status==='待审批').length}）</h4>
    ${DB.approvals.filter(a=>a.status==='待审批').map(a=>`<div class="mrow" onclick="MA.push('approvalDetail','${a.id}')"><div class="tx"><div class="tt" style="font-size:13px">${a.type}</div><div class="ts">${a.from}</div></div><span class="ar">›</span></div>`).join('')}</div>
  <div class="mcard"><h4>待派单（${DB.orders.filter(o=>o.status==='待派单').length}）</h4>
    ${DB.orders.filter(o=>o.status==='待派单').map(o=>`<div class="mrow" onclick="MA.push('order','${o.id}')"><div class="tx"><div class="tt" style="font-size:13px">${o.type} · ${o.room}</div></div><span class="ar">›</span></div>`).join('')}</div>
  <div class="mcard"><h4>待催缴（${new Set(DB.receivables.filter(r=>r.status==='逾期').map(r=>r.tenant)).size} 户）</h4>
    <div class="mrow" onclick="MA.push('rent_arrears')"><div class="tx"><div class="tt" style="font-size:13px">查看欠费台账</div></div><span class="ar">›</span></div></div>
  <div class="mcard"><h4>待抄表</h4><div style="font-size:12.5px;color:var(--ink3)">本月抄表已完成 ✅</div></div>`;
},
alarms(){
  body().innerHTML = navBar('预警消息') + DB.messages.map(m=>`
  <div class="mcard" style="padding:12px 14px;margin-top:10px">
    <div style="display:flex;justify-content:space-between"><b style="font-size:13px">${m.title}</b>${badge(m.cat, m.cat==='催缴'?'red':m.cat==='预警'?'orange':'blue')}</div>
    <div style="font-size:12px;color:var(--ink3);margin-top:5px">${m.body}<br>2026-${m.time}</div></div>`).join('');
},
areaSwitch(){
  body().innerHTML = navBar('切换片区 / 项目') + `
  <div class="mcard" style="background:var(--blue-bg)"><div class="mrow" style="cursor:default"><div class="tx"><div class="tt">全部片区</div><div class="ts">集团汇总视图</div></div>${badge('当前','blue')}</div></div>
  ${DB.areas.map(a=>`<div class="mcard" style="cursor:pointer" onclick="UI.toast('已切换至 ${a.name}，数据范围已更新');MA.back()">
    <div class="mrow" style="padding:4px 0"><div class="tx"><div class="tt">${a.name}</div><div class="ts">${a.types.join(' · ')} · 负责人 ${a.mgr}</div></div><span class="ar">›</span></div></div>`).join('')}
  <div style="padding:0 14px;font-size:11.5px;color:var(--ink3)">切换后，工作台、报表、账单等数据均按所选片区过滤（权限：多项目）。</div>`;
},

/* ================= 我的 ================= */
me(){
  body().innerHTML = `
  <div style="background:linear-gradient(135deg,#2456d6,#3f7bff);padding:26px 16px 24px;color:#fff;display:flex;gap:14px;align-items:center">
    <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:24px">陈</div>
    <div><div style="font-size:17px;font-weight:700">陈志远</div>
    <div style="font-size:12px;opacity:.85;margin-top:3px">片区经理 · 城东产业园 · 工号 YLD-0086</div></div>
  </div>
  <div class="mcard">
    <div class="mrow" onclick="MA.push('todo')"><div class="ic" style="background:var(--orange-bg)">📋</div><div class="tx"><div class="tt">我的待办</div><div class="ts">待催缴 · 待抄表 · 待审批 · 待报修</div></div><span class="ar">›</span></div>
    <div class="mrow" onclick="MA.push('areaSwitch')"><div class="ic" style="background:var(--blue-bg)">🗺️</div><div class="tx"><div class="tt">权限切换（多项目）</div><div class="ts">当前：全部片区</div></div><span class="ar">›</span></div>
    <div class="mrow" onclick="MA.push('profile')"><div class="ic" style="background:var(--green-bg)">👤</div><div class="tx"><div class="tt">账号管理</div><div class="ts">头像、姓名、岗位、权限</div></div><span class="ar">›</span></div>
    <div class="mrow" onclick="MA.push('security')"><div class="ic" style="background:#f1f3f9">🔐</div><div class="tx"><div class="tt">设置</div><div class="ts">修改密码、绑定手机号</div></div><span class="ar">›</span></div>
  </div>
  <div style="padding:12px"><button class="mbtn gray" onclick="UI.toast('已退出登录（演示）')">退出登录</button></div>`;
},
profile(){
  body().innerHTML = navBar('账号管理') + `<div class="mcard">
  ${[['头像','陈'],['姓名','陈志远'],['岗位','片区经理'],['权限','本片区全业务 + 审批'],['所属片区','城东产业园（可切换）'],['工号','YLD-0086']].map(([k,v])=>`<div class="mrow" style="cursor:default"><div class="tx"><div class="ts">${k}</div></div><b style="font-size:13px">${v}</b></div>`).join('')}</div>`;
},
security(){
  body().innerHTML = navBar('设置') + `<div class="mcard">
    <div class="mrow" onclick="UI.toast('打开重置密码页')"><div class="tx"><div class="tt">重置登录密码</div></div><span class="ar">›</span></div>
    <div class="mrow" onclick="UI.toast('打开修改手机号页')"><div class="tx"><div class="tt">修改绑定手机号</div><div class="ts">138****0001</div></div><span class="ar">›</span></div>
    <div class="mrow" onclick="UI.toast('消息通知设置')"><div class="tx"><div class="tt">消息通知</div></div><span class="ar">›</span></div></div>`;
},
};

window.MA = {
  go(tab){ state.tab=tab; state.stack=[]; render(); },
  push(p, arg){ state.stack.push({p, arg}); render(); },
  back(){ state.stack.pop(); render(); },
};
render();
})();
