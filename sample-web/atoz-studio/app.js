import { products, money, filterProducts, validateBag, bagTotal } from './catalog.js';
import { siteConfig } from './site-config.js';
import { whatsappUrl, bookingMessage, localDate } from './booking.js';

const paths = {
  chevron: '<path d="m7 10 5 5 5-5"/>',
  whatsapp: '<path d="M20.5 11.6a8.5 8.5 0 0 1-12.7 7.4L3 20.5l1.5-4.6A8.5 8.5 0 1 1 20.5 11.6Z"/><path d="M8 7.5c-.4-.5-1.2.3-1.1 1.2.4 3.5 3.1 6.1 6.5 6.6.9.1 1.8-.7 1.4-1.2l-1.6-1.2c-.4-.3-.8.5-1.1.6-1.6-.6-2.6-1.6-3.2-3.1.2-.4.9-.8.6-1.2L8 7.5Z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  bag: '<path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
  'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  'arrow-up-right': '<path d="M6 18 18 6M6 6h12v12"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  sparkle: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>',
  gift: '<path d="M3 8h18v4H3zM5 12v9h14v-9M12 8v13"/><path d="M12 8H7a3 3 0 1 1 3-3l2 3Zm0 0h5a3 3 0 1 0-3-3l-2 3Z"/>',
  flower: '<path d="M12 8c-7-9-13 2-5 4-8 3 0 13 5 4 5 9 13-1 5-4 8-2 2-13-5-4Z"/><circle cx="12" cy="12" r="2"/>',
  cake: '<path d="M4 12h16v9H4zM4 15q2 3 4 0 2 3 4 0 2 3 4 0 2 3 4 0M8 12V9m4 3V8m4 4V9M8 5v1m4-3v2m4 0v1"/>',
  pen: '<path d="m16 3 5 5L9 20l-6 1 1-6L16 3ZM13 6l5 5M4 15l5 5"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>'
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.sparkle}</svg>`;
function hydrateIcons(root = document) { root.querySelectorAll('[data-icon]').forEach(el => { el.outerHTML = icon(el.dataset.icon); }); }
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const imagePath = (name, size = '') => `/public/images/${name}${size ? `-${size}` : ''}.webp`;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let storageWorking = true;
function readStored(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
let bag = validateBag(readStored('dearly-bag-v1', []));
let saved = readStored('dearly-saved-v1', []);
saved = Array.isArray(saved) ? saved.filter(id => products.some(p => p.id === id)) : [];
let note = { name: '', message: '', ribbon: 'plum' };
let activeFilter = 'all';
let showAll = false;
let currentView = '';
let returnFocus = null;
let toastTimer;
const dialog = document.getElementById('app-dialog');
const content = document.getElementById('dialog-content');
const grid = document.getElementById('product-grid');

function persist() {
  try { localStorage.setItem('dearly-bag-v1', JSON.stringify(bag)); localStorage.setItem('dearly-saved-v1', JSON.stringify(saved)); }
  catch { if (storageWorking) toast('Your choices are available for this visit. Browser storage is unavailable.'); storageWorking = false; }
  syncBadges();
}
function syncBadges() {
  const count = bag.reduce((n, item) => n + item.qty, 0);
  document.querySelector('.bag-count').textContent = count;
  document.querySelector('.bag-button').setAttribute('aria-label', `Shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`);
  document.querySelector('.saved-dot').hidden = saved.length === 0;
  document.querySelector('.wishlist-button').setAttribute('aria-label', `View saved gifts, ${saved.length} saved`);
  document.querySelectorAll('[data-save]').forEach(button => {
    const isSaved = saved.includes(button.dataset.save);
    button.classList.toggle('is-saved', isSaved);
    button.setAttribute('aria-pressed', String(isSaved));
    const product = products.find(p => p.id === button.dataset.save);
    button.setAttribute('aria-label', `${isSaved ? 'Unsave' : 'Save'} ${product.name}`);
  });
}
function toast(message) { const el = document.getElementById('toast'); clearTimeout(toastTimer); el.textContent = message; el.classList.add('visible'); toastTimer = setTimeout(() => el.classList.remove('visible'), 3500); }
function renderProducts() {
  const matches = filterProducts({ occasion: activeFilter });
  const visible = showAll || activeFilter !== 'all' ? matches : matches.slice(0, 4);
  grid.innerHTML = visible.map(p => `<article class="product-card"><div class="product-image"><button class="product-open" data-product="${p.id}" aria-label="Explore ${p.name}"><img src="${imagePath(p.image,640)}" srcset="${imagePath(p.image,360)} 360w, ${imagePath(p.image,640)} 640w, ${imagePath(p.image)} ${p.image === 'hero' ? 1200 : 800}w" sizes="(max-width: 680px) 44vw, (max-width: 900px) 43vw, 22vw" alt="${p.name}" loading="lazy" decoding="async" width="800" height="800"/></button><span class="product-tag">${p.tag}</span><button class="product-save ${saved.includes(p.id) ? 'is-saved' : ''}" data-save="${p.id}" aria-pressed="${saved.includes(p.id)}" aria-label="Save ${p.name}">${icon('heart')}</button><button class="quick-add" data-add="${p.id}" aria-label="Add ${p.name} to bag">${icon('plus')}<span>Add</span></button></div><div class="product-info"><span class="product-category">${p.category}</span><button class="product-name" data-product="${p.id}">${p.name}</button><p class="product-price">${money(p.price)}</p></div></article>`).join('');
  document.getElementById('product-count').textContent = visible.length < matches.length ? `${visible.length} of ${matches.length} gifts` : `${visible.length} ${visible.length === 1 ? 'gift' : 'gifts'}`;
  document.getElementById('view-all').textContent = showAll ? 'Show fewer' : `Show all ${products.length} gifts`;
  document.querySelectorAll('[data-filter]').forEach(btn => { const active = btn.dataset.filter === activeFilter; btn.classList.toggle('active', active); btn.setAttribute('aria-pressed', String(active)); });
  syncBadges();
  revealElements(grid.querySelectorAll('.product-card'), 45);
}
function setFilter(filter, scroll = false) { activeFilter = filter; renderProducts(); if (scroll) document.getElementById('collection').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' }); }
function header(title, context = '') { return `<div class="dialog-head"><div><h2 id="dialog-title" tabindex="-1">${title}</h2>${context ? `<p class="dialog-context">${context}</p>` : ''}</div><button class="close-dialog" data-close aria-label="Close dialog">${icon('close')}</button></div>`; }
function openDialog(view, html, className = '', focusSelector = '') {
  const wasOpen = dialog.open;
  currentView = view;
  dialog.className = `app-dialog ${className}`;
  content.innerHTML = html;
  if (!wasOpen) { returnFocus = document.activeElement; dialog.showModal(); document.body.classList.add('modal-open'); }
  dialog.scrollTop = 0;
  const focusTarget = (focusSelector && content.querySelector(focusSelector)) || content.querySelector('#dialog-title');
  focusTarget?.focus({ preventScroll: true });
  if (!wasOpen) animateDialog(className.includes('drawer'));
  document.querySelector('.mobile-toggle').setAttribute('aria-expanded', String(view === 'menu')); 
}
function closeDialog() { dialog.close(); }
dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); document.querySelector('.mobile-toggle').setAttribute('aria-expanded', 'false'); currentView = ''; if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true }); });
dialog.addEventListener('click', event => { if (event.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(); });
function ribbonFields(selected = 'plum') {
  return `<div class="field"><span class="field-label" id="ribbon-label">A ribbon to finish it</span><div class="ribbon-options" role="group" aria-labelledby="ribbon-label">${[['plum', '#543243', 'Plum'], ['rose', '#bf858c', 'Rose'], ['sage', '#929b81', 'Sage']].map(([id, color, label]) => `<label class="ribbon-option"><input type="radio" name="ribbon" value="${id}" ${selected === id ? 'checked' : ''}/><span class="color-dot" style="--swatch:${color}"></span>${label}</label>`).join('')}</div></div>`;
}
function noteFields() { return `<div class="field"><label for="gift-name">Their name <span class="field-hint">(optional)</span></label><input id="gift-name" name="name" maxlength="40" autocomplete="off" placeholder="Your favorite person" value="${escape(note.name)}"/></div><div class="field"><label for="gift-message">Your little note <span class="field-hint">(up to 160 characters)</span></label><textarea id="gift-message" name="message" maxlength="160" placeholder="A little something to say...">${escape(note.message)}</textarea></div>${ribbonFields(note.ribbon)}`; }
function openProduct(id) {
  const p = products.find(item => item.id === id); if (!p) return;
  openDialog('product', `${header('Gift details', p.category)}<div class="detail-layout"><div class="detail-picture"><img src="${imagePath(p.image)}" alt="${p.name}" decoding="async" width="800" height="800"/></div><div class="detail-copy"><h3>${p.name}</h3><p class="detail-price">${money(p.price)}</p><p class="detail-description">${p.description}</p><ul class="detail-list">${p.details.map(d => `<li>${icon('check')}${d}</li>`).join('')}</ul><form id="product-form" data-id="${p.id}">${noteFields()}<button class="button button-primary full-button" type="submit">Add to my gift bag ${icon('bag')}</button></form><button class="button button-whatsapp full-button" data-book="product" data-book-product="${p.id}">${icon('whatsapp')} Enquire about this gift</button><p class="dialog-footnote">Sample product & price. This presentation does not accept payments or place orders.</p></div></div>`);
}
function addToBag(id, personalization = { name: '', message: '', ribbon: 'plum' }) {
  const p = products.find(item => item.id === id); if (!p) return;
  const match = bag.find(item => item.id === id && item.name === personalization.name && item.message === personalization.message && item.ribbon === personalization.ribbon);
  if (match && match.qty >= 20) { toast('A maximum of 20 of each gift can be saved.'); return; }
  if (match) match.qty += 1; else bag.push({ id, qty: 1, ...personalization });
  persist(); toast(`${p.name} is in your gift bag.`);
  if (!reducedMotion.matches) document.querySelector('.bag-count').animate([{transform:'scale(1)'},{transform:'scale(1.3)'},{transform:'scale(1)'}], {duration:300});
}
function openBag(focusControl) {
  const items = bag.map((item, index) => { const p = products.find(p => p.id === item.id); return `<article class="bag-item"><img src="${imagePath(p.image,360)}" alt="${p.name}" decoding="async" width="78" height="98"/><div><h3>${p.name}</h3><div class="bag-item-meta">${money(p.price)} · ${escape(item.ribbon)} ribbon${item.name ? `<br>For ${escape(item.name)}` : ''}${item.message ? `<br>“${escape(item.message)}”` : ''}</div><div class="bag-item-controls"><div class="quantity"><button data-quantity="${index}" data-delta="-1" aria-label="Decrease ${p.name} quantity">${icon('minus')}</button><span aria-label="Quantity">${item.qty}</span><button data-quantity="${index}" data-delta="1" aria-label="Increase ${p.name} quantity" ${item.qty >= 20 ? 'disabled' : ''}>${icon('plus')}</button></div><button class="remove-item" data-remove="${index}">Remove</button></div></div></article>`; }).join('');
  const count = bag.reduce((n, i) => n + i.qty, 0);
  openDialog('bag', `${header('Your gift bag', count ? `${count} ${count === 1 ? 'gift' : 'gifts'}` : '')}<div class="dialog-body">${bag.length ? `${items}<div class="bag-total"><span>Sample total</span><strong>${money(bagTotal(bag))}</strong></div><p class="bag-notice">This is a sample gift list. Download it to keep your choices and notes. No payment is taken and no order is placed.</p><button class="button button-primary full-button" data-book="bag">${icon('whatsapp')}Book on WhatsApp</button><button class="button button-outline full-button" id="download-bag" style="margin-top:10px">${icon('download')}Download my gift list</button><button class="text-button" data-continue style="margin-top:20px">Keep browsing</button>` : `<div class="empty-state">${icon('bag')}<h3>Your bag is empty.</h3><p>Add a gift and it will wait here, along with your note.</p><button class="button button-primary" data-continue>Browse the collection</button></div>`}</div>`, 'drawer', focusControl || '');
}
function miniProduct(p, action = 'view') { return `<article class="mini-product"><button class="product-open" data-product="${p.id}" aria-label="Explore ${p.name}"><img src="${imagePath(p.image,360)}" alt="${p.name}" decoding="async" width="60" height="68"/></button><div><button class="mini-product-title" data-product="${p.id}">${p.name}</button><p>${money(p.price)}</p></div>${action === 'save' ? `<button class="icon-button product-save is-saved" style="position:static" data-save="${p.id}" aria-label="Unsave ${p.name}" aria-pressed="true">${icon('heart')}</button>` : `<button class="icon-button" data-product="${p.id}" aria-label="Explore ${p.name}">${icon('arrow-up-right')}</button>`}</article>`; }
function openSaved() {
  const found = products.filter(p => saved.includes(p.id));
  openDialog('wishlist', `${header('Saved gifts', found.length ? `${found.length} saved` : '')}<div class="dialog-body">${found.length ? found.map(p => miniProduct(p, 'save')).join('') : `<div class="empty-state">${icon('heart')}<h3>No saved gifts yet.</h3><p>Tap the heart on any gift to keep it here for later.</p><button class="button button-primary" data-continue>Browse the collection</button></div>`}</div>`, 'compact');
}
function openSearch() {
  openDialog('search', `${header('Search gifts')}<div class="dialog-body"><div class="search-input-wrap">${icon('search')}<input class="search-field" id="gift-search" type="search" placeholder="Try a mug, flowers, a hamper..." aria-label="Search the gift collection" autocomplete="off"/></div><p class="search-count" id="search-count" aria-live="polite"></p><div id="search-results"></div></div>`, 'compact', '#gift-search');
  updateSearch('');
}
function updateSearch(query) { const matches = filterProducts({ query }); document.getElementById('search-count').textContent = query ? `${matches.length} ${matches.length === 1 ? 'gift' : 'gifts'} found` : 'The whole collection. Type to narrow it down.'; document.getElementById('search-results').innerHTML = matches.length ? matches.map(p => miniProduct(p)).join('') : `<div class="empty-state">${icon('search')}<h3>No matches.</h3><p>Try “mug”, “hamper”, “frame” or “flowers”.</p></div>`; }
function openPersonalize() {
  openDialog('personalize', `${header('Make it personal', 'Your note goes on the card inside the gift')}<div class="dialog-body personalize-dialog"><p class="dialog-copy">Choose a gift, add your note and pick a ribbon. The preview updates as you type.</p><form id="personalize-form"><div class="field"><label for="gift-select">Choose a gift</label><select id="gift-select" name="product">${products.map(p => `<option value="${p.id}">${p.name} — ${money(p.price)}</option>`).join('')}</select></div>${noteFields()}<div class="form-preview"><span class="preview-label">Preview of your note</span><div class="card-dear">Dear <span id="live-name">${escape(note.name || 'your favorite person')}</span>,</div><p id="live-message">${escape(note.message || "Here's a little something to remind you how much you mean to me.")}</p><span class="card-signoff">With all my love, always.</span></div><button class="button button-primary full-button" type="submit">Add to my gift bag ${icon('bag')}</button><p class="dialog-footnote">Your note is saved in this browser with your gift list. This is a sample storefront.</p></form></div>`, 'compact');
}
function updateNotePreview() {
  const form = content.querySelector('form'); if (!form) return;
  const data = new FormData(form);
  note = { name: String(data.get('name') || ''), message: String(data.get('message') || ''), ribbon: String(data.get('ribbon') || 'plum') };
  const name = document.getElementById('live-name'); if (name) name.textContent = note.name || 'your favorite person';
  const message = document.getElementById('live-message'); if (message) message.textContent = note.message || "Here's a little something to remind you how much you mean to me.";
  document.getElementById('sample-name').textContent = note.name || 'your favorite person';
  document.getElementById('sample-message').textContent = note.message || "Here's a little something to remind you how much you mean to me.";
  const ribbon = document.querySelector('.ribbon-band');
  ribbon.style.background = { plum: '', rose: 'linear-gradient(#bd8290,#d39ba5,#aa7584)', sage: 'linear-gradient(#89957c,#a3ad95,#7d8c71)' }[note.ribbon];
}
function openFinder() {
  openDialog('finder', `${header('Find a gift match', 'Two questions, then a short list')}<div class="dialog-body"><p class="dialog-copy">Tell us the occasion and a comfortable budget, and we'll narrow the collection down for you.</p><form id="finder-form"><div class="field"><label for="finder-occasion">What's the occasion?</label><select id="finder-occasion" name="occasion"><option value="all">Any occasion</option><option value="birthday">A birthday</option><option value="anniversary">An anniversary</option><option value="just-because">Just because</option><option value="celebration">A celebration</option></select></div><div class="field"><label for="finder-budget">Your budget</label><select id="finder-budget" name="budget"><option value="99999">Any budget</option><option value="750">Up to ₹750</option><option value="1000">Up to ₹1,000</option><option value="1500">Up to ₹1,500</option><option value="2000">Up to ₹2,000</option></select></div><button type="submit" class="button button-primary full-button">Show my matches</button></form></div>`, 'compact');
}
function showFinderResults(form) {
  const data = new FormData(form); const matches = filterProducts({ occasion: data.get('occasion'), budget: Number(data.get('budget')) });
  openDialog('finder-results', `${header(matches.length ? 'Your shortlist' : 'No exact match yet', `${matches.length} ${matches.length === 1 ? 'gift matches' : 'gifts match'}`)}<div class="dialog-body"><p class="finder-results-note">${matches.length ? 'These fit your occasion and budget. Open one to add your note.' : 'Nothing in this sample collection fits both choices. Try a different occasion or a wider budget.'}</p>${matches.map(p => miniProduct(p)).join('')}<button class="text-button" data-open="finder" style="margin-top:24px">Try different answers</button></div>`, 'compact');
}
function openHelp() { openDialog('help', `${header('Help')}<div class="dialog-body"><details class="help-item" open><summary>Can I make a gift personal?</summary><p>Yes. Open any gift, add a name and a note, then choose a ribbon. You can also use “Make it personal” to see your note come to life as you type.</p></details><details class="help-item"><summary>How do I keep my gift ideas?</summary><p>Tap a heart to save a favorite, or add a gift to your bag. Your choices stay in this browser when local storage is available. Download your gift list from the bag to keep a copy.</p></details><details class="help-item"><summary>Can I place a real order here?</summary><p>This is an independent website design sample. Products, artwork and prices are illustrative. Payments, shipping and order fulfillment are not connected, and downloading a list does not place an order.</p></details><details class="help-item"><summary>What happens to my personal note?</summary><p>Your note stays on this device and is included in your downloaded gift list. Nothing is sent automatically. If you choose WhatsApp, review your enquiry first and send it yourself in the chat. Remove a gift from your bag to remove its saved note.</p></details></div>`, 'compact'); }
function openMenu() {
  openDialog('menu', `${header('Menu', 'The thoughtful gift studio')}<div class="dialog-body"><nav class="menu-links" aria-label="Mobile navigation"><a href="#collection" data-menu-link>Explore the gifts${icon('arrow-up-right')}</a><a href="#personalize" data-menu-link>Make it personal${icon('arrow-up-right')}</a><a href="#bespoke" data-menu-link>Gifts for an occasion${icon('arrow-up-right')}</a><a href="#our-story" data-menu-link>The studio${icon('arrow-up-right')}</a></nav><div class="mobile-menu-occasions"><button data-occasion="birthday">${icon('cake')}Birthdays</button><button data-occasion="anniversary">${icon('heart')}Anniversaries</button><button data-occasion="just-because">${icon('flower')}Just because</button><button data-occasion="celebration">${icon('sparkle')}Celebrations</button></div><button class="button button-primary full-button" data-book="general">${icon('whatsapp')}Book on WhatsApp</button><button class="text-button" data-open="wishlist" style="margin-top:18px">Your saved gifts</button><p class="menu-note">A good gift starts with the person, not the shop.</p></div>`, 'drawer');
}
const views = { search: openSearch, wishlist: openSaved, bag: openBag, personalize: openPersonalize, finder: openFinder, help: openHelp, menu: openMenu };

document.addEventListener('click', event => {
  const button = event.target.closest('button,a'); if (!button) return;
  if (button.hasAttribute('data-close')) return closeDialog();
  if (button.dataset.nav) return setNavPanel(button.dataset.nav);
  if (button.closest('.nav-panel')) closeNavPanel();
  if (button.dataset.book) return openBooking(button.dataset.book, button.dataset.bookProduct);
  if (button.dataset.navFilter) return setFilter(button.dataset.navFilter, true);
  if (button.id === 'edit-booking') return openBooking(bookingContext, bookingProduct, true);
  if (button.id === 'download-enquiry') return downloadText('my-gift-enquiry.txt', preparedEnquiry); 
  if (button.dataset.open) return views[button.dataset.open]?.();
  if (button.dataset.product) return openProduct(button.dataset.product);
  if (button.dataset.save) { const id = button.dataset.save; const wasSaved = saved.includes(id); saved = wasSaved ? saved.filter(item => item !== id) : [...saved, id]; persist(); toast(wasSaved ? 'Removed from your saved gifts.' : 'Saved for later.'); if (currentView === 'wishlist') openSaved(); return; }
  if (button.dataset.add) return addToBag(button.dataset.add);
  if (button.dataset.filter) return setFilter(button.dataset.filter);
  if (button.dataset.occasion) { if (dialog.open) closeDialog(); return setFilter(button.dataset.occasion, true); }
  if (button.hasAttribute('data-continue')) { closeDialog(); document.getElementById('collection').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' }); return; }
  if (button.hasAttribute('data-menu-link')) { closeDialog(); return; }
  if (button.hasAttribute('data-quantity')) { const index = Number(button.dataset.quantity); const delta = Number(button.dataset.delta); if (!bag[index]) return; bag[index].qty += delta; bag = bag.filter(item => item.qty > 0); persist(); openBag(`[data-quantity="${index}"][data-delta="${delta}"]:not([disabled])`); return; }
  if (button.hasAttribute('data-remove')) { bag.splice(Number(button.dataset.remove), 1); persist(); openBag(); return; }
  if (button.id === 'view-all') { showAll = !showAll; activeFilter = 'all'; renderProducts(); return; }
  if (button.id === 'back-top') window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  if (button.id === 'download-bag') downloadBag();
});
document.addEventListener('submit', event => {
  const form = event.target;
  if (!['product-form', 'personalize-form', 'finder-form', 'booking-form'].includes(form.id)) return;
  event.preventDefault();
  if (form.id === 'finder-form') return showFinderResults(form);
  if (form.id === 'booking-form') return reviewBooking(form);
  updateNotePreview();
  const data = new FormData(form);
  const id = form.id === 'product-form' ? form.dataset.id : data.get('product');
  addToBag(id, { name: note.name.trim(), message: note.message.trim(), ribbon: note.ribbon });
  openBag();
});
content.addEventListener('input', event => { if (event.target.id === 'gift-search') updateSearch(event.target.value); else if (['gift-name', 'gift-message'].includes(event.target.id)) updateNotePreview(); });
content.addEventListener('change', event => { if (event.target.name === 'ribbon') updateNotePreview(); });
function downloadBag() {
  if (!bag.length) return;
  const lines = [siteConfig.brand.toUpperCase() + ' — MY THOUGHTFUL GIFT LIST', 'Design concept: sample products and prices. This is not an order.', ''];
  bag.forEach(item => { const p = products.find(p => p.id === item.id); lines.push(`${p.name} × ${item.qty} — ${money(p.price * item.qty)}`, `Ribbon: ${item.ribbon}`, ...(item.name ? [`For: ${item.name}`] : []), ...(item.message ? [`Note: ${item.message}`] : []), ''); });
  lines.push(`Sample total: ${money(bagTotal(bag))}`, '', 'A little gift. A big feeling.');
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'my-dearly-gift-list.txt'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Your gift list is downloading.');
}
window.addEventListener('storage', event => { if (event.key === 'dearly-bag-v1') bag = validateBag(readStored('dearly-bag-v1', [])); if (event.key === 'dearly-saved-v1') { const next = readStored('dearly-saved-v1', []); saved = Array.isArray(next) ? next.filter(id => products.some(p => p.id === id)) : []; } syncBadges(); if (currentView === 'bag') openBag(); if (currentView === 'wishlist') openSaved(); });

// Navigation stays usable without hover and reflects the section in view.
let activeNavPanel = null;
let navCloseTimer;
function closeNavPanel(restoreFocus = false) {
  clearTimeout(navCloseTimer);
  if (!activeNavPanel) return;
  const toggle = document.querySelector(`[data-nav="${activeNavPanel}"]`);
  document.getElementById(activeNavPanel).hidden = true;
  toggle?.setAttribute('aria-expanded', 'false');
  activeNavPanel = null;
  if (restoreFocus) toggle?.focus();
}
function setNavPanel(id, forceOpen = false) {
  if (activeNavPanel === id && !forceOpen) return closeNavPanel();
  closeNavPanel();
  const panel = document.getElementById(id);
  if (!panel) return;
  activeNavPanel = id;
  panel.hidden = false;
  document.querySelector(`[data-nav="${id}"]`).setAttribute('aria-expanded', 'true');
}
function initNavigation() {
  const headerEl = document.getElementById('header');
  let scheduled = false;
  let scrollRange = 1;
  const measure = () => { scrollRange = Math.max(1, document.documentElement.scrollHeight - innerHeight); update(); };
  const update = () => {
    headerEl.classList.toggle('scrolled', scrollY > 24);
    headerEl.style.setProperty('--progress', Math.min(1, Math.max(0, scrollY / scrollRange)));
    scheduled = false;
  };
  addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', () => { measure(); if (innerWidth <= 1050) closeNavPanel(); else if (currentView === 'menu') closeDialog(); }, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  document.addEventListener('click', event => { if (!event.target.closest('.nav-disclosure')) closeNavPanel(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && activeNavPanel) { event.preventDefault(); closeNavPanel(true); } });
  document.querySelectorAll('.nav-disclosure').forEach(wrapper => {
    const button = wrapper.querySelector('[data-nav]');
    wrapper.addEventListener('pointerenter', () => { if (matchMedia('(hover: hover) and (pointer: fine)').matches) { clearTimeout(navCloseTimer); setNavPanel(button.dataset.nav, true); } });
    wrapper.addEventListener('pointerleave', () => { navCloseTimer = setTimeout(() => { if (!wrapper.contains(document.activeElement)) closeNavPanel(); }, 180); });
    wrapper.addEventListener('focusout', event => { if (!wrapper.contains(event.relatedTarget)) closeNavPanel(); });
    button.addEventListener('keydown', event => { if (event.key === 'ArrowDown') { event.preventDefault(); setNavPanel(button.dataset.nav, true); document.getElementById(button.dataset.nav).querySelector('a,button')?.focus(); } });
  });
  document.getElementById('collections-toggle').dataset.section = 'collection';
  document.getElementById('occasions-toggle').dataset.section = 'occasions';
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      document.querySelectorAll('[data-section]').forEach(link => {
        if (link.dataset.section === visible[0].target.id) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-100px 0px -55% 0px' });
    document.querySelectorAll('main > section[id], .hero').forEach(section => sectionObserver.observe(section));
    new IntersectionObserver(([entry]) => { document.querySelector('.floating-whatsapp').classList.toggle('is-at-footer', entry.isIntersecting); }).observe(document.querySelector('.site-footer'));
  }
  measure();
}

// Booking is an enquiry, never an automatic message or a confirmed order.
let bookingContext = 'general';
let bookingProduct = '';
let preparedEnquiry = '';
let bookingGifts = [];
let bookingDraft = { name: '', occasion: 'Just because', quantity: '1', date: '', budget: '', city: '', details: '', includeGifts: true };
const bookingOccasions = ['Just because', 'Birthday', 'Anniversary', 'Wedding / celebration', 'Corporate / team gifting', 'A personal keepsake'];
function openBooking(context = 'general', productId = '', editing = false) {
  closeNavPanel();
  if (!editing) {
    bookingContext = context;
    bookingProduct = productId || '';
    if (currentView === 'product') updateNotePreview();
    if (context === 'product' && products.some(p => p.id === productId)) {
      const product = products.find(p => p.id === productId);
      bookingGifts = [{ name: product.name, qty: 1, price: money(product.price), recipient: note.name, note: note.message, ribbon: note.ribbon }];
    } else {
      bookingGifts = bag.map(item => { const p = products.find(p => p.id === item.id); return { name: p.name, qty: item.qty, price: money(p.price), recipient: item.name, note: item.message, ribbon: item.ribbon }; });
    }
    bookingDraft.includeGifts = context === 'bag' || context === 'product';
    if (context === 'bag' && bag.length) bookingDraft.quantity = String(bag.reduce((sum, item) => sum + item.qty, 0));
    if (context === 'product') bookingDraft.quantity = '1';
    const occasion = { corporate: 'Corporate / team gifting', celebration: 'Wedding / celebration', personal: 'A personal keepsake' }[context];
    if (occasion) bookingDraft.occasion = occasion;
  }
  const budgetOptions = ['', 'Under ₹1,000', '₹1,000 – ₹2,500', '₹2,500 – ₹5,000', '₹5,000+', 'Let’s discuss a budget'];
  openDialog('booking', `${header('Book on WhatsApp', 'Review first, then send it yourself')}<div class="dialog-body"><div class="booking-intro"><span>${icon('whatsapp')}</span><p>Tell us what you have in mind. You'll review the message before WhatsApp opens.</p></div><form id="booking-form"><div class="field-row"><div class="field"><label for="booking-name">Your name <span aria-hidden="true">*</span></label><input id="booking-name" name="name" required maxlength="60" autocomplete="given-name" placeholder="Your name" value="${escape(bookingDraft.name)}"/></div><div class="field"><label for="booking-occasion">The occasion</label><select id="booking-occasion" name="occasion">${bookingOccasions.map(o => `<option ${o === bookingDraft.occasion ? 'selected' : ''}>${o}</option>`).join('')}</select></div></div><div class="field-row"><div class="field"><label for="booking-date">Preferred date <span class="field-hint">(optional)</span></label><input id="booking-date" type="date" name="date" min="${localDate()}" value="${escape(bookingDraft.date)}"/></div><div class="field"><label for="booking-quantity">How many gifts?</label><input id="booking-quantity" type="number" name="quantity" min="1" max="1000" step="1" required inputmode="numeric" value="${escape(bookingDraft.quantity)}"/></div></div><div class="field-row"><div class="field"><label for="booking-budget">Budget per gift</label><select id="booking-budget" name="budget">${budgetOptions.map(o => `<option value="${escape(o)}" ${o === bookingDraft.budget ? 'selected' : ''}>${o || 'Open to ideas'}</option>`).join('')}</select></div><div class="field"><label for="booking-city">Delivery city <span class="field-hint">(optional)</span></label><input id="booking-city" name="city" maxlength="80" autocomplete="address-level2" placeholder="Your city" value="${escape(bookingDraft.city)}"/></div></div><div class="field"><label for="booking-details">Tell us a little about your idea</label><textarea id="booking-details" name="details" maxlength="600" placeholder="Their favorite things, colors, your theme, or that little detail that would make it special…">${escape(bookingDraft.details)}</textarea></div>${bookingGifts.length ? `<label class="booking-check"><input type="checkbox" name="includeGifts" ${bookingDraft.includeGifts ? 'checked' : ''}/><span>Include my ${bookingGifts.length === 1 ? 'selected gift' : 'gift shortlist'} and any personal notes in the enquiry.</span></label>` : ''}<button class="button button-primary full-button" type="submit">Review my enquiry</button><p class="booking-caption">${icon('check')} Nothing is sent until you press Send in WhatsApp.</p></form></div>`, 'compact');
}
function reviewBooking(form) {
  const nameInput = form.elements.name;
  nameInput.setCustomValidity(nameInput.value.trim() ? '' : 'Please enter your name.');
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  bookingDraft = Object.fromEntries(['name', 'occasion', 'quantity', 'date', 'budget', 'city', 'details'].map(key => [key, String(data.get(key) || '').trim()]));
  bookingDraft.includeGifts = data.has('includeGifts');
  preparedEnquiry = bookingMessage({ brand: siteConfig.brand, ...bookingDraft, gifts: bookingDraft.includeGifts ? bookingGifts : [] });
  const link = whatsappUrl(siteConfig.whatsappNumber, preparedEnquiry);
  openDialog('booking-review', `${header('Review your enquiry', link ? 'WhatsApp opens with this message' : 'Not connected to WhatsApp yet')}<div class="dialog-body">${link ? '<p class="dialog-copy">Your message is ready. WhatsApp will open with these details so you can check them and press Send.</p>' : `<div class="booking-status">${icon('pen')}<span>This preview isn't connected to a business WhatsApp number yet. Save your enquiry below to keep it.</span></div>`}<div class="booking-preview" tabindex="0" role="region" aria-label="Your WhatsApp enquiry">${escape(preparedEnquiry)}</div><div class="booking-actions">${link ? `<a class="button button-whatsapp" href="${escape(link)}" target="_blank" rel="noopener noreferrer">${icon('whatsapp')}Continue to WhatsApp</a>` : ''}<button class="button ${link ? 'button-outline' : 'button-primary'}" id="download-enquiry">${icon('download')}Save my enquiry</button></div><button class="text-button booking-back" id="edit-booking">Edit the details</button><p class="dialog-footnote">An enquiry is not a confirmed booking. Availability, final pricing and delivery are confirmed by the studio.</p></div>`, 'compact');
}
content.addEventListener('input', event => { if (event.target.id === 'booking-name') event.target.setCustomValidity(''); });
function downloadText(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Your gift enquiry is saved.');
}

// Small native animations: no animation framework or network dependency.
const activeAnimations = new Set();
const saveData = navigator.connection?.saveData === true;
function revealElements(elements, stagger = 0) {
  if (reducedMotion.matches || saveData || !Element.prototype.animate) return;
  [...elements].forEach((element, index) => {
    const animation = element.animate([{ opacity: .55, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 480, delay: index * stagger, easing: 'cubic-bezier(.22,1,.36,1)' });
    activeAnimations.add(animation);
    animation.finished.catch(() => {}).finally(() => activeAnimations.delete(animation));
  });
}
function animateDialog(isDrawer) {
  if (reducedMotion.matches || saveData || !Element.prototype.animate) return;
  const frames = isDrawer ? [{ opacity: .5, transform: 'translateX(28px)' }, { opacity: 1, transform: 'translateX(0)' }] : [{ opacity: .5, transform: 'translateY(12px) scale(.985)' }, { opacity: 1, transform: 'none' }];
  dialog.animate(frames, { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' });
}
function initMotion() {
  if (reducedMotion.matches || saveData) { document.documentElement.classList.add('economy-motion'); return; }
  revealElements(document.querySelectorAll('.hero-enter'), 55);
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { revealElements([entry.target]); revealObserver.unobserve(entry.target); } }); }, { rootMargin: '0px 0px -25px 0px', threshold: .08 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    const loopObserver = new IntersectionObserver(entries => { entries.forEach(entry => { entry.target.dataset.inView = String(entry.isIntersecting); entry.target.style.animationPlayState = entry.isIntersecting && !document.hidden ? 'running' : 'paused'; }); });
    document.querySelectorAll('.gift-seal svg,.marquee-track,.floating-tag,.finder-flower').forEach(el => loopObserver.observe(el));
  }
  document.addEventListener('visibilitychange', () => { document.querySelectorAll('.gift-seal svg,.marquee-track,.floating-tag,.finder-flower').forEach(el => { el.style.animationPlayState = !document.hidden && el.dataset.inView === 'true' ? 'running' : 'paused'; }); });
}
reducedMotion.addEventListener('change', event => {
  document.documentElement.classList.toggle('economy-motion', event.matches || saveData);
  if (event.matches) for (const animation of activeAnimations) animation.cancel();
});
document.querySelectorAll('[data-brand]').forEach(el => { el.textContent = siteConfig.brand.toLowerCase(); const dot = document.createElement('span'); dot.className = 'brand-dot'; dot.textContent = '.'; el.append(dot); });
document.querySelectorAll('[data-brand-name]').forEach(el => { el.textContent = siteConfig.brand; });
document.querySelectorAll('[data-brand-caption]').forEach(el => { el.textContent = 'Gifts with a little more meaning.'; });
document.querySelectorAll('.brand').forEach(el => el.setAttribute('aria-label', `${siteConfig.brand} home`));
document.title = `${siteConfig.brand} — Gifts with a little more meaning.`;
hydrateIcons(); renderProducts(); syncBadges();
document.getElementById('year').textContent = new Date().getFullYear();
initNavigation(); initMotion();
