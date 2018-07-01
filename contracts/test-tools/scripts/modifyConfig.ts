import {PrivateKey} from '../libraries/PrivateKey'
import {SaiMom, SaiTub} from '../libraries/ContractInterfaces'
import { providers, Wallet, utils } from 'ethers'

const ETHER = new utils.BigNumber(10).pow(new utils.BigNumber(18));

function getEnv(name: string): string {
	const value = process.env[name];
	if (value === undefined) throw new Error(`${name} environment variable required`);
	return value;
}

async function doStuff() {
	const jsonRpcAddress = getEnv('ETHEREUM_HTTP');
	const gasPriceInNanoeth = parseInt(getEnv('ETHEREUM_GAS_PRICE_IN_NANOETH'), 10);
	const momAddress = getEnv('ETHEREUM_MOM_ADDRESS');
	const makerAddress = getEnv('ETHEREUM_MAKER_ADDRESS');
	const privateKey = PrivateKey.fromHexString(getEnv('ETHEREUM_PRIVATE_KEY'))

	const provider = new providers.JsonRpcProvider(jsonRpcAddress, {chainId: 4173, ensAddress: '', name: 'dev'})
	const wallet = new Wallet(privateKey.toHexStringWithPrefix(), provider)

	const makerContract = new SaiTub(makerAddress, wallet, gasPriceInNanoeth);
	const momContract = new SaiMom(momAddress, wallet, gasPriceInNanoeth);

	const oldValue = (await makerContract.mat_());
	console.log("Old mat value:", oldValue.toString());

	await momContract.setMat(new utils.BigNumber("1400000000").mul(ETHER));

	const newValue = (await makerContract.mat_());
	console.log("New mat value:", newValue.toString());
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})
