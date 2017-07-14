/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// client id and client secret values can be obtained from
// https://www.fimfiction.net/developers/api/v2/docs/applications
var CLIENT_ID = 'YOUR CLIENT ID';
var CLIENT_SECRET = 'YOUR CLIENT SECRET';
var AUTH_URI = 'https://www.fimfiction.net/authorize-app';
// script id is the string of characters in the project url:
// https://script.google.com/a/google.com/d/{script id}/edit?usp=drive_web
var REDIRECT_URI = 'https://script.google.com/macros/d/SCRIPT ID/usercallback';
var TOKEN_URI = 'https://www.fimfiction.net/api/v2/token';

/**
 * Called when a document with this add-on installed is opened. Adds the menu
 * "Add-ons > YOUR ADD-ON NAME > Execute Action" to the document menu, which
 * will call the execute() function when selected.
 * Unfortunately, there is no means to add any kind of shortcut keys to the
 * menu item.
 * @param {Event} e the event object; ignored
 */
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
      .addItem('Execute Action', 'execute')
      .addToUi();
}

/**
 * Called when an open document has this add-on installed. Calls onOpen so the
 * user doesn't have to close and re-open the document ater installing in order
 * to access the add-on's features
 * @param {Event} e the event object
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Called when the user selects "Add-ons > YOUR ADD-ON NAME > Execute Action"
 * from the menu. If the user has granted the add-on access to FimFiction data,
 * it will throw up an array of story titles by the user (published and
 * unpublished) in the Logger dialog. (Hit Ctrl+Enter from the script page to
 * view.) If the user has not granted access, the Logger dialog will have a url
 * the user needs to visit to grant access.
 */
function execute() {
  const service = getService();
  if (!service.hasAccess()) {
    Logger.log('Open this url to authorize the app: %s', authorizationUrl);
  } else {
    const user = service.getToken_().user;
    const api = 'https://www.fimfiction.net/api/v2/users/'
        + user.id + '/stories';
    const options = {
      headers: { Authorization: 'Bearer ' + service.getAccessToken() },
      method: 'GET',
      muteHttpExceptions: true,
    };
    const response = UrlFetchApp.fetch(api, options);
    const json = JSON.parse(response.getContentText());
    const stories = _.map(json.data, function(s) {
      return s.attributes.title;
    });
    Logger.log(stories);
  }
}

/**
 * Builds the OAuth service object
 * @return {Service_} the service object, used for all phases of the OAuth2
 * authentication flow.
 */
function getService() {
  const cache = CacheService.getUserCache();
  if (!cache.get('state')) {
    cache.put('state',
        ScriptApp.newStateToken().withMethod('authCallback').createToken());
  }
  return OAuth2.createService('fimfiction')
      .setAuthorizationBaseUrl(AUTH_URI)
      .setTokenUrl(TOKEN_URI)
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)
      // note: setCallbackFunction is required by the library, but gets
      // overridden by the withMethod field of the state token
      .setCallbackFunction('authCallback')
      .setPropertyStore(PropertiesService.getUserProperties())
      // space-separated list of scopes you need for your app
      .setScope('read_stories')
      .setParam('response_type', 'code')
      .setParam('redirect_uri', REDIRECT_URI)
      .setParam('state', cache.get('state'));
}

/**
 * Called when the user hits REDIRECT_URI after passing through FimFiction's
 * authentication page.
 * @param {Object} request the request object. Of note, request.parameter.code
 * is the request token, used to generate the access token (OAuth2 library will
 * do this automatically for you with Service_.prototype.handleCallback), and
 * you should check that request.parameter.state is equal to the state value
 * passed to the OAuth earlier.
 * @return {HtmlOutput} the landing page shown to the user after the auth is
 * complete. In an actual app, you will probably want to use
 * createHtmlOutputFromFile to have a full page, instead of a single line of
 * text.
 */
function authCallback(request) {
  const state = request.parameter.state;
  const cache = CacheService.getUserCache();

  var isAuthorized = true;
  if (state !== cache.get('state')) {
    isAuthorized = false;
  }

  const service = getService();
  cache.remove('state');
  try { isAuthorized &= service.handleCallback(request); }
  catch (e) {
    isAuthorized = false;
    console.log(e);
  }

  return HtmlService.createHtmlOutput(
      (isAuthorized ? 'Success!' : 'Denied!') + ' You may close this window.');
}
