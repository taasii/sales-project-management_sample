'use strict';

// ローカル確認用の静的サーバー（public/ をそのまま配信）。
// 本システムはGitHub Pagesでも動く静的サイトのため、サーバー側の処理はありません。
const path = require('path');
const express = require('express');

const PORT = Number(process.env.PORT) || 3000;
const app = express();
app.disable('x-powered-by');
app.use(express.static(path.join(__dirname, '..', 'public')));

const server = app.listen(PORT, () => {
  console.log('------------------------------------------------');
  console.log(' 営業案件情報管理システム（サンプル） 起動しました');
  console.log(` URL : http://localhost:${PORT}`);
  console.log(' 停止: Ctrl + C');
  console.log('------------------------------------------------');
});
server.on('error', (err) => {
  console.error(err.code === 'EADDRINUSE' ? `ポート${PORT}は使用中です。PORT=3001 npm run dev で別ポートを指定できます。` : err);
  process.exit(1);
});
process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
