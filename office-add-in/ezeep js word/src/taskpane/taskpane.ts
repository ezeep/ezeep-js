/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/* global document, Office, Word */

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {

    document.getElementById("run").onclick = run;
    document.getElementById("getfileurl").onclick = getFileUrl;
    const ezpPrinting: any = document.querySelector('ezp-printing');
    ezpPrinting.open();
  }
});

export async function run() {
  return Word.run(async (context) => {
    /**
     * Insert your Word code here
     */

    // insert a paragraph at the end of the document.
    const paragraph = context.document.body.insertParagraph("Hello World", Word.InsertLocation.end);

    // change the paragraph color to blue.
    paragraph.font.color = "blue";

    await context.sync();
  });
}

// To read the URL of the current file, you need to write a callback function that returns the URL.
// The following example shows how to:
// 1. Pass an anonymous callback function that returns the value of the file's URL
//    to the callback parameter of the getFilePropertiesAsync method.
// 2. Display the value on the add-in's page.
export function getFileUrl() {
  // Get the URL of the current file.
  Office.context.document.getFilePropertiesAsync(function (asyncResult) {
      var fileUrl = asyncResult.value.url;
      if (fileUrl == "") {
          showMessage("The file hasn't been saved yet. Save the file and try again");
      }
      else {
          showMessage(fileUrl);
      }
  });
}
function showMessage(message) {
  const messageElement = document.getElementById("message");
  messageElement.innerText = message;
}