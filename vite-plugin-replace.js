import fs from 'fs';
import path from 'path';

export function ReplaceUnsafeWindowPlugin(options) {
    return {
        name: 'vite-plugin-replace-unsafeWindow',
        apply: 'build',
        closeBundle() {
            // 定位到 public 目录下的目标文件
            const publicDir = path.resolve(process.cwd(), 'public');
            const targetFile = path.join(publicDir, 'bilibili-web-show-ip-location.user.js');
            if (fs.existsSync(targetFile)) {
                let content = fs.readFileSync(targetFile, 'utf-8');
                content = content.replace(options.regex, options.replacement);
                fs.writeFileSync(targetFile, content, 'utf-8');
                console.log(`Processed: ${targetFile}`);
            }
        },
    };
}
