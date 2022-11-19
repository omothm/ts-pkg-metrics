import path from 'node:path';
import ts from 'typescript';
import ProjectAnalyzer from '../core/analyzer';
import { Module, PackageModules } from '../core/loader';
import PackageReport from '../core/report';
import { NoPackagesError } from '../errors';

export default class DefaultProjectAnalyzer implements ProjectAnalyzer {
  analyze(packages: readonly PackageModules[]): PackageReport[] {
    if (!packages.length) {
      throw new NoPackagesError();
    }

    const reports = packages.map<PackageReport>((p) => ({
      packageName: p.packageName,
      numClasses: 0,
      abstractness: 0,
      internalRelationships: 0,
      afferentCouplings: 0,
      efferentCouplings: 0,
    }));

    const externalImports: string[] = [];

    packages.forEach((p, i) => {
      const analyses = p.modules.map((m) => this.analyzeModule(m));

      const numAbstract = this.addUp(analyses, 'numAbstract');
      const numClasses = this.addUp(analyses, 'numClasses');
      const internalRelationships = this.addUp(analyses, 'internalRelationships');

      const packageExternalImports = analyses.flatMap((a) => a.externalImports);
      externalImports.push(...packageExternalImports);

      const report = reports[i];
      report.numClasses = numClasses;
      report.abstractness = numAbstract / numClasses;
      report.internalRelationships = internalRelationships;
      report.efferentCouplings = packageExternalImports.length;
    });

    externalImports.forEach((imp) => {
      const report = reports.find((_, i) => imp.startsWith(packages[i].packageName));
      if (report) {
        report.afferentCouplings++;
      }
    });

    return reports;
  }

  private analyzeModule(module: Module) {
    const sourceFile = ts.createSourceFile('', module.content, ts.ScriptTarget.Latest);
    const nodes = sourceFile.getChildAt(0).getChildren();
    return {
      ...this.analyzeExports(nodes, sourceFile),
      ...this.analyzeImports(module.path, nodes, sourceFile),
    };
  }

  private analyzeExports(nodes: readonly ts.Node[], sourceFile: ts.SourceFile) {
    const exports = nodes.filter((node) =>
      this.nodeDeeplySatisfies(node, sourceFile, (n) => n.kind === ts.SyntaxKind.ExportKeyword),
    );
    const numAbstract = exports.reduce(
      (acc, cur) => acc + (this.nodeIsAbstract(cur, sourceFile) ? 1 : 0),
      0,
    );
    return { numClasses: exports.length, numAbstract };
  }

  private analyzeImports(modulePath: string, nodes: readonly ts.Node[], sourceFile: ts.SourceFile) {
    const importDeclarations = this.getImportDeclarations(modulePath, nodes, sourceFile);
    const internalImportSymbolCount = importDeclarations.internal.reduce(
      (accTotalSymbolCount, { node }) => {
        const importedSymbols = this.getImportedSymbols(node, sourceFile);
        return accTotalSymbolCount + importedSymbols.length;
      },
      0,
    );

    const externalImportNames = importDeclarations.external.flatMap(({ node, module }) => {
      const symbols = this.getImportedSymbols(node, sourceFile);
      return Array<string>(symbols.length).fill(module);
    });

    return {
      internalRelationships: internalImportSymbolCount,
      externalImports: externalImportNames,
    };
  }

  private getImportDeclarations(
    modulePath: string,
    nodes: readonly ts.Node[],
    sourceFile: ts.SourceFile,
  ) {
    interface ImportDeclaration {
      module: string;
      node: ts.Node;
    }

    const declarations = {
      internal: [] as ImportDeclaration[],
      external: [] as ImportDeclaration[],
    };

    nodes.forEach((node) => {
      if (node.kind !== ts.SyntaxKind.ImportDeclaration) {
        return;
      }

      const moduleStringNode = this.nodeDeepFind(
        node,
        sourceFile,
        (n) => n.kind === ts.SyntaxKind.StringLiteral,
      );

      /* c8 ignore next 3 */
      if (!moduleStringNode) {
        throw new Error('Unreachable');
      }

      const moduleString = moduleStringNode.getText(sourceFile).slice(1, -1); // drop quotes
      const module = this.getRelativePath(modulePath, moduleString);

      if (module.startsWith(modulePath)) {
        declarations.internal.push({ node, module });
      } else {
        declarations.external.push({ node, module });
      }
    });

    return declarations;
  }

  private getImportedSymbols(node: ts.Node, sourceFile: ts.SourceFile) {
    const importClause = this.nodeDeepFind(
      node,
      sourceFile,
      (n) => n.kind === ts.SyntaxKind.ImportClause,
    );

    /* c8 ignore next 3 */
    if (!importClause) {
      throw new Error('Unreachable');
    }

    const importClauseFirstChild = importClause.getChildAt(0);

    /* c8 ignore next 3 */
    if (!importClauseFirstChild) {
      throw new Error('Unreachable');
    }

    // default import
    if (importClauseFirstChild.kind === ts.SyntaxKind.Identifier) {
      return [importClauseFirstChild.getText(sourceFile)];
    }

    // named imports
    const importSpecifiersParentNode = this.nodeDeepFind(
      importClauseFirstChild,
      sourceFile,
      (n) => n.kind === ts.SyntaxKind.SyntaxList,
    );

    /* c8 ignore next 3 */
    if (!importSpecifiersParentNode) {
      throw new Error('Unreachable');
    }

    return importSpecifiersParentNode
      .getChildren()
      .filter((n) => n.kind === ts.SyntaxKind.ImportSpecifier)
      .map((n) => n.getText(sourceFile));
  }

  private getRelativePath(modulePath: string, module: string) {
    return path.join(modulePath, module);
  }

  /** Adds up the values of a given key for all members of an array. */
  private addUp<K extends string, T extends { [key in K]: number }>(obj: readonly T[], key: K) {
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
