import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const sourceRoot = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/'))
      specifier = new URL(specifier.slice(2), sourceRoot).href;
    if (
      (specifier.startsWith('file:') || specifier.startsWith('.')) &&
      context.parentURL
    ) {
      const url = new URL(specifier, context.parentURL);
      if (existsSync(fileURLToPath(url) + '.ts')) specifier = url.href + '.ts';
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(sourceRoot.href) && url.endsWith('.ts'))
      return {
        format: 'module',
        shortCircuit: true,
        source: stripTypeScriptTypes(readFileSync(fileURLToPath(url), 'utf8'), {
          mode: 'transform',
        }),
      };
    return next(url, context);
  },
});
let lastRequest;
mock.module(new URL('shared/api/request-json.ts', sourceRoot).href, {
  namedExports: {
    requestJson: async (_, request) => {
      lastRequest = request;
      return request;
    },
  },
});
mock.module(new URL('shared/api/api-client.ts', sourceRoot).href, {
  namedExports: {
    apiClient: {
      delete: async (url) => {
        lastRequest = { method: 'DELETE', url };
      },
    },
  },
});
const schema =
  await import('../src/features/restaurants/types/restaurant.schema.ts');
const api =
  await import('../src/features/restaurants/services/restaurant.service.ts');
const { mapHtml, mapMessageSchema } =
  await import('../src/features/restaurants/utils/restaurant-map.ts');
const { VN_WARDS } =
  await import('../src/features/restaurants/data/vn-wards.ts');
const { VN_PROVINCE_CODES } =
  await import('../src/features/restaurants/data/vn-provinces.ts');
const { requiredProofKinds } =
  await import('../src/features/restaurants/utils/onboarding.ts');
const uuid = '9ad64a35-cead-483b-8322-a0c9aaf26c32';
const { authReturnTo } = await import('../src/features/auth/utils/return-to.ts');
test('login returns to the selected restaurant and rejects external or malformed restaurant destinations', () => {
  assert.equal(authReturnTo(`/restaurants/${uuid}`), `/restaurants/${uuid}`);
  assert.equal(authReturnTo('/pages'), '/pages');
  for (const path of ['https://evil.example/restaurants', '//evil.example', '/restaurants/../me', `/restaurants/${uuid}?redirect=https://evil.example`]) assert.equal(authReturnTo(path), '/explore');
});
const { canRemoveWorkspaceMember } =
  await import('../src/features/restaurants/utils/permissions.ts');
test('member controls follow owner/manager permissions and require switching back before leaving the active page', () => {
  const owner = { role: 'OWNER', pageUserId: 'page' };
  const manager = { ...owner, role: 'MANAGER' };
  const self = { role: 'MANAGER', userId: 'person' };
  assert.equal(
    canRemoveWorkspaceMember(
      owner,
      { role: 'OWNER', userId: 'person' },
      'person',
      null
    ),
    false
  );
  assert.equal(
    canRemoveWorkspaceMember(
      owner,
      { ...self, userId: 'other' },
      'person',
      null
    ),
    true
  );
  assert.equal(
    canRemoveWorkspaceMember(
      manager,
      { ...self, userId: 'other' },
      'person',
      null
    ),
    false
  );
  assert.equal(canRemoveWorkspaceMember(manager, self, 'person', null), true);
  assert.equal(
    canRemoveWorkspaceMember(manager, self, 'page', 'person'),
    false
  );
  assert.equal(
    canRemoveWorkspaceMember(manager, self, 'other-page', 'person'),
    true
  );
});
const { parseRestaurantCoordinates } =
  await import('../src/features/restaurants/utils/location.ts');
