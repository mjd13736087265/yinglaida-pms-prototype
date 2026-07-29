/* ===== v2 · 设备管理 / 水电费管理 / 数据对接 ===== */
(function(){
const {table, badge, modal, drawer, toast, desc, fld, close, money, STATUS_COLOR, barChart, lineChart, donut, timeline, stat, tabs} = UI;
const esc = UI.esc;

/* ================= 设备管理（电表/水表） ================= */
function devicePage(el, type){
  const kind = type==='1'?'电表':'水表';
  const list = DB.meters.filter(m=>m.barMeasureType===Number(type));
  const online = list.filter(m=>m.online==='在线').length;
  const share = list.filter(m=>m.nature==='公摊').length;
  el.innerHTML = `
  <div class="grid4">
    ${stat(kind+'总数', list.length, `网关 ${new Set(list.map(m=>m.gateway)).size} 个`)}
    ${stat('在线率', Math.round(online/list.length*100)+'%', `在线 ${online} · 掉线 ${list.length-online}`, null)}
    ${stat('公摊表', share, '独用 '+(list.length-share)+' 块')}
    ${stat('低余额账户', list.filter(m=>m.balance<m.threshold&&m.nature==='独用').length, '低于阈值自动预警', "location.hash='#/water/alarm'")}
  </div>
  <div class="card">
    <div class="toolbar">
      <input class="ipt" placeholder="表号 / 表名 / 户名 模糊查询" style="width:220px" onkeydown="if(event.key==='Enter')UI.toast('已按关键词过滤（演示）')">
      <select class="ipt"><option>全部状态</option><option>在线</option><option>掉线</option></select>
      <select class="ipt"><option>全部性质</option><option>独用</option><option>公摊</option></select>
      <button class="btn" onclick="UI.toast('已按条件查询（演示）')">查询</button>
      <span class="sp"></span>
      <button class="btn" onclick="PC.meterSync()">🔄 同步表计（getAllMeters）</button>
      <button class="btn" onclick="UI.toast('已导出 ${list.length} 条表计台账')">导出</button>
      <button class="btn pri" onclick="PC.meterEdit(null,'${type}')">＋ 登记${kind}</button>
    </div>
    ${table([
      {t:'表计编号', r:r=>`<span class="lk" onclick="PC.meterDetail('${r.id}')">${r.no}</span>`},
      {t:'表计名称', k:'name'},
      {t:'性质', r:r=>badge(r.nature, r.nature==='公摊'?'purple':'blue')},
      {t:'状态', r:r=>badge(r.online, r.online==='在线'?'green':'red')},
      {t:'费率/计费模式', r:r=>`${r.rateType}<br>${badge(r.feeMode||'预付费', r.feeMode==='后付费'?'cyan':'purple')}`},
      {t:'最新读数', r:r=>`<b>${r.reading.toFixed(2)}</b>`},
      {t:'通信', r:r=>`${r.comm} / ${r.proto}`},
      {t:'阀门', r:r=>badge(r.valve, r.valve==='合闸'?'green':'orange')},
      {t:'余额(元)', r:r=>{const low=r.balance<r.threshold&&r.nature==='独用';return `<span style="color:${low?'var(--red)':'inherit'};font-weight:${low?700:400}">${money(r.balance)}</span>`;}},
      {t:'操作', w:'180px', r:r=>`<button class="btn sm ghost" onclick="PC.meterDetail('${r.id}')">详情</button>
        <button class="btn sm ghost" onclick="PC.meterCmd('${r.id}','抄表')">抄表</button>
        <button class="btn sm ghost" onclick="PC.meterCmd('${r.id}','${r.valve==='合闸'?'分闸':'合闸'}')">${r.valve==='合闸'?'分闸':'合闸'}</button>`}
    ], list.slice(0,14))}
    <div class="pager">共 ${list.length} 条 <span class="on">1</span><span onclick="UI.toast('翻页（演示）')">2</span><span onclick="UI.toast('翻页（演示）')">3</span></div>
  </div>`;
}
PC.reg('/device/1','电表管理', el=>devicePage(el,'1'));
PC.reg('/device/2','水表管理', el=>devicePage(el,'2'));

PC.meterSync = function(){
  modal({title:'同步智能表计', size:'sm', body:`
    <div style="font-size:13px;line-height:2;color:var(--ink2)">
    正在调用 <code>GET /api/platform/bar/engineer/getAllMeters</code><br>
    项目编号 bar_project_id：<b>${DB.api.projectId}</b><br><br>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;color:#15803d">
    ✅ 同步完成：共拉取 82 块表计，新增 3 块，更新在线状态 79 条</div></div>`,
    footer:`<button class="btn pri" onclick="UI.close()">知道了</button>`});
};
PC.meterEdit = function(id, type){
  const m = id? DB.meters.find(x=>x.id===id) : {type:type==='1'?'电表':'水表'};
  modal({title: id? '编辑表计 · '+m.no : '登记新表计', size:'lg', body:`<div class="frm">
    ${fld('表计编号 bar_measure_no', `<input class="ipt" value="${m.no||''}">`, false, true)}
    ${fld('表计名称', `<input class="ipt" value="${m.name||''}">`, false, true)}
    ${fld('表计类型', `<select class="ipt"><option>${m.type||'电表'}</option><option>${m.type==='电表'?'水表':'电表'}</option></select>`)}
    ${fld('使用性质', `<select class="ipt"><option>${m.nature||'独用'}</option><option>${m.nature==='公摊'?'独用':'公摊'}</option></select><div class="hint">公摊表可单独配置分摊规则</div>`)}
    ${fld('绑定房源 / 区域', `<input class="ipt" value="${m.roomName||''}" placeholder="选择楼栋-房间 或 公共区域">`)}
    ${fld('网关地址 bar_gateway_no', `<input class="ipt" value="${m.gateway||'1400005'}">`)}
    ${fld('通信方式', `<select class="ipt"><option>NB-IoT</option><option>485</option><option>LoRa</option></select>`)}
    ${fld('通信协议', `<select class="ipt"><option>DLT645-2007</option><option>DLT645-1997</option></select>`)}
    ${fld('费率类型 rate_type', `<select class="ipt"><option>复费率(尖峰平谷)</option><option>单费率</option></select>`)}
    ${fld('计费模式', `<select class="ipt"><option>${m.feeMode||'预付费'}</option><option>${m.feeMode==='后付费'?'预付费':'后付费'}</option></select><div class="hint">预付费：先充值按量扣减；后付费：按月出账单</div>`)}
    ${fld('CT/PT 倍率', `<input class="ipt" value="CT 1.0 / PT 1.0">`)}
    ${fld('单价（元/度 · 元/吨）', `<input class="ipt" value="${m.price||0.85}">`)}
    ${fld('余额预警阈值（元）', `<input class="ipt" value="${m.threshold??50}">`)}
    ${fld('阶梯计费模板', `<select class="ipt"><option>园区标准阶梯（一表一模板）</option><option>居民阶梯三档</option><option>自定义模板…</option></select><div class="hint">支持峰谷电价、季节性调价</div>`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('表计信息已保存并同步至表计平台')">保存</button>`});
};
PC.meterDetail = function(id){
  const m = DB.meters.find(x=>x.id===id);
  const days = ['07-22','07-23','07-24','07-25','07-26','07-27','07-28'];
  const usage = days.map((d,i)=>({l:d, v: 8+((i*37+id.charCodeAt(2))%22)}));
  drawer(`表计详情 · ${m.no}`, `
    <div style="display:flex;gap:8px;margin-bottom:14px">
      ${badge(m.type,'blue')}${badge(m.nature, m.nature==='公摊'?'purple':'cyan')}${badge(m.online, m.online==='在线'?'green':'red')}${badge(m.valve, m.valve==='合闸'?'green':'orange')}
      <span style="margin-left:auto">
        <button class="btn sm" onclick="PC.meterCmd('${m.id}','抄表')">远程抄表</button>
        <button class="btn sm ${m.valve==='合闸'?'danger':''}" onclick="PC.meterCmd('${m.id}','${m.valve==='合闸'?'分闸':'合闸'}')">远程${m.valve==='合闸'?'分闸':'合闸'}</button>
        <button class="btn sm" onclick="PC.meterEdit('${m.id}','${m.barMeasureType}')">编辑</button>
      </span></div>
    ${desc([['表计编号',m.no],['绑定房源',m.roomName],['用户户名',m.cons],
      ['用户户号',m.consNo],['通信方式',m.comm+' / '+m.proto],['网关地址',m.gateway],
      ['费率类型',m.rateType],['计费模式',badge(m.feeMode||'预付费', m.feeMode==='后付费'?'cyan':'purple')],['单价',m.price+' 元'],
      ['最新读数',`<b>${m.reading.toFixed(2)}</b>`],['最近通信',m.lastTime],['账户余额',`¥${money(m.balance)}（阈值 ${m.threshold}）`]],3)}
    ${m.nature==='公摊'?`<h3 style="font-size:14px;margin:16px 0 10px">公摊分摊规则</h3>
    <div class="card" style="background:#fafbfe;font-size:13px;line-height:2">
      分摊方式：<b>按面积分摊</b>（可选：按人数 / 自定义比例）<br>
      分摊范围：本楼栋全部在租租户 · 免摊期：空置房间不参与分摊<br>
      <button class="btn sm" style="margin-top:6px" onclick="UI.toast('分摊规则已保存（演示）')">修改规则</button></div>`:''}
    <h3 style="font-size:14px;margin:16px 0 10px">近 7 日用量（${m.type==='电表'?'kWh':'m³'}）<span style="font-size:12px;color:var(--ink3);font-weight:400">数据源：getMeterEnergyByDate</span></h3>
    ${barChart(usage, {h:190})}
    <h3 style="font-size:14px;margin:16px 0 10px">负荷数据（最近采集 · findLoadDataForList）</h3>
    ${m.type==='电表'? table([
      {t:'数据时间',k:'t'},{t:'A相电压',k:'v'},{t:'A相电流',k:'c'},{t:'总有功功率',k:'p'},{t:'功率因数',k:'f'},{t:'正向有功总电量',k:'e'}
    ],[{t:'07-28 08:15',v:'225.4V',c:'1.017A',p:'0.18kW',f:'0.998',e:(m.reading).toFixed(2)},
       {t:'07-28 07:15',v:'226.1V',c:'0.986A',p:'0.17kW',f:'0.997',e:(m.reading-2.4).toFixed(2)}])
      : `<div style="font-size:13px;color:var(--ink2);background:#fafbfe;border-radius:8px;padding:12px">累计用水量 ${(m.reading).toFixed(2)} m³ · 瞬时流量 0.42 m³/h · 压力正常</div>`}
    <h3 style="font-size:14px;margin:16px 0 10px">操作记录</h3>
    ${timeline([
      {t:'远程抄表成功', d:'2026-07-28 08:30 · 读数 '+m.reading.toFixed(2)+' · taskId T88213', act:true},
      {t:'费率参数下发', d:'2026-07-01 · 尖 1.2 / 峰 1.0 / 平 0.85 / 谷 0.45'},
      {t:m.valve==='合闸'?'远程合闸':'远程分闸', d:'2026-06-15 · 操作员 陈志远'}
    ])}
  `, '780px');
};
PC.meterCmd = function(id, cmd){
  const m = DB.meters.find(x=>x.id===id);
  const apiMap = {'抄表':'/api/platform/bar/engineer/callTermTask','分闸':'/api/platform/bar/engineer/disconnectMeter','合闸':'/api/platform/bar/engineer/connectMeter'};
  const extra = cmd==='抄表'?'communicationType=2（远程通讯）':'meterNo='+m.no;
  modal({title:'远程'+cmd+' · '+m.no, size:'sm', body:`
    <div style="font-size:12.5px;background:#0f172a;color:#7dd3fc;border-radius:8px;padding:12px;font-family:monospace;line-height:1.9">
    POST ${DB.api.base}${apiMap[cmd]}<br>Token: ${DB.api.token.slice(0,12)}…<br>projectId: ${DB.api.projectId} · ${extra}</div>
    <div id="cmd-result" style="margin-top:12px;font-size:13px;color:var(--ink2)">⏳ 指令已下发，等待表计响应（pollingNbMeterData 轮询中）…</div>`,
    footer:`<button class="btn" onclick="UI.close()">关闭</button>`});
  setTimeout(()=>{ const r=document.getElementById('cmd-result'); if(r) r.innerHTML = `✅ <b style="color:var(--green)">${cmd}成功</b> · taskId T${Math.floor(Math.random()*90000+10000)} · ${cmd==='抄表'?'读数 '+(m.reading+Math.random()*2).toFixed(2):'继电器已'+(cmd==='分闸'?'断开':'闭合')} · 耗时 ${(Math.random()*3+1).toFixed(1)}s`; }, 1200);
};

/* ================= 水电费管理 ================= */
PC.reg('/water/read','智能抄表', (el)=>{
  el.innerHTML = `
  <div class="grid4">
    ${stat('本月应抄表', DB.meters.length, '已抄 '+DB.meters.length+' · 完成率 100%')}
    ${stat('自动采集占比', '96.3%', '人工补录 3 条')}
    ${stat('异常数据', DB.readings.filter(r=>r.abnormal).length, '需人工复核', null)}
    ${stat('本月总用电量', '12,840 kWh', '总用水量 986 m³')}
  </div>
  <div class="card">
    <h3>抄表任务</h3>
    <div class="toolbar">
      <button class="btn pri" onclick="PC.readNow()">⚡ 立即全量远程抄表</button>
      <button class="btn" onclick="PC.readManual()">＋ 人工补录（支持拍照上传）</button>
      <button class="btn" onclick="PC.readPlan()">⏰ 抄表计划设置</button>
      <span class="sp"></span><span style="font-size:12.5px;color:var(--ink3)">每日 00:30 自动采集 · 每月 1 日生成账单冻结读数</span>
    </div>
    ${table([
      {t:'抄表批次',k:'batch'},{t:'范围',k:'scope'},{t:'表计数量',k:'cnt'},{t:'方式',k:'way'},
      {t:'状态',r:r=>badge(r.st, r.st==='已完成'?'green':r.st==='进行中'?'cyan':'orange')},{t:'耗时',k:'cost'},{t:'操作',r:r=>`<button class="btn sm ghost" onclick="location.hash='#/water/records'">查看明细</button>`}
    ],[
      {batch:'CB-20260701', scope:'全部表计（月结冻结）', cnt:DB.meters.length, way:'定时任务', st:'已完成', cost:'4分12秒'},
      {batch:'CB-20260728', scope:'全部表计（日常采集）', cnt:DB.meters.length, way:'定时任务', st:'已完成', cost:'3分48秒'},
      {batch:'CB-20260729', scope:'掉线表计补抄', cnt:3, way:'人工触发', st:'进行中', cost:'-'},
    ])}
  </div>`;
});
PC.readNow = function(){
  modal({title:'全量远程抄表', size:'sm', body:`<div id="read-prog">
    <div class="kv"><span>正在批量下发抄表指令（callTermTask）…</span><b id="read-pct">0%</b></div>
    <div class="pbar"><i id="read-bar" style="width:0%"></i></div></div>`,
    footer:`<button class="btn" onclick="UI.close()">后台运行</button>`});
  let p=0; const tm=setInterval(()=>{ p+=Math.floor(Math.random()*18)+8; if(p>=100){p=100;clearInterval(tm);
    const el=document.getElementById('read-prog'); if(el) el.innerHTML='<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;color:#15803d;font-size:13px">✅ 抄表完成：成功 '+DB.meters.length+' 块，失败 0 块，读数已入库并触发用量校验</div>';}
    const b=document.getElementById('read-bar'),t=document.getElementById('read-pct'); if(b){b.style.width=p+'%';t.textContent=p+'%';} }, 500);
};
PC.readManual = function(){
  modal({title:'人工补录抄表', body:`<div class="frm">
    ${fld('选择表计', `<select class="ipt">${DB.meters.slice(0,8).map(m=>`<option>${m.no}（${m.name}）</option>`).join('')}</select>`, true, true)}
    ${fld('抄表日期', `<input class="ipt" type="date" value="2026-07-29">`, false, true)}
    ${fld('表计读数', `<input class="ipt" placeholder="输入当前读数">`, false, true)}
    ${fld('表盘照片', `<div style="border:1.5px dashed var(--line);border-radius:8px;padding:18px;text-align:center;color:var(--ink3);font-size:12.5px;cursor:pointer" onclick="UI.toast('已打开相册/相机（演示）')">📷 点击上传照片（必填，用于复核）</div>`, true)}
    ${fld('备注', `<input class="ipt" placeholder="如：表箱损坏、读数模糊等">`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('补录成功，已标记为人工抄表')">提交</button>`});
};
PC.readPlan = function(){
  modal({title:'抄表计划设置', body:`<div class="frm">
    ${fld('日常自动采集', `<select class="ipt"><option>每日 00:30</option><option>每小时</option><option>每 4 小时</option></select>`)}
    ${fld('月结冻结日', `<select class="ipt"><option>每月 1 日 00:00</option><option>每月最后一日</option></select>`)}
    ${fld('掉线自动重试', `<select class="ipt"><option>每 2 小时重试，最多 3 次</option><option>不重试</option></select>`)}
    ${fld('异常波动校验', `<select class="ipt"><option>较上月 ±50% 自动标记</option><option>±30%</option><option>关闭</option></select>`)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('抄表计划已保存')">保存</button>`});
};

PC.reg('/water/records','抄表记录', (el)=>{
  el.innerHTML = `<div class="card">
    <div class="toolbar">
      <input class="ipt" type="date" value="2026-07-01"><span style="color:var(--ink3)">至</span><input class="ipt" type="date" value="2026-07-29">
      <input class="ipt" placeholder="表号 / 房源" style="width:170px">
      <select class="ipt"><option>全部方式</option><option>系统自动采集</option><option>人工录入</option></select>
      <select class="ipt"><option>全部</option><option>仅看异常</option></select>
      <button class="btn" onclick="UI.toast('查询成功（演示）')">查询</button>
      <span class="sp"></span><button class="btn" onclick="UI.toast('抄表记录已导出 Excel')">导出</button>
    </div>
    ${table([
      {t:'抄表时间',k:'date'},{t:'表号',k:'meter'},{t:'表计名称',k:'mname'},{t:'房源',k:'room'},
      {t:'本期读数',r:r=>`<b>${r.value}</b>`},
      {t:'抄表方式',r:r=>badge(r.by.includes('人工')?'人工录入':'自动采集', r.by.includes('人工')?'cyan':'blue')},
      {t:'抄表人/来源',k:'by'},
      {t:'异常',r:r=>r.abnormal?badge('用量异常','red'):badge('正常','green')},
      {t:'操作',r:r=>`<button class="btn sm ghost" onclick="PC.readingDetail('${r.id}')">明细</button>${r.abnormal?`<button class="btn sm ghost" onclick="UI.toast('已标记复核完成')">复核</button>`:''}`}
    ], DB.readings)}
  </div>`;
});
PC.readingDetail = function(id){
  const r = DB.readings.find(x=>x.id===id);
  drawer('抄表明细 · '+r.id, `
    ${desc([['抄表时间',r.date],['表计编号',r.meter],['表计名称',r.mname],['绑定房源',r.room],
      ['本期读数',r.value],['抄表方式',r.by],['数据校验',r.abnormal?badge('异常波动 +182%','red'):badge('正常','green')],['表盘照片',r.photo?'📷 1 张':'（自动采集无照片）']],2)}
    ${r.abnormal?`<div style="margin-top:14px;background:var(--red-bg);border-radius:8px;padding:12px 14px;font-size:13px;color:var(--red)">⚠️ 本期用量较上月增长 182%，已自动触发用量预警并通知管理员复核。可能原因：设备长时间运行 / 表计故障 / 私接线路。</div>`:''}
  `);
};

PC.reg('/water/bills','账单推送', (el)=>{
  const wb = DB.bills.filter(b=>b.type==='电费'||b.type==='水费');
  el.innerHTML = `
  <div class="grid4">
    ${stat('7 月水电账单', wb.filter(b=>b.month==='2026-07').length+' 笔', '合计 ¥'+money(wb.filter(b=>b.month==='2026-07').reduce((a,b)=>a+b.amount,0)))}
    ${stat('已推送', wb.filter(b=>b.month==='2026-07').length, '微信公众号 + 小程序消息')}
    ${stat('已缴', wb.filter(b=>b.status==='已缴').length+' 笔', '支持合并缴费')}
    ${stat('逾期未缴', wb.filter(b=>b.status==='逾期').length+' 笔', null, "location.hash='#/fin/collect'")}
  </div>
  <div class="card">
    <div class="toolbar">
      <select class="ipt"><option>2026-07 账期</option><option>2026-06 账期</option></select>
      <select class="ipt"><option>电费+水费</option><option>仅电费</option><option>仅水费</option></select>
      <button class="btn" onclick="UI.toast('查询成功（演示）')">查询</button>
      <span class="sp"></span>
      <button class="btn" onclick="PC.billRule()">⚙️ 账单生成规则</button>
      <button class="btn pri" onclick="PC.genBills()">＋ 手动生成账单</button>
    </div>
    ${table([
      {t:'账单号',r:r=>`<span class="lk" onclick="PC.billDetail('${r.id}')">${r.id}</span>`},
      {t:'类型',r:r=>badge(r.type, r.type==='电费'?'orange':'cyan')},
      {t:'租户',k:'tname'},{t:'房源',k:'room'},{t:'账期',k:'month'},
      {t:'用量',r:r=>r.type==='电费'? (r.amount/0.85).toFixed(1)+' kWh' : (r.amount/3.2).toFixed(1)+' m³'},
      {t:'金额',r:r=>'¥'+money(r.amount)},
      {t:'状态',r:r=>badge(r.status, STATUS_COLOR[r.status])},
      {t:'操作',r:r=>`<button class="btn sm ghost" onclick="UI.toast('已重新推送账单')">推送</button><button class="btn sm ghost" onclick="PC.billDetail('${r.id}')">明细</button>`}
    ], wb.slice(0,14))}
  </div>`;
});
PC.billRule = function(){
  modal({title:'水电账单生成规则', size:'lg', body:`<div class="frm">
    ${fld('计费模式（两种并行，可按表计分别设置）', `<select class="ipt"><option>混合模式：宿舍/公寓默认预付费，厂房/商业默认后付费</option><option>全部后付费（按月出账单）</option><option>全部预付费（充值扣减）</option></select><div class="hint">单块表计可在「设备管理-编辑表计」中单独切换模式</div>`, true)}
    ${fld('账单生成日', `<select class="ipt"><option>每月 1 日（按上月冻结读数）</option><option>每月最后一日</option></select>`)}
    ${fld('推送渠道', `<select class="ipt"><option>微信小程序 + 公众号模板消息</option><option>仅小程序</option><option>小程序+短信</option></select>`)}
    ${fld('电费计价', `<select class="ipt"><option>复费率：尖 1.20 / 峰 1.00 / 平 0.85 / 谷 0.45</option><option>单一价 0.85 元/kWh</option><option>阶梯电价模板</option></select>`, true)}
    ${fld('水费计价', `<select class="ipt"><option>单一价 3.20 元/m³</option><option>阶梯水价（一表一模板）</option></select>`, true)}
    ${fld('公摊电费', `<select class="ipt"><option>公共表用量按面积分摊到在租租户</option><option>按人数分摊</option><option>自定义比例</option></select>`, true)}
    ${fld('逾期规则', `<select class="ipt"><option>账单日后 15 天未缴标记逾期并提醒</option><option>10 天</option><option>20 天</option></select>`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('账单规则已保存')">保存</button>`});
};
PC.genBills = function(){
  modal({title:'手动生成账单', body:`<div class="frm">
    ${fld('账期', `<input class="ipt" type="month" value="2026-07">`, false, true)}
    ${fld('范围', `<select class="ipt"><option>全部已绑定表计的房源</option><option>指定楼栋</option><option>指定租户</option></select>`, true)}
    ${fld('账单类型', `<select class="ipt"><option>电费 + 水费（含公摊）</option><option>仅电费</option><option>仅水费</option></select>`, true)}
  </div><div style="margin-top:10px;font-size:12.5px;color:var(--ink3)">系统将读取月结冻结读数，按费率模板计算费用，生成账单并自动推送。</div>`,
  footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('账单生成任务已启动，完成后自动推送')">生成并推送</button>`});
};
PC.billDetail = function(id){
  const b = DB.bills.find(x=>x.id===id);
  if(!b) return;
  const usage = b.type==='电费'? (b.amount/0.85) : b.type==='水费'? (b.amount/3.2) : 0;
  drawer('账单明细 · '+b.id, `
    <div style="display:flex;gap:8px;margin-bottom:14px">${badge(b.type, b.type==='电费'?'orange':b.type==='水费'?'cyan':'blue')}${badge(b.status, STATUS_COLOR[b.status])}
      <span style="margin-left:auto"><button class="btn sm" onclick="UI.toast('订单凭证 PDF 已生成')">下载凭证</button></span></div>
    ${desc([['账单号',b.id],['租户',b.tname],['房源',b.room],['账期',b.month],['关联合同',b.contract],['应缴截止',b.due]],3)}
    <h3 style="font-size:14px;margin:16px 0 10px">费用明细</h3>
    ${table([{t:'项目',k:'n'},{t:'用量/基数',k:'u'},{t:'单价',k:'p'},{t:'金额',r:r=>'¥'+money(r.a)}],
      b.type==='电费'||b.type==='水费' ? [
        {n:'本期用量（独用表）', u: usage.toFixed(1)+(b.type==='电费'?' kWh':' m³'), p:(b.type==='电费'?'0.85':'3.20'), a:b.amount*0.82},
        {n:'公摊分摊（按面积）', u:'公共用量 × 面积占比 2.4%', p:'-', a:b.amount*0.18},
      ] : [{n:b.type, u:b.month, p:'-', a:b.amount}])}
    <div style="text-align:right;font-size:16px;margin-top:10px">合计：<b style="color:var(--red)">¥${money(b.amount)}</b></div>
    ${b.status==='已缴'? `<h3 style="font-size:14px;margin:16px 0 10px">支付信息</h3>${desc([['支付时间',b.payTime],['支付方式',b.channel],['交易流水','WX'+b.id],['订单凭证','已生成（可下载打印）']],2)}`
      : `<div style="margin-top:16px;display:flex;gap:10px"><button class="btn pri" onclick="UI.close();UI.toast('已发送催缴提醒')">催缴提醒</button><button class="btn" onclick="UI.close();location.hash='#/fin/verify'">线下收款核销</button></div>`}
  `);
};

PC.reg('/water/share','公摊管理', (el)=>{
  const shareMeters = DB.meters.filter(m=>m.nature==='公摊');
  el.innerHTML = `
  <div class="card">
    <div class="toolbar"><span style="font-size:13px;color:var(--ink3)">公共水电表 ${shareMeters.length} 块 · 每月按规则自动分摊至在租租户</span>
    <span class="sp"></span><button class="btn pri" onclick="PC.shareRule()">＋ 新增分摊规则</button></div>
    ${table([
      {t:'公共表计',r:r=>`<span class="lk" onclick="PC.meterDetail('${r.id}')">${r.name}</span>`},
      {t:'表号',k:'no'},
      {t:'本月用量',r:r=>`<b>${(r.reading%300+80).toFixed(1)}</b> ${r.type==='电表'?'kWh':'m³'}`},
      {t:'本月金额',r:r=>'¥'+money((r.reading%300+80)*r.price)},
      {t:'分摊方式',r:r=>badge('按面积分摊','purple')},
      {t:'分摊范围',k:'roomName'},
      {t:'操作',r:r=>`<button class="btn sm ghost" onclick="PC.shareDetail('${r.id}')">分摊明细</button>`}
    ], shareMeters)}
  </div>`;
});
PC.shareRule = function(){
  modal({title:'新增分摊规则', body:`<div class="frm">
    ${fld('公共表计', `<select class="ipt">${DB.meters.filter(m=>m.nature==='公摊').slice(0,5).map(m=>`<option>${m.name}</option>`).join('')}</select>`, true)}
    ${fld('分摊方式', `<select class="ipt"><option>按面积分摊</option><option>按人数分摊</option><option>自定义比例</option></select>`)}
    ${fld('分摊范围', `<select class="ipt"><option>本楼栋在租租户</option><option>指定租户组</option></select>`, true)}
    ${fld('免摊规则', `<select class="ipt"><option>空置房间不参与分摊</option><option>全部房间参与</option></select>`, true)}
    ${fld('生效账期', `<input class="ipt" type="month" value="2026-08">`, false, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('分摊规则已创建')">保存</button>`});
};
PC.shareDetail = function(id){
  const m = DB.meters.find(x=>x.id===id);
  const targets = DB.rooms.filter(r=>r.bid===m.room && r.tenant).slice(0,8);
  const total = (m.reading%300+80)*m.price;
  drawer('分摊明细 · '+m.name, `
    ${desc([['本月公共用量',(m.reading%300+80).toFixed(1)+(m.type==='电表'?' kWh':' m³')],['单价',m.price+' 元'],['应摊总额',`¥${money(total)}`],['分摊方式','按面积（空置免摊）']],2)}
    <h3 style="font-size:14px;margin:16px 0 10px">租户分摊明细</h3>
    ${table([{t:'租户',k:'tname'},{t:'房间',k:'no'},{t:'面积',r:r=>r.size+' ㎡'},{t:'分摊占比',r:r=>(r.size/targets.reduce((a,b)=>a+b.size,0)*100).toFixed(1)+'%'},
      {t:'分摊金额',r:r=>'¥'+money(total*r.size/targets.reduce((a,b)=>a+b.size,0))}], targets)}
  `);
};

PC.reg('/water/alarm','用量预警', (el)=>{
  const alarms = [
    {id:'YJ01', room:'1 号宿舍楼 405', tenant:'王磊', type:'用电量异常', desc:'本月用电 412 kWh，较上月 +182%', level:'高', time:'07-27 08:30', st:'待处理'},
    {id:'YJ02', room:'3 号标准厂房 102', tenant:'恒力机械', type:'余额不足', desc:'电表余额 18.5 元，低于阈值 50 元', level:'中', time:'07-27 06:00', st:'已通知'},
    {id:'YJ03', room:'2 号宿舍楼 210', tenant:'李芳', type:'用水量异常', desc:'连续 3 日用水量为 0，疑似表计故障', level:'中', time:'07-26 09:12', st:'待处理'},
    {id:'YJ04', room:'创新大厦 A 座 803', tenant:'云帆软件', type:'表计掉线', desc:'电表 623661807012 掉线超过 24 小时', level:'高', time:'07-25 14:40', st:'处理中'},
    {id:'YJ05', room:'滨江商业街 108', tenant:'飞驰物流', type:'用电量异常', desc:'夜间谷时用电占比 87%，疑似昼夜颠倒经营', level:'低', time:'07-24 08:30', st:'已处理'},
  ];
  el.innerHTML = `
  <div class="grid4">
    ${stat('待处理预警', alarms.filter(a=>a.st==='待处理').length, '高优先级 '+alarms.filter(a=>a.level==='高'&&a.st==='待处理').length+' 条')}
    ${stat('本月累计预警', '17 条', '环比 +3 条')}
    ${stat('阈值规则', '4 条启用', '用量突增/余额/掉线/零用量')}
    ${stat('自动通知', '微信+短信', '低余额自动推送充值提醒')}
  </div>
  <div class="card">
    <div class="toolbar">
      <select class="ipt"><option>全部类型</option><option>用量异常</option><option>余额不足</option><option>表计掉线</option></select>
      <select class="ipt"><option>全部状态</option><option>待处理</option><option>处理中</option><option>已处理</option></select>
      <button class="btn" onclick="UI.toast('查询成功（演示）')">查询</button>
      <span class="sp"></span><button class="btn" onclick="PC.alarmRule()">⚙️ 预警阈值设置</button>
    </div>
    ${table([
      {t:'预警时间',k:'time'},{t:'房源',k:'room'},{t:'租户',k:'tenant'},{t:'类型',r:r=>badge(r.type, r.type.includes('异常')?'red':r.type.includes('余额')?'orange':'purple')},
      {t:'说明',k:'desc'},{t:'级别',r:r=>badge(r.level, r.level==='高'?'red':r.level==='中'?'orange':'gray')},
      {t:'状态',r:r=>badge(r.st, STATUS_COLOR[r.st]||'gray')},
      {t:'操作',r:r=>`<button class="btn sm ghost" onclick="UI.toast('已通知租户 ${r.tenant}')">通知租户</button><button class="btn sm ghost" onclick="UI.toast('已标记处理完成')">办结</button>`}
    ], alarms)}
  </div>`;
});
PC.alarmRule = function(){
  modal({title:'用量预警阈值设置', body:`<div class="frm">
    ${fld('用量突增预警', `<select class="ipt"><option>较上月同期 +50%</option><option>+30%</option><option>+100%</option></select>`)}
    ${fld('余额不足预警', `<select class="ipt"><option>低于 50 元</option><option>低于 20 元</option><option>低于 100 元</option></select>`)}
    ${fld('零用量预警', `<select class="ipt"><option>连续 3 日为 0</option><option>连续 7 日为 0</option><option>关闭</option></select>`)}
    ${fld('掉线预警', `<select class="ipt"><option>掉线超过 24 小时</option><option>12 小时</option><option>48 小时</option></select>`)}
    ${fld('通知方式', `<select class="ipt"><option>微信模板消息 + 小程序站内信</option><option>短信</option><option>全部渠道</option></select>`, true)}
    ${fld('通知对象', `<select class="ipt"><option>租户 + 片区管理员</option><option>仅管理员</option></select>`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('预警规则已保存')">保存</button>`});
};

/* ================= 数据对接 ================= */
PC.reg('/api/config','接口配置', (el)=>{
  el.innerHTML = `
  <div class="card">
    <h3>智能水电表平台（预付费能源管理系统）</h3>
    ${desc([
      ['平台地址（正式环境）', `<code>${DB.api.base}</code>`],
      ['项目编号 bar_project_id', DB.api.projectId],
      ['平台账号 user_info', DB.api.userInfo],
      ['当前 Token', `<code>${DB.api.token}</code>`],
      ['Token 有效期', DB.api.tokenExpire+'（到期自动刷新）'],
      ['对接状态', badge('运行正常','green')]
    ],2)}
    <div style="margin-top:14px;display:flex;gap:10px">
      <button class="btn pri" onclick="UI.toast('Token 已刷新：9F3A…D21B，有效期 7200s')">刷新 Token</button>
      <button class="btn" onclick="PC.apiTest()">连通性测试</button>
      <button class="btn" onclick="PC.meterSync()">同步表计档案</button>
    </div>
  </div>
  <div class="card">
    <h3>接口能力清单（2025-03 接口文档）</h3>
    ${table([
      {t:'接口名称',k:'name'},{t:'请求',r:r=>badge(r.method, r.method==='GET'?'blue':'purple')},
      {t:'地址',r:r=>`<code style="font-size:12px">${r.url}</code>`},
      {t:'状态',r:r=>badge(r.status,'green')},
      {t:'平均耗时',r:r=>r.latency+' ms'},
      {t:'操作',r:r=>`<button class="btn sm ghost" onclick="PC.apiDoc('${r.name}')">调试</button>`}
    ], DB.api.endpoints)}
  </div>`;
});
PC.apiTest = function(){
  modal({title:'连通性测试', size:'sm', body:`<div id="ping" style="font-size:13px;line-height:2.2">
    ⏳ GET ${DB.api.base}/api/token …</div>`, footer:`<button class="btn" onclick="UI.close()">关闭</button>`});
  setTimeout(()=>{const e=document.getElementById('ping'); if(e) e.innerHTML += `<b style="color:var(--green)">✅ code:0 · msg:ok · 耗时 86ms</b><br>⏳ GET …/getAllMeters …`;},700);
  setTimeout(()=>{const e=document.getElementById('ping'); if(e) e.innerHTML += `<b style="color:var(--green)">✅ code:0 · 返回 82 块表计 · 耗时 132ms</b><br><br><b>全部接口连通正常</b>`;},1500);
};
PC.apiDoc = function(name){
  const ep = DB.api.endpoints.find(e=>e.name===name);
  modal({title:'接口调试 · '+name, size:'lg', body:`
    <div style="font-size:12.5px;background:#0f172a;color:#7dd3fc;border-radius:8px;padding:14px;font-family:monospace;line-height:1.9;margin-bottom:14px">
    ${ep.method} ${DB.api.base}${ep.url}<br>Header → Token: ${DB.api.token}<br>Query → bar_project_id=${DB.api.projectId}${ep.name.includes('负荷')?'&barMeasureNo=623661807001&barMeasureType=1&ctAndpt=false':''}</div>
    <div style="font-size:12.5px;background:#f8fafc;border:1px solid var(--line);border-radius:8px;padding:14px;font-family:monospace;line-height:1.8;max-height:260px;overflow:auto">
    {<br>&nbsp;&nbsp;"code": 0,<br>&nbsp;&nbsp;"msg": "操作成功",<br>&nbsp;&nbsp;"data": { "pageNo": 1, "totalPage": 9, "list": [ … ] }<br>}</div>`,
    footer:`<button class="btn" onclick="UI.close()">关闭</button><button class="btn pri" onclick="UI.toast('已发送测试请求，code:0')">发送请求</button>`});
};
PC.reg('/api/monitor','接口监控', (el)=>{
  el.innerHTML = `
  <div class="grid4">
    ${stat('今日调用量', '8,642 次', '成功率 99.7%')}
    ${stat('平均响应', '168 ms', '峰值 512 ms（远程抄表）')}
    ${stat('Token 刷新', '12 次/日', '有效期 7200s 自动续期')}
    ${stat('失败告警', '2 次', '均已自动重试成功', null)}
  </div>
  <div class="row">
    <div class="card" style="flex:1.5"><h3>24 小时调用量</h3>
      ${lineChart([{name:'调用次数',data:[320,180,90,60,45,60,210,480,720,860,790,705,820,880,760,690,610,540,700,760,680,540,410,350]}], Array.from({length:24},(_,i)=>i+':00'), {h:220})}
    </div>
    <div class="card"><h3>接口调用占比</h3>
      ${donut([{l:'数据查询',v:62,c:'#2563eb'},{l:'远程抄表',v:18,c:'#16a34a'},{l:'分合闸',v:6,c:'#ea8600'},{l:'充值',v:9,c:'#7c3aed'},{l:'Token',v:5,c:'#0891b2'}],{center:'8642',centerLabel:'今日调用'})}
    </div>
  </div>
  <div class="card"><h3>最近调用日志</h3>
    ${table([{t:'时间',k:'t'},{t:'接口',k:'api'},{t:'耗时',k:'ms'},{t:'结果',r:r=>badge(r.code, r.code==='code:0'?'green':'red')},{t:'说明',k:'msg'}],[
      {t:'08:12:31',api:'getAllMeters',ms:'132ms',code:'code:0',msg:'同步 82 块表计状态'},
      {t:'08:10:05',api:'callTermTask(抄表)',ms:'512ms',code:'code:0',msg:'taskId T88213 读数成功'},
      {t:'07:58:44',api:'disconnectMeter',ms:'340ms',code:'code:0',msg:'欠费分闸 623661807018'},
      {t:'07:55:12',api:'consumerRecharge',ms:'201ms',code:'code:0',msg:'租户充值 ¥200（微信）'},
      {t:'07:41:03',api:'pollingNbMeterData',ms:'96ms',code:'code:2',msg:'数据暂未返回，已重试成功'},
    ])}
  </div>`;
});
PC.reg('/api/door','门禁对接', (el)=>{
  el.innerHTML = `
  <div class="card">
    <h3>智能门禁对接（计划 08-10 ~ 08-22 与水/电表并行）</h3>
    <div style="font-size:13px;color:var(--ink2);line-height:2;margin-bottom:14px">
    对接厂商：<b>海康威视</b> · 覆盖园区 12 个门禁点位（宿舍楼出入口、厂房大门、写字楼大堂）。<br>
    对接能力：人员权限按租约自动下发 / 退租自动回收，开门记录回传，欠费租户门禁策略联动（可选）。</div>
    ${table([{t:'对接项',k:'name'},{t:'厂商',k:'vendor'},{t:'状态',r:r=>badge(r.status, r.status==='对接中'?'cyan':'gray')},{t:'说明',k:'note'}], DB.api.door)}
  </div>
  <div class="card"><h3>门禁点位</h3>
    ${table([{t:'点位',k:'p'},{t:'设备型号',k:'m'},{t:'在线',r:r=>badge(r.o,'green')},{t:'今日开门',k:'n'},{t:'权限人数',k:'u'}],[
      {p:'1 号宿舍楼 东门',m:'DS-K1T671M',o:'在线',n:486,u:212},{p:'2 号宿舍楼 北门',m:'DS-K1T671M',o:'在线',n:392,u:188},
      {p:'3 号厂房 大门',m:'DS-K5604-Z',o:'在线',n:167,u:96},{p:'创新大厦 大堂',m:'DS-K1T671M',o:'在线',n:1124,u:420},
      {p:'园区 南门人行',m:'DS-K5604-Z',o:'在线',n:2380,u:916}])}
  </div>`;
});
PC.reg('/api/push','消息推送', (el)=>{
  el.innerHTML = `
  <div class="card">
    <h3>推送渠道配置</h3>
    ${table([{t:'渠道',k:'c'},{t:'用途',k:'u'},{t:'状态',r:r=>badge(r.s,'green')},{t:'今日发送',k:'n'},{t:'操作',r:r=>`<button class="btn sm ghost" onclick="UI.toast('渠道配置已保存')">配置</button>`}],[
      {c:'微信公众号模板消息',u:'账单推送、催缴提醒、报修进度',s:'已启用',n:1268},
      {c:'小程序站内信',u:'全部业务消息',s:'已启用',n:3420},
      {c:'短信（阿里云）',u:'催缴、紧急预警兜底',s:'已启用',n:86},
      {c:'语音外呼',u:'大额逾期催缴（可选）',s:'未启用',n:0}])}
  </div>
  <div class="card"><h3>推送模板</h3>
    ${table([{t:'模板',k:'t'},{t:'场景',k:'s'},{t:'内容预览',k:'p'},{t:'操作',r:r=>`<button class="btn sm ghost" onclick="UI.toast('模板已保存')">编辑</button>`}],[
      {t:'账单生成通知',s:'每月账单日','p':'【英莱达】您{月份}{类型}账单 ¥{金额} 已生成，请于{截止日}前缴纳 →'},
      {t:'欠费催缴提醒',s:'逾期 1/7/15 天','p':'【英莱达】您有{笔数}笔账单已逾期{天数}天，合计 ¥{金额}，请尽快缴纳。'},
      {t:'余额不足预警',s:'表计余额低于阈值','p':'【英莱达】您的{表类型}余额 ¥{余额} 已低于 {阈值} 元，为避免断电请立即充值。'},
      {t:'合同到期提醒',s:'到期前 30/60/90 天','p':'【英莱达】您的{房源}租赁合同将于{到期日}到期，如需续租请联系管家。'}])}
  </div>`;
});
})();
