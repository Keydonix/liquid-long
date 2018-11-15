import { Signer } from '@keydonix/liquid-long-client-library/source/liquid-long-ethers-impl'

export class MockSigner implements Signer {
	sendTransaction(): Promise<any> {
		throw new Error("Method not implemented.");
	}
}
