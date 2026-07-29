/* ===== v6 · 第三轮需求（业主审核通过 R-01~R-18） ===== */
(function(){
const {table, badge, modal, drawer, toast, desc, fld, close, money, STATUS_COLOR, barChart, lineChart, donut, timeline, stat} = UI;

/* ================= R-05 欠费联动策略 ================= */
PC.reg('/water/strategy','欠费联动策略', (el)=>{
  const st = DB.strategy;
  el.innerHTML = `
  <div class="row">
    <div class="card" style="flex:1.3">
      <h3>⚙️ 欠费联动策略配置</h3>
      <div class="frm">
        ${fld('联动模式', `<select class="ipt" id="st-mode"><option>${st.mode}</option><option>自动断闸（可选开启，需总经理授权）</option></select><div class="hint">默认手动分闸 + 提醒；自动断闸默认关闭，可按需开启</div>`, true)}
        ${fld('缓冲时长', `<select class="ipt"><option>48 小时</option><option>24 小时</option><option>72 小时</option></select><div class="hint">余额耗尽后缓冲期内不断电，避免夜间断电投诉</div>`)}
        ${fld('透支额度（元）', `<input class="ipt" value="${st.overdraft}"><div class="hint">允许透支的最高金额，超出后才触发分闸流程</div>`)}
        ${fld('提醒节点', `<select class="ipt"><option>逾期 1 / 3 / 7 天自动提醒</option><option>1 / 7 / 15 天</option></select>`)}
        ${fld('通知渠道', `<select class="ipt"><option>微信模板消息 + 小程序站内信</option><option>+ 短信兜底</option></select>`)}
        ${fld('分闸二次确认', `<select class="ipt"><option>开启（强制，不可关闭）</option></select><div class="hint">手动分闸必须二次确认并填写原因</div>`)}
        ${fld('全程留痕', `<select class="ipt"><option>开启（强制，写入操作日志可审计）</option></select>`, true)}
      </div>
      <div style="margin-top:14px;text-align:right"><button class="btn pri" onclick="UI.toast('联动策略已保存并同步至全部表计')">保存策略</button></div>
    </div>
    <div class="card">
      <h3>🔒 手动分闸执行规范</h3>
      ${timeline([
        {t:'① 发起分闸', d:'仅片区经理以上权限，系统校验欠费事实', act:true},
        {t:'② 二次确认', d:'弹窗确认 + 必填分闸原因', act:true},
        {t:'③ 自动通知租户', d:'微信 + 站内信推送分闸原因与复电指引', act:true},
        {t:'④ 执行并留痕', d:'disconnectMeter 指令、操作人、时间全量写日志', act:true},
        {t:'⑤ 复电', d:'缴费到账后自动提醒管理员远程合闸'}
      ])}
      <div style="background:var(--orange-bg);border-radius:8px;padding:10px 14px;font-size:12.5px;color:var(--orange);line-height:1.8">
        ⚠️ 宿舍预付费场景：余额耗尽先进入 ${st.bufferHours} 小时缓冲期并推送充值提醒，缓冲期结束仍未充值才允许发起分闸。
      </div>
    </div>
  </div>
  <div class="card"><h3>最近分合闸记录（强制留痕）</h3>
    ${table([
      {t:'时间',k:'t'},{t:'表计',k:'m'},{t:'操作',r:r=>badge(r.op, r.op==='分闸'?'red':'green')},
      {t:'原因',k:'why'},{t:'二次确认',r:()=>badge('已确认','blue')},{t:'租户通知',r:()=>badge('已送达','green')},{t:'操作人',k:'by'}
    ],[
      {t:'07-28 08:03', m:'623661807018（3 号厂房 102 电表）', op:'分闸', why:'电费逾期 45 天，催收 3 次未果', by:'陈志远'},
      {t:'07-28 11:40', m:'623661807018（3 号厂房 102 电表）', op:'合闸', why:'欠费已缴清，自动提醒复电', by:'陈志远'},
      {t:'07-21 15:22', m:'623661807031（2 号宿舍楼 210 电表）', op:'分闸', why:'余额耗尽且超缓冲期 48h', by:'林晓峰'}
    ])}
  </div>`;
});

/* ================= R-08 押金台账 ================= */
PC.reg('/fin/deposit','押金台账', (el)=>{
  const ds = DB.deposits;
  const pool = ds.filter(d=>d.status==='在押'||d.status==='部分扣款').reduce((a,b)=>a+b.amount-b.deduct,0);
  el.innerHTML = `
  <div class="grid4">
    ${stat('押金池余额', '¥'+money(pool), '专户管理 · 与现金流报表联动', "location.hash='#/rpt/cash'")}
    ${stat('在押笔数', ds.filter(d=>d.status==='在押').length, '收取即入台账')}
    ${stat('退还审批中', ds.filter(d=>d.status==='退还审批中').length, '推送外部 OA 审批', null)}
    ${stat('本月已退', '¥'+money(ds.filter(d=>d.status==='已退').reduce((a,b)=>a+b.amount,0)), '原路退回 · 租户可查进度')}
  </div>
  <div class="card">
    <div class="toolbar">
      <input class="ipt" placeholder="租户 / 房源 / 合同号" style="width:180px">
      <select class="ipt"><option>全部状态</option><option>在押</option><option>退还审批中</option><option>已退</option><option>部分扣款</option></select>
      <select class="ipt"><option>全部片区</option>${DB.areas.map(a=>`<option>${a.name}</option>`).join('')}</select>
      <button class="btn" onclick="UI.toast('查询成功（演示）')">查询</button>
      <span class="sp"></span>
      <span style="font-size:12.5px;color:var(--ink3)">收取 / 退还 / 扣款全记录 · 退还进度同步租户小程序</span>
      <button class="btn" onclick="UI.toast('押金台账已导出')">导出</button>
    </div>
    ${table([
      {t:'押金单号',r:r=>`<span class="lk" onclick="PC.depositDetail('${r.id}')">${r.id}</span>`},
      {t:'所属片区',r:r=>badge(DB.areaName(r.area),'gray')},
      {t:'租户',k:'tenant'},{t:'房源',k:'room'},
      {t:'押金金额',r:r=>'¥'+money(r.amount)},
      {t:'扣款',r:r=>r.deduct? `<span style="color:var(--red)">-¥${money(r.deduct)}</span>` : '—'},
      {t:'收取时间',k:'collectTime'},
      {t:'状态',r:r=>badge(r.status, r.status==='在押'?'blue':r.status==='已退'?'green':r.status==='退还审批中'?'orange':'cyan')},
      {t:'操作',r:r=>`<button class="btn sm ghost" onclick="PC.depositDetail('${r.id}')">详情</button>${r.status==='在押'?`<button class="btn sm ghost" onclick="UI.toast('退还申请已推送外部 OA 审批')">申请退还</button>`:''}`}
    ], ds)}
  </div>`;
});
PC.depositDetail = function(id){
  const d = DB.deposits.find(x=>x.id===id);
  const steps = [{t:'押金收取', d:d.collectTime+' · '+d.channel+' · 入押金专户', act:true}];
  if(d.status==='退还审批中') steps.push({t:'退还申请', d:'已推送外部 OA 审批系统', act:true},{t:'审批退款', d:'审批通过后 7 个工作日内原路退回'});
  if(d.status==='已退') steps.push({t:'退还审批通过', d:'外部 OA · 2026-07', act:true},{t:'退款到账', d:d.refundTime+' · 原路退回', act:true});
  if(d.status==='部分扣款') steps.push({t:'扣款 '+money(d.deduct)+' 元', d:'物品损坏赔偿 · 凭证已上传', act:true});
  steps.push({t:'在押', d:'合同履约中，押金专户保管', act:d.status==='在押'});
  drawer('押金详情 · '+d.id, `
    ${desc([['租户',d.tenant],['房源',d.room],['关联合同',d.contract],['所属片区',DB.areaName(d.area)],
      ['押金金额','¥'+money(d.amount)],['扣款',d.deduct?'¥'+money(d.deduct):'—'],['状态',badge(d.status,'blue')],['现金流报表','押金池科目已联动']],2)}
    <h3 style="font-size:14px;margin:16px 0 10px">流转记录（租户端同步可见）</h3>
    ${timeline(steps)}
  `);
};

/* ================= R-14 自定义报表 ================= */
const CUSTOM_DS = {
  账单数据:{fields:['账期','费用类型','所属片区','租户','房源','金额','状态','支付渠道'], rows:()=>DB.bills.map(b=>({'账期':b.month,'费用类型':b.type,'所属片区':DB.areaName(DB.billArea(b)),'租户':b.tname,'房源':b.room,'金额':'¥'+money(b.amount),'状态':b.status,'支付渠道':b.channel||'—'}))},
  房源台账:{fields:['所属片区','楼栋','房号','业态','面积','租金','状态','租户','合同到期'], rows:()=>DB.rooms.map(r=>({'所属片区':DB.areaName(r.area),'楼栋':r.bname,'房号':r.no,'业态':r.cat,'面积':r.size+'㎡','租金':r.rent,'状态':r.status,'租户':r.tname||'—','合同到期':r.endDate||'—'}))},
  租户台账:{fields:['租户','类型','联系电话','信用等级','在租合同','累计欠费'], rows:()=>DB.tenants.map(t=>({'租户':t.name,'类型':t.type,'联系电话':t.phone,'信用等级':t.credit,'在租合同':DB.contracts.filter(c=>c.tname===t.name).length+' 份','累计欠费':'¥'+money(DB.receivables.filter(r=>r.tenant===t.name&&r.status==='逾期').reduce((a,b)=>a+b.balance,0))}))},
  抄表数据:{fields:['抄表时间','表号','所属片区','房源','读数','方式','异常'], rows:()=>DB.readings.map(r=>({'抄表时间':r.date,'表号':r.meter,'所属片区':DB.areaName(r.area),'房源':r.room,'读数':r.value,'方式':r.by,'异常':r.abnormal?'异常':'正常'}))},
};
PC._custom = PC._custom || {ds:'账单数据', fields:['账期','费用类型','租户','金额','状态'], tpls:[
  {n:'财务月度对账表', ds:'账单数据', f:'账期/类型/金额/状态/渠道', cron:'每月 1 日 09:00 报送'},
  {n:'片区空置明细表', ds:'房源台账', f:'片区/楼栋/房号/状态/租金', cron:'未加入报送'},
]};
PC.reg('/rpt/custom','自定义报表', (el)=>{
  const c = PC._custom;
  el.innerHTML = `
  <div class="card">
    <div class="toolbar"><b style="font-size:14px">🛠️ 报表设计器</b>
      <span style="font-size:12.5px;color:var(--ink3)">选数据源 → 点选字段 → 预览 → 保存模板，可加入定时报送，无需找开发</span><span class="sp"></span>
      <button class="btn pri" onclick="PC.customSave()">💾 保存为模板</button>
    </div>
    <div style="display:flex;gap:18px;flex-wrap:wrap">
      <div style="width:200px">
        <div class="fld"><label>数据源</label>
          <select class="ipt" id="cs-ds" onchange="PC.dsChange()">${Object.keys(CUSTOM_DS).map(k=>`<option ${k===c.ds?'selected':''}>${k}</option>`).join('')}</select></div>
        <div class="fld" style="margin-top:12px"><label>统计口径</label>
          <select class="ipt"><option>明细数据</option><option>按月汇总</option><option>按片区汇总</option></select></div>
        <div class="fld" style="margin-top:12px"><label>筛选条件</label>
          <select class="ipt"><option>全部片区</option>${DB.areas.map(a=>`<option>${a.name}</option>`).join('')}</select>
          <select class="ipt" style="margin-top:8px"><option>全部状态</option><option>已缴</option><option>待缴</option><option>逾期</option></select>
          <input class="ipt" type="month" value="2026-07" style="margin-top:8px"></div>
      </div>
      <div style="flex:1;min-width:320px">
        <div class="fld"><label>字段（点击添加 / 再点移除，可拖拽排序）</label>
          <div>${CUSTOM_DS[c.ds].fields.map(f=>`<span class="chip ${c.fields.includes(f)?'on':''}" onclick="PC.fldToggle('${f}')">${f}</span>`).join('')}</div></div>
        <div style="font-size:12px;color:var(--ink3);margin:8px 0">已选 ${c.fields.length} 列：${c.fields.join('、')||'（请先选择字段）'}</div>
        <div id="cs-preview" style="overflow-x:auto">${customPreview()}</div>
      </div>
    </div>
  </div>
  <div class="card"><h3>我的报表模板</h3>
    ${table([
      {t:'模板名称',k:'n'},{t:'数据源',k:'ds'},{t:'字段',k:'f'},{t:'定时报送',r:r=>badge(r.cron.includes('未')?'未加入':r.cron, r.cron.includes('未')?'gray':'cyan')},
      {t:'操作',r:r=>`<button class="btn sm ghost" onclick="UI.toast('已按模板生成报表')">生成</button><button class="btn sm ghost" onclick="UI.toast('已加入定时报送任务')">加入报送</button><button class="btn sm ghost" onclick="UI.toast('模板已删除')">删除</button>`}
    ], c.tpls)}
  </div>`;
});
function customPreview(){
  const c = PC._custom, ds = CUSTOM_DS[c.ds];
  if(!c.fields.length) return '<div class="empty">请选择要展示的字段</div>';
  const rows = ds.rows().slice(0,8);
  return table(c.fields.map(f=>({t:f, k:f})), rows);
}
PC.dsChange = function(){
  PC._custom.ds = document.getElementById('cs-ds').value;
  PC._custom.fields = CUSTOM_DS[PC._custom.ds].fields.slice(0,4);
  const hit = {t:'自定义报表', r:document.getElementById('app')};
  document.querySelectorAll('.sub-mi'); // keep menu state
  routeRefresh();
};
PC.fldToggle = function(f){
  const c = PC._custom;
  c.fields = c.fields.includes(f)? c.fields.filter(x=>x!==f) : c.fields.concat(f);
  routeRefresh();
};
PC.customSave = function(){
  modal({title:'保存报表模板', body:`<div class="frm">
    ${fld('模板名称', `<input class="ipt" value="我的${PC._custom.ds}报表">`, true, true)}
    ${fld('纳入定时报送', `<select class="ipt"><option>暂不</option><option>每日 08:00</option><option>每周一 09:00</option><option>每月 1 日 09:00</option></select>`, true)}
    ${fld('接收人', `<input class="ipt" placeholder="邮箱 / 微信，多个用逗号分隔">`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('模板已保存，可在「我的报表模板」中使用')">保存</button>`});
};
function routeRefresh(){
  // 重新渲染当前路由（保留 hash）
  window.dispatchEvent(new Event('hashchange'));
}

/* ================= R-02 数据字典 ================= */
PC.reg('/sys/dict','数据字典', (el)=>{
  const usage = {房屋状态:'房源/房态图/报表/小程序', 酒店房态:'酒店营业/房态', 表计状态:'设备管理/预警', 表计性质:'设备管理/公摊',
    计费模式:'设备管理/账单规则', 账单状态:'账单/应收/报表', 费用类型:'账单/应收/发票', 工单状态:'报修/管理端小程序',
    合同状态:'合同/报表/小程序', 押金状态:'押金台账/租户端', 票据类型:'发票管理', 审批状态:'审批对接/日志'};
  el.innerHTML = `
  <div style="background:var(--blue-bg);border:1px solid #c2d5fb;border-radius:8px;padding:10px 16px;font-size:12.5px;color:var(--blue);margin-bottom:16px">
    📚 全部枚举值以本字典为<b>唯一来源</b>，各模块（PC / 小程序 / 大屏 / 接口）统一引用，禁止各自硬编码 —— 开发规范强制项（R-02）。
  </div>
  <div class="grid2">
  ${Object.entries(DB.dict).map(([k,vs])=>`
    <div class="card" style="margin-bottom:0">
      <h3>${k}<span class="more">引用：${usage[k]||'-'}</span></h3>
      <div>${vs.map(v=>badge(v,'blue')).join(' ')}</div>
      <div style="margin-top:10px;font-size:12px;color:var(--ink3)">共 ${vs.length} 项 · 字典编码 ${k.slice(0,2).toUpperCase()}-DICT</div>
    </div>`).join('')}
  </div>
  <div class="toolbar" style="margin-top:16px"><span class="sp"></span>
    <button class="btn" onclick="UI.toast('新增字典项需管理员权限，已打开编辑')">＋ 新增枚举值</button>
    <button class="btn" onclick="UI.toast('字典变更记录：房屋状态 V1→V2（2026-07-15 新增「预定」）')">变更记录</button>
  </div>`;
});

/* ================= R-10 合同模板 ================= */
PC.reg('/sys/contractTpl','合同模板', (el)=>{
  el.innerHTML = `
  <div class="toolbar"><span style="font-size:13px;color:var(--ink3)">按业态配置合同模板 · 电子签章变量自动带入 · 修改后仅对新签合同生效</span>
  <span class="sp"></span><button class="btn pri" onclick="PC.tplEdit('新建')">＋ 新建模板</button></div>
  ${table([
    {t:'业态模板',r:r=>`<span class="lk" onclick="PC.tplEdit('${r.cat}')">${r.cat}租赁合同模板</span>`},
    {t:'版本',r:r=>badge(r.ver,'cyan')},
    {t:'签章变量',r:r=>r.vars.map(v=>`<code style="font-size:11.5px;background:#f1f3f9;border-radius:4px;padding:1px 6px;margin-right:4px">${v}</code>`).join('')},
    {t:'配套附件/条款',k:'note'},
    {t:'操作',w:'170px',r:r=>`<button class="btn sm ghost" onclick="PC.tplEdit('${r.cat}')">编辑</button><button class="btn sm ghost" onclick="PC.tplPreview('${r.cat}')">预览效果</button>`}
  ], DB.contractTpls)}`;
});
PC.tplEdit = function(cat){
  const t = DB.contractTpls.find(x=>x.cat===cat) || {cat:'新建业态', ver:'V1.0', vars:['{{租户}}'], note:''};
  drawer('合同模板编辑 · '+t.cat, `
    <div class="frm" style="margin-bottom:14px">
      ${fld('模板名称', `<input class="ipt" value="${t.cat}租赁合同模板">`)}
      ${fld('版本号', `<input class="ipt" value="${t.ver}">`)}
    </div>
    <h4 style="margin-bottom:8px">模板正文（变量用 {{ }} 包裹，签章时自动带入业务数据）</h4>
    <textarea class="ipt" rows="12" style="width:100%;font-size:12.5px;line-height:1.9">第一条　甲方将 {{房号}} 出租给 {{租户姓名}} 使用，租期 {{租期}}。
第二条　租金 {{月租金}} 元/月，押金 {{押金}} 元，付款周期见补充协议。
第三条　免租期约定：{{免租期}}，免租期内仅计收水电费用。
第四条　水电费按智能表计实际用量结算，公摊按分摊规则计收。
第五条　本合同采用电子签章，与纸质合同具有同等法律效力。
（${t.note}）</textarea>
    <h4 style="margin:14px 0 8px">可用变量</h4>
    <div>${t.vars.concat(['{{签署日期}}','{{合同编号}}','{{甲方签章}}','{{乙方签名}}']).map(v=>`<code style="font-size:12px;background:#f1f3f9;border-radius:4px;padding:2px 8px;margin:0 6px 6px 0;display:inline-block">${v}</code>`).join('')}</div>
    <div style="margin-top:16px;text-align:right">
      <button class="btn" onclick="UI.close();PC.tplPreview('${t.cat}')">预览</button>
      <button class="btn pri" onclick="UI.close();UI.toast('模板已保存并发布新版本（历史合同不受影响）')">保存并发布</button></div>
  `);
};
PC.tplPreview = function(cat){
  const t = DB.contractTpls.find(x=>x.cat===cat) || DB.contractTpls[0];
  modal({title:'模板预览（变量已带入示例数据）', size:'lg', body:`
    <div style="border:1px solid var(--line);border-radius:10px;padding:26px 30px;background:#fff;font-size:13.5px;line-height:2.2">
      <div style="text-align:center;font-size:17px;font-weight:700;letter-spacing:4px;margin-bottom:14px">${t.cat}租赁合同</div>
      合同编号：HT20260801<br>出租方（甲方）：区域产业发展有限公司<br>承租方（乙方）：杭州恒力机械有限公司<br><br>
      第一条　甲方将 <b>3 号标准厂房 102</b> 出租给 <b>杭州恒力机械有限公司</b> 使用，租期 <b>2026-08-01 至 2027-07-31</b>。<br>
      第二条　租金 <b>33,600</b> 元/月，押金 <b>36,000</b> 元。<br>
      第三条　免租期约定：<b>装修期 2 个月（2026-08-01 ~ 2026-09-30）</b>，免租期内仅计收水电费用。<br>
      第四条　水电费按智能表计实际用量结算，公摊按分摊规则计收。<br>
      第五条　本合同采用电子签章，与纸质合同具有同等法律效力。<br><br>
      <div style="display:flex;justify-content:space-between;color:var(--ink3)"><span>甲方（电子签章）：区域产业发展有限公司</span><span>乙方（签名）：＊已实名签署＊</span></div>
    </div>`,
    footer:`<button class="btn" onclick="UI.close()">关闭</button><button class="btn pri" onclick="UI.close();UI.toast('已生成样例 PDF')">导出样例 PDF</button>`});
};

/* ================= R-11 功能开关 ================= */
PC.reg('/sys/features','功能开关', (el)=>{
  const bed = PC._bedMode ? 'on' : '';
  el.innerHTML = `
  <div class="card"><h3>业务功能开关</h3>
    ${table([
      {t:'功能',k:'f'},{t:'说明',k:'d'},{t:'默认',r:r=>badge(r.def,'gray')},{t:'状态',r:r=>r.sw},
      {t:'操作',r:r=>r.op}
    ],[
      {f:'宿舍床位管理', d:'企业整租宿舍按床位出租/计价/入住（公寓房源列表与入住办理联动）', def:'默认关',
       sw: badge(PC._bedMode?'已开启':'已关闭', PC._bedMode?'green':'gray'),
       op:`<button class="btn sm ${PC._bedMode?'':'pri'}" onclick="PC.toggleBed()">${PC._bedMode?'关闭':'开启'}</button>`},
      {f:'欠费自动断闸', d:'与「欠费联动策略」联动；关闭时仅手动分闸+提醒（默认推荐）', def:'默认关',
       sw: badge('已关闭','gray'),
       op:`<button class="btn sm" onclick="location.hash='#/water/strategy'">去配置</button>`},
      {f:'酒店钟点房超时自动加计', d:'超时按规则自动计费，退房结账自动带入', def:'默认开',
       sw: badge('已开启','green'),
       op:`<button class="btn sm" onclick="location.hash='#/estate/酒店/rate'">计费规则</button>`},
      {f:'门禁欠费联动限制', d:'按需求确认：不做欠费门禁限制，仅租约自动下发/退租回收+手动关闭', def:'已禁用',
       sw: badge('已禁用','gray'),
       op:`<button class="btn sm" onclick="location.hash='#/api/door'">门禁对接</button>`},
    ])}
  </div>`;
});
PC.toggleBed = function(){
  PC._bedMode = !PC._bedMode;
  UI.toast(PC._bedMode? '床位管理已开启：公寓房源出现床位视图，入住可按床位办理' : '床位管理已关闭');
  routeRefresh();
};

/* ================= R-16 上线初始化 ================= */
PC.reg('/sys/init','上线初始化', (el)=>{
  el.innerHTML = `
  <div class="row">
    <div class="card" style="flex:1.2"><h3>初始化五步</h3>
      ${timeline([
        {t:'① 下载导入模板', d:'合同/租户/欠费/表计底数/押金 5 套 Excel 模板', act:true},
        {t:'② 批量导入', d:'系统校验格式与必填项，错误行标记下载', act:true},
        {t:'③ 系统核对', d:'与原系统/台账逐字段比对', act:true},
        {t:'④ 差异处理', d:'差异逐条确认修正，留痕', act:true},
        {t:'⑤ 上线确认', d:'财务+片区双签确认后正式启用'}
      ])}
      <div style="margin-top:10px"><button class="btn" onclick="UI.toast('5 套模板已打包下载')">⬇️ 下载全部模板</button>
      <button class="btn pri" onclick="UI.toast('已上传：系统校验中，错误 0 行')">＋ 导入数据</button></div>
    </div>
    <div class="card"><h3>上线前核对清单</h3>
      ${['在租合同 186 份与台账一致','租户档案 212 户与合同一一对应','历史欠费 23 笔总额 ¥84,320 一致','表计底数与上月冻结读数一致（2 块待处理）','押金专户余额与台账一致','水电单价与物价备案一致','账单生成日/宽限期参数已确认'].map((x,i)=>`
      <div class="mrow" style="cursor:default"><div class="tx"><div class="tt" style="font-size:13px">${i===3?'☐':'☑'} ${x}</div></div>${i===3?badge('待处理','orange'):badge('通过','green')}</div>`).join('')}
    </div>
  </div>
  <div class="card"><h3>导入批次与核对结果</h3>
    ${table([
      {t:'数据项',k:'item'},{t:'模板',r:r=>`<span class="lk" onclick="UI.toast('${r.tpl} 下载中')">${r.tpl}</span>`},
      {t:'导入行数',k:'rows'},{t:'成功',r:r=>`<span style="color:var(--green)">${r.ok}</span>`},
      {t:'差异',r:r=>r.diff? `<b style="color:var(--red)">${r.diff}</b>` : '0'},
      {t:'状态',r:r=>badge(r.status, r.status==='已核对'?'green':'orange')},
      {t:'操作',r:r=>r.diff? `<button class="btn sm pri" onclick="PC.initDiff('${r.item}')">处理差异</button>` : `<button class="btn sm ghost" onclick="UI.toast('重新导入 ${r.item}')">重新导入</button>`}
    ], DB.initBatches)}
    <div style="margin-top:14px;text-align:right"><button class="btn pri" onclick="UI.confirm('上线确认','全部核对通过后，系统将正式启用并锁定初始化数据。确认上线？','UI.toast(\\'已提交财务+片区双签确认\\')')">✅ 全部核对通过，确认上线</button></div>
  </div>`;
});
PC.initDiff = function(item){
  drawer('差异处理 · '+item, `
    ${table([
      {t:'表计',k:'m'},{t:'导入底数',k:'a'},{t:'平台读数',k:'b'},{t:'差异原因',k:'d'},{t:'处理',r:r=>`<button class="btn sm pri" onclick="UI.toast('已按平台读数修正并留痕')">按平台修正</button> <button class="btn sm ghost" onclick="UI.toast('已标记人工复核')">人工复核</button>`}
    ],[
      {m:'623661807055（1 号楼公共电表）', a:'18,420.0', b:'18,662.4', d:'导入后平台又发生 2 日用量'},
      {m:'623661807061（2 号楼公共水表）', a:'3,210.5', b:'3,208.1', d:'原系统读数四舍五入差异'}
    ])}
    <div style="font-size:12.5px;color:var(--ink3);margin-top:12px">修正后自动更新「表计底数」核对状态，差异处理全程留痕。</div>
  `);
};

/* ================= R-09 / R-13 审批对接（内置审批停用，接入业主自有 OA） ================= */
PC.reg('/sys/flow','审批对接', (el)=>{
  el.innerHTML = `
  <div style="background:var(--orange-bg);border:1px solid #f4d9ae;border-radius:8px;padding:10px 16px;font-size:12.5px;color:var(--orange);margin-bottom:16px">
    ⚠️ 按业主确认（R-09/R-13）：系统<b>不再内置审批流</b>，需审批的事项自动推送至业主自有审批系统（OA），审批结果回调本系统执行。
  </div>
  <div class="row">
    <div class="card"><h3>OA 对接配置</h3>
      ${desc([
        ['OA 系统地址','<code>https://oa.example.cn/api</code>'],
        ['对接方式','Webhook 推送 + 审批结果回调'],
        ['AppKey','<code>yld-pms-8f3a21</code>（已配置）'],
        ['回调地址','<code>https://pms.example.cn/api/oa/callback</code>'],
        ['连通状态',badge('已联通 · 今日推送 3 次全部成功','green')],
        ['签名验签','HMAC-SHA256 双向验签']
      ],2)}
      <div style="margin-top:12px"><button class="btn" onclick="UI.toast('连通性测试成功 · 耗时 118ms')">连通性测试</button>
      <button class="btn pri" onclick="UI.toast('对接配置已保存')">保存配置</button></div>
    </div>
    <div class="card" style="flex:1.4"><h3>审批事件映射</h3>
      ${table([
        {t:'触发事件',k:'e'},{t:'推送时机',k:'w'},{t:'OA 审批通过后系统动作',k:'a'}
      ],[
        {e:'低于议价下限的定价/签约', w:'提交签约时拦截并推送', a:'放行签约流程，合同生效'},
        {e:'发票红冲', w:'财务发起红冲时推送', a:'执行红冲并允许重新开具'},
        {e:'押金退还', w:'退房结算完成时推送', a:'原路退回并通知租户'},
        {e:'费用减免/缓缴', w:'片区经理提交时推送', a:'账单金额调整并留痕'},
        {e:'资产报废', w:'报废申请提交时推送', a:'资产状态变更+残值入账'}
      ])}
    </div>
  </div>
  <div class="card"><h3>最近推送记录</h3>
    ${table([
      {t:'单号',k:'id'},{t:'事件',k:'e'},{t:'推送时间',k:'t'},{t:'OA 结果',r:r=>badge(r.r, r.r==='已通过'?'green':r.r==='审批中'?'orange':'red')},{t:'系统动作',k:'a'}
    ],[
      {id:'OA-1032', e:'押金退还（旭日新能源 ¥36,000）', t:'07-28 10:12', r:'已通过', a:'已退款并通知租户 ✅'},
      {id:'OA-1031', e:'发票红冲（FP8003）', t:'07-27 15:40', r:'已通过', a:'红冲完成，允许重开 ✅'},
      {id:'OA-1030', e:'低于议价下限签约（7 号车间 A 区）', t:'07-26 09:30', r:'审批中', a:'签约流程挂起等待 ⏳'}
    ])}
  </div>`;
});

/* ================= R-17 操作日志（高危操作审计） ================= */
PC.reg('/sys/log','操作日志', (el)=>{
  const logs = [
    {t:'08:12',u:'chenzy',m:'设备管理',d:'远程分闸 623661807018（欠费停电 · 二次确认 · 已通知租户）',ip:'10.8.0.12',high:true},
    {t:'08:05',u:'zhoumin',m:'收款核销',d:'核销 YS2026 ¥12,600（银行转账）',ip:'10.8.0.22',high:true},
    {t:'07:58',u:'linxf',m:'入住办理',d:'办理 1 号宿舍楼 512 入住，生成合同 HT20260728',ip:'10.8.0.15'},
    {t:'07:52',u:'zhoumin',m:'发票管理',d:'红冲 FP8003（OA 审批 OA-1031 通过后执行）',ip:'10.8.0.22',high:true},
    {t:'07:41',u:'admin',m:'数据对接',d:'刷新表计平台 Token',ip:'10.8.0.2'},
    {t:'07:30',u:'chenzy',m:'催收管理',d:'批量催缴发送 23 户（微信+短信）',ip:'10.8.0.12'},
    {t:'07:15',u:'chenzy',m:'设备管理',d:'远程合闸 623661807018（缴费到账复电）',ip:'10.8.0.12',high:true},
  ];
  el.innerHTML = `
  <div style="background:var(--red-bg);border:1px solid #f3c1c1;border-radius:8px;padding:10px 16px;font-size:12.5px;color:var(--red);margin-bottom:16px">
    🔐 高危操作（远程分合闸 / 收款核销 / 发票红冲）<b>强制留痕不可删除</b>，保留 3 年，支持审计导出（R-17）。
  </div>
  <div class="card">
    <div class="toolbar"><input class="ipt" placeholder="操作人 / 关键词" style="width:170px"><input class="ipt" type="date" value="2026-07-29">
      <select class="ipt"><option>全部操作</option><option>仅高危操作</option></select>
      <button class="btn" onclick="UI.toast('查询成功（演示）')">查询</button><span class="sp"></span>
      <button class="btn" onclick="UI.toast('日志已导出')">导出</button>
      <button class="btn pri" onclick="UI.toast('审计包已生成：含操作日志+高危操作凭证，已加密签名')">🛡️ 审计导出</button></div>
    ${table([
      {t:'时间',k:'t'},{t:'操作人',k:'u'},{t:'模块',r:r=>badge(r.m,'blue')},
      {t:'级别',r:r=>r.high? badge('高危','red') : badge('常规','gray')},
      {t:'操作内容',k:'d'},{t:'IP',k:'ip'}
    ], logs)}
  </div>`;
});

/* ================= R-03 数据权限配置（角色数据权限自定义） ================= */
PC.roleEdit = function(){
  drawer('角色权限配置 · 片区经理', `
    <h4 style="margin-bottom:8px">功能权限</h4>
    ${['工作台','片区管理','设备管理','水电费管理','宿舍管理','厂房管理','车位管理','应收应付','物业服务','数据报表'].map(m=>`
    <div class="mrow" style="cursor:default"><div class="tx"><div class="tt">${m}</div></div>
      <span style="font-size:12px;color:var(--ink3)">查看 ☑&nbsp; 新增 ☑&nbsp; 编辑 ☑&nbsp; 删除 ☐</span></div>`).join('')}
    <h4 style="margin:18px 0 8px">数据权限（R-03 · 按角色自定义可见片区）</h4>
    ${table([
      {t:'片区',k:'a'},
      {t:'查看',r:r=>`<input type="checkbox" ${r.v?'checked':''}>`},
      {t:'新增/编辑',r:r=>`<input type="checkbox" ${r.e?'checked':''}>`},
      {t:'高危操作(分闸/核销)',r:r=>`<input type="checkbox" ${r.h?'checked':''}>`}
    ],[
      {a:'城东产业园', v:1, e:1, h:1},
      {a:'滨江科创园', v:0, e:0, h:0},
      {a:'临港智造园', v:0, e:0, h:0},
      {a:'全部片区（汇总只读）', v:0, e:0, h:0}
    ])}
    <div style="font-size:12.5px;color:var(--ink3);margin-top:8px">未勾选片区对该角色完全不可见（列表/报表/工作台均过滤）。顶栏「📍 数据权限视角」可预览隔离效果。</div>
    <div style="margin-top:14px;text-align:right"><button class="btn pri" onclick="UI.close();UI.toast('权限与数据范围已保存，即时生效')">保存权限</button></div>
  `, '640px');
};

/* ================= R-01 房源批量导入 / 批量生成 ================= */
PC.roomBatch = function(cat){
  modal({title:'批量建档 · '+cat, size:'lg', body:`
    <div class="tabs" style="margin-bottom:14px">
      <div class="t on" onclick="PC.batchTab(this,'gen')">⚡ 按规则批量生成</div>
      <div class="t" onclick="PC.batchTab(this,'imp')">📥 Excel 批量导入</div>
    </div>
    <div id="bt-gen">
      <div class="frm">
        ${fld('所属片区', `<select class="ipt">${DB.areas.map(a=>`<option>${a.name}</option>`).join('')}</select>`)}
        ${fld('楼栋', `<select class="ipt">${DB.buildings.filter(b=>b.cat===cat).map(b=>`<option>${b.name}</option>`).join('')}<option>＋ 新建楼栋</option></select>`)}
        ${fld('楼层范围', `<div style="display:flex;gap:8px;align-items:center"><input class="ipt" style="width:70px" value="1"> 至 <input class="ipt" style="width:70px" value="6"></div>`)}
        ${fld('每层户数', `<input class="ipt" type="number" value="8">`)}
        ${fld('房号规则', `<select class="ipt"><option>楼层+序号（101~108）</option><option>楼层+字母（1A~1H）</option></select>`)}
        ${fld('建筑面积（㎡/间）', `<input class="ipt" value="35">`)}
        ${fld('租金标准', `<input class="ipt" value="1200">`)}
        ${fld('初始房态', `<select class="ipt"><option>全部空置</option><option>导入在租状态</option></select>`)}
      </div>
      <div style="background:#fafbfe;border:1px solid var(--line);border-radius:8px;padding:12px 14px;font-size:13px;margin-top:12px">
        📋 预览：将生成 <b>6 层 × 8 户 = 48 间</b>房源（101-108 … 601-608），自动关联片区与楼栋，表计可后续批量绑定。
      </div>
    </div>
    <div id="bt-imp" style="display:none">
      <div style="display:flex;gap:10px;margin-bottom:12px">
        <button class="btn" onclick="UI.toast('房源导入模板.xlsx 下载中')">⬇️ 下载导入模板</button>
        <span style="font-size:12.5px;color:var(--ink3);line-height:2">模板含：片区/楼栋/房号/面积/租金/状态/租户(选填)</span>
      </div>
      <div style="border:1.5px dashed var(--line);border-radius:10px;padding:30px;text-align:center;color:var(--ink3);cursor:pointer" onclick="UI.toast('已选择文件：房源台账.xlsx（312 行）')">📂 点击选择或拖拽 Excel 文件到此处</div>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;color:#15803d;font-size:13px;margin-top:12px">
        ✅ 校验通过：312 行 · 格式正确 · 重复房号 0 · 缺必填 0（错误行会标红并提供下载）
      </div>
    </div>`,
    footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('批量建档完成：48 间房源已创建并归属所选片区')">确认生成 / 导入</button>`});
};
PC.batchTab = function(el, tab){
  el.parentNode.querySelectorAll('.t').forEach(x=>x.classList.remove('on'));
  el.classList.add('on');
  document.getElementById('bt-gen').style.display = tab==='gen'?'':'none';
  document.getElementById('bt-imp').style.display = tab==='imp'?'':'none';
};

/* ================= R-04 抄表异常复核闭环 ================= */
PC.readingReview = function(id){
  const r = DB.readings.find(x=>x.id===id) || DB.readings[0];
  modal({title:'异常复核处理 · '+r.id, size:'lg', body:`
    ${desc([['表计',r.mname],['房源',r.room],['本期读数',r.value],['异常类型',badge('用量突增 +182%','red')],['抄表方式',r.by],['关联账单','ZD2026071042（已生成待缴）']],3)}
    <div class="frm" style="margin-top:14px">
      ${fld('复核结论', `<select class="ipt"><option>读数无误，维持原账单</option><option>读数有误，修正读数并重算账单</option><option>表计故障，登记换表并重算</option></select>`, true)}
      ${fld('修正后读数', `<input class="ipt" value="${(Number(r.value)-186.4).toFixed(2)}"><div class="hint">修正后自动红冲原账单并按新读数重算</div>`)}
      ${fld('复核说明', `<textarea class="ipt" rows="2" placeholder="复核依据：现场照片/历史曲线/租户确认"></textarea>`, true)}
    </div>
    <div style="background:var(--blue-bg);border-radius:8px;padding:10px 14px;font-size:12.5px;color:var(--blue);margin-top:12px">
      闭环流程：异常标记 → 人工复核 → 修正读数 → 原账单红冲 → 按新读数自动重算推送 → 全程留痕可审计（R-04）
    </div>`,
    footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('复核完成：账单已红冲并按新读数重算，租户端同步更新')">提交复核结论</button>`});
};
})();
