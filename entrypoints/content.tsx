import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import { LiveWS } from "bilibili-live-ws";
import SCList from "../components/ScList";

// import { testData } from "../dev/testData";
import { processData } from "@/utils";
import type { DanmuDataProps } from "@/utils";

export default defineContentScript({
    matches: ["https://live.bilibili.com/*"],
    main() {
        let existElement: HTMLElement | null;
        let root: Root | null;
        let liveWS: LiveWS | null;
        let resizeObserver: ResizeObserver | null;
        let switchState: boolean = true;
        let isMount = false;
        let isFirst = true;
        let isInIframe = false;

        // 判断全屏模式
        document.addEventListener(
            "fullscreenchange",
            () => {
                // 当用户在popup关闭此功能后
                if (!switchState) return;

                // 从全屏变为非全屏
                if (!document.fullscreenElement && existElement) {
                    unmount("------全屏退出，清除完毕------");
                    return;
                }

                mount("------进入全屏，bilibili-fullscreen-sc启动------");
            },
            true
        );

        // video出现的时机
        function loop() {
            const video = getVideoDom();
            if (video) {
                listenVideoSizeChange(video);
                // 如果切换清晰度，会销毁原本的video，然后新增video，所以原本在之前的video监听宽度已经没用了，需要重新监听
                monitorVideo(video);
            } else {
                window.requestAnimationFrame(loop);
            }
        }

        window.requestAnimationFrame(loop);

        function monitorVideo(video) {
            const videoParent = video.parentNode;

            // 当观察到变动时执行的回调函数
            const callback = function (mutationsList) {
                for (const mutation of mutationsList) {
                    if (mutation.type === "childList") {
                        for (const i of mutation.addedNodes) {
                            // 遍历新增的节点，取出新增的video节点
                            const addVideoDom = getAddVideoDom(i);
                            if (addVideoDom) {
                                resizeObserver?.disconnect();
                                listenVideoSizeChange(addVideoDom);
                            }
                        }
                    }
                }
            };

            // 创建一个观察器实例并传入回调函数
            const observer = new MutationObserver(callback);

            // 以上述配置开始观察目标节点
            observer.observe(videoParent as Node, {
                attributes: false,
                childList: true,
                subtree: true,
            });
        }

        function getAddVideoDom(dom: HTMLElement | ChildNode): false | HTMLVideoElement {
            if (dom.nodeName === "VIDEO") {
                return dom as HTMLVideoElement;
            }

            for (const i of dom.childNodes) {
                const iframeDom = getAddVideoDom(i);
                if (iframeDom) {
                    return iframeDom;
                }
            }
            return false;
        }

        function mount(log: string) {
            if (isMount) return;
            isMount = true;

            console.log(log);

            if (isFirst) {
                injectIframeCss();
                isFirst = false;
            }

            existElement = document.createElement("div");

            const videoDom = getVideoDom();
            console.log("videoParent", videoDom?.parentNode);
            videoDom?.parentNode?.appendChild(existElement);
            root = createRoot(existElement);
            root.render(<SCList scDocument={isInIframe ? (getVideoDomFromIframe().contentDocument as Document) : document} />);
            // setTimeout(() => {
            //     processData(testData);
            // }, 1000);

            getInfo();
        }

        function unmount(log: string) {
            if (!isMount) return;
            isMount = false;

            console.log(log);
            root?.unmount();
            root = null;
            existElement?.parentNode?.removeChild(existElement);
            existElement = null;
            liveWS?.close();
            liveWS = null;
        }

        function listenVideoSizeChange(video: HTMLVideoElement) {
            let lastTimePageFullScreen = false;
            resizeObserver = new ResizeObserver((entries) => {
                // 当用户在popup关闭此功能后
                if (!switchState) return;
                for (const entry of entries) {
                    console.log("resizeObserver", entry);
                    if (entry.contentRect) {
                        const videoWidth = entry.contentRect?.width;
                        if (videoWidth === window.innerWidth) {
                            // 虽然宽度相同，但是有可能窗口resize也会进来，所以为了防止重复mount
                            if (!lastTimePageFullScreen) {
                                lastTimePageFullScreen = true;
                                mount("------进入了网页全屏模式------");
                            }
                        } else if (lastTimePageFullScreen && videoWidth) {
                            lastTimePageFullScreen = false;
                            // 执行卸载操作
                            unmount("------退出了网页全屏模式------");
                        }
                    }
                }
            });

            resizeObserver.observe(video);
        }

        async function getInfo() {
            const shortId = location.pathname.slice(1);
            const roomId = await fetch(`https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${shortId}`)
                .then((response) => response.json())
                .then((res) => {
                    const { data: { room_id } = { room_id: 0 } } = res;
                    return room_id;
                });

            const existingSCList = await fetch(`https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=${roomId}`)
                .then((response) => response.json())
                .then((res) => {
                    const {
                        data: {
                            super_chat_info: { message_list },
                        },
                    } = res;
                    return message_list;
                });
            if (Array.isArray(existingSCList) && existingSCList.length) {
                console.log("existingSCList", existingSCList);
                for (let i of existingSCList) {
                    const time = i.end_time - i.start_time;
                    const delay = time - i.time;
                    processData({ data: { ...i, time, delay } });
                }
            }

            const key = await fetch(`https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${roomId}`)
                .then((response) => response.json())
                .then((res) => {
                    const { data: { token } = { token: "" } } = res;
                    return token;
                });
            liveWS = new LiveWS(roomId, {
                protover: 3,
                key,
            });
            liveWS.on("SUPER_CHAT_MESSAGE", (res) => {
                console.log("SC", res);
                processData(res as DanmuDataProps);
            });
        }

        // 获取跟video的dom（B站video的父级dom结构老是变，有病的！）
        function getVideoDom() {
            return document.querySelector("video") || getVideoDomFromIframe()?.contentDocument?.querySelector("video");
        }

        function getVideoDomFromIframe() {
            return Array.from(document.querySelectorAll("iframe")).filter((item) => item.allowFullscreen)[0];
        }

        // 有时候video在iframe里面，content-script.css的样式没法应用到里面去，所以将其应用到iframe head中
        function injectIframeCss() {
            const videoIframe = getVideoDomFromIframe();
            if (videoIframe?.contentDocument?.querySelector("video")) {
                console.log("--------video在iframe里面，需要手动在iframe中注入样式文件---------");
                // @ts-ignore
                console.log(
                    `extension css文件路径：`,
                    // @ts-ignore
                    browser.runtime.getURL("/content-scripts/content.css")
                );

                isInIframe = true;
                const link = videoIframe.contentDocument.createElement("link");
                link.rel = "stylesheet";

                link.href = browser.runtime.getURL(
                    // @ts-ignore
                    "/content-scripts/content.css"
                ); // 扩展中的 CSS 文件路径
                videoIframe.contentDocument.head.appendChild(link);
            }
        }

        // 监听popup信息
        browser.runtime.onMessage.addListener((request: { switchState: boolean }, _, sendResponse: (str: string) => void) => {
            switchState = request.switchState;
            sendResponse("content got!");
        });
    },
});
