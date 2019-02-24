import {PrivateKey} from '../libraries/PrivateKey'
import { Wallet } from 'ethers/wallet'
import { JsonRpcProvider } from 'ethers/providers'
import { BigNumber } from 'ethers/utils'
import { Tub, Mom, Address } from '@keydonix/maker-contract-interfaces';
import { ContractDependenciesEthers } from '../libraries/liquid-long-ethers-impl';

const ETHER = new BigNumber(10).pow(new BigNumber(18));

function getEnv(name: string): string {
	const value = process.env[name];
	if (value === undefined) throw new Error(`${name} environment variable required`);
	return value;
}

async function doStuff() {
	const jsonRpcAddress = getEnv('ETHEREUM_HTTP');
	const gasPriceInNanoeth = parseInt(getEnv('ETHEREUM_GAS_PRICE_IN_NANOETH'), 10);
	const momAddress = Address.fromHexString(getEnv('ETHEREUM_MOM_ADDRESS'));
	const makerAddress = Address.fromHexString(getEnv('ETHEREUM_MAKER_ADDRESS'));
	const privateKey = PrivateKey.fromHexString(getEnv('ETHEREUM_PRIVATE_KEY'))

	const provider = new JsonRpcProvider(jsonRpcAddress, {chainId: 4173, ensAddress: '', name: 'dev'})
	const wallet = new Wallet(privateKey, provider)
	const dependencies = new ContractDependenciesEthers(provider, wallet, async () => gasPriceInNanoeth)

	const makerContract = new Tub(dependencies, makerAddress);
	const momContract = new Mom(dependencies, momAddress);

	const oldValue = (await makerContract.mat_());
	console.log("Old mat value:", oldValue.toString());

	await momContract.setMat(new BigNumber("1400000000").mul(ETHER));

	const newValue = (await makerContract.mat_());
	console.log("New mat value:", newValue.toString());
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})
