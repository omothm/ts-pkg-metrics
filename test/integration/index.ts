import { spawn } from 'child_process';

function mapToSource(file: string) {
  return file.replace(/^test\/integration/, 'src').replace(/\.test\.ts$/, '.ts');
}

const testFiles = process.argv.slice(2);
const sourceFiles = testFiles.map(mapToSource);

spawn('npx', ['c8', '--100', ...sourceFiles.map((f) => `--include=${f}`), 'ava', ...testFiles], {
  stdio: 'inherit',
}).on('exit', (code) => process.exit(code ?? undefined));
