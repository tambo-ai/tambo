import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import "./App.css";
import { AuthedTamboApp } from "./components/AuthedTamboApp";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>React + TanStack + Clerk + Tambo template</h1>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>

      <main className="app-main">
        <SignedOut>
          <p>You are currently signed out.</p>
          <SignInButton />
        </SignedOut>

        <SignedIn>
          <AuthedTamboApp />
        </SignedIn>
      </main>
    </div>
  );
}

export default App;
