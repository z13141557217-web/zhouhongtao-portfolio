import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const fileName = '周鸿涛-AI产品经理简历.pdf';
const path = resolve('public', fileName);

if (!existsSync(path)) {
  console.error(`\n❌ public/${fileName} 缺失。请先放置简历文件再构建。\n   如需跳过：npm run build:no-check\n`);
  process.exit(1);
}

const size = statSync(path).size;

if (size < 10 * 1024) {
  console.error(`\n⚠️  public/${fileName} 异常小（${size} bytes），疑似空文件。\n`);
  process.exit(1);
}

console.log(`✓ ${fileName} 检查通过（${(size / 1024).toFixed(1)} KB）`);
