import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Invoice, ProductCatalogItem } from './types';

const INVOICES_COLLECTION = 'invoices';
const PRODUCTS_COLLECTION = 'products';

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
        items.push({ id: docSnap.id, ...docSnap.data() } as Invoice);
      });
      onData(items);
    },
    (error) => {
      console.warn('Firestore onSnapshot invoices error, falling back:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, INVOICES_COLLECTION);
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
      handleFirestoreError(error, OperationType.LIST, PRODUCTS_COLLECTION);
    }
  );
}

/**
 * Save / Update an invoice in Firestore
 */
export async function saveInvoiceToFirestore(invoice: Invoice): Promise<void> {
  const path = `${INVOICES_COLLECTION}/${invoice.id}`;
  try {
    const docRef = doc(db, INVOICES_COLLECTION, invoice.id);
    await setDoc(docRef, invoice, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete an invoice in Firestore
 */
export async function deleteInvoiceFromFirestore(invoiceId: string): Promise<void> {
  const path = `${INVOICES_COLLECTION}/${invoiceId}`;
  try {
    const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save entire products list in Firestore
 */
export async function saveProductsToFirestore(products: ProductCatalogItem[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const prod of products) {
      const docRef = doc(db, PRODUCTS_COLLECTION, prod.id);
      batch.set(docRef, prod, { merge: true });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PRODUCTS_COLLECTION);
  }
}
