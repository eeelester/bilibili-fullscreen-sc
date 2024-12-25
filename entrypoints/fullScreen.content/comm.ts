export let switchState: boolean = true

export function popUpOnMessage() {
  // 监听popup信息
  browser.runtime.onMessage.addListener((request: { switchState: boolean }, _, sendResponse: (str: string) => void) => {
    switchState = request.switchState
    sendResponse('content got!')
  })
}
