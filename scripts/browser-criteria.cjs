process.chdir(require('node:path').resolve(__dirname, '..'));
const { chromium } = require('../frontend/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

async function run() {
 const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
 const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
 const errors = [];
 page.on('pageerror', error => errors.push(error.message));
 await page.route('**/api/refresh', route => route.fulfill({ json: { token: 'ui-admin-test', user: { id: 99, username: 'Content editor', email: 'preview@example.test', role: 'admin' } } }));
 const data = { modules: [{ id: 1, title: 'Poker foundations', description: 'Position, pot odds and disciplined decisions.', display_order: 1, owner_id: 99 }], quizzes: [{ id: 1, title: 'Position essentials', module_id: 1 }], questions: [{ id: 1, quiz_id: 1, text: 'Who acts last after the flop?', explanation: 'The button has position.', options: [{ text: 'Button', is_correct: true }, { text: 'Small blind', is_correct: false }] }] };
 let nextId = 10;
 await page.route('**/api/v1/**', async route => {
  const url = new URL(route.request().url());
  const [, kind, rawId] = url.pathname.split('/').slice(2);
  if (kind === 'overview') return route.fulfill({ json: Object.fromEntries(Object.entries(data).map(([key, values]) => [key, values.length])) });
  const method = route.request().method();
  const items = data[kind];
  assert(items, url.pathname);
  const id = Number(rawId);
  if (method === 'GET') return route.fulfill({ json: rawId ? { data: items.find(item => item.id === id), _links: {} } : { data: items.filter(item => (item.title || item.text).toLowerCase().includes((url.searchParams.get('title') || url.searchParams.get('text') || '').toLowerCase())), pagination: { page: 1, limit: 20, total: items.length } } });
  if (method === 'DELETE') { data[kind] = items.filter(item => item.id !== id); return route.fulfill({ status: 204 }); }
  const body = route.request().postDataJSON();
  const item = { ...body, id: rawId ? id : nextId++, ...(kind === 'modules' ? { owner_id: 99 } : {}) };
  if (method === 'PUT') data[kind] = items.map(old => old.id === id ? item : old); else items.push(item);
  return route.fulfill({ status: method === 'POST' ? 201 : 200, json: { data: item } });
 });
 await page.route('**/api/users/*/role', route => route.fulfill({ json: { id: 42, role: route.request().postDataJSON().role } }));
 await page.goto('http://127.0.0.1:5173/content-editor');
 await page.getByRole('heading', { name: 'Content editor', exact: true }).waitFor();
 for (const [kind, label, title] of [['modules', 'module', 'River practice'], ['quizzes', 'quiz', 'River value review'], ['questions', 'question', 'How much equity does this call require?']]) {
  await page.getByRole('tab', { name: kind, exact: true }).click();
  await page.getByRole('button', { name: 'Add ' + label, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(kind === 'questions' ? 'Question' : 'Title', { exact: true }).fill(title);
  if (kind === 'modules') await dialog.getByLabel('Description', { exact: true }).fill('A practical course on river value betting and bluff catching.');
  if (kind === 'questions') {
   for (let i = 1; i <= 4; i++) await dialog.getByPlaceholder('Answer ' + i, { exact: true }).fill(['25 percent', '50 percent', '75 percent', '100 percent'][i-1]);
   await dialog.getByLabel('Answer explanation', { exact: true }).fill('Divide the additional call by the final pot.');
  }
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  const created = data[kind].find(item => (item.title || item.text) === title);
  assert(created);
  await page.getByRole('button', { name: `View ${label} ${created.id}`, exact: true }).click();
  await page.getByRole('dialog').getByText(title, { exact: true }).waitFor();
  await page.keyboard.press('Escape');
  const row = page.locator('div.flex.flex-wrap').filter({ has: page.getByText(title, { exact: true }) }).last();
  await row.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByRole('dialog').getByLabel(kind === 'questions' ? 'Question' : 'Title', { exact: true }).fill(title + ' updated');
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  const updatedRow = page.locator('div.flex.flex-wrap').filter({ has: page.getByText(title + ' updated', { exact: true }) }).last();
  await updatedRow.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert(!data[kind].some(item => item.id === created.id));
 }
 await page.getByLabel('User ID', { exact: true }).fill('42');
 await page.getByLabel('Role', { exact: true }).selectOption('editor');
 await page.getByRole('button', { name: 'Update role', exact: true }).click();
 await page.getByRole('status').filter({ hasText: 'Account 42 is now editor.' }).waitFor();
 await page.screenshot({ path: path.resolve('docs/screenshots/content-editor.png'), fullPage: true });
 for (const width of [320, 390, 768, 1440]) {
  await page.setViewportSize({ width, height: 1000 });
  await page.getByRole('tab', { name: 'modules', exact: true }).click();
  await page.getByRole('button', { name: 'Add module', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, elements: [...document.querySelectorAll('main *, [role=dialog] *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).map(el => el.outerHTML.slice(0,120)).slice(0,8) }));
  if (overflow.scroll > width + 1) await page.screenshot({ path: path.resolve('outputs', `editor-overflow-${width}.png`), fullPage: true });
  assert(overflow.scroll <= width + 1, JSON.stringify(overflow));
  await page.keyboard.press('Escape');
 }
 let tables = 0;
 for (const width of [320, 390, 768, 1440]) for (const count of [1, 2, 3, 4, 5]) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto('http://127.0.0.1:5173/game-simulator');
  await page.getByLabel('AI opponents', { exact: true }).selectOption(String(count));
  await page.getByRole('button', { name: 'Take your seat', exact: true }).click();
  await page.locator('.poker-arena').waitFor();
  await page.waitForFunction(() => !document.querySelector('.session-strip')?.textContent.includes('thinking'));
  const collisions = await page.evaluate(() => {
   const board = document.querySelector('.arena-board').getBoundingClientRect();
   const overlap = el => { const r = el.getBoundingClientRect(); return r.left < board.right && r.right > board.left && r.top < board.bottom && r.bottom > board.top; };
   return { horizontal: document.documentElement.scrollWidth > innerWidth + 1, overlap: [...document.querySelectorAll('.arena-seat, .arena-hero')].some(overlap) };
  });
  assert.deepEqual(collisions, { horizontal: false, overlap: false }, `${count} opponents at ${width}px`);
  if (count === 5 && [390, 1440].includes(width)) { await page.screenshot({ path: path.resolve('outputs', `table-five-${width}.png`), fullPage: true }); await page.locator('.poker-arena').screenshot({ path: path.resolve('docs/screenshots', width === 1440 ? 'poker-table.png' : 'poker-table-mobile.png') }); }
  tables++;
 }
 assert.deepEqual(errors, []);
 console.log(JSON.stringify({ editor: 'All three CRUD/detail flows, admin role action, keyboard dialog closure', tableLayouts: tables, errors }, null, 2));
 await browser.close();
}
run().catch(error => { console.error(error); process.exit(1); });
