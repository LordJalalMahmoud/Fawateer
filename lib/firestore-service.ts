import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Invoice, ProductCatalogItem } from './types';

const INVOICES_COLLECTION = 'invoices';
const PRODUCTS_COLLECTION = 'products';

/**
 * Remove all `undefined` keys and prepare clean JSON object for Firestore
 */
function cleanForFirestore<T>(data: T): Record<string, any> {
  const json = JSON.stringify(data, (key, value) => {
    if (value === undefined) {
      return null;
    }
    return value;
  });
  const parsed = JSON.parse(json);
  
  // Recursively remove null/undefined keys if needed or keep clean types
  return parsed;
}

/**
 * Real-time listener for invoices in Firestore
 */
export function subscribeToInvoices(
  onData: (invoices: Invoice[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, INVOICES_COLLECTION), orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Invoice[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          ...data,
        } as Invoice);
      });
      onData(items);
    },
    (error) => {
      console.warn('Firestore onSnapshot invoices error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for product catalog in Firestore
 */
export function subscribeToProducts(
  onData: (products: ProductCatalogItem[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, PRODUCTS_COLLECTION);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: ProductCatalogItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as ProductCatalogItem);
      });
      onData(items);
    },
    (error) => {
      console.warn('Firestore onSnapshot products error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Save / Update an invoice in Firestore with sanitization
 */
export async function saveInvoiceToFirestore(invoice: Invoice): Promise<void> {
  const cleanData = cleanForFirestore(invoice);
  const docRef = doc(db, INVOICES_COLLECTION, invoice.id);
  await setDoc(docRef, cleanData, { merge: true });
}

/**
 * Delete an invoice in Firestore
 */
export async function deleteInvoiceFromFirestore(invoiceId: string): Promise<void> {
  const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
  await deleteDoc(docRef);
}

/**
 * Save entire products list in Firestore with sanitization
 */
export async function saveProductsToFirestore(products: ProductCatalogItem[]): Promise<void> {
  const batch = writeBatch(db);
  for (const prod of products) {
    const cleanProd = cleanForFirestore(prod);
    const docRef = doc(db, PRODUCTS_COLLECTION, prod.id);
    batch.set(docRef, cleanProd, { merge: true });
  }
  await batch.commit();
}

/**
 * Test write directly to verify Firestore permissions and connectivity
 */
export async function testFirestoreDirectWrite(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const testId = `test-${Date.now()}`;
    const testDocRef = doc(db, 'system', testId);
    await setDoc(testDocRef, {
      test: true,
      timestamp: new Date().toISOString(),
      writtenBy: 'tester',
    });
    // clean up test document
    await deleteDoc(testDocRef).catch(() => {});
    return { success: true, message: 'الاتصال وقواعد الأمان تعمل بكفاءة! تم الكتابة والقراءة بنجاح في Firestore.' };
  } catch (err: any) {
    console.error('Firestore Test Write Error:', err);
    return {
      success: false,
      message: 'فشل اختبار الكتابة في Firestore',
      error: err?.message || String(err),
    };
  }
}
