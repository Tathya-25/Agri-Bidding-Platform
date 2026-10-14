import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, WorkOrder, Bid, Role } from '../types';

// ========================
// Users
// ========================
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

export const createUserProfile = async (uid: string, email: string, role: Role): Promise<void> => {
  await setDoc(doc(db, 'users', uid), {
    uid,
    email,
    role,
    createdAt: Date.now(),
  });
};

// ========================
// Work Orders
// ========================
export const createWorkOrder = async (workOrder: Omit<WorkOrder, 'id' | 'createdAt' | 'status'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'work_orders'), {
    ...workOrder,
    status: 'open',
    createdAt: Date.now(),
  });
  return docRef.id;
};

export const subscribeToCustomerOrders = (customerId: string, callback: (orders: WorkOrder[]) => void) => {
  const q = query(
    collection(db, 'work_orders'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WorkOrder));
    callback(orders);
  });
};

export const subscribeToOpenOrders = (callback: (orders: WorkOrder[]) => void) => {
  const q = query(
    collection(db, 'work_orders'),
    where('status', '==', 'open'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WorkOrder));
    callback(orders);
  });
};

// ========================
// Bids
// ========================
export const createBid = async (bid: Omit<Bid, 'id' | 'createdAt' | 'status'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'bids'), {
    ...bid,
    status: 'pending',
    createdAt: Date.now(),
  });
  return docRef.id;
};

export const subscribeToWorkOrderBids = (workOrderId: string, callback: (bids: Bid[]) => void) => {
  const q = query(
    collection(db, 'bids'),
    where('workOrderId', '==', workOrderId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const bids = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Bid));
    callback(bids);
  });
};

export const acceptBidTransaction = async (workOrderId: string, winningBidId: string): Promise<void> => {
  await runTransaction(db, async (transaction) => {
    const bidsRef = collection(db, 'bids');
    const q = query(bidsRef, where('workOrderId', '==', workOrderId));
    const querySnapshot = await getDocs(q); // Inside a transaction, ideally we'd use transaction.get(query) but Firestore web sdk supports querying directly if we are careful or we just getDocs first. 
    // Actually, runTransaction with query is tricky in v10 web sdk. We should fetch docs, then update them in transaction.
    
    const workOrderRef = doc(db, 'work_orders', workOrderId);
    const workOrderSnap = await transaction.get(workOrderRef);

    if (!workOrderSnap.exists()) {
      throw new Error("Work order does not exist.");
    }
    
    // Process all bids
    querySnapshot.docs.forEach((bidDoc) => {
      const bidRef = doc(db, 'bids', bidDoc.id);
      if (bidDoc.id === winningBidId) {
        transaction.update(bidRef, { status: 'accepted' });
      } else {
        transaction.update(bidRef, { status: 'rejected' });
      }
    });

    // Update work order
    transaction.update(workOrderRef, {
      status: 'assigned',
      assignedBidId: winningBidId
    });
  });
};

// ========================
// Mock Seeding
// ========================
export const checkAndSeedDatabase = async () => {
  const snapshot = await getDocs(query(collection(db, 'work_orders'), where('status', '==', 'open')));
  if (snapshot.empty) {
    console.log("Seeding database with mock work orders...");
    const mockOrders = [
      { customerId: 'mock-cust-1', location: 'Punjab, Ludhiana', area: 15.5, cropType: 'Wheat', stage: 'Harvesting', status: 'open', createdAt: Date.now() - 100000 },
      { customerId: 'mock-cust-2', location: 'Maharashtra, Nashik', area: 8.2, cropType: 'Sugarcane', stage: 'Pre-planting', status: 'open', createdAt: Date.now() - 50000 },
      { customerId: 'mock-cust-3', location: 'Gujarat, Surat', area: 40.0, cropType: 'Cotton', stage: 'Vegetative', status: 'open', createdAt: Date.now() - 10000 },
    ];
    for (const order of mockOrders) {
      await addDoc(collection(db, 'work_orders'), order);
    }
    console.log("Seeding complete.");
  }
};
