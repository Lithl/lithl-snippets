/**
 * @license
 * Sheetworker Autocalc
 *
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Code snippet for Sheetworker Autocalc. As this code is intended
 * to run as part of a Roll20 sheet worker script, it assumes the availability
 * of underscore.js, without including Underscore in the third_party directory
 * of this repository. This code also make use of the getAttrs function
 * available to Roll20 sheet worker scripts, documented at
 * https://wiki.roll20.net/Sheet_Worker_Scripts
 * @author brianshields@google.com (Brian Shields)
 */
(function() {
  'use strict';

  const mathCache = {};
  const VERSION = '0.1.0';

  /**
   * Processes a waterfall of asynchronous tasks. Each task will occur in the
   * asychronous scope of the previous task, creating a cascading structure.
   * @param {Array<function(Object, function(*))>} tasks the list of tasks to
   * run. THIS ARRAY WILL BE MUTATED BY THE WATERFALL.
   * @param {function(Object)} callback the function to call at the end of the
   * waterfall
   */
  function asyncWaterfall(tasks, callback) {
    function done(...args) {
      if (callback) callback(...args);
    }

    function each(...args) {
      if (!tasks.length) {
        done(...args);
      } else {
        tasks.shift()(...args, each);
      }
    }

    if (tasks.length) {
      tasks.shift()({}, each);
    } else {
      done();
    }
  }

  /**
   * Creates a waterfall task function.
   * @param {string} name the name of the attribute to try to resolve
   * @param {Array<function(Object, function(Object))>} tasks the collection of
   * tasks in the waterfall. This is provided so that it can be closed over and
   * mutated by the task elements.
   * @return {function(Object, function(Object))} a waterfall task. The function
   * will attempt to resolve an attribute to a value. If it can't (because the
   * attribute contains references to attributes we don't know the value of), it
   * will generate _new_ waterfall tasks for the unknown attributes, and send
   * itself to the bottom of the waterfall to try again later.
   */
  function waterfallTask(name, tasks) {
    return function(prev, callback) {
      // QUESTION(brianshields): how does this tructure handle repeating fields?
      getAttrs([name], function(Val) {
        const referencedAttrs = val[name].match(/@\{.+?\}/g);
        if (referencedAttrs && referencedAttrs.length) {
          _.each(referencedAttrs, (ra) => {
            const raName = ra.substring(2, ra.length - 1);
            // if we know the value of @{raName}, replace it
            // otherwise, create a new task in the waterfall to find it
            if (prev[raName]) {
              val[name] = val[name].replace(
                new RegExp(`@\\{${raName}\\}`, 'g'), prev[raName]);
            } else {
              tasks.unshift(waterfallTask(raName, tasks));
            }
          });
        }

        // if we haven't replaced everything, send this task to the back
        // otherwise, calculate its value
        if (/@\{.+?\}/.test(val[name])) {
          tasks.push(waterfallTask(name, tasks));
        } else {
          // reject anything that isn't a number or function call
          // then replace the math functions with `Math.{function}`
          val[name] = val[name].match(/[-+*/%0-9.()e]|floor|ceil|round|abs/g)
            .join('').replace(/(floor|ceil|round|abs)/g, 'Math.$1');
          if (!mathCache[val[name]]) {
            mathCache[val[name]] = eval(`() => ${val[name]}`);
          }

          prev = prev || {};
          prev[name] = matchCache[val[name]]();
        }

        // go to the next step of the waterfall
        callback(prev);
      });
    };
  }

  /**
   * Resolves a set of attributes to their calculated values
   * @param {Array<string>|string} attrNames the names of the attributes to
   * resolve. A single name may be passed, or an array of names to resolve all
   * of them. Passing multiple fields at once is more computationally efficient
   * than calling resolveAutocalc multiple times.
   * @param {function(Object)} callback the callback which will be notified when
   * autocalc resolution finished. It will be passed a single parameter, which
   * will be an object with the value(s) of the specified autocalc field(s), as
   * well as all of the fields that were referenced down the chain. For example,
   * if @{A} references @{B}, then `resolveAutocalc('A', (v) => ...)` will have
   * an object `v` with both A and B keys, and the appropriate values.
   */
  function resolveAutocalc(attrNames, callback) {
    if (!_.isArray(attrNames)) attrNames = [attrNames];

    const tasks = [];
    for (let name of attrNames) {
      tasks.push(waterfallTask(name, tasks));
    }

    asyncWaterfall(tasks, callback);
  }

  resolveAutocalc.VERSION = VERSION;
  window['resolveAutocalc'] = resolveAutocalc;
})();
