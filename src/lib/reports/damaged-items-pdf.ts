import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export type DamagedItemRow = {
  id: number
  unitCost: number
  quantity: number
  itemName: string
  description?: string
  serialNumber?: string
  inventoryNumber: string
  currentCondition: string
  purchaseDate?: Date | null
  lastBorrowRecord?: {
    borrowerName: string
    returnDate?: Date | null
    roomName?: string
  } | null
}

type UserRole = 'ADMIN' | 'SECRETARY' | 'LABTECH' | 'DEAN' | 'STAFF' | string;

// Utility function to format date
export const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(value);
}

// Function to convert image to base64
const imageToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = function () {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');
      canvas.width = (this as HTMLImageElement).width;
      canvas.height = (this as HTMLImageElement).height;
      ctx.drawImage(this as CanvasImageSource, 0, 0);

      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        console.error('Error converting image to base64:', error);
        resolve('');
      }
    };

    img.onerror = function () {
      // Intentionally not rejecting to allow fallback logic
      resolve('');
    };

    img.src = url;
  });
};

const getHeaderFooterImages = async () => {
  // In Next.js, images are in /public/images/
  const headerUrl = `${window.location.origin}/images/header.png`;
  const footerUrl = `${window.location.origin}/images/footer.png`;

  const [headerBase64, footerBase64] = await Promise.all([
    imageToBase64(headerUrl),
    imageToBase64(footerUrl)
  ]);

  return { headerBase64, footerBase64 };
};

// Add header to PDF page
const addHeader = (doc: jsPDF, headerBase64: string, pageWidth: number) => {
  if (headerBase64) {
    const headerHeight = 120;
    const headerWidth = pageWidth;
    doc.addImage(headerBase64, 'PNG', 0, 0, headerWidth, headerHeight);
  } else {
    // Fallback text header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('MINDANAO STATE UNIVERSITY AT MARAWI', pageWidth / 2, 40, { align: 'center' });
    doc.setFontSize(12);
    doc.text('DAMAGED ITEMS REPORT', pageWidth / 2, 60, { align: 'center' });
  }
};

// Add footer to PDF page
const addFooter = (doc: jsPDF, footerBase64: string, pageWidth: number, pageHeight: number) => {
  if (footerBase64) {
    const footerHeight = 70;
    const footerWidth = pageWidth;
    doc.addImage(footerBase64, 'PNG', 0, pageHeight - 90, footerWidth, footerHeight);
  }

  const totalPages = (doc as any).internal.getNumberOfPages();
  const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 40, pageHeight - 20, { align: 'right' });
};

const addSignatureSection = (doc: jsPDF, currentY: number, pageWidth: number, user: { firstName: string, lastName: string }, userRole: UserRole) => {
  const tableWidth = pageWidth - 40;
  const margin = 10;
  const leftX = 30;
  const signatureHeight = 110;

  // Role to Position mapping
  const roleToPosition: Record<string, string> = {
    'ADMIN': 'System Administrator',
    'SECRETARY': 'College Secretary',
    'LABTECH': 'Laboratory Technician',
    'DEAN': 'College Dean'
  };

  const fullName = `${user.firstName} ${user.lastName}`;
  const position = roleToPosition[userRole] || 'Staff';
  const dateStr = format(new Date(), 'MMM d, yyyy h:mm a');

  // Draw border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(20, currentY, tableWidth, signatureHeight);

  // Dividers
  doc.line(20 + margin, currentY + 35, 20 + tableWidth - margin, currentY + 35);
  doc.line(20 + margin, currentY + 63, 20 + tableWidth - margin, currentY + 63);
  doc.line(20 + margin, currentY + 90, 20 + tableWidth - margin, currentY + 90);

  // Content
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Prepared by:', leftX, currentY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // Center alignment helpers
  const textX = pageWidth / 2;

  doc.text(fullName, textX, currentY + 30, { align: 'center' });
  doc.text('Printed Name & Signature', textX, currentY + 45, { align: 'center' });

  doc.text(position, textX, currentY + 60, { align: 'center' });
  doc.text('Position/Office', textX, currentY + 73, { align: 'center' });

  doc.text(dateStr, textX, currentY + 87, { align: 'center' });
  doc.text('Date & Time', textX, currentY + 101, { align: 'center' });

  return currentY + signatureHeight;
};

export const generateDamagedItemsPDF = async (
  items: DamagedItemRow[],
  options: {
    title?: string
    user: { firstName: string, lastName: string }
    userRole: UserRole
  }
): Promise<jsPDF> => {
  const { title = 'DAMAGED ITEMS REPORT', user, userRole } = options;

  const { headerBase64, footerBase64 } = await getHeaderFooterImages();

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const startY = 140;

  // Prepare table data
  const tableData = items.map(item => [
    formatCurrency(item.unitCost),
    item.quantity.toString(),
    `${item.itemName}${item.description ? '\n' + item.description : ''}${item.serialNumber ? '\nSN#: ' + item.serialNumber : ''}`,
    item.inventoryNumber,
    item.lastBorrowRecord
      ? `${item.lastBorrowRecord.borrowerName}\nRet: ${formatDate(item.lastBorrowRecord.returnDate)}\nRm: ${item.lastBorrowRecord.roomName || 'N/A'}`
      : 'No Record'
  ]);

  autoTable(doc, {
    head: [['Unit Cost', 'Qty', 'Description', 'Inventory No.', 'Previous Borrower']],
    body: tableData,
    startY: startY,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 5,
      valign: 'middle',
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 70 }, // Unit Cost
      1: { cellWidth: 35, halign: 'center' }, // Qty
      2: { cellWidth: 'auto' }, // Description (Flexible)
      3: { cellWidth: 100 }, // Inventory No.
      4: { cellWidth: 120 }  // Previous Borrower
    },
    margin: { top: 130, bottom: 100, left: 20, right: 20 },
    didDrawPage: (data) => {
      addHeader(doc, headerBase64, pageWidth);
      addFooter(doc, footerBase64, pageWidth, pageHeight);

      // Title on first page
      if (data.pageNumber === 1) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(title, pageWidth / 2, 130, { align: 'center' });
      }
    }
  });

  // Signature Section
  const finalY = (doc as any).lastAutoTable.finalY || startY;
  const signatureHeight = 110;
  const pageBottom = pageHeight - 100; // Leave space for footer

  if (finalY + signatureHeight + 20 > pageBottom) {
    doc.addPage();
    addHeader(doc, headerBase64, pageWidth);
    addFooter(doc, footerBase64, pageWidth, pageHeight);
    addSignatureSection(doc, 130, pageWidth, user, userRole);
  } else {
    addSignatureSection(doc, finalY + 20, pageWidth, user, userRole);
  }

  return doc;
};

export const printAllDamagedItems = async (items: DamagedItemRow[], options: any) => {
  const doc = await generateDamagedItemsPDF(items, options);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};

export const printSelectedDamagedItems = async (items: DamagedItemRow[], selectedIds: number[], options: any) => {
  const filteredItems = items.filter(i => selectedIds.includes(i.id));
  const doc = await generateDamagedItemsPDF(filteredItems, options);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};

export const downloadDamagedItemsPDF = async (items: DamagedItemRow[], options: any) => {
  const doc = await generateDamagedItemsPDF(items, options);
  doc.save(`damaged-items-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
