'use strict';

/* 案件一覧ページ */

const FIELDS = ['q', 'name', 'content', 'qualification', 'domain', 'location', 'price', 'sort'];
const form = document.getElementById('search-form');
const listArea = document.getElementById('list-area');
const countArea = document.getElementById('count-area');
const errorArea = document.getElementById('error-area');
const sortSel = document.getElementById('sort');
const detailBox = document.getElementById('search-detail');
const toggleBtn = document.getElementById('toggle-detail');

let state = {};
let requestSeq = 0;

function fieldEl(name) {
  return document.getElementById(name);
}

/** URLのクエリから条件を復元（詳細→戻る でも条件が保持される） */
function readStateFromUrl() {
  const p = new URLSearchParams(location.search);
  const s = {};
  for (const f of FIELDS) s[f] = p.get(f) || '';
  if (!s.sort) s.sort = 'new';
  return s;
}

function writeStateToUrl() {
  const p = new URLSearchParams();
  for (const f of FIELDS) {
    if (state[f] && !(f === 'sort' && state[f] === 'new')) p.set(f, state[f]);
  }
  const qs = p.toString();
  history.replaceState(null, '', qs ? '?' + qs : location.pathname);
  // 詳細・編集ページから条件を保持したまま戻れるよう保存
  try { sessionStorage.setItem('listUrl', 'index.html' + (qs ? '?' + qs : '')); } catch (_) { /* noop */ }
}

function readStateFromForm() {
  const s = {};
  for (const f of FIELDS) s[f] = (fieldEl(f).value || '').trim();
  return s;
}

function applyStateToForm() {
  for (const f of FIELDS) fieldEl(f).value = state[f] || '';
  if (state.name || state.content || state.qualification) setDetailOpen(true);
}

function setDetailOpen(open) {
  detailBox.classList.toggle('open', open);
  toggleBtn.setAttribute('aria-expanded', String(open));
  toggleBtn.textContent = (open ? '▲ ' : '▼ ') + '項目を指定して検索';
}

function showError(message) {
  errorArea.replaceChildren(el('div', { class: 'alert alert-error', role: 'alert', text: message }));
}
function clearError() {
  errorArea.replaceChildren();
}

function hasCondition() {
  return FIELDS.some((f) => f !== 'sort' && state[f]);
}

function renderRow(p) {
  const nameNode = el(
    'div',
    { class: 'name' },
    p.is_new ? el('span', { class: 'badge badge-new', text: 'NEW' }) : null,
    el('span', { text: p.project_name })
  );
  return el(
    'a',
    { class: 'list-row', href: `detail.html?id=${encodeURIComponent(p.id)}` },
    el('div', { class: 'cell cell-name' }, el('span', { class: 'm-label', text: '案件名' }), nameNode),
    el('div', { class: 'cell cell-content' }, p.business_content),
    el('div', { class: 'cell cell-domain' }, el('span', { class: 'm-label', text: '領域' }), el('span', { class: 'badge badge-domain', text: p.domain })),
    el('div', { class: 'cell cell-sub' }, el('span', { class: 'm-label', text: '勤務地' }), p.work_location || '―'),
    el('div', { class: 'cell cell-sub' }, el('span', { class: 'm-label', text: '勤務時間' }), p.working_hours || '―'),
    el(
      'div',
      { class: 'cell cell-price' },
      el('span', { class: 'm-label', text: '単価' }),
      el('div', { class: 'price' }, formatPrice(p.unit_price), el('small', { text: '万円/月' }))
    )
  );
}

function renderList(data) {
  countArea.replaceChildren(
    '登録 ',
    el('strong', { text: String(data.total) }),
    '件中、該当 ',
    el('strong', { text: String(data.count) }),
    '件'
  );

  if (data.count === 0) {
    const cond = hasCondition();
    listArea.replaceChildren(
      el(
        'div',
        { class: 'empty' },
        el('div', { class: 'title', text: cond ? '条件に一致する案件が見つかりませんでした' : '登録されている案件がありません' }),
        el('div', {
          text: cond
            ? 'キーワードを変更するか、絞り込み条件をゆるめてお試しください。'
            : 'データが登録されていません。',
        })
      )
    );
    return;
  }

  const head = el(
    'div',
    { class: 'list-head', 'aria-hidden': 'true' },
    el('div', { text: '案件名' }),
    el('div', { text: '業務内容' }),
    el('div', { text: '領域' }),
    el('div', { text: '勤務地' }),
    el('div', { text: '勤務時間' }),
    el('div', { style: 'text-align:right', text: '単価' })
  );
  const body = el('div', { class: 'list-body' }, data.items.map(renderRow));
  listArea.replaceChildren(head, body);
}

async function load() {
  const seq = ++requestSeq;
  const params = {};
  for (const f of FIELDS) if (state[f]) params[f] = state[f];
  try {
    const data = await api.list(params);
    if (seq !== requestSeq) return; // 古いレスポンスは破棄
    clearError();
    renderList(data);
  } catch (e) {
    if (seq !== requestSeq) return;
    showError(e.message);
    listArea.replaceChildren();
    countArea.replaceChildren();
  }
}

function search() {
  state = readStateFromForm();
  writeStateToUrl();
  load();
}

async function init() {
  state = readStateFromUrl();

  // 選択肢の読み込み
  try {
    const meta = await api.meta();
    const fill = (id, options) => {
      const sel = fieldEl(id);
      for (const o of options) {
        sel.append(el('option', { value: o.value, text: o.label }));
      }
    };
    fill('domain', meta.domains.map((d) => ({ value: d, label: d })));
    fill('location', meta.locations.map((d) => ({ value: d, label: d })));
    fill('price', meta.priceBands.map((b) => ({ value: b.key, label: b.label })));
  } catch (e) {
    showError(e.message);
  }

  applyStateToForm();
  writeStateToUrl();
  setDetailOpen(detailBox.classList.contains('open'));
  load();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  search();
});

// 絞り込み・並び順は変更と同時に反映
for (const id of ['domain', 'location', 'price', 'sort']) {
  fieldEl(id).addEventListener('change', search);
}

toggleBtn.addEventListener('click', () => setDetailOpen(!detailBox.classList.contains('open')));

document.getElementById('clear-btn').addEventListener('click', () => {
  for (const f of FIELDS) fieldEl(f).value = f === 'sort' ? 'new' : '';
  search();
});

// 詳細ページから「戻る」で復帰した場合（bfcache）も最新状態にする
window.addEventListener('pageshow', (e) => {
  if (e.persisted) load();
});

init();
