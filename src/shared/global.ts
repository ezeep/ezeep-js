export default async () => {
  const font = new FontFace(
    'Inter',
    'url(https://rsms.me/inter/font-files/Inter-roman.var.woff2)',
    {
      style: 'normal',
      weight: '400 600',
    },
  )

  font
    .load()
    .then(() => {
      document.fonts.add(font)
    })
    .catch(() => {
      // The remote webfont is a progressive enhancement; if it can't be
      // fetched (offline, blocked, CI without egress) fall back silently.
    })
}
