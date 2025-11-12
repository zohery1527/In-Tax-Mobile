
const Table = ({ data, columns }) => {
  return (
    <table className="min-w-full bg-white border">
      <thead>
        <tr>
          {columns.map(col => <th key={col.key} className="border px-4 py-2 text-left">{col.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map((row,i)=>(
          <tr key={i} className="hover:bg-gray-100">
            {columns.map(col => (
              <td key={col.key} className="border px-4 py-2">{col.render ? col.render(row) : row[col.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
