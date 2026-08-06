import { Button } from "@/components/ui/button";
import { signOutUser } from "@/features/auth/actions/auth-actions";

export function SignOutButton() {
  return (
    <form action={signOutUser}>
      <Button type="submit" variant="secondary">
        Sign out
      </Button>
    </form>
  );
}
