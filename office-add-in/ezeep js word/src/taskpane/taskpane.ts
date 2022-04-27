/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/* global document, Office, Word */
let ezpPrinting: any;
let openAuthBtn: HTMLButtonElement;
let authorized: boolean = false;
let authSection: HTMLDivElement;

let file: File;
Office.onReady(async (info) => {
  if (info.host === Office.HostType.Word) {
    //authorized = await ezpPrinting.isAuthorized();
    ezpPrinting = document.querySelector("ezp-printing");
    openAuthBtn = document.querySelector("#openAuthBtn");
    authSection = document.querySelector("#authSection");
    if (authorized) {
      authSection.style.display = "none";
      ezpPrinting.style.display = "block";
    } else {
      ezpPrinting.style.display = "none";
      authSection.style.display = "block";
      openAuthBtn.addEventListener("click", openAuthDialog);
    }
  }
});

// To read the URL of the current file, you need to write a callback function that returns the URL.
// The following example shows how to:
// 1. Pass an anonymous callback function that returns the value of the file's URL
//    to the callback parameter of the getFilePropertiesAsync method.
// 2. Display the value on the add-in's page.
export function getFileUrl() {
  // Get the URL of the current file.
  Office.context.document.getFilePropertiesAsync(function (asyncResult) {
    const fileUrl = asyncResult.value.url;
    if (fileUrl == "") {
      showMessage("The file hasn't been saved yet. Save the file and try again");
    } else {
      showMessage(fileUrl);
    }
  });
}
function showMessage(message) {
  const messageElement = document.getElementById("message");
  messageElement.innerText = message;
}

export async function getFileAsPDF() {
  //Get the current file
  Office.context.document.getFileAsync(Office.FileType.Pdf, async (asyncResult: Office.AsyncResult<Office.File>) => {
    if (asyncResult.status === Office.AsyncResultStatus.Failed) {
      showMessage("Error: " + asyncResult.error.message);
    } else {
      //Get the file
      const file = asyncResult.value;
      let slicesReceived = 0,
        gotAllSlices = true,
        docdataSlices = [],
        sliceCount = file.sliceCount;

      // Get the file slices.
      await getSliceAsync(file, 0, sliceCount, gotAllSlices, docdataSlices, slicesReceived);
      file.closeAsync();
    }
  });
}

async function getSliceAsync(
  file: Office.File,
  nextSlice: number,
  sliceCount: number,
  gotAllSlices: boolean,
  docdataSlices: any[],
  slicesReceived: number
) {
  file.getSliceAsync(nextSlice, async (sliceResult) => {
    if (sliceResult.status === Office.AsyncResultStatus.Succeeded) {
      if (!gotAllSlices) {
        // Failed to get all slices, no need to continue.
        return;
      }

      // Got one slice, store it in a temporary array.
      // (Or you can do something else, such as
      // send it to a third-party server.)
      docdataSlices[sliceResult.value.index] = sliceResult.value.data;
      if (++slicesReceived == sliceCount) {
        // All slices have been received.

        file.closeAsync();
        await onGotAllSlices(docdataSlices);
      } else {
        getSliceAsync(file, ++nextSlice, sliceCount, gotAllSlices, docdataSlices, slicesReceived);
      }
    } else {
      gotAllSlices = false;
      file.closeAsync();
      showMessage(`getSliceAsync Error:${sliceResult.error.message}`);
    }
  });
}

async function onGotAllSlices(docdataSlices) {
  var docdata = [];
  for (var i = 0; i < docdataSlices.length; i++) {
    docdata = docdata.concat(docdataSlices[i]);
  }

  const finalPDF = new File([new Uint8Array(docdata)], "ezp_word_printing.pdf", { type: "application/pdf" });
  file = finalPDF;
  download(finalPDF);
}

function download(file) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(file);

  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

async function openAuthDialog() {
  const authUri = await ezpPrinting.getAuthUri();
  // open office dialog
  Office.context.ui.displayDialogAsync(authUri, { height: 300, width: 300 }, (result) => {
    const dialog = result.value;
    // process message from the dialog
    dialog.addEventHandler(Office.EventType.DialogMessageReceived, (arg: any) => {
      ezpPrinting.setAttribute('code', arg.message);
      dialog.close();
      ezpPrinting.style.display = "block";
      authSection.style.display = "none";
      ezpPrinting.open();
    })
  });
}
