export function sleep(time) {
    const d1 = new Date();
    while (true) {
        const d2 = new Date();
        if (d2.getSeconds() - d1.getSeconds() > time) {
            return;
        }
    }
}