import {Wallet, Contract, utils} from 'ethers'
import BN = require('bn.js');

// Better to load from real .json?
import {oasisAbi} from "./OasisAbi";

type EthersOptions = {
  gasPrice?: utils.BigNumber;
  value?: utils.BigNumber;
}

export class OasisdexContract {
  private readonly gasPrice: utils.BigNumber;
  private readonly contract: Contract;

  public constructor(oasisAddress: string, wallet: Wallet, gasPriceInNanoeth: number) {

    this.contract = new Contract(oasisAddress, oasisAbi, wallet)
    this.gasPrice = new utils.BigNumber(gasPriceInNanoeth * 10 ** 9)
  }

  protected async localCall(parameters: Array<any>, txName: string, sender?: string, attachedEth?: BN): Promise<Array<any>> {
    var overrideOptions: EthersOptions = {};
    if (attachedEth !== undefined) overrideOptions["value"] = new utils.BigNumber(attachedEth);
    return [await this.contract.functions[txName.toString()](...parameters, overrideOptions)];
  }

  protected async remoteCall(parameters: Array<any>, txName: string, sender?: string, gasPrice?: BN, attachedEth?: BN): Promise<void> {
    var overrideOptions: EthersOptions = {};
    if (this.gasPrice !== undefined) overrideOptions["gasPrice"] = this.gasPrice;
    if (gasPrice !== undefined) overrideOptions["gasPrice"] = new utils.BigNumber(gasPrice);
    if (attachedEth !== undefined) overrideOptions["value"] = new utils.BigNumber(attachedEth);
    return await this.contract.functions[txName](...parameters, overrideOptions);
  }

  public getBestOffer_ = async (sell_gem: string, buy_gem: string, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([sell_gem, buy_gem], "getBestOffer", options.sender);
    return <BN>result[0];
  }

  public sellAllAmount = async (pay_gem: string, pay_amt: BN, buy_gem: string, min_fill_amount: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([pay_gem, pay_amt, buy_gem, min_fill_amount], "sellAllAmount", options.sender, options.gasPrice);
    return;
  }

  public stop = async (options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([], "stop", options.sender, options.gasPrice);
    return;
  }

  public make = async (pay_gem: string, buy_gem: string, pay_amt: BN, buy_amt: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([pay_gem, buy_gem, pay_amt, buy_amt], "make", options.sender, options.gasPrice);
    return;
  }

  public setOwner = async (owner_: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([owner_], "setOwner", options.sender, options.gasPrice);
    return;
  }

  public getBuyAmount_ = async (buy_gem: string, pay_gem: string, pay_amt: BN, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([buy_gem, pay_gem, pay_amt], "getBuyAmount", options.sender);
    return <BN>result[0];
  }

  public addTokenPairWhitelist = async (baseToken: string, quoteToken: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([baseToken, quoteToken], "addTokenPairWhitelist", options.sender, options.gasPrice);
    return;
  }

  public remTokenPairWhitelist = async (baseToken: string, quoteToken: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([baseToken, quoteToken], "remTokenPairWhitelist", options.sender, options.gasPrice);
    return;
  }

  public offer = async (pay_amt: BN, pay_gem: string, buy_amt: BN, buy_gem: string, pos: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([pay_amt, pay_gem, buy_amt, buy_gem, pos], "offer", options.sender, options.gasPrice);
    return;
  }

  public insert = async (id: BN, pos: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([id, pos], "insert", options.sender, options.gasPrice);
    return;
  }

  public last_offer_id_ = async (options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([], "last_offer_id", options.sender);
    return <BN>result[0];
  }

  public setMatchingEnabled = async (matchingEnabled_: boolean, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([matchingEnabled_], "setMatchingEnabled", options.sender, options.gasPrice);
    return;
  }

  public cancel = async (id: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([id], "cancel", options.sender, options.gasPrice);
    return;
  }

  public getOffer_ = async (id: BN, options?: { sender?: string }): Promise<Array<string>> => {
    options = options || {};
    const result = await this.localCall([id], "getOffer", options.sender);
    return <Array<string>>result;
  }

  public del_rank = async (id: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([id], "del_rank", options.sender, options.gasPrice);
    return;
  }

  public take = async (id: string, maxTakeAmount: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([id, maxTakeAmount], "take", options.sender, options.gasPrice);
    return;
  }

  public getMinSell_ = async (pay_gem: string, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([pay_gem], "getMinSell", options.sender);
    return <BN>result[0];
  }

  public getTime_ = async (options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([], "getTime", options.sender);
    return <BN>result[0];
  }

  public getNextUnsortedOffer_ = async (id: BN, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([id], "getNextUnsortedOffer", options.sender);
    return <BN>result[0];
  }

  public close_time_ = async (options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([], "close_time", options.sender);
    return <BN>result[0];
  }

  public _span_ = async (arg0: string, arg1: string, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([arg0, arg1], "span", options.sender);
    return <BN>result[0];
  }

