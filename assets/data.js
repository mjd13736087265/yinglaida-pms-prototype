/* ===== 英莱达物管系统 · 模拟演示数据 ===== */
window.DB = (function(){
  // 确定性伪随机
  let seed = 42;
  const rnd = () => (seed = (seed*9301+49297)%233280) / 233280;
  const pick = arr => arr[Math.floor(rnd()*arr.length)];
  const ri = (a,b) => a+Math.floor(rnd()*(b-a+1));

  const areas = [
    {id:'A1', name:'城东产业园', addr:'城东街道兴业路 88 号', mgr:'陈志远', phone:'13805710001', types:['公寓','厂房','车位'], note:'集团主力园区，含宿舍与标准厂房'},
    {id:'A2', name:'滨江科创园', addr:'滨江大道 1200 号', mgr:'林晓峰', phone:'13805710002', types:['写字楼','商业','车位'], note:'科创企业集聚区，配套商业'},
    {id:'A3', name:'临港智造园', addr:'临港新区港前路 6 号', mgr:'赵启铭', phone:'13805710003', types:['厂房','酒店','其他'], note:'重资产制造园区，含园区酒店与仓储'},
  ];

  // 业态定义：厂房/公寓/写字楼/商业/酒店/其他/车位
  const buildings = [
    {id:'B01', area:'A1', cat:'公寓', name:'1 号宿舍楼', floors:6, per:8, area1:35, rent:1200, tag:'单人间/双人间'},
    {id:'B02', area:'A1', cat:'公寓', name:'2 号宿舍楼', floors:5, per:8, area1:42, rent:1500, tag:'家庭套间'},
    {id:'B03', area:'A1', cat:'厂房', name:'3 号标准厂房', floors:2, per:4, area1:1200, rent:28, tag:'层高8m·承重1t/㎡'},
    {id:'B04', area:'A1', cat:'厂房', name:'5 号定制厂房', floors:1, per:3, area1:2400, rent:32, tag:'层高12m·带行车'},
    {id:'B05', area:'A2', cat:'写字楼', name:'创新大厦 A 座', floors:12, per:6, area1:120, rent:55, tag:'精装交付'},
    {id:'B06', area:'A2', cat:'商业', name:'滨江商业街', floors:2, per:10, area1:80, rent:95, tag:'临街旺铺'},
    {id:'B07', area:'A3', cat:'厂房', name:'7 号智造车间', floors:1, per:4, area1:3000, rent:26, tag:'丙类消防'},
    {id:'B08', area:'A3', cat:'酒店', name:'园区商务酒店', floors:8, per:12, area1:28, rent:0, tag:'长租协议房'},
    {id:'B09', area:'A3', cat:'其他', name:'综合仓库', floors:1, per:6, area1:500, rent:18, tag:'恒温仓储'},
  ];
  const lots = [
    {id:'P1', area:'A1', name:'城东 1 号停车场', type:'地上', total:120},
    {id:'P2', area:'A2', name:'滨江地下停车场', type:'地下', total:200},
    {id:'P3', area:'A3', name:'临港货运停车场', type:'地上', total:80},
  ];

  const roomStatuses = ['空置','已租','已租','已租','到期','维修','预定'];
  const firstNames = ['王','李','张','刘','陈','杨','黄','周','吴','徐','孙','胡','朱','高','林','何','郭','马','罗','梁'];
  const given = ['伟','芳','娜','敏','静','磊','洋','勇','艳','杰','涛','明','超','秀英','霞','平','刚','桂英','文轩','子涵'];
  const companies = ['恒力机械有限公司','蓝湾电子科技','旭日新能源','宏达纺织','天启智能装备','绿洲环保科技','飞驰物流','金石精密制造','云帆软件','晟邦新材料'];

  const tenants = [];
  for(let i=0;i<26;i++){
    const isCo = i>=16;
    tenants.push({
      id:'T'+String(100+i), name: isCo? companies[i-16] : pick(firstNames)+pick(given),
      type: isCo?'企业':'个人', phone:'13'+String(600000000+Math.floor(rnd()*399999999)),
      idno: isCo? '91330'+String(10000000+ri(0,89999999))+'X' : '3301'+String(1970+ri(0,30))+'0'+ri(1,9)+String(10000+ri(0,89999)),
      arrears: 0, credit: pick(['A','A','B','A','C'])
    });
  }

  // 生成房间
  const rooms = [];
  let ti = 0;
  buildings.forEach(b=>{
    for(let f=1; f<=b.floors; f++){
      for(let r=1; r<=b.per; r++){
        const st = pick(roomStatuses);
        const id = b.id+'-'+f+String(r).padStart(2,'0');
        const room = {
          id, bid:b.id, area:b.area, cat:b.cat, bname:b.name, floor:f,
          no: f+String(r).padStart(2,'0'), size: b.area1 + ri(-5, 30),
          rent: b.cat==='厂房'||b.cat==='其他' ? b.rent : b.rent + ri(-100, 200),
          status: b.cat==='酒店'&&f>4 ? '空置' : st,
          tenant:null, contract:null
        };
        if(room.status==='已租'||room.status==='到期'){
          const t = tenants[ti++ % tenants.length];
          room.tenant = t.id; room.tname = t.name;
          const endM = room.status==='到期' ? ri(1,2) : ri(3,18);
          room.contract = 'HT'+ (20250000 + ri(100,999));
          room.endDate = `2026-${String(Math.min(12,7+Math.floor(endM/4))).padStart(2,'0')}-${String(ri(1,28)).padStart(2,'0')}`;
          room.deposit = b.cat==='厂房' ? ri(2,6)*10000 : ri(1,3)*1000;
        }
        rooms.push(room);
      }
    }
  });

  // 车位
  const spots = [];
  lots.forEach(l=>{
    for(let i=1;i<=l.total;i++){
      const st = pick(['空闲','已租','已租','已租','临时']);
      const s = {id:l.id+'-'+String(i).padStart(3,'0'), lot:l.id, lotName:l.name, area:l.area,
        no:(l.type==='地下'?'B1-':'')+String(i).padStart(3,'0'), type:l.type,
        size:'2.5m×5.3m', rent:l.type==='地下'?300:220, status:st, tenant:null};
      if(st==='已租'){ const t=pick(tenants); s.tenant=t.id; s.tname=t.name; s.plate='浙A·'+String(10000+ri(0,89999)); s.endDate='2026-'+String(ri(8,12)).padStart(2,'0')+'-'+String(ri(1,28)).padStart(2,'0'); }
      if(st==='临时'){ s.plate='浙A·'+String(10000+ri(0,89999)); s.inTime='08:'+String(ri(10,59)); }
      spots.push(s);
    }
  });

  // 合同
  const contracts = [];
  rooms.filter(r=>r.tenant).forEach((r,i)=>{
    contracts.push({
      id:r.contract, cat:r.cat, room:r.id, roomName:r.bname+' '+r.no, area:r.area,
      tenant:r.tenant, tname:r.tname,
      start:'2025-'+String(ri(1,12)).padStart(2,'0')+'-01', end:r.endDate,
      rent:r.cat==='厂房'||r.cat==='其他'? r.rent*r.size : r.rent,
      unit:(r.cat==='厂房'||r.cat==='其他')?'元/㎡·月':'元/月',
      deposit:r.deposit, cycle:pick(['月付','季付','季付','年付']),
      status:r.status==='到期'?'即将到期':'履约中', sign:'电子签章'
    });
  });
  spots.filter(s=>s.tenant).slice(0,40).forEach((s,i)=>{
    contracts.push({id:'HT20260'+String(100+i), cat:'车位', room:s.id, roomName:s.lotName+' '+s.no, area:s.area,
      tenant:s.tenant, tname:s.tname, start:'2026-01-01', end:s.endDate, rent:s.rent, unit:'元/月',
      deposit:500, cycle:'月付', status:'履约中', sign:'电子签章'});
  });

  // 账单
  const billTypes = ['租金','电费','水费','车位费','物业费'];
  const bills = [];
  contracts.slice(0,30).forEach((c,i)=>{
    ['2026-06','2026-07'].forEach((m,mi)=>{
      billTypes.forEach(bt=>{
        if(bt==='车位费' && c.cat!=='车位') return;
        if(bt==='租金' && c.cat==='车位') return;
        if(rnd()<0.45) return;
        const st = mi===0 ? pick(['已缴','已缴','已缴','逾期']) : pick(['已缴','待缴','待缴','逾期']);
        bills.push({id:'ZD'+m.replace('-','')+String(1000+bills.length), type:bt, month:m,
          tenant:c.tenant, tname:c.tname, room:c.roomName, contract:c.id,
          amount: bt==='租金'? c.rent : bt==='电费'? ri(80,2600) : bt==='水费'? ri(20,400) : bt==='车位费'? c.rent : ri(60,600),
          status:st, due:m+'-15', payTime: st==='已缴'? m+'-'+String(ri(1,14)).padStart(2,'0') : null,
          channel: st==='已缴'? pick(['微信支付','支付宝','银行转账']) : null });
      });
    });
  });

  // 智能表计（字段对齐 API 文档）
  const meters = [];
  rooms.filter(r=>r.tenant || r.status==='已租').slice(0, 36).forEach((r,i)=>{
    ['电','水'].forEach(kind=>{
      meters.push({
        id:'M'+String(1000+meters.length), no:'6236618'+String(70000+meters.length),
        type:kind+'表', barMeasureType: kind==='电'?1:2, name:r.bname+' '+r.no+' '+kind+'表',
        room:r.id, roomName:r.bname+' '+r.no, cons:r.tname||'-', consNo:'23082010'+String(100000+i),
        nature: rnd()<0.15?'公摊':'独用', online: rnd()<0.9?'在线':'掉线',
        proto: pick(['DLT645-2007','DLT645-1997']), comm: pick(['485','NB-IoT','LoRa']),
        rateType: kind==='电'? pick(['单费率','复费率(尖峰平谷)']) : '单费率',
        feeMode: rnd()<0.6?'预付费':'后付费',
        price: kind==='电'? 0.85 : 3.2, ct:1, pt:1,
        reading: ri(800, 9800)+rnd(), lastTime:'2026-07-28 0'+ri(6,9)+':'+String(ri(10,59)),
        balance: ri(-50, 800), threshold: 50, valve: rnd()<0.85?'合闸':'分闸',
        gateway:'14000'+String(ri(10,99))
      });
    });
  });
  // 公摊表
  buildings.slice(0,5).forEach(b=>{
    ['电','水'].forEach(kind=>meters.push({id:'M'+String(1000+meters.length), no:'6236618'+String(70000+meters.length),
      type:kind+'表', barMeasureType:kind==='电'?1:2, name:b.name+' 公共'+kind+'表', room:b.id, roomName:b.name+'(公共)',
      cons:'公摊', consNo:'-', nature:'公摊', online:'在线', proto:'DLT645-2007', comm:'NB-IoT',
      rateType:'单费率', feeMode:'后付费', price:kind==='电'?0.85:3.2, ct:1, pt:1, reading:ri(2000,20000)+rnd(),
      lastTime:'2026-07-28 08:30', balance:0, threshold:0, valve:'合闸', gateway:'1400005'}));
  });

  const readings = [];
  meters.slice(0,24).forEach(m=>{
    ['2026-06-01','2026-07-01'].forEach(d=>{
      const v = m.reading - ri(60,400);
      readings.push({id:'CB'+String(10000+readings.length), meter:m.no, mname:m.name, room:m.roomName,
        date:d, value:v.toFixed(2), by: pick(['系统自动采集','系统自动采集','系统自动采集','王抄表(人工)']),
        abnormal: rnd()<0.08, photo: rnd()<0.1});
    });
  });

  // 工单
  const repairTypes = ['水电维修','门窗五金','空调设备','管道疏通','消防设备','电梯','公共区域'];
  const orders = [];
  for(let i=0;i<18;i++){
    const st = pick(['待派单','处理中','处理中','已完成','已完成','已评价']);
    orders.push({id:'GD20260'+String(700+i), type:pick(repairTypes),
      room: pick(rooms.filter(r=>r.tenant)).roomName || '1 号宿舍楼 301',
      tenant: pick(tenants).name,
      desc: pick(['卫生间水管漏水，地面有积水','空调不制冷，疑似缺氟','房间门锁损坏无法反锁','插座跳闸，合闸后立即再跳','走廊照明灯不亮','下水道堵塞返水']),
      imgs: ri(1,3), create:'2026-07-'+String(ri(10,28)).padStart(2,'0')+' '+String(ri(8,20)).padStart(2,'0')+':'+String(ri(10,59)),
      status:st, worker: st==='待派单'? null : pick(['张维修','李电工','周管道','吴综合']),
      score: st==='已评价'? ri(3,5) : null, urgent: rnd()<0.2});
  }

  // 投诉
  const complaints = [];
  for(let i=0;i<8;i++){
    complaints.push({id:'TS20260'+String(30+i), tenant:pick(tenants).name, type:pick(['噪音扰民','卫生问题','停车纠纷','服务态度','设施维护']),
      desc:pick(['夜间施工噪音过大影响休息','楼道垃圾清运不及时','固定车位被外来车辆占用','报修响应速度慢']),
      create:'2026-07-'+String(ri(12,28)).padStart(2,'0'), status:pick(['待处理','已回复','已回复','已关闭'])});
  }

  // 固定资产
  const assets = [];
  const assetCats = {'房屋建筑':['办公楼','门卫室'],'机器设备':['柴油发电机','空压机','变压器'],'办公设备':['台式电脑','打印机','投影仪','会议桌'],'运输设备':['电动巡逻车','货车'],'消防设备':['消防泵','灭火器组']};
  Object.entries(assetCats).forEach(([cat,names])=>{
    names.forEach(n=>{
      assets.push({id:'ZC'+String(1000+assets.length), name:n, cat, spec:pick(['标准型','定制型','2023款']),
        buy:'20'+ri(19,25)+'-'+String(ri(1,12)).padStart(2,'0')+'-'+String(ri(1,28)).padStart(2,'0'),
        val:ri(3,80)*1000, dept:pick(['综合管理部','工程部','安保部','财务部']),
        loc:pick(areas).name, status:pick(['在用','在用','在用','闲置','维修中','调拨中'])});
    });
  });

  // 应收应付
  const receivables = bills.filter(b=>b.status!=='已缴').map((b,i)=>({
    id:'YS'+String(2000+i), type:b.type, tenant:b.tname, room:b.room, contract:b.contract,
    amount:b.amount, received: b.status==='逾期'&&rnd()<0.3? Math.round(b.amount*0.4) : 0,
    due:b.due, days: b.status==='逾期'? ri(5,95) : 0, status:b.status,
    billId:b.id
  }));
  receivables.forEach(r=> r.balance = r.amount - r.received);
  const payables = [];
  ['电梯维保服务费','绿化养护费','保洁服务费','消防检测费','办公物资采购','公共电费结算','安保服务费'].forEach((n,i)=>{
    payables.push({id:'YF'+String(3000+i), name:n, vendor:pick(['迅达电梯','绿城物业','洁净家政','安消检测','得力集采','供电公司','盾安安保']),
      amount:ri(2,60)*1000, due:'2026-08-'+String(ri(1,28)).padStart(2,'0'), status:pick(['待支付','待支付','已支付','部分支付'])});
  });

  // 催收记录
  const collections = [];
  receivables.filter(r=>r.status==='逾期').slice(0,12).forEach((r,i)=>{
    for(let k=0;k<ri(1,3);k++)
      collections.push({id:'CS'+String(5000+collections.length), recv:r.id, tenant:r.tenant, room:r.room,
        way:pick(['电话催收','微信推送','短信提醒','上门催收','催缴函件']),
        time:'2026-07-'+String(ri(10,28)).padStart(2,'0'), by:pick(['陈志远','林晓峰','系统定时任务']),
        result:pick(['承诺本周缴纳','承诺本周缴纳','未接通','已读未回','拒绝缴纳','已部分缴纳'])});
  });

  // 审批
  const approvals = [];
  [['续租申请','租户申请将 1 号宿舍楼 405 续租 12 个月，租金维持 1350 元/月'],
   ['退租申请','2 号宿舍楼 302 申请 8 月 15 日退租，押金 2000 元待退还'],
   ['费用减免','恒力机械因厂房漏水申请减免 7 月物业费 480 元'],
   ['缓缴申请','蓝湾电子申请 7 月租金缓缴 15 天'],
   ['押金退还','旭日新能源退租结算完成，申请退还押金 36000 元'],
   ['资产报废','台式电脑 ZC1008 超过使用年限申请报废'],
   ['资产调拨','投影仪由综合管理部调拨至工程部'],
   ['临时停车优惠','园区企业访客车辆申请月卡优惠套餐']].forEach((a,i)=>{
    approvals.push({id:'SP'+String(6000+i), type:a[0], desc:a[1], from:pick(tenants).name,
      create:'2026-07-'+String(ri(20,28)).padStart(2,'0'),
      status:pick(['待审批','待审批','待审批','已通过','已驳回']), node:pick(['片区经理审批','财务复核','总经理审批'])});
  });

  // 消息
  const messages = [];
  [['账单提醒','您 2026 年 7 月电费账单 ¥326.40 已生成，请于 7 月 15 日前缴纳','账单'],
   ['欠费催缴','您有 1 笔账单已逾期 12 天，请尽快缴纳以免影响信用','催缴'],
   ['余额预警','您的电表账户余额 18.50 元，低于阈值 50 元，请及时充值','预警'],
   ['报修进度','您提交的报修工单 GD20260712 已派单，维修师傅张维修将尽快上门','工单'],
   ['合同提醒','您的宿舍合同将于 30 天后到期，如需续租请提前办理','合同'],
   ['缴费成功','您已成功缴纳 2026 年 6 月租金 ¥1,350.00（微信支付）','缴费'],
   ['停水通知','7 月 30 日 9:00-12:00 园区供水管网检修，请提前储水','通知'],
   ['用量异常','您本月用电量较上月增长 180%，请核实是否有异常用电','预警']].forEach((m,i)=>{
    messages.push({id:'MSG'+i, title:m[0], body:m[1], cat:m[2], time:'07-'+String(28-i).padStart(2,'0')+' '+String(ri(8,20)).padStart(2,'0')+':'+String(ri(10,59)), read:i>3});
  });

  // 收入月数据（报表/大屏）
  const months = ['25-08','25-09','25-10','25-11','25-12','26-01','26-02','26-03','26-04','26-05','26-06','26-07'];
  const incomeByMonth = months.map((m,i)=>({m, 租金: 82+Math.round(Math.sin(i/2)*10)+i*2, 物业费: 14+ri(0,4), 水电: 9+ri(0,5), 停车: 6+ri(0,3)}));
  incomeByMonth.forEach(x=> x.total = x.租金+x.物业费+x.水电+x.停车);

  const api = {
    base:'https://pepems.chinapeople.com', projectId:'9496', userInfo:'ceshi',
    token:'82259D296E8A6069B14E583643FA7A40', tokenExpire:'7200s',
    endpoints:[
      {name:'获取请求 token', url:'/api/token', method:'GET', status:'已联通', latency:86},
      {name:'获取项目下所有表信息', url:'/api/platform/bar/engineer/getAllMeters', method:'GET', status:'已联通', latency:132},
      {name:'负荷数据', url:'/api/platform/ops/equipment/findLoadDataForList', method:'GET', status:'已联通', latency:245},
      {name:'用户列表', url:'/api/platform/mbr/consumer/findConsumerByCon', method:'GET', status:'已联通', latency:118},
      {name:'用户账单', url:'/api/platform/mbr/consumer/findConsumeBillByYear', method:'GET', status:'已联通', latency:154},
      {name:'用户充值', url:'/api/platform/mbr/consumer/consumerRecharge', method:'POST', status:'已联通', latency:201},
      {name:'远程分闸', url:'/api/platform/bar/engineer/disconnectMeter', method:'POST', status:'已联通', latency:340},
      {name:'远程合闸', url:'/api/platform/bar/engineer/connectMeter', method:'POST', status:'已联通', latency:322},
      {name:'远程抄表', url:'/api/platform/bar/engineer/callTermTask', method:'POST', status:'已联通', latency:512},
      {name:'充值记录', url:'/api/platform/mbr/consumer/findConsumerRecharge', method:'GET', status:'已联通', latency:143},
      {name:'表计日电量', url:'/api/platform/stat/meter/energy/day/getMeterEnergyByDate', method:'GET', status:'已联通', latency:167},
      {name:'表计月电量', url:'/api/platform/stat/meter/energy/day/getMeterEnergyByYear', method:'GET', status:'已联通', latency:171},
      {name:'项目表计日用电量', url:'/api/platform/stat/meter/energy/day/getMeterEnergyByProject', method:'GET', status:'已联通', latency:189},
    ],
    door:[
      {name:'门禁设备注册', vendor:'海康威视', status:'对接中', note:'厂商联调阶段，预计 8 月 20 日完成'},
      {name:'人员权限下发', vendor:'海康威视', status:'待启动', note:'依赖门禁设备注册完成'},
      {name:'开门记录回传', vendor:'海康威视', status:'待启动', note:'-'},
    ]
  };

  const plans = [ // 计划表 0727 摘要（用于工作台展示）
    ['片区管理','08-10','08-10'],['设备管理','08-10','08-18'],['水电费管理','08-13','08-22'],
    ['公寓/厂房/车位管理','08-22','09-03'],['写字楼/商业/其他','09-03','09-15'],['应收应付管理','09-15','09-18'],
    ['物业服务','09-18','09-22'],['固定资产管理','09-22','09-28'],['小程序用户端','09-28','10-27'],
    ['小程序管理端','10-27','11-24'],['数据报表管理','11-24','11-30'],['驾驶舱大屏','11-24','12-01'],
    ['水表/电表/门禁对接','08-10','08-22'],['系统部署','12-15','12-16']
  ];

  // 酒店：房价方案 + 在住记录（长租/日租/钟点并存）
  const hotelRates = [
    {room:'标准大床房', day:228, hour:'68 元/4小时', month:'3,600 元/月', weekend:'258', member:'9 折'},
    {room:'商务双床房', day:268, hour:'88 元/4小时', month:'4,200 元/月', weekend:'298', member:'9 折'},
    {room:'园区长包房', day:'-', hour:'-', month:'3,200 元/月（协议价）', weekend:'-', member:'企业协议'},
    {room:'行政套房', day:468, hour:'128 元/4小时', month:'7,800 元/月', weekend:'528', member:'8.8 折'},
  ];
  const hotelRooms = [];
  buildings.filter(b=>b.cat==='酒店').forEach(b=>{
    for(let f=1; f<=b.floors; f++) for(let r=1; r<=b.per; r++){
      const mode = f<=3 ? pick(['日租','日租','钟点']) : '长租';
      const st = pick(['在住','空净','空净','脏房','维修','在住']);
      hotelRooms.push({id:'H'+f+String(r).padStart(2,'0'), no:f+String(r).padStart(2,'0'), floor:f,
        type: pick(hotelRates).room, mode, status: mode==='长租' ? (st==='在住'?'已租':'空置') : st,
        guest: st==='在住'? pick(tenants).name : null,
        out: st==='在住'? (mode==='钟点'? '今日 '+ri(12,22)+':00' : '2026-08-0'+ri(1,9)) : null,
        price: mode==='长租'? '3,200/月' : mode==='日租'? '228/晚' : '68/4小时'});
    }
  });

  // 发票
  const invoices = [];
  bills.filter(b=>b.status==='已缴').slice(0,12).forEach((b,i)=>{
    invoices.push({id:'FP'+String(8000+i), bill:b.id, tenant:b.tname, type:b.type,
      amount:b.amount, title: pick([b.tname, b.tname, '英莱达园区企业（企业抬头）']),
      taxno: i%3===0? '91330100XXXXXXXX2X' : null,
      kind: i%3===0? '增值税专用发票' : '增值税普通发票（电子）',
      apply:'2026-07-'+String(ri(5,28)).padStart(2,'0'),
      status: pick(['已开具','已开具','已开具','待开具','已红冲'])});
  });

  // 派生统计
  const rentable = rooms.filter(r=>r.cat!=='酒店');
  const stats = {
    roomTotal: rentable.length,
    rented: rentable.filter(r=>r.status==='已租'||r.status==='到期').length,
    vacant: rentable.filter(r=>r.status==='空置').length,
    expire: rentable.filter(r=>r.status==='到期').length,
    repair: rentable.filter(r=>r.status==='维修').length,
    booked: rentable.filter(r=>r.status==='预定').length,
    spotTotal: spots.length,
    spotRented: spots.filter(s=>s.status==='已租').length,
    spotFree: spots.filter(s=>s.status==='空闲').length,
    arrearsTotal: receivables.filter(r=>r.status==='逾期').reduce((a,b)=>a+b.balance,0),
    monthIncome: incomeByMonth[incomeByMonth.length-1].total,
    metersOnline: meters.filter(m=>m.online==='在线').length,
    meterTotal: meters.length,
    contractsExpiring: contracts.filter(c=>c.status==='即将到期').length,
  };
  stats.rentRate = Math.round(stats.rented/stats.roomTotal*1000)/10;
  stats.spotRate = Math.round(stats.spotRented/stats.spotTotal*1000)/10;

  return {areas, buildings, lots, rooms, spots, tenants, contracts, bills, meters, readings,
    orders, complaints, assets, receivables, payables, collections, approvals, messages,
    incomeByMonth, months, api, plans, stats, hotelRates, hotelRooms, invoices, pick, ri};
})();
