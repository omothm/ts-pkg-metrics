import test from 'ava';
import { NoPackagesError } from '../errors';
import DefaultProjectAnalyzer from './analyzer';

test('should throw if no packages', (t) => {
  const analyzer = new AnalyzerProxy();
  t.throws(() => analyzer.analyze([]), { instanceOf: NoPackagesError });
});

test('numClasses: should report 0 classes for empty package', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([createPackage({ packageName: '/package1', modules: [] })]);
  t.is(report.length, 1);
  t.like(report[0], { packageName: '/package1', numClasses: 0 });
});

test('numClasses: should report correct number of exported classes (members)', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
      packageName: '/package1',
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
    }),
  ]);
  t.is(report.length, 1);
  t.like(report[0], { packageName: '/package1', numClasses: 5 });
});

test('abstractness: should report NaN abstractness for empty package', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([createPackage({ packageName: '/package1', modules: [] })]);
  t.is(report.length, 1);
  t.like(report[0], { packageName: '/package1', abstractness: NaN });
});

test('abstractness: should report 0 abstractness for all-concrete exports', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
      packageName: '/package1',
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
    }),
  ]);
  t.is(report.length, 1);
  t.like(report[0], { packageName: '/package1', abstractness: 0 });
});

test('abstractness: should report 1 abstractness for all-abstract exports', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
      packageName: '/package1',
      modules: [
        'export default interface I {}',
        'export abstract class S {}',
        `type M = string;
         export default M;`,
      ],
    }),
  ]);
  t.is(report.length, 1);
  t.like(report[0], { packageName: '/package1', abstractness: 1 });
});

test('abstractness: should report ratio of abstract exports', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
      packageName: '/package1',
      modules: [
        `const m = 3;
         export default m;`,
        'export default interface I {}',
        'export abstract class S {}',
        `type M = string;
         export default M;`,
      ],
    }),
  ]);
  t.is(report.length, 1);
  t.like(report[0], { packageName: '/package1', abstractness: 0.75 });
});

test('internalRelationships: should report 0 package with no same-package imports', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
      packageName: '/package1',
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
    }),
  ]);
  t.is(report.length, 1);
  t.like(report[0], { packageName: '/package1', internalRelationships: 0 });
});

test('internalRelationships: should report number of package-internal imports', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
      packageName: '/package1',
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
         }`,
        `const m = 3;
         export default m;`,
        `export class Y {}
         export class Z {}`,
        `export default {
           environment: 'production',
         }`,
      ],
    }),
  ]);
  t.is(report.length, 1);
  t.like(report[0], { packageName: '/package1', internalRelationships: 3 });
});

test('couplings: should report 0 couplings for non-coupled packages', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
      packageName: '/package1',
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
         }`,
        `const m = 3;
         export default m;`,
        `export class Y {}
         export class Z {}`,
      ],
    }),
    createPackage({
      packageName: '/package2',
      modules: [
        `export interface Greeter {}
        `,
      ],
    }),
  ]);
  t.is(report.length, 2);
  t.like(report[0], { packageName: '/package1', afferentCouplings: 0, efferentCouplings: 0 });
  t.like(report[1], { packageName: '/package2', afferentCouplings: 0, efferentCouplings: 0 });
});

test('couplings: should report number of couplings between packages', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
      packageName: '/package1',
      modules: [
        {
          path: '/package1',
          content: `
            import m from './module2';
            import { Y, Z } from './module3';
            import { Greeter } from '../package2';
            export default class X implements Greeter {
              constructor(public y = new Y()) {}
              method(): number {
                return x(m);
              }
            }
            export function x(m: number): number {
              return m * 2;
            }
          `,
        },
        {
          path: '/package1',
          content: `
            const m = 3;
            export default m;
          `,
        },
        {
          path: '/package1',
          content: `
            export class Y {}
            export class Z {}
          `,
        },
      ],
    }),
    createPackage({
      packageName: '/package2',
      modules: [
        {
          path: '/package2',
          content: `
            export interface Greeter {}
          `,
        },
      ],
    }),
    createPackage({
      packageName: '/package3',
      modules: [
        {
          path: '/package3',
          content: `
            import { Greeter } from '../package2';
            export default class AnotherGreeter implements Greeter {}
          `,
        },
      ],
    }),
  ]);
  t.is(report.length, 3);
  t.like(report[0], { packageName: '/package1', afferentCouplings: 0, efferentCouplings: 1 });
  t.like(report[1], { packageName: '/package2', afferentCouplings: 2, efferentCouplings: 0 });
  t.like(report[2], { packageName: '/package3', afferentCouplings: 0, efferentCouplings: 1 });
});

class AnalyzerProxy {
  private analyzer = new DefaultProjectAnalyzer();

  analyze(packages: ReturnType<typeof createPackage>[]): PackageReport[] {
    return this.analyzer.analyze(packages);
  }
}

function createPackage(params: {
  packageName: string;
  modules: (string | { path: string; content: string })[];
}) {
  return {
    packageName: params.packageName,
    modules: params.modules.map((m, i) =>
      typeof m === 'string' ? { path: `module${i}`, content: m } : m,
    ),
  };
}

interface PackageReport {
  packageName: string;
  numClasses: number;
  abstractness: number;
  internalRelationships: number;
  afferentCouplings: number;
  efferentCouplings: number;
}
