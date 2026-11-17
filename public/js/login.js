'use strict';

/* ログイン画面（サンプル：ID/パスワード固定。実際の認証ではない） */

const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('error-area');

// 遷移先は許可リストのみ（オープンリダイレクト防止）
const next = getQuery('next') === 'edit.html' ? 'edit.html' : 'edit.html';

if (auth.isLoggedIn()) location.replace(next);

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = loginForm.elements.id.value.trim();
  const pw = loginForm.elements.pw.value;
  if (!id || !pw) {
    loginError.replaceChildren(el('div', { class: 'alert alert-error', role: 'alert', text: 'IDとパスワードを入力してください。' }));
    return;
  }
  if (auth.login(id, pw)) {
    location.href = next;
  } else {
    loginError.replaceChildren(el('div', { class: 'alert alert-error', role: 'alert', text: 'IDまたはパスワードが正しくありません。（サンプルのID・パスワードは「sample」です）' }));
    loginForm.elements.pw.value = '';
    loginForm.elements.pw.focus();
  }
});
