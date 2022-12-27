import { PackageAnalysis } from '.';

interface PackageReport extends PackageAnalysis {
  relationalCohesion: number;
  instability: number;
  safe: number;
  normalDistance: number;
}
