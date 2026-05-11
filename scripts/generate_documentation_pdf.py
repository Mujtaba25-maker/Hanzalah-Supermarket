from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Flowable,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
PDF_PATH = DOCS / "Hanzala_Supermarket_Full_Documentation.pdf"
README_PATH = ROOT / "README.md"
ACCENT = colors.HexColor("#ff2d83")
CYAN = colors.HexColor("#38f2e1")
DARK = colors.HexColor("#151515")
MUTED = colors.HexColor("#4b5563")


class HR(Flowable):
    def __init__(self, color=ACCENT, thickness=1):
        Flowable.__init__(self)
        self.color = color
        self.thickness = thickness
        self.height = 8

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 4, self._availWidth, 4)


def styles():
    base = getSampleStyleSheet()
    base["Normal"].fontName = "Helvetica"
    base["Normal"].fontSize = 9.5
    base["Normal"].leading = 13
    base["Normal"].spaceAfter = 6
    base["Title"].fontName = "Helvetica-Bold"
    base["Title"].fontSize = 24
    base["Title"].leading = 30
    base["Title"].alignment = TA_CENTER
    base["Heading1"].fontName = "Helvetica-Bold"
    base["Heading1"].fontSize = 16
    base["Heading1"].leading = 20
    base["Heading1"].textColor = DARK
    base["Heading1"].spaceBefore = 14
    base["Heading1"].spaceAfter = 7
    base["Heading2"].fontName = "Helvetica-Bold"
    base["Heading2"].fontSize = 12.5
    base["Heading2"].leading = 16
    base["Heading2"].textColor = colors.HexColor("#111827")
    base["Heading2"].spaceBefore = 10
    base["Heading2"].spaceAfter = 5
    base.add(ParagraphStyle(name="Subtitle", parent=base["Normal"], alignment=TA_CENTER, fontSize=11, leading=15, textColor=MUTED))
    base.add(ParagraphStyle(name="Small", parent=base["Normal"], fontSize=8, leading=10, textColor=MUTED))
    base.add(ParagraphStyle(name="Callout", parent=base["Normal"], backColor=colors.HexColor("#fdf2f8"), borderColor=ACCENT, borderWidth=0.8, borderPadding=8, leading=13))
    base.add(ParagraphStyle(name="Code", parent=base["Normal"], fontName="Courier", fontSize=8.5, leading=11, backColor=colors.HexColor("#f3f4f6"), borderPadding=5))
    return base


S = styles()


def p(text, style="Normal"):
    return Paragraph(text, S[style])


def h1(text):
    return [p(text, "Heading1"), HR(colors.HexColor("#e5e7eb"), 0.8)]


def h2(text):
    return p(text, "Heading2")


def bullets(items):
    return ListFlowable([ListItem(p(item), bulletColor=ACCENT) for item in items], bulletType="bullet", leftIndent=18)


