'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/auth-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function ReceiptScannerPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);

  const scanMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user?.id || '');

      const res = await fetch('/api/receipts/scan', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Scan failed');
      return res.json();
    },
    onSuccess: (data) => {
      setScanResult(data);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setScanResult(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = () => {
    if (selectedFile) {
      scanMutation.mutate(selectedFile);
    }
  };

  const handleConfirm = async () => {
    if (scanResult?.transaction) {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setSelectedFile(null);
      setPreview(null);
      setScanResult(null);
      alert('Transaction created successfully!');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Scan Receipt</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Upload Receipt Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPG, PNG, PDF (or use your camera)
              </p>
            </div>

            {preview && (
              <div>
                <p className="text-sm font-medium mb-2">Preview:</p>
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="max-w-full h-auto border rounded-lg"
                />
              </div>
            )}

            {selectedFile && !scanResult && (
              <button
                onClick={handleScan}
                disabled={scanMutation.isPending}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {scanMutation.isPending ? 'Scanning...' : '🔍 Scan Receipt'}
              </button>
            )}

            {scanMutation.isError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">
                  {(scanMutation.error as Error).message || 'Failed to scan receipt'}
                </p>
              </div>
            )}

            {scanResult && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium mb-2">Scan successful!</p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Merchant:</span>{' '}
                      {scanResult.scanResult?.merchant || 'Unknown'}
                    </div>
                    <div>
                      <span className="font-medium">Total:</span> $
                      {scanResult.scanResult?.total?.toFixed(2) || '0.00'}
                    </div>
                    <div>
                      <span className="font-medium">Category:</span>{' '}
                      {scanResult.categorization?.category || 'Unknown'}
                    </div>
                    {scanResult.scanResult?.items && scanResult.scanResult.items.length > 0 && (
                      <div>
                        <span className="font-medium">Items:</span>
                        <ul className="list-disc list-inside mt-1">
                          {scanResult.scanResult.items.map((item: any, idx: number) => (
                            <li key={idx}>
                              {item.description}: ${item.amount.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {scanResult.scanResult?.rawText && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium mb-2">Extracted Text:</p>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {scanResult.scanResult.rawText}
                    </pre>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Confirm & Add Transaction
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                      setScanResult(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Scan Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 Tips for better scanning:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Ensure the receipt is well-lit and in focus</li>
            <li>Make sure text is clearly visible</li>
            <li>Try to capture the entire receipt in frame</li>
            <li>In demo mode, any image will work with mock data</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}

