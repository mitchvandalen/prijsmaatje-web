export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Privacyverklaring
      </h1>

      <p>
        PrijsMaatje verwerkt persoonsgegevens uitsluitend
        voor het leveren van de dienst.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Welke gegevens verzamelen wij?
      </h2>

      <ul className="list-disc ml-6">
        <li>E-mailadres</li>
        <li>Accountgegevens</li>
        <li>Opgeslagen vergelijkingen</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Waarvoor gebruiken wij deze gegevens?
      </h2>

      <ul className="list-disc ml-6">
        <li>Inloggen en accountbeheer</li>
        <li>Premium functies</li>
        <li>Opslaan van vergelijkingen</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Contact
      </h2>

      <p>
        Voor vragen kun je mailen naar
        prijsmaatje@outlook.com
      </p>
    </div>
  );
}