test('manual coordinates accept copied map pairs and reject missing, non-finite and out-of-range values', () => {
  assert.deepEqual(parseRestaurantCoordinates(' 10.7769, 106.7009 '), {
    latitude: 10.7769,
    longitude: 106.7009,
  });
  assert.deepEqual(parseRestaurantCoordinates('-10; -106'), {
    latitude: -10,
    longitude: -106,
  });
  for (const text of [
    '',
    'NaN, 106',
    'Infinity, 10',
    '106,10',
    '10,181',
    '10',
    ',106',
  ])
    assert.throws(() => parseRestaurantCoordinates(text));
});
function application(entityType = 'INDIVIDUAL') {
  return {
    name: '  Quán chay  ',
    username: ' AN.LAC ',
    bio: '',
    address: '12 Nguyễn Huệ',
    location: { longitude: 106.7, latitude: 10.77 },
    provinceCode: '79',
    wardCode: VN_WARDS['79'][0][0],
    businessForm: 'RESTAURANT',
    vegetarianLevel: 'VEGAN',
    phone: '0901234567',
    website: '',
    otherPlatformUrls: [{ url: 'https://example.com' }],
    legal: {
      entityType,
      taxCode: entityType === 'INDIVIDUAL' ? '012345678901' : '0312345678',
      legalName: entityType === 'INDIVIDUAL' ? '' : 'Công ty Chay',
      legalAddress: '12 Nguyễn Huệ',
      representativeName: 'Nguyễn An',
      contactEmail: ' an@example.com ',
    },
    statement: '',
    proofs: requiredProofKinds(entityType).map((kind, i) => ({
      kind,
      id: uuid.slice(0, -1) + i,
      uri: 'file:///proof.jpg',
    })),
    confirmsAccuracy: true,
    consentsToReview: true,
  };
}
test('new application matches the latest three-step backend contract and flattens location and uploads', async () => {
  await api.saveApplication(application());
  assert.equal(lastRequest.url, '/workspaces');
  assert.equal(lastRequest.data.username, 'an.lac');
  assert.equal(lastRequest.data.name, 'Quán chay');
  assert.equal(lastRequest.data.longitude, 106.7);
  assert.equal(lastRequest.data.legal.legalName, null);
  assert.equal(lastRequest.data.legal.contactEmail, 'an@example.com');
  assert.deepEqual(lastRequest.data.otherPlatformUrls, ['https://example.com']);
  assert.equal(lastRequest.data.proofIds.length, 3);
  for (const key of ['location', 'proofs'])
    assert.equal(key in lastRequest.data, false);
  await api.saveApplication(application('COMPANY'), uuid);
  assert.equal(lastRequest.url, `/workspaces/${uuid}/resubmit`);
  assert.equal(lastRequest.data.proofIds.length, 4);
  await assert.rejects(
    api.saveApplication({ ...application(), wardCode: 'not-a-ward' }),
    /không thuộc/
  );
});
test('applications require correct legal identity, commitments, categorized proofs and valid coordinates', () => {
  for (const input of [
    { ...application(), confirmsAccuracy: false },
    { ...application(), consentsToReview: false },
    { ...application(), location: null },
    { ...application(), location: { latitude: 91, longitude: 106 } },
    { ...application(), proofs: [] },
    { ...application(), provinceCode: 'bad' },
    { ...application(), phone: '123' },
    { ...application(), legal: { ...application().legal, taxCode: '123' } },
    {
      ...application('COMPANY'),
      legal: { ...application('COMPANY').legal, legalName: '' },
    },
    { ...application('COMPANY'), proofs: application().proofs },
    {
      ...application(),
      proofs: [...application().proofs, application().proofs[0]],
    },
  ])
    assert.equal(schema.workspaceFormSchema.safeParse(input).success, false);
  assert.equal(
    schema.workspaceFormSchema.safeParse(application('HOUSEHOLD')).success,
    true
  );
  assert.equal(VN_PROVINCE_CODES.length, 34);
  for (const code of VN_PROVINCE_CODES) assert.ok(VN_WARDS[code].length > 0);
});
test('dish payload preserves free versus contact price, availability, position and edit/delete paths', async () => {
  const input = {
    name: '  Phở chay ',
    description: '',
    category: 'Món nước',
    priceText: '0',
    imageUrl: null,
    isAvailable: false,
    position: 2,
  };
  await api.saveDish(uuid, input, uuid);
  assert.equal(lastRequest.method, 'PATCH');
  assert.equal(lastRequest.url, `/workspaces/${uuid}/menu/${uuid}`);
  assert.equal(lastRequest.data.priceVnd, 0);
  assert.equal(lastRequest.data.description, null);
  assert.equal(lastRequest.data.position, 2);
  assert.equal(lastRequest.data.isAvailable, false);
  await api.saveDish(uuid, { ...input, priceText: '' });
  assert.equal(lastRequest.data.priceVnd, null);
  for (const priceText of ['-1', '1.5', '100000001', 'abc'])
    assert.throws(() => api.saveDish(uuid, { ...input, priceText }));
  assert.throws(() => api.saveDish(uuid, { ...input, position: -1 }));
  await api.deleteDish(uuid, uuid);
  assert.equal(lastRequest.url, `/workspaces/${uuid}/menu/${uuid}`);
});
test('menu photos and categorized proof uploads enforce different size limits', async () => {
  await api.requestImage(
    { contentType: 'image/png', sizeBytes: 10 * 1024 * 1024 },
    undefined,
    'ID_FRONT'
  );
  assert.equal(lastRequest.url, '/workspaces/proofs/uploads');
  assert.equal(lastRequest.data.kind, 'ID_FRONT');
  assert.throws(() =>
    api.requestImage(
      { contentType: 'image/png', sizeBytes: 5 * 1024 * 1024 + 1 },
      uuid
    )
  );
  assert.throws(() =>
    api.requestImage({ contentType: 'image/gif', sizeBytes: 1 }, uuid)
  );
  assert.throws(() =>
    api.requestImage({ contentType: 'image/jpeg', sizeBytes: 0 }, uuid)
  );
  assert.throws(() =>
    api.requestImage(
      { contentType: 'image/png', sizeBytes: 1 },
      undefined,
      'bad'
    )
  );
});
test('review validation and endpoint verbs implement create/update/delete without writing another reviewer', async () => {
  await api.saveReview(uuid, { rating: 5, comment: '  Ngon  ' });
  assert.equal(lastRequest.url, `/restaurants/${uuid}/reviews/me`);
  assert.equal(lastRequest.method, 'PUT');
  assert.equal(lastRequest.data.comment, 'Ngon');
  for (const rating of [0, 6, 1.5])
    assert.throws(() => api.saveReview(uuid, { rating, comment: '' }));
  assert.throws(() =>
    api.saveReview(uuid, { rating: 5, comment: 'a'.repeat(1001) })
  );
  await api.deleteReview(uuid);
  assert.equal(lastRequest.method, 'DELETE');
  await api.getReviews(uuid, 'highest', 2);
  assert.deepEqual(lastRequest.params, { sort: 'highest', page: 2, limit: 10 });
});
test('discovery and search use backend coordinates/cursor; members use workspace paths', async () => {
  await api.getRestaurants({ longitude: 106, latitude: 10 });
  assert.deepEqual(lastRequest.params, { userLng: 106, userLat: 10 });
  await api.searchDishes('phở', 'opaque-cursor');
  assert.equal(lastRequest.params.cursor, 'opaque-cursor');
  await api.getMenu(uuid, false);
  assert.equal(lastRequest.url, `/restaurants/${uuid}/menu`);
  await api.getMenu(uuid, true);
  assert.equal(lastRequest.url, `/workspaces/${uuid}/menu`);
  await api.addMember(uuid, '  An.Nguyen  ');
  assert.equal(lastRequest.data.username, 'an.nguyen');
  await api.removeMember(uuid, uuid);
  assert.equal(lastRequest.url, `/workspaces/${uuid}/members/${uuid}`);
  assert.throws(() => api.getWorkspace('../other'));
});
test('map escapes restaurant data and only accepts finite, bounded coordinate messages', () => {
  const html = mapHtml({
    restaurants: [
      {
        name: '</script><script>alert(1)</script>',
        pageUserId: uuid,
        longitude: 106,
        latitude: 10,
      },
    ],
  });
  assert.equal(html.includes('</script><script>alert(1)'), false);
  assert.equal(html.includes('label.textContent=r.name'), true);
  assert.equal(
    mapMessageSchema.safeParse({ type: 'pick', longitude: 181, latitude: 10 })
      .success,
    false
  );
  assert.equal(
    mapMessageSchema.safeParse({
      type: 'pick',
      longitude: Infinity,
      latitude: 10,
    }).success,
    false
  );
  assert.equal(
    mapMessageSchema.safeParse({ type: 'pick', longitude: 106, latitude: 10 })
      .success,
    true
  );
});
test('map updates markers without recreating the map or resetting zoom when a pin is moved', () => {
  const sent = [];
  const layers = [];
  const mapEvents = {};
  let builds = 0,
    pans = 0;
  const map = {
    setView() {
      return this;
    },
    fitBounds() {},
    panTo() {
      pans++;
    },
    removeLayer() {},
    on(event, handler) {
      mapEvents[event] = handler;
      return this;
    },
  };
  const L = {
    featureGroup() {
      return {
        getBounds() {
          return {};
        },
      };
    },
    map() {
      builds++;
      return map;
    },
    tileLayer() {
      return {
        on() {
          return this;
        },
        addTo() {},
      };
    },
    layerGroup() {
      return {
        addTo() {
          return this;
        },
        clearLayers() {
          layers.length = 0;
        },
        getLayers() {
          return layers;
        },
      };
    },
    marker(point) {
      return {
        point,
        events: {},
        dragging: { enable() {}, disable() {} },
        addTo(target) {
          if (target !== map) layers.push(this);
          return this;
        },
        bindTooltip() {
          return this;
        },
        on(event, handler) {
          this.events[event] = handler;
          return this;
        },
        getLatLng() {
          return this.point;
        },
        setLatLng(point) {
          this.point = point;
        },
      };
    },
    latLng(lat, lng) {
      return {
        lat,
        lng,
        equals(point) {
          return point?.lat === lat && point?.lng === lng;
        },
      };
    },
  };
  const window = {
    L,
    ReactNativeWebView: {
      postMessage(message) {
        sent.push(JSON.parse(message));
      },
    },
    addEventListener() {},
  };
  const html = mapHtml({
    point: { latitude: 10, longitude: 106 },
    editable: true,
  });
  const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
  runInNewContext(script, {
    window,
    L,
    document: {
      createElement() {
        return {};
      },
      getElementById() {
        return { style: {} };
      },
    },
  });
  mapEvents.click({ latlng: L.latLng(11, 107) });
  assert.deepEqual(sent[0], { type: 'pick', longitude: 107, latitude: 11 });
  window.updateRestaurantMap({
    point: { latitude: 11, longitude: 107 },
    editable: true,
  });
  assert.equal(pans, 0);
  window.updateRestaurantMap({
    restaurants: [
      { latitude: 12, longitude: 108, pageUserId: uuid, name: 'Quán' },
    ],
    editable: false,
  });
  layers[0].events.click();
  assert.deepEqual(sent[1], { type: 'select', id: uuid });
  mapEvents.click({ latlng: L.latLng(12, 108) });
  assert.equal(sent.length, 2);
  assert.equal(builds, 1);
});
