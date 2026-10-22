// Is device ki bookings ka local record (localStorage only, kahin upload nahi hota).
// Booking confirm hote hi {id, phone, token} yaha save hota hai taaki Track Status
// me bina type kiye status dikhe. "Not you? Clear" se poori list saaf ho jati hai.
// Kisi aur ka data kabhi nahi aata - sirf jo is device pe book/track kiya gaya.

export interface MyBooking {
  id: string;          // booking_number, e.g. SH-XXXXXXXX
  phone?: string;      // customer ka diya hua phone (sirf is device pe rehta hai)
  token?: string;      // unguessable track-link token (track_links doc id)
  savedAt: string;     // ISO time
}

const KEY = 'scrapgo_my_bookings';
const LEGACY_KEY = 'scrapgo_tracked_booking'; // purana single-booking key
const MAX_ENTRIES = 10;

const normalizeId = (id: string): string => id.trim().toUpperCase().replace(/\s/g, '');

const readRaw = (): MyBooking[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((e) => e && typeof e.id === 'string' && e.id.length >= 4);
      }
    }
    // Purana format migrate karo: { id, phone } single object
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const { id, phone } = JSON.parse(legacy);
      if (id && phone) {
        const migrated: MyBooking = { id: normalizeId(String(id)), phone: String(phone), savedAt: new Date().toISOString() };
        localStorage.setItem(KEY, JSON.stringify([migrated]));
        localStorage.removeItem(LEGACY_KEY);
        return [migrated];
      }
    }
  } catch (e) { /* corrupt storage -> khali list */ }
  return [];
};

export function getMyBookings(): MyBooking[] {
  return readRaw();
}

// Nayi booking sabse upar; same id pe phone/token merge ho jate hain.
export function saveMyBooking(entry: { id: string; phone?: string; token?: string }): void {
  try {
    const id = normalizeId(entry.id || '');
    if (id.length < 4) return;
    const list = readRaw().filter((b) => b.id !== id);
    const prev = readRaw().find((b) => b.id === id);
    const merged: MyBooking = {
      id,
      phone: entry.phone || prev?.phone,
      token: entry.token || prev?.token,
      savedAt: new Date().toISOString(),
    };
    list.unshift(merged);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
  } catch (e) { /* storage full/blocked -> silently skip */ }
}

export function clearMyBookings(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch (e) { /* ignore */ }
}
