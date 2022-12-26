import ProjectAnalyzer from '../core/analyzer';
import { ProjectLoader } from '../core/loader';
import PackageAnalysis from '../core/analysis';

export default class MetricsFacade {
  constructor(private loader: ProjectLoader, private analyzer: ProjectAnalyzer) {}

  async analyze(): Promise<PackageAnalysis[]> {
    const project = await this.loader.load();
    const analysis = this.analyzer.analyze(project);
    return analysis;
  }
}
