// const { assert, expect } = require("chai")
// const { getNamedAccounts, deployments, ethers } = require("hardhat")
// const { developmentChains, networkConfig } = require("../../helper-hardhat-config.js")

// !developmentChains.includes(network.name)
//     ? describe.skip
//     : describe("Raffle Unit Tests", function () {
//           let raffle,
//               vrfCoordinatorV2Mock,
//               raffleContract,
//               raffleEntranceFee,
//               deployer,
//               raffleState,
//               interval
//           const chainId = network.config.chainId

//           beforeEach(async function () {
//               accounts = await ethers.getSigners()
//               deployer = (await getNamedAccounts()).deployer
//               await deployments.fixture(["all"])
//               raffleContract = await ethers.getContract("Raffle")
//               raffle = await ethers.getContract("Raffle", deployer)
//               vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
//               raffleEntranceFee = raffle.getEntranceFee()
//               interval = await raffle.getInterval()
//           })
//           describe("constructor", function () {
//               it("intitiallizes the raffle correctly", async () => {
//                   // Ideally, we'd separate these out so that only 1 assert per "it" block
//                   raffleState = await raffle.getRaffleState()
//                   assert.equal(raffleState.toString(), "0")
//                   assert.equal(interval.toString(), networkConfig[chainId]["interval"])
//               })
//           })

//           describe("enterRaffle", function () {
//               it("revert when you don't pay enough", async function () {
//                   await expect(raffle.enterRaffle()).to.be.revertedWith(
//                       "Raffle__NotEnoughETHEntered"
//                   )
//               })
//               it("records players when the enter", async function () {
//                   await raffle.enterRaffle({ value: raffleEntranceFee })
//                   const playerFromContract = await raffle.getPlayers(0)
//                   assert.equal(playerFromContract, deployer)
//               })
//               it("emits event on enter", async function () {
//                   await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
//                       raffle,
//                       "RaffleEnter"
//                   )
//               })
//               it("can't enter raffle, revert when CALCULATING", async function () {
//                   await raffle.enterRaffle({ value: raffleEntranceFee })
//                   await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
//                   await network.provider.send("evm_mine", [])
//                   // We pretend to be a Chainlink Keeper
//                   await raffle.performUpkeep([])
//                   await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith(
//                       "Raffle__NotOpen"
//                   )
//               })
//           })

//           describe("checkUpkeep", function () {
//               it("return false if people haven't sent any ETH", async function () {
//                   await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
//                   await network.provider.send("evm_mine", [])
//                   const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
//                   assert(!upkeepNeeded)
//               })
//               it("returns false if raffle isn't open", async function () {
//                   await raffle.enterRaffle({ value: raffleEntranceFee })
//                   await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
//                   await network.provider.send("evm_mine", [])
//                   await raffle.performUpkeep([])
//                   const raffleState = await raffle.getRaffleState()
//                   const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
//                   assert.equal(raffleState.toString(), "1")
//                   assert.equal(upkeepNeeded, false)
//               })
//               it("returns false if enough time hasn't passed", async () => {
//                   await raffle.enterRaffle({ value: raffleEntranceFee })
//                   await network.provider.send("evm_increaseTime", [interval.toNumber() - 1])
//                   await network.provider.request({ method: "evm_mine", params: [] })
//                   const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
//                   assert(!upkeepNeeded)
//               })
//               it("returns true if enough time has passed, has players, eth, and is open", async () => {
//                   await raffle.enterRaffle({ value: raffleEntranceFee })
//                   await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
//                   await network.provider.request({ method: "evm_mine", params: [] })
//                   const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
//                   assert(upkeepNeeded)
//               })
//           })

//           describe("performUpkeep", function () {
//               it("it can only run if checkupkeep is true", async function () {
//                   await raffle.enterRaffle({ value: raffleEntranceFee })
//                   await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
//                   await network.provider.send("evm_mine", [])
//                   const tx = await raffle.performUpkeep([])
//                   assert(tx)
//               })
//               it("reverts with checkupKeep is false", async function () {
//                   await expect(raffle.performUpkeep([])).to.be.revertedWith("")
//               })
//               it("updates the raffle state, emits and calls vrf coordinator", async function () {
//                   await raffle.enterRaffle({ value: raffleEntranceFee })
//                   await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
//                   await network.provider.send("evm_mine", [])
//                   const txResponse = await raffle.performUpkeep([])
//                   const txReceipt = await txResponse.wait(1)
//                   const requestId = txReceipt.events[1].args.requestId
//                   const raffleState = await raffle.getRaffleState()
//                   assert(requestId.toString() > "0")
//                   assert(raffleState.toString() == "1")
//               })
//           })

//           describe("fulfuillRandomWords", function () {
//               beforeEach(async function () {
//                   await raffle.enterRaffle({ value: raffleEntranceFee })
//                   await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
//                   await network.provider.send("evm_mine", [])
//               })
//               it("can only be called after performance", async function () {
//                   await expect(
//                       vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
//                   ).to.be.revertedWith("nonexistent request")
//                   await expect(
//                       vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
//                   ).to.be.revertedWith("nonexistent request")
//               })

