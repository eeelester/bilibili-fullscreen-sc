
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { LiveWS } from 'bilibili-live-ws'
import SCList from '../components/ScList'

// import { testData } from '../../dev/testData'
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

        // 判断video出现的时机，用setTimeout主要是方便，mutationobserver监听iframe里的节点麻烦
        (function loop() {
            setTimeout(function () {
                const video = document.querySelector('video') || Array.from(document.querySelectorAll('iframe')).filter(item => item.allowFullscreen)[0]?.contentDocument?.querySelector('video')
                if (video) {
                    listenVideoSizeChange(video)
                } else {
                    loop();
                }
            }, 500);
        })()



        function mount(log: string) {
            if (isMount) return
            isMount = true

            console.log(log)

            existElement = document.createElement('div')
            // 获取跟video的父级dom（B站video的父级dom结构老是变，有病的！）
            const videoParent = document.querySelector('.live-player-mounter');
            const iframe = Array.from(document.querySelectorAll('iframe')).filter(item => item.allowFullscreen)[0];
            const videoParent2 = iframe?.contentDocument?.querySelector('.live-player-mounter');
            (videoParent || videoParent2)?.appendChild(existElement)
            console.log('videoParent', videoParent, videoParent2)
            root = createRoot(existElement)
            root.render(<SCList />)
            // setTimeout(() => {
            //   processData(testData as DanmuDataProps)
            // }, 2000)

            void getInfo()
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
                    const { data: { room_id } = { room_id: 0 } } = res as { data: { room_id: number } }
                    return room_id
                })

            const key = await fetch(`https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${roomId}`)
                .then(response => response.json())
                .then((res) => {
                    const { data: { token } = { token: '' } } = res as { data: { token: string } }
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

        // 监听popup信息
        browser.runtime.onMessage.addListener((request: { switchState: boolean }, _, sendResponse:(str:string)=>void) => {
            switchState = request.switchState
            sendResponse('content got!')
        })
    },
});
