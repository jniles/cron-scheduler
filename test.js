const test = require('tape');

function sandbox(fn) {
  const box = require('sinon').createSandbox(); // eslint-disable-line
  try { fn(box); } finally { box.restore(); }
}

/*
 * substitute for require() that will not cache its result, so it make be
 * re-required again in the future. we need this so that cron/moment will
 * pick up the sandboxed Date object.
 */
function rerequire(mod) {
  const keys = Object.keys(require.cache);
  const result = require(mod); // eslint-disable-line
  Object.keys(require.cache).forEach((key) => {
    if (keys.indexOf(key) === -1) delete require.cache[key];
  });
  return result;
}


test('cron', (t) => {
  sandbox((sinon) => {
    const clock = sinon.useFakeTimers();
    t.ok(+new Date() === 0, 'sinon timers is working');

    const cron = rerequire('./index');

    const job = cron({ on: '0 1 * * *', timezone: 'GMT' }, () => {
      t.pass('called');
      job.stop();
      t.end();
    });

    clock.tick(3600 * 1000);
  });
});

test('cron with long delay', (t) => {
  sandbox((sinon) => {
    const clock = sinon.useFakeTimers();
    t.ok(+new Date() === 0, 'sinon timers is working');
    const cron = rerequire('./index');

    // HACK sinon timers do not implement the 2147483647ms limit, but we need it to
    // make this test genuine we architect it in a way to have about three months
    // until the next execution
    let called = false;
    const job = cron({ on: '0 1 31 3 *', timezone: 'GMT' }, () => {
      t.fail('called');
      called = true;
    });

    clock.tick(3600 * 1000);
    if (!called) t.pass('not called');
    job.stop();
    t.end();
  });
});

test('cron timezones', (t) => {
  sandbox((sinon) => {
    const clock = sinon.useFakeTimers();
    const cron = rerequire('./index');

    // Asia/Manila is +0800 GMT, so this is 1AM GMT
    const job = cron({ on: '0 9 * * *', timezone: 'Asia/Manila' }, () => {
      t.pass('called');
      job.stop();
      t.end();
    });

    clock.tick(3600 * 1000);
  });
});

test('stop() works', (t) => {
  sandbox((sinon) => {
    const clock = sinon.useFakeTimers();
    const cron = rerequire('./index');

    t.plan(1);

    let called = 0;

    const job = cron({ on: '* * * * *' }, () => {
      called += 1;
      job.stop();
      t.equals(called, 1);
    });

    let i = 0;
    while (i <= 10) {
      clock.tick(1 * 1000);
      i += 1;
    }
  });
});
