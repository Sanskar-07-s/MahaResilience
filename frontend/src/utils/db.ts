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
    
    // Seed default emergency contacts
    const contacts = [
      { id: '1', title: 'State Disaster Management Control', number: '108' },
      { id: '2', title: 'Police Department Maharashtra', number: '100' },
      { id: '3', title: 'Fire and Safety Services', number: '101' },
      { id: '4', title: 'Women Safety Helpline', number: '1091' }
    ];
    for (const c of contacts) {
      await putData('emergency_contacts', c);
    }

    // Seed default shelters
    const shelters = [
      { id: '1', name: 'Bandra Reclamation Primary Shelter (Offline)', address: 'KC Road, Bandra West, Mumbai', capacity: 300, currentOccupancy: 120, contactNumber: '022-26510012', latitude: 19.052, longitude: 72.825, resourcesAvailable: ['Food', 'Water', 'Medical Aid'] },
      { id: '2', name: 'Dharavi Sports Complex Safe Zone (Offline)', address: 'Sion Road, Dharavi, Mumbai', capacity: 600, currentOccupancy: 85, contactNumber: '022-24018890', latitude: 19.038, longitude: 72.854, resourcesAvailable: ['Blankets', 'Sanitation', 'Power Outlets'] }
    ];
    for (const s of shelters) {
      await putData('shelters', s);
    }

    // Seed default hospitals
    const hospitals = [
      { id: '1', name: 'Lilavati Hospital & Research Center (Offline)', type: 'PRIVATE', contactNumber: '022-26751000', address: 'A-791, Bandra West, Mumbai', latitude: 19.051, longitude: 72.822, availableBeds: 24, hasEmergencyUnit: true },
      { id: '2', name: 'Bhabha Municipal General Hospital (Offline)', type: 'GOVERNMENT', contactNumber: '022-26422775', address: 'Waterfield Road, Bandra West, Mumbai', latitude: 19.059, longitude: 72.831, availableBeds: 12, hasEmergencyUnit: true }
    ];
    for (const h of hospitals) {
      await putData('hospitals', h);
    }

    // Seed guides
    const guides = [
      { id: '1', title: 'Earthquake Action Guide', body: 'DROP, COVER, and HOLD ON. Avoid windows, outer walls, and structures.' },
      { id: '2', title: 'Flood Prep Guide', body: 'Move to higher floor elevation levels. Disconnect electrical outlets, secure fresh drinking water.' }
    ];
    for (const g of guides) {
      await putData('guides', g);
    }
    
    console.log('[IndexedDB Engine] Seed databases updated.');
  } catch (err) {
    console.error('[IndexedDB Engine] Seeding error:', err);
  }
};
