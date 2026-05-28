function wipeBuffer(buf) {
  if (!buf || buf.length === 0) return
  buf.fill(0)
}

function wipeObject(obj, keys) {
  if (!obj) return
  for (const key of keys) {
    if (obj[key] && typeof obj[key] === 'object' && 'fill' in obj[key]) {
      wipeBuffer(obj[key])
    }
    obj[key] = undefined
  }
}

export { wipeBuffer, wipeObject }
