const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../belokurikha-room-catalog/booking-popup.js');
// A missing consent check, permissive response parsing or cross-origin POST
// must fail these tests. No requests are sent to a real lead endpoint.
test('standalone booking module exists', () => {
  assert(fs.existsSync(file), 'booking popup has not been implemented');
});
if (fs.existsSync(file)) {
  const {validate, normalizePhone, responseState, requestTarget, send} = require(file);
  test('name, plausible phone and explicit consent are all required', () => {
    assert.equal(validate({name:' ', phone:'+7 913 123-45-67', consent:true}).field, 'name');
    assert.equal(validate({name:'Анна', phone:'123', consent:true}).field, 'phone');
    assert.equal(validate({name:'Анна', phone:'call 79131234567', consent:true}).field, 'phone');
    assert.equal(validate({name:'Анна', phone:'+7 913 123-45-67', consent:false}).field, 'consent');
    assert.equal(validate({name:' Анна ', phone:'+7 913 123-45-67', consent:true}), null);
  });
  test('phone normalization does not lose the number', () => {
    assert.equal(normalizePhone('8 (913) 123-45-67'), '+79131234567');
    assert.equal(normalizePhone('9131234567'), '+79131234567');
    assert.equal(normalizePhone('+49 1512 3456789'), '+4915123456789');
    assert.equal(normalizePhone('+45 12345678'), '+4512345678');
    assert.equal(normalizePhone('+82 2 1234 5678'), '+82212345678');
  });
  test('HTTP 200 or an HTML error page are not proof of a successful request', () => {
    assert.equal(responseState(200, ''), 'unknown');
    assert.equal(responseState(200, '<html>Error</html>'), 'unknown');
    assert.equal(responseState(500, '{"success":true}'), 'unknown');
    assert.equal(responseState(200, '{"success":false}'), 'rejected');
    assert.equal(responseState(200, '{"done":true}'), 'accepted');
    assert.equal(responseState(200, '{"success":true}'), 'accepted');
    assert.equal(responseState(200, '{"success":"false"}'), 'unknown');
    assert.equal(responseState(200, '{"success":false,"done":true}'), 'unknown');
    assert.equal(responseState(200, '{"success":true,"done":false}'), 'unknown');
  });
  test('demo cannot send and live requests must stay on the authorized site', () => {
    assert.equal(requestTarget('demo', 'https://www.belokurikha-san.ru/nomera-temp/'), null);
    assert.equal(requestTarget('live', 'https://kirschmunk.github.io/Kurort-Food/'), null);
    assert.equal(requestTarget('live', 'http://www.belokurikha-san.ru/nomera-temp/'), null);
    assert.equal(requestTarget('live', 'https://www.belokurikha-san.ru/nomera-temp/'), 'https://www.belokurikha-san.ru/includes/theme-form.php');
  });
  test('demo submission never calls the transport', async () => {
    let calls = 0;
    const result = await send(null, {}, async () => { calls++; throw Error('unexpected request'); });
    assert.equal(result, 'demo'); assert.equal(calls, 0);
  });
  test('live submission uses the legacy field contract and selected room context', async () => {
    let calls = 0;
    const result = await send('https://www.belokurikha-san.ru/includes/theme-form.php', {
      name:' Анна ', phone:'8 (913) 123-45-67', consent:true,
      roomId:'11978', roomTitle:'Комфорт двухместный', url:'https://www.belokurikha-san.ru/nomera-temp/', agent:'test'
    }, async (url, options) => {
      calls++;
      assert.equal(url, 'https://www.belokurikha-san.ru/includes/theme-form.php');
      assert.equal(options.method, 'POST'); assert.equal(options.credentials, 'same-origin');
      assert.equal(options.body.get('name'), 'Анна'); assert.equal(options.body.get('phone'), '+79131234567');
      assert.equal(options.body.get('room_title'), 'Комфорт двухместный'); assert.equal(options.body.get('consent'), '1');
      assert.equal(options.body.get('url'), 'https://www.belokurikha-san.ru/nomera-temp/');
      return {status:200, text:async () => '{"success":true}'};
    });
    assert.equal(result, 'accepted'); assert.equal(calls, 1);
  });
  test('a lost response is ambiguous, not success and never automatically retried', async () => {
    let calls = 0;
    const result = await send('https://www.belokurikha-san.ru/includes/theme-form.php', {name:'Анна',phone:'9131234567',consent:true}, async () => { calls++; throw Error('network failure'); });
    assert.equal(result, 'unknown'); assert.equal(calls, 1);
  });
}
