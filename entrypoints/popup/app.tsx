
import RadioGroup from '@/components/RadioGroup'
import SCList from '@/components/ScList'
import { processData, processSize } from '@/utils'

import { testData } from "@/dev/testData";
import './app.less'
import { sizeEnum } from '@/constant';

function App() {
    useEffect(() => {
        processData({
            ...testData, data: {
                ...testData.data, time: 1200, message: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', user_info: {
                    ...testData.data.user_info,
                    uname: 'XXXXXXXXXXXXXXXXXXXXXX'
                }
            }
        });

    }, [])

    const handleSizeChange = (v: sizeEnum) => {
        processSize(v)
        onResize(v)
    }

    return <div className='popup-wrap'>
        <legend className="title">UI大小</legend>
        <RadioGroup onChange={handleSizeChange} />
        <div className='divider'></div>
        <legend className='title'>示例：</legend>
        <SCList scDocument={document} />
    </div>
}

async function onResize(size: sizeEnum) {
    const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
    })
    await browser.tabs.sendMessage(tab.id as number, {
        size,
    })

    // 存着，不然下次点击popup就没有了
    await storage.setItem<sizeEnum>('local:UISize', size)

}


export default App