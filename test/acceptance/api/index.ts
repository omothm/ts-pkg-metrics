import path from 'path';

export default class Api {
  private static projectsDirectory = path.join(__dirname, '..', 'data');

  private results: Result[] | undefined;

  async analyze(projectName: string): Promise<void> {
    const projectDirectory = path.resolve(Api.projectsDirectory, projectName);
    const facade = new FacadeProxy(projectDirectory);
    this.results = await facade.loadAndAnalyze();
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
  // eslint-disable-next-line
  constructor(projectDirectory: string) {}

  loadAndAnalyze(): Promise<Result[]> {
    throw new Error('Method not implemented.');
  }
}

interface Result extends Metrics {
  packageName: string;
}

interface Metrics {
  numClasses: number;
}
