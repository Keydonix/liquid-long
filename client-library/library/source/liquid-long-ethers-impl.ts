import { Dependencies, AbiFunction, AbiParameter, Transaction } from './generated/liquid-long';

import { ethers } from 'ethers';
// import { keccak256, toUtf8Bytes, BigNumber, AbiCoder } from 'ethers/utils';
type BigNumber = ethers.utils.BigNumber;
const keccak256 = ethers.utils.keccak256;
const toUtf8Bytes = ethers.utils.toUtf8Bytes;
const AbiCoder = ethers.utils.AbiCoder;
// import { TransactionResponse, TransactionRequest } from 'ethers/providers';
type TransactionResponse = ethers.providers.TransactionResponse;
type TransactionRequest = ethers.providers.TransactionRequest;


export interface Provider {
	listAccounts(): Promise<Array<string>>
	call(transaction: TransactionRequest): Promise<string>
}

export interface Signer {
	sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse>;
}

export class LiquidLongDependenciesEthers implements Dependencies<BigNumber> {
	private readonly provider: Provider;
	private readonly signer: Signer;
	public constructor(provider: Provider, signer: Signer) {
		this.provider = provider;
		this.signer = signer
	}

	keccak256 = (utf8String: string) => keccak256(toUtf8Bytes(utf8String));
	encodeParams = (abiFunction: AbiFunction, parameters: Array<any>) => new AbiCoder().encode(abiFunction.inputs, parameters).substr(2);
	decodeParams = (abiParameters: Array<AbiParameter>, encoded: string) => new AbiCoder().decode(abiParameters, encoded);
	getDefaultAddress = async () => (await this.provider.listAccounts())[0];
	call = async (transaction: Transaction<BigNumber>) => await this.provider.call(transaction);
	submitTransaction = async (transaction: Transaction<BigNumber>) => ({ status: (await (await this.signer.sendTransaction(transaction)).wait()).status! })
}
