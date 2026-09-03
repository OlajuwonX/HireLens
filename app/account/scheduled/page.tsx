import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account scheduled for deletion",
  robots: { index: false, follow: false },
};

export default function AccountScheduledPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your account is scheduled for deletion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-meta text-text-secondary">
        <Alert tone="warning">
          Your account is closed and the dashboard is no longer available.
        </Alert>
        <p>
          Your resumes, saved jobs, applications, documents and uploaded files
          are still stored for now, and will be permanently removed on the
          scheduled date. Once that happens they cannot be recovered.
        </p>
        <p>
          If you did not request this, or you have changed your mind, you can
          restore the account before that date.
        </p>
        <div className="border-t border-border pt-4">
          <SignOutButton />
        </div>
      </CardContent>
    </Card>
  );
}
