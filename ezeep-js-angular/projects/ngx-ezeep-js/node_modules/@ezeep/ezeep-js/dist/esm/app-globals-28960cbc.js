const appGlobalScript = async () => {
  const font = new FontFace('Inter', 'url(https://rsms.me/inter/font-files/Inter-roman.var.woff2)', {
    style: 'normal',
    weight: '400 600',
  });
  font.load().then(() => {
    document.fonts.add(font);
  });
};

const globalScripts = appGlobalScript;

export { globalScripts as g };
