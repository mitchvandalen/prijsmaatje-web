import Link from "next/link";

export default function HomePage() {
  return (
    <div className="pm-page">
      <div className="pm-content">
        <header className="pm-header">
          <h1 className="pm-title">PrijsMaatje 🛒</h1>
          <p className="pm-subtitle">
            Vind automatisch de goedkoopste supermarkt voor jouw boodschappen.
          </p>
        </header>

        {/* BLOK 1 – Korte uitleg (géén card in Streamlit) */}
        <section className="pm-section">
          <p className="pm-text">
            Met <strong>PrijsMaatje</strong> vul je één keer je boodschappenlijst in en zie je in een paar seconden:
          </p>

          <ul className="pm-bullets">
            <li>welke supermarkt het goedkoopst is per product</li>
            <li>wat je totaal betaalt per winkel</li>
            <li>waar je het meest kunt besparen</li>
          </ul>

          <p className="pm-hint">
            👉 Begin met je eerste vergelijking op de pagina <strong>Vergelijken</strong> in het menu links.
          </p>

          <p className="pm-caption">Binnen 1 minuut zie je waar jij het goedkoopst uit bent 👇</p>

          <div className="pm-ctaWrap">
            <Link className="pm-ctaBtn" href="/vergelijken">
              ➡️ Start met vergelijken
            </Link>
          </div>
        </section>

        <div className="pm-sep" />

        {/* BLOK 2 – Hoe werkt het? (wel card in Streamlit) */}
        <section className="pm-card">
          <h2 className="pm-h2">🧾 Hoe werkt het?</h2>

          <ol className="pm-steps">
            <li>Ga in het menu links naar <strong>Vergelijken</strong>.</li>
            <li>Kies de supermarkten die je wilt meenemen (bijv. <strong>AH, Jumbo, Dirk</strong>).</li>
            <li>Vul je boodschappenlijst in – via de suggesties of eigen producten.</li>
            <li>Klik op <strong>“Vergelijk prijzen”</strong>.</li>
            <li>
              Bekijk vervolgens:
              <ul className="pm-bullets pm-bullets--nested">
                <li>de gekoppelde producten</li>
                <li>de goedkoopste winkel per product</li>
                <li>het totaalbedrag per winkel</li>
              </ul>
            </li>
          </ol>

          <p className="pm-caption">
            Tip: begin met 3–5 producten die je vaak koopt en kijk hoeveel je zou besparen.
          </p>
        </section>

        <div className="pm-sep" />

        {/* BLOK 3 – Wat kun je doen? (Streamlit = 2 kolommen tekst, geen cards) */}
        <section className="pm-card">
          <h2 className="pm-h2">🚀 Wat kun je doen in de app?</h2>

          <div className="pm-twoCol">
            <div className="pm-block">
              <h3 className="pm-h3">📊 Vergelijken</h3>
              <ul className="pm-bullets">
                <li>Vergelijk supermarkten op basis van jouw eigen boodschappenlijst.</li>
                <li>Zie per winkel het totaalbedrag.</li>
                <li>Ontdek direct waar jij het goedkoopst uit bent.</li>
                <li>Sla (Premium) je vergelijking op in je geschiedenis.</li>
              </ul>

              <h3 className="pm-h3">🛒 Producten</h3>
              <ul className="pm-bullets">
                <li>Bekijk een overzicht van producten en prijzen per winkel.</li>
                <li>Filter op winkel of zoek op productnaam.</li>
                <li>Handig als je vooraf wilt oriënteren.</li>
              </ul>
            </div>

            <div className="pm-block">
              <h3 className="pm-h3">💎 Premium (demo)</h3>
              <ul className="pm-bullets">
                <li>Laat je boodschappenlijst opslaan als <strong>prijsalert-lijst</strong>.</li>
                <li>Krijg een <strong>persoonlijk bespaaroverzicht</strong> (geschat).</li>
                <li>Bewaar je <strong>vergelijkingsgeschiedenis</strong>.</li>
                <li>Maak en beheer <strong>vaste lijsten</strong> (opslaan, hernoemen, verwijderen, opnieuw gebruiken).</li>
              </ul>

              <h3 className="pm-h3">🕒 Geschiedenis (Premium)</h3>
              <ul className="pm-bullets">
                <li>Bekijk eerdere vergelijkingen die je met PrijsMaatje hebt gedaan.</li>
                <li>Kopieer de gebruikte boodschappenlijst of gebruik die opnieuw.</li>
                <li>Geef lijsten een naam, verwijder ze, of sla ze op als vaste lijst.</li>
              </ul>
            </div>
          </div>
        </section>

        <div className="pm-sep" />

        {/* BLOK 4 – Premium teaser (card) */}
        <section className="pm-card">
          <h2 className="pm-h2">💡 Extra gemak met Premium (demo)</h2>

          <ul className="pm-bullets">
            <li>wordt je boodschappenlijst opgeslagen als <strong>prijsalert-lijst</strong></li>
            <li>wordt je <strong>vergelijkingsgeschiedenis</strong> bewaard (incl. kopiëren &amp; hergebruik)</li>
            <li>kun je <strong>vaste lijsten</strong> maken (bijv. <em>Weekboodschappen</em> / <em>BBQ</em>)</li>
            <li>krijg je een <strong>persoonlijk bespaaroverzicht</strong> (geschat)</li>
          </ul>

          <p className="pm-hint">
            👉 Meer weten of even uitproberen? Ga in het menu naar <strong>💎 Premium</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
