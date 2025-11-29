'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/auth-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export default function ImportTransactionsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [csvContent, setCsvContent] = useState('');
  const [preview, setPreview] = useState<any[]>([]);

  const importMutation = useMutation({
    mutationFn: async (rows: any[]) => {
      const res = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          rows,
        }),
      });

      if (!res.ok) throw new Error('Import failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      router.push('/transactions');
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(file);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter((line) => line.trim());
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    const rows = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      return row;
    });

    setPreview(rows);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    parseCSV(text);
  };

  const handleImport = () => {
    if (preview.length > 0) {
      const rows = preview.map((row) => ({
        date: row.date || row['transaction date'] || '',
        amount: row.amount || row['transaction amount'] || '',
        merchant: row.merchant || row['merchant name'] || row.description || '',
        category: row.category || '',
        description: row.description || row.notes || '',
      }));

      importMutation.mutate(rows);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Import Transactions</h1>

        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Upload CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Or Paste CSV Content</label>
            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              onPaste={handlePaste}
              className="w-full px-3 py-2 border rounded-lg h-32 font-mono text-sm"
              placeholder="Date,Amount,Merchant,Category&#10;2024-01-15,45.99,Starbucks,Food"
            />
            <button
              onClick={() => parseCSV(csvContent)}
              className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Parse CSV
            </button>
          </div>

          {preview.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                Preview ({preview.length} transactions):
              </p>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Amount</th>
                      <th className="px-3 py-2 text-left">Merchant</th>
                      <th className="px-3 py-2 text-left">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {preview.slice(0, 10).map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">{row.date || '-'}</td>
                        <td className="px-3 py-2">${row.amount || '-'}</td>
                        <td className="px-3 py-2">{row.merchant || '-'}</td>
                        <td className="px-3 py-2">{row.category || 'Auto'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <p className="px-3 py-2 text-xs text-gray-500">
                    ... and {preview.length - 10} more
                  </p>
                )}
              </div>
            </div>
          )}

          {preview.length > 0 && (
            <button
              onClick={handleImport}
              disabled={importMutation.isPending}
              className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {importMutation.isPending ? 'Importing...' : `Import ${preview.length} Transactions`}
            </button>
          )}

          {importMutation.isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                {(importMutation.error as Error).message || 'Import failed'}
              </p>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">CSV Format:</h3>
          <p className="text-sm text-blue-800 mb-2">
            Expected columns: Date, Amount, Merchant, Category (optional)
          </p>
          <pre className="text-xs text-blue-800 bg-blue-100 p-2 rounded">
            {`Date,Amount,Merchant,Category
2024-01-15,45.99,Starbucks,Food
2024-01-16,29.50,Uber,Transport`}
          </pre>
        </div>
      </div>
    </DashboardLayout>
  );
}

