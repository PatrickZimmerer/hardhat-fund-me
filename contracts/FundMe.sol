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
    mapping(address => uint256) public s_addressToAmountFunded;
    address[] public s_funders;

    address public immutable i_owner;
    uint256 public constant MINIMUM_USD = 50 * 1e18;
    AggregatorV3Interface public s_priceFeed;

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
    constructor(address s_priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(s_priceFeedAddress);
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
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Didn't send enough"
        );
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    /// @notice This functions is used to withdraw the funds in this contract
    /// @dev This resets the s_funders array
    function withdraw() public payable onlyOwner {
        for (uint256 i = 0; i < s_funders.length; i++) {
            address funder = s_funders[i];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }
}
