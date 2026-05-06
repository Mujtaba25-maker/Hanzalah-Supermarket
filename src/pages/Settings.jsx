import { FaCog, FaStore } from "react-icons/fa";
import Card from "../components/Card";

export default function Settings() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="Store Profile" icon={FaStore}>
        <div className="grid gap-4">
          <label className="label">Store Name<input className="field" defaultValue="Hanzalah Supermarket" /></label>
          <label className="label">Currency<select className="field" defaultValue="USD"><option>USD</option><option>AFN</option><option>EUR</option></select></label>
          <label className="label">Low Stock Alert<input className="field" type="number" defaultValue="10" /></label>
          <button className="w-fit rounded-xl bg-teal-600 px-4 py-2 font-black text-white hover:bg-teal-700" type="button">Save Settings</button>
        </div>
      </Card>
      <Card title="Dashboard Preferences" icon={FaCog}>
        <div className="space-y-3 text-sm font-semibold text-slate-600">
          <label className="flex items-center gap-3"><input type="checkbox" defaultChecked /> Show sales trend chart</label>
          <label className="flex items-center gap-3"><input type="checkbox" defaultChecked /> Enable low stock warnings</label>
          <label className="flex items-center gap-3"><input type="checkbox" defaultChecked /> Show notification badge</label>
        </div>
      </Card>
    </div>
  );
}
