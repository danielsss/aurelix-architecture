(() => {
  const cases = {
    normal: {
      title: 'A、B 各占一个名额',
      description: '同一份用户套餐，上限为 2。A、B 已获名额且仍在线，跨节点重复出现的同一 IP 只算一次。',
      rows: [['完整观测：A、B', ['A', 'B'], [], [], '不新增阻断']],
      result: '两份购买实例各有自己的名额；不会让整个套餐的所有购买者共用这 2 个名额。',
    },
    release: {
      title: '宽限内重新分配，只给仍在线的 IP',
      description: 'C 成为超额候选后进入宽限。以下两种退出情况是不同分支，不能先替已退出的 C 保留名额。',
      rows: [
        ['C 首次超额', ['A', 'B'], ['C'], [], 'C 宽限中，可继续连接'],
        ['A 退出，C 仍在线', ['B', 'C'], [], [], 'C 补位，不新增阻断'],
        ['另一分支：A、C 同时退出', ['B'], [], [], '只保留 B，空余 1 个名额'],
      ],
      result: '重复上报不重置宽限；名额变化须以新鲜、完整的跨节点观测为依据。',
    },
    blocked: {
      title: 'C 持续超限：决定、下发、确认是三个阶段',
      description: 'A、B 持续在线，C 没有空位。60 秒从首次成为超额候选开始，采样和执行可能带来额外延迟。',
      rows: [
        ['首次超额至宽限结束前', ['A', 'B'], ['C'], [], '宽限中，不新增阻断'],
        ['满 60 秒且完整新采样覆盖终点', ['A', 'B'], [], ['C'], '先存决定，再下发；待确认'],
        ['健康 ACK 的 revision 匹配目标', ['A', 'B'], [], ['C'], '确认已应用；限制新连接'],
      ],
      result: '不是到第 60 秒就精准断开。已建立的长连接可能保留，也不能因 C 从观测中消失而自动解封。',
    },
    missing: {
      title: '节点失联：未知不能当作零',
      description: '假设 MongoDB 中已有 A、B 占位和 C 的阻断决定。某节点未上报、采集失败或观测超过 90 秒时，覆盖不完整。',
      rows: [
        ['观测缺失或过期', ['A', 'B'], [], ['C'], '保留原决定；不新增阻断'],
        ['Redis 数据 5 分钟后被清理', ['A', 'B'], [], ['C'], '不据此释放名额或解封'],
        ['节点恢复连接', ['A', 'B'], [], ['C'], '协调已存配置，等待健康确认'],
      ],
      result: '恢复完整观测后再重新计算；离线节点上的应用或撤销始终保留为待确认。',
    },
  };
  const tabs = [...document.querySelectorAll('[data-case]')];
  const rows = document.getElementById('scenario-rows');
  const panel = document.getElementById('scenario-panel');
  function select(key, focus = false) {
    const item = cases[key] ?? cases.normal;
    const selected = cases[key] ? key : 'normal';
    document.getElementById('scenario-title').textContent = item.title;
    document.getElementById('scenario-description').textContent = item.description;
    document.getElementById('scenario-result').textContent = item.result;
    panel.setAttribute('aria-labelledby', `tab-${selected}`);
    tabs.forEach((tab) => {
      const active = tab.dataset.case === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    rows.replaceChildren(...item.rows.map((values) => {
      const tr = document.createElement('tr');
      values.forEach((value, index) => {
        const cell = document.createElement('td');
        if (Array.isArray(value)) {
          if (!value.length) cell.textContent = '—';
          value.forEach((ip) => {
            const span = document.createElement('span');
            span.className = 'ip';
            span.dataset.kind = ['allowed', 'grace', 'blocked'][index - 1];
            span.textContent = ip;
            cell.append(span);
          });
        } else cell.textContent = value;
        tr.append(cell);
      });
      return tr;
    }));
    const url = new URL(location.href);
    url.searchParams.set('case', selected);
    history.replaceState(null, '', url);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab.dataset.case));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(tabs[next].dataset.case, true);
    });
  });
  select(new URL(location.href).searchParams.get('case') ?? 'normal');
  const themeButton = document.getElementById('theme-toggle');
  const flow = document.getElementById('ip-flow');
  let saved;
  try { saved = localStorage.getItem('archify-theme'); } catch { /* Reading still works without storage. */ }
  const queryTheme = new URL(location.href).searchParams.get('theme');
  let theme = queryTheme === 'dark' || queryTheme === 'light' ? queryTheme : saved;
  if (!['dark', 'light'].includes(theme)) theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  function applyTheme() {
    document.documentElement.dataset.theme = theme;
    themeButton.textContent = theme === 'dark' ? '切换浅色' : '切换深色';
    const src = new URL(flow.src);
    src.searchParams.set('theme', theme);
    flow.src = src.href;
  }
  themeButton.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('archify-theme', theme); } catch { /* A theme change does not need storage. */ }
    applyTheme();
  });
  applyTheme();
})();
