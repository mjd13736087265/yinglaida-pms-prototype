/* ===== 小程序用户端 ===== */
(function(){
const {badge, money, timeline} = UI;
const ME = DB.tenants[2]; // 演示租户
const myContracts = DB.contracts.filter(c=>c.tenant===ME.id).length ? DB.contracts.filter(c=>c.tenant===ME.id) : DB.contracts.slice(0,2);
const myBills = DB.bills.filter(b=>b.tname===myContracts[0].tname);
const state = {tab:'home', stack:[]};

const body = () => document.getElementById('mp-body');

function tabbar(){
  const tabs = [['home','🏠','首页'],['device','⚡','设备'],['msg','🔔','消息'],['me','👤','我的']];
  document.getElementById('mp-tabbar').innerHTML = tabs.map(([k,i,t])=>
    `<div class="pt ${state.tab===k&&!state.stack.length?'on':''}" onclick="MP.go('${k}')"><span class="pi">${i}</span>${t}${k==='msg'?'<span style="position:absolute;margin:-24px 0 0 22px;background:var(--red);color:#fff;font-size:9px;border-radius:8px;padding:0 4px">3</span>':''}</div>`).join('');
}
function render(){
  tabbar();
  const top = state.stack[state.stack.length-1];
  if(top){ PAGES[top.p](top.arg); }
  else PAGES[state.tab]();
  body().scrollTop = 0;
}
function navBar(title, right){
  return `<div class="pnav"><span class="bk" onclick="MP.back()">‹</span><span class="ti">${title}</span>${right||''}</div>`;
}

const PAGES = {
/* ---------- 首页 ---------- */
home(){
  const pending = myBills.filter(b=>b.status!=='已缴');
  body().innerHTML = `
  <div class="mbanner">
    <div style="font-size:12px;opacity:.85">下午好，${myContracts[0].tname}</div>
    <div style="font-size:20px;font-weight:700;margin:6px 0 2px">${myContracts[0].roomName}</div>
    <div style="font-size:12px;opacity:.85">合同 ${myContracts[0].id} · 租期至 ${myContracts[0].end}</div>
  </div>
  <div class="mcard">
    <div class="mgrid">
      ${[['📄','我的合同','contracts'],['💳','待缴账单','bills'],['🔧','在线报修','repair'],['🏘️','更多租赁','more'],
         ['🔑','我的租赁','rentals'],['⚡','水电充值','recharge'],['🅿️','车位服务','parking'],['📞','联系管家','keeper']].map(([i,t,p])=>
        `<div class="g" onclick="MP.push('${p}')"><div class="gi" style="background:${{contracts:'#e8effe',bills:'#fdf1e0',repair:'#e8f7ee',more:'#f1eafe',rentals:'#e3f6fb',recharge:'#fdeaea',parking:'#eef0f5',keeper:'#e8f7ee'}[p]}">${i}</div><div class="gt">${t}</div></div>`).join('')}
    </div>
  </div>
  ${pending.length? `<div class="mcard" style="border:1px solid #f4d9ae;background:#fffaf2">
    <h4>⏰ 待缴提醒 <span style="float:right;font-size:12px;color:var(--orange);cursor:pointer" onclick="MP.push('bills')">全部 ›</span></h4>
    ${pending.slice(0,2).map(b=>`<div class="mrow" onclick="MP.push('bill','${b.id}')">
      <div class="ic" style="background:var(--orange-bg)">${b.type==='电费'?'⚡':b.type==='水费'?'💧':b.type==='租金'?'🏠':'🅿️'}</div>
      <div class="tx"><div class="tt">${b.month} ${b.type}</div><div class="ts">应缴 ${b.due} 前 · ${b.status==='逾期'?'已逾期':'待缴'}</div></div>
      <b style="color:var(--red)">¥${money(b.amount)}</b></div>`).join('')}
    <button class="mbtn" style="margin-top:10px" onclick="MP.push('pay')">一键合并缴费 ¥${money(pending.reduce((a,b)=>a+b.amount,0))}</button>
  </div>`:''}
  <div class="mcard">
    <h4>📢 园区公告</h4>
    ${[['停水通知','7 月 30 日 9:00-12:00 供水管网检修'],['消防演练','8 月 2 日 15:00 全员消防疏散演练'],['电费调价','8 月起谷时电价下调至 0.42 元/度']].map(n=>
      `<div class="mrow" onclick="MP.push('notice','${n[0]}')"><div class="ic" style="background:var(--blue-bg)">📣</div><div class="tx"><div class="tt">${n[0]}</div><div class="ts">${n[1]}</div></div><span class="ar">›</span></div>`).join('')}
  </div>`;
},

/* ---------- 我的合同 ---------- */
contracts(){
  body().innerHTML = navBar('我的合同') + `<div style="padding-bottom:20px">
  ${myContracts.map(c=>`<div class="mcard" onclick="MP.push('contract','${c.id}')" style="cursor:pointer">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <b>${c.cat}租赁合同</b>${badge(c.status, c.status==='履约中'?'blue':'orange')}</div>
    <div style="font-size:13px;color:var(--ink2);line-height:2">
      合同编号：${c.id}<br>租赁标的：${c.roomName}<br>租期：${c.start} ~ ${c.end}<br>租金：¥${money(c.rent)} ${c.unit} · 押金 ¥${money(c.deposit)}</div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <span class="chip" onclick="event.stopPropagation();UI.toast('合同 PDF 下载中')">下载 PDF</span>
      <span class="chip" onclick="event.stopPropagation();UI.toast('查看电子签章')">电子签章</span>
      ${c.status==='即将到期'?`<span class="chip on" onclick="event.stopPropagation();MP.push('renew','${c.id}')">申请续租</span>`:''}
    </div></div>`).join('')}
  </div>`;
},
contract(id){
  const c = DB.contracts.find(x=>x.id===id);
  body().innerHTML = navBar('合同详情') + `
  <div class="mcard" style="text-align:center;padding:26px 14px">
    <div style="font-size:40px">📄</div><h4 style="margin:8px 0 4px">${c.cat}租赁合同</h4>
    <div style="font-size:12px;color:var(--ink3)">${c.id} · 电子签章已生效</div>
  </div>
  <div class="mcard">
    ${[['出租方','英莱达产业发展有限公司'],['承租方',c.tname],['租赁标的',c.roomName],['租赁期限',c.start+' ~ '+c.end],['租金标准','¥'+money(c.rent)+' '+c.unit],['付款周期',c.cycle],['押金','¥'+money(c.deposit)],['签署日期',c.start]].map(([k,v])=>
      `<div class="mrow" style="cursor:default"><div class="tx"><div class="ts">${k}</div></div><div style="font-size:13.5px;text-align:right;max-width:60%">${v}</div></div>`).join('')}
  </div>
  <div class="mcard"><h4>签署存证</h4>
    ${timeline([{t:'租客实名签署',d:c.start+' · 人脸识别通过',act:true},{t:'企业 CA 签章',d:'英莱达产业发展有限公司',act:true},{t:'区块链存证',d:'哈希 8f3a…d21b 已上链',act:true}])}
  </div>
  <div style="padding:12px"><button class="mbtn" onclick="UI.toast('合同 PDF 下载中')">下载合同 PDF</button></div>`;
},
renew(id){
  body().innerHTML = navBar('申请续租') + `
  <div class="mcard">
    <div class="fld"><label>续租时长</label><select class="ipt"><option>12 个月</option><option>6 个月</option></select></div>
    <div class="fld" style="margin-top:12px"><label>期望租金（可议价）</label><input class="ipt" placeholder="按现租金 ¥1,350/月"></div>
    <div class="fld" style="margin-top:12px"><label>备注</label><textarea class="ipt" rows="3" placeholder="其他需求"></textarea></div>
  </div>
  <div style="padding:12px"><button class="mbtn" onclick="UI.toast('续租申请已提交，管家将在 1 个工作日内联系您');MP.back()">提交申请</button></div>`;
},

/* ---------- 待缴账单 / 缴费 ---------- */
bills(){
  body().innerHTML = navBar('我的账单') + `
  <div class="mtabs">${['待缴','已缴','全部'].map((t,i)=>`<div class="mt ${i===0?'on':''}" onclick="this.parentNode.querySelectorAll('.mt').forEach(x=>x.classList.remove('on'));this.classList.add('on')">${t}</div>`).join('')}</div>
  ${myBills.map(b=>`<div class="mcard" style="cursor:pointer" onclick="MP.push('bill','${b.id}')">
    <div style="display:flex;justify-content:space-between;margin-bottom:6px">
      <b>${b.month} ${b.type}</b>${badge(b.status, UI.STATUS_COLOR[b.status])}</div>
    <div style="font-size:12px;color:var(--ink3)">账单号 ${b.id} · 应缴 ${b.due} 前</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
      <b style="font-size:18px;color:${b.status==='已缴'?'var(--ink)':'var(--red)'}">¥${money(b.amount)}</b>
      ${b.status!=='已缴'?`<button class="btn sm pri" onclick="event.stopPropagation();MP.push('pay','${b.id}')">立即缴费</button>`:`<span style="font-size:12px;color:var(--ink3)">${b.channel} · ${b.payTime}</span>`}
    </div></div>`).join('')}`;
},
bill(id){
  const b = DB.bills.find(x=>x.id===id);
  const isE = b.type==='电费', isW = b.type==='水费';
  body().innerHTML = navBar('账单详情') + `
  <div class="mcard" style="text-align:center;padding:22px">
    <div style="font-size:12px;color:var(--ink3)">${b.month} ${b.type}</div>
    <div style="font-size:30px;font-weight:800;margin:8px 0;color:${b.status==='已缴'?'var(--ink)':'var(--red)'}">¥${money(b.amount)}</div>
    ${badge(b.status, UI.STATUS_COLOR[b.status])}
  </div>
  <div class="mcard"><h4>费用明细</h4>
    ${(isE||isW)? `
      <div class="mrow" style="cursor:default"><div class="tx">本期用量（独用表）</div><b>${(b.amount/ (isE?0.85:3.2)).toFixed(1)} ${isE?'kWh':'m³'}</b></div>
      <div class="mrow" style="cursor:default"><div class="tx">单价</div><b>${isE?'0.85 元/kWh（峰平谷加权）':'3.20 元/m³'}</b></div>
      <div class="mrow" onclick="MP.push('shareDetail','${b.id}')"><div class="tx">公摊分摊 <span style="font-size:11px;color:var(--primary)">计算过程公示 ›</span></div><b>¥${money(b.amount*0.18)}</b></div>`
    : `<div class="mrow" style="cursor:default"><div class="tx">${b.type}（${b.month}）</div><b>¥${money(b.amount)}</b></div>`}
    <div class="mrow" style="cursor:default"><div class="tx">关联合同</div><span style="font-size:13px">${b.contract}</span></div>
  </div>
  ${b.status==='已缴'? `<div class="mcard"><h4>订单凭证</h4>
    ${timeline([{t:'支付成功',d:b.payTime+' · '+b.channel,act:true},{t:'电子凭证已生成',d:'支持下载打印',act:true}])}
    <button class="mbtn line" style="margin-top:10px" onclick="UI.toast('凭证 PDF 已保存到相册')">下载缴费凭证</button>
    <button class="mbtn" style="margin-top:10px" onclick="MP.push('invoice','${b.id}')">🧾 申请开票</button></div>`
  : `<div style="padding:12px"><button class="mbtn" onclick="MP.push('pay','${b.id}')">立即缴费</button></div>`}`;
},
shareDetail(id){
  const b = DB.bills.find(x=>x.id===id);
  const share = b.amount*0.18;
  body().innerHTML = navBar('公摊分摊计算公示') + `
  <div class="mcard" style="text-align:center;padding:20px">
    <div style="font-size:12px;color:var(--ink3)">${b.month} ${b.type} · 您的公摊金额</div>
    <div style="font-size:28px;font-weight:800;margin:8px 0">¥${money(share)}</div>
    <span class="badge b-blue">计算过程全公示</span>
  </div>
  <div class="mcard"><h4>计算公式</h4>
    <div style="font-size:13px;color:var(--ink2);line-height:2;background:#f7f9fd;border-radius:8px;padding:12px">
    您的公摊 = 公摊总费用 ×（您的独用用量 ÷ 全楼独用总用量）<br>
    = ¥${money(share/0.124)} ×（${(b.amount*0.124).toFixed(1)} ÷ ${(b.amount).toFixed(1)}）<br>
    = <b>¥${money(share)}</b></div>
  </div>
  <div class="mcard"><h4>公摊费用构成（${b.month}）</h4>
    ${[['公区照明与电梯用电','¥1,862.40'],['水泵与二次供水','¥640.00'],['园区景观与路灯','¥318.60']].map(([n,a])=>`
    <div class="mrow" style="cursor:default"><div class="tx">${n}</div><b>${a}</b></div>`).join('')}
  </div>
  <div class="mcard"><h4>分摊规则</h4>
    ${timeline([
      {t:'规则依据',d:'物业服务合同第 7 条 · 按独用表用量比例分摊',act:true},
      {t:'数据采集',d:'公区总表与全楼独用表均来自智能表计自动抄表',act:true},
      {t:'公示期',d:'账单生成后公示 7 天，异议可在线提交复核',act:true}])}
    <button class="mbtn line" style="margin-top:10px" onclick="UI.toast('异议已提交，客服将在 1 个工作日内联系您')">我对公摊有异议</button>
  </div>`;
},
deposit(){
  const stepsOf = d=>{
    const s = [{t:'押金收取', d:(d.collectTime||'-')+' · '+d.channel, act:true}];
    if(d.status==='在押'){ s.push({t:'押金在押', d:'由监管账户专户存管，退租结算后原路退回', act:true}); }
    if(d.status==='退还审批中'){ s.push({t:'退租结算完成', d:'费用核对无误', act:true},{t:'退款审批中', d:'已推送外部 OA 审批，预计 3 个工作日内到账', act:false}); }
    if(d.status==='已退'){ s.push({t:'退租结算完成', d:'费用核对无误', act:true},{t:'押金已退还', d:d.refundTime+' · 原路退回 '+d.channel, act:true}); }
    if(d.status==='部分扣款'){ s.push({t:'退租结算完成', d:'物品损坏扣款 ¥'+money(d.deduct), act:true},{t:'余额已退还', d:'退还 ¥'+money(d.amount-d.deduct)+' · '+(d.refundTime||'处理中'), act:!!d.refundTime}); }
    return s;
  };
  const stColor = {'在押':'blue','退还审批中':'orange','已退':'green','部分扣款':'red'};
  body().innerHTML = navBar('押金查询') + `
  ${DB.deposits.slice(0,3).map(d=>`
  <div class="mcard">
    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
      <b>${d.room}</b>${badge(d.status, stColor[d.status])}</div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:12px;color:var(--ink3)">合同 ${d.contract}</span>
      <b style="font-size:20px">¥${money(d.amount)}</b></div>
    <div style="margin-top:12px"><h4 style="margin-bottom:8px">押金进度</h4>
    ${timeline(stepsOf(d))}
    </div></div>`).join('')}`;
},
pay(id){
  const list = id? myBills.filter(b=>b.id===id) : myBills.filter(b=>b.status!=='已缴');
  const total = list.reduce((a,b)=>a+b.amount,0);
  body().innerHTML = navBar('确认缴费') + `
  <div class="mcard"><h4>缴费清单（${list.length} 笔）</h4>
    ${list.map(b=>`<div class="mrow" style="cursor:default"><div class="tx"><div class="tt">${b.month} ${b.type}</div><div class="ts">${b.id}</div></div><b>¥${money(b.amount)}</b></div>`).join('')}
    <div class="mrow" style="cursor:default"><div class="tx"><b>合计</b></div><b style="color:var(--red);font-size:18px">¥${money(total)}</b></div>
  </div>
  <div class="mcard"><h4>支付方式</h4>
    ${[['💚','微信支付','推荐'],['💙','支付宝',''],['🏦','银联云闪付','']].map(([i,t,s],idx)=>`
    <div class="mrow" onclick="this.parentNode.querySelectorAll('.mrow').forEach(x=>x.style.background='');this.style.background='#f0f6ff'">
      <div class="ic" style="background:#f1f3f9">${i}</div><div class="tx"><div class="tt">${t} ${s?`<span class="badge b-green">${s}</span>`:''}</div></div>
      <span style="color:${idx===0?'var(--primary)':'#d5dae5'}">●</span></div>`).join('')}
  </div>
  <div style="padding:12px"><button class="mbtn" onclick="MP.payDone(${total})">确认支付 ¥${money(total)}</button></div>`;
},

/* ---------- 在线报修 ---------- */
repair(){
  const myOrders = DB.orders.slice(0,4);
  body().innerHTML = navBar('在线报修') + `
  <div class="mcard">
    <div class="fld"><label>报修位置</label><input class="ipt" value="${myContracts[0].roomName}"></div>
    <div class="fld" style="margin-top:12px"><label>报修类型</label>
      <div>${['水电维修','门窗五金','空调设备','管道疏通','其他'].map((t,i)=>`<span class="chip ${i===0?'on':''}" onclick="this.parentNode.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));this.classList.add('on')">${t}</span>`).join('')}</div></div>
    <div class="fld" style="margin-top:12px"><label>问题描述 <b>*</b></label><textarea class="ipt" rows="3" placeholder="请描述故障现象"></textarea></div>
    <div class="fld" style="margin-top:12px"><label>上传照片</label>
      <div style="display:flex;gap:8px"><div style="width:64px;height:64px;border:1.5px dashed var(--line);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--ink3);font-size:20px;cursor:pointer" onclick="UI.toast('已打开相机/相册')">＋</div></div></div>
  </div>
  <div style="padding:12px"><button class="mbtn" onclick="UI.toast('报修已提交，系统已自动派单');MP.back()">提交报修</button></div>
  <div class="mcard"><h4>我的报修记录</h4>
    ${myOrders.map(o=>`<div class="mrow" onclick="MP.push('repairDetail','${o.id}')">
      <div class="tx"><div class="tt">${o.type} · ${o.room}</div><div class="ts">${o.create} · ${o.desc.slice(0,14)}…</div></div>
      ${badge(o.status, UI.STATUS_COLOR[o.status])}</div>`).join('')}
  </div>`;
},
repairDetail(id){
  const o = DB.orders.find(x=>x.id===id);
  body().innerHTML = navBar('报修进度') + `
  <div class="mcard">
    <div style="display:flex;justify-content:space-between;margin-bottom:8px"><b>${o.type}</b>${badge(o.status, UI.STATUS_COLOR[o.status])}</div>
    <div style="font-size:13px;color:var(--ink2);line-height:1.9">${o.desc}<br>📍 ${o.room} · ${o.create}<br>📷 现场照片 ${o.imgs} 张</div>
  </div>
  <div class="mcard"><h4>处理进度</h4>
    ${timeline([
      {t:'提交报修', d:o.create, act:true},
      {t:'系统派单', d:o.worker? '派单至 '+o.worker+' · 预计 30 分钟内联系您':'派单中', act:!!o.worker},
      {t:'上门维修', d:o.status==='已完成'||o.status==='已评价'?'维修完成，已拍照验收':'待处理', act:['已完成','已评价'].includes(o.status)},
      {t:'完工评价', d:o.score? '已评价 '+'⭐'.repeat(o.score):'完工后可评价', act:!!o.score}])}
  </div>
  ${['已完成'].includes(o.status)? `<div style="padding:12px"><button class="mbtn" onclick="UI.toast('感谢您的评价！')">评价本次服务</button></div>`:
    o.status==='已评价'? '' : `<div style="padding:12px"><button class="mbtn line" onclick="UI.toast('已为您催促维修师傅')">催单</button></div>`}`;
},

/* ---------- 更多租赁 ---------- */
more(){
  const vacant = DB.rooms.filter(r=>r.status==='空置');
  const freeSpots = DB.spots.filter(s=>s.status==='空闲').slice(0,3);
  body().innerHTML = navBar('更多租赁') + `
  <div class="mtabs">${['宿舍','厂房','车位'].map((t,i)=>`<div class="mt ${i===0?'on':''}" onclick="this.parentNode.querySelectorAll('.mt').forEach(x=>x.classList.remove('on'));this.classList.add('on')">${t}</div>`).join('')}</div>
  ${vacant.filter(r=>r.cat==='公寓').slice(0,4).map(r=>`<div class="mcard" style="cursor:pointer" onclick="MP.push('rentDetail','${r.id}')">
    <div style="display:flex;gap:12px">
      <div style="width:86px;height:70px;border-radius:8px;background:linear-gradient(135deg,#e6f0ff,#f2f7ff);display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">🛏️</div>
      <div style="flex:1"><b>${r.bname} ${r.no}</b>
        <div style="font-size:12px;color:var(--ink3);margin:4px 0">${r.size}㎡ · 独卫 · 空调热水器</div>
        <b style="color:var(--red)">¥${money(r.rent)}</b><span style="font-size:11px;color:var(--ink3)"> /月</span></div></div></div>`).join('')}
  ${vacant.filter(r=>r.cat==='厂房').slice(0,2).map(r=>`<div class="mcard" style="cursor:pointer" onclick="MP.push('rentDetail','${r.id}')">
    <div style="display:flex;gap:12px">
      <div style="width:86px;height:70px;border-radius:8px;background:linear-gradient(135deg,#e8f7ee,#f2fbf5);display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">🏭</div>
      <div style="flex:1"><b>${r.bname} ${r.no} 区</b>
        <div style="font-size:12px;color:var(--ink3);margin:4px 0">${r.size}㎡ · 层高8m · 380V动力电</div>
        <b style="color:var(--red)">¥${r.rent}</b><span style="font-size:11px;color:var(--ink3)"> /㎡·月</span></div></div></div>`).join('')}
  ${freeSpots.map(s=>`<div class="mcard" style="cursor:pointer" onclick="MP.push('spotApply','${s.id}')">
    <div class="mrow" style="padding:4px 0"><div class="ic" style="background:var(--purple-bg)">🅿️</div>
    <div class="tx"><div class="tt">${s.lotName} ${s.no}</div><div class="ts">${s.type} · ${s.size}</div></div>
    <b style="color:var(--red)">¥${s.rent}/月</b></div></div>`).join('')}`;
},
rentDetail(id){
  const r = DB.rooms.find(x=>x.id===id);
  body().innerHTML = navBar('房源详情') + `
  <div style="height:170px;background:linear-gradient(135deg,#dbe7ff,#eef3ff);display:flex;align-items:center;justify-content:center;font-size:52px">${r.cat==='厂房'?'🏭':'🛏️'}</div>
  <div class="mcard">
    <div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:16px">${r.bname} ${r.no}</b>
    <b style="color:var(--red);font-size:18px">¥${money(r.rent)}<span style="font-size:11px;color:var(--ink3);font-weight:400"> ${(r.cat==='厂房'||r.cat==='其他')?'/㎡·月':'/月'}</span></b></div>
    <div style="font-size:12.5px;color:var(--ink3);margin-top:6px">${r.size}㎡ · ${r.floor}F · ${r.cat==='厂房'?'层高8m · 承重1t/㎡ · 消防丙类':'独立卫浴 · 空调热水器 · 宽带'}</div>
  </div>
  <div class="mcard"><h4>配套与费用</h4>
    <div style="font-size:13px;line-height:2.1;color:var(--ink2)">💧 水费 3.2 元/吨 · ⚡ 电费 0.85 元/度（智能表计）<br>🔑 押金 ${r.cat==='厂房'?'三个月租金':'押一付一'} · 📅 租期 12 个月起<br>🅿️ 园区车位 220 元/月起</div></div>
  <div style="padding:12px;display:flex;gap:10px">
    <button class="mbtn line" style="flex:1" onclick="UI.toast('管家将电话联系您预约看房')">预约看房</button>
    <button class="mbtn" style="flex:1" onclick="UI.toast('租赁申请已提交，请等待管家联系办理入住')">申请租赁</button></div>`;
},
spotApply(id){
  const s = DB.spots.find(x=>x.id===id);
  body().innerHTML = navBar('申请车位') + `
  <div class="mcard">${[['停车场',s.lotName],['车位',s.no],['类型',s.type],['月租金','¥'+s.rent+'/月']].map(([k,v])=>`<div class="mrow" style="cursor:default"><div class="tx"><div class="ts">${k}</div></div><b>${v}</b></div>`).join('')}</div>
  <div class="mcard"><div class="fld"><label>车牌号</label><input class="ipt" placeholder="如 浙A·12345"></div>
  <div class="fld" style="margin-top:12px"><label>租期</label><select class="ipt"><option>12 个月（月付）</option><option>6 个月</option><option>年付 95 折</option></select></div></div>
  <div style="padding:12px"><button class="mbtn" onclick="UI.toast('车位租赁申请已提交');MP.back()">提交申请</button></div>`;
},

/* ---------- 我的租赁 ---------- */
rentals(){
  body().innerHTML = navBar('我的租赁') + `
  ${myContracts.map(c=>`<div class="mcard" style="cursor:pointer" onclick="MP.push('rentalDetail','${c.id}')">
    <div style="display:flex;justify-content:space-between;margin-bottom:6px"><b>${c.roomName}</b>${badge('在租','blue')}</div>
    <div style="font-size:12.5px;color:var(--ink3);line-height:1.9">合同 ${c.id} · 租金 ¥${money(c.rent)}${c.unit}<br>租期至 ${c.end}</div></div>`).join('')}
  <div class="mcard" style="cursor:pointer" onclick="UI.toast('历史租赁记录')"><div class="mrow" style="padding:4px 0"><div class="tx"><div class="tt" style="color:var(--ink3)">查看历史租赁记录</div></div><span class="ar">›</span></div></div>`;
},
rentalDetail(id){
  const c = DB.contracts.find(x=>x.id===id);
  const meters = DB.meters.filter(m=>m.roomName===c.roomName);
  body().innerHTML = navBar('租赁详情') + `
  <div class="mcard">${[['租赁标的',c.roomName],['合同编号',c.id],['租金','¥'+money(c.rent)+' '+c.unit],['押金','¥'+money(c.deposit)],['租期',c.start+' ~ '+c.end],['付款周期',c.cycle]].map(([k,v])=>`<div class="mrow" style="cursor:default"><div class="tx"><div class="ts">${k}</div></div><b style="font-size:13.5px">${v}</b></div>`).join('')}</div>
  <div class="mcard"><h4>关联设备</h4>
    ${meters.length? meters.map(m=>`<div class="mrow" onclick="MP.push('meterDetail','${m.id}')"><div class="ic" style="background:${m.type==='电表'?'var(--orange-bg)':'var(--cyan-bg)'}">${m.type==='电表'?'⚡':'💧'}</div><div class="tx"><div class="tt">${m.name}</div><div class="ts">余额 ¥${money(m.balance)}</div></div><span class="ar">›</span></div>`).join('') : '<div style="font-size:13px;color:var(--ink3)">暂无绑定设备</div>'}</div>
  <div class="mcard"><h4>快捷服务</h4>
    <div class="mgrid" style="grid-template-columns:repeat(4,1fr)">
      <div class="g" onclick="MP.push('contract','${c.id}')"><div class="gi" style="background:#e8effe">📄</div><div class="gt">合同</div></div>
      <div class="g" onclick="MP.push('bills')"><div class="gi" style="background:#fdf1e0">💳</div><div class="gt">账单</div></div>
      <div class="g" onclick="MP.push('repair')"><div class="gi" style="background:#e8f7ee">🔧</div><div class="gt">报修</div></div>
      <div class="g" onclick="MP.push('renew','${c.id}')"><div class="gi" style="background:#f1eafe">🔁</div><div class="gt">续租</div></div>
    </div></div>`;
},

/* ---------- 水电充值（预付费） ---------- */
recharge(){
  const m = DB.meters.find(x=>x.cons===myContracts[0].tname) || DB.meters[0];
  body().innerHTML = navBar('水电充值') + `
  <div class="mcard" style="text-align:center;padding:22px">
    <div style="font-size:12px;color:var(--ink3)">${m.name} · ${m.no}</div>
    <div style="font-size:30px;font-weight:800;margin:8px 0;color:${m.balance<m.threshold?'var(--red)':'var(--ink)'}">¥${money(m.balance)}</div>
    <div style="font-size:12px;color:${m.balance<m.threshold?'var(--red)':'var(--ink3)'}">${m.balance<m.threshold?'⚠️ 余额不足，预计可用 2 天，请立即充值':'预计可用 18 天'} · 当前${m.valve}</div>
  </div>
  <div class="mcard"><h4>选择充值金额</h4>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      ${[50,100,200,300,500,1000].map((a,i)=>`<div style="border:1.5px solid ${i===1?'var(--primary)':'var(--line)'};border-radius:10px;text-align:center;padding:14px 0;cursor:pointer;${i===1?'background:var(--blue-bg);color:var(--primary);font-weight:700':''}" onclick="this.parentNode.querySelectorAll('div').forEach(x=>{x.style.borderColor='var(--line)';x.style.background='';x.style.color='';x.style.fontWeight='400'});this.style.borderColor='var(--primary)';this.style.background='var(--blue-bg)';this.style.color='var(--primary)';this.style.fontWeight='700'">¥${a}</div>`).join('')}
    </div></div>
  <div style="padding:12px"><button class="mbtn" onclick="UI.toast('充值成功！表计实时到账（consumerRecharge）');MP.back()">立即充值</button></div>
  <div class="mcard"><h4>充值记录</h4>
    ${[['07-12','¥200.00','微信支付'],['06-20','¥200.00','支付宝'],['06-02','¥300.00','微信支付']].map(r=>`<div class="mrow" style="cursor:default"><div class="tx"><div class="tt">${r[1]}</div><div class="ts">2026-${r[0]} · ${r[2]}</div></div>${badge('已到账','green')}</div>`).join('')}
  </div>`;
},

/* ---------- 设备 Tab ---------- */
device(){
  const meters = DB.meters.filter(m=>m.cons===myContracts[0].tname).length? DB.meters.filter(m=>m.cons===myContracts[0].tname) : DB.meters.slice(0,2);
  body().innerHTML = `
  <div class="pnav"><span class="ti" style="margin:0">我的设备</span></div>
  ${meters.map(m=>`<div class="mcard" style="cursor:pointer" onclick="MP.push('meterDetail','${m.id}')">
    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
      <b>${m.type==='电表'?'⚡':'💧'} ${m.name}</b>${badge(m.online, m.online==='在线'?'green':'red')}</div>
    <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--ink2)">
      <span>累计读数 <b>${m.reading.toFixed(1)}</b></span><span>账户余额 <b style="color:${m.balance<m.threshold?'var(--red)':'inherit'}">¥${money(m.balance)}</b></span></div>
    <div style="margin-top:10px">${UI.barChart(['07-23','07-24','07-25','07-26','07-27','07-28'].map((d,i)=>({l:d.slice(3), v:6+((i*13+m.no.charCodeAt(8))%18), c:m.type==='电表'?'#ea8600':'#0891b2'})), {h:120})}</div>
  </div>`).join('')}
  <div class="mcard" style="font-size:12px;color:var(--ink3);line-height:1.9">📡 数据来自智能表计平台，每 15 分钟自动刷新。如需远程合闸/分闸请联系管家。</div>`;
},
meterDetail(id){
  const m = DB.meters.find(x=>x.id===id);
  body().innerHTML = navBar(m.type+'详情') + `
  <div class="mcard" style="text-align:center;padding:20px">
    <div style="font-size:12px;color:var(--ink3)">账户余额</div>
    <div style="font-size:32px;font-weight:800;margin:6px 0;color:${m.balance<m.threshold?'var(--red)':'var(--ink)'}">¥${money(m.balance)}</div>
    ${badge(m.valve, m.valve==='合闸'?'green':'orange')} ${badge(m.online, m.online==='在线'?'green':'red')}
    <div style="font-size:11.5px;color:var(--ink3);margin-top:8px">表号 ${m.no} · 最近抄表 ${m.lastTime}</div>
  </div>
  <div class="mcard"><h4>近 7 日用${m.type==='电表'?'电':'水'}量</h4>
    ${UI.barChart(['07-22','07-23','07-24','07-25','07-26','07-27','07-28'].map((d,i)=>({l:d.slice(3), v:5+((i*17+id.charCodeAt(2))%20), c:m.type==='电表'?'#ea8600':'#0891b2'})), {h:150})}
  </div>
  <div class="mcard"><h4>月度账单（findConsumeBillByYear）</h4>
    ${[['2026-07', (m.price*38).toFixed(2)],['2026-06',(m.price*52).toFixed(2)],['2026-05',(m.price*41).toFixed(2)]].map(b=>`<div class="mrow" style="cursor:default"><div class="tx"><div class="tt">${b[0]}</div></div><b>¥${b[1]}</b></div>`).join('')}
  </div>
  <div style="padding:12px"><button class="mbtn" onclick="MP.push('recharge')">立即充值</button></div>`;
},

/* ---------- 在线开票 ---------- */
invoice(billId){
  const b = DB.bills.find(x=>x.id===billId) || myBills.find(x=>x.status==='已缴') || myBills[0];
  body().innerHTML = navBar('申请开票') + `
  <div class="mcard">
    <div style="display:flex;justify-content:space-between"><b>开票金额</b><b style="color:var(--red);font-size:18px">¥${money(b.amount)}</b></div>
    <div style="font-size:12px;color:var(--ink3);margin-top:5px">${b.month} ${b.type} · ${b.id}</div>
  </div>
  <div class="mcard">
    <div class="fld"><label>抬头类型</label><div>
      <span class="chip on" onclick="this.parentNode.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));this.classList.add('on')">个人</span>
      <span class="chip" onclick="this.parentNode.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));this.classList.add('on')">企业</span></div></div>
    <div class="fld" style="margin-top:12px"><label>发票抬头 <b>*</b></label><input class="ipt" placeholder="姓名或企业全称"></div>
    <div class="fld" style="margin-top:12px"><label>税号（企业必填）</label><input class="ipt" placeholder="统一社会信用代码"></div>
    <div class="fld" style="margin-top:12px"><label>接收邮箱</label><input class="ipt" placeholder="电子发票发送邮箱"></div>
  </div>
  <div style="padding:12px"><button class="mbtn" onclick="UI.toast('开票申请已提交，开具后将发送至邮箱');MP.push('invoiceList')">提交申请</button></div>`;
},
invoiceList(){
  body().innerHTML = navBar('开票记录') + `
  ${DB.invoices.slice(0,6).map(i=>`<div class="mcard" style="cursor:pointer;padding:13px 14px;margin-top:10px" onclick="${i.status==='已开具'?`UI.toast('发票 PDF 已保存，同步发送至邮箱')`:`UI.toast('开票中，请耐心等待')`}">
    <div style="display:flex;justify-content:space-between"><b style="font-size:13.5px">${i.type}发票 · ¥${money(i.amount)}</b>${badge(i.status, i.status==='已开具'?'green':i.status==='待开具'?'orange':'red')}</div>
    <div style="font-size:12px;color:var(--ink3);margin-top:5px">${i.title}<br>${i.kind} · 申请于 ${i.apply}</div></div>`).join('')}
  <div style="padding:12px"><button class="mbtn line" onclick="MP.push('bills')">去账单选择开票</button></div>`;
},

/* ---------- 车位服务 / 联系管家 / 公告 ---------- */
parking(){
  body().innerHTML = navBar('车位服务') + `
  <div class="mcard"><h4>我的车位</h4>
    <div class="mrow" style="cursor:default"><div class="ic" style="background:var(--purple-bg)">🅿️</div><div class="tx"><div class="tt">城东 1 号停车场 A-036</div><div class="ts">月租 ¥220 · 租期至 2026-12-31 · 浙A·D8835</div></div>${badge('在租','blue')}</div></div>
  <div class="mcard"><h4>临停缴费</h4>
    <div class="fld"><label>输入车牌查询临停费用</label><input class="ipt" placeholder="浙A·_____"></div>
    <button class="mbtn" style="margin-top:12px" onclick="UI.toast('查询到临停费用 ¥7.50，已调起支付')">查询并缴费</button></div>
  <div class="mcard" style="cursor:pointer" onclick="MP.push('more')"><div class="mrow" style="padding:4px 0"><div class="tx"><div class="tt">申请新租车位</div></div><span class="ar">›</span></div></div>`;
},
keeper(){
  body().innerHTML = navBar('联系管家') + `
  <div class="mcard" style="text-align:center;padding:26px"><div style="font-size:44px">👨‍💼</div>
    <h4 style="margin:8px 0 4px">陈志远 · 专属管家</h4>
    <div style="font-size:12px;color:var(--ink3)">城东产业园 · 工作时间 8:30-17:30</div></div>
  <div style="padding:12px;display:flex;flex-direction:column;gap:10px">
    <button class="mbtn" onclick="UI.toast('正在呼叫 138****0001（演示）')">📞 一键呼叫</button>
    <button class="mbtn line" onclick="UI.toast('已打开在线咨询会话（演示）')">💬 在线咨询</button></div>`;
},
notice(t){
  body().innerHTML = navBar('公告详情') + `<div class="mcard"><h4>${t}</h4>
  <div style="font-size:12px;color:var(--ink3);margin-bottom:10px">英莱达物业服务中心 · 2026-07-27</div>
  <div style="font-size:13.5px;line-height:2.1;color:var(--ink2)">尊敬的租户：<br>　　为提升园区服务质量，现将相关事项通知如下，请知悉并相互转告。由此带来的不便敬请谅解，如有疑问请联系您的专属管家。<br><br>　　特此通知。</div></div>`;
},

/* ---------- 消息 Tab ---------- */
msg(){
  body().innerHTML = `
  <div class="pnav"><span class="ti" style="margin:0">消息</span></div>
  ${DB.messages.map(m=>`<div class="mcard" style="cursor:pointer;padding:13px 14px;margin-top:10px" onclick="MP.readMsg('${m.id}')">
    <div style="display:flex;gap:11px">
      <div class="ic" style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:${m.cat==='催缴'?'var(--red-bg)':m.cat==='预警'?'var(--orange-bg)':'var(--blue-bg)'}">${{账单:'💳',催缴:'⏰',预警:'⚠️',工单:'🔧',合同:'📄',缴费:'✅',通知:'📣'}[m.cat]||'📣'}</div>
      <div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between"><b style="font-size:13.5px">${m.title}</b><span style="font-size:11px;color:var(--ink3)">${m.time.slice(0,5)}</span></div>
      <div style="font-size:12px;color:var(--ink3);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.body}</div></div>
      ${m.read?'':'<span style="width:8px;height:8px;border-radius:50%;background:var(--red);flex-shrink:0;margin-top:6px"></span>'}
    </div></div>`).join('')}`;
},

/* ---------- 我的 Tab ---------- */
me(){
  body().innerHTML = `
  <div style="background:linear-gradient(135deg,#2456d6,#3f7bff);padding:26px 16px 24px;color:#fff;display:flex;gap:14px;align-items:center">
    <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:26px">👤</div>
    <div><div style="font-size:17px;font-weight:700">${myContracts[0].tname}</div>
    <div style="font-size:12px;opacity:.85;margin-top:3px">${ME.phone||'138****8888'} · ${myContracts[0].roomName}</div></div>
  </div>
  <div class="mcard">
    ${[['👤','信息管理','姓名、证件、常住人员维护'],['🔐','账号安全','重置登录密码、修改绑定手机号'],['🏠','常住成员','家庭成员/企业员工管理'],['📄','我的合同','查看全部租赁合同'],['💰','押金查询','押金金额与退还进度'],['🧾','开票记录','已缴账单在线开票'],['⭐','我的评价','报修与投诉评价记录'],['❓','帮助中心','常见问题与客服']].map(([i,t,s],idx)=>`
    <div class="mrow" onclick="${t==='押金查询'?`MP.push('deposit')`:`MP.push('setting','${t}')`}"><div class="ic" style="background:#f1f3f9">${i}</div><div class="tx"><div class="tt">${t}</div><div class="ts">${s}</div></div><span class="ar">›</span></div>`).join('')}
  </div>
  <div style="padding:12px"><button class="mbtn gray" onclick="UI.toast('已退出登录（演示）')">退出登录</button></div>
  <div style="text-align:center;font-size:11px;color:var(--ink3);padding:8px 0 20px">英莱达智慧园区 v1.0.0</div>`;
},
setting(t){
  body().innerHTML = navBar(t) + ({
    '信息管理': `<div class="mcard">${[['姓名',myContracts[0].tname],['证件号码',ME.idno||'3301**********1234'],['手机号','138****8888'],['紧急联系人','王** 139****6666']].map(([k,v])=>`<div class="mrow" style="cursor:default"><div class="tx"><div class="ts">${k}</div></div><b style="font-size:13.5px">${v}</b></div>`).join('')}</div>
      <div style="padding:12px"><button class="mbtn" onclick="UI.toast('信息已保存')">保存修改</button></div>`,
    '账号安全': `<div class="mcard">
      <div class="mrow" onclick="MP.push('pwd')"><div class="tx"><div class="tt">重置登录密码</div></div><span class="ar">›</span></div>
      <div class="mrow" onclick="MP.push('phone')"><div class="tx"><div class="tt">修改绑定手机号</div><div class="ts">当前 138****8888</div></div><span class="ar">›</span></div></div>`,
    '常住成员': `<div class="mcard">
      <div class="mrow" style="cursor:default"><div class="tx"><div class="tt">王**（本人）</div><div class="ts">租户本人 · 门禁已开通</div></div>${badge('本人','blue')}</div>
      <div class="mrow" style="cursor:default"><div class="tx"><div class="tt">李**（配偶）</div><div class="ts">门禁已开通</div></div><button class="btn sm ghost" onclick="UI.toast('已移除（演示）')">移除</button></div></div>
      <div style="padding:12px"><button class="mbtn line" onclick="UI.toast('已发送邀请链接')">＋ 添加成员（发邀请）</button></div>`,
    '我的合同': '', '我的评价': `<div class="mcard"><div class="mrow" style="cursor:default"><div class="tx"><div class="tt">报修工单 GD20260709</div><div class="ts">空调维修 · ⭐⭐⭐⭐⭐ 服务及时</div></div></div></div>`,
    '帮助中心': `<div class="mcard">${['如何缴纳水电费？','如何申请续租？','门禁卡丢失怎么办？','发票如何开具？'].map(q=>`<div class="mrow" onclick="UI.toast('查看解答（演示）')"><div class="tx"><div class="tt">${q}</div></div><span class="ar">›</span></div>`).join('')}</div>`
  }[t] || '');
  if(t==='我的合同'){ PAGES.contracts(); }
  if(t==='开票记录'){ PAGES.invoiceList(); }
},
pwd(){
  body().innerHTML = navBar('重置密码') + `<div class="mcard">
    <div class="fld"><label>原密码</label><input class="ipt" type="password" placeholder="输入原密码"></div>
    <div class="fld" style="margin-top:12px"><label>新密码</label><input class="ipt" type="password" placeholder="8-20 位，含字母和数字"></div>
    <div class="fld" style="margin-top:12px"><label>确认新密码</label><input class="ipt" type="password"></div></div>
    <div style="padding:12px"><button class="mbtn" onclick="UI.toast('密码修改成功，请重新登录');MP.back()">确认修改</button></div>`;
},
phone(){
  body().innerHTML = navBar('修改手机号') + `<div class="mcard">
    <div class="fld"><label>新手机号</label><input class="ipt" placeholder="输入新手机号"></div>
    <div class="fld" style="margin-top:12px"><label>短信验证码</label><div style="display:flex;gap:8px"><input class="ipt" style="flex:1"><button class="btn" onclick="UI.toast('验证码已发送')">获取验证码</button></div></div></div>
    <div style="padding:12px"><button class="mbtn" onclick="UI.toast('手机号修改成功');MP.back()">确认修改</button></div>`;
},
};

window.MP = {
  go(tab){ state.tab=tab; state.stack=[]; render(); },
  push(p, arg){ state.stack.push({p, arg}); render(); },
  back(){ state.stack.pop(); render(); },
  payDone(total){ 
    body().innerHTML = `<div style="padding:70px 30px;text-align:center">
      <div style="font-size:56px">✅</div><h3 style="margin:14px 0 6px">支付成功</h3>
      <div style="color:var(--ink3);font-size:13px">实付 ¥${money(total)} · 订单凭证已生成</div>
      <button class="mbtn" style="margin-top:26px" onclick="UI.toast('凭证 PDF 已保存')">下载缴费凭证</button>
      <button class="mbtn line" style="margin-top:10px" onclick="MP.push('invoice')">🧾 申请开票</button>
      <button class="mbtn line" style="margin-top:10px" onclick="MP.back();MP.back()">返回</button></div>`;
  },
  readMsg(id){
    const m = DB.messages.find(x=>x.id===id); m.read = true;
    state.stack.push({p:'_msgd', arg:id});
    body().innerHTML = navBar('消息详情') + `<div class="mcard"><h4>${m.title}</h4>
      <div style="font-size:11.5px;color:var(--ink3);margin-bottom:10px">${m.cat} · 2026-${m.time}</div>
      <div style="font-size:13.5px;line-height:2.1;color:var(--ink2)">${m.body}</div></div>
      ${(m.cat==='账单'||m.cat==='催缴')?'<div style="padding:12px"><button class="mbtn" onclick="MP.back();MP.push(\'bills\')">去缴费</button></div>':''}`;
    tabbar();
  },
};
PAGES._msgd = ()=>{};
render();
})();
