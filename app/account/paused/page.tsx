import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account paused",
  robots: { index: false, follow: false },
};

export default function AccountPausedPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your account is paused</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-meta text-text-secondary">
        <p>
          HireLens is on hold for this account, so the dashboard is unavailable
          for now.
        </p>
        <p>
          Nothing has been deleted. Your resumes, saved jobs, applications and
          documents are all still here, exactly as you left them, and they stay
          that way until you reactivate.
        </p>
        <div className="border-t border-border pt-4">
          <SignOutButton />
        </div>
      </CardContent>
    </Card>
  );
}
