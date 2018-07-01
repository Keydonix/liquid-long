import { PrivateKey } from '../libraries/PrivateKey'
import { OasisdexContract } from '../libraries/ContractInterfaces'
import { providers, Wallet, utils } from 'ethers'

// TODO: read off Maker from env
const DAI_ADDRESS = "0x8c915bd2c0df8ba79a7d28538500a97bd15ea985";
const WETH_ADDRESS = "0xfcaf25bf38e7c86612a25ff18cb8e09ab07c9885";

const ZERO = utils.bigNumberify(0);
const ETHER = utils.bigNumberify(10).pow(utils.bigNumberify(18));

function getEnv(name: string): string {
	const value = process.env[name];
	if (value === undefined) throw new Error(`${name} environment variable required`);
	return value;
}

enum OrderType {
	BID,
	ASK,
}

async function placeMultipleEqualOrders(od: OasisdexContract, orderType: OrderType, startPrice: utils.BigNumber, endPrice: utils.BigNumber, ethAmount: utils.BigNumber, orderCount: number) {
	const [payToken, buyToken] = (orderType == OrderType.ASK) ? [WETH_ADDRESS, DAI_ADDRESS] : [DAI_ADDRESS, WETH_ADDRESS];

	const priceDelta = endPrice.sub(startPrice);
	const orderEth = ethAmount.div(utils.bigNumberify(orderCount));
	for (let i = 0; i < orderCount; ++i) {
		const orderPrice = startPrice.add(priceDelta.mul(utils.bigNumberify(i)).div(utils.bigNumberify(orderCount - 1)));
		const orderDai = orderEth.mul(orderPrice);

		const [payAmount, buyAmount] = (orderType == OrderType.ASK) ? [orderEth, orderDai] : [orderDai, orderEth];
		console.log(`Placing ${orderType === OrderType.ASK ? "ask" : "bid"} order for ${orderEth.div(ETHER).toString()} @ ${orderPrice.toString()}`);
		await od.offer(payAmount, payToken, buyAmount, buyToken, ZERO);
	}
}

async function doStuff() {
	// gather/validate inputs
	const jsonRpcAddress = getEnv('ETHEREUM_HTTP');
	const gasPriceInNanoeth = parseInt(getEnv('ETHEREUM_GAS_PRICE_IN_NANOETH'), 10);
	const oasisAddress = getEnv('ETHEREUM_OASIS_ADDRESS');
	const privateKey = PrivateKey.fromHexString(getEnv('ETHEREUM_PRIVATE_KEY'))

	const provider = new providers.JsonRpcProvider(jsonRpcAddress, 4173)
	const wallet = new Wallet(privateKey.toHexStringWithPrefix(), provider)

	const od = new OasisdexContract(oasisAddress, wallet, gasPriceInNanoeth);

	// TODO: check approvals/approve
	console.log("Sending offer...")
	await placeMultipleEqualOrders(od, OrderType.ASK, utils.bigNumberify(601), utils.bigNumberify(625), utils.bigNumberify(20).mul(ETHER), 3);
	await placeMultipleEqualOrders(od, OrderType.BID, utils.bigNumberify(575), utils.bigNumberify(595), utils.bigNumberify(20).mul(ETHER), 4);
	console.log("Sent")
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})
