/* ===== v3 · 产业管理通用引擎（宿舍/厂房/写字楼/商业/酒店/其他）+ 车位管理 ===== */
(function(){
const {table, badge, modal, drawer, toast, desc, fld, close, money, STATUS_COLOR, barChart, lineChart, donut, timeline, stat} = UI;
const esc = UI.esc;
const CATS = ['公寓','厂房','写字楼','商业','酒店','其他'];
const unitOf = cat => (cat==='厂房'||cat==='其他') ? '元/㎡·月' : '元/月';

function catRooms(cat){ return DB.rooms.filter(r=>r.cat===cat); }
function catStats(cat){
  const rs = catRooms(cat);
  const g = s => rs.filter(r=>r.status===s).length;
  return {total:rs.length, vacant:g('空置'), rented:g('已租'), expire:g('到期'), repair:g('维修'), booked:g('预定'),
    rate: rs.length? Math.round((g('已租')+g('到期'))/rs.length*1000)/10 : 0};
}

/* ---------- 房态监控（楼层平面图） ---------- */
function estateMap(el, cat){
  const bs = DB.buildings.filter(b=>b.cat===cat);
  const st = catStats(cat);
  el.innerHTML = `
  <div class="grid4">
    ${stat('房源总数', st.total, `${bs.length} 栋楼`)}
    ${stat('出租率', st.rate+'%', `已租 ${st.rented+st.expire} · 空置 ${st.vacant}`)}
    ${stat('即将到期', st.expire, '需跟进续签', "location.hash='#/rpt/contract'")}
    ${stat('维修/预定', st.repair+' / '+st.booked, '空置 '+st.vacant+' 间可租')}
  </div>
  <div class="card">
    <div class="toolbar">
      ${bs.map((b,i)=>`<span class="chip ${i===0?'on':''}" id="chip-${b.id}" onclick="PC.switchB('${cat}','${b.id}')">${b.name}</span>`).join('')}
      <span class="sp"></span>
      ${cat==='厂房'?`<button class="btn" onclick="PC.floorEditor('${bs[0].id}')">✏️ 图形化编辑器</button>`:''}
      <div class="legend">
        <span><i style="background:var(--green)"></i>空置</span><span><i style="background:var(--blue)"></i>已租</span>
        <span><i style="background:var(--orange)"></i>到期</span><span><i style="background:var(--red)"></i>维修</span>
        <span><i style="background:var(--purple)"></i>预定</span>
      </div>
    </div>
    <div id="fp"></div>
  </div>`;
  renderFloorPlan(cat, bs[0].id);
}
function renderFloorPlan(cat, bid){
  const b = DB.buildings.find(x=>x.id===bid);
  const rs = DB.rooms.filter(r=>r.bid===bid);
  const cls = {空置:'c-vacant',已租:'c-rented',到期:'c-expire',维修:'c-repair',预定:'c-booked'};
  let h = '<div class="floorplan">';
  for(let f=b.floors; f>=1; f--){
    h += `<div class="frow"><div class="flab">${f}F</div>`;
    rs.filter(r=>r.floor===f).forEach(r=>{
      h += `<div class="cell ${cls[r.status]}" onclick="PC.roomDetail('${r.id}')">
        <div class="rn">${r.no}</div><div class="rt">${r.status}${r.tname?' · '+r.tname.slice(0,4):''}</div></div>`;
    });
    h += '</div>';
  }
  document.getElementById('fp').innerHTML = h + '</div>';
}
PC.switchB = function(cat, bid){
  document.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));
  document.getElementById('chip-'+bid).classList.add('on');
  renderFloorPlan(cat, bid);
};
CATS.forEach(cat=> PC.reg(`/estate/${cat}/map`, cat+'房态监控', el=>estateMap(el,cat)) );

/* ---------- 房间详情 ---------- */
PC.roomDetail = function(id){
  const r = DB.rooms.find(x=>x.id===id);
  const contract = DB.contracts.find(c=>c.room===id);
  const myBills = DB.bills.filter(b=>contract && b.contract===contract.id).slice(0,6);
  const myMeters = DB.meters.filter(m=>m.room===id);
  const t = DB.tenants.find(x=>x.id===r.tenant);
  const rentText = (r.cat==='厂房'||r.cat==='其他') ? `¥${r.rent} 元/㎡·月（月租约 ¥${money(r.rent*r.size)}）` : `¥${money(r.rent)} /月`;
  drawer(`房源详情 · ${r.bname} ${r.no}`, `
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
      ${badge(r.status, STATUS_COLOR[r.status])} ${badge(r.cat,'blue')}
      <span style="margin-left:auto;display:flex;gap:8px">
      ${r.status==='空置'||r.status==='预定'?`<button class="btn sm pri" onclick="UI.close();location.hash='#/estate/${r.cat}/check'">办理入住</button>`:''}
      ${r.status==='已租'||r.status==='到期'?`<button class="btn sm" onclick="PC.renew('${r.id}')">续租</button><button class="btn sm danger" onclick="PC.checkout('${r.id}')">办理退房</button>`:''}
      ${r.status==='维修'?`<button class="btn sm" onclick="UI.toast('已转为空置，可重新招租')">维修完成</button>`:''}
      <button class="btn sm" onclick="PC.roomEdit('${r.id}')">编辑</button></span>
    </div>
    ${desc([['所属片区',badge(DB.areaName(r.area),'gray')],['所属楼栋',r.bname],['楼层/房号',r.floor+'F / '+r.no],['建筑面积',r.size+' ㎡'],
      ['租金标准',rentText],['配套设施', r.cat==='公寓'?'空调、热水器、独立卫浴、宽带': r.cat==='厂房'?'行车、380V动力电、卸货平台':'精装修、中央空调、独立电表'],
      ['当前租户', r.tname? `<span class="lk" onclick="PC.tenant('${r.tname}')">${r.tname}</span>`:'—'],
      ['合同到期', r.endDate||'—'],['押金', r.deposit? '¥'+money(r.deposit):'—'],['电表/水表', myMeters.length? myMeters.map(m=>`<span class="lk" onclick="PC.meterDetail('${m.id}')">${m.type.slice(0,1)}表 ${m.no.slice(-6)}</span>`).join(' '):'未绑定']],3)}
    ${r.cat==='厂房'?`<h3 style="font-size:14px;margin:16px 0 10px">厂房技术参数</h3>
    ${desc([['层高','8 m'],['地面承重','1 t/㎡'],['电力容量','250 kVA'],['消防等级','丙类'],['电梯','2 吨货梯 × 2'],['行车','10 t × 1']],3)}
    <h3 style="font-size:14px;margin:16px 0 10px">实景图片 / 视频（在线看房）</h3>
    <div style="display:flex;gap:10px">
      ${[1,2,3].map(i=>`<div style="flex:1;height:96px;border-radius:8px;background:linear-gradient(135deg,#dbe7ff,#eef3ff);display:flex;align-items:center;justify-content:center;color:#7c9bdf;font-size:24px;cursor:pointer" onclick="UI.toast('打开大图预览（演示）')">🏭</div>`).join('')}
      <div style="flex:1;height:96px;border-radius:8px;background:#101c34;display:flex;align-items:center;justify-content:center;color:#5b8cff;font-size:24px;cursor:pointer" onclick="UI.toast('播放实景视频（演示）')">▶</div>
    </div>`:''}
    ${contract? `<h3 style="font-size:14px;margin:16px 0 10px">当前合同</h3>
    ${table([{t:'合同号',r:x=>`<span class="lk" onclick="PC.contract('${x.id}')">${x.id}</span>`},{t:'租期',r:x=>x.start+' ~ '+x.end},{t:'租金',r:x=>'¥'+money(x.rent)+' '+x.unit},{t:'状态',r:x=>badge(x.status, x.status==='履约中'?'blue':'orange')}], [contract])}`:''}
    <h3 style="font-size:14px;margin:16px 0 10px">缴费记录</h3>
    ${myBills.length? table([{t:'账单',k:'id'},{t:'类型',k:'type'},{t:'账期',k:'month'},{t:'金额',r:x=>'¥'+money(x.amount)},{t:'状态',r:x=>badge(x.status, STATUS_COLOR[x.status])}], myBills) : '<div class="empty">暂无缴费记录</div>'}
  `, '780px');
};
PC.roomEdit = function(id){
  const r = DB.rooms.find(x=>x.id===id);
  modal({title:'编辑房源 · '+r.bname+' '+r.no, size:'lg', body:`<div class="frm">
    ${fld('楼栋', `<input class="ipt" value="${r.bname}">`)}
    ${fld('房号', `<input class="ipt" value="${r.no}">`)}
    ${fld('建筑面积（㎡）', `<input class="ipt" value="${r.size}">`)}
    ${fld('租金标准（${unitOf(r.cat)}）', `<input class="ipt" value="${r.rent}">`)}
    ${fld('房态', `<select class="ipt"><option>${r.status}</option>${['空置','已租','预定','维修','到期'].filter(s=>s!==r.status).map(s=>`<option>${s}</option>`).join('')}</select>`)}
    ${fld('配套设施', `<input class="ipt" value="空调、热水器、宽带">`)}
    ${fld('备注', `<textarea class="ipt" rows="2"></textarea>`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('房源信息已保存')">保存</button>`});
};

