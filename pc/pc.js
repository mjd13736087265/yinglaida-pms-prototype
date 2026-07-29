/* ===== PC 后台 · 路由与菜单框架 ===== */
window.PC = (function(){
  const V = {};          // 路由表 path -> {t, r}
  const reg = (path, title, render) => V[path] = {t:title, r:render};

  // 菜单：[{t, ic, children:[{t, path}]}]
  const MENU = [
    {t:'工作台', ic:'🏠', path:'/dashboard'},
    {t:'片区管理', ic:'🗺️', path:'/area'},
    {t:'设备管理', ic:'⚡', children:[
      {t:'电表管理', path:'/device/1'}, {t:'水表管理', path:'/device/2'}]},
    {t:'水电费管理', ic:'💧', children:[
      {t:'智能抄表', path:'/water/read'}, {t:'抄表记录', path:'/water/records'},
      {t:'账单推送', path:'/water/bills'}, {t:'公摊管理', path:'/water/share'},
      {t:'用量预警', path:'/water/alarm'}, {t:'欠费联动策略', path:'/water/strategy'}]},
    {t:'宿舍管理', ic:'🛏️', children:[
      {t:'房态监控', path:'/estate/公寓/map'}, {t:'房源管理', path:'/estate/公寓'},
      {t:'入住/退房', path:'/estate/公寓/check'}, {t:'空置率统计', path:'/estate/公寓/stats'},
      {t:'租金账单', path:'/estate/公寓/bills'}]},
    {t:'厂房管理', ic:'🏭', children:[
      {t:'厂房图形化', path:'/estate/厂房/map'}, {t:'厂房列表', path:'/estate/厂房'},
      {t:'租金定价', path:'/estate/厂房/price'}, {t:'厂房销售', path:'/estate/厂房/sale'},
      {t:'租金账单', path:'/estate/厂房/bills'}]},
    {t:'车位管理', ic:'🅿️', children:[
      {t:'停车场管理', path:'/park/lots'}, {t:'车位信息', path:'/park/spots'},
      {t:'车位合同', path:'/park/contracts'}, {t:'临时停车计费', path:'/park/temp'},
      {t:'车位销售', path:'/park/sale'}]},
    {t:'写字楼管理', ic:'🏢', children:[
      {t:'房态监控', path:'/estate/写字楼/map'}, {t:'房源管理', path:'/estate/写字楼'},
      {t:'租金账单', path:'/estate/写字楼/bills'}]},
    {t:'商业管理', ic:'🏬', children:[
      {t:'房态监控', path:'/estate/商业/map'}, {t:'房源管理', path:'/estate/商业'},
      {t:'租金账单', path:'/estate/商业/bills'}]},
    {t:'酒店管理', ic:'🏨', children:[
      {t:'客房营业', path:'/estate/酒店/biz'}, {t:'房价方案', path:'/estate/酒店/rate'},
      {t:'房态监控', path:'/estate/酒店/map'}, {t:'房源管理', path:'/estate/酒店'}]},
    {t:'其他产业', ic:'📦', children:[
      {t:'房态监控', path:'/estate/其他/map'}, {t:'房源管理', path:'/estate/其他'}]},
    {t:'应收应付', ic:'💰', children:[
      {t:'应收账款', path:'/fin/recv'}, {t:'收款核销', path:'/fin/verify'},
      {t:'押金台账', path:'/fin/deposit'},
      {t:'账龄分析', path:'/fin/aging'}, {t:'催收管理', path:'/fin/collect'},
      {t:'应付账款', path:'/fin/pay'}, {t:'发票管理', path:'/fin/invoice'}]},
    {t:'物业服务', ic:'🔧', children:[
      {t:'报修工单', path:'/svc/orders'}, {t:'投诉管理', path:'/svc/complaints'}]},
    {t:'固定资产', ic:'🗄️', children:[
      {t:'资产台账', path:'/asset/list'}, {t:'资产分类', path:'/asset/cat'},
      {t:'资产变动', path:'/asset/change'}, {t:'盘点管理', path:'/asset/stock'}]},
    {t:'数据报表', ic:'📈', children:[
      {t:'收入报表', path:'/rpt/income'}, {t:'出租率报表', path:'/rpt/rent'},
      {t:'租户报表', path:'/rpt/tenant'}, {t:'合同报表', path:'/rpt/contract'},
      {t:'应收账款报表', path:'/rpt/recv'}, {t:'现金流报表', path:'/rpt/cash'},
      {t:'自定义报表', path:'/rpt/custom'},
      {t:'报表导出', path:'/rpt/export'}]},
    {t:'驾驶舱大屏', ic:'📊', path:'/screen-entry'},
    {t:'数据对接', ic:'🔌', children:[
      {t:'接口配置', path:'/api/config'}, {t:'接口监控', path:'/api/monitor'},
      {t:'门禁对接', path:'/api/door'}, {t:'消息推送', path:'/api/push'}]},
    {t:'系统管理', ic:'⚙️', children:[
      {t:'用户与角色', path:'/sys/user'}, {t:'数据字典', path:'/sys/dict'},
      {t:'合同模板', path:'/sys/contractTpl'}, {t:'功能开关', path:'/sys/features'},
      {t:'账单参数', path:'/sys/billing'},
      {t:'提醒设置', path:'/sys/remind'}, {t:'审批对接', path:'/sys/flow'},
      {t:'上线初始化', path:'/sys/init'},
      {t:'操作日志', path:'/sys/log'}]},
  ];

  // 浏览器会对 hash 中的中文做百分号编码（#/estate/公寓 → %E5%85%AC%E5%AF%93），必须解码后再匹配路由
  function curHash(){
    let h = location.hash.slice(1) || '/dashboard';
    try { h = decodeURIComponent(h); } catch(e) {}
    return h;
  }

  let expanded = new Set();
  function renderMenu(){
    const cur = curHash();
    let h = '';
    MENU.forEach(m=>{
      if(m.children){
        const open = expanded.has(m.t) || m.children.some(c=>cur.startsWith(c.path.split('/').slice(0,3).join('/')) && matchGroup(cur, c.path));
        const active = m.children.some(c=>cur===c.path || cur.startsWith(c.path+'/'));
        h += `<div class="mi ${active?'on':''}" onclick="PC.toggle('${m.t}')"><span class="ic">${m.ic}</span>${m.t}<span class="arr">${open?'▾':'▸'}</span></div>`;
        if(open) m.children.forEach(c=>{ h += `<span class="sub-mi ${cur===c.path?'on':''}" onclick="event.stopPropagation();location.hash='#${c.path}'">${c.t}</span>`; });
      } else {
        h += `<div class="mi ${cur===m.path?'on':''}" onclick="location.hash='#${m.path}'"><span class="ic">${m.ic}</span>${m.t}</div>`;
      }
    });
    document.getElementById('menu').innerHTML = h;
  }
  function matchGroup(cur, p){ return cur.split('/')[1] === p.split('/')[1]; }

  function toggle(t){ expanded.has(t)? expanded.delete(t) : expanded.add(t); renderMenu(); }

  function route(){
    UI.close();
    const hash = curHash();
    const parts = hash.split('/').filter(Boolean);
    // 精确匹配 -> 前缀匹配
    let hit = V[hash];
    if(!hit){
      const key = Object.keys(V).sort((a,b)=>b.length-a.length).find(k=>hash===k || hash.startsWith(k+'/'));
      if(key) hit = V[key];
    }
    const app = document.getElementById('app');
    if(!hit){ app.innerHTML = '<div class="card"><div class="empty">页面不存在：'+UI.esc(hash)+'</div></div>'; return; }
    document.getElementById('crumb').textContent = hit.t;
    app.innerHTML = '';
    hit.r(app, parts.slice(1));
    renderMenu();
    app.scrollTop = 0; document.querySelector('.content').scrollTop = 0;
  }

  function notices(){
    UI.drawer('🔔 消息提醒', UI.timeline(DB.messages.slice(0,8).map(m=>({
      t:`${m.title} <span class="badge b-${m.cat==='催缴'?'red':m.cat==='预警'?'orange':'blue'}" style="margin-left:6px">${m.cat}</span>`,
      d:`${m.body}<br><span style="color:#b8c0d0">07-${m.time.slice(3)}</span>`, act:!m.read}))));
  }

  function start(){
    window.addEventListener('hashchange', route);
    route();
  }

  // 数据权限视角（R-03）：模拟不同角色账号登录后的数据范围隔离
  let _scope = ''; // '' = 全部片区
  function scopeMenu(){
    const opts = [{id:'', n:'全部片区（管理员 / 财务视角）'}].concat(DB.areas.map(a=>({id:a.id, n:a.name+'（片区经理视角）'})));
    UI.modal({title:'切换数据权限视角', size:'sm', body:
      opts.map(o=>`<div class="mrow" style="cursor:pointer" onclick="PC.setScope('${o.id}')">
        <div class="tx"><div class="tt">${o.n}</div></div>
        ${_scope===o.id?'<span class="badge b-blue">当前</span>':'<span class="ar">›</span>'}</div>`).join('') +
      `<div style="font-size:12px;color:var(--ink3);margin-top:10px;line-height:1.8">数据权限由「系统管理 → 用户与角色 → 数据权限配置」统一管理，不同角色可自定义可见片区。此处模拟不同角色登录后的数据隔离效果。</div>`});
  }
  function setScope(aid){
    _scope = aid; PC._dashAid = aid;
    const lab = document.getElementById('area-switch');
    if(lab) lab.textContent = '📍 ' + (aid? DB.areaName(aid) : '全部片区') + ' ▾';
    UI.close();
    UI.toast(aid? '数据权限视角：仅 '+DB.areaName(aid) : '数据权限视角：全部片区');
    route();
  }

  return {reg, toggle, start, notices, MENU, scopeMenu, setScope, getScope: ()=>_scope};
})();
