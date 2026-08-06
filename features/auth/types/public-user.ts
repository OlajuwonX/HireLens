export type PublicUser = {
  name: string | null;
  email: string | null;
  image: string | null;
};

export type PublicAccountState = {
  lastLoginAt: string | null;
  onboardingCompleted: boolean;
};