/* ---------- 房源列表 ---------- */
function estateList(el, cat){
  const rs = catRooms(cat);
  el.innerHTML = `<div class="card">
    <div class="toolbar">
      <input class="ipt" placeholder="房号 / 租户" style="width:150px" onkeydown="if(event.key==='Enter')UI.toast('查询成功（演示）')">
      <select class="ipt" id="es-area" onchange="PC.estateFilter('${cat}')"><option value="">全部片区</option>${DB.areas.filter(a=>DB.buildings.some(b=>b.area===a.id&&b.cat===cat)).map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}</select>
      <select class="ipt"><option>全部楼栋</option>${DB.buildings.filter(b=>b.cat===cat).map(b=>`<option>${b.name}</option>`).join('')}</select>
      <select class="ipt"><option>全部状态</option><option>空置</option><option>已租</option><option>到期</option><option>维修</option><option>预定</option></select>
      <button class="btn" onclick="UI.toast('查询成功（演示）')">查询</button>
      <span class="sp"></span>
      <button class="btn" onclick="UI.toast('房源台账已导出')">导出</button>
      <button class="btn pri" onclick="PC.roomAdd('${cat}')">＋ 新增房源</button>
    </div>
    <div id="es-tb">${estateTable(cat, rs)}</div>
    <div class="pager">共 ${rs.length} 条 <span class="on">1</span><span onclick="UI.toast('翻页（演示）')">2</span></div>
  </div>`;
}
function estateTable(cat, rs){
  return table([
      {t:'房号',r:r=>`<span class="lk" onclick="PC.roomDetail('${r.id}')">${r.bname} ${r.no}</span>`},
      {t:'所属片区',r:r=>badge(DB.areaName(r.area),'gray')},
      {t:'面积(㎡)',k:'size'},
      {t:`租金(${unitOf(cat)})`,k:'rent'},
      {t:'状态',r:r=>badge(r.status, STATUS_COLOR[r.status])},
      {t:'租户',r:r=>r.tname?`<span class="lk" onclick="PC.tenant('${r.tname}')">${r.tname}</span>`:'—'},
      {t:'合同到期',r:r=>r.endDate||'—'},
      {t:'操作',w:'150px',r:r=>`<button class="btn sm ghost" onclick="PC.roomDetail('${r.id}')">详情</button><button class="btn sm ghost" onclick="PC.roomEdit('${r.id}')">编辑</button>`}
    ], rs.slice(0,16));
}
PC.estateFilter = function(cat){
  const aid = document.getElementById('es-area').value;
  const rs = DB.rooms.filter(r=>r.cat===cat && (!aid || r.area===aid));
  document.getElementById('es-tb').innerHTML = estateTable(cat, rs);
  UI.toast(aid? '已筛选：'+DB.areaName(aid)+'（'+rs.length+' 间）' : '已显示全部片区');
};
CATS.forEach(cat=> PC.reg(`/estate/${cat}`, cat+'房源管理', el=>estateList(el,cat)) );
PC.roomAdd = function(cat){
  const areaOpts = DB.areas.filter(a=>DB.buildings.some(b=>b.area===a.id&&b.cat===cat));
  modal({title:'新增房源 · '+cat, size:'lg', body:`<div class="frm">
    ${fld('所属片区', `<select class="ipt" id="ra-area" onchange="PC.roomAreaChange('${cat}')">${areaOpts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}</select><div class="hint">必选：房源归属片区后，账单/表计/报表自动按片区归集</div>`, false, true)}
    ${fld('所属楼栋', `<select class="ipt" id="ra-bld"></select><div class="hint">仅显示所选片区下的${cat}楼栋</div>`, false, true)}
    ${fld('楼层', `<input class="ipt" type="number" value="1">`)}
    ${fld('房号', `<input class="ipt" placeholder="如 101">`, false, true)}
    ${fld('建筑面积（㎡）', `<input class="ipt" type="number">`, false, true)}
    ${fld('租金标准（${unitOf(cat)}）', `<input class="ipt" type="number">`, false, true)}
    ${fld('初始房态', `<select class="ipt"><option>空置</option><option>维修</option></select>`)}
    ${fld('配套设施', `<input class="ipt">`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('房源已创建')">保存</button>`});
  PC.roomAreaChange(cat);
};
PC.roomAreaChange = function(cat){
  const aid = document.getElementById('ra-area').value;
  const bs = DB.buildings.filter(b=>b.area===aid && b.cat===cat);
  document.getElementById('ra-bld').innerHTML = bs.map(b=>`<option value="${b.id}">${b.name}</option>`).join('') + '<option value="">＋ 在本片区新建楼栋</option>';
};

