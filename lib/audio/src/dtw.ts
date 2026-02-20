/**
 * REQ-RC-PITCH-003, REQ-RC-PITCH-004
 * ADR-004: Dynamic Time Warping
 * O(n²) の標準的な DTW 実装。〜100フレーム程度で十分な性能。
 */
export function alignByDTW(ref: number[], prac: number[]): [number, number][] {
  const n = ref.length;
  const m = prac.length;
  if (n === 0 || m === 0) return [];

  // コスト行列の計算
  const cost: number[][] = Array.from({ length: n }, () => new Array(m).fill(Infinity));
  cost[0][0] = Math.abs(ref[0] - prac[0]);

  for (let i = 1; i < n; i++) {
    cost[i][0] = cost[i - 1][0] + Math.abs(ref[i] - prac[0]);
  }
  for (let j = 1; j < m; j++) {
    cost[0][j] = cost[0][j - 1] + Math.abs(ref[0] - prac[j]);
  }
  for (let i = 1; i < n; i++) {
    for (let j = 1; j < m; j++) {
      const d = Math.abs(ref[i] - prac[j]);
      cost[i][j] = d + Math.min(cost[i - 1][j], cost[i][j - 1], cost[i - 1][j - 1]);
    }
  }

  // バックトラックでアライメントパスを復元
  const path: [number, number][] = [];
  let i = n - 1;
  let j = m - 1;
  path.push([ref[i], prac[j]]);

  while (i > 0 || j > 0) {
    if (i === 0) {
      j--;
    } else if (j === 0) {
      i--;
    } else {
      const diag = cost[i - 1][j - 1];
      const left = cost[i][j - 1];
      const up = cost[i - 1][j];
      if (diag <= left && diag <= up) {
        i--;
        j--;
      } else if (up <= left) {
        i--;
      } else {
        j--;
      }
    }
    path.push([ref[i], prac[j]]);
  }

  return path.reverse();
}
