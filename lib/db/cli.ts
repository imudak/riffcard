import 'fake-indexeddb/auto';
import { openDB } from './src/schema';
import { PhraseRepository, TakeRepository } from './src/repository';

const HELP = `
riffcard lib/db CLI (Article II)

Usage:
  npx tsx lib/db/cli.ts <command> [options]

Commands:
  list-phrases              全フレーズを一覧表示
  create-phrase             デフォルト名でフレーズを作成
  delete-phrase --id <uuid> フレーズを削除（カスケード）
  --help                    このヘルプを表示
`.trim();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help') {
    console.log(HELP);
    process.exit(0);
  }

  const db = await openDB();
  const phraseRepo = new PhraseRepository(db);

  switch (command) {
    case 'list-phrases': {
      const phrases = await phraseRepo.getAll();
      if (phrases.length === 0) {
        console.log('フレーズがありません。');
      } else {
        for (const p of phrases) {
          const takeRepo = new TakeRepository(db);
          const best = await takeRepo.getBestScore(p.id);
          console.log(
            `[${p.id}] ${p.title} (Best: ${best !== null ? best + '点' : '--'}) 作成: ${p.createdAt.toISOString()}`,
          );
        }
      }
      break;
    }

    case 'create-phrase': {
      const phrase = await phraseRepo.create();
      console.log(`作成: ${phrase.title} (${phrase.id})`);
      break;
    }

    case 'delete-phrase': {
      const idIndex = args.indexOf('--id');
      if (idIndex === -1 || !args[idIndex + 1]) {
        console.error('エラー: --id <uuid> を指定してください');
        process.exit(1);
      }
      const id = args[idIndex + 1];
      const existing = await phraseRepo.getById(id);
      if (!existing) {
        console.error(`エラー: フレーズ ${id} が見つかりません`);
        process.exit(1);
      }
      const title = existing.title;
      await phraseRepo.delete(id);
      console.log(`削除: ${title} (${id})`);
      break;
    }

    default:
      console.error(`不明なコマンド: ${command}`);
      console.log(HELP);
      process.exit(1);
  }

  db.close();
}

main().catch((err) => {
  console.error('エラー:', err.message);
  process.exit(1);
});
