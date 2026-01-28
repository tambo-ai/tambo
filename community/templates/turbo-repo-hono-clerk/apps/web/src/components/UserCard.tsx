import { useUser } from "@clerk/clerk-react";

export function UserCard() {
  const { isLoaded, user } = useUser();

  if (!isLoaded || !user) {
    return null;
  }

  const primaryEmail =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress;

  return (
    <section className="user-card">
      <h2 className="user-card-title">Your account</h2>
      <p className="user-card-row">
        <span className="user-card-label">Name:</span>
        <span>{user.fullName ?? user.username ?? "Unknown user"}</span>
      </p>
      {primaryEmail ? (
        <p className="user-card-row">
          <span className="user-card-label">Email:</span>
          <span>{primaryEmail}</span>
        </p>
      ) : null}
      <p className="user-card-row">
        <span className="user-card-label">User ID:</span>
        <span>{user.id}</span>
      </p>
    </section>
  );
}
