import * as XLSX from 'xlsx';
import { CertificateData, BlockchainResult } from './cardano';

export interface ExcelCertificateRow {
  recipientName: string;
  recipientEmail: string;
  recipientPosition: string;
  credentialType: string;
  issueDate: string;
  expiryDate?: string;
}

export interface ExcelCertificateWithBlockchain extends ExcelCertificateRow {
  uniqueIdentifier: string;
  transactionHash: string;
}

// Generate Excel template for certificate batch upload
export function generateExcelTemplate(): ArrayBuffer {
  // Create sample data with headers
  const templateData = [
    {
      recipientName: 'John Doe',
      recipientEmail: 'john@example.com',
      recipientPosition: 'Graduate',
      credentialType: 'Bachelor of Science',
      issueDate: '2024-01-15',
      expiryDate: '',
    },
    {
      recipientName: 'Jane Smith',
      recipientEmail: 'jane@example.com',
      recipientPosition: 'Graduate',
      credentialType: 'Master of Arts',
      issueDate: '2024-01-15',
      expiryDate: '2029-01-15',
    },
  ];

  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(templateData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // recipientName
    { wch: 25 }, // recipientEmail
    { wch: 15 }, // recipientPosition
    { wch: 30 }, // credentialType
    { wch: 12 }, // issueDate
    { wch: 12 }, // expiryDate
  ];
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Certificates');
  
  // Write workbook to array buffer
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return wbout;
}

// Parse Excel file and extract certificate data
export async function parseExcelFile(
  file: File
): Promise<ExcelCertificateRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        // Read the workbook
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert worksheet to JSON
        const jsonData = XLSX.utils.sheet_to_json<ExcelCertificateRow>(worksheet);
        
        // Validate required fields
        const validatedData = jsonData.map((row, index) => {
          if (!row.recipientName || !row.recipientEmail || !row.recipientPosition || 
              !row.credentialType || !row.issueDate) {
            throw new Error(`Row ${index + 2} is missing required fields`);
          }
          return row;
        });
        
        resolve(validatedData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Update Excel file with blockchain data
export function updateExcelWithBlockchainData(
  certificates: ExcelCertificateRow[],
  blockchainResults: BlockchainResult[]
): ArrayBuffer {
  // Combine certificate data with blockchain results
  const updatedData: ExcelCertificateWithBlockchain[] = certificates.map((cert, index) => {
    const result = blockchainResults[index];
    return {
      ...cert,
      uniqueIdentifier: result.uniqueIdentifier,
      transactionHash: result.txHash,
    };
  });

  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(updatedData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // recipientName
    { wch: 25 }, // recipientEmail
    { wch: 15 }, // recipientPosition
    { wch: 30 }, // credentialType
    { wch: 12 }, // issueDate
    { wch: 12 }, // expiryDate
    { wch: 18 }, // uniqueIdentifier
    { wch: 70 }, // transactionHash
  ];
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Certificates');
  
  // Write workbook to array buffer
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return wbout;
}

// Download Excel file
export function downloadExcelFile(
  data: ArrayBuffer,
  filename: string
): void {
  const blob = new Blob([data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Trigger template download
export function downloadTemplate(): void {
  const template = generateExcelTemplate();
  downloadExcelFile(template, 'litecert_certificate_template.xlsx');
}
