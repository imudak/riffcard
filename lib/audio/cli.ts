import { readFileSync } from 'fs';
import { calcPitchScore, calcRhythmScore, calcTotalScore } from './src/scoring';

const HELP = `
riffcard lib/audio CLI (Article II)

Usage:
  npx tsx lib/audio/cli.ts <command> [options]

Commands:
  score --ref-pitches <file> --prac-pitches <file>   ピッチ系列JSONからスコア計算
  score --ref-onsets <file> --prac-onsets <file>      オンセット系列JSONからリズムスコア計算
  --help                                              このヘルプを表示

JSON形式:
  ピッチ系列: [440, 442, 438, ...]  (Hz の配列)
  オンセット系列: [0.5, 1.0, 1.5, ...]  (秒の配列)
`.trim();

function readJsonArray(path: string): number[] {
  const content = readFileSync(path, 'utf-8');
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) {
    throw new Error(`${path} の内容が配列ではありません`);
  }
  return parsed;
}

function getArg(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help') {
    console.log(HELP);
    process.exit(0);
  }

  switch (command) {
    case 'score': {
      const refPitchesFile = getArg(args, '--ref-pitches');
      const pracPitchesFile = getArg(args, '--prac-pitches');
      const refOnsetsFile = getArg(args, '--ref-onsets');
      const pracOnsetsFile = getArg(args, '--prac-onsets');

      let pitchScore = 0;
      let rhythmScore = 0;

      if (refPitchesFile && pracPitchesFile) {
        const refPitches = readJsonArray(refPitchesFile);
        const pracPitches = readJsonArray(pracPitchesFile);
        pitchScore = calcPitchScore(refPitches, pracPitches);
        console.log(`ピッチスコア: ${pitchScore}`);
      }

      if (refOnsetsFile && pracOnsetsFile) {
        const refOnsets = readJsonArray(refOnsetsFile);
        const pracOnsets = readJsonArray(pracOnsetsFile);
        rhythmScore = calcRhythmScore(refOnsets, pracOnsets);
        console.log(`リズムスコア: ${rhythmScore}`);
      }

      if (refPitchesFile && pracPitchesFile) {
        const totalScore = calcTotalScore(pitchScore, rhythmScore);
        console.log(`総合スコア: ${totalScore}`);
      }

      if (!refPitchesFile && !refOnsetsFile) {
        console.error('エラー: --ref-pitches または --ref-onsets を指定してください');
        process.exit(1);
      }
      break;
    }

    default:
      console.error(`不明なコマンド: ${command}`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('エラー:', err.message);
  process.exit(1);
});