/* ---------- 入住 / 退房办理（宿舍） ---------- */
PC.reg('/estate/公寓/check','入住/退房办理', (el)=>{
  el.innerHTML = `
  <div class="row">
    <div class="card">
      <h3>🛏️ 入住办理（五步完成）</h3>
      ${timeline([
        {t:'① 选房', d:'从房态图选择空置房间', act:true},
        {t:'② 录入租户信息', d:'姓名、证件、联系方式，OCR 识别身份证'},
        {t:'③ 上传证件', d:'身份证 / 营业执照照片'},
        {t:'④ 生成合同并电子签章', d:'租期、租金、押金自动带入'},
        {t:'⑤ 收押金与首期租金', d:'扫码收款，自动更新房态并下发门禁/表计开户'}
      ])}
      <button class="btn pri" style="margin-top:10px" onclick="PC.checkin()">开始办理入住</button>
    </div>
    <div class="card">
      <h3>📤 退房办理</h3>
      ${timeline([
        {t:'① 退房确认', d:'选择退租房间与退房日期', act:true},
        {t:'② 物品交接', d:'按交接清单逐项核验（钥匙、空调遥控、家具）'},
        {t:'③ 费用结算', d:'未缴账单 + 水电读数结算 + 违约金'},
        {t:'④ 押金退还', d:'原路退回，审批后 7 个工作日内到账'},
        {t:'⑤ 更新房态', d:'房间转为空置/待保洁，回收门禁权限'}
      ])}
      <button class="btn" style="margin-top:10px" onclick="PC.checkoutPicker()">开始办理退房</button>
    </div>
  </div>
  <div class="card"><h3>近期办理记录</h3>
    ${table([{t:'时间',k:'t'},{t:'业务',r:r=>badge(r.b, r.b==='入住'?'green':'orange')},{t:'房间',k:'room'},{t:'租户',k:'tn'},{t:'经办人',k:'op'},{t:'状态',r:r=>badge(r.s,'green')}],[
      {t:'07-28 14:20',b:'入住',room:'1 号宿舍楼 512',tn:'罗文轩',op:'陈志远',s:'已完成'},
      {t:'07-27 10:05',b:'退房',room:'2 号宿舍楼 208',tn:'孙秀英',op:'陈志远',s:'已完成'},
      {t:'07-25 16:40',b:'入住',room:'1 号宿舍楼 306',tn:'马涛',op:'林晓峰',s:'已完成'},
      {t:'07-24 09:30',b:'退房',room:'1 号宿舍楼 411',tn:'何桂英',op:'陈志远',s:'已完成'}])}
  </div>`;
});
PC.checkin = function(){
  modal({title:'入住办理 · 第 1 步 选房', size:'lg', body:`
    <div class="frm">
      ${fld('楼栋', `<select class="ipt"><option>1 号宿舍楼</option><option>2 号宿舍楼</option></select>`)}
      ${fld('房间（仅显示空置/预定）', `<select class="ipt">${DB.rooms.filter(r=>r.cat==='公寓'&&(r.status==='空置'||r.status==='预定')).slice(0,6).map(r=>`<option>${r.no}（${r.size}㎡ · ¥${r.rent}/月）</option>`).join('')}</select>`)}
      ${fld('租户姓名', `<input class="ipt" placeholder="个人姓名 / 企业名称">`, false, true)}
      ${fld('联系电话', `<input class="ipt" placeholder="用于开通小程序账号">`, false, true)}
      ${fld('证件号码', `<input class="ipt" placeholder="身份证 / 统一社会信用代码（支持 OCR 识别上传）">`, true)}
      ${fld('紧急联系人', `<input class="ipt">`)}
      ${fld('租期', `<select class="ipt"><option>12 个月</option><option>6 个月</option><option>24 个月</option></select>`)}
      ${fld('付款周期', `<select class="ipt"><option>月付</option><option>季付</option><option>年付</option></select>`)}
      ${fld('起租日期', `<input class="ipt" type="date" value="2026-08-01">`)}
      ${fld('押金', `<input class="ipt" value="¥ 2,000（押一）">`)}
      ${fld('证件上传', `<div style="border:1.5px dashed var(--line);border-radius:8px;padding:14px;text-align:center;color:var(--ink3);font-size:12.5px;cursor:pointer" onclick="UI.toast('OCR 识别成功（演示）')">📷 上传身份证正反面 / 营业执照</div>`, true)}
    </div>`,
    footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="PC.checkin2()">下一步：生成合同 →</button>`});
};
PC.checkin2 = function(){
  modal({title:'入住办理 · 第 2 步 合同签署与收款', size:'lg', body:`
    <div style="background:#fafbfe;border:1px solid var(--line);border-radius:8px;padding:14px;font-size:13px;line-height:2;margin-bottom:12px">
    📄 合同编号 HT20260729<b>（自动生成）</b> · 租期 2026-08-01 ~ 2027-07-31 · 租金 ¥1,350/月 · 押金 ¥2,000<br>
    签署方式：<b>电子签章</b>（租客将通过微信小程序实名签署）</div>
    <div class="frm">
      ${fld('首期收款', `<select class="ipt"><option>押金 + 首月租金（¥3,350）</option><option>仅押金</option></select>`, true)}
      ${fld('收款方式', `<select class="ipt"><option>微信扫码</option><option>支付宝</option><option>POS / 银行转账</option></select>`, true)}
    </div>`,
    footer:`<button class="btn" onclick="UI.close()">上一步</button><button class="btn pri" onclick="UI.close();UI.toast('入住办理完成：合同已推送签署，房态已更新，门禁权限已下发')">确认收款并完成办理</button>`});
};
PC.checkoutPicker = function(){
  const rented = DB.rooms.filter(r=>r.cat==='公寓'&&(r.status==='已租'||r.status==='到期')).slice(0,8);
  modal({title:'选择退房房间', size:'lg', body: table([
    {t:'房间',r:r=>r.bname+' '+r.no},{t:'租户',k:'tname'},{t:'合同到期',k:'endDate'},
    {t:'操作',r:r=>`<button class="btn sm pri" onclick="PC.checkout('${r.id}')">办理退房</button>`}
  ], rented)});
};
PC.checkout = function(roomId){
  const r = DB.rooms.find(x=>x.id===roomId);
  modal({title:'退房结算 · '+r.bname+' '+r.no, size:'lg', body:`
    ${desc([['租户',r.tname||'-'],['退房日期','2026-07-29'],['合同到期',r.endDate||'-'],['押金','¥'+money(r.deposit||2000)]],2)}
    <h4 style="margin:16px 0 8px">费用结算单</h4>
    ${table([{t:'项目',k:'n'},{t:'金额',r:x=>`<span style="color:${x.a<0?'var(--green)':'var(--red)'}">${x.a<0?'+':'-'} ¥${money(Math.abs(x.a))}</span>`},{t:'说明',k:'d'}],[
      {n:'未缴账单',a:-1350,d:'7 月租金'},
      {n:'水电费结算（抄表读数）',a:-286.4,d:'电 268.4 + 水 18'},
      {n:'物品交接扣款',a:0,d:'交接清单 8 项核验通过'},
      {n:'违约金',a:0,d:'合同到期正常退租'},
      {n:'押金退还',a:(r.deposit||2000),d:'扣除上述费用后原路退回'}])}
    <div style="text-align:right;font-size:15px;margin-top:8px">应退押金：<b style="color:var(--green)">¥${money((r.deposit||2000)-1636.4)}</b></div>
    <h4 style="margin:16px 0 8px">物品交接清单</h4>
    <div style="font-size:13px;color:var(--ink2)">☑ 钥匙 ×2　☑ 门禁卡 ×1　☑ 空调遥控器　☑ 热水器完好　☑ 家具家电完好　☑ 卫生验收</div>`,
    footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('退房完成：押金退款已提交审批，房态更新为空置，门禁权限已回收')">确认结算并退房</button>`});
};
PC.renew = function(roomId){
  const r = DB.rooms.find(x=>x.id===roomId);
  modal({title:'续租办理 · '+r.bname+' '+r.no, body:`<div class="frm">
    ${fld('原租期', `<input class="ipt" value="~ ${r.endDate}" disabled>`)}
    ${fld('续租时长', `<select class="ipt"><option>12 个月</option><option>6 个月</option></select>`)}
    ${fld('新租金（${unitOf(r.cat)}）', `<input class="ipt" value="${r.rent}">`)}
    ${fld('生效日期', `<input class="ipt" type="date" value="${r.endDate||'2026-08-01'}">`)}
    ${fld('备注', `<textarea class="ipt" rows="2" placeholder="租金调整说明等"></textarea>`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('续租合同已生成并推送电子签署')">生成续租合同</button>`});
};

