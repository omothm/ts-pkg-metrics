import ts from 'typescript';
import ProjectAnalyzer from '../core/analyzer';
import { PackageModules } from '../core/loader';
import PackageReport from '../core/report';
import { NoPackagesError } from '../errors';

export default class DefaultProjectAnalyzer implements ProjectAnalyzer {
  analyze(packages: PackageModules[]): PackageReport[] {
    if (!packages.length) {
      throw new NoPackagesError();
    }
    return packages.map((p) => {
      const classes = p.modules.map((m) => this.countClasses(m));
      const totalAbstract = this.addUp(classes, 'abstract');
      const totalConcrete = this.addUp(classes, 'concrete');
      const totalClasses = totalAbstract + totalConcrete;
      return {
        packageName: p.packageName,
        numClasses: totalClasses,
        abstractness: totalAbstract / totalClasses,
        internalRelationships: 1,
      };
    });
  }

  /**
   * Counts abstract/concrete classes in a module. A _class_ in this context is any exported member.
   */
  private countClasses(module: string) {
    const sourceFile = ts.createSourceFile('', module, ts.ScriptTarget.Latest);
    const syntaxList = sourceFile.getChildAt(0);
    const children = syntaxList.getChildren();
    const exports = children.filter((c) =>
      this.nodeDeeplySatisfies(c, sourceFile, (n) => n.kind === ts.SyntaxKind.ExportKeyword),
    );
    const abstract = exports.reduce(
      (acc, cur) => acc + (this.nodeIsAbstract(cur, sourceFile) ? 1 : 0),
      0,
    );
    return { abstract, concrete: exports.length - abstract };
  }

  /** Adds up the values of a given key for all members of an array. */
  private addUp<T extends Record<string, number>>(obj: T[], key: keyof T) {
    return obj.reduce((acc, cur) => acc + cur[key], 0);
  }

  private nodeDeepFind(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    condition: (node: ts.Node) => boolean,
    maxDepth?: number,
    currentDepth = 0,
  ): ts.Node | undefined {
    if (maxDepth && currentDepth === maxDepth) {
      return undefined;
    }
    const children = node.getChildren(sourceFile);
    for (const child of children) {
      if (condition(child)) {
        return child;
      }
      const childNode = this.nodeDeepFind(child, sourceFile, condition, maxDepth, currentDepth + 1);
      if (childNode) {
        return childNode;
      }
    }
    return undefined;
  }

  private nodeDeeplySatisfies(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    condition: (node: ts.Node) => boolean,
    maxDepth?: number,
  ) {
    return this.nodeDeepFind(node, sourceFile, condition, maxDepth) !== undefined;
  }

  private nodeIsAbstract(node: ts.Node, sourceFile: ts.SourceFile): boolean {
    if (
      [ts.SyntaxKind.InterfaceDeclaration, ts.SyntaxKind.TypeAliasDeclaration].includes(node.kind)
    ) {
      return true;
    }
    if (
      node.kind === ts.SyntaxKind.ClassDeclaration &&
      this.nodeDeeplySatisfies(node, sourceFile, (n) => n.kind === ts.SyntaxKind.AbstractKeyword)
    ) {
      return true;
    }
    if (node.kind === ts.SyntaxKind.ExportAssignment) {
      const identifierExportNode = this.nodeDeepFind(
        node,
        sourceFile,
        (n) => n.kind === ts.SyntaxKind.Identifier,
      );

      /* c8 ignore next 3 */
      if (!identifierExportNode) {
        throw new Error('Unreachable');
      }

      const identifier = identifierExportNode.getText(sourceFile);
      const identifierNode = this.nodeDeepFind(
        sourceFile,
        sourceFile,
        (n) =>
          n.kind !== ts.SyntaxKind.ExportAssignment && // prevents endless loop
          this.nodeDeeplySatisfies(
            n,
            sourceFile,
            (nn) => nn.kind === ts.SyntaxKind.Identifier && nn.getText(sourceFile) === identifier,
            1,
          ),
      );

      /* c8 ignore next 3 */
      if (!identifierNode) {
        throw new Error('Unreachable');
      }

      return this.nodeIsAbstract(identifierNode, sourceFile);
    }
    return false;
  }
}
