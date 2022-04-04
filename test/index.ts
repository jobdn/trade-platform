import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, utils } from "ethers";
import { ethers, network } from "hardhat";
import {
  TradePlatform,
  TradePlatform__factory,
  TradeToken,
  TradeToken__factory,
} from "../typechain-types";

describe("ACDMPlatform", function () {
  let signer: SignerWithAddress;
  let platform: TradePlatform;
  let token: TradeToken;
  const ROUND_TIME = 60;
  const SALE = 0;
  const TRADE = 1;
  const INITIAL_TOKEN_AMOUNT = 10 ** 5;

  beforeEach(async () => {
    [signer] = await ethers.getSigners();
    token = await new TradeToken__factory(signer).deploy("TRADE TOKEN", "TTKN");
    platform = await new TradePlatform__factory(signer).deploy(
      token.address,
      BigNumber.from(ROUND_TIME)
    );
    await token.setRoleTo(
      utils.formatBytes32String("MINTER_ROLE"),
      platform.address
    );
    expect(
      await token.hasRole(
        utils.formatBytes32String("MINTER_ROLE"),
        platform.address
      )
    );
    await token.setRoleTo(
      utils.formatBytes32String("BURNER_ROLE"),
      platform.address
    );
  });

  describe("deploy", () => {
    it("should deploy ACDMPlatform", async () => {
      expect(platform.address).to.be.properAddress;
      expect(await platform.token()).to.eq(token.address);
      expect(await platform.roundTime()).to.eq(ROUND_TIME);
      expect(await platform.INITIAL_TOKEN_AMOUNT()).to.eq(INITIAL_TOKEN_AMOUNT);
      expect(await platform.roundStatus()).to.eq(TRADE);
    });
  });

  // HELPERS
  const getTimestamp = async (bn: number): Promise<number> => {
    return (await ethers.provider.getBlock(bn)).timestamp;
  };
  // END HELPERS

  describe("startSaleRound", () => {
    it("should start sale round", async () => {
      // first sale round
      const saleTx = await platform.startSaleRound();
      expect(await platform.roundStatus()).to.eq(SALE);
      expect(await platform.tokenPrice()).to.eq(utils.parseEther("0.00001"));
      expect(await platform.tokens()).to.eq(INITIAL_TOKEN_AMOUNT);
      const ts = await getTimestamp(saleTx.blockNumber as number);
      expect(await platform.startsAt()).to.eq(ts);
      expect(await platform.endsAt()).to.eq(ts + ROUND_TIME);

      await network.provider.send("evm_increaseTime", [ROUND_TIME + 1]);
      // starts trade round
      await platform.startTradeRound();
      expect(await platform.roundStatus()).to.eq(TRADE);

      // second sale round
      await network.provider.send("evm_increaseTime", [ROUND_TIME + 1]);
      await platform.startSaleRound();
      expect(await platform.tokenPrice()).to.eq(utils.parseEther("0.0000143"));
      expect(await platform.tokens()).to.eq(0);
    });

    it("should be fail if tht sale round starts again after the sale round", async () => {
      await platform.startSaleRound();
      await expect(platform.startSaleRound()).to.be.revertedWith(
        "Platform: trade round is not over"
      );
    });

    it("should fail if the time of the last round is not over", async () => {
      await platform.startSaleRound();
      await network.provider.send("evm_increaseTime", [ROUND_TIME + 1]);
      await platform.startTradeRound();

      await expect(platform.startSaleRound()).to.be.revertedWith(
        "Platform: time of last round is not over"
      );
    });
  });
});
