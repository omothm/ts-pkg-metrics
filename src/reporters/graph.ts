import Table from 'cli-table3';
import c from 'colors/safe';
import { MetricReport, ProjectReport, Reporter } from '../core';

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

export default class GraphReporter implements Reporter {
  private head = '⏺';
  private stem = '─';

  report(report: ProjectReport): number {
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

    report.packages.forEach((r) => {
      table.push(
        this.rowToArray(
          {
            packageName: r.packageName,
            numClasses: { text: `${r.numClasses}`, align: 'right' },
            internalRelationships: { text: `${r.internalRelationships}`, align: 'right' },
            relationalCohesion:
              c.bold(c.yellow(r.relationalCohesion.toFixed(1))) +
              this.drawCohesionBar(r.relationalCohesion),
            abstractness: r.abstractness.toFixed(1),
            afferentCouplings: { text: `${r.afferentCouplings}`, align: 'right' },
            efferentCouplings: { text: `${r.efferentCouplings}`, align: 'right' },
            instability: r.instability.toFixed(1),
            safe: `${r.safe}`,
            normalDistance: {
              text: c.bold(c.yellow(r.normalDistance.toFixed(1))),
              align: 'right',
            },
            graph: this.drawDistanceBar(r.normalDistance),
          },
          (value) =>
            typeof value === 'string' ? value : { content: value.text, hAlign: value.align },
        ),
      );
    });
    console.log(table.toString());
    this.printMetric('Cohesion', report.metrics.cohesion);
    this.printMetric('Distance', report.metrics.distance);
    return 0;
  }

  private printMetric(name: string, metric: MetricReport): void {
    console.log(
      `${name}\tthresh: ${metric.threshold}\tavg: ${metric.average.toFixed(2)}\toffending: ${Number(
        metric.offendingPackageRatio * 100,
      ).toFixed()}%`,
    );
  }

  private drawCohesionBar(cohesion: number) {
    const barLength = Math.min(Number(cohesion.toFixed(1)) * 10, 10);
    const color = barLength < 10 ? 'red' : 'green';
    return c[color](this.stem.repeat(barLength - 1) + this.head);
  }

  private drawDistanceBar(normalDistance: number) {
    const barLength = Math.abs(Number(normalDistance.toFixed(1))) * 10;
    const color = barLength < 2 ? 'green' : barLength < 5 ? 'yellow' : 'red';
    const leftSide =
      ' '.repeat(normalDistance < 0 ? 10 - barLength : 10) +
      (normalDistance < 0 && barLength > 0 ? this.head + this.stem.repeat(barLength - 1) : '');
    const middle = normalDistance < 0 ? '┤' : normalDistance > 0 ? '├' : '│';
    const rightSide =
      normalDistance > 0 && barLength > 0 ? this.stem.repeat(barLength - 1) + this.head : '';
    return c[color](`${leftSide}${middle}${rightSide}`);
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
