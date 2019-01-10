import { Signer } from '@keydonix/liquid-long-client-library/source/liquid-long-ethers-impl'

export class MockSigner implements Signer {
	async sendTransaction(): Promise<any> {
		throw new Error('Method not implemented.')
	}
	async getAddress(): Promise<string> {
		return '0x0000000000000000000000000000000000000000'
	}
}
