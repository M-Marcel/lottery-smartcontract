const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Staging Tests", function () {
          let raffle, raffleContract, raffleEntranceFee, player, deployer

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              //   accounts = await ethers.getSigners() // could also do with getNamedAccounts
              //   deployer = accounts[0]
              //   player = accounts[1]
              raffle = await ethers.getContract("Raffle", deployer) // Returns a new connection to the Raffle contract
              //   raffleContract = await ethers.getContract("Raffle") // Returns a new connection to the Raffle contract
              //   raffle = raffleContract.connect(player) // Returns a new instance of the Raffle contract connected to player
              raffleEntranceFee = await raffle.getEntranceFee()
          })
          describe("fulfillRandomWords", function () {
              it("works with live keepers and chainlink VRF, we get a random winner", async function () {
                  // enter raffle
                  console.log("Setting up test...")
                  const startingTimeStamp = await raffle.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()

                  console.log("Setting up Listener...")
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await raffle.getLatestTimeStamp()

                              await expect(raffle.getPlayers(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(raffleState, 0)
                              //   assert(
                              //       winnerEndingBalance.toString(),
                              //       winnerStartingBalance.add(raffleEntranceFee).toString()
                              //   )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      // Then enter raffle
                      console.log("Entering Raffle...")
                      const tx = await raffle.enterRaffle({ value: raffleEntranceFee })
                      //   await tx.wait(1)
                      //   console.log("Ok, time to wait...")
                      //   const winnerStartingBalance = await accounts[0].getBalance()
                  })
              })
          })
      })
