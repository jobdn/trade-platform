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
  let acc3: SignerWithAddress;
  let platform: TradePlatform;
  let token: TradeToken;
  const ROUND_TIME = 60;
  const SALE = 0;
  const TRADE = 1;
  const INITIAL_TOKEN_AMOUNT = 10 ** 5;
  const INITIAL_PRICE: BigNumber = utils.parseEther("0.00001");

  beforeEach(async () => {
    [signer, acc1, acc2, acc3] = await ethers.getSigners();
    token = await new TradeToken__factory(signer).deploy("TRADE TOKEN", "TTKN");

    await expect(
      new TradePlatform__factory(signer).deploy(token.address, 0)
    ).to.be.revertedWith("Platform: invalid round time");
    await expect(
      new TradePlatform__factory(signer).deploy(
        constants.AddressZero,
        BigNumber.from(ROUND_TIME)
      )
    ).to.be.revertedWith("Platform: invalid token");

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

    it("should be fail if token is equal to zero address", async () => {});
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
      expect(await platform.tokenPrice()).to.eq(INITIAL_PRICE);
      expect(await platform.tokens()).to.eq(INITIAL_TOKEN_AMOUNT);
      expect(await platform.roundStatus()).to.eq(SALE);

      const ts = await getTimestamp(saleTx.blockNumber as number);
      expect(await platform.roundStartTime()).to.eq(ts);
      expect(await platform.roundEndTime()).to.eq(ts + ROUND_TIME);
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
      // TODO: check tokens in the second sale round
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
      for (let i = 2; i < 5; i++) {
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

    it("should be fail if invalid", async () => {
      await expect(platform.register(signer.address)).to.be.revertedWith(
        "Plafrotm: invalid referer"
      );
      // signer becomes referer
      await platform.register(constants.AddressZero);
      await platform.connect(acc1).register(signer.address);
      await expect(platform.register(acc1.address)).to.be.revertedWith(
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

      // buy tokens five times
      for (let i = 1; i < 5; i++) {
        await expect(
          await platform.buyToken(100, { value: utils.parseEther("0.01") })
        ).to.changeEtherBalances(
          [signer, platform],
          [utils.parseEther(`-0.001`), utils.parseEther(`0.001`)]
        );
        expect((await platform.users(signer.address)).amountOfTokens).to.eq(
          i * 100
        );
        expect(await platform.tokens()).to.eq(INITIAL_TOKEN_AMOUNT - i * 100);
        expect(await token.balanceOf(signer.address)).to.eq(i * 100);
      }

      const user = await platform.users(signer.address);
      expect(user.isReferer).to.eq(false);
      expect(user.referer).to.eq(constants.AddressZero);
    });

    it("should be possible to buy all tokens and start trade round", async () => {
      await platform.startSaleRound();

      // check
      await expect(
        await platform.buyToken(INITIAL_TOKEN_AMOUNT, {
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

      expect(await platform.roundStartTime()).to.eq(ts);
      expect(await platform.roundEndTime()).to.eq(ts + ROUND_TIME);
      expect(await platform.roundStatus()).to.eq(TRADE);
      expect(await token.balanceOf(platform.address)).to.eq(0);
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
      expect(await platform.roundStartTime()).to.eq(ts);
      expect(await platform.roundEndTime()).to.eq(ts + ROUND_TIME);
      expect(await platform.roundStatus()).to.eq(SALE);
    });
  });

  describe("addOrder", () => {
    it("should be possible to add order", async () => {
      await platform.startSaleRound();
      await platform.buyToken(1000, { value: utils.parseEther("0.01") });
      await network.provider.send("evm_increaseTime", [ROUND_TIME]);

      await platform.startTradeRound();
      await token.approve(platform.address, 1000);
      await platform.addOrder(100, utils.parseEther("0.02"));

      // check
      const firstOrder = await platform.orders(0);
      expect(firstOrder.tokensAmount).to.eq(100);
      expect(firstOrder.price).to.eq(utils.parseEther("0.02"));
      expect(firstOrder.seller).to.eq(signer.address);
      expect(firstOrder.closed).to.eq(false);
      expect(await token.balanceOf(platform.address)).to.eq(100);
    });

    it("should be fail if _amount is equal to zero", async () => {
      await token.approve(platform.address, 1000);
      await expect(
        platform.addOrder(0, utils.parseEther("0.02"))
      ).to.be.revertedWith("Platform: zero funds");
    });

    it("should be fail if sale round", async () => {
      await platform.startSaleRound();
      await platform.buyToken(100, { value: utils.parseEther("0.02") });
      await expect(
        platform.addOrder(10, utils.parseEther("0.02"))
      ).to.be.revertedWith("Platform: only trade round function");
    });
  });

  describe("redeemOrder", () => {
    it("should be possible redeem all order ", async () => {
      // signer becomes a referer
      // acc2 -> acc1 -> signer
      await platform.register(constants.AddressZero);
      await platform.connect(acc1).register(signer.address);
      await platform.connect(acc2).register(acc1.address);

      await platform.startSaleRound();

      // users buy tokens
      await platform.buyToken(100, { value: utils.parseEther("0.01") });
      await platform
        .connect(acc1)
        .buyToken(100, { value: utils.parseEther("0.01") });
      await platform
        .connect(acc2)
        .buyToken(100, { value: utils.parseEther("0.01") });
      await network.provider.send("evm_increaseTime", [ROUND_TIME]);

      await platform.startTradeRound();
      await token.approve(platform.address, 100);
      await token.connect(acc1).approve(platform.address, 100);
      await token.connect(acc2).approve(platform.address, 100);
      // signer creates order with 100 tokens and 100 ether as a price
      await platform.addOrder(100, utils.parseEther("100"));
      await platform.connect(acc1).addOrder(100, utils.parseEther("100"));
      await platform.connect(acc2).addOrder(100, utils.parseEther("100"));

      // acc3 redeems the entire order of signer
      // here signer doen't have referer
      // platform received 5%
      await expect(
        await platform.connect(acc3).redeemOrder(0, 100, {
          value: utils.parseEther("100"),
        })
      ).to.be.changeEtherBalances(
        [acc3, signer, platform],
        [
          utils.parseEther("-100"),
          utils.parseEther("95"),
          utils.parseEther("5"),
        ]
      );
      const signerOrder = await platform.orders(0);
      expect(signerOrder.closed).to.eq(true);
      expect(signerOrder.tokensAmount).to.eq(0);
      expect(signerOrder.price).to.eq(utils.parseEther("0"));

      // acc3 redeems the half order of acc1
      // here acc1 is referer of signer
      // signer receives 2.5% i.e 0.25 * 50 ether
      // platform receives 2.5%
      // acc1 receives 95%, i.e 0.95 * 50 ether
      // and this order goes to next trade round
      await expect(
        await platform.connect(acc3).redeemOrder(1, 50, {
          value: utils.parseEther("51"),
        })
      ).to.be.changeEtherBalances(
        [acc3, acc1, signer, platform],
        [
          utils.parseEther("-50"),
          utils.parseEther("47.5"),
          utils.parseEther("1.25"),
          utils.parseEther("1.25"),
        ]
      );
      const acc1rOrder = await platform.orders(1);
      expect(acc1rOrder.closed).to.eq(false);
      expect(acc1rOrder.tokensAmount).to.eq(50);
      expect(acc1rOrder.price).to.eq(utils.parseEther("50"));

      // check stock
      expect(await platform.tradeStock()).to.eq(utils.parseEther("150"));

      await network.provider.send("evm_increaseTime", [ROUND_TIME]);
      await platform.startSaleRound();
      // Check amount of tokens in new sale round
      expect(await platform.tokens()).to.eq(
        utils.parseEther("150").div(await platform.tokenPrice())
      );

      await network.provider.send("evm_increaseTime", [ROUND_TIME + 1]);
      await platform.startTradeRound();

      // order with index 1 is stored
      expect(acc1rOrder.closed).to.eq(false);
      expect(acc1rOrder.tokensAmount).to.eq(50);
      expect(acc1rOrder.price).to.eq(utils.parseEther("50"));

      // acc3 redeems the entire order of acc2
      // here acc2 is referer of acc1 and acc1 is referer of signer
      // signer receives 2.5% i.e 0.25 * 50 ether
      // acc1 receives 2.5%
      // acc2 receives 95%, i.e 0.95 * 50 ether
      await expect(
        await platform.connect(acc3).redeemOrder(2, 100, {
          value: utils.parseEther("100"),
        })
      ).to.be.changeEtherBalances(
        [acc3, acc2, acc1, signer],
        [
          utils.parseEther("-100"),
          utils.parseEther("95"),
          utils.parseEther("2.5"),
          utils.parseEther("2.5"),
        ]
      );
    });

    it("should be fail if invalid index", async () => {
      await platform.startSaleRound();

      await network.provider.send("evm_increaseTime", [ROUND_TIME + 1]);
      await platform.startTradeRound();
      await expect(platform.redeemOrder(0, 1)).to.be.revertedWith(
        "Platform: invalid order"
      );
    });

    it("should be fail if order is closed or not enogh funds", async () => {
      await platform.startSaleRound();
      await platform.buyToken(100, { value: utils.parseEther("0.01") });

      await network.provider.send("evm_increaseTime", [ROUND_TIME]);
      await platform.startTradeRound();

      await token.approve(platform.address, 100);
      await platform.addOrder(100, utils.parseEther("100"));

      await expect(
        platform.connect(acc3).redeemOrder(0, 100, {
          value: utils.parseEther("1"),
        })
      ).to.be.revertedWith("Platform: not enough funds");

      await platform.connect(acc3).redeemOrder(0, 100, {
        value: utils.parseEther("100"),
      });

      await expect(
        platform.connect(acc3).redeemOrder(0, 100, {
          value: utils.parseEther("100"),
        })
      ).to.be.revertedWith("Platform: closed order");
    });

    it("should be fail if sale round or user wants to redeem too much", async () => {
      await platform.startSaleRound();
      await platform.buyToken(100, { value: utils.parseEther("0.01") });
      await network.provider.send("evm_increaseTime", [ROUND_TIME]);

      await platform.startTradeRound();
      await token.approve(platform.address, 100);
      await platform.addOrder(100, utils.parseEther("100"));

      await network.provider.send("evm_increaseTime", [ROUND_TIME]);
      await platform.startSaleRound();

      // acc3 wants to redeem too much
      await expect(
        platform.connect(acc3).redeemOrder(0, 101, {
          value: utils.parseEther("100"),
        })
      ).to.be.revertedWith("Platform: invalid _amount");

      await expect(
        platform.connect(acc3).redeemOrder(0, 100, {
          value: utils.parseEther("100"),
        })
      ).to.be.revertedWith("Platform: only trade round function");
    });
  });
});
