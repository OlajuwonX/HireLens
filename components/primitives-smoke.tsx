import { ActivityItem } from "@/components/data-display/activity-item";
import { MetricCard } from "@/components/data-display/metric-card";
import { ScoreCard } from "@/components/data-display/score-card";
import { UsageMeter } from "@/components/data-display/usage-meter";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function PrimitivesSmoke() {
  return (
    <AppShell>
      <PageContainer>
        <PageHeader title="Primitive smoke check" action={<Button>Action</Button>} />
        <div className="grid gap-4">
          <Alert>Primitive alert</Alert>
          <Card>
            <CardContent className="space-y-3 pt-4">
              <Input aria-label="Name" />
              <SearchInput aria-label="Search" />
              <Select aria-label="Status">
                <option>Ready</option>
              </Select>
              <Textarea aria-label="Description" />
            </CardContent>
          </Card>
          <MetricCard label="Applications" value={12} />
          <ScoreCard label="ATS score" score={82} />
          <UsageMeter label="Resume analyses" used={2} limit={5} />
          <EmptyState title="No records" />
          <LoadingState />
          <ul>
            <ActivityItem title="Resume uploaded" time="Today" />
          </ul>
        </div>
      </PageContainer>
    </AppShell>
  );
}
