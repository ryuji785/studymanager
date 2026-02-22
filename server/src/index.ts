/**
 * ローカル開発用エントリポイント
 * Vercelデプロイ時は api/index.ts が使われる。
 * ローカルでは `cd server && npm run dev` で起動。
 */
import app from '../api/index.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const PORT = process.env.PORT || 4000;

app.listen(Number(PORT), () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
