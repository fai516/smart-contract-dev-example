import { expect } from "chai";
import { ethers } from "hardhat";
import { CampaignV1 } from "../typechain/CampaignV1";
import Web3 from "web3";
import { Sign as SignDetail } from "web3-core/types";

describe("Campaign", () => {
  let owner: any;
  let addr1: any;
  let addr2: any;
  let campaign: CampaignV1;
  let proposerAddress1: string;
  let proposerAddress2: string;
  const mockTokenUri = "https://api.metazons.com/metadata";
  const mockContractUri = "https://api.metazons.com/metadata/contract";
  const web3 = new Web3();
  // const mockEndDate = 1643587200 // Monday, 31 January 2022 00:00:00 GMT
  const mockStartDate = 123;
  const mockEndDate = 5643587200;
  const totalCandidates = 54;
  const mockTicket = "0x" + Array.from({ length: 64 }, () => 0).join("");
  const getNewValidTicket = (priKey: string): SignDetail => {
    const randomMsg = web3.utils.randomHex(20);
    return web3.eth.accounts.sign(randomMsg, priKey);
  };
  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    proposerAddress1 = web3.utils.toChecksumAddress(addr1.address);
    proposerAddress2 = web3.utils.toChecksumAddress(addr2.address);
    const CampaignV1 = await ethers.getContractFactory("CampaignV1");
    campaign = await CampaignV1.deploy(
      mockTokenUri,
      mockContractUri,
      totalCandidates,
      mockStartDate,
      mockEndDate
    );
    await campaign.deployed();
  });
  describe("Deployment", () => {
    it("should set the right owner", async () => {
      return expect(await campaign.owner()).to.eq(owner.address);
    });
    it("should set the right token uri", async () => {
      return expect(await campaign.uri("0")).to.include(mockTokenUri);
    });
    it("should set the right contract uri", async () => {
      return expect(await campaign.contractURI()).to.include(mockContractUri);
    });
    it("should set the valid initial state", async () => {
      const voteCounts = await campaign.totalVoteCount();
      expect(voteCounts.length).to.eq(totalCandidates);
      for (const voteCount of voteCounts) {
        expect(voteCount.toString()).to.eq("0");
      }
      return;
    });
    it("should set the right startDate", async () => {
      return expect(await campaign.startDate()).to.eq(mockStartDate);
    });
    it("should set the right endDate", async () => {
      return expect(await campaign.endDate()).to.eq(mockEndDate);
    });
  });
  describe("Vote", () => {
    let signDetail: SignDetail;
    let randomMsg = web3.utils.randomHex(20);
    const mockMemo = web3.utils.utf8ToHex("Hello world!");
    const priKey =
      "0x1d76a5769b11b3c2a1ecbc0aad242a0b1547171b000e62e9e09ab459f963a090";
    beforeEach(() => {
      signDetail = web3.eth.accounts.sign(randomMsg, priKey);
    });
    describe("general fail case (expect no event emit)", () => {
      it("should throw if it passed the start date", async () => {
        const Campaign = await ethers.getContractFactory("CampaignV1");
        const campaign = await Campaign.deploy(
          mockTokenUri,
          mockContractUri,
          totalCandidates,
          mockEndDate,
          1
        );
        await campaign.deployed();
        try {
          await campaign
            .connect(addr1)
            .vote(
              [0, 1, 2],
              web3.utils.utf8ToHex("Hello world!"),
              signDetail.messageHash as string,
              signDetail.signature
            );
          expect.fail("it should throw");
        } catch (err: any) {
          return expect(err.message).to.match(/.*vote not started yet.*/);
        }
      });
      it("should throw if it passed the end Date", async () => {
        const Campaign = await ethers.getContractFactory("CampaignV1");
        const campaign = await Campaign.deploy(
          mockTokenUri,
          mockContractUri,
          totalCandidates,
          0,
          1
        );
        await campaign.deployed();
        try {
          await campaign
            .connect(addr1)
            .vote(
              [0, 1, 2],
              web3.utils.utf8ToHex("Hello world!"),
              signDetail.messageHash as string,
              signDetail.signature
            );
          expect.fail("it should throw");
        } catch (err: any) {
          return expect(err.message).to.match(/.*vote is ended already.*/);
        }
      });
      describe("candidateIds", () => {
        const expectedLenErrMsg = new RegExp(/.*Ids length not in \[1,3\].*/);
        const expectedNotAscendingErrMsg = new RegExp(
          /.*Ids not in ascending order.*/
        );
        it("should throw if candidateIds length less than 1", async () => {
          try {
            await campaign
              .connect(addr1)
              .vote(
                [],
                mockMemo,
                signDetail.messageHash as string,
                signDetail.signature
              );
            expect.fail("it should throw");
          } catch (err: any) {
            return expect(err.message).to.match(expectedLenErrMsg);
          }
        });
        it("should throw if candidateIds length more than 3", async () => {
          try {
            await campaign.connect(addr1).vote(
              [1, 2, 3, 4],
              mockMemo,

              signDetail.messageHash as string,
              signDetail.signature
            );
            expect.fail("it should throw");
          } catch (err: any) {
            return expect(err.message).to.match(expectedLenErrMsg);
          }
        });
        it("should throw if candidateIds is not ascending order", async () => {
          try {
            await campaign.connect(addr1).vote(
              [4, 2, 1],
              mockMemo,

              signDetail.messageHash as string,
              signDetail.signature
            );
            expect.fail("it should throw");
          } catch (err: any) {
            return expect(err.message).to.match(expectedNotAscendingErrMsg);
          }
        });
        it("should throw if candidateIds is duplicated", async () => {
          try {
            await campaign.connect(addr1).vote(
              [2, 2],
              mockMemo,

              signDetail.messageHash as string,
              signDetail.signature
            );
            expect.fail("it should throw");
          } catch (err: any) {
            return expect(err.message).to.match(expectedNotAscendingErrMsg);
          }
        });
      });
      it("should throw if memo exceed 128 bytes", async () => {
        try {
          await campaign.connect(addr1).vote(
            [1, 2, 3],
            web3.utils.utf8ToHex(
              Array.from({ length: 129 }, () => "0").join("")
            ),

            signDetail.messageHash as string,
            signDetail.signature
          );
          expect.fail("it should throw");
        } catch (err: any) {
          return expect(err.message).to.match(
            /.*Memo should be within 128 bytes.*/
          );
        }
      });
      it("should throw if it's not authorized", async () => {
        const invalidPriKey =
          "0x5a0ed8e56a2a0cdfec9cfba5ba651e31dddac2b0c78b2f0e1cfd55000d1539d1";
        signDetail = getNewValidTicket(invalidPriKey);
        try {
          await campaign
            .connect(addr1)
            .vote(
              [1, 9, 10],
              mockMemo,
              signDetail.messageHash as string,
              signDetail.signature
            );
          expect.fail("it should throw");
        } catch (err: any) {
          return expect(err.message).to.match(/.*The vote is not authorized.*/);
        }
      });
    });
    describe("successful case", () => {
      it("should emit transfer event and voted event once and update the state if it's successful", async () => {
        const signDetail = getNewValidTicket(priKey);
        const transasction1 = await campaign
          .connect(addr1)
          .vote(
            [0, 1, 2],
            mockMemo,
            signDetail.messageHash as string,
            signDetail.signature
          );
        const receipt1 = await transasction1.wait();
        expect(receipt1.events?.length).to.eq(2);
        expect(transasction1)
          .to.emit(campaign, "TransferSingle")
          .withArgs(
            proposerAddress1,
            "0x0000000000000000000000000000000000000000",
            proposerAddress1,
            0,
            1
          );
        expect(transasction1)
          .to.emit(campaign, "Voted")
          .withArgs([0, 1, 2], proposerAddress1, 0, signDetail.messageHash);
        expect(
          await campaign.isVoted(web3.utils.toChecksumAddress(proposerAddress1))
        ).to.eq(true);
        const voteCounts = await campaign.totalVoteCount();
        expect(voteCounts[0].toString()).eq("1");
        expect(voteCounts[1].toString()).eq("1");
        expect(voteCounts[2].toString()).eq("1");
      });
      it("should throw if the ticket is used", async () => {
        // First vote
        const transasction1 = await campaign
          .connect(addr1)
          .vote(
            [0, 1, 2],
            mockMemo,
            signDetail.messageHash as string,
            signDetail.signature
          );
        const receipt1 = await transasction1.wait();
        expect(receipt1.events?.length).to.eq(2);
        expect(transasction1)
          .to.emit(campaign, "TransferSingle")
          .withArgs(
            proposerAddress1,
            "0x0000000000000000000000000000000000000000",
            proposerAddress1,
            0,
            1
          );
        expect(
          await campaign.isVoted(web3.utils.toChecksumAddress(proposerAddress1))
        ).to.eq(true);
        try {
          // Second vote
          const transasction2 = await campaign
            .connect(addr2)
            .vote(
              [1, 6, 7],
              mockMemo,
              signDetail.messageHash as string,
              signDetail.signature
            );
          const receipt2 = await transasction2.wait();
          expect(receipt2.events?.length).eq(1);
          expect(transasction2)
            .to.emit(campaign, "TransferSingle")
            .withArgs(
              proposerAddress2,
              "0x0000000000000000000000000000000000000000",
              proposerAddress2,
              1,
              1
            );
          expect(
            await campaign.isVoted(
              web3.utils.toChecksumAddress(proposerAddress2)
            )
          ).to.eq(true);
          const voteCounts = await campaign.totalVoteCount();
          expect(voteCounts[0].toString()).eq("1");
          expect(voteCounts[1].toString()).eq("2");
          expect(voteCounts[2].toString()).eq("1");
          expect(voteCounts[6].toString()).eq("1");
          expect(voteCounts[7].toString()).eq("1");
        } catch (err: any) {
          return expect(err.message).match(/.*Ticket is used.*/);
        }
      });
      it("should throw if voter already voted", async () => {
        await campaign
          .connect(addr1)
          .vote(
            [0, 1, 2],
            mockMemo,
            signDetail.messageHash as string,
            signDetail.signature
          );
        try {
          await campaign.connect(addr1).vote(
            [0, 1, 2],
            mockMemo,

            signDetail.messageHash as string,
            signDetail.signature
          );
          expect.fail("it should throw");
        } catch (err: any) {
          return expect(err.message).to.match(/.*User is voted.*/);
        }
      });
    });
  });
  describe("pVote", () => {
    it("should throw if the call is not a owner", async () => {
      try {
        await campaign
          .connect(addr1)
          .pVote([0, 1, 2], proposerAddress1, mockTicket);
        expect.fail("it should fail");
      } catch (err: any) {
        return expect(err.message).match(
          /.*Ownable: caller is not the owner.*/
        );
      }
    });
    it("should able to event mint and voted event if the caller is a owner", async () => {
      const transasction1 = await campaign
        .connect(owner)
        .pVote([0, 1, 2], proposerAddress1, mockTicket);
      const receipt1 = await transasction1.wait();
      expect(receipt1.events?.length).to.eq(2);
      expect(transasction1)
        .to.emit(campaign, "TransferSingle")
        .withArgs(
          owner.address,
          "0x0000000000000000000000000000000000000000",
          proposerAddress1,
          0,
          1
        );
      expect(transasction1)
        .to.emit(campaign, "Voted")
        .withArgs(
          [0, 1, 2],
          proposerAddress1,
          0,
          "0x0000000000000000000000000000000000000000000000000000000000000000"
        );
      expect(
        await campaign.isVoted(web3.utils.toChecksumAddress(proposerAddress1))
      ).to.eq(true);
      const voteCounts = await campaign.totalVoteCount();
      expect(voteCounts[0].toString()).eq("1");
      expect(voteCounts[1].toString()).eq("1");
      expect(voteCounts[2].toString()).eq("1");
    });
  });
  describe("Update props", () => {
    describe("setUri", () => {
      const newUri = "newUri";
      it("should throw if caller is not the owner", async () => {
        try {
          await campaign.connect(addr1).setUri(newUri);
          expect.fail("it should fail");
        } catch (err: any) {
          return expect(err.message).match(
            /.*Ownable: caller is not the owner.*/
          );
        }
      });
      it("should update to correct state if setUri is called by owner", async () => {
        await campaign.connect(owner).setUri(newUri);
        return expect(await campaign.uri(1)).to.eq(newUri);
      });
    });
    describe("setEndDate", () => {
      const newEndDate = 123456789;
      it("should throw if caller is not the owner", async () => {
        try {
          await campaign.connect(addr1).setEndDate(newEndDate);
          expect.fail("it should fail");
        } catch (err: any) {
          return expect(err.message).match(
            /.*Ownable: caller is not the owner.*/
          );
        }
      });
      it("should update to correct state if setEndDate is called by owner", async () => {
        await campaign.connect(owner).setEndDate(newEndDate);
        return expect(await campaign.endDate()).to.eq(newEndDate);
      });
    });
    describe("setContractURI", () => {
      const newContractUri = "newContractUri";
      it("should throw if caller is not the owner", async () => {
        try {
          await campaign.connect(addr1).setContractURI(newContractUri);
          expect.fail("it should fail");
        } catch (err: any) {
          return expect(err.message).match(
            /.*Ownable: caller is not the owner.*/
          );
        }
      });
      it("should update to correct state if setContractURI is called by owner", async () => {
        await campaign.connect(owner).setContractURI(newContractUri);
        return expect(await campaign.contractURI()).to.include(newContractUri);
      });
    });
  });
});
