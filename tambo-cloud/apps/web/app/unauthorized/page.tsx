import Link from "next/link";

export const metadata = {
  title: "Unauthorized – Tambo Cloud",
};

export default function UnauthorizedPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 gap-6 bg-gray-50 text-gray-900">
      <h1 className="text-3xl font-semibold">Unauthorized</h1>
      <p>
        You are not authorized to access this application with the provided
        account.
      </p>
      <Link
        href="/login"
        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Return to Login
      </Link>
    </main>
  );
}
