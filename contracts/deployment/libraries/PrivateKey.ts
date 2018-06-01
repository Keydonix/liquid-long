import { ByteArray } from './ByteArray'
import { utils } from 'ethers'

export class PrivateKey extends ByteArray {
	constructor(other: Uint8Array) {
		super(other)
		if (other.length != 32) throw new Error(`Expected 20 byte source.`)
	}
	static fromHexString(input: string) {
		const match = /^(?:0x)?([a-zA-Z0-9]{64})$/.exec(input)
		if (match === null) throw new Error(`${input} must be a 64 character hex string optionally prefixed with 0x`)
		return new PrivateKey(utils.arrayify(`0x${match[1]}`))
	}
}
