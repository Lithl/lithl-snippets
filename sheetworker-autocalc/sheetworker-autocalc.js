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
  const VERSION = '0.0.1';
  
  /**
   * Resolves a set of attributes to their calculated values
   * @param {!Array<string>} attrNames the names of the attributes to resolve
   * @returns {Promise} a Promise which, when resolved, will provide the values
   * of the requested attributes.
   */
  function resolveAutocalc(attrNames) {
    return new Promise(function(resolve) {
      getAttrs(attrNames, function(values) {
        const promises = [];
        
        _.each(values, (attrVal, attrName) => {
          const referencedAttrs = attrVal.match(/@\{.+?\}/g);
          let prom;
          if (referencedAttrs.length > 0) {
            // prom.then gives attrVal with @{attr} references replaced
            prom = resolveAutocalc(_.map(referencedAttrs,
                (ref) => ref.substring(2, ref.length - 1)))
              .then(function(referencedVals) {
                return new Promise(function(resolve) {
                  let result = attrVal;
                  _.each(referencedVals, (val, key) => {
                    let regex = new RegExp(`@\\{${key}\\}`, 'g');
                    result = result.replace(regex, val);
                  });
                  resolve({
                    name: attrName,
                    value: result,
                  });
                });
              });
          } else {
            // prom.then gives attrVal, since it has no @{attr} references
            prom = new Promise(function(resolve) {
              resolve({
                name: attrName,
                value: attrVal,
              });
            });
          }
          
          promises.push(prom);
        });
        
        Promise.all(promises)
          .then((mathData) => {
            const results = {};
            _.each(mathData, (data) => {
              // convert data.value to eval-able format
              data.value = data.value.match(
                  /[-+*/%0-9.()]|floor|ceil|round|abs/g).join('')
                .replace(/(floor|ceil|round|abs)/g, 'Math.$1');
              // use cache or eval data.value into a function
              if (!mathCache[data.value]) {
                mathCache[data.value] = eval(`() => ${data.value}`);
              }
              results[data.name] = mathCache[data.value]();
            });
            
            resolve(result);
          });
      });
    });
  }
  
  resolveAutocalc.VERSION = VERSION;
  window['resolveAutocalc'] = resolveAutocalc;
})();