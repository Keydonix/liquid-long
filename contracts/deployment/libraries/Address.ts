import { ByteArray } from './ByteArray'
import { utils } from 'ethers'

export class Address extends ByteArray {
	constructor(other: Uint8Array) {
		super(other)
		if (other.length != 20) throw new Error(`Expected 20 byte source.`)
	}
	static fromHexString(input: string) {
		const match = /^(?:0x)?([a-zA-Z0-9]{40})$/.exec(input)
		if (match === null) throw new Error(`${input} must be a 40 character hex string optionally prefixed with 0x`)
		return new Address(utils.arrayify(`0x${match[1]}`))
	}
	static zero() {
		return new Address(new Uint8Array(20))
	}
}