  public _best_ = async (arg0: string, arg1: string, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([arg0, arg1], "best", options.sender);
    return <BN>result[0];
  }

  public stopped_ = async (options?: { sender?: string }): Promise<boolean> => {
    options = options || {};
    const result = await this.localCall([], "stopped", options.sender);
    return <boolean>result[0];
  }

  public bump = async (id_: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([id_], "bump", options.sender, options.gasPrice);
    return;
  }

  public setAuthority = async (authority_: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([authority_], "setAuthority", options.sender, options.gasPrice);
    return;
  }

  public getOfferCount_ = async (sell_gem: string, buy_gem: string, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([sell_gem, buy_gem], "getOfferCount", options.sender);
    return <BN>result[0];
  }

  public buyAllAmount = async (buy_gem: string, buy_amt: BN, pay_gem: string, max_fill_amount: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([buy_gem, buy_amt, pay_gem, max_fill_amount], "buyAllAmount", options.sender, options.gasPrice);
    return;
  }

  public isActive_ = async (id: BN, options?: { sender?: string }): Promise<boolean> => {
    options = options || {};
    const result = await this.localCall([id], "isActive", options.sender);
    return <boolean>result[0];
  }

  public offers_ = async (arg0: BN, options?: { sender?: string }): Promise<Array<string>> => {
    options = options || {};
    const result = await this.localCall([arg0], "offers", options.sender);
    return <Array<string>>result;
  }

  public getFirstUnsortedOffer_ = async (options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([], "getFirstUnsortedOffer", options.sender);
    return <BN>result[0];
  }

  public isTokenPairWhitelisted_ = async (baseToken: string, quoteToken: string, options?: { sender?: string }): Promise<boolean> => {
    options = options || {};
    const result = await this.localCall([baseToken, quoteToken], "isTokenPairWhitelisted", options.sender);
    return <boolean>result[0];
  }

  public owner_ = async (options?: { sender?: string }): Promise<string> => {
    options = options || {};
    const result = await this.localCall([], "owner", options.sender);
    return <string>result[0];
  }

  public getBetterOffer_ = async (id: BN, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([id], "getBetterOffer", options.sender);
    return <BN>result[0];
  }

  public _dust_ = async (arg0: string, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([arg0], "_dust", options.sender);
    return <BN>result[0];
  }

  public getWorseOffer_ = async (id: BN, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([id], "getWorseOffer", options.sender);
    return <BN>result[0];
  }

  public _menu_ = async (arg0: string, options?: { sender?: string }): Promise<boolean> => {
    options = options || {};
    const result = await this.localCall([arg0], "_menu", options.sender);
    return <boolean>result[0];
  }

  public _near_ = async (arg0: BN, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([arg0], "_near", options.sender);
    return <BN>result[0];
  }

  public kill = async (id: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([id], "kill", options.sender, options.gasPrice);
    return;
  }

  public kill_ = async (id: string, options?: { sender?: string }): Promise<void> => {
    options = options || {};
    await this.localCall([id], "kill", options.sender);

  }

  public setMinSell = async (pay_gem: string, dust: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([pay_gem, dust], "setMinSell", options.sender, options.gasPrice);
    return;
  }

  public authority_ = async (options?: { sender?: string }): Promise<string> => {
    options = options || {};
    const result = await this.localCall([], "authority", options.sender);
    return <string>result[0];
  }

  public isClosed_ = async (options?: { sender?: string }): Promise<boolean> => {
    options = options || {};
    const result = await this.localCall([], "isClosed", options.sender);
    return <boolean>result[0];
  }

  public _rank_ = async (arg0: BN, options?: { sender?: string }): Promise<Array<string>> => {
    options = options || {};
    const result = await this.localCall([arg0], "_rank", options.sender);
    return <Array<string>>result;
  }

  public getOwner_ = async (id: BN, options?: { sender?: string }): Promise<string> => {
    options = options || {};
    const result = await this.localCall([id], "getOwner", options.sender);
    return <string>result[0];
  }

  public isOfferSorted_ = async (id: BN, options?: { sender?: string }): Promise<boolean> => {
    options = options || {};
    const result = await this.localCall([id], "isOfferSorted", options.sender);
    return <boolean>result[0];
  }

  public setBuyEnabled = async (buyEnabled_: boolean, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([buyEnabled_], "setBuyEnabled", options.sender, options.gasPrice);
    return;
  }

  public buy = async (id: BN, amount: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([id, amount], "buy", options.sender, options.gasPrice);
    return;
  }

  public buyEnabled_ = async (options?: { sender?: string }): Promise<boolean> => {
    options = options || {};
    const result = await this.localCall([], "buyEnabled", options.sender);
    return <boolean>result[0];
  }

  public getPayAmount_ = async (pay_gem: string, buy_gem: string, buy_amt: BN, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([pay_gem, buy_gem, buy_amt], "getPayAmount", options.sender);
    return <BN>result[0];
  }


}
