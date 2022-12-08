#!/usr/bin/env node

import path from 'node:path';
import ts from 'typescript';
import DefaultProjectAnalyzer from './impl/analyzer';
import MetricsFacade from './impl/facade';
import DefaultProjectLoader from './impl/loader';
import DefaultReporter from './reporters/default';

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

async function main() {
  /* c8 ignore next */
  const projectDirectory = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const loader = new DefaultProjectLoader(projectDirectory);

  const { baseUrl, paths } = loadTsConfig(process.argv[3]);
  const analyzer = new DefaultProjectAnalyzer(projectDirectory, baseUrl, paths);

  const facade = new MetricsFacade(loader, analyzer);
  const reporter = new DefaultReporter();
  const reports = await facade.analyze();
  reporter.report(reports);
}

function loadTsConfig(filename?: string) {
  const configFilename = ts.findConfigFile('./', (fn) => ts.sys.fileExists(fn), filename);

  /* c8 ignore next 3 */
  if (!configFilename) {
    return { baseUrl: undefined, paths: undefined };
  }

  const configFile = ts.readConfigFile(configFilename, (fp) => ts.sys.readFile(fp));
  const compilerOptions = ts.parseJsonConfigFileContent(configFile.config, ts.sys, './');
  return {
    baseUrl: compilerOptions.options.baseUrl,
    paths: compilerOptions.options.paths,
  };
}