/* ---------- 空置率统计 ---------- */
PC.reg('/estate/公寓/stats','空置率统计', (el)=>{
  const st = catStats('公寓');
  el.innerHTML = `
  <div class="grid4">
    ${stat('当前空置率', (100-st.rate).toFixed(1)+'%', `空置 ${st.vacant} / 总数 ${st.total}`)}
    ${stat('平均空置时长', '23 天', '超 60 天空置 2 间', null)}
    ${stat('本月新增空置', 3, '退租 3 · 入住 5')}
    ${stat('租金坪效', '¥1.42/㎡·天', '环比 +3.2%')}
  </div>
  <div class="row">
    <div class="card" style="flex:1.5"><h3>空置率趋势（近 12 个月）</h3>
      ${lineChart([{name:'空置率 %', data:[8.2,7.5,9.1,10.4,9.8,8.6,7.9,8.8,9.5,11.2,10.1,(100-st.rate)], color:'#ea8600'}], DB.months, {h:230})}
    </div>
    <div class="card"><h3>空置原因分析</h3>
      ${donut([{l:'价格偏高',v:5,c:'#dc2626'},{l:'配套待完善',v:3,c:'#ea8600'},{l:'新退租待保洁',v:4,c:'#2563eb'},{l:'季节因素',v:2,c:'#16a34a'}],{center:st.vacant,centerLabel:'空置房源'})}
    </div>
  </div>
  <div class="card"><h3>分楼栋空置明细</h3>
    ${table([{t:'楼栋',k:'name'},{t:'总房源',k:'total'},{t:'空置',k:'vacant'},{t:'空置率',r:r=>`<b style="color:${r.rate>15?'var(--red)':'inherit'}">${r.rate}%</b>`},{t:'运营建议',k:'tip'}],
      DB.buildings.filter(b=>b.cat==='公寓').map(b=>{
        const rs = DB.rooms.filter(r=>r.bid===b.id); const v = rs.filter(r=>r.status==='空置').length;
        const rate = Math.round(v/rs.length*100);
        return {name:b.name, total:rs.length, vacant:v, rate, tip: rate>15?'建议下调租金 5% 或推出短租产品':'保持当前定价策略'};
      }))}
  </div>`;
});

/* ---------- 租金账单（各业态通用） ---------- */
CATS.forEach(cat=>{
  PC.reg(`/estate/${cat}/bills`, cat+'租金账单', (el)=>{
    const contracts = DB.contracts.filter(c=>c.cat===cat);
    const bills = DB.bills.filter(b=>contracts.some(c=>c.id===b.contract));
    el.innerHTML = `
    <div class="grid4">
      ${stat('本月应收租金', '¥'+money(bills.filter(b=>b.month==='2026-07'&&b.type==='租金').reduce((a,b)=>a+b.amount,0)))}
      ${stat('已收', '¥'+money(bills.filter(b=>b.month==='2026-07'&&b.type==='租金'&&b.status==='已缴').reduce((a,b)=>a+b.amount,0)))}
      ${stat('待缴', bills.filter(b=>b.status==='待缴').length+' 笔')}
      ${stat('逾期', bills.filter(b=>b.status==='逾期').length+' 笔', null, "location.hash='#/fin/collect'")}
    </div>
    <div class="card">
      <div class="toolbar">
        <select class="ipt"><option>2026-07</option><option>2026-06</option></select>
        <select class="ipt"><option>全部状态</option><option>待缴</option><option>已缴</option><option>逾期</option></select>
        <input class="ipt" placeholder="租户 / 房号" style="width:150px">
        <button class="btn" onclick="UI.toast('查询成功（演示）')">查询</button>
        <span class="sp"></span>
        <button class="btn" onclick="UI.toast('缴费明细已导出 Excel')">导出明细</button>
        <button class="btn pri" onclick="PC.genRentBills('${cat}')">＋ 生成租金账单</button>
      </div>
      ${table([
        {t:'账单号',r:r=>`<span class="lk" onclick="PC.billDetail('${r.id}')">${r.id}</span>`},
        {t:'类型',k:'type',r:r=>badge(r.type,'blue')},
        {t:'所属片区',r:r=>badge(DB.areaName(DB.billArea(r)),'gray')},
        {t:'租户',k:'tname'},{t:'房源',k:'room'},{t:'账期',k:'month'},
        {t:'金额',r:r=>'¥'+money(r.amount)},{t:'应缴日',k:'due'},
        {t:'状态',r:r=>badge(r.status, STATUS_COLOR[r.status])},{t:'支付方式',r:r=>r.channel||'—'},
        {t:'操作',r:r=>r.status!=='已缴'?`<button class="btn sm ghost" onclick="PC.dun('YS2000')">催缴</button>`:`<button class="btn sm ghost" onclick="UI.toast('订单凭证已生成')">凭证</button>`}
      ], bills.slice(0,14))}
    </div>`;
  });
});
PC.genRentBills = function(cat){
  modal({title:'生成租金账单 · '+cat, body:`<div class="frm">
    ${fld('账期', `<input class="ipt" type="month" value="2026-08">`, false, true)}
    ${fld('生成范围', `<select class="ipt"><option>全部履约中合同（${DB.contracts.filter(c=>c.cat===cat).length} 份）</option><option>指定楼栋</option></select>`, true)}
    ${fld('账单周期', `<select class="ipt"><option>按合同约定（月付/季付/年付）</option><option>统一月付</option></select>`, true)}
    ${fld('优惠折扣', `<input class="ipt" placeholder="如：老租户 98 折（可留空）">`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('账单生成完成并已推送租户')">生成并推送</button>`});
};

