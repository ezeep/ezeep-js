// nö dnake

Office.onReady(async (info) => {
  sendCodeToAddin();
});

const sendCodeToAddin = async () => {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (code) {
    Office.context.ui.messageParent(code);
  }
}
