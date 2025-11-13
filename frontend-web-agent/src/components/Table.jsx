import { Search } from 'lucide-react'; // L'icône Search de Lucide
import { useState } from 'react';

const Table = ({ data = [], columns = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrage simple par recherche sur toutes les colonnes textuelles
  const filteredData = data.filter((row) =>
    columns.some((col) => {
      const value = col.render ? col.render(row) : row[col.key];
      return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  return (
    <div className="bg-white shadow rounded-lg p-4 overflow-x-auto">
      {/* Barre de recherche */}
      <div className="mb-4">
        <div className="relative w-full max-w-sm">
          {/* Remplacement de SearchIcon par Search (Lucide) */}
          {/* Note: Lucide utilise la propriété size au lieu de w-5 h-5 */}
          <Search 
            className="text-gray-400 absolute left-3 top-2.5" 
            size={20} // Correspond à peu près à w-5 h-5 (20px)
          />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Tableau */}
      <table className="min-w-full border border-gray-200 table-auto">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-2 text-left text-gray-700 font-medium border-b border-gray-200"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-4 text-gray-500">
                Aucun résultat
              </td>
            </tr>
          ) : (
            filteredData.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2 border-b border-gray-200">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;