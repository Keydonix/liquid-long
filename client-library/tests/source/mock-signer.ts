import { Signer, TransactionRequest, TransactionResponse } from '@keydonix/liquid-long-client-library'

export class MockSigner implements Signer {
	sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse> {
		throw new Error("Method not implemented.");
	}
}
