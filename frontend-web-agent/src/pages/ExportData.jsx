import { useState } from 'react';

const ExportData = () => {
  const [type, setType] = useState('users');
  const [format, setFormat] = useState('csv');

  const handleExport = () => {
    window.open(`https://ton-backend-api.com/api/admin/export/${type}?format=${format}`, '_blank');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Exporter les données</h1>
      <div className="flex gap-4 mb-4">
        <select value={type} onChange={e=>setType(e.target.value)} className="border p-2 rounded">
          <option value="users">Utilisateurs</option>
          <option value="declarations">Déclarations</option>
          <option value="payments">Paiements</option>
          <option value="dashboard">Dashboard</option>
        </select>
        <select value={format} onChange={e=>setFormat(e.target.value)} className="border p-2 rounded">
          <option value="csv">CSV</option>
          <option value="pdf">PDF</option>
          <option value="excel">Excel</option>
        </select>
        <button onClick={handleExport} className="bg-blue-600 text-white px-4 py-2 rounded">Exporter</button>
      </div>
    </div>
  );
};

export default ExportData;
