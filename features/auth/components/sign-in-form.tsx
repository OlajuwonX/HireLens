import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/features/auth/actions/auth-actions";

export function SignInForm() {
  return (
    <form action={signInWithGoogle}>
      <Button type="submit" className="w-full">
        Continue with Google
      </Button>
    </form>
  );
}
