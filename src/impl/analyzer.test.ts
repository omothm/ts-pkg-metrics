import test from 'ava';
import ProjectAnalyzer from '../core/analyzer';
import { NoPackagesError } from '../errors';
import DefaultProjectAnalyzer from './analyzer';

test('should throw if no packages', (t) => {
  const analyzer = new AnalyzerProxy();
  t.throws(() => analyzer.analyze([]), { instanceOf: NoPackagesError });
});

test('numClasses: should report 0 classes for empty package', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([createPackage({ packageName: 'package1', modules: [] })]);
  t.is(report.length, 1);
  t.like(report[0], { packageName: 'package1', numClasses: 0 });
});

test('numClasses: should report correct number of exported classes (members)', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
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
    }),
  ]);
  t.is(report.length, 1);
  t.like(report[0], { packageName: 'package1', numClasses: 5 });
});

test('abstractness: should report NaN abstractness for empty package', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([createPackage({ packageName: 'package1', modules: [] })]);
  t.is(report.length, 1);
  t.like(report[0], { packageName: 'package1', abstractness: NaN });
});

test('abstractness: should report 0 abstractness for all-concrete exports', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
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
    }),
  ]);
  t.is(report.length, 1);
  t.like(report[0], { packageName: 'package1', abstractness: 0 });
});

test('abstractness: should report 1 abstractness for all-abstract exports', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
      packageName: 'package1',
      modules: [
        'export default interface I {}',
        'export abstract class S {}',
        `type M = string;
         export default M;`,
      ],
    }),
  ]);
  t.is(report.length, 1);
  t.like(report[0], { packageName: 'package1', abstractness: 1 });
});

test('abstractness: should report ratio of abstract exports', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
      packageName: 'package1',
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
  t.like(report[0], { packageName: 'package1', abstractness: 0.75 });
});

test('internalRelationships: should report 0 package with no package-internal imports', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
      packageName: 'package1',
      modules: [
        `import path from 'path';
         export default class X {}
         export function x() {}`,
        `import fs from 'node:fs';
         export class Y {}
         const m = 3;
         export default m;`,
        `export default {
           environment: 'production',
         }`,
      ],
    }),
  ]);
  t.is(report.length, 1);
  t.like(report[0], { packageName: 'package1', internalRelationships: 0 });
});

test('internalRelationships: should report number of package-internal imports', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
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
  t.like(report[0], { packageName: 'package1', internalRelationships: 3 });
});

test('internalRelationships: should report package-internal imports with tsconfig paths', (t) => {
  const analyzer = new AnalyzerProxy('.', { '@p1/*': ['package1/*'] });
  const report = analyzer.analyze([
    createPackage({
      packageName: 'package1',
      modules: [
        `import m from '@p1/module2';
         import { Y, Z } from '@p1/module3';
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
  t.like(report[0], { packageName: 'package1', internalRelationships: 3 });
});

test('couplings: should report 0 couplings for non-coupled packages', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
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
         }`,
        `const m = 3;
         export default m;`,
        `export class Y {}
         export class Z {}`,
      ],
    }),
    createPackage({
      packageName: 'package2',
      modules: [
        `export interface Greeter {}
        `,
      ],
    }),
  ]);
  t.is(report.length, 2);
  t.like(report[0], { packageName: 'package1', afferentCouplings: 0, efferentCouplings: 0 });
  t.like(report[1], { packageName: 'package2', afferentCouplings: 0, efferentCouplings: 0 });
});

