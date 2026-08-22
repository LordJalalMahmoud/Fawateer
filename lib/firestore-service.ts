import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  writeBatch,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Invoice, ProductCatalogItem, ProductPricingTier, VaultSettings, CourierSettlement } from './types';
import { DEFAULT_PRICING_TIERS } from './pricing-data';

const INVOICES_COLLECTION = 'invoices';
const PRODUCTS_COLLECTION = 'products';
const COURIER_COLLECTION = 'courier_settlements';
const SETTINGS_COLLECTION = 'settings';
const PRICING_TIERS_DOC = 'pricing_tiers';
const VAULT_SETTINGS_DOC = 'vault_permissions';

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
 * Real-time listener for Pricing Tiers (Factory and Company Prices) in Firestore
 */
export function subscribeToPricingTiers(
  onData: (tiers: ProductPricingTier[]) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, SETTINGS_COLLECTION, PRICING_TIERS_DOC);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.tiers)) {
          onData(data.tiers);
          return;
        }
      }
      // If not yet created in Firestore, trigger with default
      onData(DEFAULT_PRICING_TIERS);
    },
    (error) => {
      console.warn('Firestore pricing tiers error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Save Pricing Tiers to Firestore
 */
export async function savePricingTiersToFirestore(tiers: ProductPricingTier[]): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, PRICING_TIERS_DOC);
  const cleanData = cleanForFirestore({
    tiers,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(docRef, cleanData, { merge: true });
}

/**
 * Real-time listener for Vault Permissions Settings in Firestore
 */
export function subscribeToVaultSettings(
  onData: (settings: VaultSettings) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, SETTINGS_COLLECTION, VAULT_SETTINGS_DOC);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data) {
          onData({
            authorizedEmails: data.authorizedEmails || ['jalalmahmoud8000@gmail.com'],
            securityPin: data.securityPin || '',
            updatedAt: data.updatedAt,
          });
          return;
        }
      }
      onData({
        authorizedEmails: ['jalalmahmoud8000@gmail.com'],
        securityPin: '',
      });
    },
    (error) => {
      console.warn('Firestore vault settings error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Save Vault Settings to Firestore
 */
export async function saveVaultSettingsToFirestore(settings: VaultSettings): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, VAULT_SETTINGS_DOC);
  const cleanData = cleanForFirestore({
    ...settings,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(docRef, cleanData, { merge: true });
}

/**
 * Real-time listener for Courier / Retail Settlements in Firestore
 */
export function subscribeToCourierSettlements(
  onData: (settlements: CourierSettlement[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, COURIER_COLLECTION), orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: CourierSettlement[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          ...data,
        } as CourierSettlement);
      });
      onData(items);
    },
    (error) => {
      console.warn('Firestore onSnapshot courier_settlements error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Save / Update a Courier Settlement in Firestore
 */
export async function saveCourierSettlementToFirestore(settlement: CourierSettlement): Promise<void> {
  const cleanData = cleanForFirestore(settlement);
  const docRef = doc(db, COURIER_COLLECTION, settlement.id);
  await setDoc(docRef, cleanData, { merge: true });
}

/**
 * Delete a Courier Settlement in Firestore
 */
export async function deleteCourierSettlementFromFirestore(settlementId: string): Promise<void> {
  const docRef = doc(db, COURIER_COLLECTION, settlementId);
  await deleteDoc(docRef);
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
