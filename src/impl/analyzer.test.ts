import test from 'ava';
import { NoPackagesError } from '../errors';
import DefaultProjectAnalyzer from './analyzer';

test('should throw if no packages', (t) => {
  const analyzer = new AnalyzerProxy();
  t.throws(() => analyzer.analyze([]), { instanceOf: NoPackagesError });
});

test('numClasses: should report 0 classes for empty package', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([{ packageName: 'package1', modules: [] }]);
  t.deepEqual(report, [{ packageName: 'package1', numClasses: 0 }]);
});

test('numClasses: should report correct number of exported classes', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    {
      packageName: 'package1',
      modules: ['export default class Class1 {}\nfunction a() { class X {} }'],
    },
  ]);
  t.deepEqual(report, [{ packageName: 'package1', numClasses: 1 }]);
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
