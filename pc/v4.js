/* ===== v4 · 应收应付 / 物业服务 / 固定资产 ===== */
(function(){
const {table, badge, modal, drawer, toast, desc, fld, close, money, STATUS_COLOR, barChart, lineChart, donut, timeline, stat} = UI;

/* ================= 应收账款 ================= */
PC.reg('/fin/recv','应收账款', (el)=>{
  const rs = DB.receivables;
  const total = rs.reduce((a,b)=>a+b.amount,0), got = rs.reduce((a,b)=>a+b.received,0);
  el.innerHTML = `
  <div class="grid4">
    ${stat('应收余额', '¥'+money(total-got), `应收总额 ¥${money(total)}`)}
    ${stat('已核销', '¥'+money(got), '支持部分/批量核销')}
    ${stat('逾期金额', '¥'+money(rs.filter(r=>r.status==='逾期').reduce((a,b)=>a+b.balance,0)), null, "location.hash='#/fin/aging'")}
    ${stat('本月回款率', '91.2%', '目标 95%')}
  </div>
  <div class="card">
    <div class="toolbar">
      <input class="ipt" placeholder="租户 / 房源 / 合同号" style="width:180px">
      <select class="ipt"><option>全部费用类型</option><option>租金</option><option>电费</option><option>水费</option><option>车位费</option><option>物业费</option></select>
      <select class="ipt"><option>全部状态</option><option>待缴</option><option>逾期</option><option>部分核销</option></select>
      <button class="btn" onclick="UI.toast('查询成功（演示）')">查询</button>
      <span class="sp"></span>
      <button class="btn" onclick="UI.toast('应收台账已导出')">导出</button>
      <button class="btn pri" onclick="PC.recvAdd()">＋ 登记应收</button>
    </div>
    ${table([
      {t:'应收单号',r:r=>`<span class="lk" onclick="PC.recvDetail('${r.id}')">${r.id}</span>`},
      {t:'类型',r:r=>badge(r.type,'blue')},
      {t:'所属片区',r:r=>badge(DB.areaName((DB.contracts.find(c=>c.id===r.contract)||{}).area),'gray')},
      {t:'租户',k:'tenant'},{t:'房源',k:'room'},
      {t:'应收金额',r:r=>'¥'+money(r.amount)},
      {t:'已核销',r:r=>'¥'+money(r.received)},
      {t:'余额',r:r=>`<b style="color:${r.balance>0?'var(--red)':'var(--green)'}">¥${money(r.balance)}</b>`},
      {t:'账期截止',k:'due'},
      {t:'状态',r:r=>badge(r.received>0&&r.balance>0?'部分核销':r.status, r.received>0&&r.balance>0?'cyan':STATUS_COLOR[r.status])},
      {t:'操作',w:'150px',r:r=>`<button class="btn sm ghost" onclick="location.hash='#/fin/verify'">核销</button><button class="btn sm ghost" onclick="PC.dun('${r.id}')">催收</button>`}
    ], rs.slice(0,14))}
    <div class="pager">共 ${rs.length} 条 <span class="on">1</span><span onclick="UI.toast('翻页（演示）')">2</span></div>
  </div>`;
});
PC.recvAdd = function(){
  modal({title:'登记应收账款', body:`<div class="frm">
    ${fld('费用类型', `<select class="ipt"><option>租金</option><option>物业费</option><option>水电费</option><option>车位费</option><option>其他</option></select>`)}
    ${fld('关联合同', `<select class="ipt">${DB.contracts.slice(0,6).map(c=>`<option>${c.id}（${c.tname}）</option>`).join('')}</select>`)}
    ${fld('应收金额（元）', `<input class="ipt" type="number">`, false, true)}
    ${fld('账期截止日', `<input class="ipt" type="date" value="2026-08-15">`)}
    ${fld('说明', `<textarea class="ipt" rows="2"></textarea>`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('应收款已登记并关联合同')">保存</button>`});
};
PC.recvDetail = function(id){
  const r = DB.receivables.find(x=>x.id===id);
  drawer('应收详情 · '+id, `
    ${desc([['费用类型',r.type],['租户',r.tenant],['房源',r.room],['关联合同',r.contract],['应收金额','¥'+money(r.amount)],['已核销','¥'+money(r.received)],['剩余余额',`¥${money(r.balance)}`],['账期截止',r.due],['逾期天数',r.days+' 天']],3)}
    <h3 style="font-size:14px;margin:16px 0 10px">核销记录</h3>
    ${r.received>0? table([{t:'核销时间',k:'t'},{t:'核销金额',k:'a'},{t:'方式',k:'w'},{t:'经办人',k:'o'}],[{t:'2026-07-18 10:22',a:'¥'+money(r.received),w:'微信支付（扫码核销）',o:'系统'}]) : '<div class="empty">暂无核销记录</div>'}
    <h3 style="font-size:14px;margin:16px 0 10px">催收记录</h3>
    ${table([{t:'时间',k:'time'},{t:'方式',k:'way'},{t:'结果',k:'result'},{t:'经办',k:'by'}], DB.collections.filter(c=>c.recv===id))}
  `);
};

/* ================= 收款核销 ================= */
PC.reg('/fin/verify','收款核销', (el)=>{
  const pend = DB.receivables.filter(r=>r.balance>0);
  el.innerHTML = `
  <div class="card">
    <h3>待核销款项（支持部分核销 / 批量核销）</h3>
    <div class="toolbar">
      <button class="btn pri" onclick="PC.scanVerify()">📷 扫码核销（扫描租户付款码/订单码）</button>
      <button class="btn" onclick="UI.toast('已选 0 笔，可批量核销')">批量核销</button>
      <span class="sp"></span><span style="font-size:12.5px;color:var(--ink3)">线上支付订单自动核销，线下收款需人工核销</span>
    </div>
    ${table([
      {t:'<input type="checkbox">',r:()=>'<input type="checkbox">'},
      {t:'应收单号',k:'id'},{t:'租户',k:'tenant'},{t:'类型',k:'type'},
      {t:'应收余额',r:r=>`<b style="color:var(--red)">¥${money(r.balance)}</b>`},
      {t:'状态',r:r=>badge(r.status, STATUS_COLOR[r.status])},
      {t:'操作',r:r=>`<button class="btn sm pri" onclick="PC.verifyOne('${r.id}')">核销</button>`}
    ], pend.slice(0,12))}
  </div>
  <div class="card"><h3>今日核销记录</h3>
    ${table([{t:'时间',k:'t'},{t:'单号',k:'id'},{t:'租户',k:'tn'},{t:'金额',k:'a'},{t:'方式',r:r=>badge(r.w,'blue')},{t:'经办',k:'o'}],[
      {t:'09:42',id:'YS2031',tn:'张敏',a:'¥1,350.00',w:'线上自动核销',o:'系统'},
      {t:'09:15',id:'YS2026',tn:'蓝湾电子',a:'¥12,600.00',w:'银行转账核销',o:'财务-周敏'},
      {t:'08:50',id:'YS2018',tn:'刘洋',a:'¥326.40',w:'扫码核销',o:'陈志远'}])}
  </div>`;
});
PC.scanVerify = function(){
  modal({title:'扫码核销', size:'sm', body:`
    <div style="height:220px;border-radius:10px;background:#101c34;display:flex;align-items:center;justify-content:center;color:#5b8cff;font-size:46px;cursor:pointer" onclick="UI.close();PC.verifyOne('YS2031')">📷<div style="font-size:12px;margin-left:10px">点击模拟扫码成功</div></div>
    <div style="font-size:12.5px;color:var(--ink3);margin-top:10px;text-align:center">扫描租户小程序出示的缴费订单码，自动匹配应收单</div>`});
};
PC.verifyOne = function(id){
  const r = DB.receivables.find(x=>x.id===id) || DB.receivables[0];
  modal({title:'收款核销 · '+r.id, body:`<div class="frm">
    ${fld('应收余额', `<input class="ipt" value="¥${money(r.balance)}" disabled>`)}
    ${fld('本次核销金额', `<input class="ipt" value="${r.balance}"><div class="hint">小于余额即为部分核销</div>`)}
    ${fld('收款方式', `<select class="ipt"><option>银行转账</option><option>现金</option><option>微信（线下）</option><option>支付宝（线下）</option></select>`)}
    ${fld('收款日期', `<input class="ipt" type="date" value="2026-07-29">`)}
    ${fld('备注', `<input class="ipt" placeholder="流水号等">`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('核销成功，应收余额已更新')">确认核销</button>`});
};

/* ================= 账龄分析 ================= */
PC.reg('/fin/aging','账龄分析', (el)=>{
  const overdue = DB.receivables.filter(r=>r.status==='逾期');
  const buckets = [{'30 天内':[1,30]},{'31-60 天':[31,60]},{'61-90 天':[61,90]},{'90 天以上':[91,9999]}].map(o=>{
    const [name,[lo,hi]] = Object.entries(o)[0];
    const list = overdue.filter(r=>r.days>=lo&&r.days<=hi);
    return {name, cnt:list.length, amt:list.reduce((a,b)=>a+b.balance,0)};
  });
  el.innerHTML = `
  <div class="row">
    <div class="card" style="flex:1.4"><h3>应收账龄分布（金额）</h3>
      ${barChart(buckets.map((b,i)=>({l:b.name, v:Math.round(b.amt), c:['#16a34a','#ea8600','#dc2626','#7f1d1d'][i]})), {h:240})}
    </div>
    <div class="card"><h3>风险评估</h3>
      ${donut(buckets.map((b,i)=>({l:b.name, v:b.cnt, c:['#16a34a','#ea8600','#dc2626','#7f1d1d'][i]})), {center:overdue.length, centerLabel:'逾期笔数', unit:' 笔'})}
      <div style="margin-top:12px;font-size:12.5px;color:var(--ink2);line-height:1.9">90 天以上 2 笔建议启动法务流程；60 天以上安排上门催收并暂停新签。</div>
    </div>
  </div>
  <div class="card"><h3>账龄明细</h3>
    ${table([
      {t:'租户',k:'tenant'},{t:'房源',k:'room'},{t:'类型',k:'type'},
      {t:'逾期金额',r:r=>`<b style="color:var(--red)">¥${money(r.balance)}</b>`},
      {t:'逾期天数',r:r=>badge(r.days+' 天', r.days>90?'red':r.days>60?'orange':r.days>30?'cyan':'green')},
      {t:'账龄区间',r:r=>r.days>90?'90 天以上':r.days>60?'61-90 天':r.days>30?'31-60 天':'30 天内'},
      {t:'风险建议',r:r=>r.days>60?'<span style="color:var(--red)">高风险 · 法务/上门</span>':'常规催收'},
      {t:'操作',r:r=>`<button class="btn sm ghost" onclick="PC.dun('${r.id}')">催收</button>`}
    ], overdue.sort((a,b)=>b.days-a.days))}
  </div>`;
});

/* ================= 催收管理 ================= */
PC.reg('/fin/collect','催收管理', (el)=>{
  el.innerHTML = `
  <div class="grid4">
    ${stat('逾期租户', new Set(DB.receivables.filter(r=>r.status==='逾期').map(r=>r.tenant)).size, '合计 ¥'+money(DB.stats.arrearsTotal))}
    ${stat('本月催收次数', DB.collections.length, '电话/微信/上门/函件')}
    ${stat('催收后回款', '¥ 28,640', '催收有效率 62%')}
    ${stat('一键催缴', '批量触达', '微信+短信双通道', "PC.batchDun()")}
  </div>
  <div class="card">
    <h3>催收台账<span class="more" style="float:right;font-weight:400;font-size:12px;color:var(--ink3)">按欠费金额排序</span></h3>
    ${table([
      {t:'租户',r:r=>`<span class="lk" onclick="PC.tenant('${r.tenant}')">${r.tenant}</span>`},
      {t:'所属片区',r:r=>badge(DB.areaName((DB.contracts.find(c=>c.id===r.contract)||{}).area),'gray')},
      {t:'房源',k:'room'},{t:'欠费金额',r:r=>`<b style="color:var(--red)">¥${money(r.balance)}</b>`},
      {t:'逾期天数',r:r=>badge(r.days+' 天', r.days>60?'red':'orange')},
      {t:'已催收次数',r:r=>DB.collections.filter(c=>c.recv===r.id).length+' 次'},
      {t:'最近催收结果',r:r=>{const c=DB.collections.filter(x=>x.recv===r.id).pop();return c? c.result:'—';}},
      {t:'操作',w:'200px',r:r=>`<button class="btn sm pri" onclick="PC.dun('${r.id}')">发起催收</button><button class="btn sm ghost" onclick="PC.collectLog('${r.id}')">记录</button>`}
    ], DB.receivables.filter(r=>r.status==='逾期').sort((a,b)=>b.balance-a.balance).slice(0,12))}
  </div>
  <div class="card"><h3>催收记录</h3>
    ${table([{t:'时间',k:'time'},{t:'租户',k:'tenant'},{t:'房源',k:'room'},{t:'方式',r:r=>badge(r.way,'blue')},{t:'结果反馈',k:'result'},{t:'经办',k:'by'}], DB.collections.slice(0,12))}
  </div>`;
});
PC.batchDun = function(){
  modal({title:'一键批量催缴', body:`<div class="frm">
    ${fld('催缴范围', `<select class="ipt"><option>全部逾期租户（${new Set(DB.receivables.filter(r=>r.status==='逾期').map(r=>r.tenant)).size} 户）</option><option>逾期 30 天以上</option><option>逾期 60 天以上</option></select>`, true)}
    ${fld('触达渠道', `<select class="ipt"><option>微信模板消息 + 短信兜底</option><option>仅微信</option><option>仅短信</option></select>`, true)}
    ${fld('催缴文案', `<textarea class="ipt" rows="3">【英莱达】您有账单已逾期，合计金额请登录小程序查看并尽快缴纳。逾期将影响续租、门禁与信用评价。详询 0571-88888888。</textarea>`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('批量催缴已发送，触达率可在报表中查看')">立即发送</button>`});
};
PC.collectLog = function(id){
  drawer('催收记录 · '+id, table([{t:'时间',k:'time'},{t:'方式',k:'way'},{t:'结果',k:'result'},{t:'经办',k:'by'}], DB.collections.filter(c=>c.recv===id)));
};

/* ================= 应付账款 ================= */
PC.reg('/fin/pay','应付账款', (el)=>{
  el.innerHTML = `
  <div class="grid4">
    ${stat('应付总额', '¥'+money(DB.payables.reduce((a,b)=>a+b.amount,0)))}
    ${stat('待支付', DB.payables.filter(p=>p.status==='待支付').length+' 笔', '近 7 日到期 2 笔', null)}
    ${stat('本月已付', '¥ 86,400', '按计划付款')}
    ${stat('供应商', new Set(DB.payables.map(p=>p.vendor)).size+' 家')}
  </div>
  <div class="card">
    <div class="toolbar"><input class="ipt" placeholder="供应商 / 费用名称" style="width:180px">
      <select class="ipt"><option>全部状态</option><option>待支付</option><option>部分支付</option><option>已支付</option></select>
      <button class="btn" onclick="UI.toast('查询成功（演示）')">查询</button><span class="sp"></span>
      <button class="btn pri" onclick="PC.payAdd()">＋ 登记应付</button></div>
    ${table([
      {t:'应付单号',k:'id'},{t:'费用名称',k:'name'},{t:'供应商',k:'vendor'},
      {t:'金额',r:r=>'¥'+money(r.amount)},{t:'应付日期',k:'due'},
      {t:'状态',r:r=>badge(r.status, r.status==='已支付'?'green':r.status==='部分支付'?'cyan':'orange')},
      {t:'操作',r:r=>r.status!=='已支付'?`<button class="btn sm pri" onclick="UI.confirm('付款确认','确认向 ${r.vendor} 支付 ¥${money(r.amount)}？','UI.toast(\\'付款单已提交财务审批\\')')">付款</button>`:`<button class="btn sm ghost" onclick="UI.toast('查看付款凭证')">凭证</button>`}
    ], DB.payables)}
  </div>`;
});
PC.payAdd = function(){
  modal({title:'登记应付账款', body:`<div class="frm">
    ${fld('费用名称', `<input class="ipt" placeholder="如：电梯维保服务费">`, false, true)}
    ${fld('供应商', `<input class="ipt">`, false, true)}
    ${fld('金额（元）', `<input class="ipt" type="number">`, false, true)}
    ${fld('应付日期', `<input class="ipt" type="date" value="2026-08-15">`)}
    ${fld('合同/发票', `<div style="border:1.5px dashed var(--line);border-radius:8px;padding:12px;text-align:center;color:var(--ink3);font-size:12.5px;cursor:pointer">📎 上传附件</div>`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('应付款已登记')">保存</button>`});
};

/* ================= 物业服务 ================= */
PC.reg('/svc/orders','报修工单', (el)=>{
  const os = DB.orders;
  el.innerHTML = `
  <div class="grid4">
    ${stat('待派单', os.filter(o=>o.status==='待派单').length, '超时未派自动升级', null)}
    ${stat('处理中', os.filter(o=>o.status==='处理中').length, '平均响应 28 分钟')}
    ${stat('本月完成', os.filter(o=>['已完成','已评价'].includes(o.status)).length, '及时率 94%')}
    ${stat('满意度', '4.6 ★', '来自租户评价')}
  </div>
  <div class="card">
    <div class="toolbar">
      <div class="mtabs" style="margin:0;width:340px">
        ${['全部','待派单','处理中','已完成','已评价'].map((t,i)=>`<div class="mt ${i===0?'on':''}" onclick="UI.toast('筛选：${t}（演示）');this.parentNode.querySelectorAll('.mt').forEach(x=>x.classList.remove('on'));this.classList.add('on')">${t}</div>`).join('')}
      </div>
      <input class="ipt" placeholder="工单号 / 位置 / 租户" style="width:180px">
      <button class="btn" onclick="UI.toast('查询成功（演示）')">查询</button>
      <span class="sp"></span><button class="btn pri" onclick="PC.orderAdd()">＋ 代客报修</button>
    </div>
    ${table([
      {t:'工单号',r:r=>`<span class="lk" onclick="PC.order('${r.id}')">${r.id}</span>${r.urgent?' <span class="badge b-red">急</span>':''}`},
      {t:'类型',k:'type'},{t:'位置',k:'room'},{t:'报修人',k:'tenant'},
      {t:'问题描述',r:r=>`<span style="display:inline-block;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.desc}</span>`},
      {t:'提交时间',k:'create'},{t:'维修员',r:r=>r.worker||'—'},
      {t:'状态',r:r=>badge(r.status, STATUS_COLOR[r.status])},
      {t:'评价',r:r=>r.score? '⭐'.repeat(r.score):'—'},
      {t:'操作',r:r=>`<button class="btn sm ghost" onclick="PC.order('${r.id}')">${r.status==='待派单'?'派单':'详情'}</button>`}
    ], os)}
  </div>`;
});
PC.orderAdd = function(){
  modal({title:'代客报修（电话/上门登记）', body:`<div class="frm">
    ${fld('报修位置', `<input class="ipt" placeholder="楼栋-房间 或 公共区域">`, false, true)}
    ${fld('报修人', `<input class="ipt">`)}
    ${fld('报修类型', `<select class="ipt"><option>水电维修</option><option>门窗五金</option><option>空调设备</option><option>管道疏通</option><option>公共区域</option></select>`)}
    ${fld('问题描述', `<textarea class="ipt" rows="3"></textarea>`, true, true)}
    ${fld('是否加急', `<select class="ipt"><option>普通</option><option>加急（30 分钟响应）</option></select>`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('工单已创建并自动派单')">提交并派单</button>`});
};
PC.reg('/svc/complaints','投诉管理', (el)=>{
  el.innerHTML = `
  <div class="grid4">
    ${stat('待处理', DB.complaints.filter(c=>c.status==='待处理').length, '24 小时内必须响应', null)}
    ${stat('处理中', DB.complaints.filter(c=>c.status==='已回复').length)}
    ${stat('本月投诉', DB.complaints.length+' 件', '环比下降 2 件')}
    ${stat('办结率', '87.5%', '平均办结 1.8 天')}
  </div>
  <div class="card">
    ${table([
      {t:'投诉编号',r:r=>`<span class="lk" onclick="PC.complaint('${r.id}')">${r.id}</span>`},
      {t:'投诉人',k:'tenant'},{t:'类型',r:r=>badge(r.type,'orange')},
      {t:'内容',r:r=>`<span style="display:inline-block;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.desc}</span>`},
      {t:'提交时间',k:'create'},{t:'状态',r:r=>badge(r.status, STATUS_COLOR[r.status])},
      {t:'操作',r:r=>`<button class="btn sm ghost" onclick="PC.complaint('${r.id}')">处理</button>`}
    ], DB.complaints)}
  </div>`;
});
PC.complaint = function(id){
  const c = DB.complaints.find(x=>x.id===id);
  drawer('投诉处理 · '+id, `
    <div style="display:flex;gap:8px;margin-bottom:14px">${badge(c.type,'orange')}${badge(c.status, STATUS_COLOR[c.status])}</div>
    ${desc([['投诉人',c.tenant],['提交时间',c.create],['投诉类型',c.type],['内容',c.desc]],2)}
    <h3 style="font-size:14px;margin:16px 0 10px">处理回复</h3>
    <textarea class="ipt" rows="3" style="width:100%" placeholder="填写处理结果，将推送至租户小程序"></textarea>
    <div style="margin-top:12px;display:flex;gap:10px">
      <button class="btn pri" onclick="UI.close();UI.toast('已回复并通知租户')">提交回复</button>
      <button class="btn" onclick="UI.close();UI.toast('已归档')">办结归档</button></div>
  `);
};

/* ================= 固定资产 ================= */
PC.reg('/asset/list','资产台账', (el)=>{
  const as = DB.assets;
  el.innerHTML = `
  <div class="grid4">
    ${stat('资产总数', as.length, '原值合计 ¥'+money(as.reduce((a,b)=>a+b.val,0)))}
    ${stat('在用', as.filter(a=>a.status==='在用').length, '闲置 '+as.filter(a=>a.status==='闲置').length)}
    ${stat('维修中', as.filter(a=>a.status==='维修中').length, '本月维保计划 3 项', null)}
    ${stat('待报废审批', 1, '残值处理流程中')}
  </div>
  <div class="card">
    <div class="toolbar">
      <input class="ipt" placeholder="资产名称 / 编号" style="width:170px">
      <select class="ipt"><option>全部分类</option><option>房屋建筑</option><option>机器设备</option><option>办公设备</option><option>运输设备</option><option>消防设备</option></select>
      <select class="ipt"><option>全部状态</option><option>在用</option><option>闲置</option><option>维修中</option></select>
      <button class="btn" onclick="UI.toast('查询成功（演示）')">查询</button>
      <span class="sp"></span><button class="btn" onclick="UI.toast('资产台账已导出')">导出</button>
      <button class="btn pri" onclick="PC.assetEdit()">＋ 资产登记</button>
    </div>
    ${table([
      {t:'资产编号',r:r=>`<span class="lk" onclick="PC.assetDetail('${r.id}')">${r.id}</span>`},
      {t:'名称',k:'name'},{t:'分类',r:r=>badge(r.cat,'blue')},{t:'规格型号',k:'spec'},
      {t:'购置日期',k:'buy'},{t:'原值',r:r=>'¥'+money(r.val)},
      {t:'使用部门',k:'dept'},{t:'存放位置',k:'loc'},
      {t:'状态',r:r=>badge(r.status, STATUS_COLOR[r.status])},
      {t:'操作',r:r=>`<button class="btn sm ghost" onclick="PC.assetDetail('${r.id}')">详情</button>`}
    ], as)}
  </div>`;
});
PC.assetEdit = function(){
  modal({title:'固定资产登记', body:`<div class="frm">
    ${fld('资产名称', `<input class="ipt">`, false, true)}
    ${fld('资产分类', `<select class="ipt"><option>房屋建筑</option><option>机器设备</option><option>办公设备</option><option>运输设备</option><option>消防设备</option></select>`)}
    ${fld('规格型号', `<input class="ipt">`)}
    ${fld('购置日期', `<input class="ipt" type="date">`)}
    ${fld('原值（元）', `<input class="ipt" type="number">`, false, true)}
    ${fld('使用部门', `<select class="ipt"><option>综合管理部</option><option>工程部</option><option>安保部</option><option>财务部</option></select>`)}
    ${fld('存放位置', `<input class="ipt">`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('资产已登记并生成二维码标签')">保存</button>`});
};
PC.assetDetail = function(id){
  const a = DB.assets.find(x=>x.id===id);
  drawer('资产详情 · '+a.id, `
    <div style="display:flex;gap:8px;margin-bottom:14px">${badge(a.cat,'blue')}${badge(a.status, STATUS_COLOR[a.status])}
    <span style="margin-left:auto"><button class="btn sm" onclick="PC.assetMove('${a.id}')">调拨</button><button class="btn sm" onclick="PC.assetRepair('${a.id}')">报修</button><button class="btn sm danger" onclick="PC.assetScrap('${a.id}')">报废</button></span></div>
    ${desc([['资产名称',a.name],['规格型号',a.spec],['购置日期',a.buy],['原值','¥'+money(a.val)],['累计折旧','¥'+money(a.val*0.3)],['净值','¥'+money(a.val*0.7)],['使用部门',a.dept],['存放位置',a.loc],['折旧方式','年限平均法 10 年']],3)}
    <h3 style="font-size:14px;margin:16px 0 10px">变动记录</h3>
    ${timeline([
      {t:'购置入账', d:a.buy+' · 供应商直采', act:true},
      {t:'部门领用', d:'领用至 '+a.dept},
      ...(a.status==='维修中'? [{t:'维修登记', d:'2026-07-20 · 故障检修中', act:true}]:[]),
      ...(a.status==='调拨中'? [{t:'调拨审批中', d:'2026-07-26 · 待总经理审批', act:true}]:[])
    ])}
  `);
};
PC.assetMove = function(id){
  modal({title:'资产调拨 · '+id, body:`<div class="frm">
    ${fld('调出部门', `<input class="ipt" value="综合管理部" disabled>`)}
    ${fld('调入部门', `<select class="ipt"><option>工程部</option><option>安保部</option><option>财务部</option></select>`)}
    ${fld('调拨原因', `<textarea class="ipt" rows="2"></textarea>`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('调拨申请已提交审批')">提交审批</button>`});
};
PC.assetRepair = function(id){
  modal({title:'资产维修登记 · '+id, body:`<div class="frm">
    ${fld('维修类型', `<select class="ipt"><option>故障维修</option><option>定期保养</option></select>`)}
  </div>`});
};
PC.assetScrap = function(id){
  modal({title:'资产报废申请 · '+id, body:`<div class="frm">
    ${fld('报废原因', `<select class="ipt"><option>超过使用年限</option><option>损坏无法修复</option><option>技术淘汰</option></select>`, true)}
    ${fld('预计残值（元）', `<input class="ipt" type="number" value="500">`)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('报废申请已提交审批')">提交审批</button>`});
};
PC.reg('/asset/cat','资产分类', (el)=>{
  const cats = {};
  DB.assets.forEach(a=>{ cats[a.cat] = cats[a.cat]||{cnt:0,val:0}; cats[a.cat].cnt++; cats[a.cat].val+=a.val; });
  el.innerHTML = `
  <div class="row">
    <div class="card"><h3>分类结构（支持多级）</h3>
      ${Object.entries(cats).map(([c,v])=>`<div class="mrow" style="cursor:default"><div class="tx"><div class="tt">🗂️ ${c}</div><div class="ts">${v.cnt} 项 · 原值 ¥${money(v.val)}</div></div><button class="btn sm ghost" onclick="UI.toast('新增 ${c} 子分类')">＋子类</button></div>`).join('')}
      <button class="btn" style="margin-top:12px" onclick="UI.toast('新增一级分类')">＋ 新增一级分类</button>
    </div>
    <div class="card" style="flex:1.4"><h3>分类资产分布（原值）</h3>
      ${donut(Object.entries(cats).map(([c,v],i)=>({l:c, v:Math.round(v.val/1000)})), {center:'¥'+money(DB.assets.reduce((a,b)=>a+b.val,0)/10000)+'万', centerLabel:'资产原值', unit:'k'})}
    </div>
  </div>`;
});
PC.reg('/asset/change','资产变动', (el)=>{
  el.innerHTML = `
  <div class="card">
    ${UI.tabs(['全部','调拨','维修','报废'],'全部',"UI.toast")||''}
    ${table([
      {t:'单号',k:'id'},{t:'类型',r:r=>badge(r.type, r.type==='调拨'?'cyan':r.type==='维修'?'orange':'red')},
      {t:'资产',k:'asset'},{t:'说明',k:'d'},{t:'申请人',k:'by'},{t:'时间',k:'t'},
      {t:'状态',r:r=>badge(r.s, STATUS_COLOR[r.s]||'gray')},{t:'操作',r:r=>r.s==='待审批'?`<button class="btn sm ghost" onclick="UI.toast('打开审批')">审批</button>`:`<button class="btn sm ghost" onclick="UI.toast('查看详情')">详情</button>`}
    ],[
      {id:'BD-0012',type:'调拨',asset:'投影仪 ZC1010',d:'综合管理部 → 工程部',by:'林晓峰',t:'07-26',s:'待审批'},
      {id:'BD-0011',type:'维修',asset:'柴油发电机 ZC1002',d:'季度保养 · 费用 ¥1,200 · 维保商：机电之家',by:'工程部',t:'07-22',s:'已完成'},
      {id:'BD-0010',type:'报废',asset:'台式电脑 ZC1008',d:'超使用年限 · 残值 ¥500',by:'综合管理部',t:'07-18',s:'待审批'},
      {id:'BD-0009',type:'调拨',asset:'电动巡逻车 ZC1013',d:'安保部 → 临港智造园',by:'赵启铭',t:'07-15',s:'已通过'}])}
  </div>`;
});
PC.reg('/asset/stock','盘点管理', (el)=>{
  el.innerHTML = `
  <div class="card">
    <div class="toolbar"><b style="font-size:14px">盘点任务</b><span class="sp"></span>
    <button class="btn pri" onclick="PC.stockNew()">＋ 创建盘点任务</button></div>
    ${table([
      {t:'任务',k:'name'},{t:'范围',k:'scope'},{t:'负责人',k:'by'},{t:'截止',k:'due'},
      {t:'进度',r:r=>`<div class="pbar" style="width:120px;display:inline-block;vertical-align:middle"><i style="width:${r.p}%"></i></div> ${r.p}%`},
      {t:'状态',r:r=>badge(r.s, STATUS_COLOR[r.s])},
      {t:'操作',r:r=>`<button class="btn sm ghost" onclick="PC.stockDetail('${r.name}')">盘点处理</button>`}
    ],[
      {name:'2026 年中全面盘点', scope:'全部资产（'+DB.assets.length+' 项）', by:'财务部-周敏', due:'2026-08-15', p:62, s:'进行中'},
      {name:'办公设备季度抽盘', scope:'办公设备', by:'综合管理部', due:'2026-07-10', p:100, s:'已结束'}])}
  </div>`;
});
PC.stockNew = function(){
  modal({title:'创建盘点任务', body:`<div class="frm">
    ${fld('任务名称', `<input class="ipt" value="2026 三季度盘点">`, false, true)}
    ${fld('盘点范围', `<select class="ipt"><option>全部资产</option><option>按分类</option><option>按部门</option><option>按存放位置</option></select>`)}
    ${fld('截止时间', `<input class="ipt" type="date" value="2026-09-30">`)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('盘点任务已创建并通知盘点人')">创建</button>`});
};
PC.stockDetail = function(name){
  drawer('盘点处理 · '+name, `
    <div style="font-size:13px;color:var(--ink2);margin-bottom:12px">扫码或勾选盘点，系统自动对比台账差异</div>
    ${table([
      {t:'资产编号',k:'id'},{t:'名称',k:'name'},{t:'账面位置',k:'loc'},
      {t:'实盘',r:(r,i)=>badge(i%5===3?'盘亏':'相符', i%5===3?'red':'green')},
      {t:'处理',r:(r,i)=>i%5===3?`<button class="btn sm ghost" onclick="UI.toast('已登记盘亏处理单')">登记处理</button>`:'—'}
    ], DB.assets.slice(0,12))}
    <div style="margin-top:14px;text-align:right"><button class="btn pri" onclick="UI.close();UI.toast('盘点结果已提交复核')">提交盘点结果</button></div>
  `);
};

/* ================= 发票管理 ================= */
PC.reg('/fin/invoice','发票管理', (el)=>{
  const inv = DB.invoices;
  el.innerHTML = `
  <div class="grid4">
    ${stat('待开具', inv.filter(i=>i.status==='待开具').length, '租户小程序在线申请', null)}
    ${stat('本月已开具', inv.filter(i=>i.status==='已开具').length, '电子发票自动交付')}
    ${stat('开票金额（月）', '¥'+money(inv.reduce((a,b)=>a+b.amount,0)))}
    ${stat('红冲（月）', inv.filter(i=>i.status==='已红冲').length, '需审核')}
  </div>
  <div class="card">
    <div class="toolbar">
      <input class="ipt" placeholder="申请号 / 租户 / 抬头" style="width:180px">
      <select class="ipt"><option>全部状态</option><option>待开具</option><option>已开具</option><option>已红冲</option></select>
      <select class="ipt"><option>全部票种</option><option>增值税普通发票（电子）</option><option>增值税专用发票</option></select>
      <button class="btn" onclick="UI.toast('查询成功（演示）')">查询</button>
      <span class="sp"></span>
      <button class="btn" onclick="PC.invoiceSetting()">⚙️ 开票设置</button>
      <button class="btn pri" onclick="PC.invoiceNew()">＋ 代客开票</button>
    </div>
    ${table([
      {t:'申请号',r:r=>`<span class="lk" onclick="PC.invoiceDetail('${r.id}')">${r.id}</span>`},
      {t:'租户',k:'tenant'},{t:'费用类型',r:r=>badge(r.type,'blue')},
      {t:'金额',r:r=>'¥'+money(r.amount)},
      {t:'发票抬头',r:r=>`<span style="display:inline-block;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.title}</span>`},
      {t:'票种',r:r=>badge(r.kind.includes('专用')?'专票':'普票', r.kind.includes('专用')?'purple':'cyan')},
      {t:'申请时间',k:'apply'},
      {t:'状态',r:r=>badge(r.status, r.status==='已开具'?'green':r.status==='待开具'?'orange':'red')},
      {t:'操作',w:'170px',r:r=>r.status==='待开具'
        ? `<button class="btn sm pri" onclick="PC.invoiceIssue('${r.id}')">开具</button><button class="btn sm ghost" onclick="UI.toast('已驳回申请')">驳回</button>`
        : r.status==='已开具'
        ? `<button class="btn sm ghost" onclick="UI.toast('发票 PDF 下载中')">下载</button><button class="btn sm ghost" onclick="UI.confirm('红冲确认','确认对发票 ${r.id} 进行红冲？红冲申请将推送至外部 OA 审批，审批通过后自动执行红冲并需重新开具。','UI.toast(\\'红冲申请已推送外部 OA 审批\\')')">红冲</button>`
        : `<button class="btn sm ghost" onclick="PC.invoiceDetail('${r.id}')">详情</button>`}
    ], inv)}
  </div>`;
});
PC.invoiceIssue = function(id){
  const i = DB.invoices.find(x=>x.id===id);
  modal({title:'开具发票 · '+id, body:`<div class="frm">
    ${fld('发票抬头', `<input class="ipt" value="${i.title}">`, true, true)}
    ${fld('税号', `<input class="ipt" value="${i.taxno||'（个人抬头无需税号）'}">`)}
    ${fld('票种', `<select class="ipt"><option>${i.kind}</option></select>`)}
    ${fld('开票金额', `<input class="ipt" value="¥${money(i.amount)}" disabled>`)}
    ${fld('税率', `<select class="ipt"><option>不动产租赁 9%（一般计税）</option><option>不动产租赁 5%（简易计税）</option><option>水电转售 13%</option></select><div class="hint">按费用类型自动带出，可在开票设置中维护税率表</div>`)}
    ${fld('税收分类编码', `<select class="ipt"><option>304050202 不动产经营租赁服务</option><option>110101 供电</option><option>110103 供水</option></select><div class="hint">按费用类型自动匹配</div>`)}
    ${fld('接收邮箱/手机', `<input class="ipt" value="tenant@example.com">`, true)}
    ${fld('备注', `<input class="ipt" placeholder="发票备注栏内容">`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('发票开具成功，已发送至租户邮箱与小程序')">确认开具</button>`});
};
PC.invoiceDetail = function(id){
  const i = DB.invoices.find(x=>x.id===id);
  drawer('发票详情 · '+id, `
    <div style="display:flex;gap:8px;margin-bottom:14px">${badge(i.kind, i.kind.includes('专用')?'purple':'cyan')}${badge(i.status, i.status==='已开具'?'green':i.status==='待开具'?'orange':'red')}</div>
    ${desc([['发票抬头',i.title],['税号',i.taxno||'—'],['开票金额','¥'+money(i.amount)],['关联账单',i.bill],['费用类型',i.type],['申请时间',i.apply],['发票号码',i.status==='已开具'?'24317000'+i.id.slice(2):'未开具'],['交付方式','邮箱 + 小程序卡包']],2)}
    ${i.status==='已开具'? `<div style="margin-top:16px;height:180px;border:1.5px dashed var(--line);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--ink3);cursor:pointer" onclick="UI.toast('发票 PDF 预览（演示）')">🧾 电子发票版式文件预览</div>`:''}
  `);
};
PC.invoiceNew = function(){
  modal({title:'代客开票', body:`<div class="frm">
    ${fld('选择已缴账单', `<select class="ipt">${DB.bills.filter(b=>b.status==='已缴').slice(0,6).map(b=>`<option>${b.id}（${b.tname} ${b.type} ¥${money(b.amount)}）</option>`).join('')}</select><div class="hint">已开过票的账单自动隐藏，防止重复开票；红冲后的账单可重新选择</div>`, true)}
    ${fld('抬头类型', `<select class="ipt"><option>企业</option><option>个人</option></select>`)}
    ${fld('发票抬头', `<input class="ipt">`, false, true)}
    ${fld('税号', `<input class="ipt">`)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('开票申请已创建')">提交</button>`});
};
PC.invoiceSetting = function(){
  modal({title:'开票设置', size:'lg', body:`<div class="frm">
    ${fld('开票主体', `<input class="ipt" value="英莱达产业发展有限公司">`, true)}
    ${fld('税号', `<input class="ipt" value="91330100MA2XXXXXX8">`)}
    ${fld('开票平台', `<select class="ipt"><option>百望云（已对接）</option><option>航天信息</option><option>税务 UKey 手工开具</option></select>`)}
    ${fld('自动交付', `<select class="ipt"><option>开具后自动发送邮箱+小程序</option><option>仅小程序</option></select>`)}
  </div>
  <h4 style="margin:14px 0 8px">税率配置（按费用类型）</h4>
  ${table([
    {t:'费用类型',k:'f'},{t:'税收分类编码',k:'c'},{t:'默认税率',k:'r'},{t:'计税方式',k:'m'},{t:'操作',r:r=>`<button class="btn sm ghost" onclick="UI.toast('税率已更新')">调整</button>`}
  ],[
    {f:'租金 / 物业费', c:'304050202 不动产经营租赁服务', r:'9%', m:'一般计税'},
    {f:'老项目租金（2016 前取得）', c:'304050202', r:'5%', m:'简易计税'},
    {f:'电费转售', c:'110101 供电', r:'13%', m:'一般计税'},
    {f:'水费转售', c:'110103 供水', r:'9%', m:'一般计税'},
    {f:'停车费', c:'304050203 车辆停放服务', r:'9%', m:'一般计税'}])}`,
  footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('开票设置已保存')">保存</button>`});
};
})();
