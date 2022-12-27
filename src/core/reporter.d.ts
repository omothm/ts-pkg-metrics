import { ProjectReport } from '.';

export interface Reporter {
  report(reports: ProjectReport): number;
}
