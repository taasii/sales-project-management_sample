'use strict';

/* 案件詳細ページ */

const detailArea = document.getElementById('detail-area');
const errorArea = document.getElementById('error-area');
const projectId = getQuery('id');

function bodyItem(heading, text, tag) {
  const has = text && text.trim();
  return el(
    'div',
    { class: 'item' },
    el('h3', {}, tag ? el('span', { class: 'tag ' + tag.cls, text: tag.label }) : null, heading),
    el('div', { class: 'body' + (has ? '' : ' none'), text: has ? text : '（記載なし）' })
  );
}

/** 「応募する」：営業へ連絡が行く旨を案内（サンプルのため実際の送信は行わない） */
async function onApply(p) {
  const ok = await openModal({
    title: 'この案件に応募しますか？',
    subtitle: `「${p.project_name}」`,
    body: el('p', { text: '「応募する」を押すと、担当の営業へあなたの応募が連絡され、後日営業から折り返しのご連絡があります。' }),
    notice: '※ これはサンプルです。実際には営業へ連絡は送信されません。',
    confirmText: '応募する',
    cancelText: 'キャンセル',
  });
  if (!ok) return;
  await openModal({
    title: '応募を受け付けました（サンプル）',
    body: el('p', { text: '本番では、この時点で営業担当へ応募の連絡が届きます。' }),
    notice: '※ サンプルのため、実際の連絡は行われていません。',
    confirmText: '閉じる',
    cancelText: null,
  });
}

function render(p) {
  document.title = `${p.project_name}｜営業案件情報管理システム`;

  const applyBtn = el('button', { type: 'button', class: 'btn btn-primary btn-lg', text: '応募する', onclick: () => onApply(p) });

  detailArea.replaceChildren(
    el(
      'section',
      { class: 'card detail-head' },
      el(
        'div',
        {},
        p.is_new ? el('span', { class: 'badge badge-new', text: 'NEW' }) : null,
        el('span', { class: 'badge badge-domain', text: p.domain })
      ),
      el('h1', { text: p.project_name }),
      el(
        'div',
        { class: 'detail-meta' },
        el('div', { class: 'detail-price' }, formatPrice(p.unit_price), el('small', { text: '万円 / 月' })),
        el('div', { text: `案件ID：${p.id}` })
      )
    ),

    el(
      'section',
      { class: 'card apply-box' },
      el('div', { class: 'apply-text' }, 'この案件に興味がありますか？', el('small', { text: '応募すると営業担当へ連絡が届きます（サンプルでは送信されません）' })),
      applyBtn
    ),

    el(
      'section',
      { class: 'card section' },
      el('h2', { text: '基本情報' }),
      bodyItem('業務内容', p.business_content),
      el('div', { class: 'item' }, el('h3', { text: '領域' }), el('div', { class: 'body', text: p.domain })),
      el('div', { class: 'item' }, el('h3', { text: '単価' }), el('div', { class: 'body', text: `${formatPrice(p.unit_price)}万円 / 月` }))
    ),

    el(
      'section',
      { class: 'card section' },
      el('h2', { text: '応募資格' }),
      bodyItem('必須（MUST）', p.must_requirements, { cls: 'tag-must', label: 'MUST' }),
      bodyItem('歓迎（WANT）', p.want_requirements, { cls: 'tag-want', label: 'WANT' }),
      bodyItem('人物像', p.ideal_personality)
    ),

    el(
      'section',
      { class: 'card section' },
      el('h2', { text: '労働条件' }),
      bodyItem('勤務地', p.work_location),
      bodyItem('勤務時間', p.working_hours),
      bodyItem('休日・休暇', p.holidays)
    ),

    el(
      'div',
      { class: 'action-bar' },
      el('a', { class: 'btn btn-secondary', href: listUrl(), text: '← 一覧に戻る' }),
      el('div', { class: 'right' }, el('button', { type: 'button', class: 'btn btn-primary', text: '応募する', onclick: () => onApply(p) }))
    ),
    el('div', { class: 'timestamps', text: `登録：${formatDateTime(p.created_at)} ／ 最終更新：${formatDateTime(p.updated_at)}` })
  );
}

async function init() {
  document.getElementById('crumb-list').href = listUrl();

  if (!projectId || !/^\d+$/.test(projectId)) {
    detailArea.replaceChildren();
    errorArea.replaceChildren(
      el('div', { class: 'alert alert-error', role: 'alert', text: '案件IDが指定されていません。' }),
      el('a', { class: 'btn btn-secondary', href: 'index.html', text: '← 一覧に戻る' })
    );
    return;
  }
  try {
    render(await api.get(projectId));
  } catch (e) {
    detailArea.replaceChildren();
    errorArea.replaceChildren(
      el('div', { class: 'alert alert-error', role: 'alert', text: e.message }),
      el('a', { class: 'btn btn-secondary', href: listUrl(), text: '← 一覧に戻る' })
    );
  }
}

init();
