'use strict';

/* 案件登録ページ（サンプル：入力・確認・完了メッセージまで。実際の保存は行わない） */

// ログインしていなければログイン画面へ
if (!auth.isLoggedIn()) location.replace('login.html?next=edit.html');

const form = document.getElementById('project-form');
const errorArea = document.getElementById('error-area');
const submitBtn = document.getElementById('submit-btn');

const FIELD_DEFS = {
  project_name: { label: '案件名', max: 100, required: true },
  business_content: { label: '業務内容', max: 3000, required: true },
  domain: { label: '領域', required: true },
  unit_price: { label: '単価', required: true },
  must_requirements: { label: '必須（MUST）', max: 3000 },
  want_requirements: { label: '歓迎（WANT）', max: 3000 },
  ideal_personality: { label: '人物像', max: 2000 },
  work_location: { label: '勤務地', max: 100 },
  working_hours: { label: '勤務時間', max: 200 },
  holidays: { label: '休日・休暇', max: 500 },
};
const KEYS = Object.keys(FIELD_DEFS);

function getValues() {
  const v = {};
  for (const k of KEYS) v[k] = (form.elements[k].value || '').trim();
  return v;
}

function setFieldError(key, message) {
  const wrap = form.querySelector(`[data-field="${key}"]`);
  if (!wrap) return;
  wrap.classList.toggle('has-error', !!message);
  wrap.querySelector('.error-text').textContent = message || '';
}

function clearErrors() {
  for (const k of KEYS) setFieldError(k, '');
  errorArea.replaceChildren();
}

function validate(v) {
  const errors = {};
  for (const [k, d] of Object.entries(FIELD_DEFS)) {
    if (d.required && !v[k]) {
      errors[k] = `${d.label}は${k === 'domain' ? '選択' : '入力'}してください。`;
      continue;
    }
    if (d.max && v[k].length > d.max) errors[k] = `${d.label}は${d.max}文字以内で入力してください。`;
  }
  if (v.unit_price && !errors.unit_price) {
    if (!/^\d+$/.test(v.unit_price)) errors.unit_price = '単価は半角の整数（万円/月）で入力してください。';
    else if (Number(v.unit_price) < 1 || Number(v.unit_price) > 500) errors.unit_price = '単価は1〜500（万円/月）の範囲で入力してください。';
  }
  return errors;
}

function showErrors(errors, headline) {
  clearErrors();
  let first = null;
  for (const [k, m] of Object.entries(errors)) {
    setFieldError(k, m);
    if (!first) first = k;
  }
  errorArea.replaceChildren(
    el('div', { class: 'alert alert-error', role: 'alert', text: headline || '入力内容に誤りがあります。赤字の項目をご確認ください。' })
  );
  if (first) {
    const input = form.elements[first];
    if (input && input.scrollIntoView) input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (input && input.focus) input.focus({ preventScroll: true });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function confirmBody(v) {
  const rows = [
    ['案件名', v.project_name],
    ['業務内容', v.business_content],
    ['領域', v.domain],
    ['単価', `${formatPrice(v.unit_price)}万円 / 月`],
    ['必須（MUST）', v.must_requirements],
    ['歓迎（WANT）', v.want_requirements],
    ['人物像', v.ideal_personality],
    ['勤務地', v.work_location],
    ['勤務時間', v.working_hours],
    ['休日・休暇', v.holidays],
  ];
  return el(
    'table',
    { class: 'confirm-table' },
    el('tbody', {}, rows.map(([label, val]) => el('tr', {}, el('th', { text: label }), el('td', { text: val || '（未入力）' }))))
  );
}

function showDone(v) {
  document.title = '登録完了｜営業案件情報管理システム';
  form.hidden = true;
  errorArea.replaceChildren(
    el(
      'section',
      { class: 'card success-panel', role: 'status' },
      el('h2', { text: '登録ボタンが押されました（サンプル）' }),
      el('p', { text: `「${v.project_name}」の登録内容を受け付けました。` }),
      el('p', { class: 'hint', text: '※ これはサンプルです。実際にはデータは保存されておらず、案件一覧にも反映されません。' }),
      el(
        'div',
        { style: 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px' },
        el('a', { class: 'btn btn-secondary', href: 'index.html', text: '案件一覧へ' }),
        el('button', { type: 'button', class: 'btn btn-primary', text: '続けて登録する', onclick: () => { form.reset(); form.hidden = false; clearErrors(); window.scrollTo({ top: 0 }); } })
      )
    )
  );
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function onSubmit(e) {
  e.preventDefault();
  const v = getValues();
  const errors = validate(v);
  if (Object.keys(errors).length) {
    showErrors(errors);
    return;
  }
  clearErrors();

  const ok = await openModal({
    title: '以下の内容で登録しますか？',
    subtitle: '内容をご確認のうえ、よろしければ「登録する」を押してください。',
    body: confirmBody(v),
    notice: '※ サンプルのため、登録しても実際には保存されません。',
    confirmText: '登録する',
    cancelText: '修正する',
  });
  if (!ok) return;

  // サンプル：保存処理は行わず完了メッセージのみ表示
  await openModal({
    title: '登録しました（サンプル）',
    body: el('p', { text: `「${v.project_name}」を登録しました。` }),
    notice: '※ サンプルのため、実際にはデータは保存されていません。',
    confirmText: '閉じる',
    cancelText: null,
  });
  showDone(v);
}

async function init() {
  try {
    const meta = await api.meta();
    for (const d of meta.domains) form.elements.domain.append(el('option', { value: d, text: d }));
  } catch (err) {
    showErrors({}, err.message);
    submitBtn.disabled = true;
    return;
  }
  form.addEventListener('input', (ev) => {
    const name = ev.target && ev.target.name;
    if (name && FIELD_DEFS[name]) setFieldError(name, '');
  });
  form.addEventListener('submit', onSubmit);
}

init();
