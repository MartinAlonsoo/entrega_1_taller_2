const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Helper compatible con reverts por string y custom errors.
 * Si se pasa expected, verifica que el error contenga ese fragmento.
 */
async function expectRevert(promise, expected) {
  try {
    await promise;
    throw new Error("Se esperaba un revert pero no ocurrió");
  } catch (err) {
    if ((err.message || "").includes("Se esperaba un revert")) {
      throw err;
    }
    if (!expected) return;

    const message = err.message || "";
    if (!message.includes(expected)) {
      throw new Error(
        `Se esperaba revert con "${expected}" pero se obtuvo: ${message}`
      );
    }
  }
}

function statusOf(job) {
  return job.status.toNumber ? job.status.toNumber() : job.status;
}

describe("JobMarketplace", function () {
  let token;
  let marketplace;
  let client, provider, evaluator, other, signer1, signer2;

  const BUDGET = ethers.utils.parseEther("100");
  const INITIAL_BALANCE = ethers.utils.parseEther("1000");
  const DESCRIPTION = "Construir landing page";
  const DELIVERABLE = ethers.utils.formatBytes32String("delivery-v1");
  const REASON = ethers.utils.formatBytes32String("approved");
  const REJECT_REASON = ethers.utils.formatBytes32String("rejected");

  const Status = {
    Open: 0,
    Funded: 1,
    Submitted: 2,
    Completed: 3,
    Rejected: 4,
    Expired: 5,
  };

  async function latestExpiration(offsetSeconds = 3600) {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp + offsetSeconds;
  }

  async function increaseTime(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine");
  }

  async function deployFixture() {
    [client, provider, evaluator, other, signer1, signer2] =
      await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Mock USD", "MUSD");
    await token.deployed();

    const JobMarketplace = await ethers.getContractFactory("JobMarketplace");
    marketplace = await JobMarketplace.deploy(token.address);
    await marketplace.deployed();

    await token.mint(client.address, INITIAL_BALANCE);
  }

  async function createJob(
    providerAddress = provider.address,
    expirationOffset = 3600,
    evaluatorAddress = evaluator.address
  ) {
    const expiresAt = await latestExpiration(expirationOffset);
    const tx = await marketplace
      .connect(client)
      .createJob(
        DESCRIPTION,
        BUDGET,
        evaluatorAddress,
        providerAddress,
        expiresAt
      );
    const receipt = await tx.wait();
    const event = receipt.events.find((e) => e.event === "JobCreated");

    return event.args.jobId.toNumber();
  }

  async function createAndFundJob(
    providerAddress = provider.address,
    expirationOffset = 3600,
    evaluatorAddress = evaluator.address
  ) {
    const jobId = await createJob(
      providerAddress,
      expirationOffset,
      evaluatorAddress
    );
    await token.connect(client).approve(marketplace.address, BUDGET);
    await marketplace.connect(client).fund(jobId);

    return jobId;
  }

  beforeEach(async function () {
    await deployFixture();
  });

  // ─────────────────────────── Happy path ──────────────────────────────

  describe("Happy path", function () {
    it("crear → fondear → entregar → completar paga al proveedor", async function () {
      const jobId = await createAndFundJob();

      const submittedTx = await marketplace
        .connect(provider)
        .submit(jobId, DELIVERABLE);
      const submittedReceipt = await submittedTx.wait();
      const submittedEvent = submittedReceipt.events.find(
        (e) => e.event === "JobSubmitted"
      );
      expect(submittedEvent.args.deliverableRef).to.equal(DELIVERABLE);

      const providerBefore = await token.balanceOf(provider.address);
      const completedTx = await marketplace
        .connect(evaluator)
        .complete(jobId, REASON);
      const completedReceipt = await completedTx.wait();
      const completedEvent = completedReceipt.events.find(
        (e) => e.event === "JobCompleted"
      );
      expect(completedEvent.args.reason).to.equal(REASON);

      const providerAfter = await token.balanceOf(provider.address);
      const job = await marketplace.getJob(jobId);

      expect(statusOf(job)).to.equal(Status.Completed);
      expect(job.deliverableRef).to.equal(DELIVERABLE);
      expect(job.resultReason).to.equal(REASON);
      expect(providerAfter.sub(providerBefore).eq(BUDGET)).to.be.true;
    });

    it("crea un trabajo Open y guarda los campos principales", async function () {
      const jobId = await createJob();
      const job = await marketplace.getJob(jobId);
      const count = await marketplace.jobCount();

      expect(count.toNumber()).to.equal(1);
      expect(job.client).to.equal(client.address);
      expect(job.evaluator).to.equal(evaluator.address);
      expect(job.provider).to.equal(provider.address);
      expect(job.description).to.equal(DESCRIPTION);
      expect(job.budget.eq(BUDGET)).to.be.true;
      expect(statusOf(job)).to.equal(Status.Open);
    });
  });

  // ─────────────────────────── Rechazos ────────────────────────────────

  describe("Rechazos", function () {
    it("cliente rechaza en Open", async function () {
      const jobId = await createJob();
      const clientBefore = await token.balanceOf(client.address);

      const tx = await marketplace.connect(client).reject(jobId, REJECT_REASON);
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "JobRejected");
      const clientAfter = await token.balanceOf(client.address);
      const job = await marketplace.getJob(jobId);

      expect(event.args.reason).to.equal(REJECT_REASON);
      expect(statusOf(job)).to.equal(Status.Rejected);
      expect(job.resultReason).to.equal(REJECT_REASON);
      expect(clientAfter.eq(clientBefore)).to.be.true;
    });

    it("evaluador rechaza en Funded y reembolsa al cliente", async function () {
      const jobId = await createAndFundJob();
      const clientBefore = await token.balanceOf(client.address);

      await marketplace.connect(evaluator).reject(jobId, REJECT_REASON);

      const clientAfter = await token.balanceOf(client.address);
      const job = await marketplace.getJob(jobId);

      expect(statusOf(job)).to.equal(Status.Rejected);
      expect(job.resultReason).to.equal(REJECT_REASON);
      expect(clientAfter.sub(clientBefore).eq(BUDGET)).to.be.true;
    });

    it("evaluador rechaza en Submitted y reembolsa al cliente", async function () {
      const jobId = await createAndFundJob();
      await marketplace.connect(provider).submit(jobId, DELIVERABLE);

      const clientBefore = await token.balanceOf(client.address);
      await marketplace.connect(evaluator).reject(jobId, REJECT_REASON);
      const clientAfter = await token.balanceOf(client.address);
      const job = await marketplace.getJob(jobId);

      expect(statusOf(job)).to.equal(Status.Rejected);
      expect(job.deliverableRef).to.equal(DELIVERABLE);
      expect(job.resultReason).to.equal(REJECT_REASON);
      expect(clientAfter.sub(clientBefore).eq(BUDGET)).to.be.true;
    });
  });

  // ─────────────────────────── Expiración ──────────────────────────────

  describe("Expiración", function () {
    it("claimRefund funciona desde Funded", async function () {
      const jobId = await createAndFundJob(provider.address, 60);
      await increaseTime(61);

      const clientBefore = await token.balanceOf(client.address);
      await marketplace.connect(other).claimRefund(jobId);
      const clientAfter = await token.balanceOf(client.address);
      const job = await marketplace.getJob(jobId);

      expect(statusOf(job)).to.equal(Status.Expired);
      expect(clientAfter.sub(clientBefore).eq(BUDGET)).to.be.true;
    });

    it("claimRefund funciona desde Submitted", async function () {
      const jobId = await createAndFundJob(provider.address, 60);
      await marketplace.connect(provider).submit(jobId, DELIVERABLE);
      await increaseTime(61);

      const clientBefore = await token.balanceOf(client.address);
      await marketplace.connect(other).claimRefund(jobId);
      const clientAfter = await token.balanceOf(client.address);
      const job = await marketplace.getJob(jobId);

      expect(statusOf(job)).to.equal(Status.Expired);
      expect(job.deliverableRef).to.equal(DELIVERABLE);
      expect(clientAfter.sub(clientBefore).eq(BUDGET)).to.be.true;
    });

    it("claimRefund revierte si el trabajo no expiro", async function () {
      const jobId = await createAndFundJob();

      await expectRevert(marketplace.connect(other).claimRefund(jobId));
    });
  });

  // ─────────────────────────── Control de acceso ───────────────────────

  describe("Control de acceso", function () {
    it("setProvider revierte si no llama el cliente", async function () {
      const jobId = await createJob(ethers.constants.AddressZero);

      await expectRevert(
        marketplace.connect(other).setProvider(jobId, provider.address)
      );
    });

    it("fund revierte si no llama el cliente", async function () {
      const jobId = await createJob();
      await token.connect(client).approve(marketplace.address, BUDGET);

      await expectRevert(marketplace.connect(other).fund(jobId));
    });

    it("submit revierte si no llama el proveedor", async function () {
      const jobId = await createAndFundJob();

      await expectRevert(
        marketplace.connect(other).submit(jobId, DELIVERABLE)
      );
    });

    it("complete revierte si no llama el evaluador", async function () {
      const jobId = await createAndFundJob();
      await marketplace.connect(provider).submit(jobId, DELIVERABLE);

      await expectRevert(marketplace.connect(other).complete(jobId, REASON));
    });

    it("reject revierte con caller incorrecto en Open", async function () {
      const jobId = await createJob();

      await expectRevert(marketplace.connect(other).reject(jobId, REJECT_REASON));
    });

    it("reject revierte con caller incorrecto en Funded", async function () {
      const jobId = await createAndFundJob();

      await expectRevert(marketplace.connect(other).reject(jobId, REJECT_REASON));
    });

    it("reject revierte con caller incorrecto en Submitted", async function () {
      const jobId = await createAndFundJob();
      await marketplace.connect(provider).submit(jobId, DELIVERABLE);

      await expectRevert(marketplace.connect(other).reject(jobId, REJECT_REASON));
    });

    it("fund revierte si el trabajo no tiene proveedor", async function () {
      const jobId = await createJob(ethers.constants.AddressZero);
      await token.connect(client).approve(marketplace.address, BUDGET);

      await expectRevert(marketplace.connect(client).fund(jobId));
    });
  });

  // ─────────────────────────── MultiSig evaluador ──────────────────────

  describe("Multisig como evaluador", function () {
    it("complete solo tiene exito cuando el Multisig alcanza threshold y ejecuta", async function () {
      const MultiSig = await ethers.getContractFactory("MultiSig");
      const multisig = await MultiSig.deploy(
        [client.address, signer1.address, signer2.address],
        2
      );
      await multisig.deployed();

      const jobId = await createAndFundJob(provider.address, 3600, multisig.address);
      await marketplace.connect(provider).submit(jobId, DELIVERABLE);

      const data = marketplace.interface.encodeFunctionData("complete", [
        jobId,
        REASON,
      ]);

      await multisig.connect(client).propose(marketplace.address, 0, data);
      await multisig.connect(client).approve(0);

      await expectRevert(multisig.connect(client).execute(0));

      const providerBefore = await token.balanceOf(provider.address);

      await multisig.connect(signer1).approve(0);
      await multisig.connect(signer2).execute(0);

      const providerAfter = await token.balanceOf(provider.address);
      const job = await marketplace.getJob(jobId);
      const proposal = await multisig.getProposal(0);

      expect(statusOf(job)).to.equal(Status.Completed);
      expect(job.resultReason).to.equal(REASON);
      expect(proposal.executed).to.be.true;
      expect(providerAfter.sub(providerBefore).eq(BUDGET)).to.be.true;
    });
  });
});
