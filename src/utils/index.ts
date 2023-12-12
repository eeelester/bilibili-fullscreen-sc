/**
 * @description: 更改icon图标，根据state改为able和disable
 * @param {boolean} switchState
 * @return {*}
 */
function changeIcon(switchState: boolean) {
  if (switchState) {
    void chrome.action.setIcon({
      path: {
        16: '/icons/icon-able-16.png',
        32: '/icons/icon-able-32.png',
        48: '/icons/icon-able-48.png',
      },
    })
  }
  else {
    void chrome.action.setIcon({
      path: {
        16: '/icons/icon-16.png',
        32: '/icons/icon-32.png',
        48: '/icons/icon-48.png',
      },
    })
  }
}

export { changeIcon }
