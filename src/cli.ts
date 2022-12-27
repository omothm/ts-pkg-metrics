#!/usr/bin/env node

import path from 'node:path';
import ts from 'typescript';
import { Command, Option } from 'commander';
import { Schema as S } from 'ts-schema-parser';
import DefaultProjectAnalyzer from './impl/analyzer';
import MetricsFacade from './impl/facade';
import DefaultProjectLoader from './impl/loader';
import PlainReporter from './reporters/plain';
import { Reporter } from './core';
import GraphReporter from './reporters/graph';
import DefaultReportCompiler from './impl/report-compiler';

const reportTypes = ['plain', 'graph'] as const;
type ReportType = typeof reportTypes[number];
const reporters: Record<ReportType, new () => Reporter> = {
  plain: PlainReporter,
  graph: GraphReporter,
};
const defaultReportType: ReportType = 'graph';

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

async function main() {
  const options = parseArgs();

  /* c8 ignore next */
  const projectDirectory = options.projectDir ? path.resolve(options.projectDir) : process.cwd();
  const loader = new DefaultProjectLoader(projectDirectory);

  const { baseUrl, paths } = loadTsConfig(options.tsConfigDir);
  const analyzer = new DefaultProjectAnalyzer(projectDirectory, baseUrl, paths);

  const reportCompiler = new DefaultReportCompiler(options.safePackages, 1, 0.1);

  const facade = new MetricsFacade(loader, analyzer, reportCompiler);
  const reports = await facade.analyze();
  const reporter = new reporters[options.reportType]();
  const exitCode = reporter.report(reports);
  process.exit(exitCode);
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

function parseArgs() {
  let projectDir: unknown;
  const program = new Command();
  program
    .name('ts-pkg-metrics')
    .version('0.1.1', '-v, --version')
    .argument('[project-dir]', 'the directory of the project', 'cwd')
    .action((projectDirArg: unknown) => {
      projectDir = projectDirArg;
    })
    .option('-s, --safe <pkgs...>', 'declare packages that are dependency-safe')
    .option('-t, --ts-config <config-dir>', 'the location of tsconfig.json')
    .addOption(
      new Option('-r, --reporter <type>', 'select reporter type')
        .choices(reportTypes)
        .default(defaultReportType),
    )
    .parse();

  const options = program.opts();
  const stringSchema = S.string();
  const stringArraySchema = S.array(stringSchema);
  const reporterSchema = S.enum(...reportTypes);

  /* c8 ignore next 5 */
  return {
    projectDir: projectDir ? stringSchema.parse(projectDir) : undefined,
    safePackages: stringArraySchema.parse(options.safe ?? []),
    tsConfigDir: options.tsConfigDir ? stringSchema.parse(options.tsConfigDir) : undefined,
    reportType: reporterSchema.parse(options.reporter ?? defaultReportType),
  };
}
