const CronConverter = require('cron-converter');
const moment = require('moment-timezone');
const ms = require('pretty-ms');
const Promise = require('any-promise');
const lt = require('long-timeout');

let debug = () => {};

/*
 * Starts a cronjob.
 */

function cron(options, fn) {
  let crontime; let name; let started; let
    timer;
  init();
  return { stop, run, next };

  /*
   * Constructor.
   */

  function init() {
    if (!options || !options.on) {
      throw new Error('cron-scheduler: expected an options object with `on`');
    }

    if (typeof fn !== 'function') {
      throw new Error('cron-scheduler: expected function');
    }

    crontime = new CronConverter(options);
    crontime.fromString(options.on);
    name = options.name || fn.name || options.on;
    started = true;
    schedule();
  }

  /*
   * Sets a timer to run the next iteration.
   */

  function schedule() {
    const future = next();
    const delta = Math.max(future.diff(moment()), 1000);

    debug(`${name}: next run in ${ms(delta)
    } at ${future.format('llll Z')}`);

    if (timer) lt.clearTimeout(timer);
    timer = lt.setTimeout(run, delta);
  }

  /*
   * Returns the next scheduled iteration as a Moment date.
   */

  function next() {
    return crontime.schedule().next();
  }

  /*
   * Runs an iteration.
   */

  function run() {
    debug(`${name}: starting`);
    const start = new Date();
    Promise.resolve(fn())
      .then(() => {
        debug(`${name}: OK in ${ms(elapsed())}`);
        if (started) schedule();
      })
      .catch((err) => {
        debug(`${name}: FAILED in ${ms(elapsed())}`);
        throw err;
      });

    function elapsed() { return +new Date() - start; }
  }

  /*
   * ...in the name of love.
   */

  function stop() {
    if (timer) {
      lt.clearTimeout(timer);
      timer = undefined;
    }

    started = false;
  }
}

/*
 * Sets the debug function.
 */

cron.debug = (fn) => {
  debug = fn;
};

module.exports = cron;
