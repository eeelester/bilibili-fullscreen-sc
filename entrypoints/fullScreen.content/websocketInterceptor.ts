// entrypoints/fullScreen.content/websocketInterceptor.ts
import { decodeBilibiliMessage } from '../../utils/bilibili-ws-parser';

// 自定义事件类型
export interface BilibiliEvent extends CustomEvent {
    detail: {
        type: string;
        data: any;
    };
}

// 初始化WebSocket拦截
export function initWebSocketInterceptor() {
    // 确保只初始化一次
    if ((window as any).__bilibiliWSIntercepted) {
        return;
    }
    (window as any).__bilibiliWSIntercepted = true;

    console.log('[B站全屏SC] 开始监听WebSocket连接');

    // 保存原始WebSocket构造函数
    const OriginalWebSocket = window.WebSocket;

    // 重写WebSocket构造函数
    window.WebSocket = function (url: string, protocols?: string | string[]) {
        // 创建原始WebSocket
        const ws = new OriginalWebSocket(url, protocols);
        console.error('ws', ws, url);
        // 判断是否是B站直播弹幕WebSocket
        if (url.includes('broadcastlv.chat.bilibili.com')) {
            console.log('[B站全屏SC] 捕获到B站直播WebSocket连接:', url);

            // 保存原始onmessage
            const originalOnMessage = ws.onmessage;

            // 重写onmessage
            ws.onmessage = async function (event) {
                // 处理消息
                if (event.data instanceof Uint8Array) {
                    const parsedMsg = await decodeBilibiliMessage(event.data);
                    console.error('parsedMsg', parsedMsg);
                    if (parsedMsg) {
                        // 分发所有消息类型的事件
                        window.dispatchEvent(new CustomEvent('BILIBILI_WS_MESSAGE', {
                            detail: parsedMsg
                        }));

                        // 单独分发特定类型的事件
                        window.dispatchEvent(new CustomEvent(`BILIBILI_${parsedMsg.type}`, {
                            detail: parsedMsg.data
                        }));

                        // 特别关注SC消息
                        if (parsedMsg.type === 'SUPER_CHAT_MESSAGE') {
                            console.log('[B站全屏SC] 收到SC:', parsedMsg.data);
                        }
                    }
                }

                // 调用原始onmessage
                if (originalOnMessage) {
                    originalOnMessage.call(this, event);
                }
            };
        }

        return ws;
    } as unknown as typeof WebSocket;

    console.log('[B站全屏SC] WebSocket拦截初始化完成');
}