const DB_NAME = 'MahaResilienceCache';
const DB_VERSION = 1;

export const initDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      
      // Create Object Stores if they do not exist
      if (!db.objectStoreNames.contains('emergency_contacts')) {
        db.createObjectStore('emergency_contacts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('hospitals')) {
        db.createObjectStore('hospitals', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('shelters')) {
        db.createObjectStore('shelters', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('guides')) {
        db.createObjectStore('guides', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('alerts')) {
        db.createObjectStore('alerts', { keyPath: 'id' });
      }
    };
  });
};

export const putData = async (storeName: string, item: any): Promise<void> => {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getData = async (storeName: string, id: string): Promise<any> => {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllData = async (storeName: string): Promise<any[]> => {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const seedOfflineDatabase = async (): Promise<void> => {
  try {
    const db = await initDb();
    
    // Seed verified official government emergency numbers
    const contacts = [
      { id: '1', title: 'National Emergency Helpline', number: '112' },
      { id: '2', title: 'Ambulance & Medical Emergency', number: '108' },
      { id: '3', title: 'Police Department Maharashtra', number: '100' },
      { id: '4', title: 'Fire & Safety Services', number: '101' },
      { id: '5', title: 'Women & Child Helpline', number: '1091' },
      { id: '6', title: 'Disaster Management Helpline', number: '1070' }
    ];
    for (const c of contacts) {
      await putData('emergency_contacts', c);
    }

    // Seed verified disaster safety guides
    const guides = [
      { id: '1', title: 'Earthquake Action Guide', body: 'DROP, COVER, and HOLD ON. Stay away from glass windows, unanchored heavy furniture, and power lines.' },
      { id: '2', title: 'Monsoon Flood Prep Guide', body: 'Move to higher elevation. Disconnect electrical appliances, keep drinking water stored, and follow NDMA alerts.' },
      { id: '3', title: 'Heatwave Precaution Guide', body: 'Stay hydrated, stay indoors between 12 PM - 4 PM, wear lightweight cotton clothing, and carry ORS/water.' }
    ];
    for (const g of guides) {
      await putData('guides', g);
    }
    
    console.log('[IndexedDB Engine] Verified offline emergency data synchronized.');
  } catch (err) {
    console.error('[IndexedDB Engine] Initialization error:', err);
  }
};
