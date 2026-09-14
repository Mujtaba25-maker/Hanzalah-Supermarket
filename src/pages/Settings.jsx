import { useState } from "react";
import { FaCog, FaPlus, FaStore, FaUserShield } from "react-icons/fa";
import Card from "../components/Card";
import { saveSettings, saveUser } from "../lib/api";
import { CURRENCY } from "../lib/format";

const emptyUser = { id: "", name: "", username: "", role: "cashier", password: "", active: true };

export default function Settings({ settings, users, audits, refresh }) {
  const [form, setForm] = useState({ ...settings, currency: CURRENCY });
  const [message, setMessage] = useState("");
  const [modalUser, setModalUser] = useState(null);
  const update = event => {
    const { name, value, type, checked } = event.target;
    setForm(current => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async event => {
    event.preventDefault();
    try {
      await saveSettings({ ...form, currency: CURRENCY });
      await refresh();
      setMessage("Settings saved.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Store Profile" icon={FaStore}>
          <form className="grid gap-4" onSubmit={submit}>
            <label className="label">Store Name<input name="storeName" className="field" value={form.storeName || ""} onChange={update} /></label>
            <label className="label">Currency<select name="currency" className="field" value={CURRENCY} onChange={update}><option>{CURRENCY}</option></select></label>
            <label className="label">Low Stock Alert<input name="lowStockAlert" className="field" type="number" value={form.lowStockAlert || 10} onChange={update} /></label>
            <label className="label">Receipt Footer<input name="receiptFooter" className="field" value={form.receiptFooter || ""} onChange={update} /></label>
            {message && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p>}
            <button className="btn-primary w-fit" type="submit">Save Settings</button>
          </form>
        </Card>
        <Card title="Dashboard Preferences" icon={FaCog}>
          <div className="space-y-3 text-sm font-semibold text-slate-600">
            <label className="flex items-center gap-3"><input name="showSalesTrend" type="checkbox" checked={form.showSalesTrend !== false} onChange={update} /> Show sales trend chart</label>
            <label className="flex items-center gap-3"><input name="enableLowStockWarnings" type="checkbox" checked={form.enableLowStockWarnings !== false} onChange={update} /> Enable low stock warnings</label>
            <label className="flex items-center gap-3"><input name="showNotificationBadge" type="checkbox" checked={form.showNotificationBadge !== false} onChange={update} /> Show notification badge</label>
          </div>
        </Card>
      </div>

      <Card title="User Management" icon={FaUserShield} action={<button className="btn-primary" onClick={() => setModalUser(emptyUser)} type="button"><FaPlus /> Add User</button>}>
        <div className="overflow-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase"><tr>{["Name", "Username", "Role", "Status", ""].map(item => <th key={item} className="px-4 py-3 font-black">{item}</th>)}</tr></thead>
            <tbody className="divide-y divide-white/10">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-black">{user.name}</td>
                  <td className="px-4 py-3">{user.username}</td>
                  <td className="px-4 py-3 capitalize">{user.role}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-black ${user.active === false ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{user.active === false ? "Inactive" : "Active"}</span></td>
                  <td className="px-4 py-3 text-right"><button className="btn-muted px-3" onClick={() => setModalUser({ ...user, password: "" })} type="button">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Audit History" icon={FaCog}>
        <div className="space-y-2">
          {audits.map(audit => (
            <article key={audit.id} className="rounded-xl bg-white/5 p-3">
              <strong className="block text-sm">{audit.action}</strong>
              <span className="text-xs font-semibold text-neutral-400">{audit.userName} - {audit.detail} - {new Date(audit.createdAt).toLocaleString()}</span>
            </article>
          ))}
        </div>
      </Card>

      {modalUser && <UserModal user={modalUser} close={() => setModalUser(null)} refresh={refresh} />}
    </div>
  );
}

function UserModal({ user, close, refresh }) {
  const [form, setForm] = useState(user);
  const [message, setMessage] = useState("");
  const update = event => {
    const { name, value, type, checked } = event.target;
    setForm(current => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async event => {
    event.preventDefault();
    try {
      await saveUser(form);
      await refresh();
      close();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/60 p-4">
      <form className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#151515] p-6 shadow-soft" onSubmit={submit}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black">{form.id ? "Edit User" : "Add User"}</h2>
          <button className="btn-muted px-3" onClick={close} type="button">x</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label">Name<input className="field" name="name" value={form.name} onChange={update} required /></label>
          <label className="label">Username<input className="field" name="username" value={form.username} onChange={update} disabled={Boolean(form.id)} required /></label>
          <label className="label">Role<select className="field" name="role" value={form.role} onChange={update}><option value="admin">Admin</option><option value="manager">Manager</option><option value="cashier">Cashier</option></select></label>
          <label className="label">Password<input className="field" name="password" type="password" value={form.password} onChange={update} required={!form.id} placeholder={form.id ? "Leave blank to keep" : ""} /></label>
          <label className="flex items-center gap-3 text-sm font-black text-neutral-300"><input name="active" type="checkbox" checked={form.active !== false} onChange={update} /> Active user</label>
        </div>
        {message && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-muted" onClick={close} type="button">Cancel</button>
          <button className="btn-primary" type="submit">Save User</button>
        </div>
      </form>
    </div>
  );
}
