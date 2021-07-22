/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;
const e = up.element;

up.FieldObserver = class FieldObserver {

  constructor(fieldOrFields, options, callback) {
    this.scheduleValues = this.scheduleValues.bind(this);
    this.isNewValues = this.isNewValues.bind(this);
    this.callback = callback;
    this.fields = e.list(fieldOrFields);
    this.delay = options.delay;
    this.batch = options.batch;
  }

  start() {
    this.scheduledValues = null;
    this.processedValues = this.readFieldValues();
    this.currentTimer = undefined;
    this.callbackRunning = false;
    // Although (depending on the browser) we only need/receive either input or change,
    // we always bind to both events in case another script manually triggers it.
    return this.unbind = up.on(this.fields, 'input change', () => this.check());
  }

  stop() {
    this.unbind();
    return this.cancelTimer();
  }

  cancelTimer() {
    clearTimeout(this.currentTimer);
    return this.currentTimer = undefined;
  }

  scheduleTimer() {
    this.cancelTimer();
    return this.currentTimer = u.timer(this.delay, () => {
      this.currentTimer = undefined;
      return this.requestCallback();
    });
  }

  scheduleValues(values) {
    this.scheduledValues = values;
    return this.scheduleTimer();
  }

  isNewValues(values) {
    return !u.isEqual(values, this.processedValues) && !u.isEqual(this.scheduledValues, values);
  }

  requestCallback() {
    if ((this.scheduledValues !== null) && !this.currentTimer && !this.callbackRunning) {
      const diff = this.changedValues(this.processedValues, this.scheduledValues);
      this.processedValues = this.scheduledValues;
      this.scheduledValues = null;
      this.callbackRunning = true;

      const callbackReturnValues = [];
      if (this.batch) {
        callbackReturnValues.push(this.callback(diff));
      } else {
        for (let name in diff) {
          const value = diff[name];
          callbackReturnValues.push(this.callback(value, name));
        }
      }

      const callbacksDone = u.allSettled(callbackReturnValues);

      return callbacksDone.then(() => {
        this.callbackRunning = false;
        return this.requestCallback();
      });
    }
  }

  changedValues(previous, next) {
    const changes = {};
    let keys = Object.keys(previous);
    keys = keys.concat(Object.keys(next));
    keys = u.uniq(keys);
    for (let key of keys) {
      const previousValue = previous[key];
      const nextValue = next[key];
      if (!u.isEqual(previousValue, nextValue)) {
        changes[key] = nextValue;
      }
    }
    return changes;
  }

  readFieldValues() {
    return up.Params.fromFields(this.fields).toObject();
  }

  check() {
    const values = this.readFieldValues();
    if (this.isNewValues(values)) { return this.scheduleValues(values); }
  }
};
