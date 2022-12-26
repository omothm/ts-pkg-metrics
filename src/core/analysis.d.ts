export default interface PackageAnalysis {
  packageName: string;
  numClasses: number;
  abstractness: number;
  internalRelationships: number;
  afferentCouplings: number;
  efferentCouplings: number;
}
