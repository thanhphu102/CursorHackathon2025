// OCR Adapter: Handles Google Vision API and Tesseract.js fallback
import Tesseract from 'tesseract.js';
import type { ReceiptScanResult } from '@/types';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const googleVisionApiKey = process.env.GOOGLE_VISION_API_KEY;

/**
 * Mock OCR result for demo mode
 */
function mockOCR(imageData: Buffer): ReceiptScanResult {
  // Simulate OCR extraction
  return {
    merchant: 'Sample Store',
    total: 45.99,
    date: new Date(),
    items: [
      { description: 'Item 1', amount: 20.99 },
      { description: 'Item 2', amount: 25.00 },
    ],
    rawText: 'SAMPLE STORE\n123 Main St\nDate: 2024-01-15\n\nItem 1        $20.99\nItem 2        $25.00\n\nTotal: $45.99',
    confidence: 0.85,
  };
}

/**
 * Extract text using Google Vision API
 */
async function extractWithGoogleVision(imageData: Buffer): Promise<string> {
  if (!googleVisionApiKey) {
    throw new Error('Google Vision API key not configured');
  }

  // Convert image to base64
  const base64Image = imageData.toString('base64');

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google Vision API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const textAnnotations = data.responses[0]?.textAnnotations;
  
  if (!textAnnotations || textAnnotations.length === 0) {
    return '';
  }

  // Return full text (first annotation contains all text)
  return textAnnotations[0].description || '';
}

/**
 * Extract text using Tesseract.js (fallback)
 */
async function extractWithTesseract(imageData: Buffer): Promise<string> {
  const { data } = await Tesseract.recognize(imageData, 'eng', {
    logger: (m) => {
      // Optional: log progress
      if (m.status === 'recognizing text') {
        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
      }
    },
  });

  return data.text;
}

/**
 * Parse OCR text to extract receipt information
 */
function parseReceiptText(text: string): ReceiptScanResult {
  const lines = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  
  let merchant = 'Unknown Merchant';
  let total: number | undefined;
  let date: Date | undefined;
  const items: Array<{ description: string; amount: number }> = [];

  // Extract merchant (usually first line)
  if (lines.length > 0) {
    merchant = lines[0];
  }

  // Extract total (look for lines with "total" keyword)
  for (const line of lines) {
    const totalMatch = line.match(/total[:\s]*\$?(\d+\.?\d*)/i);
    if (totalMatch) {
      total = parseFloat(totalMatch[1]);
      break;
    }
  }

  // Extract date (look for date patterns)
  for (const line of lines) {
    const dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (dateMatch) {
      date = new Date(dateMatch[1]);
      if (!isNaN(date.getTime())) break;
    }
  }

  // Extract items (lines with dollar amounts, excluding total)
  for (const line of lines) {
    const itemMatch = line.match(/(.+?)\s+\$?(\d+\.?\d*)$/);
    if (itemMatch && !line.toLowerCase().includes('total')) {
      items.push({
        description: itemMatch[1].trim(),
        amount: parseFloat(itemMatch[2]),
      });
    }
  }

  // If no total found but items exist, sum them
  if (!total && items.length > 0) {
    total = items.reduce((sum, item) => sum + item.amount, 0);
  }

  return {
    merchant,
    total,
    date: date || new Date(),
    items,
    rawText: text,
    confidence: 0.7, // Lower confidence for parsed text
  };
}

/**
 * Main OCR function
 */
export async function scanReceipt(imageFile: File | Buffer): Promise<ReceiptScanResult> {
  // Convert File to Buffer if needed
  let imageData: Buffer;
  if (imageFile instanceof File) {
    const arrayBuffer = await imageFile.arrayBuffer();
    imageData = Buffer.from(arrayBuffer);
  } else {
    imageData = imageFile;
  }

  // Demo mode
  if (isDemoMode) {
    return mockOCR(imageData);
  }

  // Try Google Vision first, fallback to Tesseract
  try {
    const text = await extractWithGoogleVision(imageData);
    if (text.trim().length > 0) {
      const result = parseReceiptText(text);
      result.confidence = 0.9; // Higher confidence for Google Vision
      return result;
    }
  } catch (error) {
    console.warn('Google Vision API failed, falling back to Tesseract:', error);
  }

  // Fallback to Tesseract.js
  try {
    const text = await extractWithTesseract(imageData);
    if (text.trim().length > 0) {
      return parseReceiptText(text);
    }
  } catch (error) {
    console.error('Tesseract OCR failed:', error);
    throw new Error('OCR failed. Please try again or enter transaction manually.');
  }

  // If both fail, return minimal result
  return {
    merchant: 'Unknown',
    rawText: '',
    confidence: 0,
  };
}

