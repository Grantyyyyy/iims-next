import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Utility function to format date
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

// Add header to PDF page
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
    title = 'DAMAGED ITEMS REPORT',
    orientation = 'portrait',
    user = null,
    userType = null
  } = options;

  try {
    if (user && (user.first_name || user.last_name) && user.user_type) {
      console.log('Prepared by user:', user);
    }

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
        `${item.last_borrow_record?.borrower || 'N/A'}\nReturn: ${formatDate(item.last_borrow_record?.return_date) || 'N/A'}\nRoom: ${item.last_borrow_record?.room || 'N/A'}`
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

    // Calculate row height to match signature table height (140pt)
    const signatureTableHeight = 50;
    const numberOfRows = Math.max(1, items.length);
    const fixedRowHeight = signatureTableHeight / numberOfRows;

    // Generate PDF with autoTable - using Helvetica fonts
    autoTable(doc, {
      head: [headers], // Use exact headers provided
      body: tableData, // Use prepared data with exactly 5 columns
      startY: currentY + 50,
      styles: {
        fontSize: 8,
        cellPadding: 4,
        valign: 'middle',
        lineColor: [68, 68, 68],
        lineWidth: 0.5,
        minCellHeight: fixedRowHeight,
        halign: 'center',
        font: 'helvetica', // Changed from 'times' to 'helvetica'
        fontStyle: 'normal',
      },
      headStyles: {
        fillColor: [248, 249, 250],
        textColor: [73, 80, 87],
        fontStyle: 'bold',
        fontSize: 9,
        minCellHeight: 25,
        halign: 'center',
        font: 'helvetica', // Changed from 'times' to 'helvetica'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { cellWidth: 80, halign: 'left', cellPadding: 6 }, // Unit Cost - wider and left aligned for PHP text
        1: { cellWidth: 45, halign: 'center' }, // Quantity  
        2: { cellWidth: 250, halign: 'left', valign: 'top' }, // Description - largest column
        3: { cellWidth: 95, halign: 'center' }, // Inventory No
        4: { cellWidth: 85, halign: 'left', valign: 'top' } // Previous Borrower
      },
      // CENTER THE TABLE on the page with margins
      margin: { 
        left: 20, // Standard left margin
        right: 20, // Standard right margin
        top: 10,
        bottom: 10
      },
      tableLineWidth: 0.5,
      tableLineColor: [68, 68, 68],
      theme: 'grid',
      didDrawPage: function(data) {
        // Add header to each page
        addHeader(doc, headerBase64, pageWidth);
        
        // Add title and summary on first page only
        if (data.pageNumber === 1) {
          doc.setFont('helvetica', 'bold'); // Changed from 'times' to 'helvetica'
          doc.setFontSize(16);
          doc.text(title, pageWidth / 2, currentY + 15, { align: 'center' });
          
          // Report summary
          doc.setFont('helvetica', 'normal'); // Changed from 'times' to 'helvetica'
          doc.setFontSize(10);
          const summaryY = currentY + 35;
        }
        
        // Add footer to each page
        const totalPages = doc.internal.getNumberOfPages();
        addFooter(doc, footerBase64, pageWidth, pageHeight, data.pageNumber, totalPages);
      }
    });

    const SIGNATURE_FROM_BOTTOM = 90; // Distance from bottom of page
    const fixedSignatureY = pageHeight - SIGNATURE_FROM_BOTTOM;

    const finalY = doc.lastAutoTable.finalY || currentY + 100;
    const signatureStartY = fixedSignatureY - 109

    if (finalY + 20 > signatureStartY) {
      // Table extends too far down, create new page for signature
      doc.addPage();
      addHeader(doc, headerBase64, pageWidth);
      addSignatureSection(doc, 130, pageWidth); // Start below header
      const newTotalPages = doc.internal.getNumberOfPages();
      addFooter(doc, footerBase64, pageWidth, pageHeight, newTotalPages, newTotalPages);
    } else {
      // Signature fits on current page at fixed position
      addSignatureSection(doc, signatureStartY, pageWidth, user, userType);
    }

    return doc;

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};

// Print function (compatible with your existing code)
export const printDamagedItems = async (items, options = {}) => {
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
export const printAllDamagedItems = async (allItems, options = {}) => {
  await printDamagedItems(allItems, options);
};

// Print selected items function
export const printSelectedDamagedItems = async (allItems, selectedIds, options = {}) => {
  const selectedItems = allItems.filter(item => selectedIds.includes(item.id));
  await printDamagedItems(selectedItems, options);
};

// Preview function
export const previewDamagedItemsReport = async (items, options = {}) => {
  const { 
    headers = ['Unit Cost', 'Qty', 'Description', 'Inventory No.', 'Previous Borrower'],
    filename = 'damaged-items-preview.pdf'
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
  printDamagedItems,
  printAllDamagedItems,
  printSelectedDamagedItems,
  previewDamagedItemsReport,
  formatDate
};