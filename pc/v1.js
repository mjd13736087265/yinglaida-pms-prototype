/* ===== v1 · 工作台 / 片区管理 ===== */
(function(){
const {stat, table, badge, donut, lineChart, barChart, desc, timeline, money, num, STATUS_COLOR, tabs, modal, drawer, toast, confirm, fld, close, esc} = UI;

/* ---------- 工作台 ---------- */
PC.reg('/dashboard','工作台', (el)=>{
  const s = DB.stats;
  const inc = DB.incomeByMonth;
  el.innerHTML = `
  <div class="grid4">
    ${stat('本月应收（万元）', money(s.monthIncome*10000/10000), `实收 <b class="up">${money(96.4)}</b> · 收缴率 <b>91.2%</b>`, "location.hash='#/fin/recv'")}
    ${stat('综合出租率', s.rentRate+'%', `已租 ${s.rented} / 总房源 ${s.roomTotal} · 车位 ${s.spotRate}%`, "location.hash='#/rpt/rent'")}
    ${stat('欠费总额（元）', money(s.arrearsTotal), `逾期账单 <b class="down">${DB.receivables.filter(r=>r.status==='逾期').length}</b> 笔`, "location.hash='#/fin/collect'")}
    ${stat('待办事项', DB.approvals.filter(a=>a.status==='待审批').length + DB.orders.filter(o=>o.status==='待派单').length, `审批 ${DB.approvals.filter(a=>a.status==='待审批').length} · 待派单 ${DB.orders.filter(o=>o.status==='待派单').length} · 待抄表 0`, "PC.todo()")}
  </div>
  <div class="row">
    <div class="card" style="flex:1.6">
      <h3>近 12 个月收入趋势（万元）<span class="more" onclick="location.hash='#/rpt/income'">查看收入报表 →</span></h3>
      ${lineChart([
        {name:'总收入', data:inc.map(x=>x.total)},
        {name:'租金收入', data:inc.map(x=>x.租金), color:'#16a34a'}
      ], inc.map(x=>x.m), {h:230})}
    </div>
    <div class="card">
      <h3>房源状态分布<span class="more" onclick="location.hash='#/estate/公寓/map'">房态图 →</span></h3>
      ${donut([
        {l:'已租', v:s.rented, c:'#2563eb'},{l:'空置', v:s.vacant, c:'#16a34a'},
        {l:'即将到期', v:s.expire, c:'#ea8600'},{l:'维修中', v:s.repair, c:'#dc2626'},
        {l:'已预定', v:s.booked, c:'#7c3aed'}
      ], {center:s.roomTotal, centerLabel:'总房源'})}
      <div style="margin-top:14px">
        <div class="kv"><span>综合出租率</span><b>${s.rentRate}%</b></div>
        <div class="pbar"><i style="width:${s.rentRate}%"></i></div>
      </div>
    </div>
  </div>
  <div class="row">
    <div class="card">
      <h3>⚠️ 欠费预警 TOP5<span class="more" onclick="location.hash='#/fin/collect'">一键催收 →</span></h3>
      ${table([
        {t:'租户', k:'tenant', r:r=>`<span class="lk" onclick="PC.tenant('${r.tenant}')">${r.tenant}</span>`},
        {t:'房源', k:'room'},
        {t:'欠费金额', r:r=>`<b style="color:var(--red)">¥${money(r.balance)}</b>`},
        {t:'逾期天数', r:r=>badge(r.days+' 天', r.days>60?'red':r.days>30?'orange':'cyan')},
        {t:'操作', r:r=>`<button class="btn sm" onclick="PC.dun('${r.id}')">催收</button>`}
      ], DB.receivables.filter(r=>r.status==='逾期').sort((a,b)=>b.balance-a.balance).slice(0,5))}
    </div>
    <div class="card">
      <h3>📄 合同到期预警（90 天内）<span class="more" onclick="location.hash='#/rpt/contract'">合同报表 →</span></h3>
      ${table([
        {t:'合同号', k:'id', r:r=>`<span class="lk" onclick="PC.contract('${r.id}')">${r.id}</span>`},
        {t:'租户', k:'tname'},
        {t:'房源', k:'roomName'},
        {t:'到期日', k:'end'},
        {t:'操作', r:r=>`<button class="btn sm" onclick="UI.toast('已向 ${r.tname} 发送续租提醒')">续租提醒</button>`}
      ], DB.contracts.filter(c=>c.status==='即将到期').slice(0,5))}
    </div>
    <div class="card">
      <h3>🔧 最新报修工单<span class="more" onclick="location.hash='#/svc/orders'">工单管理 →</span></h3>
      ${table([
        {t:'工单号', k:'id', r:r=>`<span class="lk" onclick="PC.order('${r.id}')">${r.id}</span>`},
        {t:'类型', k:'type'},
        {t:'位置', k:'room'},
        {t:'状态', r:r=>badge(r.status, STATUS_COLOR[r.status])}
      ], DB.orders.slice(0,5))}
    </div>
  </div>
  <div class="card">
    <h3>📅 项目交付计划（计划表 0727）<span class="more">当前阶段：原型设计确认</span></h3>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${DB.plans.map(p=>`<div style="border:1px solid var(--line);border-radius:8px;padding:9px 13px;font-size:12.5px;background:#fafbfe"><b>${p[0]}</b><div style="color:var(--ink3);margin-top:3px">${p[1]} ~ ${p[2]}</div></div>`).join('')}
    </div>
  </div>`;
});

PC.todo = function(){
  modal({title:'我的待办事项', size:'lg', body:`
    <h4 style="margin-bottom:10px">待审批（${DB.approvals.filter(a=>a.status==='待审批').length}）</h4>
    ${table([{t:'类型',k:'type'},{t:'申请人',k:'from'},{t:'提交时间',k:'create'},{t:'操作',r:r=>`<button class="btn sm pri" onclick="PC.approval('${r.id}')">去审批</button>`}],
      DB.approvals.filter(a=>a.status==='待审批'))}
    <h4 style="margin:16px 0 10px">待派单（${DB.orders.filter(o=>o.status==='待派单').length}）</h4>
    ${table([{t:'工单号',k:'id'},{t:'类型',k:'type'},{t:'位置',k:'room'},{t:'操作',r:r=>`<button class="btn sm pri" onclick="PC.order('${r.id}')">去派单</button>`}],
      DB.orders.filter(o=>o.status==='待派单'))}
  `});
};
PC.dun = function(id){
  const r = DB.receivables.find(x=>x.id===id);
  modal({title:'发起催收', body:`<div class="frm">
    ${fld('催收对象', `<input class="ipt" value="${r.tenant}（${r.room}）" disabled>`)}
    ${fld('欠费金额', `<input class="ipt" value="¥${money(r.balance)}（逾期 ${r.days} 天）" disabled>`)}
    ${fld('催收方式', `<select class="ipt"><option>微信模板消息推送</option><option>短信提醒</option><option>电话催收（生成跟进任务）</option><option>催缴函件（生成 PDF）</option></select>`, true)}
    ${fld('催收内容', `<textarea class="ipt" rows="3">【英莱达】尊敬的${r.tenant}，您在${r.room}的${r.type} ¥${money(r.balance)} 已逾期 ${r.days} 天，请尽快登录小程序完成缴费，逾期将影响续租及信用。</textarea>`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('催收消息已发送')">立即发送</button>`});
};
PC.tenant = function(name){
  const t = DB.tenants.find(x=>x.name===name) || {};
  const myContracts = DB.contracts.filter(c=>c.tname===name);
  const myBills = DB.bills.filter(b=>b.tname===name).slice(0,8);
  const myOrders = DB.orders.filter(o=>o.tenant===name);
  drawer(`租户详情 · ${name}`, `
    ${desc([['租户类型',t.type||'-'],['联系电话',t.phone||'-'],['证件号码',t.idno||'-'],
      ['信用等级',badge((t.credit||'B')+' 级', (t.credit||'B')==='A'?'green':(t.credit||'B')==='B'?'blue':'orange')],
      ['在租合同', myContracts.length+' 份'],['累计欠费', `<b style="color:var(--red)">¥${money(myBills.filter(b=>b.status==='逾期').reduce((a,b)=>a+b.amount,0))}</b>`]])}
    <h3 style="margin:18px 0 10px;font-size:14px">关联合同</h3>
    ${table([{t:'合同号',k:'id',r:r=>`<span class="lk" onclick="UI.close();PC.contract('${r.id}')">${r.id}</span>`},{t:'房源',k:'roomName'},{t:'租期',r:r=>`${r.start} ~ ${r.end}`},{t:'状态',r:r=>badge(r.status, r.status==='履约中'?'blue':'orange')}], myContracts)}
    <h3 style="margin:18px 0 10px;font-size:14px">最近账单</h3>
    ${table([{t:'账单号',k:'id'},{t:'类型',k:'type'},{t:'账期',k:'month'},{t:'金额',r:r=>'¥'+money(r.amount)},{t:'状态',r:r=>badge(r.status, STATUS_COLOR[r.status])}], myBills)}
    <h3 style="margin:18px 0 10px;font-size:14px">报修 / 投诉</h3>
    ${table([{t:'单号',k:'id'},{t:'类型',k:'type'},{t:'状态',r:r=>badge(r.status, STATUS_COLOR[r.status])}], myOrders)}
  `);
};
PC.contract = function(id){
  const c = DB.contracts.find(x=>x.id===id);
  if(!c) return toast('合同不存在');
  drawer(`租赁合同 · ${c.id}`, `
    <div style="display:flex;gap:8px;margin-bottom:14px">
      ${badge(c.status, c.status==='履约中'?'blue':'orange')} ${badge(c.sign,'purple')} ${badge(c.cycle,'cyan')}
      <span style="margin-left:auto"><button class="btn sm" onclick="UI.toast('合同 PDF 已生成，开始下载')">下载 PDF</button>
      <button class="btn sm" onclick="UI.toast('已发送续租提醒')">续租提醒</button></span>
    </div>
    ${desc([['承租方',c.tname],['租赁标的',c.roomName],['所属片区',DB.areas.find(a=>a.id===c.area)?.name||'-'],
      ['租赁期限',`${c.start} ~ ${c.end}`],['租金标准',`¥${money(c.rent)} ${c.unit}`],['押金',`¥${money(c.deposit)}`],
      ['付款周期',c.cycle],['签署方式',c.sign],['账单生成','每月 1 日自动生成']])}
    <h3 style="margin:18px 0 10px;font-size:14px">合同条款（摘要）</h3>
    <div class="card" style="background:#fafbfe;font-size:13px;line-height:2;color:var(--ink2)">
      一、甲方将 ${c.roomName} 出租给乙方使用，租期自 ${c.start} 至 ${c.end}。<br>
      二、租金 ${money(c.rent)} ${c.unit}，按${c.cycle.replace('付','')}为一个缴费周期，每期首月 10 日前缴纳。<br>
      三、押金 ¥${money(c.deposit)}，退租验收无异议后 7 个工作日内退还。<br>
      四、水电费按智能表计实际用量结算，公共部分按分摊规则计收。<br>
      五、本合同采用电子签章，与纸质合同具有同等法律效力。
    </div>
    <h3 style="margin:18px 0 10px;font-size:14px">签署记录</h3>
    ${timeline([{t:'合同创建', d:'系统根据入住办理自动生成', act:true},{t:'租客电子签名', d:c.start+' 10:2'+(id.charCodeAt(3)%10)+' · 实名认证通过', act:true},{t:'企业签章', d:'英莱达产业发展有限公司 · CA 证书签章', act:true},{t:'合同生效', d:'租金账单自动生成任务已创建', act:true}])}
  `);
};
PC.order = function(id){
  const o = DB.orders.find(x=>x.id===id);
  if(!o) return;
  const steps = [{t:'提交报修', d:o.create+' · '+o.tenant, act:true}];
  if(o.status!=='待派单') steps.push({t:'派单', d:'派单至 '+o.worker, act:true});
  if(['已完成','已评价'].includes(o.status)) steps.push({t:'完工确认', d:'维修完成，拍照上传 2 张', act:true});
  if(o.status==='已评价') steps.push({t:'租户评价', d:'⭐'.repeat(o.score||5)+' 服务及时', act:true});
  drawer(`报修工单 · ${o.id}`, `
    <div style="display:flex;gap:8px;margin-bottom:14px">${badge(o.status, STATUS_COLOR[o.status])}${o.urgent?badge('加急','red'):''}
      <span style="margin-left:auto">
      ${o.status==='待派单'?`<button class="btn sm pri" onclick="PC.assign('${o.id}')">立即派单</button>`:''}
      ${o.status==='处理中'?`<button class="btn sm pri" onclick="UI.toast('已确认完工，工单关闭')">完工确认</button>`:''}
      <button class="btn sm" onclick="UI.toast('已电话联系租户')">联系租户</button></span></div>
    ${desc([['报修类型',o.type],['报修位置',o.room],['报修人',o.tenant],
      ['问题描述',o.desc],['现场照片',`📷 ${o.imgs} 张（点击预览）`],['维修人员',o.worker||'待指派']],2)}
    <h3 style="margin:18px 0 12px;font-size:14px">处理进度</h3>
    ${timeline(steps)}
  `);
};
PC.assign = function(id){
  modal({title:'工单派单', body:`<div class="frm">
    ${fld('维修人员', `<select class="ipt"><option>张维修（水电）</option><option>李电工（电气）</option><option>周管道（管道）</option><option>吴综合（综合）</option></select>`, true)}
    ${fld('期望上门时间', `<input class="ipt" type="datetime-local" value="2026-07-29T14:00">`, true)}
    ${fld('备注', `<textarea class="ipt" rows="2" placeholder="给维修师傅的备注"></textarea>`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('派单成功，已微信通知维修师傅')">确认派单</button>`});
};
PC.approval = function(id){
  const a = DB.approvals.find(x=>x.id===id);
  modal({title:'审批 · '+a.type, size:'lg', body:`
    ${desc([['申请类型',a.type],['申请人',a.from],['提交时间',a.create],['当前节点',a.node]],2)}
    <h4 style="margin:16px 0 8px">申请内容</h4>
    <div class="card" style="background:#fafbfe;font-size:13px;line-height:1.9">${a.desc}</div>
    <h4 style="margin:16px 0 8px">附件</h4>
    <div style="font-size:13px;color:var(--ink2)">📎 申请书.pdf · 📎 现场照片.jpg</div>
    <h4 style="margin:16px 0 8px">审批意见</h4>
    <textarea class="ipt" rows="3" style="width:100%" placeholder="填写审批意见（驳回时必填）"></textarea>
  `, footer:`<button class="btn danger" onclick="UI.close();UI.toast('已驳回')">驳回</button><button class="btn pri" onclick="UI.close();UI.toast('已通过，流程流转至下一节点')">通过</button>`});
};

/* ---------- 片区管理 ---------- */
PC.reg('/area','片区管理', (el)=>{
  el.innerHTML = `
  <div class="toolbar"><span style="font-size:13px;color:var(--ink3)">共 ${DB.areas.length} 个片区 · 片区用于数据分类与统计口径</span><span class="sp"></span>
  <button class="btn pri" onclick="PC.areaEdit()">＋ 新增片区</button></div>
  <div class="grid3">
  ${DB.areas.map(a=>{
    const myRooms = DB.rooms.filter(r=>r.area===a.id);
    const rented = myRooms.filter(r=>r.status==='已租'||r.status==='到期').length;
    const rate = myRooms.length? Math.round(rented/myRooms.length*100):0;
    return `<div class="card" style="cursor:pointer" onclick="PC.areaDetail('${a.id}')">
      <h3>🗺️ ${a.name}<span class="more">详情 →</span></h3>
      <div style="font-size:12.5px;color:var(--ink3);margin-bottom:10px">${a.addr}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${a.types.map(t=>badge(t,'blue')).join('')}</div>
      <div class="kv"><span>房源总数</span><b>${myRooms.length}</b></div>
      <div class="kv"><span>出租率</span><b>${rate}%</b></div>
      <div class="pbar"><i style="width:${rate}%"></i></div>
      <div style="display:flex;justify-content:space-between;margin-top:12px;font-size:12.5px;color:var(--ink2)">
        <span>负责人：${a.mgr}</span><span>${a.phone}</span></div>
    </div>`;
  }).join('')}
  </div>`;
});
PC.areaEdit = function(id){
  const a = id? DB.areas.find(x=>x.id===id) : {};
  modal({title:id?'编辑片区':'新增片区', body:`<div class="frm">
    ${fld('片区名称', `<input class="ipt" value="${a.name||''}" placeholder="如：城东产业园">`, false, true)}
    ${fld('片区负责人', `<input class="ipt" value="${a.mgr||''}">`)}
    ${fld('详细地址', `<input class="ipt" value="${a.addr||''}">`, true)}
    ${fld('联系电话', `<input class="ipt" value="${a.phone||''}">`)}
    ${fld('产业类型', `<input class="ipt" value="${(a.types||[]).join('、')}" placeholder="厂房、写字楼、商业、酒店、公寓、车位、其他">`)}
    ${fld('备注', `<textarea class="ipt" rows="2">${a.note||''}</textarea>`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('保存成功')">保存</button>`});
};
PC.areaDetail = function(id){
  const a = DB.areas.find(x=>x.id===id);
  const myRooms = DB.rooms.filter(r=>r.area===id);
  const myBills = DB.bills.filter(b=> myRooms.some(r=> b.room.includes(r.bname)));
  const byCat = {};
  myRooms.forEach(r=>{ byCat[r.cat] = byCat[r.cat]||{total:0,rented:0}; byCat[r.cat].total++; if(r.status==='已租'||r.status==='到期') byCat[r.cat].rented++; });
  drawer(`片区详情 · ${a.name}`, `
    ${desc([['片区地址',a.addr],['负责人',a.mgr+'（'+a.phone+'）'],['产业类型',a.types.join('、')],['备注',a.note]],2)}
    <div class="grid4" style="margin-top:16px">
      ${stat('房源总数', myRooms.length)}
      ${stat('在租合同', DB.contracts.filter(c=>c.area===id).length)}
      ${stat('本月应收', '¥'+money(myBills.filter(b=>b.month==='2026-07').reduce((x,b)=>x+b.amount,0)))}
      ${stat('欠费笔数', myBills.filter(b=>b.status==='逾期').length, null)}
    </div>
    <h3 style="font-size:14px;margin:6px 0 10px">分业态出租情况</h3>
    ${table([{t:'业态',k:'cat'},{t:'房源数',k:'total'},{t:'已租',k:'rented'},{t:'出租率',r:r=>{const p=Math.round(r.rented/r.total*100);return `<div class="pbar" style="width:120px;display:inline-block;vertical-align:middle"><i style="width:${p}%"></i></div> <b>${p}%</b>`;}},{t:'操作',r:r=>`<button class="btn sm" onclick="UI.close();location.hash='#/estate/${r.cat}/map'">看房态</button>`}],
      Object.entries(byCat).map(([cat,v])=>({cat,...v})))}
    <h3 style="font-size:14px;margin:18px 0 10px">楼栋清单</h3>
    ${table([{t:'楼栋',k:'name'},{t:'业态',k:'cat'},{t:'楼层',k:'floors'},{t:'每层户数',k:'per'},{t:'备注',k:'tag'}], DB.buildings.filter(b=>b.area===id))}
    <div style="margin-top:16px;text-align:right"><button class="btn" onclick="PC.areaEdit('${a.id}')">编辑片区</button></div>
  `, '760px');
};
})();
