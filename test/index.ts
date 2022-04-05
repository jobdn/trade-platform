import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, constants, utils } from "ethers";
import { ethers, network } from "hardhat";
import {
  TradePlatform,
  TradePlatform__factory,
  TradeToken,
  TradeToken__factory,
} from "../typechain-types";

describe("ACDMPlatform", function () {
  let signer: SignerWithAddress;
  let acc1: SignerWithAddress;
  let acc2: SignerWithAddress;
  let platform: TradePlatform;
  let token: TradeToken;
  const ROUND_TIME = 60;
  const SALE = 0;
  const TRADE = 1;
  const INITIAL_TOKEN_AMOUNT = 10 ** 5;
  const INITIAL_PRICE: BigNumber = utils.parseEther("0.00001");

  beforeEach(async () => {
    [signer, acc1, acc2] = await ethers.getSigners();
    token = await new TradeToken__factory(signer).deploy("TRADE TOKEN", "TTKN");
    platform = await new TradePlatform__factory(signer).deploy(
      token.address,
      BigNumber.from(ROUND_TIME)
    );
    await token.grantMintAndBurnRolesTo(platform.address);
    expect(
      await token.hasRole(
        utils.keccak256(utils.toUtf8Bytes("MINTER_ROLE")),
        platform.address
      )
    );
    expect(
      await token.hasRole(
        utils.keccak256(utils.toUtf8Bytes("BURNER_ROLE")),
        platform.address
      )
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
      expect(await platform.tokenPrice()).to.eq(INITIAL_PRICE);
      expect(await platform.tokens()).to.eq(INITIAL_TOKEN_AMOUNT);
      const ts = await getTimestamp(saleTx.blockNumber as number);
      expect(await platform.startsAt()).to.eq(ts);
      expect(await platform.endsAt()).to.eq(ts + ROUND_TIME);
      expect(await token.balanceOf(platform.address)).to.eq(
        INITIAL_TOKEN_AMOUNT
      );

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

    it("should be fail if the sale round starts again after the sale round", async () => {
      await platform.startSaleRound();
      await expect(platform.startSaleRound()).to.be.revertedWith(
        "Platform: trade round is not over"
      );
    });

    it("should be fail if the time of the last round is not over", async () => {
      await platform.startSaleRound();
      await network.provider.send("evm_increaseTime", [ROUND_TIME + 1]);
      await platform.startTradeRound();

      await expect(platform.startSaleRound()).to.be.revertedWith(
        "Platform: time of the last round is not over"
      );
    });
  });

  describe("register", () => {
    it("should be possible to register user", async () => {
      const signers = await ethers.getSigners();
      for (let i = 2; i < 10; i++) {
        // Initial referer
        await platform.connect(signers[i]).register(constants.AddressZero);
        const user = await platform.users(signers[i].address);
        expect(user.amountOfTokens).to.eq(0);
        expect(user.isReferer).to.eq(true);
        expect(user.referer).to.eq(constants.AddressZero);

        // Second user with
        await platform.connect(acc1).register(signers[i].address);
        const acc1User = await platform.users(acc1.address);
        expect(acc1User.referer).to.eq(signers[i].address);
      }
      expect((await platform.users(acc1.address)).amountOfTokens).to.eq(0);
      expect((await platform.users(acc1.address)).isReferer).to.eq(true);
    });

    it("should be fail if referer doesn't exist", async () => {
      await expect(platform.register(signer.address)).to.be.revertedWith(
        "Plafrotm: invalid referer"
      );
    });

    it("should be fail if referer is the msg.sender", async () => {
      await expect(platform.register(acc1.address)).to.be.revertedWith(
        "Platform: not existent referer"
      );
    });

    it("should be possible to register after buying of tokens", async () => {
      await platform.startSaleRound();
      await platform.buyToken(100, { value: utils.parseEther("0.01") });
      await platform.register(constants.AddressZero);
      const user = await platform.users(signer.address);
      expect(user.amountOfTokens).to.eq(100);
      expect(user.isReferer).to.eq(true);
      expect(user.referer).to.eq(constants.AddressZero);
    });
  });

  describe("buyToken", () => {
    it("should be possible to buy tokens with revert tokens back", async () => {
      await platform.startSaleRound();

      for (let i = 1; i < 10; i++) {
        // check
        await expect(
          await platform.buyToken(100, { value: utils.parseEther("0.01") })
        ).to.changeEtherBalances(
          [signer, platform],
          [-INITIAL_PRICE.toNumber() * 100, INITIAL_PRICE.toNumber() * 100]
        );
        expect((await platform.users(signer.address)).amountOfTokens).to.eq(
          i * 100
        );
        expect(await platform.tokens()).to.eq(INITIAL_TOKEN_AMOUNT - i * 100);
        expect(await token.balanceOf(signer.address)).to.eq(i * 100);
      }
      expect((await platform.users(signer.address)).isReferer).to.eq(false);
      expect((await platform.users(signer.address)).referer).to.eq(
        constants.AddressZero
      );
    });

    it("should be possible to buy all tokens and start trade round", async () => {
      const PAYABLE_TOKENS = 100000;
      await platform.startSaleRound();

      // check
      await expect(
        await platform.buyToken(PAYABLE_TOKENS, {
          value: utils.parseEther("1"),
        })
      ).to.changeEtherBalances(
        [signer, platform],
        [utils.parseEther("-1"), utils.parseEther("1")]
      );
      expect(await platform.tokens()).to.eq(0);
      expect(await platform.roundStatus()).to.eq(TRADE);
    });

    it("should be possible to buy tokens and send fee to referers", async () => {
      await platform.startSaleRound();
      await platform.register(constants.AddressZero);
      await platform.connect(acc1).register(signer.address);
      await platform.connect(acc2).register(acc1.address);

      const SPENDED_ETH = utils.parseEther("0.001");
      const FIRST_REFERER_FEE = utils.parseEther(`${0.001 * 0.05}`);
      const SECOND_REFERER_FEE = utils.parseEther(`${0.001 * 0.03}`);
      const PLATFORM_FEE_WITH_ONE_REFERER = utils.parseEther(`${0.001 * 0.95}`);
      const PLATFORM_FEE_WITH_TWO_REFERER = utils.parseEther(`${0.001 * 0.92}`);

      // one referer
      await expect(
        await platform
          .connect(acc1)
          .buyToken(100, { value: utils.parseEther("0.01") })
      ).to.changeEtherBalances(
        [acc1, signer, platform],
        [-SPENDED_ETH, FIRST_REFERER_FEE, PLATFORM_FEE_WITH_ONE_REFERER]
      );

      // two referer
      await expect(
        await platform
          .connect(acc2)
          .buyToken(100, { value: utils.parseEther("0.01") })
      ).to.changeEtherBalances(
        [acc2, acc1, signer, platform],
        [
          -SPENDED_ETH,
          FIRST_REFERER_FEE,
          SECOND_REFERER_FEE,
          PLATFORM_FEE_WITH_TWO_REFERER,
        ]
      );
    });

    it("should be fail if not enough tokens on the plaftorm", async () => {
      await platform.startSaleRound();
      const prevUserBalance = await signer.getBalance();

      // check
      const WRONG_PAYABLE_TOKENS = 10 ** 6;
      await expect(
        platform.buyToken(WRONG_PAYABLE_TOKENS, {
          value: utils.parseEther("1"),
        })
      ).to.be.revertedWith("Platform: not enough tokens on the plaftorm");
      expect(await signer.getBalance()).to.eq(prevUserBalance);
    });

    it("should be fail if user tries to buy tokens with not enough ethers", async () => {
      await platform.startSaleRound();
      await expect(platform.buyToken(100)).to.be.revertedWith(
        "Platform: not enough msg.value"
      );
    });

    it("should be fail if user tries to buy tokens in the trade round", async () => {
      await platform.startSaleRound();
      await network.provider.send("evm_increaseTime", [ROUND_TIME + 1]);
      await platform.startTradeRound();
      expect(
        platform.buyToken(100, { value: utils.parseEther("1") })
      ).to.be.revertedWith("Platform: only sale round");
    });
  });

  describe("startTradeRound", () => {
    it("should start a trade round", async () => {
      await platform.startSaleRound();
      await network.provider.send("evm_increaseTime", [ROUND_TIME + 1]);

      const tx = await platform.startTradeRound();
      const ts = await getTimestamp(tx.blockNumber as number);

      expect(await platform.startsAt()).to.eq(ts);
      expect(await platform.endsAt()).to.eq(ts + ROUND_TIME);
      expect(await platform.roundStatus()).to.eq(TRADE);
    });

    it("should be fail if user tries to start trade round again after trade round", async () => {
      await expect(platform.startTradeRound()).to.be.revertedWith(
        "Platform: sale round is not over"
      );
    });

    it("should be fail if user tries to start a trade round too early", async () => {
      const saleTx = await platform.startSaleRound();
      await expect(platform.startTradeRound()).to.be.revertedWith(
        "Platform: time of the last round is not over"
      );

      const ts = await getTimestamp(saleTx.blockNumber as number);
      expect(await platform.startsAt()).to.eq(ts);
      expect(await platform.endsAt()).to.eq(ts + ROUND_TIME);
      expect(await platform.roundStatus()).to.eq(SALE);
    });
  });
});
