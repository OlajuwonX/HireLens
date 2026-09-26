const MAX_IN_FLIGHT = 10;

export type DraftSync = {
  commit: (value: string) => void;
  reconcile: (draft: string, incoming: string) => string;
  lastCommitted: () => string;
};

export function createDraftSync(initial: string): DraftSync {
  let committed = initial;
  let inFlight: string[] = [];

  return {
    commit(value) {
      committed = value;
      inFlight.push(value);

      if (inFlight.length > MAX_IN_FLIGHT) {
        inFlight.shift();
      }
    },
    reconcile(draft, incoming) {
      const echo = inFlight.indexOf(incoming);

      if (echo !== -1) {
        inFlight = inFlight.slice(echo + 1);
        return draft;
      }

      if (draft !== committed) {
        return draft;
      }

      committed = incoming;
      inFlight = [];

      return incoming;
    },
    lastCommitted() {
      return committed;
    },
  };
}
