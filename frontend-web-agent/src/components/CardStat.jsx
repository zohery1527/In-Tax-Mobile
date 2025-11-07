export default function CardStat({ title, value }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow border-t-4 border-primary-500">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
