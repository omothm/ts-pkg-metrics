import ProjectAnalyzer from '../core/analyzer';
import { ProjectLoader } from '../core/loader';
import PackageReport from '../core/report';

export default class MetricsFacade {
  constructor(private loader: ProjectLoader, private analyzer: ProjectAnalyzer) {}

  async analyze(): Promise<PackageReport[]> {
    const project = await this.loader.load();
    const analysis = this.analyzer.analyze(project);
    return analysis;
  }
}
