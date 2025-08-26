import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
export const formatCurrency = (value) => {
  if (!value) return '';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'PHP' });
}

// Function to convert image to base64
const imageToBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = this.width;
      canvas.height = this.height;
      ctx.drawImage(this, 0, 0);
      
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        console.error('Error converting image to base64:', error);
        resolve('');
      }
    };
    
    img.onerror = function() {
      console.error('Error loading image:', url);
      resolve('');
    };
    
    img.src = url;
  });
};

const getHeaderFooterImages = async () => {
  const headerUrl = `${window.location.origin}/images/header.png`;
  const footerUrl = `${window.location.origin}/images/footer.png`;
  
  const [headerBase64, footerBase64] = await Promise.all([
    imageToBase64(headerUrl),
    imageToBase64(footerUrl)
  ]);
  
  return { headerBase64, footerBase64 };
};

const addHeader = (doc, headerBase64, pageWidth) => {
  if (headerBase64) {
    const headerHeight = 120; // Adjust as needed
    const headerWidth = pageWidth - 0; // Leave 20px margin on each side
    
    doc.addImage(
      headerBase64, 
      'PNG', 
      0, // x position
      0, // y position
      headerWidth, 
      headerHeight
    );
  } else {
    // Fallback text header - using Helvetica instead of Times
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('MINDANAO STATE UNIVERSITY AT MARAWI', pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(12);
    doc.text('DAMAGED ITEMS REPORT', pageWidth / 2, 35, { align: 'center' });
  }
};

// Add footer to PDF page
const addFooter = (doc, footerBase64, pageWidth, pageHeight, pageNum, totalPages) => {
  if (footerBase64) {
    const footerHeight = 70;
    const footerWidth = pageWidth - 0;
    
    doc.addImage(
      footerBase64, 
      'PNG', 
      0, 
      pageHeight - 90, 
      footerWidth, 
      footerHeight
    );
  }
  
  // Add page number - using Helvetica
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  // doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 30, pageHeight - 10, { align: 'right' });
};

const addSignatureSection = (doc, currentY, pageWidth, user, userType) => {
  const signatureY = currentY;
  const currentDate = formatDate(new Date());
  const timeNow = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  });

  const fullName = user && user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : 'Unknown User';

  const position = 
    userType === 'Secretary' 
      ? 'College Secretary' 
      : userType === 'Dean' 
        ? 'College Dean' 
        : 'Unknown Position';

  // Table setup
  const tableWidth = pageWidth - 40;
  const margin = 10;
  const leftX = 30

  // Draw main border (single big box for Prepared by)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(20, signatureY, tableWidth, 109);

  // Horizontal dividers inside
  doc.line(20 + margin, signatureY + 35, 20 + tableWidth - margin, signatureY + 35); // After header
  doc.line(20 + margin, signatureY + 63, 20 + tableWidth - margin, signatureY + 63); // After name
  doc.line(20 + margin, signatureY + 93, 20 + tableWidth - margin, signatureY + 93); // After position

  // Prepared by title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const preparedByWidth = doc.getTextWidth('Prepared by:');
  doc.text('Prepared by:', leftX, signatureY + 15);

  // Content fields
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const fullNameWidth = doc.getTextWidth(fullName);
  doc.text(fullName, (pageWidth - fullNameWidth) / 2, signatureY + 30);

  const nameSignatureWidth = doc.getTextWidth('Printed Name & Signature');
  doc.text('Printed Name & Signature', (pageWidth - nameSignatureWidth) / 2, signatureY + 45);

  const positionWidth = doc.getTextWidth(position);
  doc.text(position, (pageWidth - positionWidth) / 2, signatureY + 60);

  const positionOfficeWidth = doc.getTextWidth('Position/Office');
  doc.text('Position/Office', (pageWidth - positionOfficeWidth) / 2, signatureY + 73);

  const dateTimeString = `${currentDate} ${timeNow}`;
  const dateTimeWidth = doc.getTextWidth(dateTimeString);
  doc.text(dateTimeString, (pageWidth - dateTimeWidth) / 2, signatureY + 89);

  const dateLabelWidth = doc.getTextWidth('Date');
  doc.text('Date', (pageWidth - dateLabelWidth) / 2, signatureY + 103);

  return signatureY + 109;
};


