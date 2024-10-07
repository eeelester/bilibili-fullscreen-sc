
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { LiveWS } from 'bilibili-live-ws'
import SCList from '../components/ScList'

// import { testData } from '../dev/testData'
import { processData } from '@/utils'
import type { DanmuDataProps } from '@/utils'

export default defineContentScript({
    matches: ['https://live.bilibili.com/*'],
    main() {
        let existElement: HTMLElement | null
        let root: Root | null
        let liveWS: LiveWS | null
        let switchState: boolean = true
        let isMount = false
        let isFirst = true
        let isInIframe = false


        // 判断全屏模式
        document.addEventListener(
            'fullscreenchange',
            () => {
                // 当用户在popup关闭此功能后
                if (!switchState)
                    return

                // 从全屏变为非全屏
                if (!document.fullscreenElement && existElement) {
                    unmount('------全屏退出，清除完毕------')
                    return
                }

                mount('------进入全屏，bilibili-fullscreen-sc启动------')
            },
            true,
        );

        // 判断video出现的时机，没用mutationobserver是因为监听iframe里的节点麻烦
        function loop() {
            const video = getVideoDom()
            if (video) {
                listenVideoSizeChange(video)
            } else {
                window.requestAnimationFrame(loop);
            }
        }

        window.requestAnimationFrame(loop);

        function mount(log: string) {
            if (isMount) return
            isMount = true

            console.log(log)

            if (isFirst) {
                injectIframeCss()
                isFirst = false
            }


            existElement = document.createElement('div')

            const videoDom = getVideoDom()
            console.log('videoParent', videoDom?.parentNode)
            videoDom?.parentNode?.appendChild(existElement)
            root = createRoot(existElement)
            root.render(<SCList scDocument={isInIframe ? getVideoDomFromIframe().contentDocument as Document : document} />)
            // setTimeout(() => {
            //     processData(testData)
            // }, 1000)

            getInfo()
        }

        function unmount(log: string) {
            if (!isMount) return
            isMount = false

            console.log(log)
            root?.unmount()
            root = null
            existElement?.parentNode?.removeChild(existElement)
            existElement = null
            liveWS?.close()
            liveWS = null
        }

        function listenVideoSizeChange(video: HTMLVideoElement) {
            let lastTimePageFullScreen = false
            const resizeObserver = new ResizeObserver((entries) => {
                // 当用户在popup关闭此功能后
                if (!switchState)
                    return
                for (const entry of entries) {
                    console.log('resizeObserver', entry)
                    if (entry.contentRect) {
                        const videoWidth = entry.contentRect?.width
                        if (videoWidth === window.innerWidth) {
                            // 虽然宽度相同，但是有可能窗口resize也会进来，所以为了防止重复mount
                            if (!lastTimePageFullScreen) {
                                lastTimePageFullScreen = true
                                mount('------进入了网页全屏模式------')
                            }
                        } else if (lastTimePageFullScreen && videoWidth) {
                            lastTimePageFullScreen = false
                            // 执行卸载操作
                            unmount('------退出了网页全屏模式------')
                        }
                    }
                }
            });

            resizeObserver.observe(video);
        }

        async function getInfo() {
            const shortId = location.pathname.slice(1)
            const roomId = await fetch(`https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${shortId}`)
                .then(response => response.json())
                .then((res) => {
                    const { data: { room_id } = { room_id: 0 } } = res
                    return room_id
                })

            const existingSCList = await fetch(`https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=${roomId}`)
                .then(response => response.json())
                .then((res) => {
                    const { data: { super_chat_info: { message_list } } } = res
                    return message_list
                })
            if (Array.isArray(existingSCList) && existingSCList.length) {
                console.log('existingSCList', existingSCList)
                for (let i of existingSCList) {
                    processData({ data: i })
                }
            }


            const key = await fetch(`https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${roomId}`)
                .then(response => response.json())
                .then((res) => {
                    const { data: { token } = { token: '' } } = res
                    return token
                })
            liveWS = new LiveWS(roomId, {
                protover: 3,
                key,
            })
            liveWS.on('SUPER_CHAT_MESSAGE', (res) => {
                console.log('SC', res)
                processData(res as DanmuDataProps)
            })
        }

        // 获取跟video的父级dom（B站video的父级dom结构老是变，有病的！）
        function getVideoDom() {
            return document.querySelector('video') || getVideoDomFromIframe()?.contentDocument?.querySelector('video')
        }

        function getVideoDomFromIframe() {
            return Array.from(document.querySelectorAll('iframe')).filter(item => item.allowFullscreen)[0]
        }

        // 有时候video在iframe里面，content-script.css的样式没法应用到里面去，所以将其应用到iframe head中
        function injectIframeCss() {
            const videoIframe = getVideoDomFromIframe()
            if (videoIframe?.contentDocument?.querySelector('video')) {
                console.log('--------video在iframe里面，需要手动在iframe中注入样式文件---------')
                // @ts-ignore
                console.log(`extension css文件路径：`, browser.runtime.getURL('/content-scripts/content.css'))

                isInIframe = true
                const link = videoIframe.contentDocument.createElement('link');
                link.rel = 'stylesheet';

                // @ts-ignore
                link.href = browser.runtime.getURL('/content-scripts/content.css'); // 扩展中的 CSS 文件路径
                videoIframe.contentDocument.head.appendChild(link);
            }
        }

        // 监听popup信息
        browser.runtime.onMessage.addListener((request: { switchState: boolean }, _, sendResponse: (str: string) => void) => {
            switchState = request.switchState
            sendResponse('content got!')
        })
    },
});
