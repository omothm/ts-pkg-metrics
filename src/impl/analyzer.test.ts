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
  t.is(report.length, 1);
  t.like(report[0], { packageName: 'package1', numClasses: 0 });
});

test('numClasses: should report correct number of exported classes (members)', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    {
      packageName: 'package1',
      modules: [
        `export default class Class1 {}
         function a() { class X {} }`,
        `export class Class2 {}
         export function helperFunction() {}`,
        `const obj = 123;
         export default obj;`,
        `export default {
           hello: 'world',
         };`,
      ],
    },
  ]);
  t.is(report.length, 1);
  t.like(report[0], { packageName: 'package1', numClasses: 5 });
});

test('abstractness: should report NaN abstractness for empty package', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([{ packageName: 'package1', modules: [] }]);
  t.is(report.length, 1);
  t.is(report[0].packageName, 'package1');
  t.is(report[0].abstractness, NaN);
});

test('abstractness: should report 0 abstractness for all-concrete exports', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    {
      packageName: 'package1',
      modules: [
        `export default class X {}
         export function x() {}`,
        `export class Y {}
         const m = 3;
         export default m;`,
        `export default {
           environment: 'production',
         }`,
      ],
    },
  ]);
  t.is(report.length, 1);
  t.is(report[0].packageName, 'package1');
  t.is(report[0].abstractness, 0);
});

test('abstractness: should report 1 abstractness for all-abstract exports', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    {
      packageName: 'package1',
      modules: [
        'export default interface I {}',
        'export abstract class S {}',
        `type M = string;
         export default M;`,
      ],
    },
  ]);
  t.is(report.length, 1);
  t.is(report[0].packageName, 'package1');
  t.is(report[0].abstractness, 1);
});

test('abstractness: should report ratio of abstract exports', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    {
      packageName: 'package1',
      modules: [
        `const m = 3;
         export default m;`,
        'export default interface I {}',
        'export abstract class S {}',
        `type M = string;
         export default M;`,
      ],
    },
  ]);
  t.is(report.length, 1);
  t.is(report[0].packageName, 'package1');
  t.is(report[0].abstractness, 0.75);
});

test('internalRelationships: should report 0 package with no same-package imports', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    {
      packageName: 'package1',
      modules: [
        `export default class X {}
         export function x() {}`,
        `export class Y {}
         const m = 3;
         export default m;`,
        `export default {
           environment: 'production',
         }`,
      ],
    },
  ]);
  t.is(report.length, 1);
  t.is(report[0].packageName, 'package1');
  t.is(report[0].internalRelationships, 0);
});

test('internalRelationships: should report number of package-internal imports', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    {
      packageName: 'package1',
      modules: [
        `import m from './module2';
         import { Y, Z } from './module3';
         export default class X {
           constructor(public y = new Y()) {}
           method(): number {
              return x(m);
           }
         }
         export function x(m: number): number {
           return m * 2;
         }
         export class Z extends X {}`,
        `export class Y {}
         const m = 3;
         export default m;`,
        `export default {
           environment: 'production',
         }`,
      ],
    },
  ]);
  t.is(report.length, 1);
  t.is(report[0].packageName, 'package1');
  t.is(report[0].internalRelationships, 3);
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
  abstractness: number;
  internalRelationships: number;
}
