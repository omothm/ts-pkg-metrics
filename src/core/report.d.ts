export default interface PackageReport {
  packageName: string;
  numClasses: number;
  abstractness: number;
  internalRelationships: number;
  afferentCouplings: number;
  efferentCouplings: number;
}
