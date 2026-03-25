export interface AppViewer {
  id: string;
  name: string;
  email: string;
}

interface AuthUserLike {
  _id: string;
  name?: string | null;
  email?: string | null;
}

export function toAppViewer(user: AuthUserLike | null | undefined): AppViewer | null {
  if (!user) {
    return null;
  }

  return {
    id: user._id,
    name: user.name?.trim() || "User",
    email: user.email?.trim() || "",
  };
}
