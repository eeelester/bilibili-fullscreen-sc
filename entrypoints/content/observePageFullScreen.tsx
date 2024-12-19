import { getVideoDom, mount, unmount } from './utils'
import { ALREADY_HAVE_IT } from './const'

let resizeObserver: ResizeObserver | null

export default function ObservePageFullScreen() {
  // video出现的时机
  function loop() {
    const video = getVideoDom()
    if (video) {
      listenVideoSizeChange(video)
      // 如果切换清晰度，会销毁原本的video，然后新增video，所以原本在之前的video监听宽度已经没用了，需要重新监听
      monitorVideo(video)
    }
    else {
      window.requestAnimationFrame(loop)
    }
  }

  window.requestAnimationFrame(loop)
}

function listenVideoSizeChange(video: HTMLVideoElement) {
  let lastTimePageFullScreen = false
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      console.log('resizeObserver', entry)
      if (entry.contentRect) {
        const videoWidth = entry.contentRect?.width
        if (videoWidth === window.innerWidth) {
          // 虽然宽度相同，但是有可能窗口resize也会进来，所以为了防止重复mount
          if (!lastTimePageFullScreen) {
            // 全屏模式下跳另一种全屏，要做校验是否已经处于全屏模式
            if (mount('------进入了网页全屏模式------') !== ALREADY_HAVE_IT)
              lastTimePageFullScreen = true
          }
        }
        else if (lastTimePageFullScreen && videoWidth) {
          unmount('------退出了网页全屏模式------')
          lastTimePageFullScreen = false
        }
      }
    }
  })

  resizeObserver.observe(video)
}

function monitorVideo(video: HTMLVideoElement) {
  const videoParent = video.parentNode

  // 当观察到变动时执行的回调函数
  const callback = function (mutationsList: MutationRecord[]) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        for (const i of mutation.addedNodes) {
          // 遍历新增的节点，取出新增的video节点
          const addVideoDom = getAddVideoDom(i)
          if (addVideoDom) {
            resizeObserver?.disconnect()
            listenVideoSizeChange(addVideoDom)
          }
        }
      }
    }
  }

  // 创建一个观察器实例并传入回调函数
  const observer = new MutationObserver(callback)

  // 以上述配置开始观察目标节点
  observer.observe(videoParent as Node, {
    attributes: false,
    childList: true,
    subtree: true,
  })
}

function getAddVideoDom(dom: Node | ChildNode): false | HTMLVideoElement {
  if (dom.nodeName === 'VIDEO')
    return dom as HTMLVideoElement

  for (const i of dom.childNodes) {
    const iframeDom = getAddVideoDom(i)
    if (iframeDom)
      return iframeDom
  }
  return false
}
