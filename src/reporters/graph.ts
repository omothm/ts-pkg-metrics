import Table from 'cli-table3';
import colors from 'colors/safe';
import { PackageAnalysis, Reporter } from '../core';

type TableCell = string | { text: string; align?: 'center' | 'left' | 'right' };

interface TableRow {
  packageName: TableCell;
  numClasses: TableCell;
  internalRelationships: TableCell;
  relationalCohesion: TableCell;
  abstractness: TableCell;
  afferentCouplings: TableCell;
  efferentCouplings: TableCell;
  instability: TableCell;
  safe: TableCell;
  normalDistance: TableCell;
  graph: TableCell;
}

interface PackageReport extends PackageAnalysis {
  relationalCohesion: number;
  instability: number;
  safe: number;
  normalDistance: number;
}

export default class GraphReporter implements Reporter {
  constructor(private safePackages: string[]) {}

  report(analyses: PackageAnalysis[]): void {
    const table = new Table({
      head: this.rowToArray(
        {
          packageName: 'Pkg',
          numClasses: 'N',
          internalRelationships: 'R',
          relationalCohesion: 'H',
          abstractness: 'A',
          afferentCouplings: 'Ca',
          efferentCouplings: 'Ce',
          instability: 'I',
          safe: 'S',
          normalDistance: 'D',
          graph: ' Painful ⟨┼⟩ Useless ',
        },
        (value) => (typeof value === 'string' ? value : value.text),
      ),
      chars: { 'left-mid': '', mid: '', 'mid-mid': '', 'right-mid': '' },
    });

    const reports: PackageReport[] = analyses.map((r) => {
      const instability = r.efferentCouplings / (r.efferentCouplings + r.afferentCouplings);
      const safe = this.safePackages.includes(r.packageName) ? 1 : 0;
      return {
        ...r,
        relationalCohesion: (r.internalRelationships + 1) / r.numClasses,
        instability,
        safe,
        normalDistance: r.abstractness + Math.max(instability, safe) - 1,
      };
    });

    reports.forEach((r) => {
      table.push(
        this.rowToArray(
          {
            packageName: r.packageName,
            numClasses: { text: `${r.numClasses}`, align: 'right' },
            internalRelationships: { text: `${r.internalRelationships}`, align: 'right' },
            relationalCohesion: colors.bold(colors.yellow(r.relationalCohesion.toFixed(1))),
            abstractness: r.abstractness.toFixed(1),
            afferentCouplings: { text: `${r.afferentCouplings}`, align: 'right' },
            efferentCouplings: { text: `${r.efferentCouplings}`, align: 'right' },
            instability: r.instability.toFixed(1),
            safe: `${r.safe}`,
            normalDistance: {
              text: colors.bold(colors.yellow(r.normalDistance.toFixed(1))),
              align: 'right',
            },
            graph: this.drawBar(r.normalDistance),
          },
          (value) =>
            typeof value === 'string' ? value : { content: value.text, hAlign: value.align },
        ),
      );
    });
    console.log(table.toString());
  }

  private drawBar(normalDistance: number) {
    const barLength = Math.abs(Number(normalDistance.toFixed(1))) * 10;
    const color = barLength < 2 ? 'green' : barLength < 5 ? 'yellow' : 'red';
    const head = '⏺';
    const stem = '─';
    const leftSide =
      ' '.repeat(normalDistance < 0 ? 10 - barLength : 10) +
      (normalDistance < 0 && barLength > 0 ? head + stem.repeat(barLength - 1) : '');
    const middle = normalDistance < 0 ? '┤' : normalDistance > 0 ? '├' : '│';
    const rightSide = normalDistance > 0 && barLength > 0 ? stem.repeat(barLength - 1) + head : '';
    return colors[color](`${leftSide}${middle}${rightSide}`);
  }

  private rowToArray<T>(row: TableRow, transform: (value: TableCell) => T): T[] {
    return [
      row.packageName,
      row.numClasses,
      row.internalRelationships,
      row.relationalCohesion,
      row.abstractness,
      row.afferentCouplings,
      row.efferentCouplings,
      row.instability,
      row.safe,
      row.normalDistance,
      row.graph,
    ].map(transform);
  }
}
