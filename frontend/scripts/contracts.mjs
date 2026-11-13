import fs from 'node:fs';
import { parse, stringify } from 'yaml';

const specFile = new URL('../../docs/openapi.yaml', import.meta.url);
const spec = parse(fs.readFileSync(specFile, 'utf8'));
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const response = (description, schema, example) => ({ description, content: { 'application/json': { ...(schema && { schema }), ...(example && { example }) } } });
const id = { $ref: '#/components/parameters/Id' };
const read = (summary, schema) => ({ tags: ['Learning'], summary, responses: { 200: response('Resource returned', schema), 400: { $ref: '#/components/responses/BadRequest' }, 404: { $ref: '#/components/responses/NotFound' } } });
spec.info.version = '1.1.0';
spec.tags.push(...['Learning', 'System'].filter(name => !spec.tags.some(t => t.name === name)).map(name => ({ name })));
spec.paths['/api/health'] = { get: { tags: ['System'], security: [], summary: 'Process liveness; does not replace a database readiness check', responses: { 200: response('API process is running', { type: 'object', properties: { message: { type: 'string' } } }, { message: 'Poker Backend is healthy!' }) } } };
spec.paths['/api/modules'] = { get: read('Learning modules including lessons, quizzes and scenarios', { type: 'array', items: ref('Module') }) };
spec.paths['/api/lessons/{id}'] = { parameters: [id], get: read('Read one lesson', ref('Lesson')) };
spec.paths['/api/quizzes/{id}'] = { parameters: [id], get: read('Read quiz and answer options for learning', ref('Quiz')) };
spec.paths['/api/scenarios'] = { get: read('List authored decision situations', { type: 'array', items: ref('Scenario') }) };
spec.paths['/api/scenarios/{id}'] = { parameters: [id], get: read('Read one authored decision situation', ref('Scenario')) };
const s = spec.components.schemas;
s.Lesson = { type: 'object', properties: { id: { type: 'integer' }, module_id: { type: 'integer' }, title: { type: 'string' }, content: { type: 'string' } } };
s.ScenarioAction = { type: 'object', properties: { id: { type: 'integer' }, scenario_id: { type: 'integer' }, action_type: { type: 'string', enum: ['Fold', 'Call', 'Raise'] }, raise_amount: { type: 'number' }, is_optimal: { type: 'boolean' }, coach_comment: { type: 'string' } } };
s.Scenario = { type: 'object', properties: { id: { type: 'integer' }, module_id: { type: 'integer' }, title: { type: 'string' }, hero_position: { type: 'string' }, hole_cards: { type: 'string', example: 'AsKh' }, board_cards: { type: 'string', example: 'Qc7s2h' }, pot_size: { type: 'number', example: 6.5 }, stack_size: { type: 'number' }, facing_bet: { type: 'number', description: 'Additional hero call cost in bb; pot_size includes the opposing wager' }, hero_street_bet: { type: 'number' }, street: { type: 'string' }, difficulty: { type: 'string' }, villain_profile: { type: 'string' }, focus: { type: 'string' }, narrative_setup: { type: 'string' }, actions: { type: 'array', items: ref('ScenarioAction') } } };
s.Module.allOf[1].properties.lessons.items = ref('Lesson');
s.Module.allOf[1].properties.scenarios = { type: 'array', items: ref('Scenario') };
Object.assign(s.ModuleInput.properties.title, { maxLength: 200 });
Object.assign(s.ModuleInput.properties.description, { maxLength: 6000 });
Object.assign(s.ModuleInput.properties.display_order, { minimum: 0, maximum: 1000000 });
Object.assign(s.QuizInput.properties.title, { maxLength: 200 });
Object.assign(s.QuestionInput.properties.text, { maxLength: 5000 });
Object.assign(s.QuestionInput.properties.options, { maxItems: 8, description: 'Distinct trimmed answers, exactly one is_correct=true' });
Object.assign(s.OptionInput.properties.text, { minLength: 1, maxLength: 200 });
Object.assign(s.RegisterInput.properties.email, { maxLength: 191 });
Object.assign(s.RegisterInput.properties.password, { maxLength: 72, description: 'At least 8 characters and no more than 72 UTF-8 bytes (bcrypt limit)' });
spec.components.parameters.Page.schema.maximum = 1000000;
spec.components.responses.ServerError = response('Unexpected server or database failure. Invalid client input is handled as 400, not 500.', ref('Error'), { error: 'Database operation failed' });
for (const [path, item] of Object.entries(spec.paths)) for (const [method, operation] of Object.entries(item)) {
  if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) continue;
  const authenticated = !(operation.security?.length === 0);
  if (authenticated) operation.responses['401'] ??= { $ref: '#/components/responses/Unauthorized' };
  if (authenticated && ['post', 'put', 'delete'].includes(method)) operation.responses['403'] ??= { $ref: '#/components/responses/Forbidden' };
  if (path !== '/api/health') operation.responses['500'] ??= { $ref: '#/components/responses/ServerError' };
  if (path.includes('{') || operation.requestBody) operation.responses['400'] ??= { $ref: '#/components/responses/BadRequest' };
}
fs.writeFileSync(specFile, stringify(spec, { lineWidth: 110 }));

