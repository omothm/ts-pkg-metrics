#!/usr/bin/env node

import path from 'path';
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
  const analyzer = new DefaultProjectAnalyzer();
  const facade = new MetricsFacade(loader, analyzer);
  const reporter = new DefaultReporter();
  const reports = await facade.analyze();
  reporter.report(reports);
}
