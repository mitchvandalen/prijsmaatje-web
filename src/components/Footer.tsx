import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-blue-100 bg-[#e7f0ff]">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-slate-700">
        <div className="font-semibold text-slate-800">
          PrijsMaatje
        </div>

        <div className="mt-2">
          KvK: 81122543
        </div>

        <div>
          Contact: prijsmaatje@outlook.com
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-4">
          <Link
            href="/privacy"
            className="text-blue-600 hover:underline"
          >
            Privacyverklaring
          </Link>

          <Link
            href="/voorwaarden"
            className="text-blue-600 hover:underline"
          >
            Algemene voorwaarden
          </Link>

          <Link
            href="/contact"
            className="text-blue-600 hover:underline"
          >
            Contact
          </Link>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          © {new Date().getFullYear()} PrijsMaatje
        </div>
      </div>
    </footer>
  );
}