import path from 'path';
import DefaultProjectAnalyzer from '../../../src/impl/analyzer';
import MetricsFacade from '../../../src/impl/facade';
import DefaultProjectLoader from '../../../src/impl/loader';
import DefaultReportCompiler from '../../../src/impl/report-compiler';

export default class Api {
  private static projectsDirectory = path.join(__dirname, '..', 'data');

  private results: Result[] | undefined;

  async analyze(projectName: string): Promise<void> {
    const projectDirectory = path.resolve(Api.projectsDirectory, projectName);
    const facade = new FacadeProxy(projectDirectory);
    this.results = await facade.analyze();
  }

  validate(packageName: string, metric: keyof Metrics, value: number): void {
    const resultValue = this.results?.find((r) => r.packageName === packageName)?.[metric];
    if (resultValue !== value) {
      throw new Error(
        `Incorrect metric for ${packageName}: ${metric} should be ${value}, got ${
          resultValue ?? 'undefined'
        }.`,
      );
    }
  }
}

class FacadeProxy {
  private facade: MetricsFacade | undefined;

  constructor(projectDirectory: string) {
    const loader = new DefaultProjectLoader(projectDirectory);
    const analyzer = new DefaultProjectAnalyzer();
    const reportCompiler = new DefaultReportCompiler([]);
    this.facade = new MetricsFacade(loader, analyzer, reportCompiler);
  }

  async analyze(): Promise<Result[]> {
    if (!this.facade) {
      throw new Error('Facade not constructed');
    }
    const results = await this.facade.analyze();
    return results;
  }
}

interface Result extends Metrics {
  packageName: string;
}

interface Metrics {
  numClasses: number;
  abstractness: number;
  internalRelationships: number;
  afferentCouplings: number;
  efferentCouplings: number;
}
