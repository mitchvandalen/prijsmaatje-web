export default function DashboardCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="pm-miniCard">
      <h3 className="pm-h3">{title}</h3>
      <ul className="pm-list">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
