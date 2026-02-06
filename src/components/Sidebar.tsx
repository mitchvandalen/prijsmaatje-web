import Link from "next/link";

const nav = [
  { href: "/", label: "Home" },
  { href: "/vergelijken", label: "🔎 Vergelijken" },
  { href: "/producten", label: "📦 Producten" },
  { href: "/premium", label: "💎 Premium" },
  { href: "/geschiedenis", label: "🕒 Geschiedenis" },
];

export default function Sidebar() {
  return (
    <aside className="pm-sidebar">
      <div className="pm-sideHeader">
        <div className="pm-brand">PrijsMaatje</div>
        <div className="pm-sideSub">menu</div>
      </div>

      <nav className="pm-nav">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="pm-navItem">
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

