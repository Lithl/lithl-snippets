# FimFiction API OAuth flow for Google Apps Script
This sample demonstrates the OAuth flow necessary for connecting a Google Apps
script to the new FimFiction API. This sample has minimal actual functionality,
and though it assumes it will be deployed as an add-on (features of GAS such as
`DocumentApp.getUi()` are only available to add-ons), what little functionality
it does have is only accessible in developer logs.

## Running the sample
First, you must obtain a client id and client secret for your app. As of this
writing, this can only be obtained by directly messaging knighty. Add your id
and secret to lines 19 and 20 of `Code.gs`, respectively, and add your project's
script id to line 24.

From your script, select `Publish > Test as add-on`, and select a document to
test with (you can test with an empty document). When you start the test, your
document will open in a new window with your unpublished add-on installed.

From your document, select `Add-ons > Your Script Name > Execute Action`.
Nothing of substance will happen in the document. Open the window with your
script, and press `Ctrl+Enter` or `View > Logs`, and you will be presented with
a url that you need to visit.

Visit the url in a new window, and accept (or reject) the proposed permissions.
You will be redirected to a page with a single line of text, and you can close
the window.

Back in your document, select the "Execute Action" menu item again. Nothing of
substance will happen in the document. Open the window with your script, and
view the logs again. You will be presented with a list of all of your published
and unpublished stories on FimFiction.

## Extending the sample
Obviously, the sample doesn't do much, and what it does doesn't really interact
with the document it's installed on. Some simple extensions to the script
include putting the authorization link in a sidebar or pop-up dialog, instead of
the script's log, and making the redirect page more than just a line of text.
(In fact, if the user opens the auth url from a link/button in the doc, the
redirect page can close itself with `top.close()` in some JavaScript on the
page.)

See the [FimFiction API Documentation] and [Google Apps Script Documentation]
for more information on what information you can send to and receive from
FimFiction, and what you can do within the apps script environment.

[FimFiction API Documentation]: https://www.fimfiction.net/developers/api/v2/docs
[Google Apps Script Documentation]: https://developers.google.com/apps-script/
