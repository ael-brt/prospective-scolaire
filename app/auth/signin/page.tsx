"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink text-white">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-panel/80 p-8 shadow-lg">
        <h1 className="text-2xl font-semibold mb-4 text-center">Connexion à la plateforme</h1>
        <p className="text-sm text-muted mb-6 text-center">
          Connecte-toi pour accéder aux simulations et aux tableaux de bord.
        </p>

        <button
          onClick={() => signIn("keycloak")}
          className="w-full py-2 rounded-lg bg-accent text-ink font-semibold hover:opacity-90 transition"
        >
          Se connecter avec Keycloak
        </button>
      </div>
    </div>
  );
}
