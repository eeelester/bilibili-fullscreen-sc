import Wrong from "@/components/Wrong";
import Popup from "@/components/Popup";
import { MATCH_URL, POPUP_INITIAL_STATE } from "@/constant";
import { changeIcon } from "@/utils";
import { useLayoutEffect } from "react";
import { usePrevious } from "./hook";

function App() {
    const [isMatch, setIsMatch] = useState(true);
    const [switchState, setSwitchState] = useState(POPUP_INITIAL_STATE);
    const prevSwitchState = usePrevious(switchState);

    useLayoutEffect(() => {
        (async () => {
            const [tab] = await browser.tabs.query({
                active: true,
                currentWindow: true,
            });
            console.log("tab", tab);
            setIsMatch(MATCH_URL.test(tab.url as string));
        })();
    }, [setIsMatch]);

    useLayoutEffect(() => {
        (async () => {
            console.log("changeIcon", isMatch);
            if (!isMatch) {
                changeIcon(false);
            } else {
                let tmp: boolean | null | undefined = await storage.getItem("session:switchState");
                setSwitchState(tmp ?? POPUP_INITIAL_STATE);
            }
        })();
    }, [isMatch]);

    /**
     * @description:开关，用户可以自行控制是否开启全屏显示SC，因为用POPUP_INITIAL_STATE值作为useState初始值，第一次进来会触发useEffect，所以使用了usePrevious获取前值做判断
     * @param {*} props
     * @return {*}
     */
    useEffect(() => {
        if (switchState && !prevSwitchState) onSwitch(true);

        if (!switchState && prevSwitchState) onSwitch(false);

        console.log("switchState/prevSwitchState", switchState, prevSwitchState);
    }, [switchState]);

    // TODO: 开启后增加提示
    return isMatch ? <Popup switchState={switchState} switchChange={setSwitchState} /> : <Wrong />;
}

/**
 * @description: switch改变后，传参给content-scripts，然后还要改变icon
 * @param {boolean} switchState
 * @return {*}
 */
async function onSwitch(switchState: boolean) {
    const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
    });
    browser.tabs.sendMessage(tab.id as number, {
        switchState,
    });

    // 存着，不然下次点击popup就没有了
    storage.setItem<boolean>("session:switchState", switchState);

    // 发送给background，这个开关是用户操作，级别最高，background的根据url切换图标状态要在这之下
    browser.runtime.sendMessage({ switchState });

    changeIcon(switchState);
}

export default App;