const collection = { info: { name: 'PokerLearn - complete criteria demonstration', description: 'Development only. Set baseUrl, adminEmail and adminPassword for an existing administrator. Each run creates 3 uniquely named demonstration users, promotes two to editor, exercises every endpoint and cleans up created learning content. Demo users remain because there is no account-deletion endpoint. See docs/API_TESTING.md.', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' }, variable: [{ key: 'baseUrl', value: 'http://localhost:8080' }, { key: 'adminEmail', value: '' }, { key: 'adminPassword', value: '' }, { key: 'demoPassword', value: 'Demo-only-password-2026' }], auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }] }, item: [] };
let group;
function folder(name) { group = { name, item: [] }; collection.item.push(group); }
function request(name, method, path, expected = 200, body, { token = 'accessToken', code = [], cookie } = {}) {
  const checks = [`pm.test('HTTP ${expected}', () => pm.response.to.have.status(${expected}));`, expected === 204 ? `pm.test('No response body', () => pm.expect(pm.response.text()).to.eql(''));` : `pm.test('JSON response', () => pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json'));`, ...code];
  let raw = body === undefined ? undefined : JSON.stringify(body);
  if (raw) raw = raw.replace(/"(\{\{(?:moduleId|otherModuleId|quizId|questionId|ownerId|otherId|learnerId)\}\})"/g, '$1');
  const item = { name, event: [{ listen: 'test', script: { type: 'text/javascript', exec: checks } }], request: { method, url: '{{baseUrl}}' + path, auth: token ? { type: 'bearer', bearer: [{ key: 'token', value: `{{${token}}}`, type: 'string' }] } : { type: 'noauth' }, header: [...(raw ? [{ key: 'Content-Type', value: 'application/json' }] : []), ...(cookie ? [{ key: 'Cookie', value: cookie }] : [])], ...(raw && { body: { mode: 'raw', raw, options: { raw: { language: 'json' } } } }) }, ...(cookie && { protocolProfileBehavior: { disableCookies: true } }) };
  group.item.push(item); return item;
}
const saveId = name => [`pm.collectionVariables.set('${name}', pm.response.json().data.id);`];
const login = (name, email, password, token) => request(name, 'POST', '/api/login', 200, { email, password }, { token: null, code: [`pm.collectionVariables.set('${token}', pm.response.json().token);`, ...(token === 'accessToken' ? [`const cookie = pm.response.headers.get('Set-Cookie'); if (cookie) pm.collectionVariables.set('oldRefresh', cookie.split(';')[0]);`, `pm.test('Refresh cookie is HttpOnly', () => pm.expect(cookie).to.include('HttpOnly'));`, `if (pm.collectionVariables.get('baseUrl').startsWith('https://')) pm.test('Secure cookie', () => pm.expect(cookie).to.include('Secure'));`] : [])] });
folder('1. Health, accounts and role setup');
const first = request('Process health', 'GET', '/api/health', 200, undefined, { token: null });
first.event.unshift({ listen: 'prerequest', script: { exec: [`if (!pm.variables.get('adminEmail') || !pm.variables.get('adminPassword')) throw new Error('Set adminEmail/adminPassword for an existing administrator first.');`, `pm.collectionVariables.set('runId', Date.now().toString());`, `pm.collectionVariables.set('oversizeText', 'x'.repeat(6001));`] } });
login('Administrator login', '{{adminEmail}}', '{{adminPassword}}', 'adminToken');
for (const actor of ['owner', 'other', 'learner']) request(`Register ${actor}`, 'POST', '/api/register', 201, { username: `${actor}-{{runId}}`, email: `${actor}-{{runId}}@example.test`, password: '{{demoPassword}}' }, { token: null, code: [`pm.collectionVariables.set('${actor}Id', pm.response.json().id);`] });
for (const actor of ['owner', 'other']) request(`Promote ${actor} to editor`, 'PUT', `/api/users/{{${actor}Id}}/role`, 200, { role: 'editor' }, { token: 'adminToken' });
login('Second editor login', 'other-{{runId}}@example.test', '{{demoPassword}}', 'otherToken');
login('Learner login', 'learner-{{runId}}@example.test', '{{demoPassword}}', 'learnerToken');
login('Owner login', 'owner-{{runId}}@example.test', '{{demoPassword}}', 'accessToken');
request('Rotate refresh token', 'POST', '/api/refresh', 200, undefined, { token: null, code: [`pm.collectionVariables.set('accessToken', pm.response.json().token);`, `pm.test('Refresh rotates', () => pm.expect(pm.response.headers.get('Set-Cookie').split(';')[0]).not.to.eql(pm.collectionVariables.get('oldRefresh')));`] });
folder('2. All fifteen CRUD and LIST operations');
const moduleBody = { title: 'River decision practice', description: 'Practice river value bets and bluff catches.', display_order: 10 };
const quizBody = { module_id: '{{moduleId}}', title: 'River value quiz' };
const questionBody = { quiz_id: '{{quizId}}', text: 'A call of 25 makes a final pot of 100. Required equity?', explanation: '25 / 100 = 25 percent before later betting and rake.', options: [{ text: '25 percent', is_correct: true }, { text: '50 percent', is_correct: false }] };
for (const [kind, idVar, body] of [['modules', 'moduleId', moduleBody], ['quizzes', 'quizId', quizBody], ['questions', 'questionId', questionBody]]) {
  request(`Create ${kind}`, 'POST', `/api/v1/${kind}`, 201, body, { code: [...saveId(idVar), `pm.test('Location header', () => pm.expect(pm.response.headers.get('Location')).to.include('/api/v1/${kind}/'));`] });
  request(`Read ${kind}`, 'GET', `/api/v1/${kind}/{{${idVar}}}`);
  request(`Update ${kind}`, 'PUT', `/api/v1/${kind}/{{${idVar}}}`, 200, body);
  request(`List/filter ${kind}`, 'GET', `/api/v1/${kind}?page=1&limit=2${kind === 'quizzes' ? '&module_id={{moduleId}}' : kind === 'questions' ? '&quiz_id={{quizId}}&text=equity' : '&title=Poker'}`, 200, undefined, { code: [`pm.test('Pagination and hypermedia', () => { const r = pm.response.json(); pm.expect(r).to.have.property('pagination'); pm.expect(r._links).to.have.property('self'); });`] });
}
folder('3. Hierarchy and combined resources');
request('Module quizzes', 'GET', '/api/v1/modules/{{moduleId}}/quizzes');
request('Quiz questions', 'GET', '/api/v1/quizzes/{{quizId}}/questions');
request('Three-level hierarchy', 'GET', '/api/v1/modules/{{moduleId}}/quizzes/{{quizId}}/questions');
request('Learning overview', 'GET', '/api/v1/overview', 200, undefined, { code: [`pm.test('Five meaningful records per primary entity', () => { const r = pm.response.json(); for(const key of ['modules','quizzes','questions']) pm.expect(r[key]).to.be.at.least(5); });`] });
request('Other editor module', 'POST', '/api/v1/modules', 201, moduleBody, { token: 'otherToken', code: saveId('otherModuleId') });
request('Wrong parent relationship', 'GET', '/api/v1/modules/{{otherModuleId}}/quizzes/{{quizId}}/questions', 404);
folder('4. Learner-facing content endpoints');
request('Modules with lessons', 'GET', '/api/modules', 200, undefined, { code: [`const modules = pm.response.json(); const m = modules.find(m => m.lessons?.length && m.quizzes?.length); pm.expect(m).to.exist; pm.collectionVariables.set('lessonId', m.lessons[0].id); pm.collectionVariables.set('publishedQuizId', m.quizzes[0].id);`] });
request('Read lesson', 'GET', '/api/lessons/{{lessonId}}');
request('Read published quiz', 'GET', '/api/quizzes/{{publishedQuizId}}');
request('Situations', 'GET', '/api/scenarios', 200, undefined, { code: [`pm.expect(pm.response.json().length).to.be.above(0); pm.collectionVariables.set('scenarioId', pm.response.json()[0].id);`] });
request('Read situation', 'GET', '/api/scenarios/{{scenarioId}}');
folder('5. Input, identity and ownership failures');
request('Missing token', 'GET', '/api/v1/modules', 401, undefined, { token: null });
request('Missing resource', 'GET', '/api/v1/modules/999999999', 404);
request('Invalid ID', 'GET', '/api/lessons/not-a-number', 400);
request('Invalid page', 'GET', '/api/v1/modules?page=0', 400);
request('Invalid limit', 'GET', '/api/v1/questions?limit=101', 400);
request('Whitespace title', 'POST', '/api/v1/modules', 400, { ...moduleBody, title: '   ' });
request('Oversized description', 'POST', '/api/v1/modules', 400, { ...moduleBody, description: '{{oversizeText}}' });
request('Duplicate answers', 'POST', '/api/v1/questions', 400, { ...questionBody, options: [{ text: 'Same', is_correct: true }, { text: ' same ' }] });
for (const [kind, idVar, body] of [['modules', 'moduleId', moduleBody], ['quizzes', 'quizId', quizBody], ['questions', 'questionId', questionBody]]) {
  request(`Learner cannot create ${kind}`, 'POST', `/api/v1/${kind}`, 403, body, { token: 'learnerToken' });
  request(`Other editor cannot update ${kind}`, 'PUT', `/api/v1/${kind}/{{${idVar}}}`, 403, body, { token: 'otherToken' });
  request(`Other editor cannot delete ${kind}`, 'DELETE', `/api/v1/${kind}/{{${idVar}}}`, 403, undefined, { token: 'otherToken' });
}
request('Learner cannot change roles', 'PUT', '/api/users/{{learnerId}}/role', 403, { role: 'admin' }, { token: 'learnerToken' });
folder('6. Cleanup and token revocation');
for (const [kind, idVar] of [['questions', 'questionId'], ['quizzes', 'quizId'], ['modules', 'moduleId']]) request(`Delete ${kind}`, 'DELETE', `/api/v1/${kind}/{{${idVar}}}`, 204);
request('Delete second editor module', 'DELETE', '/api/v1/modules/{{otherModuleId}}', 204, undefined, { token: 'otherToken' });
request('Deleted question is absent', 'GET', '/api/v1/questions/{{questionId}}', 404);
request('Reused refresh token', 'POST', '/api/refresh', 401, undefined, { token: null, cookie: '{{oldRefresh}}' });
request('Replay invalidates access tokens', 'GET', '/api/v1/modules', 401);
login('Sign in again after replay', 'owner-{{runId}}@example.test', '{{demoPassword}}', 'accessToken');
request('Logout', 'POST', '/api/logout', 204, undefined, { token: null });
request('Access rejected after logout', 'GET', '/api/v1/modules', 401);
request('Refresh rejected after logout', 'POST', '/api/refresh', 401, undefined, { token: null, code: [`for (const key of ['accessToken','adminToken','otherToken','learnerToken','oldRefresh']) pm.collectionVariables.unset(key);`] });
fs.writeFileSync(new URL('../../docs/PokerLearn.postman_collection.json', import.meta.url), JSON.stringify(collection, null, 2) + '\n');
console.log(`Updated OpenAPI (${Object.keys(spec.paths).length} paths) and Postman (${collection.item.reduce((sum, f) => sum + f.item.length, 0)} requests).`);