//               it("picks a winner, resets, and sends money", async () => {
//                   const additionalEntrances = 3 // to test
//                   const startingIndex = 2
//                   for (let i = startingIndex; i < startingIndex + additionalEntrances; i++) {
//                       // i = 2; i < 5; i=i+1
//                       raffle = raffleContract.connect(accounts[i]) // Returns a new instance of the Raffle contract connected to player
//                       await raffle.enterRaffle({ value: raffleEntranceFee })
//                   }
//                   const startingTimeStamp = await raffle.getLatestTimeStamp() // stores starting timestamp (before we fire our event)

//                   // This will be more important for our staging tests...
//                   await new Promise(async (resolve, reject) => {
//                       raffle.once("WinnerPicked", async () => {
//                           // event listener for WinnerPicked
//                           console.log("WinnerPicked event fired!")
//                           // assert throws an error if it fails, so we need to wrap
//                           // it in a try/catch so that the promise returns event
//                           // if it fails.
//                           try {
//                               // Now lets get the ending values...
//                               const recentWinner = await raffle.getRecentWinner()
//                               const raffleState = await raffle.getRaffleState()
//                               const winnerBalance = await accounts[2].getBalance()
//                               const endingTimeStamp = await raffle.getLatestTimeStamp()
//                               await expect(raffle.getPlayers(0)).to.be.reverted
//                               // Comparisons to check if our ending values are correct:
//                               assert.equal(recentWinner.toString(), accounts[2].address)
//                               assert.equal(raffleState, 0)
//                               assert.equal(
//                                   winnerBalance.toString(),
//                                   startingBalance
//                                       .add(
//                                           raffleEntranceFee
//                                               .mul(additionalEntrances)
//                                               .add(raffleEntranceFee)
//                                       )
//                                       .toString()
//                               )
//                               assert(endingTimeStamp > startingTimeStamp)
//                               resolve() // if try passes, resolves the promise
//                           } catch (e) {
//                               reject(e) // if try fails, rejects the promise
//                           }
//                       })

//                       const tx = await raffle.performUpkeep("0x")
//                       const txReceipt = await tx.wait(1)
//                       const startingBalance = await accounts[2].getBalance()
//                       await vrfCoordinatorV2Mock.fulfillRandomWords(
//                           txReceipt.events[1].args.requestId,
//                           raffle.address
//                       )
//                   })

//                   //   it("picks a winner, resets the lottery, and sends money", async function () {
//                   //       const additionalEntrants = 3
//                   //       const startingAccountIndex = 2 //deployer = 0
//                   //       const accounts = await ethers.getSigners()
//                   //       for (
//                   //           let i = startingAccountIndex;
//                   //           i < startingAccountIndex + additionalEntrants;
//                   //           i++
//                   //       ) {
//                   //           const accountConnectedRaffle = raffle.connect(accounts[i])
//                   //           await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee })
//                   //       }
//                   //       const startingTimestamp = await raffle.getLatestTimeStamp()

//                   //       // performUpkeep (mock being chainlink keeper)
//                   //       // fulfillRandomWords (mock being chainLink VRF)
//                   //       // We will have to wait for the fulfillRandomWords to be called
//                   //       await new Promise(async (resolve, reject) => {
//                   //           raffle.once("WinnerPicked", async () => {
//                   //               console.log("WinnerPicked event fired!")
//                   //               try {
//                   //                   console.log(recentWinner)
//                   //                   console.log(accounts[2].address)
//                   //                   console.log(accounts[0].address)
//                   //                   console.log(accounts[1].address)
//                   //                   console.log(accounts[3].address)
//                   //                   const recentWinner = await raffle.getRecentWinner()
//                   //                   const raffleState = await raffle.getRaffleState()
//                   //                   const endingTimeStamp = await raffle.getLatestTimeStamp()
//                   //                   const numPlayers = await raffle.getNumberOfPlayers()
//                   //                   const winnerEndingBalance = await accounts[2].getBalance()
//                   //                   assert.equal(numPlayers.toString(), "0")
//                   //                   assert.equal(raffleState.toString(), "0")
//                   //                   assert(endingTimeStamp > startingTimeStamp)

//                   //                   assert.equal(
//                   //                       winnerEndingBalance.toString(),
//                   //                       winnerStartingBalance
//                   //                           .add(
//                   //                               raffleEntranceFee
//                   //                                   .mul(additionalEntrants)
//                   //                                   .add(raffleEntranceFee)
//                   //                           )
//                   //                           .toString()
//                   //                   )
//                   //                   resolve()
//                   //               } catch (e) {
//                   //                   reject(e)
//                   //               }
//                   //               //   resolve()
//                   //           })
//                   //       })
//                   //       // Setting up the listener
//                   //       // below, we will fire the event, and the listener will pick it up, and resolve
//                   //       const tx = await raffle.performUpkeep([])
//                   //       const txReceipt = await tx.wait(1)
//                   //       const winnerStartingBalance = await accounts[2].getBalance()
//                   //       await vrfCoordinatorV2Mock.fulfillRandomWords(
//                   //           txReceipt.events[1].args.requestId,
//                   //           raffle.address
//                   //       )
//                   //   })
//               })
//           })
//       })
