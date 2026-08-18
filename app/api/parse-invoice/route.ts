import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { rawText } = await req.json();

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return NextResponse.json({ error: 'الرجاء إدخال نص الفاتورة' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'مفتاح Gemini غير معرف، سيتم استخدام المعالج المحلي' }, { status: 503 });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `أنت خبير محاسبي متخصص في تحليل واستخراج الفواتير والمسودات وسجلات المبيعات العربية غير المهيكلة (مثل فواتير محلات المنظفات ومبيعات الجملة والتجزئة).
حلل النص المدخل واستخرج قائمة الفواتير الموجودة فيه بدقة بالغة.

النص المطلوب تحليله:
"""
${rawText}
"""

ملاحظات مهمة للاستخراج:
1. استخرج اسم العميل / المحل / الشركة بدقة.
2. استخرج التاريخ بتنسيق YYYY-MM-DD (إذا ذكر التاريخ مثل 30-7 أو 1 8 فافترض سنة 2026).
3. استخرج بنود الفاتورة: اسم المنتج، الكمية (ك/كرتونة/عبوة)، سعر الوحدة، الإجمالي (الكمية × السعر).
4. استخرج المجموع الفرعي، الضريبة، الخصم، والإجمالي النهائي بدقة.
5. استخرج حالة السداد بدقة:
   - "PAID" إذا كتب خالص، تم التسديد، مسدد بالكامل.
   - "UNPAID" إذا كتب لم يتم السداد، لم يتم التحصيل، أجل.
   - "PARTIAL" إذا كتب تم تحصيل جزء أو دفعة معينة.
6. استخرج المبلغ المسدد (paidAmount) والمتبقي (remainingAmount).
7. استخرج العنوان ورقم الهاتف إن وجدا.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              customerName: { type: Type.STRING, description: 'اسم العميل أو المحل أو الشركة' },
              customerPhone: { type: Type.STRING, description: 'رقم هاتف العميل إن وجد' },
              customerAddress: { type: Type.STRING, description: 'عنوان العميل إن وجد' },
              date: { type: Type.STRING, description: 'تاريخ الفاتورة بتنسيق YYYY-MM-DD' },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: 'اسم الصنف أو المنتج' },
                    unit: { type: Type.STRING, description: 'وحدة القياس مثل كرتونة، لتر، قطعة' },
                    quantity: { type: Type.NUMBER, description: 'الكمية' },
                    unitPrice: { type: Type.NUMBER, description: 'سعر الوحدة' },
                    total: { type: Type.NUMBER, description: 'إجمالي البند (الكمية * سعر الوحدة)' },
                  },
                  required: ['name', 'quantity', 'unitPrice', 'total'],
                },
              },
              subtotal: { type: Type.NUMBER, description: 'المجموع قبل الضريبة والخصم' },
              taxAmount: { type: Type.NUMBER, description: 'مبلغ الضريبة إن وجد' },
              discount: { type: Type.NUMBER, description: 'مبلغ الخصم إن وجد' },
              totalAmount: { type: Type.NUMBER, description: 'الإجمالي النهائي للفاتورة' },
              paidAmount: { type: Type.NUMBER, description: 'المبلغ المدفوع أو المحصل' },
              remainingAmount: { type: Type.NUMBER, description: 'المبلغ المتبقي على العميل' },
              status: {
                type: Type.STRING,
                description: 'حالة السداد: PAID أو UNPAID أو PARTIAL',
              },
              notes: { type: Type.STRING, description: 'أي ملاحظات أو تفاصيل إضافية' },
            },
            required: ['customerName', 'date', 'items', 'totalAmount', 'status'],
          },
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '[]');
    return NextResponse.json({ invoices: parsedJson });
  } catch (error: unknown) {
    console.error('Gemini invoice parse error:', error);
    const msg = error instanceof Error ? error.message : 'فشل تحليل الفاتورة بالذكاء الاصطناعي';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
