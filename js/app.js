// BabyQ prototype — auth, children, schedule rendering, records, notifications.
const store = {
  get(k, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem('bq_' + k));
      return v === null || v === undefined ? fallback : v;
    } catch {
      return fallback;
    }
  },
  set(k, v) { localStorage.setItem('bq_' + k, JSON.stringify(v)); },
  del(k) { localStorage.removeItem('bq_' + k); },
};

const state = {
  user: null,
  children: [],
  activeChildId: null,
  records: {}, // childId -> { "vaccineId:months" -> {date, brand, note} }
  windowStart: null, // first visible age-column index; null = auto-focus on child age
};

const WINDOW_SIZE = 11;  // visible age columns: 3 previous, current, 7 next
const WINDOW_PREV = 3;
const WINDOW_SHIFT = 8;  // page step keeps 3 columns of overlap for continuity

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function ageMonths(dob) {
  const birth = new Date(dob + 'T00:00:00');
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  return Math.max(0, months);
}

function formatAge(months) {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} ${t('monthsUnit')}`;
  if (m === 0) return `${y} ${t('yearsUnit')}`;
  return `${y} ${t('yearsUnit')} ${m} ${t('monthsUnit')}`;
}

function graceFor(months) { return months < 24 ? 1 : 3; }

function doseKey(vaccineId, months) { return vaccineId + ':' + months; }

function getRecord(childId, vaccineId, months) {
  return (state.records[childId] || {})[doseKey(vaccineId, months)] || null;
}

function doseStatus(child, vaccineId, months) {
  if (getRecord(child.id, vaccineId, months)) return 'done';
  const age = ageMonths(child.dob);
  if (age > months + graceFor(months)) return 'overdue';
  if (age >= months) return 'due';
  return 'upcoming';
}

function contrastColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? '#3e4c66' : '#ffffff';
}

function findVaccine(id) { return VACCINES.find(v => v.id === id); }
function findDose(vaccine, months) { return vaccine.doses.find(d => d.months === months); }
function ageLabel(months) { return L(AGE_COLUMNS.find(c => c.months === months).label); }

// ---------- persistence ----------
function loadUserData() {
  const allChildren = store.get('children', {});
  state.children = Object.values(allChildren).filter(c => c.userId === state.user.id);
  state.activeChildId = state.children.length ? state.children[0].id : null;
  state.records = store.get('records', {});
}

function persistChildren() {
  const all = store.get('children', {});
  state.children.forEach(c => { all[c.id] = c; });
  store.set('children', all);
}

function persistRecords() { store.set('records', state.records); }

// ---------- auth ----------
function signIn(user) {
  state.user = user;
  store.set('session', user.id);
  loadUserData();
  showView('app');
  renderApp();
}

function handleGoogle() {
  const users = store.get('users', {});
  let user = Object.values(users).find(u => u.provider === 'google');
  if (!user) {
    user = { id: uid(), provider: 'google', name: 'Google User', email: 'user@gmail.com' };
    users[user.id] = user;
    store.set('users', users);
  }
  signIn(user);
}

function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim().toLowerCase();
  const password = document.getElementById('signup-password').value;
  if (!name || !email || !password) return;
  const users = store.get('users', {});
  if (Object.values(users).some(u => u.email === email)) {
    document.getElementById('auth-error').textContent = t('emailUsed');
    return;
  }
  const user = { id: uid(), provider: 'email', name, email, password };
  users[user.id] = user;
  store.set('users', users);
  signIn(user);
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const users = store.get('users', {});
  const user = Object.values(users).find(u => u.email === email && u.password === password);
  if (!user) {
    document.getElementById('auth-error').textContent = t('authError');
    return;
  }
  signIn(user);
}

function logout() {
  store.del('session');
  state.user = null;
  showView('auth');
}

// ---------- children ----------
function saveChild(e) {
  e.preventDefault();
  const id = document.getElementById('child-id').value;
  const name = document.getElementById('child-name').value.trim();
  const dob = document.getElementById('child-dob').value;
  const sex = document.getElementById('child-sex').value;
  if (!name || !dob) return;
  if (id) {
    const child = state.children.find(c => c.id === id);
    Object.assign(child, { name, dob, sex });
  } else {
    const child = { id: uid(), userId: state.user.id, name, dob, sex };
    state.children.push(child);
    state.activeChildId = child.id;
  }
  persistChildren();
  state.windowStart = null;
  closeModal();
  renderApp();
}

function deleteChild(childId) {
  if (!confirm(t('confirmDeleteChild'))) return;
  state.children = state.children.filter(c => c.id !== childId);
  const all = store.get('children', {});
  delete all[childId];
  store.set('children', all);
  delete state.records[childId];
  persistRecords();
  if (state.activeChildId === childId) {
    state.activeChildId = state.children.length ? state.children[0].id : null;
  }
  state.windowStart = null;
  renderApp();
}

function activeChild() {
  return state.children.find(c => c.id === state.activeChildId) || null;
}

function ageFocusStart(child) {
  if (!child) return 0;
  const age = ageMonths(child.dob);
  let currentCol = 0;
  AGE_COLUMNS.forEach((c, i) => { if (c.months <= age) currentCol = i; });
  return Math.max(0, Math.min(currentCol - WINDOW_PREV, AGE_COLUMNS.length - WINDOW_SIZE));
}

function windowStartFor(child) {
  if (state.windowStart === null) state.windowStart = ageFocusStart(child);
  return state.windowStart;
}

function loadSampleData() {
  const dob = new Date();
  dob.setMonth(dob.getMonth() - 5);
  const iso = d => d.toISOString().slice(0, 10);
  const child = { id: uid(), userId: state.user.id, name: 'Aisha', dob: iso(dob), sex: 'female' };
  state.children.push(child);
  state.activeChildId = child.id;
  persistChildren();
  const recs = state.records[child.id] = state.records[child.id] || {};
  const at = (monthsAgo) => {
    const d = new Date(dob);
    d.setMonth(d.getMonth() + monthsAgo);
    return iso(d);
  };
  recs[doseKey('hepb', 0)] = { date: at(0), brand: 'Engerix-B', note: '' };
  recs[doseKey('bcg', 1)] = { date: at(1), brand: 'BCG Biofarma', note: '' };
  recs[doseKey('polio', 2)] = { date: at(2), brand: '', note: 'OPV tetes' };
  recs[doseKey('dpt', 2)] = { date: at(2), brand: 'Pentabio', note: '' };
  recs[doseKey('hib', 2)] = { date: at(2), brand: 'Pentabio', note: '' };
  recs[doseKey('pcv', 2)] = { date: at(2), brand: 'Prevenar 13', note: '' };
  recs[doseKey('rotavirus', 2)] = { date: at(2), brand: 'Rotarix', note: '' };
  recs[doseKey('polio', 3)] = { date: at(3), brand: '', note: '' };
  recs[doseKey('dpt', 3)] = { date: at(3), brand: 'Pentabio', note: '' };
  recs[doseKey('hib', 3)] = { date: at(3), brand: 'Pentabio', note: '' };
  recs[doseKey('pcv', 3)] = { date: at(3), brand: 'Prevenar 13', note: '' };
  recs[doseKey('rotavirus', 3)] = { date: at(3), brand: 'Rotarix', note: '' };
  persistRecords();
  state.windowStart = null;
  renderApp();
}

// ---------- records ----------
function saveRecord(e) {
  e.preventDefault();
  const childId = document.getElementById('rec-child-id').value;
  const vaccineId = document.getElementById('rec-vaccine-id').value;
  const months = Number(document.getElementById('rec-months').value);
  const date = document.getElementById('rec-date').value;
  const brand = document.getElementById('rec-brand').value.trim();
  const note = document.getElementById('rec-note').value.trim();
  if (!date) return;
  const recs = state.records[childId] = state.records[childId] || {};
  recs[doseKey(vaccineId, months)] = { date, brand, note };
  persistRecords();
  closeModal();
  renderApp();
}

function deleteRecord(childId, vaccineId, months) {
  if (!confirm(t('confirmDeleteRecord'))) return;
  const recs = state.records[childId];
  if (recs) delete recs[doseKey(vaccineId, months)];
  persistRecords();
  closeModal();
  renderApp();
}

// ---------- modal ----------
function openModal(html) {
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-body').innerHTML = '';
}

function openChildModal(child) {
  const isEdit = !!child;
  openModal(`
    <h3>${t(isEdit ? 'editChild' : 'addChild')}</h3>
    <form id="child-form">
      <input type="hidden" id="child-id" value="${isEdit ? child.id : ''}">
      <label>${t('childName')}
        <input type="text" id="child-name" required value="${isEdit ? child.name : ''}">
      </label>
      <label>${t('dob')}
        <input type="date" id="child-dob" required value="${isEdit ? child.dob : ''}" max="${new Date().toISOString().slice(0, 10)}">
      </label>
      <label>${t('sex')}
        <select id="child-sex">
          <option value="">—</option>
          <option value="male" ${isEdit && child.sex === 'male' ? 'selected' : ''}>${t('male')}</option>
          <option value="female" ${isEdit && child.sex === 'female' ? 'selected' : ''}>${t('female')}</option>
        </select>
      </label>
      <div class="modal-actions">
        <button type="button" class="btn ghost" id="modal-cancel">${t('cancel')}</button>
        <button type="submit" class="btn primary">${t('save')}</button>
      </div>
    </form>
  `);
  document.getElementById('child-form').addEventListener('submit', saveChild);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
}

function openDoseModal(child, vaccineId, months) {
  const vaccine = findVaccine(vaccineId);
  const dose = findDose(vaccine, months);
  const status = doseStatus(child, vaccineId, months);
  const record = getRecord(child.id, vaccineId, months);
  const textColor = contrastColor(vaccine.color);
  const today = new Date().toISOString().slice(0, 10);
  openModal(`
    <div class="dose-head">
      <span class="vaccine-chip" style="background:linear-gradient(135deg, color-mix(in srgb, ${vaccine.color} 45%, #ffffff), ${vaccine.color});color:${textColor};border:1px solid color-mix(in srgb, ${vaccine.color} 80%, #b9a)">${L(vaccine.name)}</span>
      <span class="dose-code">${dose.code}</span>
      <span class="status-badge status-${status}">${t('status' + status[0].toUpperCase() + status.slice(1))}</span>
    </div>
    <p class="dose-meta"><strong>${t('scheduledAt')}:</strong> ${ageLabel(months)} · ${child.name} (${formatAge(ageMonths(child.dob))})</p>
    ${dose.repeat ? `<p class="dose-repeat">${t('repeatYearly')}</p>` : ''}
    <div class="dose-expl">
      <h4>${t('explanation')}</h4>
      <p>${L(vaccine.prevents)}</p>
    </div>
    <form id="record-form">
      <input type="hidden" id="rec-child-id" value="${child.id}">
      <input type="hidden" id="rec-vaccine-id" value="${vaccineId}">
      <input type="hidden" id="rec-months" value="${months}">
      <label>${t('givenOn')}
        <input type="date" id="rec-date" required max="${today}" value="${record ? record.date : today}">
      </label>
      <label>${t('brand')}
        <input type="text" id="rec-brand" placeholder="${t('brandPlaceholder')}" value="${record ? record.brand : ''}">
      </label>
      <label>${t('note')}
        <textarea id="rec-note" rows="2" placeholder="${t('notePlaceholder')}">${record ? record.note : ''}</textarea>
      </label>
      <div class="modal-actions">
        ${record ? `<button type="button" class="btn danger" id="rec-delete">${t('deleteRecord')}</button>` : ''}
        <button type="button" class="btn ghost" id="modal-cancel">${t('cancel')}</button>
        <button type="submit" class="btn primary">${t(record ? 'updateRecord' : 'markDone')}</button>
      </div>
    </form>
  `);
  document.getElementById('record-form').addEventListener('submit', saveRecord);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  const del = document.getElementById('rec-delete');
  if (del) del.addEventListener('click', () => deleteRecord(child.id, vaccineId, months));
}

// ---------- tooltip ----------
const tooltip = () => document.getElementById('tooltip');

function showTooltip(evt, child, vaccine, dose) {
  const el = tooltip();
  const status = doseStatus(child, vaccine.id, dose.months);
  el.innerHTML = `
    <strong>${L(vaccine.name)} — ${dose.code}</strong>
    <span>${t('scheduledAt')}: ${ageLabel(dose.months)}</span>
    <span class="tt-${status}">${t('status' + status[0].toUpperCase() + status.slice(1))}</span>
  `;
  el.classList.remove('hidden');
  const rect = evt.currentTarget.getBoundingClientRect();
  el.style.left = Math.min(rect.left, window.innerWidth - 240) + 'px';
  el.style.top = (rect.bottom + 6) + 'px';
}

function hideTooltip() { tooltip().classList.add('hidden'); }

// ---------- rendering ----------
function showView(name) {
  document.getElementById('view-auth').classList.toggle('hidden', name !== 'auth');
  document.getElementById('view-app').classList.toggle('hidden', name !== 'app');
  document.getElementById('auth-error').textContent = '';
}

function renderChildTabs() {
  const wrap = document.getElementById('child-tabs');
  wrap.innerHTML = '';
  state.children.forEach(child => {
    const btn = document.createElement('button');
    btn.className = 'child-tab' + (child.id === state.activeChildId ? ' active' : '');
    btn.innerHTML = `<span class="child-avatar">${child.name[0].toUpperCase()}</span>
      <span class="child-tab-info"><strong>${child.name}</strong><small>${formatAge(ageMonths(child.dob))}</small></span>`;
    btn.addEventListener('click', () => {
      state.activeChildId = child.id;
      state.windowStart = null;
      renderApp();
    });
    wrap.appendChild(btn);
  });
  const add = document.createElement('button');
  add.className = 'child-tab add';
  add.textContent = '+ ' + t('addChild');
  add.addEventListener('click', () => openChildModal(null));
  wrap.appendChild(add);
}

function renderChildInfo() {
  const child = activeChild();
  const bar = document.getElementById('child-info');
  if (!child) { bar.innerHTML = ''; return; }
  const age = ageMonths(child.dob);
  let dueTotal = 0, doneTotal = 0;
  VACCINES.forEach(v => v.doses.forEach(d => {
    if (d.months <= age) {
      dueTotal += 1;
      if (getRecord(child.id, v.id, d.months)) doneTotal += 1;
    }
  }));
  const pct = dueTotal ? Math.round((doneTotal / dueTotal) * 100) : 100;
  bar.innerHTML = `
    <div class="child-info-main">
      <h2>${child.name}</h2>
      <span class="child-age">${t('ageNow')}: ${formatAge(age)}</span>
    </div>
    <div class="progress-wrap">
      <div class="progress-label">${doneTotal}/${dueTotal} ${t('progressDone')} (${pct}%)</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="child-actions">
      <button class="btn ghost small" id="edit-child">${t('editChild')}</button>
      <button class="btn danger small" id="delete-child">${t('delete')}</button>
    </div>
  `;
  document.getElementById('edit-child').addEventListener('click', () => openChildModal(child));
  document.getElementById('delete-child').addEventListener('click', () => deleteChild(child.id));
}

function renderScheduleControls(child) {
  const el = document.getElementById('schedule-controls');
  const start = windowStartFor(child);
  const endIdx = Math.min(start + WINDOW_SIZE, AGE_COLUMNS.length) - 1;
  const focused = start === ageFocusStart(child);
  el.innerHTML = `
    <button class="btn ghost small" id="cols-prev" ${start === 0 ? 'disabled' : ''}>‹ ${t('prevCols')}</button>
    <span class="cols-range">${L(AGE_COLUMNS[start].label)} – ${L(AGE_COLUMNS[endIdx].label)}</span>
    <button class="btn ghost small" id="cols-next" ${endIdx >= AGE_COLUMNS.length - 1 ? 'disabled' : ''}>${t('nextCols')} ›</button>
    ${focused ? '' : `<button class="btn ghost small" id="cols-now">${t('backToNow')}</button>`}
  `;
  document.getElementById('cols-prev').addEventListener('click', () => {
    state.windowStart = Math.max(0, start - WINDOW_SHIFT);
    renderApp();
  });
  document.getElementById('cols-next').addEventListener('click', () => {
    state.windowStart = Math.min(start + WINDOW_SHIFT, AGE_COLUMNS.length - WINDOW_SIZE);
    renderApp();
  });
  const now = document.getElementById('cols-now');
  if (now) now.addEventListener('click', () => {
    state.windowStart = null;
    renderApp();
  });
}

function renderSchedule() {
  const child = activeChild();
  const grid = document.getElementById('schedule-grid');
  grid.innerHTML = '';
  const start = windowStartFor(child);
  const cols = AGE_COLUMNS.slice(start, start + WINDOW_SIZE);
  grid.style.gridTemplateColumns = `190px repeat(${cols.length}, minmax(62px, 1fr))`;
  const age = child ? ageMonths(child.dob) : -1;
  let currentCol = -1;
  AGE_COLUMNS.forEach((c, i) => { if (c.months <= age) currentCol = i; });

  const corner = document.createElement('div');
  corner.className = 'cell corner';
  corner.textContent = t('vaccineCol') + ' / ' + t('ageCol');
  grid.appendChild(corner);

  cols.forEach((c, j) => {
    const i = start + j;
    const h = document.createElement('div');
    h.className = 'cell col-header' + (i === currentCol ? ' current-col' : '');
    h.textContent = L(c.label);
    grid.appendChild(h);
  });

  VACCINES.forEach(vaccine => {
    const textColor = contrastColor(vaccine.color);
    const label = document.createElement('div');
    label.className = 'cell row-label';
    label.style.setProperty('--vaccine-color', vaccine.color);
    label.style.setProperty('--vaccine-text', textColor);
    label.textContent = L(vaccine.name);
    grid.appendChild(label);

    const doseMap = {};
    vaccine.doses.forEach(d => { doseMap[d.months] = d; });

    cols.forEach((c, j) => {
      const i = start + j;
      const cell = document.createElement('div');
      const dose = doseMap[c.months];
      if (!dose || !child) {
        cell.className = 'cell empty' + (i === currentCol ? ' current-col' : '');
        grid.appendChild(cell);
        return;
      }
      const status = doseStatus(child, vaccine.id, c.months);
      cell.className = `cell dose status-${status}` + (i === currentCol ? ' current-col' : '');
      cell.style.setProperty('--vaccine-color', vaccine.color);
      cell.style.setProperty('--vaccine-text', textColor);
      cell.innerHTML = `<span class="dose-label">${dose.code}</span>` + (status === 'done' ? '<span class="done-check">✓</span>' : '');
      cell.addEventListener('click', () => openDoseModal(child, vaccine.id, c.months));
      cell.addEventListener('mouseenter', (e) => showTooltip(e, child, vaccine, dose));
      cell.addEventListener('mouseleave', hideTooltip);
      grid.appendChild(cell);
    });
  });
}

function computeNotifications() {
  const items = [];
  state.children.forEach(child => {
    const age = ageMonths(child.dob);
    VACCINES.forEach(v => v.doses.forEach(d => {
      if (getRecord(child.id, v.id, d.months)) return;
      let kind = null;
      if (age > d.months + graceFor(d.months)) kind = 'overdue';
      else if (age >= d.months) kind = 'due';
      else if (d.months - age <= graceFor(d.months)) kind = 'upcoming';
      if (kind) items.push({ child, vaccine: v, dose: d, kind });
    }));
  });
  const order = { overdue: 0, due: 1, upcoming: 2 };
  items.sort((a, b) => order[a.kind] - order[b.kind] || a.dose.months - b.dose.months);
  return items;
}

function renderNotifications() {
  const items = computeNotifications();
  const badge = document.getElementById('notif-badge');
  badge.textContent = items.length;
  badge.classList.toggle('hidden', items.length === 0);

  const list = document.getElementById('notif-list');
  list.innerHTML = '';
  if (!items.length) {
    const p = document.createElement('p');
    p.className = 'notif-empty';
    p.textContent = t('noNotifications');
    list.appendChild(p);
    return;
  }
  const byChild = {};
  items.forEach(item => {
    (byChild[item.child.id] = byChild[item.child.id] || []).push(item);
  });
  Object.values(byChild).forEach(childItems => {
    const group = document.createElement('div');
    group.className = 'notif-group';
    const title = document.createElement('h4');
    title.textContent = childItems[0].child.name;
    group.appendChild(title);
    childItems.forEach(item => {
      const row = document.createElement('button');
      row.className = 'notif-item notif-' + item.kind;
      const kindKey = item.kind === 'overdue' ? 'notifOverdue' : item.kind === 'due' ? 'notifDue' : 'notifUpcoming';
      row.innerHTML = `<span class="notif-dot" style="background:${item.vaccine.color}"></span>
        <span><strong>${L(item.vaccine.name)} ${item.dose.code}</strong> ${t(kindKey)} (${ageLabel(item.dose.months)})</span>`;
      row.addEventListener('click', () => {
        state.activeChildId = item.child.id;
        const colIdx = AGE_COLUMNS.findIndex(c => c.months === item.dose.months);
        state.windowStart = Math.max(0, Math.min(colIdx - WINDOW_PREV, AGE_COLUMNS.length - WINDOW_SIZE));
        renderApp();
        toggleNotifPanel(false);
        openDoseModal(item.child, item.vaccine.id, item.dose.months);
      });
      group.appendChild(row);
    });
    list.appendChild(group);
  });
}

function toggleNotifPanel(force) {
  const panel = document.getElementById('notif-panel');
  const show = force !== undefined ? force : panel.classList.contains('hidden');
  panel.classList.toggle('hidden', !show);
}

function renderApp() {
  if (!state.user) return;
  document.getElementById('user-name').textContent = state.user.name;
  document.getElementById('lang-toggle').textContent = t('langLabel');
  renderChildTabs();
  const hasChildren = state.children.length > 0;
  document.getElementById('onboarding').classList.toggle('hidden', hasChildren);
  document.getElementById('schedule-area').classList.toggle('hidden', !hasChildren);
  if (hasChildren) {
    renderChildInfo();
    renderSchedule();
    renderScheduleControls(activeChild());
    document.getElementById('schedule-title').textContent = t('scheduleTitle');
    document.getElementById('schedule-subtitle').textContent = t('scheduleSubtitle');
    document.getElementById('footer-note').textContent = t('footerNote');
  }
  renderNotifications();
  I18n.applyStatic();
}

// ---------- init ----------
function init() {
  I18n.applyStatic();

  document.getElementById('btn-google').addEventListener('click', handleGoogle);
  document.getElementById('form-login').addEventListener('submit', handleLogin);
  document.getElementById('form-signup').addEventListener('submit', handleSignup);
  document.getElementById('show-signup').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('form-login').classList.add('hidden');
    document.getElementById('form-signup').classList.remove('hidden');
    document.getElementById('auth-error').textContent = '';
  });
  document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('form-signup').classList.add('hidden');
    document.getElementById('form-login').classList.remove('hidden');
    document.getElementById('auth-error').textContent = '';
  });
  document.getElementById('btn-logout').addEventListener('click', logout);
  document.getElementById('lang-toggle').addEventListener('click', () => {
    I18n.toggle();
    renderApp();
  });
  document.getElementById('btn-notif').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleNotifPanel();
  });
  document.addEventListener('click', (e) => {
    if (!document.getElementById('notif-panel').contains(e.target)) toggleNotifPanel(false);
  });
  document.getElementById('btn-add-first-child').addEventListener('click', () => openChildModal(null));
  document.getElementById('btn-sample-data').addEventListener('click', loadSampleData);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  const sessionId = store.get('session', null);
  if (sessionId) {
    const users = store.get('users', {});
    const user = users[sessionId];
    if (user) {
      state.user = user;
      loadUserData();
      showView('app');
      renderApp();
      return;
    }
  }
  showView('auth');
}

document.addEventListener('DOMContentLoaded', init);
