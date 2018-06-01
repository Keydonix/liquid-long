declare module 'ssri' {
	import { ReadStream } from 'fs'
	type Algorithm = 'sha256' | 'sha384' | 'sha512'
	export interface Hash {
		algorithm: Algorithm
		digest: string
		options: any[]
		toString: () => string
	}
	export interface Integrity {
		sha256: Hash
		sha384: Hash
		sha512: Hash
		toString: () => string
	}
	export interface Options {
		single: boolean
		strict: boolean
		algorithms: Algorithm[]
	}
	export function fromStream(stream: ReadStream, options: Options): Promise<Integrity | Hash>
}
