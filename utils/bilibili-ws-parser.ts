

import { inflates } from './inflate'
import type { Buffer as BufferType } from 'buffer'

type Inflates = {
    inflateAsync: (b: BufferType) => BufferType | Promise<BufferType>,
    brotliDecompressAsync: (b: BufferType) => BufferType | Promise<BufferType>
}
export async function decodeBilibiliMessage(buffer: BufferType): Promise<any> {
    const packs = await makeDecoder(inflates)(buffer)
    packs.forEach(({ type, data }) => {
        if (type === 'message') {
            console.log(data)
            // this.emit('msg', data)
            // const cmd = data.cmd || (data.msg && data.msg.cmd)
            // if (cmd) {
            //     if (cmd.includes('DANMU_MSG')) {
            //         this.emit('DANMU_MSG', data)
            //     } else {
            //         this.emit(cmd, data)
            //     }
            // }
        }
    })
    console.error('decodeBilibiliMessage', buffer);


    // const data = new Uint8Array(buffer);
    // const dataView = new DataView(buffer);

    // // 包大小
    // const packetLen = dataView.getUint32(0);
    // // 头部大小，固定为16
    // const headerLen = dataView.getUint16(4);
    // // 协议版本
    // const protover = dataView.getUint16(6);
    // // 操作码
    // const operation = dataView.getUint32(8);

    // // 心跳回应，带有人气值
    // if (operation === 3) {
    //     const popularity = dataView.getUint32(16);
    //     return { type: 'HEARTBEAT_REPLY', data: popularity };
    // }

    // // 命令，如弹幕、礼物等
    // if (operation === 5) {
    //     let body: Uint8Array = data.slice(headerLen, packetLen);
    //     let bodyText: string = '';

    //     // 根据protover判断是否需要解压
    //     // protover = 0,1: 无需解压
    //     // protover = 2: zlib压缩
    //     // protover = 3: brotli压缩
    //     try {
    //         if (protover === 0 || protover === 1) {
    //             bodyText = new TextDecoder().decode(body);
    //         } else if (protover === 2) {
    //             const inflated = inflate(body);
    //             bodyText = new TextDecoder().decode(inflated);
    //         } else if (protover === 3) {

    //             const { decompress: brotliDecode } = await brotliPromise;
    //             const inflated = brotliDecode(body);
    //             bodyText = new TextDecoder().decode(inflated);
    //         }

    //         // 对所有解压结果统一处理多条消息的可能性
    //         if (bodyText) {
    //             // 尝试解析为单个消息
    //             try {
    //                 const body = JSON.parse(bodyText);
    //                 return { type: body.cmd, data: body };
    //             } catch (e) {
    //                 // 解析单条消息失败，可能是多条消息
    //                 const objects: any = [];
    //                 let offset = 0;

    //                 while (offset < bodyText.length) {
    //                     try {
    //                         // 尝试从当前位置解析一个完整JSON
    //                         const object = JSON.parse(bodyText.slice(offset));
    //                         objects.push(object);
    //                         break; // 成功解析到末尾，退出循环
    //                     } catch (e) {
    //                         // 查找下一个可能的JSON开始位置
    //                         const index = bodyText.indexOf('{', offset + 1);
    //                         if (index !== -1) {
    //                             try {
    //                                 // 尝试解析到下一个开始位置前的内容
    //                                 const object = JSON.parse(bodyText.slice(offset, index));
    //                                 objects.push(object);
    //                                 offset = index; // 移动到下一个位置
    //                             } catch (e) {
    //                                 // 解析失败，直接移动到下一个位置尝试
    //                                 offset = index;
    //                             }
    //                         } else {
    //                             break; // 找不到下一个位置，退出循环
    //                         }
    //                     }
    //                 }

    //                 if (objects.length === 1) {
    //                     // 只有一条消息
    //                     return { type: objects[0].cmd, data: objects[0] };
    //                 } else if (objects.length > 1) {
    //                     // 多条消息，返回数组
    //                     return objects.map(obj => ({ type: obj.cmd, data: obj }));
    //                 }

    //                 // 如果仍然无法解析，记录错误
    //                 console.error('无法解析的消息内容:', bodyText);
    //             }
    //         }
    //     } catch (e) {
    //         console.error('解压或解析失败:', e);
    //     }
    // }

    // // 对于其他操作类型，简单返回
    // return { operation, protover, data: new Uint8Array(buffer) };
}


const cutBuffer = (buffer: BufferType) => {
    const bufferPacks: BufferType[] = []
    let size: number
    for (let i = 0; i < buffer.length; i += size) {
        size = buffer.readInt32BE(i)
        bufferPacks.push(buffer.slice(i, i + size))
    }
    return bufferPacks
}

export const makeDecoder = ({ inflateAsync, brotliDecompressAsync }: Inflates) => {
    const decoder = async (buffer: BufferType) => {

        const packs = await Promise.all(cutBuffer(buffer)
            .map(async buf => {
                const body = buf.slice(16)
                const protocol = buf.readInt16BE(6)
                const operation = buf.readInt32BE(8)

                let type = 'unknow'
                if (operation === 3) {
                    type = 'heartbeat'
                } else if (operation === 5) {
                    type = 'message'
                } else if (operation === 8) {
                    type = 'welcome'
                }

                let data: any
                if (protocol === 0) {
                    data = JSON.parse(String(body))
                }
                if (protocol === 1 && body.length === 4) {
                    data = body.readUIntBE(0, 4)
                }
                if (protocol === 2) {
                    data = await decoder(await inflateAsync(body))
                }
                if (protocol === 3) {
                    data = await decoder(await brotliDecompressAsync(body))
                }

                return { buf, type, protocol, data }
            }))

        return packs.flatMap(pack => {
            if (pack.protocol === 2 || pack.protocol === 3) {
                return pack.data as typeof packs
            }
            return pack
        })
    }

    return decoder
}
