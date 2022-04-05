/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
} from "../common";

export interface TradePlatformInterface extends utils.Interface {
  functions: {
    "INITIAL_TOKEN_AMOUNT()": FunctionFragment;
    "_balances(address)": FunctionFragment;
    "addOrder(uint256,uint256)": FunctionFragment;
    "buyToken(uint256)": FunctionFragment;
    "orders(uint256)": FunctionFragment;
    "register(address)": FunctionFragment;
    "roundEndTime()": FunctionFragment;
    "roundStartTime()": FunctionFragment;
    "roundStatus()": FunctionFragment;
    "roundTime()": FunctionFragment;
    "startSaleRound()": FunctionFragment;
    "startTradeRound()": FunctionFragment;
    "token()": FunctionFragment;
    "tokenPrice()": FunctionFragment;
    "tokens()": FunctionFragment;
    "tradeStock()": FunctionFragment;
    "users(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "INITIAL_TOKEN_AMOUNT"
      | "_balances"
      | "addOrder"
      | "buyToken"
      | "orders"
      | "register"
      | "roundEndTime"
      | "roundStartTime"
      | "roundStatus"
      | "roundTime"
      | "startSaleRound"
      | "startTradeRound"
      | "token"
      | "tokenPrice"
      | "tokens"
      | "tradeStock"
      | "users"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "INITIAL_TOKEN_AMOUNT",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "_balances", values: [string]): string;
  encodeFunctionData(
    functionFragment: "addOrder",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "buyToken",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "orders",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "register", values: [string]): string;
  encodeFunctionData(
    functionFragment: "roundEndTime",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "roundStartTime",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "roundStatus",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "roundTime", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "startSaleRound",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "startTradeRound",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "token", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "tokenPrice",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "tokens", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "tradeStock",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "users", values: [string]): string;

  decodeFunctionResult(
    functionFragment: "INITIAL_TOKEN_AMOUNT",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "_balances", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "addOrder", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "buyToken", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "orders", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "register", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "roundEndTime",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "roundStartTime",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "roundStatus",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "roundTime", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "startSaleRound",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "startTradeRound",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "token", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "tokenPrice", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "tokens", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "tradeStock", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "users", data: BytesLike): Result;

  events: {};
}

export interface TradePlatform extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: TradePlatformInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    INITIAL_TOKEN_AMOUNT(overrides?: CallOverrides): Promise<[BigNumber]>;

    _balances(arg0: string, overrides?: CallOverrides): Promise<[BigNumber]>;

    addOrder(
      _amount: BigNumberish,
      _price: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    buyToken(
      _amount: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    orders(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, string, boolean] & {
        tokensAmount: BigNumber;
        price: BigNumber;
        seller: string;
        closed: boolean;
      }
    >;

    register(
      _referer: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    roundEndTime(overrides?: CallOverrides): Promise<[BigNumber]>;

    roundStartTime(overrides?: CallOverrides): Promise<[BigNumber]>;

    roundStatus(overrides?: CallOverrides): Promise<[number]>;

    roundTime(overrides?: CallOverrides): Promise<[BigNumber]>;

    startSaleRound(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    startTradeRound(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    token(overrides?: CallOverrides): Promise<[string]>;

    tokenPrice(overrides?: CallOverrides): Promise<[BigNumber]>;

    tokens(overrides?: CallOverrides): Promise<[BigNumber]>;

    tradeStock(overrides?: CallOverrides): Promise<[BigNumber]>;

    users(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, string, boolean] & {
        amountOfTokens: BigNumber;
        referer: string;
        isReferer: boolean;
      }
    >;
  };

  INITIAL_TOKEN_AMOUNT(overrides?: CallOverrides): Promise<BigNumber>;

  _balances(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

  addOrder(
    _amount: BigNumberish,
    _price: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  buyToken(
    _amount: BigNumberish,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  orders(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, string, boolean] & {
      tokensAmount: BigNumber;
      price: BigNumber;
      seller: string;
      closed: boolean;
    }
  >;

  register(
    _referer: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  roundEndTime(overrides?: CallOverrides): Promise<BigNumber>;

  roundStartTime(overrides?: CallOverrides): Promise<BigNumber>;

  roundStatus(overrides?: CallOverrides): Promise<number>;

  roundTime(overrides?: CallOverrides): Promise<BigNumber>;

  startSaleRound(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  startTradeRound(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  token(overrides?: CallOverrides): Promise<string>;

  tokenPrice(overrides?: CallOverrides): Promise<BigNumber>;

  tokens(overrides?: CallOverrides): Promise<BigNumber>;

  tradeStock(overrides?: CallOverrides): Promise<BigNumber>;

  users(
    arg0: string,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, string, boolean] & {
      amountOfTokens: BigNumber;
      referer: string;
      isReferer: boolean;
    }
  >;

  callStatic: {
    INITIAL_TOKEN_AMOUNT(overrides?: CallOverrides): Promise<BigNumber>;

    _balances(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    addOrder(
      _amount: BigNumberish,
      _price: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    buyToken(_amount: BigNumberish, overrides?: CallOverrides): Promise<void>;

    orders(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, string, boolean] & {
        tokensAmount: BigNumber;
        price: BigNumber;
        seller: string;
        closed: boolean;
      }
    >;

    register(_referer: string, overrides?: CallOverrides): Promise<void>;

    roundEndTime(overrides?: CallOverrides): Promise<BigNumber>;

    roundStartTime(overrides?: CallOverrides): Promise<BigNumber>;

    roundStatus(overrides?: CallOverrides): Promise<number>;

    roundTime(overrides?: CallOverrides): Promise<BigNumber>;

    startSaleRound(overrides?: CallOverrides): Promise<void>;

    startTradeRound(overrides?: CallOverrides): Promise<void>;

    token(overrides?: CallOverrides): Promise<string>;

    tokenPrice(overrides?: CallOverrides): Promise<BigNumber>;

    tokens(overrides?: CallOverrides): Promise<BigNumber>;

    tradeStock(overrides?: CallOverrides): Promise<BigNumber>;

    users(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, string, boolean] & {
        amountOfTokens: BigNumber;
        referer: string;
        isReferer: boolean;
      }
    >;
  };

  filters: {};

  estimateGas: {
    INITIAL_TOKEN_AMOUNT(overrides?: CallOverrides): Promise<BigNumber>;

    _balances(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    addOrder(
      _amount: BigNumberish,
      _price: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    buyToken(
      _amount: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    orders(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    register(
      _referer: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    roundEndTime(overrides?: CallOverrides): Promise<BigNumber>;

    roundStartTime(overrides?: CallOverrides): Promise<BigNumber>;

    roundStatus(overrides?: CallOverrides): Promise<BigNumber>;

    roundTime(overrides?: CallOverrides): Promise<BigNumber>;

    startSaleRound(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    startTradeRound(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    token(overrides?: CallOverrides): Promise<BigNumber>;

    tokenPrice(overrides?: CallOverrides): Promise<BigNumber>;

    tokens(overrides?: CallOverrides): Promise<BigNumber>;

    tradeStock(overrides?: CallOverrides): Promise<BigNumber>;

    users(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    INITIAL_TOKEN_AMOUNT(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    _balances(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    addOrder(
      _amount: BigNumberish,
      _price: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    buyToken(
      _amount: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    orders(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    register(
      _referer: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    roundEndTime(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    roundStartTime(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    roundStatus(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    roundTime(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    startSaleRound(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    startTradeRound(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    token(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    tokenPrice(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    tokens(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    tradeStock(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    users(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
