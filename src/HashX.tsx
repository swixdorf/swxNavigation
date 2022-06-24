import { Buffer } from "buffer";
export default class HashX {
    static salt: string = "key length is 20 HAH";
    static outputLen: number = 20;// BYTES salt must be in same length
    static swx(data: string | Buffer) {
        let buff = data instanceof Buffer ? data : Buffer.from(data, "utf-8");
        if (HashX.salt.length != HashX.outputLen) {
            console.log("Salt Length Error");
            return '';
        }
        if (data.length < 1) {
            console.log("No Data");
            return '';
        }

        buff = Buffer.concat([buff, Buffer.from(HashX.salt)])

        for (let i = 1; i < buff.length; i++) {
            buff[i - 1] = buff[i - 1] ^ buff[i];
            buff.length > (i + 2) && (buff[i + 2] = buff[i + 2] ^ buff[i]);
        }

        const loopCount = Math.ceil(buff.length / HashX.outputLen);
        if (loopCount > 1) { // prevent key expose
            for (let i = 0; i < HashX.outputLen; i++) {
                for (let j = 1; j <= loopCount; j++) {
                    const offset = j * HashX.outputLen + i;
                    offset < buff.length && (buff[i] = buff[i] ^ buff[offset]);
                }
            }
        }
        console.log(buff.slice(0, HashX.outputLen).toString('hex'));
        return buff.slice(0, HashX.outputLen).toString('hex');
    }
}
const swx = HashX.swx;
export { HashX, swx }