def table(data, widths=None):
    rows = [[p(str(cell), "Small") if i == 0 else p(str(cell)) for cell in row] for i, row in enumerate(data)]
    t = Table(rows, colWidths=widths, repeatRows=1, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d1d5db")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def codeblock(text):
    return p(text.replace("\n", "<br/>"), "Code")


def add_section(story, title, body):
    story.extend(h1(title))
    for item in body:
        story.append(item)
        story.append(Spacer(1, 4))


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(doc.leftMargin, 0.45 * inch, "Hanzala Supermarket - Full Project Documentation")
    canvas.drawRightString(A4[0] - doc.rightMargin, 0.45 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build_story():
    story = []
    story.append(Spacer(1, 0.9 * inch))
    story.append(p("Hanzala Supermarket", "Title"))
    story.append(p("Full Project Documentation and Presentation Report", "Subtitle"))
    story.append(Spacer(1, 0.18 * inch))
    story.append(HR(ACCENT, 2))
    story.append(Spacer(1, 0.18 * inch))
    story.append(p("A full-stack supermarket management dashboard built with React, Tailwind CSS, Node.js, MongoDB, barcode workflows, authentication, reporting, and deployment support.", "Subtitle"))
    story.append(Spacer(1, 0.4 * inch))
    story.append(table([
        ["Document Field", "Value"],
        ["Project Name", "Hanzala Supermarket"],
        ["Project Type", "Full-stack supermarket management dashboard"],
        ["Frontend", "React, Vite, Tailwind CSS, React Router, React Icons, Recharts"],
        ["Backend", "Node.js HTTP API and Vercel serverless API"],
        ["Database", "MongoDB Atlas or local MongoDB Compass connection"],
        ["Currency", "AFN - Afghani"],
        ["Primary Users", "Admin, Manager, Cashier"],
    ], [1.75 * inch, 4.65 * inch]))
    story.append(PageBreak())

    add_section(story, "1. Executive Summary", [
        p("Hanzala Supermarket is a real-world style store management dashboard designed to help a supermarket manage products, inventory, sales, orders, customers, suppliers, invoices, users, reports, and daily operations from one web application."),
        p("The system includes a modern dark responsive admin panel, MongoDB persistence, role-based authentication, barcode-assisted selling and order creation, receipt printing, reporting, notifications, audit history, and deployment support for Vercel."),
        p("The goal of the project is to replace manual store records with a centralized digital dashboard where store staff can sell products, track stock, monitor profit, manage suppliers, print receipts, and review business performance."),
    ])

    add_section(story, "2. Project Objectives", [
        bullets([
            "Create a responsive, professional supermarket dashboard that works on desktop, laptop, tablet, and mobile screens.",
            "Use a real database instead of only static mock data.",
            "Support daily store workflows such as product selling, stock updates, customer management, supplier management, invoices, returns, and reports.",
            "Add authentication and roles so different staff members have different permissions.",
            "Enable barcode scanning for fast product selection during sales and order creation.",
            "Prepare the project for GitHub and Vercel deployment.",
        ])
    ])

    add_section(story, "3. Technology Stack", [
        table([
            ["Layer", "Technology", "Purpose"],
            ["Frontend", "React", "Builds reusable UI components and dynamic pages."],
            ["Build Tool", "Vite", "Fast development server and optimized production builds."],
            ["Styling", "Tailwind CSS", "Responsive modern dark dashboard design."],
            ["Routing", "React Router", "Dashboard page navigation and protected routes."],
            ["Icons", "React Icons", "Professional icons for menus, cards, actions, and controls."],
            ["Charts", "Recharts", "Sales trend, product performance, and financial charts."],
            ["Backend", "Node.js", "Local API server and production-style app server."],
            ["Serverless", "Vercel API Routes", "Deployment-ready backend for hosted app."],
            ["Database", "MongoDB", "Persistent data storage for products, users, sales, orders, and more."],
        ], [1.2 * inch, 1.5 * inch, 3.7 * inch])
    ])

    add_section(story, "4. Main Features", [
        table([
            ["Feature", "Explanation"],
            ["Dashboard", "Shows total sales, total expense, profit, active orders, customers, low stock items, charts, quick actions, and recent transactions."],
            ["Sales", "Allows staff to sell products, scan barcodes, calculate total, expense, and profit, and record returns/refunds."],
            ["Inventory", "Stores products with SKU, barcode, category, supplier, stock level, cost, price, and low-stock alerts."],
            ["Orders", "Creates customer orders, adds products by barcode, tracks order status, and stores order totals."],
            ["Customers", "Stores customer names, phone numbers, emails, addresses, and order counts. Supports add and edit."],
            ["Suppliers", "Stores supplier contacts, linked products, purchase spend, and stock purchase records."],
            ["Invoices", "Creates invoice records from sales and orders and provides receipt-style printing."],
            ["Reports", "Provides date-based financial reports, sales, expenses, profit, top products, and low-stock reports."],
            ["Settings", "Stores shop profile, currency, receipt footer, dashboard preferences, users, and audit logs."],
            ["Notifications", "Shows live alerts for low stock, pending orders, unpaid orders, and recent activity."],
        ], [1.55 * inch, 4.85 * inch])
    ])

    add_section(story, "5. User Roles and Permissions", [
        p("The system has three default roles. These roles control both the sidebar menus and protected API operations."),
        table([
            ["Role", "Access"],
            ["Admin", "Full access to dashboard, sales, orders, inventory, customers, suppliers, invoices, reports, settings, users, and database management actions."],
            ["Manager", "Access to operational pages such as dashboard, sales, orders, inventory, customers, suppliers, invoices, and reports. Cannot manage admin settings/users."],
            ["Cashier", "Access to dashboard, sales, orders, customers, and invoices. Cashiers are blocked from product, supplier, settings, and user management APIs."],
        ], [1.2 * inch, 5.2 * inch]),
        h2("Default Login Accounts"),
        table([
            ["Role", "Username", "Password"],
            ["Admin", "admin", "admin123"],
            ["Manager", "manager", "manager123"],
            ["Cashier", "cashier", "cashier123"],
        ], [1.4 * inch, 2.2 * inch, 2.2 * inch]),
    ])

    add_section(story, "6. Database Design", [
        p("MongoDB is used for real persistent storage. The database can run on MongoDB Atlas for online deployment or locally through MongoDB Compass using localhost:27017."),
        table([
            ["Collection", "Purpose"],
            ["products", "Stores product identity, SKU, barcode, category, supplier, stock, minimum stock, cost, and price."],
            ["customers", "Stores customer contact information and address details."],
            ["suppliers", "Stores vendor contact information used for stock purchases."],
            ["sales", "Stores completed product sales, quantity, price, total, profit, payment method, and cashier."],
            ["orders", "Stores customer orders, order items, totals, status, and date."],
            ["purchases", "Stores stock purchase records from suppliers and updates stock levels."],
            ["refunds", "Stores returned items/refunds and restores stock."],
            ["users", "Stores staff accounts, roles, active status, and hashed passwords."],
            ["sessions", "Stores temporary login session tokens with expiry."],
            ["settings", "Stores store name, currency, receipt footer, and dashboard preferences."],
            ["audits", "Stores activity history for sales, products, users, refunds, settings, and other important actions."],
        ], [1.45 * inch, 4.95 * inch]),
    ])

    add_section(story, "7. Backend and API Explanation", [
        p("The backend is implemented in two forms: a local Node.js server in app.js and Vercel serverless routing in api/[...path].js. Both use the same database service in lib/database.js, so local and deployed behavior stay consistent."),
        table([
            ["Endpoint", "Method", "Purpose"],
            ["/api/auth/login", "POST", "Authenticates a staff user and returns a session token."],
            ["/api/store", "GET", "Loads all dashboard data, summaries, settings, notifications, and recent audit activity."],
            ["/api/products", "POST", "Creates a new product. Admin/manager only."],
            ["/api/products/:id", "PUT/DELETE", "Updates or deletes products. Delete is admin only."],
            ["/api/products/barcode/:barcode", "GET", "Finds a product by barcode or SKU."],
            ["/api/contacts", "POST", "Creates customers or suppliers depending on contact type."],
            ["/api/contacts/:id", "PUT", "Updates customer or supplier contact information."],
            ["/api/sales", "POST", "Records a sale, reduces stock, and stores profit."],
            ["/api/orders", "POST", "Creates a customer order with scanned/manual products."],
            ["/api/purchases", "POST", "Records stock purchase and increases product stock."],
            ["/api/refunds", "POST", "Records a return/refund and restores product stock."],
            ["/api/settings", "PUT", "Updates database-backed store settings. Admin only."],
            ["/api/users", "POST", "Creates a staff user. Admin only."],
            ["/api/users/:id", "PUT", "Updates role, password, and active status. Admin only."],
        ], [2.0 * inch, 0.8 * inch, 3.6 * inch]),
    ])

    add_section(story, "8. Authentication and Security", [
        bullets([
            "Passwords are hashed using PBKDF2 with a random salt before being stored.",
            "Login creates a session token stored in the sessions collection.",
            "API requests require an Authorization Bearer token.",
            "Session tokens expire automatically using MongoDB TTL indexes.",
            "Backend role checks protect sensitive operations even if the user tries to call the API directly.",
            "Admin-only actions include settings updates, user creation, user updates, and product deletion.",
        ]),
        p("This provides a practical security layer for a student or small-business dashboard. For enterprise production, additional measures such as HTTPS enforcement, refresh tokens, CSRF protection, stronger password policy, and server-side rate limiting would be recommended.", "Callout"),
    ])

    add_section(story, "9. Workflow Explanation", [
        h2("Sales Workflow"),
        bullets([
            "Cashier opens the Sales page.",
            "Product is selected manually or scanned using barcode/USB scanner/camera scanner.",
            "The system calculates sale total, expense, and projected profit.",
            "On completion, stock is reduced and a sale record is saved.",
            "The sale appears in recent sales, reports, dashboard charts, and invoices.",
        ]),
        h2("Order Workflow"),
        bullets([
            "Staff creates an order for a customer.",
            "Products can be added by barcode scan or manual dropdown.",
            "The system calculates order total automatically.",
            "Order status can be pending, shipped, or delivered.",
            "Orders appear in the order table, dashboard active order count, and invoice records.",
        ]),
        h2("Inventory and Supplier Workflow"),
        bullets([
            "Products are created with SKU, barcode, category, cost, price, stock, and supplier.",
            "Low stock appears in dashboard summary and notifications.",
            "Managers can record supplier stock purchases.",
            "Purchases increase stock and update unit cost when required.",
        ]),
        h2("Refund Workflow"),
        bullets([
            "Staff selects a previous sale from the returns/refunds section.",
            "Quantity and reason are entered.",
            "The refund record is saved and product stock is restored.",
            "Refunds affect reports and summary calculations.",
        ]),
    ])

    add_section(story, "10. Barcode Scanner Explanation", [
        p("The project supports two barcode methods. A USB barcode scanner works like a keyboard: click the barcode field, scan the item, and the scanner types the code and presses Enter. The app also includes a browser camera scanner using the BarcodeDetector API where supported."),
        bullets([
            "In Sales, scanning a barcode selects the matching product immediately.",
            "In Orders, scanning a barcode adds the matching product to the order cart.",
            "In Inventory, each product can store a barcode. If no barcode is entered, SKU can act as the default barcode.",
            "If camera scanning is not supported by the browser, manual/USB scanning still works.",
        ]),
    ])

    add_section(story, "11. Dashboard and Notifications", [
        p("The dashboard is the main command center. It summarizes store performance and provides quick access to important workflows."),
        table([
            ["Dashboard Item", "Meaning"],
            ["Total Sales", "Revenue after considering refunds."],
            ["Total Expense", "Cost of goods sold."],
            ["Total Profit", "Sales revenue minus expenses and refunds."],
            ["Active Orders", "Orders not yet delivered."],
            ["Total Customers", "Number of customers shown in the system."],
            ["Low Stock Items", "Products whose stock is at or below minimum stock."],
        ], [1.65 * inch, 4.75 * inch]),
        p("Notifications are no longer decorative. The bell dropdown shows live alerts for low stock, pending orders, unpaid/active orders, and recent audit activity."),
    ])

    add_section(story, "12. Reporting and Printing", [
        p("The Reports page gives store owners and managers a way to review store performance over a selected date range."),
        bullets([
            "Total sales, total expense, total profit, and low stock count.",
            "Financial chart comparing sales, expenses, profit, and purchases.",
            "Top product performance table showing units sold, sales, and profit.",
            "Low stock report showing products that need reorder.",
            "Printable report button for paper/PDF output.",
        ]),
        p("The Invoice page includes receipt-style printing. A receipt modal opens for a selected sale/order and prints a compact receipt suitable for 80mm thermal-style layout.", "Callout"),
    ])

    add_section(story, "13. UI and Design Explanation", [
        bullets([
            "Dark professional admin dashboard inspired by modern retail systems.",
            "Collapsible sidebar with icons for all modules.",
            "Responsive layout for mobile, tablet, and desktop.",
            "Cards, charts, tables, modals, filters, buttons, and forms follow one consistent visual style.",
            "Admin header contains search, refresh, notifications, role display, and profile picture.",
            "Route-level code splitting keeps production bundle sizes clean.",
        ])
    ])

    add_section(story, "14. Local Setup", [
        p("Install dependencies:"),
        codeblock("npm install"),
        p("Create a .env file and add MongoDB connection values:"),
        codeblock("MONGODB_URI=mongodb://127.0.0.1:27017\nMONGODB_DB=hanzalah_supermarket"),
        p("For MongoDB Atlas, use your Atlas connection string instead:"),
        codeblock("MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority\nMONGODB_DB=hanzalah_supermarket"),
        p("Seed the database if needed:"),
        codeblock("npm run db:seed"),
        p("Run production-style local server:"),
        codeblock("npm start"),
        p("Open the app:"),
        codeblock("http://localhost:3000"),
    ])

    add_section(story, "15. Vercel Deployment", [
        p("The project includes vercel.json and api/[...path].js, so it is ready for Vercel deployment from GitHub."),
        bullets([
            "Push the repository to GitHub.",
            "Import the GitHub repository into Vercel.",
            "Set Framework Preset to Vite.",
            "Build command: npm run build.",
            "Output directory: dist.",
            "Add environment variables MONGODB_URI and MONGODB_DB in Vercel settings.",
            "Deploy and open the Vercel URL on any device, including phone.",
        ]),
    ])

    add_section(story, "16. Project Structure", [
        table([
            ["Path", "Explanation"],
            ["api/[...path].js", "Vercel serverless API entry point."],
            ["app.js", "Local Node.js server for API and static frontend hosting."],
            ["lib/database.js", "MongoDB service, data models, business logic, authentication, role checks, summaries, and notifications."],
            ["src/App.jsx", "Main React application, routing, session handling, role-based page access."],
            ["src/components", "Reusable UI components such as Layout, Card, Pagination, BarcodeScanner, StatCard."],
            ["src/pages", "Main app screens: Dashboard, Sales, Orders, Inventory, Customers, Suppliers, Invoice, Reports, Settings, Login."],
            ["src/lib/api.js", "Frontend API helper functions."],
            ["src/lib/format.js", "Shared app constants and AFN money formatter."],
            ["data/store.json", "Seed data used to initialize MongoDB."],
            ["scripts", "Database seed and documentation generation scripts."],
            ["public/admin-profile.jpeg", "Admin profile picture used in the dashboard header."],
        ], [1.8 * inch, 4.6 * inch]),
    ])

    add_section(story, "17. Testing and Verification", [
        p("The project includes a check command that validates backend syntax and builds the frontend."),
        codeblock("npm run check"),
        p("This command runs:"),
        bullets([
            "node --check app.js",
            "node --check api/[...path].js",
            "node --check lib/database.js",
            "node --check scripts/seed-mongodb.js",
            "vite build",
        ]),
        p("The project also includes optimized Vite chunk splitting so the previous 500 kB bundle warning is solved."),
    ])

    add_section(story, "18. Troubleshooting", [
        table([
            ["Problem", "Solution"],
            ["Port 3000 already in use", "Close the old Node process or run with another port, for example: $env:PORT=3001; npm start."],
            ["MongoDB URI not configured", "Create .env locally and add MONGODB_URI and MONGODB_DB. Add the same values in Vercel environment variables."],
            ["Cannot login", "Make sure the database was seeded or default users exist. Use admin/admin123 for admin login."],
            ["Barcode camera not working", "Use Chrome/Edge and allow camera permission. If unsupported, use USB scanner/manual barcode input."],
            ["No data on Vercel", "Check MongoDB Atlas IP access, database user/password, and Vercel environment variables."],
            ["Receipt print not aligned", "Adjust printer paper size to 80mm and test browser print margins."],
        ], [1.9 * inch, 4.5 * inch]),
    ])

    add_section(story, "19. Presentation Talking Points", [
        bullets([
            "This project solves supermarket record management by replacing manual paper records with a centralized digital dashboard.",
            "The dashboard gives owners real-time insight into sales, profit, stock, customers, orders, and alerts.",
            "Barcode scanning improves speed and reduces mistakes during selling and order creation.",
            "MongoDB makes the system persistent and suitable for real database management demonstrations.",
            "Role-based login separates responsibilities between admin, manager, and cashier.",
            "Reports and receipt printing make the system useful for daily business operations.",
            "The project is deployable on Vercel and can be opened from another device, such as a phone.",
        ])
    ])

    add_section(story, "20. Future Improvements", [
        bullets([
            "Add advanced sales return validation to prevent refunding more than remaining refundable quantity.",
            "Add product images and category management.",
            "Add export to Excel/PDF for reports.",
            "Add multi-branch support for several supermarket locations.",
            "Add real payment integrations or POS hardware integration.",
            "Add supplier payment tracking and purchase invoices.",
            "Add email/SMS customer receipts.",
            "Add stricter production security such as rate limiting and password reset flow.",
        ])
    ])

    add_section(story, "21. Conclusion", [
        p("Hanzala Supermarket is now a complete full-stack supermarket management dashboard suitable for presentation, demonstration, and further real-world development. It includes modern UI, real database persistence, authentication, roles, barcode workflows, sales, inventory, suppliers, invoices, reports, settings, notifications, refunds, audit history, and deployment support."),
        p("The project demonstrates practical database management, frontend engineering, backend API design, security basics, and business workflow automation in one integrated system.", "Callout"),
    ])

    return story


def write_readme():
    README_PATH.write_text(
        """# Hanzala Supermarket

Hanzala Supermarket is a full-stack supermarket management dashboard built with React, Tailwind CSS, Node.js, and MongoDB.

## Main Modules

- Dashboard with sales, expense, profit, orders, customers, low stock, charts, quick actions, and notifications
- Sales with barcode scanner, profit calculation, and returns/refunds
- Inventory with product, SKU, barcode, stock, cost, price, and supplier tracking
- Orders with barcode-based product adding
- Customers with add/edit workflow
- Suppliers with stock purchase tracking
- Invoices with receipt printing
- Reports with date filters, financial overview, top products, and low stock report
- Settings with store profile, currency, dashboard preferences, user management, and audit history
- Authentication with admin, manager, and cashier roles

## Default Login

```text
Admin: admin / admin123
Manager: manager / manager123
Cashier: cashier / cashier123
```

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:seed
npm start
```

Open:

```text
http://localhost:3000
```

## Environment Variables

```text
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=hanzalah_supermarket
```

For MongoDB Atlas, use your Atlas connection string in `MONGODB_URI`.

## Verification

```bash
npm run check
```

## Full PDF Documentation

See `docs/Hanzala_Supermarket_Full_Documentation.pdf`.
""",
        encoding="utf-8",
    )


def main():
    DOCS.mkdir(exist_ok=True)
    write_readme()
    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=A4,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.7 * inch,
        title="Hanzala Supermarket Full Documentation",
        author="Hanzala Supermarket",
    )
    story = build_story()
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(PDF_PATH)


if __name__ == "__main__":
    main()
