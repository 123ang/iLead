import React, { useState } from "react";
import { api } from "../services/api.js";
import { useAuthStore } from "../store/auth.store.js";
import { useNavigate } from "react-router-dom";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      const { data } = await api.get("/auth/me");
      setSession({
        accessToken: useAuthStore.getState().accessToken,
        user: data.user,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error || err.response?.data?.message || err.message,
      );
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow"
      >
        <h1 className="text-2xl font-bold text-uum-blue">Change password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Update your temporary password before continuing.
        </p>
        <label className="mt-6 block">
          <span className="text-xs font-medium text-slate-600">Current</span>
          <input
            className="mt-1 w-full rounded border p-3"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-medium text-slate-600">New</span>
          <input
            className="mt-1 w-full rounded border p-3"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        {error ? (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        ) : null}
        <button
          type="submit"
          className="mt-5 w-full rounded bg-uum-blue p-3 font-semibold text-white"
        >
          Save and continue
        </button>
      </form>
    </div>
  );
}
