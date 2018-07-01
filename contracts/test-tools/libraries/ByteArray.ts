import { utils } from "ethers";

export class ByteArray extends Uint8Array {
	private readonly hexEncodeArray = [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F' ];
	constructor(other: Uint8Array) {
		super(other)
	}
	toHexString(): string {
		let result = ''
		for (let byte of this) {
			result += this.hexEncodeArray[byte >>> 4]
			result += this.hexEncodeArray[byte & 0x0f]
		}
		return result
	}
	toHexStringWithPrefix(): string {
		return `0x${this.toHexString()}`
	}
	static fromHexString(input: string): ByteArray {
		const match = /^(?:0x)?([a-zA-Z0-9][a-zA-Z0-9]*)$/.exec(input)
		if (match === null) throw new Error(`${input} must be an even length hex string optionally prefixed with 0x`)
		return new ByteArray(utils.arrayify(`0x${match[1]}`))
	}
}
