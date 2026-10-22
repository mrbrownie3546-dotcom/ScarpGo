// Track-link tokens: WhatsApp confirmation me jaane wala wo link jo kisi bhi
// device pe Track Status seedha khol deta hai - bina Booking ID/phone type kiye.
// Token 18 random bytes ka url-safe base64 hai (~144 bits, guess karna practically
// impossible). URL me sirf token hota hai, koi personal data nahi.

export const newTrackToken = (): string => {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// Current site origin pe deep link (kisi bhi deploy/domain pe sahi URL bane).
export const trackUrlForToken = (token: string): string =>
  `${window.location.origin}${window.location.pathname}?track=${token}`;

// URL se ?track= token nikalo (aur address bar saaf karne ka path wapas do).
export const consumeTrackTokenFromUrl = (): string | null => {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('track');
    if (!token || token.length < 20 || token.length > 40) return null;
    params.delete('track');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
    return token;
  } catch (e) {
    return null;
  }
};
