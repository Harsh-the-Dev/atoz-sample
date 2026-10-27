import test from 'node:test';
import assert from 'node:assert/strict';
import { whatsappUrl, bookingMessage, localDate } from '../atoz-studio/booking.js';

test('a missing or malformed business number never routes to an unintended chat', () => {
  for (const number of ['', null, undefined, '00012345678', '++1234567890', '12+34567890', '12345', 'https://example.com', '12345678&text=other', '1234567890123456']) {
    assert.equal(whatsappUrl(number, 'Hello'), null);
  }
});
test('WhatsApp links preserve international formatting and safely encode message contents', () => {
  const message = 'Hi! A gift for José & Asha?\nBudget: ₹1,500 🎁';
  const url = new URL(whatsappUrl('+1 (202) 555-0123', message));
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/12025550123');
  assert.equal(url.searchParams.get('text'), message);
  assert.equal([...url.searchParams].length, 1);
});
test('booking summaries include chosen details and preserve personal notes', () => {
  const text = bookingMessage({ brand: 'Dearly', name: ' Asha ', occasion: 'Birthday', quantity: '2', date: '2027-01-20', budget: '₹1,000 – ₹2,500', city: ' Pune ', details: ' Blue ribbons, please. ', gifts: [{ name: 'A Little Love Mug', qty: 2, price: '₹649', recipient: 'Sam', note: 'You mean the world.', ribbon: 'sage' }] });
  for (const part of ['Hello Dearly!', 'Name: Asha', 'Quantity: 2', '2027-01-20', 'Delivery city: Pune', 'Blue ribbons, please.', 'A Little Love Mug × 2', 'For: Sam', 'You mean the world.', 'Ribbon: sage', 'sample price', 'Please confirm availability']) assert.ok(text.includes(part), part);
});
test('optional booking fields do not add empty lines or leak unselected gift notes', () => {
  const text = bookingMessage({ brand: 'Dearly', name: 'Sam', occasion: 'Just because', quantity: '1', gifts: [] });
  assert.ok(!text.includes('Preferred date:'));
  assert.ok(!text.includes('My gift shortlist:'));
  assert.ok(!text.includes('undefined'));
});
test('booking date follows the local calendar rather than UTC', () => {
  const date = new Date(2026, 0, 3, 0, 15);
  assert.equal(localDate(date), '2026-01-03');
});
