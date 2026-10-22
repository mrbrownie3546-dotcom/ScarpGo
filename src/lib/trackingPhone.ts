// Public tracking doc me customer ka phone KABHI plain nahi jata.
// Sirf SHA-256 hash: normalized phone digits + booking number.
// Track Status wahi hash dobara bana ke compare karta hai.

// Poora India-normalized: sirf digits, aakhri 10 (bina +91/0).
export const normalizePhoneDigits = (p: string): string => p.replace(/\D/g, '').slice(-10);

// SHA-256 hex of "<phoneDigits>:<BOOKING-NUMBER>".
// Booking number isliye saath hai taaki ek hi phone ke hashes alag bookings
// me same na dikhen, aur koi hash ko doosri booking pe copy na kar sake.
export const phoneHashForBooking = async (phone: string, bookingNumber: string): Promise<string> => {
  const input = `${normalizePhoneDigits(phone)}:${bookingNumber.trim().toUpperCase().replace(/\s/g, '')}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};


// Spam-protection key: SHA-256 of sirf normalized phone digits (booking number
// ke bina). Ek phone ke liye hamesha same - cooldown aur block list isi par
// kaam karti hai. Reverse karna practically impossible.
export const phoneKeyFor = async (phone: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizePhoneDigits(phone)));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};
