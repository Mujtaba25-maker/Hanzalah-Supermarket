import { useState } from "react";
import { FaLock, FaStore, FaUserShield } from "react-icons/fa";
import { login } from "../lib/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const session = await login(username, password);
      onLogin(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#181818] p-4 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#151515] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ff2d83] text-xl"><FaStore /></span>
          <div>
            <h1 className="text-2xl font-black">Hanzala Supermarket</h1>
            <p className="text-sm font-bold text-neutral-400">Secure staff login</p>
          </div>
        </div>

        <form className="grid gap-4" onSubmit={submit}>
          <label className="label">
            Username
            <div className="relative">
              <FaUserShield className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input className="field pl-11" value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" required />
            </div>
          </label>
          <label className="label">
            Password
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input className="field pl-11" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required />
            </div>
          </label>

          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}

          <button className="btn-primary h-12" disabled={loading} type="submit">{loading ? "Signing in..." : "Login"}</button>
        </form>
      </section>
    </main>
  );
}
