'use strict';

/*
 * 画面共通：データ取得・表示ユーティリティ
 * GitHub Pages（静的ホスティング）で動くよう、サーバーAPIは使わず
 * data/projects.json を直接読み込み、検索・絞り込みはブラウザ側で行う。
 * ※パスはすべて相対パス（サブディレクトリ配信でも動作させるため）
 */

const DATA_URL = 'data/projects.json';
const DOMAINS = ['組み込みソフトウェア', 'Webシステム開発', '業務システム開発', 'クラウド・インフラ', 'データ分析・AI', 'DX推進'];
const PRICE_BANDS = [
  { key: 'under60', label: '60万円未満', min: 0, max: 60 },
  { key: '60-70', label: '60〜70万円', min: 60, max: 70 },
  { key: '70-80', label: '70〜80万円', min: 70, max: 80 },
  { key: '80-90', label: '80〜90万円', min: 80, max: 90 },
  { key: '90plus', label: '90万円以上', min: 90, max: null },
];
const NEW_DAYS = 7;
const PREFECTURE_RE = /^(北海道|東京都|京都府|大阪府|.{2,3}県)/;
const SEARCH_ALL = ['project_name', 'business_content', 'domain', 'must_requirements', 'want_requirements', 'ideal_personality', 'work_location'];

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/* ---------- データアクセス層（読み取り専用の疑似DB） ---------- */
let _records = null;

async function loadRecords() {
  if (_records) return _records;
  let res;
  try {
    res = await fetch(DATA_URL, { cache: 'no-cache' });
  } catch (e) {
    throw new ApiError('データを読み込めません。ネットワーク接続を確認してください。', 0);
  }
  if (!res.ok) throw new ApiError(`データの読み込みに失敗しました（${res.status}）。`, res.status);
  try {
    _records = await res.json();
  } catch (e) {
    throw new ApiError('データの形式が正しくありません。', 500);
  }
  return _records;
}

function parseDate(s) {
  return new Date(String(s).replace(' ', 'T') + '+09:00');
}
function withNew(r) {
  const days = (Date.now() - parseDate(r.created_at).getTime()) / 86400000;
  return { ...r, is_new: days <= NEW_DAYS };
}
function splitWords(s) {
  return String(s || '').split(/[\s　]+/).filter(Boolean).slice(0, 10);
}
function matchAll(r, ws, cols) {
  return ws.every((w) => {
    const lw = w.toLowerCase();
    return cols.some((c) => String(r[c] || '').toLowerCase().includes(lw));
  });
}

