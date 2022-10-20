import * as ts from 'typescript';
import ProjectAnalyzer from '../core/analyzer';
import { PackageModules } from '../core/loader';
import PackageReport from '../core/report';
import { NoPackagesError } from '../errors';

export default class DefaultProjectAnalyzer implements ProjectAnalyzer {
  analyze(packages: PackageModules[]): PackageReport[] {
    if (!packages.length) {
      throw new NoPackagesError();
    }
    return packages.map((p) => ({
      packageName: p.packageName,
      numClasses: p.modules.reduce((acc, cur) => acc + this.countClasses(cur), 0),
    }));
  }

  private countClasses(module: string) {
    const sourceFile = ts.createSourceFile('', module, ts.ScriptTarget.Latest);
    const syntaxList = sourceFile.getChildAt(0);
    const children = syntaxList.getChildren();
    const exports = children.filter((c) =>
      this.deepExists(c, sourceFile, (n) => n.kind === ts.SyntaxKind.ExportKeyword),
    );
    return exports.length;
  }

  private deepExists(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    condition: (node: ts.Node) => boolean,
  ) {
    const children = node.getChildren(sourceFile);
    for (const child of children) {
      if (condition(child) || this.deepExists(child, sourceFile, condition)) {
        return true;
      }
    }
    return false;
  }
}
