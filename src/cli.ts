#!/usr/bin/env node

import path from 'path';
import DefaultProjectAnalyzer from './impl/analyzer';
import MetricsFacade from './impl/facade';
import DefaultProjectLoader from './impl/loader';
import DefaultReporter from './reporters/default';

main().catch(console.error);

async function main() {
  const projectDirectory = path.resolve(process.argv[2] ?? process.cwd());
  const loader = new DefaultProjectLoader(projectDirectory);
  const analyzer = new DefaultProjectAnalyzer();
  const facade = new MetricsFacade(loader, analyzer);
  const reporter = new DefaultReporter();
  const reports = await facade.analyze();
  reporter.report(reports);
}