const api = {
  async meta() {
    const rs = await loadRecords();
    const prefs = new Set();
    for (const r of rs) {
      const m = PREFECTURE_RE.exec(r.work_location || '');
      if (m) prefs.add(m[1]);
    }
    return {
      total: rs.length,
      domains: DOMAINS,
      priceBands: PRICE_BANDS.map(({ key, label }) => ({ key, label })),
      locations: [...prefs].sort((a, b) => a.localeCompare(b, 'ja')),
    };
  },

  async list(q = {}) {
    const rs = await loadRecords();
    const str = (v) => (typeof v === 'string' ? v.trim() : '');
    const band = PRICE_BANDS.find((b) => b.key === str(q.price));
    const loc = str(q.location);
    let items = rs.filter(
      (r) =>
        matchAll(r, splitWords(q.q), SEARCH_ALL) &&
        matchAll(r, splitWords(q.name), ['project_name']) &&
        matchAll(r, splitWords(q.content), ['business_content']) &&
        matchAll(r, splitWords(q.qualification), ['must_requirements', 'want_requirements', 'ideal_personality']) &&
        (!str(q.domain) || r.domain === str(q.domain)) &&
        (!loc || (r.work_location || '').includes(loc)) &&
        (!band || (r.unit_price >= band.min && (band.max == null || r.unit_price < band.max)))
    );
    const sorters = {
      new: (a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id,
      price_desc: (a, b) => b.unit_price - a.unit_price || b.id - a.id,
      price_asc: (a, b) => a.unit_price - b.unit_price || b.id - a.id,
    };
    items = items.sort(sorters[q.sort] || sorters.new).map(withNew);
    return { total: rs.length, count: items.length, items };
  },

  async get(id) {
    const rs = await loadRecords();
    const r = rs.find((x) => String(x.id) === String(id));
    if (!r) throw new ApiError('指定された案件が見つかりません。', 404);
    return withNew(r);
  },
};

/* ---------- 簡易ログイン（サンプル用・固定ID/パスワード） ---------- */
const SAMPLE_ID = 'sample';
const SAMPLE_PASSWORD = 'sample';
const AUTH_KEY = 'sampleAuth';

const auth = {
  isLoggedIn() {
    try { return sessionStorage.getItem(AUTH_KEY) === '1'; } catch (_) { return false; }
  },
  login(id, pw) {
    if (id === SAMPLE_ID && pw === SAMPLE_PASSWORD) {
      try { sessionStorage.setItem(AUTH_KEY, '1'); } catch (_) { return false; }
      return true;
    }
    return false;
  },
  logout() {
    try { sessionStorage.removeItem(AUTH_KEY); } catch (_) { /* noop */ }
  },
};

/** 登録画面への導線：ログイン済みなら登録画面、未ログインならログイン画面へ */
function registerHref() {
  return auth.isLoggedIn() ? 'edit.html' : 'login.html?next=edit.html';
}

/* ---------- DOMヘルパー（textContentで挿入しXSSを防止） ---------- */
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

function formatPrice(n) {
  return Number(n).toLocaleString('ja-JP');
}
function formatDateTime(s) {
  return String(s || '').slice(0, 16).replace(/-/g, '/');
}
function getQuery(name) {
  return new URLSearchParams(location.search).get(name);
}
function listUrl() {
  try { return sessionStorage.getItem('listUrl') || 'index.html'; } catch (_) { return 'index.html'; }
}

/* ---------- トースト ---------- */
function showToast(message) {
  const t = el('div', { class: 'toast', role: 'status', text: message });
  document.body.append(t);
  setTimeout(() => t.remove(), 3500);
}

/* ---------- モーダル ---------- */
/**
 * @param {{title:string, subtitle?:string, body?:Node, notice?:string, confirmText?:string, cancelText?:string|null}} o
 * cancelText=null で「閉じる」ボタンのみ（完了通知用）
 * @returns {Promise<boolean>}
 */
function openModal({ title, subtitle, body, notice, confirmText = 'OK', cancelText = 'キャンセル', danger = false }) {
  return new Promise((resolve) => {
    const prevFocus = document.activeElement;
    const confirmBtn = el('button', { type: 'button', class: 'btn ' + (danger ? 'btn-danger-solid' : 'btn-primary'), text: confirmText });
    const cancelBtn = cancelText ? el('button', { type: 'button', class: 'btn btn-secondary', text: cancelText }) : null;
    const modal = el(
      'div',
      { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      el('div', { class: 'modal-head' }, el('h2', { text: title }), subtitle ? el('p', { text: subtitle }) : null),
      body ? el('div', { class: 'modal-body' }, body) : null,
      notice ? el('div', { class: 'modal-notice', text: notice }) : null,
      el('div', { class: 'modal-foot' }, cancelBtn, confirmBtn)
    );
    const backdrop = el('div', { class: 'modal-backdrop' }, modal);

    function close(result) {
      document.removeEventListener('keydown', onKey);
      backdrop.remove();
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      resolve(result);
    }
    function onKey(e) {
      if (e.key === 'Escape') close(false);
    }
    document.addEventListener('keydown', onKey);
    confirmBtn.addEventListener('click', () => close(true));
    if (cancelBtn) cancelBtn.addEventListener('click', () => close(false));
    backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(false); });
    document.body.append(backdrop);
    confirmBtn.focus();
  });
}

/* ---------- ヘッダーの共通ナビ（ログイン状態に応じて表示） ---------- */
function renderHeaderNav() {
  const nav = document.getElementById('header-nav');
  if (!nav) return;
  const links = [el('a', { href: registerHref(), text: '案件登録（管理者用）' })];
  if (auth.isLoggedIn()) {
    links.push(el('a', { href: '#', text: 'ログアウト', onclick: (e) => { e.preventDefault(); auth.logout(); location.href = 'index.html'; } }));
  }
  nav.replaceChildren(...links);
}
document.addEventListener('DOMContentLoaded', renderHeaderNav);
