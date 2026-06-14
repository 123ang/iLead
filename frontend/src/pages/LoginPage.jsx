import React, { useState } from "react";
import { api } from "../services/api.js";
import { useAuthStore } from "../store/auth.store.js";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const setSession = useAuthStore((s) => s.setSession);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setSession(data);
      nav("/");
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow"
      >
        <h1 className="text-2xl font-bold text-uum-blue">iLead Login</h1>
        <input
          className="mt-6 w-full rounded border p-3"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="mt-3 w-full rounded border p-3"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        ) : null}
        <button
          type="submit"
          className="mt-5 w-full rounded bg-uum-blue p-3 font-semibold text-white"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
