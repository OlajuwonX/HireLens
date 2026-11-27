export const JOB_REGIONS = ["NG"] as const;

export type JobRegion = (typeof JOB_REGIONS)[number];

export const regionDetails: Record<JobRegion, { label: string; sources: string }> = {
  NG: {
    label: "Nigeria",
    sources: "MyJobMag, HotNigerianJobs, Moniepoint, Andela and LemFi",
  },
};

export function readRegions(values: readonly string[] | null | undefined): JobRegion[] {
  return (values ?? []).filter((value): value is JobRegion => (JOB_REGIONS as readonly string[]).includes(value));
}