export const generateDamagedItemsPDF = async (items, options = {}) => {
  const {
    headers = ['Unit Cost', 'Qty', 'Description', 'Inventory No.', 'Previous Borrower'],
    title = 'INVENTORY REPORT',
    orientation = 'portrait',
    rowsPerPage = 5,
    user = null,
    userType = null
  } = options;

  try {
    if (user && (user.first_name || user.last_name) && user.user_type) {
      console.log('Prepared by user:', user);
    }
    

    // Get header and footer images
    const { headerBase64, footerBase64 } = await getHeaderFooterImages();

    // Create new PDF document
    const doc = new jsPDF({
      orientation: orientation,
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    let currentY = 130; // Start position after header

    const pesoSign = 'P ';
    
    // Prepare table data - FIXED: Ensure exactly 5 columns
    const tableData = items.map(item => {
      const row = [
        `${pesoSign}${Number(item.unit_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
        (item.quantity || 0).toString(),
        `${item.item?.name || 'N/A'}\n${item.item?.description || ''}\nSN#: ${item.serial_number || 'None'}`,
        item.inventory_number || 'N/A',
        `${item.purchase_date ? formatDate(item.purchase_date) : 'None'}`
      ];
      
      // Ensure exactly 5 columns - no more, no less
      return row.slice(0, 5);
    });

    // FIXED: Calculate column widths to match signature table width
    const tableMargin = 20; // Same margin as signature table
    const availableWidth = pageWidth - (tableMargin * 2); // Full width minus margins
    
    // Distribute columns to use full available width (should match signature table)
    const columnWidths = {
      0: 80,   // Unit Cost 
      1: 50,   // Quantity 
      2: 280,  // Description - largest column
      3: 120,  // Inventory No 
      4: 150   // Previous Borrower 
    };
    
    // Verify total width matches signature table width
    const totalWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0);
    console.log(`Table width: ${totalWidth}, Signature table width: ${availableWidth}`);

    // Calculate row height baseline for consistent layout
    const signatureTableHeight = 50;

    // Helper: render a single page chunk
    const renderChunk = (chunkRows, isFirstPage) => {
      const rowsInThisPage = Math.max(1, chunkRows.length);
      const fixedRowHeight = signatureTableHeight / Math.min(rowsPerPage, rowsInThisPage);

      autoTable(doc, {
        head: [headers],
        body: chunkRows,
        startY: isFirstPage ? (currentY + 50) : 130 + 50,
        styles: {
          fontSize: 8,
          cellPadding: { top: 8, right: 4, bottom: 8, left: 4 },
          lineHeight: 1.4,   // increase
          minCellHeight: 18,
          valign: 'middle',
          lineColor: [68, 68, 68],
          lineWidth: 0.5,
          minCellHeight: 18,
          halign: 'center',
          font: 'helvetica',
          fontStyle: 'normal',
        },
        headStyles: {
          fillColor: [248, 249, 250],
          textColor: [73, 80, 87],
          fontStyle: 'bold',
          fontSize: 9,
          minCellHeight: 25,
          halign: 'center',
          font: 'helvetica',
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 80, halign: 'left', cellPadding: 6 },
          1: { cellWidth: 50, halign: 'center' },
          2: { cellWidth: 230, halign: 'left', valign: 'top', minCellHeight: 22 },
          3: { cellWidth: 110, halign: 'center' },
          4: { cellWidth: 85, halign: 'center' }
        },
        margin: { 
          left: 20,
          right: 20,
          top: 10,
          bottom: 10
        },
        tableLineWidth: 0.5,
        tableLineColor: [68, 68, 68],
        theme: 'grid',
        didDrawPage: function(data) {
          // Add header to each page
          addHeader(doc, headerBase64, pageWidth);
          // Add title only on the first page of the document
          if (data.pageNumber === 1) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text(title, pageWidth / 2, currentY + 15, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
          }
          // Add footer to each page
          const totalPagesNow = doc.internal.getNumberOfPages();
          addFooter(doc, footerBase64, pageWidth, pageHeight, data.pageNumber, totalPagesNow);

          // Add signature section on every page at a fixed position above footer
          const footerHeight = 90;
          const signatureHeight = 109;
          const margin = 20;
          const signatureStartY = pageHeight - footerHeight - signatureHeight - margin;
          addSignatureSection(doc, signatureStartY, pageWidth, user, userType);
        }
      });
    };

    for (let i = 0; i < tableData.length; i += rowsPerPage) {
      const chunk = tableData.slice(i, i + rowsPerPage);
      if (i > 0) {
        doc.addPage();
      }
      renderChunk(chunk, i === 0);
    }

    return doc;

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};

// Print function (compatible with your existing code)
export const printItemInstances = async (items, options = {}) => {
  const { 
    headers = ['Unit Cost', 'Qty', 'Description', 'Inventory No.', 'Previous Borrower'],
    filename = `damaged-items-report-${formatDate(new Date()).replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
    download = false,
    onBeforePrint = null,
    onAfterPrint = null,
    user = null,
    userType = null
  } = options;

  if (!items || items.length === 0) {
    console.warn('No damaged items provided for printing');
    return;
  }

  try {
    // Execute before print callback
    if (onBeforePrint && typeof onBeforePrint === 'function') {
      onBeforePrint();
    }

    const doc = await generateDamagedItemsPDF(items, { headers, user, userType });
    
    if (download) {
      doc.save(filename);
    } else {
      // Open print dialog
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    }

    // Execute after print callback
    if (onAfterPrint && typeof onAfterPrint === 'function') {
      onAfterPrint();
    }

  } catch (error) {
    console.error('Error printing damaged items:', error);
  }
};

// Print all items function
export const printAllInstances = async (allItems, options = {}) => {
  await printItemInstances(allItems, options);
};

// Print selected items function
export const printSelectedInstances = async (allItems, selectedIds, options = {}) => {
  const selectedItems = allItems.filter(item => selectedIds.includes(item.id));
  await printItemInstances(selectedItems, options);
};

// Preview function
export const previewDamagedItemsReport = async (items, options = {}) => {
  const { 
    headers = ['Unit Cost', 'Qty', 'Description', 'Inventory No.', 'Purchase Date'],
    filename = 'inventory-preview.pdf'

  } = options;

  if (!items || items.length === 0) {
    console.warn('No damaged items provided for preview');
    return;
  }

  try {
    const doc = await generateDamagedItemsPDF(items, { headers });
    
    // Open in new tab for preview
    const pdfUrl = doc.output('bloburl');
    const previewWindow = window.open(pdfUrl, '_blank');
    
    if (!previewWindow) {
      console.error('Failed to open preview window. Popup might be blocked.');
      // Fallback: download the file
      doc.save(filename);
    }

  } catch (error) {
    console.error('Error generating preview:', error);
  }
};

export default {
  generateDamagedItemsPDF,
  printItemInstances,
  printAllInstances,
  printSelectedInstances,
  previewDamagedItemsReport,
  formatDate
};