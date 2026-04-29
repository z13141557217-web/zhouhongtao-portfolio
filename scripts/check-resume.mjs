import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const path = resolve('public/resume.pdf');

if (!existsSync(path)) {
  console.error('\n❌ public/resume.pdf 缺失。请先放置简历文件再构建。\n   如需跳过：npm run build:no-check\n');
  process.exit(1);
}

const size = statSync(path).size;

if (size < 10 * 1024) {
  console.error(`\n⚠️  public/resume.pdf 异常小（${size} bytes），疑似空文件。\n`);
  process.exit(1);
}

console.log(`✓ resume.pdf 检查通过（${(size / 1024).toFixed(1)} KB）`);
