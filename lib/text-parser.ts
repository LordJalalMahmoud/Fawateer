import { Invoice, InvoiceItem, PaymentStatus } from './types';

// Convert Arabic digits (١٢٣) to Latin digits (123)
export function normalizeArabicDigits(str: string): string {
  if (!str) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (w) => String(arabicDigits.indexOf(w)));
}

// Normalize date strings into YYYY-MM-DD
export function normalizeParsedDate(rawDateStr: string): string {
  const clean = normalizeArabicDigits(rawDateStr)
    .replace(/[تاريخ|بتاريخ|في|يوم|Date|date]/gi, '')
    .trim();

  const currentYear = new Date().getFullYear();

  // Pattern: 30-07-2026 or 2026-07-30 or 30/7/2026
  const fullMatch = clean.match(/(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,4})/);
  if (fullMatch) {
    let [, p1, p2, p3] = fullMatch;
    if (p1.length === 4) {
      // YYYY-MM-DD
      return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
    } else if (p3.length === 4) {
      // DD-MM-YYYY
      return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
    } else {
      return `2026-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
    }
  }

  // Pattern: 30-7 or 1 8 or 15 - 8
  const shortMatch = clean.match(/(\d{1,2})\s*[-/.\s]\s*(\d{1,2})/);
  if (shortMatch) {
    const [, day, month] = shortMatch;
    return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return new Date().toISOString().slice(0, 10);
}

export interface ParseResult {
  invoices: Partial<Invoice>[];
  errors: string[];
}

export function parseArabicInvoiceText(rawInput: string): Partial<Invoice>[] {
  if (!rawInput || !rawInput.trim()) return [];

  const text = normalizeArabicDigits(rawInput);
  
  // Split multiple invoices if separated by lines like ____ or ---- or =====
  const rawBlocks = text.split(/(?:_{3,}|-{3,}|={3,}|\*{3,})/g)
    .map(b => b.trim())
    .filter(b => b.length > 5);

  const parsedList: Partial<Invoice>[] = [];

  for (const block of rawBlocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let customerName = '';
    let customerAddress = '';
    let customerPhone = '';
    let invoiceDate = new Date().toISOString().slice(0, 10);
    const items: InvoiceItem[] = [];
    let explicitSubtotal = 0;
    let explicitTax = 0;
    let explicitDiscount = 0;
    let explicitTotal = 0;
    let explicitPaid: number | null = null;
    let paymentStatus: PaymentStatus = 'UNPAID';
    const notesArr: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match Customer Name: "اسم العميل: ..." or first line if it looks like a shop name
      if (/^(?:اسم العميل|العميل|الزبون|المحل|الشركة)\s*[:：]\s*(.+)$/i.test(line)) {
        customerName = line.replace(/^(?:اسم العميل|العميل|الزبون|المحل|الشركة)\s*[:：]\s*/i, '').trim();
        continue;
      }

      // Match Address: "العنوان: ..."
      if (/^(?:العنوان|عنوان|الموقع|مكان التسليم)\s*[:：]\s*(.+)$/i.test(line)) {
        customerAddress = line.replace(/^(?:العنوان|عنوان|الموقع|مكان التسليم)\s*[:：]\s*/i, '').trim();
        continue;
      }

      // Match Phone: "هاتف / تليفون / رقم ..."
      if (/(?:تليفون|هاتف|موبايل|فون)\s*[:：]?\s*([0-9\s+]{8,})/i.test(line)) {
        const phoneMatch = line.match(/([0-9\s+]{8,})/);
        if (phoneMatch) customerPhone = phoneMatch[1].trim();
        continue;
      }

      // Match Date: "تاريخ 30-7" or "بتاريخ 1 8" or "تاريخ 30-07-2026"
      if (/(?:تاريخ|بتاريخ|date)\b/i.test(line) || /^\d{1,2}[-/.]\d{1,2}(?:[-/.]\d{2,4})?$/.test(line)) {
        invoiceDate = normalizeParsedDate(line);
        continue;
      }

      // Match Total lines:
      // e.g. "إجمالي المبيعات: 3,810"
      if (/(?:إجمالي المبيعات|المبيعات|المجموع الفرعي|الصافي)\s*[:：]?\s*([0-9,.]+)/i.test(line)) {
        const m = line.match(/([0-9,.]+)/);
        if (m) explicitSubtotal = parseFloat(m[1].replace(/,/g, ''));
        continue;
      }

      // e.g. "الضريبة: 532.40"
      if (/(?:الضريبة|ضريبة|VAT)\s*[:：]?\s*([0-9,.]+)/i.test(line)) {
        const m = line.match(/([0-9,.]+)/);
        if (m) explicitTax = parseFloat(m[1].replace(/,/g, ''));
        continue;
      }

      // e.g. "الخصم: 0"
      if (/(?:الخصم|خصم|تخفيض)\s*[:：]?\s*([0-9,.]+)/i.test(line)) {
        const m = line.match(/([0-9,.]+)/);
        if (m) explicitDiscount = parseFloat(m[1].replace(/,/g, ''));
        continue;
      }

      // e.g. "توتال الفاتوره 3460" or "توتال 1560" or "اجمال 5670" or "إجمالي الفاتورة: 4,342.40"
      if (/(?:توتال|إجمالي الفاتورة|اجمال الفاتوره|اجمال|الإجمالي|الاجمالي)\s*(?:الفاتورة|الفاتوره)?\s*[:：]?\s*([0-9,.]+)/i.test(line)) {
        const m = line.match(/([0-9,.]+)/);
        if (m) explicitTotal = parseFloat(m[1].replace(/,/g, ''));
        continue;
      }

      // Match Payment / Settled status:
      // "تم تسديد الفاتوره 6390" or "تم تسديد الفاتورة" or "خالص الدفع" or "مدفوع" or "مسددة"
      if (/(?:تم تسديد|خالص الدفع|مسددة بالكامل|خالص|تم الدفع|مدفوعة بالكامل|تم السداد)/i.test(line)) {
        paymentStatus = 'PAID';
        const numMatch = line.match(/([0-9,.]+)/);
        if (numMatch) {
          explicitPaid = parseFloat(numMatch[1].replace(/,/g, ''));
        }
        notesArr.push(line);
        continue;
      }

      // "لم يتم السداد" or "لم يتم التحصيل" or "غير مسدد" or "أجل"
      if (/(?:لم يتم السداد|لم يتم التحصيل|غير مسدد|اجل|أجل|على الحساب)/i.test(line)) {
        paymentStatus = 'UNPAID';
        explicitPaid = 0;
        notesArr.push(line);
        continue;
      }

      // "تم تحصيل 8 الف من اصل الفاتوره" or "تحصيل 8000"
      if (/(?:تم تحصيل|تحصيل|دفعة|دفعه|مدفوع)\s*([0-9,.]+)?\s*(?:الف|ألف|الاف|آلاف)?/i.test(line)) {
        let amt = 0;
        const numMatch = line.match(/([0-9,.]+)/);
        if (numMatch) {
          amt = parseFloat(numMatch[1].replace(/,/g, ''));
          if (/(?:الف|ألف|الاف|آلاف)/i.test(line) && amt < 1000) {
            amt *= 1000;
          }
        }
        explicitPaid = amt;
        paymentStatus = 'PARTIAL';
        notesArr.push(line);
        continue;
      }

      // If line is the very first non-empty line and we don't have customerName, consider it customer name
      if (!customerName && i === 0 && !/\d/.test(line)) {
        customerName = line.trim();
        continue;
      } else if (!customerName && !/\d{3,}/.test(line) && !line.includes('تاريخ') && !line.includes('توتال')) {
        customerName = line.trim();
        continue;
      }

      // Now parse Item Lines:
      // Patterns:
      // 1) "جي سي المزيل الشامل 940 — 1 كرتونة"
      // 2) "ستريس مصري 720 1 كرتونه"
      // 3) "3 ك سيترس امريكي 840"
      // 4) "1ك سيترس امريكي 840"
      // 5) "25ك سيترس امريكي 800"
      // 6) "17 معطر جي 800"
      // 7) "2 سيترس امريكي 800ج"
      // 8) "1 سيترس امريكي 840"
      const parsedItem = parseInvoiceLineItem(line);
      if (parsedItem) {
        items.push(parsedItem);
      } else {
        // Collect extra info as notes
        if (line.length > 2) {
          notesArr.push(line);
        }
      }
    }

    // Calculations
    const calculatedSubtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const subtotal = explicitSubtotal > 0 ? explicitSubtotal : calculatedSubtotal;
    const tax = explicitTax;
    const discount = explicitDiscount;
    const totalAmount = explicitTotal > 0 ? explicitTotal : Number((subtotal + tax - discount).toFixed(2));
    
    let paidAmount = 0;
    if (paymentStatus === 'PAID') {
      paidAmount = explicitPaid !== null ? explicitPaid : totalAmount;
    } else if (paymentStatus === 'PARTIAL') {
      paidAmount = explicitPaid !== null ? explicitPaid : 0;
      if (paidAmount >= totalAmount) {
        paymentStatus = 'PAID';
      }
    } else {
      paidAmount = explicitPaid !== null ? explicitPaid : 0;
    }

    const remainingAmount = Number((totalAmount - paidAmount).toFixed(2));

    parsedList.push({
      customerName: customerName || 'عميل جديد',
      customerAddress: customerAddress || undefined,
      customerPhone: customerPhone || undefined,
      date: invoiceDate,
      items,
      subtotal,
      taxAmount: tax,
      discount,
      totalAmount,
      paidAmount,
      remainingAmount,
      status: paymentStatus,
      notes: notesArr.join(' | ') || undefined,
    });
  }

  return parsedList;
}

function parseInvoiceLineItem(line: string): InvoiceItem | null {
  const clean = line.replace(/[ج|جنيه|EGP|LE]/gi, '').trim();

  // Pattern A: "Product Name 940 — 1 كرتونة" or "Product Name 940 - 1 كرتونة"
  const patternA = clean.match(/^(.+?)\s+([0-9,.]+)\s*[-—–:]\s*([0-9,.]+)\s*(.+)?$/);
  if (patternA) {
    const name = patternA[1].trim();
    const price = parseFloat(patternA[2].replace(/,/g, ''));
    const qty = parseFloat(patternA[3].replace(/,/g, ''));
    const unit = (patternA[4] || 'كرتونة').trim();
    if (!isNaN(price) && !isNaN(qty) && qty > 0) {
      return {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        unit,
        quantity: qty,
        unitPrice: price,
        total: Number((qty * price).toFixed(2)),
      };
    }
  }

  // Pattern B: "3 ك سيترس امريكي 840" or "3 كرتونة سيترس 840" or "1ك سيترس امريكي 840" or "25ك سيترس امريكي 800"
  const patternB = clean.match(/^([0-9,.]+)\s*(ك|كرتونة|كرتونه|قطعة|قطعه|علبة|علبه|عبوة|لتر)?\s+(.+?)\s+([0-9,.]+)$/);
  if (patternB) {
    const qty = parseFloat(patternB[1].replace(/,/g, ''));
    const unitRaw = patternB[2] || 'كرتونة';
    const unit = (unitRaw === 'ك' || unitRaw === 'كرتونه') ? 'كرتونة' : unitRaw;
    const name = patternB[3].trim();
    const price = parseFloat(patternB[4].replace(/,/g, ''));
    if (!isNaN(price) && !isNaN(qty) && qty > 0) {
      return {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        unit,
        quantity: qty,
        unitPrice: price,
        total: Number((qty * price).toFixed(2)),
      };
    }
  }

  // Pattern C: "ستريس مصري 720 1 كرتونه" or "AQ معطر 540 1 كرتونه" or "جي سي منعم 3 لتر 620 1 كرتونه"
  const patternC = clean.match(/^(.+?)\s+([0-9,.]+)\s+([0-9,.]+)\s*(.+)?$/);
  if (patternC) {
    const name = patternC[1].trim();
    const price = parseFloat(patternC[2].replace(/,/g, ''));
    const qty = parseFloat(patternC[3].replace(/,/g, ''));
    const unit = (patternC[4] || 'كرتونة').trim();
    if (!isNaN(price) && !isNaN(qty) && qty > 0) {
      return {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        unit,
        quantity: qty,
        unitPrice: price,
        total: Number((qty * price).toFixed(2)),
      };
    }
  }

  // Pattern D: "17 معطر جي 800" or "1 جي مزيل 940" or "1 AQ 540"
  const patternD = clean.match(/^([0-9,.]+)\s+(.+?)\s+([0-9,.]+)$/);
  if (patternD) {
    const qty = parseFloat(patternD[1].replace(/,/g, ''));
    const name = patternD[2].trim();
    const price = parseFloat(patternD[3].replace(/,/g, ''));
    if (!isNaN(price) && !isNaN(qty) && qty > 0) {
      return {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        unit: 'كرتونة',
        quantity: qty,
        unitPrice: price,
        total: Number((qty * price).toFixed(2)),
      };
    }
  }

  return null;
}
