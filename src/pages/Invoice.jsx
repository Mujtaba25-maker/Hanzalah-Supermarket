import { useMemo, useState } from "react";
import { FaFileInvoice, FaReceipt, FaSearch } from "react-icons/fa";
import Card from "../components/Card";
import Pagination from "../components/Pagination";

import { money } from "../lib/format";

export default function Invoice({ sales, orders, customers, settings = {} }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const pageSize = 8;

  const customerById = useMemo(() => new Map(customers.map(customer => [customer.id, customer])), [customers]);
  const invoices = useMemo(() => {
    const saleInvoices = sales.map(sale => {
      const customer = customerById.get(sale.customerId);
      return {
        id: sale.id.replace("sale_", "INV-S-").toUpperCase(),
        type: "Sale",
        customer: customer?.name || "Walk-in Customer",
        total: sale.total,
        date: sale.createdAt?.slice(0, 10) || "",
        status: "Paid",
        detail: `${sale.quantity} x ${sale.productName}`,
        items: [{ name: sale.productName, quantity: sale.quantity, price: sale.unitPrice, total: sale.total }],
        paymentMethod: sale.paymentMethod || "Cash"
      };
    });
    const orderInvoices = orders.map(order => ({
      id: `INV-${order.id}`,
      type: "Order",
      customer: order.customer,
      total: order.total,
      date: order.date,
      status: order.status === "delivered" ? "Paid" : "Unpaid",
      detail: `${order.items?.length || 0} order items`,
      items: (order.items || []).map(item => ({ name: item.name, quantity: item.quantity, price: item.price, total: item.quantity * item.price })),
      paymentMethod: "Order"
    }));
    return [...saleInvoices, ...orderInvoices].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [customerById, orders, sales]);

  const rows = invoices
    .filter(invoice => type === "all" || invoice.type.toLowerCase() === type)
    .filter(invoice => [invoice.id, invoice.customer, invoice.status, invoice.detail].some(value => String(value).toLowerCase().includes(query.toLowerCase())));
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const paidTotal = invoices.filter(invoice => invoice.status === "Paid").reduce((sum, invoice) => sum + invoice.total, 0);
  const unpaidTotal = invoices.filter(invoice => invoice.status !== "Paid").reduce((sum, invoice) => sum + invoice.total, 0);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <InvoiceStat label="Total Invoices" value={invoices.length} />
        <InvoiceStat label="Paid Amount" value={money(paidTotal)} tone="teal" />
        <InvoiceStat label="Unpaid Orders" value={money(unpaidTotal)} tone="rose" />
      </div>

      <Card title="Invoice Records" icon={FaFileInvoice}>
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px]">
          <label className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input className="field pl-11" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search invoices..." />
          </label>
          <select className="field" value={type} onChange={event => { setType(event.target.value); setPage(1); }}>
            <option value="all">All invoices</option>
            <option value="sale">Sales only</option>
            <option value="order">Orders only</option>
          </select>
        </div>
        <div className="overflow-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="text-xs uppercase">
              <tr>{["Invoice ID", "Type", "Customer", "Details", "Date", "Total", "Status", "Action"].map(item => <th key={item} className="px-4 py-3 font-black">{item}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {pageRows.map(invoice => (
                <tr key={invoice.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-black">{invoice.id}</td>
                  <td className="px-4 py-3">{invoice.type}</td>
                  <td className="px-4 py-3">{invoice.customer}</td>
                  <td className="px-4 py-3 text-neutral-400">{invoice.detail}</td>
                  <td className="px-4 py-3 text-neutral-400">{invoice.date}</td>
                  <td className="px-4 py-3 font-black text-[#35f4df]">{money(invoice.total)}</td>
                  <td className="px-4 py-3"><Status status={invoice.status} /></td>
                  <td className="px-4 py-3">
                    <button className="btn-muted px-3" onClick={() => setSelectedInvoice(invoice)} type="button"><FaReceipt /> Print</button>
                  </td>
                </tr>
              ))}
              {!pageRows.length && <tr><td className="px-4 py-6 text-neutral-400" colSpan="8">No invoices found.</td></tr>}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      </Card>
      {selectedInvoice && <ReceiptModal invoice={selectedInvoice} close={() => setSelectedInvoice(null)} />}
    </div>
  );
}

function InvoiceStat({ label, value, tone = "white" }) {
  const color = tone === "teal" ? "text-[#35f4df]" : tone === "rose" ? "text-[#ff2d83]" : "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
      <span className="text-sm font-black text-neutral-400">{label}</span>
      <strong className={`mt-2 block text-2xl font-black ${color}`}>{value}</strong>
    </div>
  );
}

function Status({ status }) {
  const styles = status === "Paid" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300";
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${styles}`}>{status}</span>;
}

function ReceiptModal({ invoice, close }) {
  const printReceipt = () => window.print();

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4 print:static print:block print:bg-white print:p-0">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#151515] p-5 shadow-soft print:border-0 print:bg-white print:p-0 print:text-black print:shadow-none">
        <div className="no-print mb-4 flex justify-end gap-2">
          <button className="btn-muted" onClick={close} type="button">Close</button>
          <button className="btn-primary" onClick={printReceipt} type="button"><FaReceipt /> Print Receipt</button>
        </div>

        <section className="print-area receipt-print rounded-xl bg-white p-5 font-mono text-sm text-black">
          <div className="border-b border-dashed border-black pb-3 text-center">
            <h2 className="text-xl font-black">{settings.storeName || "Hanzala Supermarket"}</h2>
            <p>Sales Receipt / Invoice</p>
            <p>Kabul, Afghanistan</p>
          </div>

          <div className="grid gap-1 border-b border-dashed border-black py-3">
            <p><strong>Invoice:</strong> {invoice.id}</p>
            <p><strong>Date:</strong> {invoice.date}</p>
            <p><strong>Customer:</strong> {invoice.customer}</p>
            <p><strong>Status:</strong> {invoice.status}</p>
            <p><strong>Payment:</strong> {invoice.paymentMethod}</p>
          </div>

          <table className="my-3 w-full text-left text-black">
            <thead className="bg-white text-black">
              <tr className="border-b border-black">
                <th className="py-1">Item</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items.length ? invoice.items : [{ name: invoice.detail, quantity: 1, total: invoice.total }]).map((item, index) => (
                <tr key={`${item.name}-${index}`}>
                  <td className="py-1">{item.name}</td>
                  <td className="py-1 text-center">{item.quantity}</td>
                  <td className="py-1 text-right">{money(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-black pt-3">
            <div className="flex justify-between text-lg font-black">
              <span>Total</span>
              <span>{money(invoice.total)}</span>
            </div>
          </div>

          <p className="mt-5 text-center">{settings.receiptFooter || "Thank you for shopping with us."}</p>
        </section>
      </div>
    </div>
  );
}