/* ---------- 厂房：图形化编辑器 / 定价 / 销售 ---------- */
PC.floorEditor = function(bid){
  const b = DB.buildings.find(x=>x.id===bid);
  modal({title:'图形化房态编辑器 · '+b.name, size:'lg', body:`
    <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
      <span style="font-size:12.5px;color:var(--ink3);line-height:2">拖拽划分区域 · 自定义色卡状态模板 · 一键生成分享链接图</span>
      <span class="sp"></span>
      <button class="btn sm" onclick="UI.toast('已添加分区块')">＋ 分区</button>
      <button class="btn sm" onclick="UI.toast('状态色卡模板已保存')">🎨 状态色卡</button>
      <button class="btn sm" onclick="UI.toast('高清链接图已生成并复制链接')">🔗 导出链接图</button>
    </div>
    <div style="background:repeating-linear-gradient(0deg,#f4f6fb 0 1px,transparent 1px 24px),repeating-linear-gradient(90deg,#f4f6fb 0 1px,transparent 1px 24px);border:1px solid var(--line);border-radius:10px;height:320px;position:relative;overflow:hidden">
      <div style="position:absolute;left:24px;top:24px;width:220px;height:120px;border-radius:6px;background:var(--blue-bg);border:2px solid #2563eb;padding:8px;cursor:move" onclick="UI.toast('A 区：已租 · 恒力机械')"><b style="font-size:12px;color:#2563eb">A 区 1200㎡</b><div style="font-size:11px;color:#5b8cff;margin-top:4px">已租 · 恒力机械</div></div>
      <div style="position:absolute;left:270px;top:24px;width:160px;height:120px;border-radius:6px;background:var(--green-bg);border:2px solid #16a34a;padding:8px;cursor:move" onclick="UI.toast('B 区：空置，可招租')"><b style="font-size:12px;color:#16a34a">B 区 800㎡</b><div style="font-size:11px;color:#3f9e5f;margin-top:4px">空置</div></div>
      <div style="position:absolute;left:24px;top:170px;width:180px;height:110px;border-radius:6px;background:var(--orange-bg);border:2px solid #ea8600;padding:8px;cursor:move" onclick="UI.toast('C 区：合同即将到期')"><b style="font-size:12px;color:#ea8600">C 区 900㎡</b><div style="font-size:11px;color:#c47c20;margin-top:4px">即将到期</div></div>
      <div style="position:absolute;left:230px;top:170px;width:200px;height:110px;border-radius:6px;background:var(--red-bg);border:2px solid #dc2626;padding:8px;cursor:move" onclick="UI.toast('D 区：消防改造维修中')"><b style="font-size:12px;color:#dc2626">D 区 1000㎡</b><div style="font-size:11px;color:#c05050;margin-top:4px">维修中</div></div>
    </div>
    <div class="legend" style="margin-top:10px"><span><i style="background:var(--blue)"></i>已租</span><span><i style="background:var(--green)"></i>空置</span><span><i style="background:var(--orange)"></i>到期</span><span><i style="background:var(--red)"></i>维修</span><span style="color:var(--ink3)">支持全场景自由图形化编辑、自定义状态模板与分层配色</span></div>`,
    footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('图形化布局已保存并同步至房态')">保存布局</button>`});
};
PC.reg('/estate/厂房/price','厂房租金定价', (el)=>{
  const bs = DB.buildings.filter(b=>b.cat==='厂房');
  el.innerHTML = `
  <div class="card">
    <div class="toolbar"><span style="font-size:13px;color:var(--ink3)">支持按面积计价 / 整租定价，可设置优惠政策与议价空间</span>
    <span class="sp"></span><button class="btn pri" onclick="PC.priceEdit()">＋ 新增定价方案</button></div>
    ${table([
      {t:'楼栋/区域',k:'name'},{t:'计价方式',r:r=>badge(r.way,'blue')},{t:'标准价',r:r=>`<b>${r.price}</b>`},
      {t:'议价下限',k:'floor'},{t:'优惠政策',k:'discount'},{t:'生效日期',k:'date'},
      {t:'操作',r:r=>`<button class="btn sm ghost" onclick="PC.priceEdit()">调整</button>`}
    ], bs.map(b=>({name:b.name, way:'按面积计价', price:b.rent+' 元/㎡·月', floor:(b.rent*0.9).toFixed(1)+' 元/㎡·月',
      discount:'年付 97 折 · 两年签 95 折', date:'2026-01-01'})))}
  </div>
  <div class="card"><h3>历史调价记录</h3>
    ${timeline([
      {t:'2026-01-01 全园区基准价上调 3%', d:'3 号厂房 27 → 28 元/㎡·月', act:true},
      {t:'2025-07-01 新增年付优惠政策', d:'年付 97 折，两年签 95 折'},
      {t:'2025-01-01 首次定价备案', d:'按片区指导价备案'}])}
  </div>`;
});
PC.priceEdit = function(){
  modal({title:'定价方案', body:`<div class="frm">
    ${fld('适用楼栋', `<select class="ipt"><option>3 号标准厂房</option><option>5 号定制厂房</option><option>7 号智造车间</option></select>`)}
    ${fld('计价方式', `<select class="ipt"><option>按面积计价（元/㎡·月）</option><option>整租定价（元/月）</option></select>`)}
    ${fld('标准价', `<input class="ipt" value="28">`, false, true)}
    ${fld('议价下限', `<input class="ipt" value="25.2"><div class="hint">低于下限需总经理审批</div>`)}
    ${fld('优惠政策', `<input class="ipt" value="年付 97 折 · 两年签 95 折">`, true)}
    ${fld('生效日期', `<input class="ipt" type="date" value="2026-08-01">`, false, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('定价方案已保存并生效')">保存</button>`});
};
PC.reg('/estate/厂房/sale','厂房销售', (el)=>{
  el.innerHTML = `
  <div class="card">
    <div class="toolbar"><span style="font-size:13px;color:var(--ink3)">可售厂房对外展示 · 意向客户登记跟进</span>
    <span class="sp"></span><button class="btn pri" onclick="PC.saleEdit()">＋ 上架销售房源</button></div>
    <div class="grid3">
    ${[{n:'5 号定制厂房 整栋', a:'7200 ㎡', p:'¥ 4,680 万', u:'6500 元/㎡', hot:true},
       {n:'7 号智造车间 A 区', a:'1500 ㎡', p:'¥ 945 万', u:'6300 元/㎡'},
       {n:'7 号智造车间 C 区', a:'1500 ㎡', p:'¥ 960 万', u:'6400 元/㎡'}].map(s=>`
      <div class="card" style="cursor:pointer" onclick="PC.saleDetail('${s.n}')">
        <div style="height:110px;border-radius:8px;background:linear-gradient(135deg,#dbe7ff,#f0f5ff);display:flex;align-items:center;justify-content:center;font-size:38px;margin-bottom:12px">🏭</div>
        <h3 style="margin-bottom:6px">${s.n} ${s.hot?badge('热推','red'):''}</h3>
        <div style="font-size:12.5px;color:var(--ink3);margin-bottom:8px">建筑面积 ${s.a} · 层高 12m · 带行车</div>
        <div style="display:flex;justify-content:space-between;align-items:baseline"><b style="color:var(--red);font-size:18px">${s.p}</b><span style="font-size:12px;color:var(--ink3)">${s.u}</span></div>
      </div>`).join('')}
    </div>
  </div>
  <div class="card"><h3>意向客户跟进</h3>
    ${table([{t:'客户',k:'c'},{t:'意向房源',k:'r'},{t:'预算',k:'b'},{t:'跟进阶段',r:r=>badge(r.s,'cyan')},{t:'最近跟进',k:'t'},{t:'操作',r:r=>`<button class="btn sm ghost" onclick="UI.toast('已记录跟进')">写跟进</button>`}],[
      {c:'精工模具 王总',r:'5 号定制厂房',b:'4500 万',s:'实地看房',t:'07-26 已二看，待报价'},
      {c:'新能源配件 李总',r:'7 号车间 A 区',b:'900 万',s:'商务谈判',t:'07-24 议价中'},
      {c:'跨境电商 张总',r:'7 号车间 C 区',b:'1000 万',s:'初步接洽',t:'07-22 发送资料'}])}
  </div>`;
});
PC.saleEdit = function(){
  modal({title:'上架销售房源', body:`<div class="frm">
    ${fld('房源', `<select class="ipt"><option>7 号智造车间 B 区</option><option>5 号定制厂房</option></select>`, true)}
    ${fld('挂牌总价（万元）', `<input class="ipt" type="number">`, false, true)}
    ${fld('单价（元/㎡）', `<input class="ipt" placeholder="自动按面积折算">`)}
    ${fld('展示说明', `<input class="ipt" placeholder="如：近主干道，带行车">`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('已上架并同步至小程序更多租赁')">上架</button>`});
};
PC.saleDetail = function(n){
  drawer('销售房源 · '+n, `
    ${desc([['建筑面积','1500 ㎡'],['层高','12 m'],['承重','1.5 t/㎡'],['电力容量','400 kVA'],['消防等级','丙类'],['产权年限','50 年（剩余 42 年）'],['交付标准','现状交付'],['挂牌价','¥ 945 万（6300 元/㎡）']],2)}
    <h3 style="font-size:14px;margin:16px 0 10px">实景资料</h3>
    <div style="display:flex;gap:10px">${[1,2].map(()=>`<div style="flex:1;height:100px;border-radius:8px;background:linear-gradient(135deg,#dbe7ff,#eef3ff);display:flex;align-items:center;justify-content:center;font-size:28px;cursor:pointer">🏭</div>`).join('')}<div style="flex:1;height:100px;border-radius:8px;background:#101c34;display:flex;align-items:center;justify-content:center;color:#5b8cff;font-size:24px;cursor:pointer">▶</div></div>
    <div style="margin-top:16px;display:flex;gap:10px"><button class="btn pri" onclick="UI.toast('已生成带看预约')">预约带看</button><button class="btn" onclick="UI.toast('销售资料 PDF 已生成')">发送资料</button></div>
  `);
};

/* ================= 酒店：客房营业（长租/日租/钟点并存） ================= */
const HOTEL_CLS = {在住:'c-rented', 空净:'c-vacant', 脏房:'c-expire', 维修:'c-repair', 已租:'c-rented', 空置:'c-vacant'};
PC.reg('/estate/酒店/biz','酒店客房营业', (el)=>{
  const hs = DB.hotelRooms;
  const g = s => hs.filter(r=>r.status===s).length;
  el.innerHTML = `
  <div class="grid4">
    ${stat('今日在住', g('在住')+g('已租'), `日租 ${hs.filter(r=>r.mode==='日租'&&r.status==='在住').length} · 钟点 ${hs.filter(r=>r.mode==='钟点'&&r.status==='在住').length} · 长租 ${hs.filter(r=>r.mode==='长租'&&r.status==='已租').length}`)}
    ${stat('可售房（空净）', g('空净')+g('空置'), '脏房待清扫 '+g('脏房'))}
    ${stat('今日营收', '¥ 3,846', '日租 ¥2,964 · 钟点 ¥882')}
    ${stat('出租率(日)', Math.round((g('在住')+g('已租'))/hs.length*100)+'%', '钟点房翻台率 1.8')}
  </div>
  <div class="card">
    <div class="toolbar">
      <div class="mtabs" style="margin:0;width:300px">
        ${['全部','日租','钟点房','长租房'].map((t,i)=>`<div class="mt ${i===0?'on':''}" onclick="PC.hotelFilter(this,'${t}')">${t}</div>`).join('')}
      </div>
      <span class="sp"></span>
      <div class="legend">
        <span><i style="background:var(--blue)"></i>在住/已租</span><span><i style="background:var(--green)"></i>空净/空置</span>
        <span><i style="background:var(--orange)"></i>脏房待扫</span><span><i style="background:var(--red)"></i>维修停售</span>
      </div>
      <button class="btn pri" onclick="PC.hotelCheckin()">＋ 开房登记</button>
    </div>
    <div class="floorplan" id="hotel-fp"></div>
  </div>`;
  renderHotelFloor('全部');
});
function renderHotelFloor(mode){
  const floors = [...new Set(DB.hotelRooms.map(r=>r.floor))].sort((a,b)=>b-a);
  let h = '';
  floors.forEach(f=>{
    h += `<div class="frow"><div class="flab">${f}F</div>`;
    DB.hotelRooms.filter(r=>r.floor===f).forEach(r=>{
      const show = mode==='全部' || (mode==='日租'&&r.mode==='日租') || (mode==='钟点房'&&r.mode==='钟点') || (mode==='长租房'&&r.mode==='长租');
      h += `<div class="cell ${HOTEL_CLS[r.status]}" style="${show?'':'opacity:.18;pointer-events:none'}" onclick="PC.hotelRoom('${r.id}')">
        <div class="rn">${r.no}</div><div class="rt">${r.mode} · ${r.status}</div></div>`;
    });
    h += '</div>';
  });
  document.getElementById('hotel-fp').innerHTML = h;
}
PC.hotelFilter = function(el, mode){
  el.parentNode.querySelectorAll('.mt').forEach(x=>x.classList.remove('on'));
  el.classList.add('on');
  renderHotelFloor(mode);
};
PC.hotelRoom = function(id){
  const r = DB.hotelRooms.find(x=>x.id===id);
  drawer(`客房 ${r.no} · ${r.type}`, `
    <div style="display:flex;gap:8px;margin-bottom:14px">
      ${badge(r.mode,'purple')}${badge(r.status, UI.STATUS_COLOR[r.status]||({'在住':'blue','空净':'green','脏房':'orange'}[r.status]))}
      <span style="margin-left:auto;display:flex;gap:8px">
        ${(r.status==='空净'||r.status==='空置')?`<button class="btn sm pri" onclick="PC.hotelCheckin('${r.id}')">开房</button>`:''}
        ${(r.status==='在住')?`<button class="btn sm" onclick="UI.toast('续住成功，已更新离店时间')">续住</button><button class="btn sm danger" onclick="PC.hotelCheckout('${r.id}')">退房结账</button>`:''}
        ${r.status==='脏房'?`<button class="btn sm pri" onclick="UI.toast('已通知客房部清扫，完成后转空净')">安排清扫</button>`:''}
        ${r.status==='已租'?`<button class="btn sm" onclick="UI.toast('跳转长租合同')">长租合同</button>`:''}
      </span></div>
    ${desc([['房型',r.type],['经营模式',r.mode],['门市价',r.price],
      ['当前客人',r.guest||'—'],['预计离店',r.out||'—'],['房间状态',r.status]],2)}
    ${r.status==='在住'? `<h3 style="font-size:14px;margin:16px 0 10px">在住消费</h3>
      ${table([{t:'项目',k:'n'},{t:'金额',k:'a'},{t:'时间',k:'t'}],[
        {n:'房费（'+r.mode+'）', a:r.mode==='钟点'?'¥68.00':'¥228.00', t:'入住时'},
        {n:'押金', a:'¥200.00', t:'入住时'},
        {n:'迷你吧消费', a:'¥18.00', t:'今日 10:24'}])}`:''}
  `);
};
PC.hotelCheckin = function(roomId){
  const vacant = DB.hotelRooms.filter(r=>r.status==='空净'||r.status==='空置');
  modal({title:'开房登记', size:'lg', body:`<div class="frm">
    ${fld('经营模式', `<select class="ipt" id="hc-mode" onchange="document.getElementById('hc-price').value=this.value==='钟点房'?'68 元/4小时':this.value==='日租'?'228 元/晚':'3200 元/月'"><option>日租</option><option>钟点房</option><option>长租房</option></select>`)}
    ${fld('房间', `<select class="ipt">${vacant.slice(0,8).map(r=>`<option ${r.id===roomId?'selected':''}>${r.no}（${r.type}）</option>`).join('')}</select>`)}
    ${fld('房价', `<input class="ipt" id="hc-price" value="228 元/晚">`, false, true)}
    ${fld('住期', `<input class="ipt" value="1 晚（明日 12:00 前退房）">`)}
    ${fld('客人姓名', `<input class="ipt" placeholder="支持身份证 OCR 识别">`, false, true)}
    ${fld('联系电话', `<input class="ipt">`)}
    ${fld('同住人数', `<select class="ipt"><option>1 人</option><option>2 人</option><option>3 人及以上</option></select>`)}
    ${fld('押金', `<select class="ipt"><option>¥200（扫码收取）</option><option>免押金（会员）</option></select>`)}
    ${fld('证件登记', `<div style="border:1.5px dashed var(--line);border-radius:8px;padding:12px;text-align:center;color:var(--ink3);font-size:12.5px;cursor:pointer" onclick="UI.toast('OCR 识别成功（演示）')">📷 身份证拍照登记（公安旅业系统联网）</div>`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('开房成功：房态更新为在住，门锁密码已下发')">确认开房</button>`});
};
PC.hotelCheckout = function(id){
  const r = DB.hotelRooms.find(x=>x.id===id);
  modal({title:'退房结账 · '+r.no, body:`
    ${table([{t:'项目',k:'n'},{t:'金额',r:x=>'¥'+x.a}],[
      {n:'房费',a:r.mode==='钟点'?'68.00':'228.00'},{n:'迷你吧消费',a:'18.00'},{n:'押金退还',a:'-200.00'}])}
    <div style="text-align:right;font-size:15px;margin-top:10px">应收合计：<b style="color:var(--red)">¥46.00</b>（押金抵扣后）</div>
    <div class="frm" style="margin-top:12px">${fld('收款方式', `<select class="ipt"><option>微信</option><option>支付宝</option><option>现金</option><option>挂账（协议单位）</option></select>`, true)}</div>`,
    footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('结账完成：房态转脏房，已通知清扫')">收款并退房</button>`});
};
PC.reg('/estate/酒店/rate','酒店房价方案', (el)=>{
  el.innerHTML = `
  <div class="card">
    <div class="toolbar"><span style="font-size:13px;color:var(--ink3)">长租 / 日租 / 钟点三种经营模式分别定价</span>
    <span class="sp"></span><button class="btn pri" onclick="PC.rateEdit()">＋ 新增房型价格</button></div>
    ${table([
      {t:'房型',k:'room'},
      {t:'日租价（元/晚）',r:r=>`<b>${r.day}</b>${r.weekend!=='-'?` <span style="font-size:12px;color:var(--ink3)">周末 ${r.weekend}</span>`:''}`},
      {t:'钟点价',k:'hour'},{t:'长租价',k:'month'},{t:'会员/协议',r:r=>badge(r.member,'purple')},
      {t:'操作',r:r=>`<button class="btn sm ghost" onclick="PC.rateEdit('${r.room}')">调整</button>`}
    ], DB.hotelRates)}
  </div>
  <div class="card"><h3>特殊日期调价</h3>
    ${table([{t:'日期',k:'d'},{t:'规则',k:'r'},{t:'幅度',k:'p'},{t:'状态',r:r=>badge(r.s,'green')}],[
      {d:'国庆假期 10-01 ~ 10-07', r:'全部日租房型', p:'上浮 30%', s:'已生效'},
      {d:'每周五/六', r:'日租房型周末价', p:'按周末价执行', s:'已生效'}])}
  </div>`;
});
PC.rateEdit = function(){
  modal({title:'房型价格', body:`<div class="frm">
    ${fld('房型', `<input class="ipt" value="标准大床房">`, false, true)}
    ${fld('日租价（元/晚）', `<input class="ipt" type="number" value="228">`)}
    ${fld('周末价（元/晚）', `<input class="ipt" type="number" value="258">`)}
    ${fld('钟点价', `<input class="ipt" value="68 元/4小时">`)}
    ${fld('长租价（元/月）', `<input class="ipt" value="3600">`)}
    ${fld('会员折扣', `<input class="ipt" value="9 折">`)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('房价方案已保存')">保存</button>`});
};

/* ================= 车位管理 ================= */
PC.reg('/park/lots','停车场管理', (el)=>{
  el.innerHTML = `
  <div class="toolbar"><span style="font-size:13px;color:var(--ink3)">共 ${DB.lots.length} 个停车场</span><span class="sp"></span>
  <button class="btn pri" onclick="PC.lotEdit()">＋ 新增停车场</button></div>
  <div class="grid3">
  ${DB.lots.map(l=>{
    const ss = DB.spots.filter(s=>s.lot===l.id);
    const rented = ss.filter(s=>s.status==='已租').length, temp = ss.filter(s=>s.status==='临时').length;
    return `<div class="card" style="cursor:pointer" onclick="location.hash='#/park/spots'">
      <h3>🅿️ ${l.name}<span class="more">管理 →</span></h3>
      <div style="font-size:12.5px;color:var(--ink3);margin-bottom:10px">${l.type} · ${DB.areas.find(a=>a.id===l.area)?.name||''}</div>
      <div style="display:flex;gap:14px;font-size:13px;margin-bottom:10px">
        <span>总车位 <b>${ss.length}</b></span><span style="color:var(--blue)">已租 <b>${rented}</b></span>
        <span style="color:var(--green)">空闲 <b>${ss.filter(s=>s.status==='空闲').length}</b></span><span style="color:var(--cyan)">临时 <b>${temp}</b></span></div>
      <div class="kv"><span>使用率</span><b>${Math.round((rented+temp)/ss.length*100)}%</b></div>
      <div class="pbar"><i style="width:${Math.round((rented+temp)/ss.length*100)}%"></i></div>
      <div style="margin-top:10px;display:flex;gap:8px"><button class="btn sm" onclick="event.stopPropagation();PC.lotEdit('${l.id}')">编辑</button>
      <button class="btn sm" onclick="event.stopPropagation();UI.toast('道闸远程开闸成功（演示）')">道闸控制</button></div>
    </div>`;
  }).join('')}
  </div>`;
});
PC.lotEdit = function(){
  modal({title:'停车场信息', body:`<div class="frm">
    ${fld('停车场名称', `<input class="ipt" value="城东 1 号停车场">`, false, true)}
    ${fld('类型', `<select class="ipt"><option>地上</option><option>地下</option></select>`)}
    ${fld('所属片区', `<select class="ipt">${DB.areas.map(a=>`<option>${a.name}</option>`).join('')}</select>`)}
    ${fld('车位数量', `<input class="ipt" type="number" value="120">`)}
    ${fld('月租标准（元/月）', `<input class="ipt" value="220">`)}
    ${fld('临停计费', `<input class="ipt" value="首小时 3 元，后每半小时 1.5 元，封顶 20 元/天">`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('停车场信息已保存')">保存</button>`});
};
PC.reg('/park/spots','车位信息管理', (el)=>{
  const ss = DB.spots;
  el.innerHTML = `<div class="card">
    <div class="toolbar">
      <select class="ipt"><option>全部停车场</option>${DB.lots.map(l=>`<option>${l.name}</option>`).join('')}</select>
      <select class="ipt"><option>全部状态</option><option>空闲</option><option>已租</option><option>临时</option></select>
      <input class="ipt" placeholder="车位号 / 车牌 / 租户" style="width:170px">
      <button class="btn" onclick="UI.toast('查询成功（演示）')">查询</button>
      <span class="sp"></span><button class="btn" onclick="UI.toast('车位台账已导出')">导出</button>
      <button class="btn pri" onclick="PC.spotEdit()">＋ 新增车位</button>
    </div>
    ${table([
      {t:'车位编号',r:r=>`<span class="lk" onclick="PC.spotDetail('${r.id}')">${r.no}</span>`},
      {t:'所属片区',r:r=>badge(DB.areaName(r.area),'gray')},
      {t:'所属停车场',k:'lotName'},{t:'类型',r:r=>badge(r.type, r.type==='地下'?'purple':'cyan')},
      {t:'尺寸',k:'size'},{t:'月租金',r:r=>'¥'+r.rent},
      {t:'状态',r:r=>badge(r.status, STATUS_COLOR[r.status])},
      {t:'租户/车牌',r:r=>r.tname?`<span class="lk" onclick="PC.tenant('${r.tname}')">${r.tname}</span>`:(r.plate||'—')},
      {t:'租期至',r:r=>r.endDate||'—'},
      {t:'操作',r:r=>`<button class="btn sm ghost" onclick="PC.spotDetail('${r.id}')">详情</button>`}
    ], ss.slice(0,14))}
    <div class="pager">共 ${ss.length} 条 <span class="on">1</span><span onclick="UI.toast('翻页（演示）')">2</span></div>
  </div>`;
});
PC.spotEdit = function(){
  modal({title:'新增车位', body:`<div class="frm">
    ${fld('所属停车场', `<select class="ipt">${DB.lots.map(l=>`<option>${l.name}</option>`).join('')}</select>`)}
    ${fld('车位编号', `<input class="ipt" placeholder="如 B1-201">`, false, true)}
    ${fld('尺寸', `<input class="ipt" value="2.5m×5.3m">`)}
    ${fld('月租金（元）', `<input class="ipt" type="number" value="300">`)}
    ${fld('车位类型', `<select class="ipt"><option>标准车位</option><option>子母车位</option><option>无障碍车位</option><option>充电车位</option></select>`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('车位已创建')">保存</button>`});
};
PC.spotDetail = function(id){
  const s = DB.spots.find(x=>x.id===id);
  drawer('车位详情 · '+s.lotName+' '+s.no, `
    <div style="display:flex;gap:8px;margin-bottom:14px">${badge(s.status, STATUS_COLOR[s.status])}${badge(s.type,'purple')}
    <span style="margin-left:auto">${s.status==='空闲'?`<button class="btn sm pri" onclick="UI.toast('跳转签订车位租赁合同')">办理出租</button>`:''}<button class="btn sm" onclick="PC.spotEdit()">编辑</button></span></div>
    ${desc([['所属停车场',s.lotName],['车位编号',s.no],['类型',s.type],['尺寸',s.size],['月租金','¥'+s.rent+'/月'],
      ['当前租户',s.tname||'—'],['车牌号',s.plate||'—'],['租期至',s.endDate||'—'],['入场时间',s.inTime||'—']],3)}
    ${s.status==='临时'?`<div style="margin-top:14px;background:var(--cyan-bg);border-radius:8px;padding:12px;font-size:13px;color:var(--cyan)">🚗 临停计费中：入场 ${s.inTime}，按首小时 3 元 + 每半小时 1.5 元累计，出场自动结算。</div>`:''}
    <h3 style="font-size:14px;margin:16px 0 10px">缴费记录</h3>
    ${table([{t:'账期',k:'m'},{t:'金额',k:'a'},{t:'状态',r:r=>badge(r.s,'green')},{t:'方式',k:'w'}],
      s.tname? [{m:'2026-07',a:'¥'+s.rent,s:'已缴',w:'微信'},{m:'2026-06',a:'¥'+s.rent,s:'已缴',w:'微信'}] : [])}
  `);
};
PC.reg('/park/contracts','车位租赁合同', (el)=>{
  const cs = DB.contracts.filter(c=>c.cat==='车位');
  el.innerHTML = `<div class="card">
    <div class="toolbar"><input class="ipt" placeholder="合同号 / 租户" style="width:170px">
      <select class="ipt"><option>全部状态</option><option>履约中</option><option>即将到期</option></select>
      <button class="btn" onclick="UI.toast('查询成功（演示）')">查询</button><span class="sp"></span>
      <button class="btn pri" onclick="UI.toast('跳转合同签订流程（电子签章）')">＋ 签订车位合同</button></div>
    ${table([
      {t:'合同号',r:r=>`<span class="lk" onclick="PC.contract('${r.id}')">${r.id}</span>`},
      {t:'车位',k:'roomName'},{t:'租户',k:'tname'},{t:'租期',r:r=>r.start+' ~ '+r.end},
      {t:'租金',r:r=>'¥'+money(r.rent)+'/月'},{t:'押金',r:r=>'¥'+money(r.deposit)},
      {t:'缴费周期',k:'cycle'},{t:'签署',r:r=>badge(r.sign,'purple')},{t:'状态',r:r=>badge(r.status,'blue')}
    ], cs.slice(0,14))}
    <div class="pager">共 ${cs.length} 条 <span class="on">1</span></div>
  </div>`;
});
PC.reg('/park/temp','临时停车计费', (el)=>{
  const temps = DB.spots.filter(s=>s.status==='临时').slice(0,10);
  el.innerHTML = `
  <div class="grid4">
    ${stat('在场临时车', temps.length+' 辆', '道闸实时联动')}
    ${stat('今日临停收入', '¥ 486.50', '出场自动结算')}
    ${stat('今日进/出', '312 / 298', '峰值 08:00-09:00')}
    ${stat('计费规则', '2 套', '地上 / 地下差异化')}
  </div>
  <div class="card">
    <div class="toolbar"><b style="font-size:14px">在场临时车辆</b><span class="sp"></span>
      <button class="btn" onclick="PC.tempRule()">⚙️ 计费规则</button>
      <button class="btn" onclick="UI.toast('已为选中车辆人工开闸')">人工开闸</button></div>
    ${table([
      {t:'车牌',r:r=>`<b>${r.plate}</b>`},{t:'停车场',k:'lotName'},{t:'车位',k:'no'},{t:'入场时间',k:'inTime'},
      {t:'停放时长',r:r=>'2 小时 '+((r.no.charCodeAt(0))%50)+' 分'},
      {t:'预估费用',r:r=>'¥ '+(((r.no.charCodeAt(0))%10)+3).toFixed(2)},
      {t:'操作',r:r=>`<button class="btn sm ghost" onclick="UI.toast('已推送缴费二维码至车主')">催缴出场</button>`}
    ], temps)}
  </div>`;
});
PC.tempRule = function(){
  modal({title:'临停计费规则', body:`<div class="frm">
    ${fld('免费时长', `<select class="ipt"><option>15 分钟</option><option>30 分钟</option><option>无</option></select>`)}
    ${fld('首小时', `<input class="ipt" value="3 元">`)}
    ${fld('之后每半小时', `<input class="ipt" value="1.5 元">`)}
    ${fld('单日封顶', `<input class="ipt" value="20 元">`)}
    ${fld('月租车超期', `<select class="ipt"><option>按临停计费</option><option>禁止入场</option></select>`, true)}
  </div>`, footer:`<button class="btn" onclick="UI.close()">取消</button><button class="btn pri" onclick="UI.close();UI.toast('计费规则已下发至道闸')">保存并下发</button>`});
};
PC.reg('/park/sale','车位销售', (el)=>{
  el.innerHTML = `
  <div class="card"><div class="toolbar"><span style="font-size:13px;color:var(--ink3)">产权车位对外销售展示</span><span class="sp"></span>
  <button class="btn pri" onclick="UI.toast('上架销售车位')">＋ 上架车位</button></div>
  <div class="grid4">
    ${[{n:'P2 地下 B1-088', p:'¥ 12.8 万', t:'标准产权车位'},
       {n:'P2 地下 B1-102', p:'¥ 13.5 万', t:'近电梯口'},
       {n:'P1 地上 A-015', p:'¥ 8.6 万', t:'充电车位'},
       {n:'P1 地上 A-021', p:'¥ 7.9 万', t:'标准车位'}].map(s=>`
    <div class="card" style="cursor:pointer" onclick="UI.toast('查看销售详情（演示）')">
      <div style="height:80px;border-radius:8px;background:linear-gradient(135deg,#e6f0ff,#f2f7ff);display:flex;align-items:center;justify-content:center;font-size:30px;margin-bottom:10px">🅿️</div>
      <b>${s.n}</b><div style="font-size:12px;color:var(--ink3);margin:4px 0 8px">${s.t}</div>
      <b style="color:var(--red);font-size:16px">${s.p}</b></div>`).join('')}
  </div></div>
  <div class="card"><h3>销售线索</h3>
    ${table([{t:'客户',k:'c'},{t:'意向车位',k:'s'},{t:'状态',r:r=>badge(r.t,'cyan')},{t:'跟进',k:'f'}],[
      {c:'园区业主 陈先生',s:'B1-102',t:'意向登记',f:'07-27 已报价'},
      {c:'云帆软件（团购 10 个）',s:'B1 整层',t:'商务洽谈',f:'07-25 团购议价中'}])}
  </div>`;
});
})();
