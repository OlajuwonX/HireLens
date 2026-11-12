import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import { revokeWorkerTokenAction } from "../actions/token-actions";

type Token = { publicId: string; name: string; lastUsedAt: Date | null; createdAt: Date };

export function WorkerTokenList({ tokens }: { tokens: Token[] }) {
  if (tokens.length === 0) {
    return <p className="text-meta text-text-secondary">No worker tokens yet.</p>;
  }

  return (
    <ul className="divide-y divide-border border-t border-border">
      {tokens.map((token) => (
        <li key={token.publicId} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-meta font-medium text-text-primary">{token.name}</p>
            <p className="font-mono text-system text-text-muted">
              {token.lastUsedAt ? `Last used ${token.lastUsedAt.toLocaleString()}` : "Never used"}
            </p>
          </div>
          <DeleteConfirmButton
            action={revokeWorkerTokenAction}
            publicId={token.publicId}
            title={`Revoke ${token.name}?`}
            description="That computer's worker stops working immediately. Tasks it was working on become unconfirmed so you can check them."
            confirmLabel="Revoke"
            toastLabel={token.name}
          />
        </li>
      ))}
    </ul>
  );
}