test('couplings: should report number of couplings between packages', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
      packageName: 'package1',
      modules: [
        {
          path: 'package1/module1.ts',
          content: `
            import m from './module2';
            import { Y, Z } from './module3';
            import { Greeter } from '../package2/module1';
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
          path: 'package1/module2.ts',
          content: `
            const m = 3;
            export default m;
          `,
        },
        {
          path: 'package1/module3.ts',
          content: `
            export class Y {}
            export class Z {}
          `,
        },
      ],
    }),
    createPackage({
      packageName: 'package2',
      modules: [
        {
          path: 'package2/module1.ts',
          content: `
            export interface Greeter {}
          `,
        },
      ],
    }),
    createPackage({
      packageName: 'package3',
      modules: [
        {
          path: 'package3/module1.ts',
          content: `
            import { Greeter } from '../package2/module1';
            export default class AnotherGreeter implements Greeter {}
          `,
        },
      ],
    }),
  ]);
  t.is(report.length, 3);
  t.like(report[0], { packageName: 'package1', afferentCouplings: 0, efferentCouplings: 1 });
  t.like(report[1], { packageName: 'package2', afferentCouplings: 2, efferentCouplings: 0 });
  t.like(report[2], { packageName: 'package3', afferentCouplings: 0, efferentCouplings: 1 });
});

test('couplings: should report number of couplings between packages with tsconfig paths', (t) => {
  const analyzer = new AnalyzerProxy('.', { '@p2/*': ['package2/*'] });
  const report = analyzer.analyze([
    createPackage({
      packageName: 'package1',
      modules: [
        {
          path: 'package1/module1.ts',
          content: `
            import * as m from './module2';
            import { Y, Z } from './module3';
            import type { Greeter } from '@p2/module1';
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
          path: 'package1/module2.ts',
          content: `
            const m = 3;
            export default m;
          `,
        },
        {
          path: 'package1/module3.ts',
          content: `
            export class Y {}
            export class Z {}
          `,
        },
      ],
    }),
    createPackage({
      packageName: 'package2',
      modules: [
        {
          path: 'package2/module1.ts',
          content: `
            export interface Greeter {}
          `,
        },
      ],
    }),
    createPackage({
      packageName: 'package3',
      modules: [
        {
          path: 'package3/module1.ts',
          content: `
            import { Greeter } from '@p2/module1';
            export default class AnotherGreeter implements Greeter {}
          `,
        },
      ],
    }),
  ]);
  t.is(report.length, 3);
  t.like(report[0], { packageName: 'package1', afferentCouplings: 0, efferentCouplings: 1 });
  t.like(report[1], { packageName: 'package2', afferentCouplings: 2, efferentCouplings: 0 });
  t.like(report[2], { packageName: 'package3', afferentCouplings: 0, efferentCouplings: 1 });
});

test('couplings: should ignore node modules imports', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
      packageName: 'package1',
      modules: [
        `import path from 'path';
         import m from './module2';
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
      packageName: 'package2',
      modules: [
        `import fs from 'node:fs';
         export interface Greeter {}
        `,
      ],
    }),
  ]);
  t.is(report.length, 2);
  t.like(report[0], { packageName: 'package1', afferentCouplings: 0, efferentCouplings: 0 });
  t.like(report[1], { packageName: 'package2', afferentCouplings: 0, efferentCouplings: 0 });
});

test('couplings: should count index.ts and index.d.ts imports', (t) => {
  const analyzer = new AnalyzerProxy();
  const report = analyzer.analyze([
    createPackage({
      packageName: 'package1',
      modules: [
        {
          path: 'package1/module1.ts',
          content: `
            import m from './module2';
            import { Y, Z } from '.';
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
          path: 'package1/module2.ts',
          content: `
            const m = 3;
            export default m;
          `,
        },
        {
          path: 'package1/index.ts',
          content: `
            export class Y {}
            export class Z {}
          `,
        },
      ],
    }),
    createPackage({
      packageName: 'package2',
      modules: [
        {
          path: 'package2/index.d.ts',
          content: `
            export interface Greeter {}
          `,
        },
      ],
    }),
    createPackage({
      packageName: 'package3',
      modules: [
        {
          path: 'package3/module1.ts',
          content: `
            import { Greeter } from '../package2';
            export default class AnotherGreeter implements Greeter {}
          `,
        },
      ],
    }),
  ]);
  t.is(report.length, 3);
  t.like(report[0], { packageName: 'package1', afferentCouplings: 0, efferentCouplings: 1 });
  t.like(report[1], { packageName: 'package2', afferentCouplings: 2, efferentCouplings: 0 });
  t.like(report[2], { packageName: 'package3', afferentCouplings: 0, efferentCouplings: 1 });
});

class AnalyzerProxy {
  private analyzer: ProjectAnalyzer;

  constructor(baseUrl?: string, paths?: Record<string, string[]>) {
    this.analyzer = new DefaultProjectAnalyzer(baseUrl, paths);
  }

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
      typeof m === 'string' ? { path: `${params.packageName}/module${i}`, content: m } : m,
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
