export default function Table({ columns = [], data = [], actions }) {
  return (
    <div className="bg-white rounded shadow overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(c => <th key={c.key} className="p-3 text-left text-sm text-gray-600">{c.title}</th>)}
            {actions && <th className="p-3 text-left text-sm text-gray-600">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id} className="border-t hover:bg-gray-50">
              {columns.map(c => <td key={c.key} className="p-3 text-sm">{c.render ? c.render(row) : row[c.key]}</td>)}
              {actions && <td className="p-3">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
