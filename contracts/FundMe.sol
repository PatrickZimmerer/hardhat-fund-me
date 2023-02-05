// SPDX-License-Identifier: MIT
// Solidity Version
pragma solidity ^0.8.8;
// Imports
import "./PriceConverter.sol";
// Error Codes with double underscore plus name beforehand
// to identify error source
error FundMe__NotOwner();

// Interfaces, Libraries, Contracts

// NATSPEC Commenting type
/// @title A contract for crowd funding
/// @author Patrick Zimmerer
/// @notice This contract is to demo a sample funding contract
/// @dev This implements price feeds as our library
contract FundMe {
    // Type Declarations

    using PriceConverter for uint256;

    // State Variables

    mapping(address => uint256) public addressToAmountFunded;
    address[] public funders;

    address public immutable i_owner;
    uint256 public constant MINIMUM_USD = 50 * 1e18;
    AggregatorV3Interface public priceFeed;

    // Events / Modifiers

    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        // require(msg.sender == i_owner, "Sender is not owner!");
        _;
    }

    // Functions Order:
    // constructor
    // receive
    // fallback
    // external
    // public
    // internal
    // private
    // view / pure

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /// @notice This functions funds this contract
    /// @dev This puts the funder in the funder array and mapps the sent value to his address
    function fund() public payable {
        require(
            msg.value.getConversionRate(priceFeed) >= MINIMUM_USD,
            "Didn't send enough"
        );
        funders.push(msg.sender);
        addressToAmountFunded[msg.sender] = msg.value;
    }

    /// @notice This functions is used to withdraw the funds in this contract
    /// @dev This resets the funders array
    function withdraw() public onlyOwner {
        for (uint256 i = 0; i < funders.length; i++) {
            address funder = funders[i];
            addressToAmountFunded[funder] = 0;
        }
        funders = new address[](0);

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }
}
