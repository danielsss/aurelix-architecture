'use strict';
(() => {
  const { operations, revision } = window.CONTROL_GUIDE;
  const byId = new Map(operations.map(op => [op.id, op]));
  const groups = [...new Set(operations.map(op => op.group))];
  const $ = id => document.getElementById(id);
  let current, step = 0;
  function text(id, value) { $(id).textContent = value; }
  function nav() {
    const q = $('search').value.trim().toLocaleLowerCase();
    const matches = operations.filter(op => [op.title, op.group, op.where, op.answer, op.impact].join(' ').toLocaleLowerCase().includes(q));
    $('operations').replaceChildren();
    for (const group of groups) {
      const items = matches.filter(op => op.group === group);
      if (!items.length) continue;
      const section = document.createElement('section'); section.className = 'group';
      const h = document.createElement('h3'); h.textContent = group; section.append(h);
      for (const op of items) {
        const a = document.createElement('a'); a.href = `#${op.id}`; a.textContent = op.title;
        if (op.id === current?.id) a.setAttribute('aria-current', 'page');
        section.append(a);
      }
      $('operations').append(section);
    }
    text('count', q ? `${matches.length} / ${operations.length} 项操作` : `${operations.length} 项操作 · ${groups.length} 个主题`);
    $('empty').hidden = matches.length !== 0;
  }
  function showStep(index) {
    step = Math.max(0, Math.min(index, current.steps.length - 1));
    const item = current.steps[step];
    $('steps').querySelectorAll('button').forEach((button, i) => {
      if (i === step) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    });
    text('step-position', `步骤 ${step + 1} / ${current.steps.length}`);
    for (const [id, field] of [['step-title','title'],['actor','actor'],['action','action'],['state','state'],['evidence','evidence']]) text(id,item[field]);
    $('previous').disabled = step === 0; $('next-step').disabled = step === current.steps.length - 1;
  }
  function showOperation(moveFocus = false) {
    let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { id = ''; }
    if (id === 'main' && current) return;
    current = byId.get(id) || byId.get('add-node');
    document.title = `${current.title} · Control 操作机制 · Aurelix`;
    for (const [element, field] of [['where','where'],['operation-title','title'],['answer','answer'],['impact','impact'],['success','success'],['trap','trap'],['failure','failure'],['api','api']]) text(element,current[field]);
    $('steps').replaceChildren();
    current.steps.forEach((item, index) => {
      const li = document.createElement('li'), button = document.createElement('button'), number = document.createElement('span'), label = document.createElement('span');
      button.type = 'button'; button.setAttribute('aria-controls','step-detail'); number.className = 'number'; number.textContent = index + 1; label.textContent = item.title;
      button.append(number,label); button.addEventListener('click', () => showStep(index)); li.append(button); $('steps').append(li);
    });
    text('revision', revision.slice(0,7)); $('sources').replaceChildren();
    for (const source of current.sources) {
      const li = document.createElement('li'), a = document.createElement('a');
      a.href = `https://github.com/danielsss/aurelix/blob/${revision}/${source.path}#L${source.line}`; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = `${source.path}:${source.line}`; li.append(a); $('sources').append(li);
    }
    $('technical').open = false;
    const related = byId.get(current.next) || byId.get('status'); $('related').href = `#${related.id}`; $('related').textContent = `${related.title} →`;
    showStep(0); nav();
    if (moveFocus) { $('main').focus({preventScroll:true}); $('operation').scrollIntoView({block:'start'}); }
  }
  $('search').addEventListener('input', nav);
  $('clear').addEventListener('click', () => { $('search').value = ''; nav(); $('search').focus(); });
  $('previous').addEventListener('click', () => showStep(step - 1));
  $('next-step').addEventListener('click', () => showStep(step + 1));
  window.addEventListener('hashchange', () => showOperation(true));
  showOperation();
})();
