import test from 'node:test';
import assert from 'node:assert/strict';
import { updateUrls, validateUrls, publicRedirects } from '../docs/helpcenter/lib/urls.mjs';
import { resolveRedirect } from './help-url-redirects.mjs';
const page = {id: 'stable', slug: 'first', status: 'published'};
test('renames preserve every historical URL without redirect chains, and allow reclaiming own alias', () => {
  const second = {...page, slug: 'second'};
  let redirects = updateUrls([page], [second], []);
  const third = {...page, slug: 'third'};
  redirects = updateUrls([second], [third], redirects);
  assert.deepEqual(publicRedirects([third], redirects), {'/help/first': '/help/third', '/help/second': '/help/third'});
  redirects = updateUrls([third], [page], redirects);
  assert.deepEqual(publicRedirects([page], redirects), {'/help/second': '/help/first', '/help/third': '/help/first'});
});
test('reserved routes, duplicate slugs, live URL shadowing, invalid sources and unpublished targets fail', () => {
  for (const slug of ['guides','nachschlagen','themen','bearbeiten','verwalten','was-ist-neu','../secret','//external','Upper','a--b','a?b','a#b','a/child','', 'a'.repeat(101)]) {
    assert.throws(() => validateUrls([{...page, slug}], []));
    assert.throws(() => validateUrls([page], [{from: slug, targetId: page.id}]));
  }
  assert.throws(() => validateUrls([{...page,slug:'en'}], [], ['en']));
  assert.throws(() => validateUrls([page, {...page,id:'other'}], []));
  assert.throws(() => validateUrls([page], [{from:'first',targetId:'stable'}]));
  assert.throws(() => validateUrls([page], [{from:'old',targetId:'absent'}]));
  assert.throws(() => validateUrls([{...page,status:'draft'}], [{from:'old',targetId:'stable'}]));
  assert.throws(() => validateUrls([page], [{from:'old',targetId:'stable'},{from:'old',targetId:'stable'}]));
});
test('draft renames do not create public redirects; aliases cannot become another page URL', () => {
  assert.deepEqual(updateUrls([{...page,status:'draft'}], [{...page,status:'draft',slug:'draft'}], []), []);
  assert.throws(() => updateUrls([page], [{...page,slug:'second'},{id:'other',slug:'old'}], [{from:'old',targetId:'stable'}]));
});
test('request redirects preserve query, support trailing slash and Markdown, and reject external targets', () => {
  const routes = {'/help/old':'/help/current'};
  assert.equal(resolveRedirect('/help/old/?q=value', routes), '/help/current?q=value');
  assert.equal(resolveRedirect('/helpcenter/markdown/old.md?download=1', routes), '/helpcenter/markdown/current.md?download=1');
  assert.equal(resolveRedirect('/help/nope', routes), null);
  assert.equal(resolveRedirect('/help/old', {'/help/old':'//external.com'}), null);
  assert.equal(resolveRedirect('/help/toString', {}), null);
  assert.deepEqual(publicRedirects([page], [{from:'old',targetId:'stable'}], '/help/en'), {'/help/en/old':'/help/en/first'});
});
