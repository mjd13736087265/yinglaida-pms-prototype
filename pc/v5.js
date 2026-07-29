/* ===== v5 · 数据报表 / 系统管理 / 大屏入口 ===== */
(function(){
const {table, badge, modal, drawer, toast, desc, fld, money, STATUS_COLOR, barChart, lineChart, donut, timeline, stat} = UI;
const inc = DB.incomeByMonth;

/* ---------- 收入报表 ---------- */
PC.reg('/rpt/income','收入报表', (el)=>{
  el.innerHTML = `
  <div class="grid4">
    ${stat('本月总收入', '¥'+money(inc[inc.length-1].total*10000), '<b class="up">同比 +12.4%</b> · 环比 +2.1%')}
    ${stat('租金收入', '¥'+money(inc[inc.length-1].租金*10000), '占比 '+Math.round(inc[inc.length-1].租金/inc[inc.length-1].total*100)+'%')}
    ${stat('水电+物业', '¥'+money((inc[inc.length-1].水电+inc[inc.length-1].物业费)*10000))}
    ${stat('停车收入', '¥'+money(inc[inc.length-1].停车*10000), '月租+临停')}
  </div>
  <div class="row">
    <div class="card" style="flex:1.5"><h3>收入趋势与同比环比</h3>
      ${lineChart([{name:'总收入(万)',data:inc.map(x=>x.total)},{name:'去年同期(万)',data:inc.map(x=>Math.round(x.total*0.88)),color:'#9ca3af'}], inc.map(x=>x.m), {h:240})}
    </div>
    <div class="card"><h3>收入结构（本月）</h3>
      ${donut([{l:'租金',v:inc[inc.length-1].租金,c:'#2563eb'},{l:'物业费',v:inc[inc.length-1].物业费,c:'#16a34a'},{l:'水电费',v:inc[inc.length-1].水电,c:'#ea8600'},{l:'停车费',v:inc[inc.length-1].停车,c:'#7c3aed'}],{center:'¥'+inc[inc.length-1].total+'万',centerLabel:'本月'})}
    </div>
  </div>
  <div class="card"><h3>分月收入明细（万元）<span class="more" onclick="UI.toast('已导出 Excel')">导出 →</span></h3>
    ${table([
      {t:'月份',k:'m'},{t:'租金',k:'租金'},{t:'物业费',k:'物业费'},{t:'水电',k:'水电'},{t:'停车',k:'停车'},
      {t:'合计',r:r=>`<b>${r.total}</b>`},
      {t:'环比',r:(r,i)=> i? `<span class="${r.total>=inc[i-1].total?'up':'down'}">${r.total>=inc[i-1].total?'+':''}${((r.total-inc[i-1].total)/inc[i-1].total*100).toFixed(1)}%</span>`:'—'}
    ], [...inc].reverse().slice(0,8))}
  </div>`;
});

/* ---------- 出租率报表 ---------- */
PC.reg('/rpt/rent','出租率报表', (el)=>{
  const byCat = {};
  DB.rooms.forEach(r=>{ byCat[r.cat]=byCat[r.cat]||{t:0,r:0}; byCat[r.cat].t++; if(r.status==='已租'||r.status==='到期') byCat[r.cat].r++; });
  el.innerHTML = `
  <div class="row">
    <div class="card" style="flex:1.5"><h3>各业态出租率</h3>
      ${barChart(Object.entries(byCat).map(([c,v],i)=>({l:c, v:Math.round(v.r/v.t*100), c:UI.PALETTE[i]})), {h:240})}
    </div>
    <div class="card"><h3>出租率趋势</h3>
      ${lineChart([{name:'综合出租率 %',data:[88,89,87,86,88,90,91,89,88,86,85,DB.stats.rentRate],color:'#16a34a'}], DB.months, {h:240})}
    </div>
  </div>
  <div class="card"><h3>空置分析与优化建议</h3>
    ${table([
      {t:'业态',k:'cat'},{t:'总房源',k:'t'},{t:'已租',k:'r'},{t:'出租率',r:r=>`<b>${Math.round(r.r/r.t*100)}%</b>`},
      {t:'空置',r:r=>r.t-r.r},{t:'优化建议',k:'tip'}
    ], Object.entries(byCat).map(([cat,v])=>({cat, ...v,
      tip: v.r/v.t>0.9?'供不应求，可考虑提价 3-5%': v.r/v.t>0.8?'健康区间，关注到期续签':'空置偏高，建议短租促销/渠道合作'})))}
  </div>`;
});

/* ---------- 租户报表 ---------- */
PC.reg('/rpt/tenant','租户报表', (el)=>{
  const co = DB.tenants.filter(t=>t.type==='企业').length;
  el.innerHTML = `
  <div class="grid4">
    ${stat('在租租户', DB.tenants.length, `企业 ${co} · 个人 ${DB.tenants.length-co}`)}
    ${stat('续租率', '86.4%', '到期续签 19/22')}
    ${stat('流失率', '4.2%', '本季度退租 3 户', null)}
    ${stat('平均租期', '14.6 个月', '企业租户显著更长')}
  </div>
  <div class="row">
    <div class="card"><h3>租户类型分布</h3>
      ${donut([{l:'个人租户',v:DB.tenants.length-co,c:'#2563eb'},{l:'企业租户',v:co,c:'#7c3aed'}],{center:DB.tenants.length,centerLabel:'总租户'})}
    </div>
    <div class="card"><h3>行业分布（企业）</h3>
      ${donut([{l:'智能制造',v:4,c:'#2563eb'},{l:'电子信息',v:3,c:'#16a34a'},{l:'物流商贸',v:2,c:'#ea8600'},{l:'其他',v:1,c:'#0891b2'}],{center:co,centerLabel:'企业租户'})}
    </div>
    <div class="card" style="flex:1.3"><h3>新增/退租趋势</h3>
      ${lineChart([{name:'新签',data:[3,4,2,5,4,6,3,5,4,3,5,4],color:'#16a34a'},{name:'退租',data:[2,1,3,2,2,1,2,3,2,4,2,1],color:'#dc2626'}], DB.months, {h:220})}
    </div>
  </div>
  <div class="card"><h3>租户价值 TOP10（年租金贡献）</h3>
    ${table([{t:'租户',k:'tname'},{t:'类型',k:'cat',r:r=>badge(r.cat,'blue')},{t:'租赁标的',k:'roomName'},{t:'月租金',r:r=>'¥'+money(r.rent)},{t:'年贡献',r:r=>'¥'+money(r.rent*12)},{t:'合同到期',k:'end'}],
      [...DB.contracts].sort((a,b)=>b.rent-a.rent).slice(0,10))}
  </div>`;
});

/* ---------- 合同报表 ---------- */
PC.reg('/rpt/contract','合同报表', (el)=>{
  const exp = DB.contracts.filter(c=>c.status==='即将到期');
  el.innerHTML = `
  <div class="grid4">
    ${stat('在履约合同', DB.contracts.filter(c=>c.status==='履约中').length, '电子签章率 100%')}
    ${stat('30 天内到期', exp.length, '需立即跟进', null)}
    ${stat('60 天内到期', exp.length+4, '90 天内 '+(exp.length+7))}
    ${stat('本月新签/续签', '9 / 4', '续签率 86%')}
  </div>
  <div class="card"><h3>合同到期预警清单（一键续租提醒）</h3>
    ${table([
      {t:'合同号',r:r=>`<span class="lk" onclick="PC.contract('${r.id}')">${r.id}</span>`},
      {t:'业态',r:r=>badge(r.cat,'blue')},{t:'租户',k:'tname'},{t:'标的',k:'roomName'},
      {t:'月租金',r:r=>'¥'+money(r.rent)},{t:'到期日',k:'end'},
      {t:'剩余',r:r=>badge(Math.max(5,(r.end.charCodeAt(9)||3)*3)+' 天','orange')},
      {t:'操作',r:r=>`<button class="btn sm pri" onclick="UI.toast('已发送续租提醒给 ${r.tname}')">续租提醒</button><button class="btn sm ghost" onclick="PC.renew('${r.room}')">办理续签</button>`}
    ], exp)}
  </div>
  <div class="row">
    <div class="card"><h3>合同签订趋势</h3>
      ${barChart(DB.months.map((m,i)=>({l:m, v:3+((i*7)%6)})), {h:220})}
    </div>
    <div class="card"><h3>到期月份分布（未来 6 个月）</h3>
      ${barChart(['26-08','26-09','26-10','26-11','26-12','27-01'].map((m,i)=>({l:m, v:2+((i*5)%7), c:'#ea8600'})), {h:220})}
    </div>
  </div>`;
});

/* ---------- 应收账款报表 ---------- */
PC.reg('/rpt/recv','应收账款报表', (el)=>{
  el.innerHTML = `
  <div class="grid4">
    ${stat('应收总额', '¥ 386.2 万', '本年累计')}
    ${stat('已收', '¥ 352.1 万', '回款率 91.2%')}
    ${stat('未收', '¥ 34.1 万', '其中逾期 ¥'+money(DB.stats.arrearsTotal), null)}
    ${stat('平均回款周期', '8.4 天', '账单日起算')}
  </div>
  <div class="row">
    <div class="card" style="flex:1.4"><h3>回款率月度走势</h3>
      ${lineChart([{name:'回款率 %',data:[88,90,87,91,89,92,90,93,91,89,90,91.2],color:'#2563eb'}], DB.months, {h:230})}
    </div>
    <div class="card"><h3>账龄分布</h3>
      ${donut([{l:'30 天内',v:62,c:'#16a34a'},{l:'31-60 天',v:21,c:'#ea8600'},{l:'61-90 天',v:11,c:'#dc2626'},{l:'90 天以上',v:6,c:'#7f1d1d'}],{center:'100%',centerLabel:'未收结构'})}
    </div>
  </div>
  <div class="card"><h3>分费用类型回收情况</h3>
    ${table([{t:'费用类型',k:'t'},{t:'应收',k:'a'},{t:'已收',k:'b'},{t:'回款率',r:r=>`<div class="pbar" style="width:140px;display:inline-block;vertical-align:middle"><i style="width:${r.p}%"></i></div> <b>${r.p}%</b>`}],[
      {t:'租金',a:'¥ 268.4 万',b:'¥ 251.2 万',p:94},{t:'物业费',a:'¥ 48.6 万',b:'¥ 44.1 万',p:91},
      {t:'水电费',a:'¥ 42.8 万',b:'¥ 38.2 万',p:89},{t:'停车费',a:'¥ 26.4 万',b:'¥ 18.6 万',p:70}])}
  </div>`;
});

/* ---------- 现金流报表 ---------- */
PC.reg('/rpt/cash','现金流报表', (el)=>{
  el.innerHTML = `
  <div class="grid4">
    ${stat('本月现金流入', '¥ 96.4 万', '租金+水电+停车+押金')}
    ${stat('本月现金流出', '¥ 21.8 万', '维保+采购+服务费')}
    ${stat('净流入', '¥ 74.6 万', '<b class="up">+8.2%</b>')}
    ${stat('押金池余额', '¥ 68.2 万', '专户管理')}
  </div>
  <div class="row">
    <div class="card" style="flex:1.5"><h3>现金流趋势（万元）</h3>
      ${lineChart([
        {name:'流入',data:[82,86,80,88,84,90,92,89,91,88,94,96.4],color:'#16a34a'},
        {name:'流出',data:[18,22,19,25,20,21,19,23,22,20,19,21.8],color:'#dc2626'}], DB.months, {h:240})}
    </div>
    <div class="card"><h3>流出结构（本月）</h3>
      ${donut([{l:'维保服务',v:8.2,c:'#2563eb'},{l:'物资采购',v:5.6,c:'#ea8600'},{l:'公共能耗',v:4.8,c:'#16a34a'},{l:'其他服务',v:3.2,c:'#7c3aed'}],{center:'¥21.8万',centerLabel:'本月流出'})}
    </div>
  </div>
  <div class="card"><h3>大额收支明细（近 30 天）</h3>
    ${table([{t:'日期',k:'d'},{t:'摘要',k:'s'},{t:'方向',r:r=>badge(r.t, r.t==='流入'?'green':'red')},{t:'金额',r:r=>`<b style="color:${r.t==='流入'?'var(--green)':'var(--red)'}">${r.t==='流入'?'+':'-'}${r.a}</b>`},{t:'账户',k:'acc'}],[
      {d:'07-28',s:'蓝湾电子 季度租金',t:'流入',a:'¥37,800',acc:'基本户'},
      {d:'07-26',s:'电梯年度维保费',t:'流出',a:'¥28,000',acc:'基本户'},
      {d:'07-24',s:'旭日新能源 押金',t:'流入',a:'¥36,000',acc:'押金专户'},
      {d:'07-22',s:'园区公共电费',t:'流出',a:'¥18,420',acc:'基本户'},
      {d:'07-20',s:'恒力机械 厂房租金',t:'流入',a:'¥33,600',acc:'基本户'}])}
  </div>`;
});

/* ---------- 报表导出 ---------- */
PC.reg('/rpt/export','报表导出', (el)=>{
  el.innerHTML = `
  <div class="card"><h3>手动导出</h3>
    ${table([{t:'报表',k:'n'},{t:'数据范围',k:'s'},{t:'格式',r:()=>badge('Excel','green')+' '+badge('PDF','red')},
      {t:'操作',r:r=>`<button class="btn sm pri" onclick="UI.toast('${r.n} 导出完成，已开始下载')">导出 Excel</button> <button class="btn sm" onclick="UI.toast('${r.n} PDF 已生成')">PDF</button>`}],[
      {n:'收入报表',s:'2025-08 ~ 2026-07'},{n:'出租率报表',s:'全部业态'},{n:'租户报表',s:'全部在租租户'},
      {n:'合同报表',s:'在履约 + 90 天到期'},{n:'应收账款报表',s:'含账龄明细'},{n:'现金流报表',s:'近 12 个月'},
      {n:'缴费明细表',s:'按账期可选'},{n:'抄表明细表',s:'按表计/月份可选'}])}
  </div>
  <div class="card"><h3>定时自动报送</h3>
    <div class="toolbar"><span style="font-size:13px;color:var(--ink3)">按周期自动生成报表并发送至指定邮箱/微信</span><span class="sp"></span>
    <button class="btn pri" onclick="PC.cronNew()">＋ 新增报送任务</button></div>
    ${table([{t:'任务',k:'n'},{t:'周期',r:r=>badge(r.c,'cyan')},{t:'接收人',k:'to'},{t:'最近执行',k:'last'},{t:'状态',r:r=>badge(r.s,'green')},{t:'操作',r:()=>`<button class="btn sm ghost" onclick="UI.toast('任务已暂停/启用')">启停</button>`}],[
      {n:'经营日报',c:'每日 08:00',to:'总经理、财务总监',last:'今天 08:00 ✅',s:'启用'},
      {n:'收入月报',c:'每月 1 日',to:'集团财务部',last:'07-01 ✅',s:'启用'},
      {n:'欠费周报',c:'每周一 09:00',to:'片区经理',last:'07-27 ✅',s:'启用'}])}
  </div>`;
});
PC.cronNew = function(){
  modal({title:'新增定时报送', body:`<div class="frm">
    ${fld('报表', `<select class="ipt"><option>经营日报</option><option>收入月报</option><option>欠费周报</option><option>出租率月报</option></select>`)}
    ${fld('周期', `<select class="ipt"><option>每日 08:00</option><option>每周一 09:00</option><option>每月 1 日 09:00</option></select>`)}
    ${fld('接收人', `<input class="ipt" placeholder="邮箱 / 微信，多个用逗号分隔">`, true, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('报送任务已创建')">创建</button>`});
};

/* ---------- 大屏入口 ---------- */
PC.reg('/screen-entry','驾驶舱大屏', (el)=>{
  el.innerHTML = `
  <div class="card" style="text-align:center;padding:60px 20px">
    <div style="font-size:52px;margin-bottom:14px">📊</div>
    <h2 style="margin-bottom:8px">经营驾驶舱数据大屏</h2>
    <p style="color:var(--ink3);font-size:13.5px;line-height:2">核心指标 · 房源状态 · 车位状态 · 缴费状态 · 欠费预警 · 合同预警 · 异常预警<br>适配 1920×1080 拼接屏，数据每 30 秒自动刷新</p>
    <button class="btn pri" style="margin-top:18px;padding:12px 34px;font-size:15px" onclick="window.open('../screen/index.html','_blank')">全屏打开大屏 ↗</button>
  </div>`;
});

/* ---------- 系统管理 ---------- */
PC.reg('/sys/user','用户与角色', (el)=>{
  el.innerHTML = `
  <div class="row">
    <div class="card" style="flex:1.5"><h3>系统用户<span class="more" onclick="PC.userEdit()">＋ 新增用户</span></h3>
      ${table([{t:'姓名',k:'n'},{t:'账号',k:'u'},{t:'角色',r:r=>badge(r.role,'blue')},{t:'数据范围',k:'scope'},{t:'状态',r:r=>badge(r.s,'green')},{t:'操作',r:()=>`<button class="btn sm ghost" onclick="PC.userEdit()">编辑</button>`}],[
        {n:'陈志远',u:'chenzy',role:'片区经理',scope:'城东产业园',s:'启用'},
        {n:'林晓峰',u:'linxf',role:'片区经理',scope:'滨江科创园',s:'启用'},
        {n:'赵启铭',u:'zhaoqm',role:'片区经理',scope:'临港智造园',s:'启用'},
        {n:'周敏',u:'zhoumin',role:'财务',scope:'全部片区',s:'启用'},
        {n:'张维修',u:'zhangwx',role:'维修工',scope:'全部片区',s:'启用'},
        {n:'系统管理员',u:'admin',role:'超级管理员',scope:'全部',s:'启用'}])}
    </div>
    <div class="card"><h3>角色权限</h3>
      ${table([{t:'角色',k:'r'},{t:'权限要点',k:'p'},{t:'操作',r:()=>`<button class="btn sm ghost" onclick="PC.roleEdit()">配置</button>`}],[
        {r:'超级管理员',p:'全部功能 + 系统设置'},
        {r:'片区经理',p:'本片区全业务 + 审批'},
        {r:'财务',p:'应收应付/核销/报表'},
        {r:'维修工',p:'工单处理（小程序端）'},
        {r:'前台',p:'入住退房办理、代客报修'}])}
    </div>
  </div>`;
});
PC.userEdit = function(){
  modal({title:'用户信息', body:`<div class="frm">
    ${fld('姓名', `<input class="ipt" value="陈志远">`, false, true)}
    ${fld('登录账号', `<input class="ipt" value="chenzy">`)}
    ${fld('角色', `<select class="ipt"><option>片区经理</option><option>财务</option><option>维修工</option><option>前台</option></select>`)}
    ${fld('数据范围', `<select class="ipt"><option>城东产业园</option><option>全部片区</option></select>`)}
    ${fld('手机号', `<input class="ipt" value="13805710001">`)}
    ${fld('初始密码', `<input class="ipt" value="手机号后六位（首次登录强制修改）" disabled>`)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('用户已保存')">保存</button>`});
};
PC.roleEdit = function(){
  drawer('角色权限配置 · 片区经理', `
    ${['工作台','片区管理','设备管理','水电费管理','宿舍管理','厂房管理','车位管理','应收应付','物业服务','数据报表'].map(m=>`
    <div class="mrow" style="cursor:default"><div class="tx"><div class="tt">${m}</div></div>
      <span style="font-size:12px;color:var(--ink3)">查看 ☑&nbsp; 新增 ☑&nbsp; 编辑 ☑&nbsp; 删除 ☐&nbsp; 审批 ☑</span></div>`).join('')}
    <div style="margin-top:14px;text-align:right"><button class="btn pri" onclick="UI.close();UI.toast('权限已保存')">保存权限</button></div>
  `);
};
PC.reg('/sys/billing','账单参数', (el)=>{
  el.innerHTML = `
  <div class="card"><h3>账单生成参数</h3>
    ${desc([['租金账单生成日','每月 1 日 02:00 自动生成'],['缴费宽限期','账单日后 15 天'],['逾期标记','宽限期后自动标记并触发提醒'],
      ['水电账单日','每月 1 日（按冻结读数）'],['车位账单','随租金账单合并生成'],['账单推送','生成后自动推送小程序+公众号']],2)}
    <div style="margin-top:14px"><button class="btn pri" onclick="UI.toast('账单参数已保存')">保存修改</button></div>
  </div>
  <div class="card"><h3>支付方式</h3>
    ${table([{t:'支付方式',k:'p'},{t:'费率',k:'f'},{t:'状态',r:r=>badge('已开通','green')},{t:'操作',r:()=>`<button class="btn sm ghost" onclick="UI.toast('配置已保存')">配置</button>`}],[
      {p:'微信支付（小程序）',f:'0.6%'},{p:'支付宝',f:'0.6%'},{p:'银联云闪付',f:'0.5%'},{p:'银行转账（线下核销）',f:'—'}])}
  </div>`;
});
PC.reg('/sys/remind','提醒设置', (el)=>{
  el.innerHTML = `<div class="card"><h3>提醒规则</h3>
    ${table([{t:'提醒场景',k:'s'},{t:'触发规则',k:'r'},{t:'渠道',k:'c'},{t:'状态',r:()=>badge('启用','green')},{t:'操作',r:()=>`<button class="btn sm ghost" onclick="UI.toast('规则已保存')">编辑</button>`}],[
      {s:'账单生成提醒',r:'账单生成后立即',c:'小程序+公众号'},
      {s:'缴费临期提醒',r:'截止前 3 天',c:'小程序+公众号'},
      {s:'逾期催缴提醒',r:'逾期 1/7/15 天',c:'公众号+短信'},
      {s:'合同到期提醒',r:'到期前 30/60/90 天',c:'小程序+公众号'},
      {s:'余额不足提醒',r:'表计余额低于阈值',c:'公众号'},
      {s:'报修进度提醒',r:'派单/完工节点',c:'小程序'}])}
  </div>`;
});
PC.reg('/sys/flow','审批流程', (el)=>{
  el.innerHTML = `<div class="card"><h3>审批流程配置</h3>
    ${table([{t:'审批类型',k:'t'},{t:'流程',r:r=>r.f.map((n,i)=>`${i>0?' → ':''}<span class="badge b-blue">${n}</span>`).join('')},{t:'操作',r:()=>`<button class="btn sm ghost" onclick="UI.toast('流程已保存')">编辑</button>`}],[
      {t:'续租申请',f:['片区经理','财务复核']},{t:'退租/押金退还',f:['片区经理','财务复核','总经理']},
      {t:'费用减免',f:['片区经理','总经理']},{t:'缓缴申请',f:['片区经理','财务复核']},
      {t:'资产调拨',f:['综合管理部','总经理']},{t:'资产报废',f:['综合管理部','财务','总经理']}])}
  </div>`;
});
PC.reg('/sys/log','操作日志', (el)=>{
  el.innerHTML = `<div class="card">
    <div class="toolbar"><input class="ipt" placeholder="操作人 / 关键词" style="width:170px"><input class="ipt" type="date" value="2026-07-29"><button class="btn" onclick="UI.toast('查询成功（演示）')">查询</button><span class="sp"></span><button class="btn" onclick="UI.toast('日志已导出')">导出</button></div>
    ${table([{t:'时间',k:'t'},{t:'操作人',k:'u'},{t:'模块',r:r=>badge(r.m,'blue')},{t:'操作内容',k:'d'},{t:'IP',k:'ip'}],[
      {t:'08:12',u:'chenzy',m:'设备管理',d:'远程分闸 623661807018（欠费停电）',ip:'10.8.0.12'},
      {t:'08:05',u:'zhoumin',m:'收款核销',d:'核销 YS2026 ¥12,600（银行转账）',ip:'10.8.0.22'},
      {t:'07:58',u:'linxf',m:'入住办理',d:'办理 1 号宿舍楼 512 入住，生成合同 HT20260728',ip:'10.8.0.15'},
      {t:'07:41',u:'admin',m:'数据对接',d:'刷新表计平台 Token',ip:'10.8.0.2'},
      {t:'07:30',u:'chenzy',m:'催收管理',d:'批量催缴发送 23 户（微信+短信）',ip:'10.8.0.12'}])}
  </div>`;
});
})();
