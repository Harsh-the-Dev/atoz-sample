export function whatsappUrl(number, message) {
  if (typeof number !== 'string') return null;
  // Official click-to-chat format: https://faq.whatsapp.com/5913398998672934
  if (!/^\+?[\d\s()-]+$/.test(number.trim())) return null;
  const clean = number.replace(/[\s()+-]/g, '');
  if (!/^[1-9]\d{7,14}$/.test(clean)) return null;
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function bookingMessage({ brand, name, occasion, date, quantity, budget, city, details, gifts = [] }) {
  const lines = [`Hello ${brand}! I'd like to enquire about a gift.`, '', `Name: ${name.trim()}`, `Occasion: ${occasion}`, `Quantity: ${quantity}`];
  if (date) lines.push(`Preferred date: ${date}`);
  if (budget) lines.push(`Budget: ${budget}`);
  if (city?.trim()) lines.push(`Delivery city: ${city.trim()}`);
  if (details?.trim()) lines.push('', `My idea: ${details.trim()}`);
  if (gifts.length) {
    lines.push('', 'My gift shortlist:');
    for (const gift of gifts) {
      lines.push(`• ${gift.name} × ${gift.qty}${gift.price ? ` — ${gift.price} each (sample price)` : ''}`);
      if (gift.recipient) lines.push(`  For: ${gift.recipient}`);
      if (gift.note) lines.push(`  Gift note: ${gift.note}`);
      if (gift.ribbon) lines.push(`  Ribbon: ${gift.ribbon}`);
    }
  }
  lines.push('', 'Please confirm availability, the final quote and the delivery timeline.');
  return lines.join('\n');
}
