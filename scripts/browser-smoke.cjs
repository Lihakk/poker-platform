// Run from any directory; artifacts are written relative to the project root.
process.chdir(require('node:path').resolve(__dirname, '..'));
const { chromium } = require('../frontend/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const base = 'http://127.0.0.1:5173';
const scenarios = [{ id: 1, title: 'Top pair under pressure', hero_position: 'BTN', hole_cards: 'AhQd', board_cards: 'Qc7s2h9h', pot_size: 72, stack_size: 118, facing_bet: 24, hero_street_bet: 0, street: 'Turn', difficulty: 'Intermediate', villain_profile: 'Aggressive regular', focus: 'Pot odds', narrative_setup: 'Your opponent leads 24 bb. The pot including this wager is 72 bb.', actions: [{ id: 1, action_type: 'Fold', raise_amount: 0, is_optimal: false, coach_comment: 'Compare your equity with the price.' }, { id: 2, action_type: 'Call', raise_amount: 0, is_optimal: true, coach_comment: 'Calling needs 25% equity and preserves bluffs.' }, { id: 3, action_type: 'Raise', raise_amount: 80, is_optimal: false, coach_comment: 'The raise builds a large pot with a non-nut pair.' }] }];
async function run() {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  let userId = 9901;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/refresh', route => route.fulfill({ json: { token: 'ui-test', user: { id: userId, username: 'Study tester', email: 'test@example.test', role: 'learner' } } }));
  await page.route('**/api/modules', route => route.fulfill({ json: [{ id: 1, title: 'Published foundations', description: 'Position and poker math.', lessons: [{ id: 1, title: 'Position at the table' }], quizzes: [{ id: 1, title: 'Pot odds check' }] }] }));
  await page.route('**/api/scenarios', route => route.fulfill({ json: scenarios }));
  await page.route('**/api/lessons/1', route => route.fulfill({ json: { id: 1, title: 'Position at the table', content: 'The button acts last after the flop.\n\nPosition helps you make informed decisions.' } }));
  await page.route('**/api/quizzes/1', route => route.fulfill({ json: { id: 1, title: 'Pot odds check', questions: [{ id: 1, text: 'Call 25 to create a final pot of 100. Required equity?', explanation: '25 / 100 is 25%.', options: [{ text: '25%', is_correct: true }, { text: '50%', is_correct: false }] }] } }));
  async function go(url) { await page.goto(base + url); await page.locator('main').waitFor(); await page.evaluate(() => document.fonts.ready); }
  async function shot(name) { await page.screenshot({ path: path.resolve('outputs', name + '.png'), fullPage: true }); }
  await go('/dashboard'); await page.getByRole('heading', { name: 'Choose your practice' }).waitFor(); await shot('upgrade-dashboard-desktop'); await page.screenshot({ path: path.resolve('docs/screenshots/dashboard.png') });
  await go('/study/pot-odds'); await page.getByRole('button', { name: 'Mark complete', exact: true }).click();
  await page.reload(); await page.getByRole('button', { name: 'Lesson completed' }).waitFor();
  assert(await page.getByRole('button', { name: 'Lesson completed' }).isDisabled());
  await page.getByRole('textbox', { name: 'Lesson notes' }).fill('Count the final pot and subtract the cost once.');
  await page.getByRole('button', { name: 'Save note', exact: true }).click(); await shot('upgrade-lesson-desktop');
  await go('/practice-quiz/pot-odds');
  const picks = ['33.3%', '33.3%', '−5 bb'];
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: new RegExp(picks[i].replace('.', '\\.') + '$') }).click();
    await page.getByRole('button', { name: 'Check answer', exact: true }).click();
    await page.locator('.quiz-feedback').waitFor();
    await page.getByRole('button', { name: i === 2 ? 'See results' : 'Next question', exact: true }).click();
  }
  assert.match(await page.locator('.quiz-score-circle').innerText(), /67/);
  await page.getByRole('button', { name: 'Retry mistakes', exact: true }).click();
  assert.match(await page.locator('.question-progress').innerText(), /QUESTION 1 OF 1/);
  await page.getByRole('button', { name: /25%$/ }).click();
  await page.getByRole('button', { name: 'Check answer', exact: true }).click(); await shot('upgrade-quiz-desktop');
  await page.getByRole('button', { name: 'See results', exact: true }).click();
  await go('/strategy-library?tab=Notebook'); assert.match(await page.locator('.notebook-list').innerText(), /Count the final pot/);
  userId = 9902; await page.reload(); await page.getByRole('heading', { name: 'Your study notes live here.' }).waitFor();
  assert(!((await page.locator('.notebook-list').innerText()).includes('Count the final pot')));
  userId = 9901; await page.reload();
  await go('/equity-lab'); await page.getByRole('button', { name: 'Calculate equity', exact: true }).click(); await page.locator('.equity-percentage').waitFor();
  assert((parseFloat(await page.locator('.equity-percentage').innerText())) > 0);
  await shot('upgrade-equity-desktop');
  await page.locator('.lab-card-inputs input').first().fill('AsAs');
  await page.getByRole('button', { name: 'Recalculate', exact: true }).click(); assert.match(await page.locator('.training-error').innerText(), /unique/);
  await go('/poker-math'); assert.match(await page.locator('.math-big-result').innerText(), /\+13\.0/);
  await page.locator('.math-preset select').selectOption('[75,25,30]'); assert.match(await page.locator('.math-big-result').innerText(), /\+5\.0/);
  await page.getByRole('tab', { name: 'Draw odds', exact: true }).click(); assert.match(await page.locator('.math-big-result').innerText(), /35\.0/);
  await page.getByRole('tab', { name: 'Street sizing', exact: true }).click();
  await page.locator('.math-numeric input').nth(0).fill('30'); await page.locator('.math-numeric input').nth(1).fill('90'); await page.locator('.math-preset select').selectOption('2');
  assert.match(await page.locator('.math-big-result').innerText(), /82\.3/);
  await go('/custom-games'); await page.getByLabel('Session name', { exact: true }).fill('Phone practice'); await page.getByLabel('AI opponents', { exact: true }).selectOption('1');
  await page.getByRole('button', { name: 'Save setup', exact: true }).click();
  await page.getByRole('link', { name: 'Play this setup', exact: true }).click(); assert.equal(await page.getByLabel('AI opponents', { exact: true }).inputValue(), '1');
  await page.getByLabel('Starting stack', { exact: true }).fill('20');
  await page.getByRole('button', { name: 'Take your seat', exact: true }).click();
  await page.getByRole('button', { name: 'All-in', exact: true }).waitFor();
  await page.waitForFunction(() => !document.querySelector('.session-strip')?.textContent.includes('thinking'));
  await page.locator('.coach-read h3').waitFor();
  assert(await page.locator('.table-action-buttons button').nth(1).isEnabled(), 'Call/check must be available on the hero turn');
  assert(await page.getByRole('button', { name: 'All-in', exact: true }).isEnabled(), 'Opening all-in must be available');
  await shot('upgrade-simulator-desktop');
  await page.getByRole('button', { name: 'Hide coaching', exact: true }).click(); assert.equal(await page.locator('.coach-read').count(), 0);
  for (let i = 0; i < 25 && await page.locator('.hand-result').count() === 0; i++) {
    const allin = page.getByRole('button', { name: 'All-in', exact: true });
    if (await allin.isEnabled()) await allin.click(); else await page.locator('.table-action-buttons button').nth(1).click();
    await page.waitForFunction(() => !document.querySelector('.session-strip')?.textContent.includes('thinking'));
  }
  assert.equal(await page.locator('.hand-result').count(), 1); await shot('upgrade-simulator-result');
  await page.getByRole('button', { name: 'Save hand', exact: true }).click();
  await go('/situations'); await page.getByRole('button', { name: 'Call 24 bb', exact: true }).click(); await page.locator('.quiz-feedback').waitFor(); assert(await page.getByRole('button', { name: 'Fold', exact: true }).isDisabled());
  await go('/ai-games'); await page.locator('.ai-action').first().waitFor(); await page.locator('.ai-action').nth(1).click(); assert(await page.locator('.ai-action').first().isDisabled());
  const layouts = [];
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    for (const url of ['/dashboard', '/strategy-library', '/study/pot-odds', '/practice-quiz/outs-equity', '/poker-math', '/equity-lab', '/custom-games', '/situations', '/ai-games', '/game-simulator', '/lesson/1', '/quiz/1']) {
      await go(url);
      if (url === '/ai-games') await page.locator('.ai-action').first().waitFor();
      const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth }));
      assert(dimensions.scroll <= dimensions.width + 1, `${url} overflows at ${width}: ${JSON.stringify(dimensions)}`);
      layouts.push({ width, url, overflow: dimensions.scroll - dimensions.width });
      if (width === 390 && ['/strategy-library', '/study/pot-odds', '/poker-math', '/equity-lab', '/custom-games'].includes(url)) await shot('upgrade-' + url.split('/').filter(Boolean).join('-') + '-mobile');
    }
  }
  await page.setViewportSize({ width: 390, height: 844 }); await go('/game-simulator');
  await page.getByRole('button', { name: 'Take your seat', exact: true }).click(); await page.locator('.table-action-buttons').waitFor(); await page.waitForFunction(() => !document.querySelector('.session-strip')?.textContent.includes('thinking')); await shot('upgrade-simulator-mobile');
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click(); await page.getByRole('dialog', { name: 'Training navigation' }).waitFor(); await page.keyboard.press('Escape'); assert.equal(await page.getByRole('dialog').count(), 0);
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  publicPage.on('pageerror', error => errors.push(error.message));
  await publicPage.route('**/api/refresh', route => route.fulfill({ status: 401, json: { error: 'No active session' } }));
  for (const width of [320, 390, 768, 1440]) {
    await publicPage.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    for (const url of ['/', '/login', '/register']) {
      await publicPage.goto(base + url);
      await publicPage.locator('h1').waitFor();
      const dimensions = await publicPage.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth }));
      assert(dimensions.scroll <= width + 1, `${url} overflows at ${width}`);
      layouts.push({ width, url, overflow: dimensions.scroll - width });
    }
  }
  await publicPage.setViewportSize({ width: 390, height: 844 });
  await publicPage.goto(base + '/register');
  await publicPage.route('**/api/register', async route => {
    assert.deepEqual(route.request().postDataJSON(), { username: 'New learner', email: 'learner@example.test', password: 'sample-password' });
    await route.fulfill({ json: { message: 'Account created' } });
  });
  await publicPage.getByLabel('Username', { exact: true }).fill('New learner');
  await publicPage.getByLabel('Email address', { exact: true }).fill('learner@example.test');
  await publicPage.getByLabel('Password', { exact: true }).fill('sample-password');
  await publicPage.getByRole('button', { name: 'Show password', exact: true }).click();
  assert.equal(await publicPage.getByLabel('Password', { exact: true }).getAttribute('type'), 'text');
  await publicPage.getByRole('button', { name: 'Create account', exact: true }).click();
  await publicPage.getByRole('heading', { name: "You're in.", exact: true }).waitFor();
  await publicPage.getByRole('link', { name: 'Sign in', exact: true }).click();
  assert.equal(await publicPage.getByLabel('Email address', { exact: true }).inputValue(), 'learner@example.test');
  await publicPage.route('**/api/login', route => route.fulfill({ status: 401, json: { error: 'Invalid email or password' } }));
  await publicPage.getByLabel('Password', { exact: true }).fill('wrong-password');
  await publicPage.getByRole('button', { name: 'Sign in', exact: true }).click();
  await publicPage.getByRole('alert').waitFor();
  assert.match(await publicPage.getByRole('alert').innerText(), /Invalid email or password/);
  assert(await publicPage.getByRole('button', { name: 'Sign in', exact: true }).isEnabled());
  await publicPage.screenshot({ path: path.resolve('outputs', 'upgrade-login-mobile.png'), fullPage: true });
  await publicPage.setViewportSize({ width: 1440, height: 900 });
  await publicPage.goto(base); await publicPage.locator('h1').waitFor(); await publicPage.evaluate(() => document.fonts.ready); await publicPage.screenshot({ path: path.resolve('docs/screenshots/landing.png') });
  await publicContext.close();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ flows: 'lesson persistence, notes, user isolation, quiz scoring and mistake retry, equity validation, four calculators, saved custom launch, all-in settlement, coach toggle, scenario lock, mobile navigation', layouts: layouts.length, errors }, null, 2));
  await browser.close();
}
run().catch(error => { console.error(error); process.exit(1); });
