import test from 'ava';
import { NoPackagesError } from '../errors';
import DefaultProjectAnalyzer from './analyzer';

test('should throw if no packages', (t) => {
  const analyzer = new AnalyzerProxy();
  t.throws(() => analyzer.analyze([]), { instanceOf: NoPackagesError });
});

class AnalyzerProxy {
  private analyzer = new DefaultProjectAnalyzer();

  analyze(packages: PackageModules[]): PackageReport[] {
    return this.analyzer.analyze(packages);
  }
}

interface PackageModules {
  packageName: string;
  modules: string[];
}

interface PackageReport {
  packageName: string;
  numClasses: number;
}
