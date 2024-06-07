// SPDX-License-Identifier: proprietary

//pragma solidity ^0.5.16;
//pragma solidity >=0.4.21 <0.9.0;
pragma solidity ^0.8.0;

//import "./console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
//import "@openzeppelin/contracts/utils/Strings.sol";

contract Ethrust /*is Console*/ {
    IERC20 private _token;
    address private _facet;

    /* Koa: take out the delay check for simulation purpose */
    bool removeDelayCheck = false;
    
    uint private TRUST_LEVEL = 3;
    uint private UNTRUST_LEVEL = 5;
    // uint256 private delayUnit = 1 days;
    
    // for test simulation purpose
    uint256 private delayUnit = 1 seconds;

    uint256 private amountInitial = 50;
    uint256 private amountTrust = 10;
    uint256 private amountUnTrust = 50;
    uint256 private amountWrongTrustFine = amountTrust * 2;

    uint256 private delayFactor = 1;
    uint256 private randomLowerLimit = 5;
    uint256 private randomUpperLimit = 10;

    struct Attribute {
        address owner;
        string attributeType;
        // bool has_proof;
        bytes32 identifier;
        string data;
        //string datahash;
    }

    struct Signature {
        address signer;
        //address attrOwner;
        uint attributeID;
        uint expiry;

        uint trustorCount;
        uint unTrustorCount;
        address[] trustors;
        address[] unTrustors;
    }

    struct Revocation {
        uint signatureID;
    }

    Attribute[] public attributes;
    Signature[] public signatures;
    Revocation[] public revocations;

    mapping(address => bool) hasJoin;

    mapping(uint => mapping(address => bool)) public mapTrustor;
    mapping(uint => mapping(address => bool)) public mapUnTrustor;

    mapping(address => uint256) public mapLastTrustAction;
    mapping(address => uint256) public mapLastTrustActionCount;

    mapping(address => uint256) public mapLastUnTrustAction;
    mapping(address => uint256) public mapLastUnTrustActionCount;

    event AttributeCreated(uint indexed attributeID, address indexed owner, string attributeType, bytes32 indexed identifier, string data/*, string datahash*/);
    event AttributeSigned(uint indexed signatureID, address indexed signer, uint indexed attributeID, uint expiry);
    event SignatureRevoked(uint indexed revocationID, uint indexed signatureID);

    //event SignatureTrusted(uint indexed signatureID, uint indexed attributeID, address indexed trustor);
    event SignatureTrusted(uint indexed signatureID, uint indexed attributeID, address[] trustors);

    event SignatureUnTrusted(uint indexed signatureID, uint indexed attributeID, address[] unTrustors, uint count);
    event SignatureRevokedByOthers(uint indexed signatureID, uint indexed attributeID, address[] unTrustors);

    event TokenTransferred(bool status);

    constructor (IERC20 token, address facet) {
        _token = token;
        _facet = facet;
        
        /*
        setTrustLevel(trustLevel);
        setUnTrustLevel(unTrustLevel);
        setDelayUnit(delayUnitCode);
        */
    }
    /*
    function char(byte b) public view returns (byte c) {
        if (uint8(b) < 10) return byte(uint8(b) + 0x30);
        else return byte(uint8(b) + 0x57);
    }


    function toAsciiString(address x) public view returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            byte b = byte(uint8(uint(x) / (2**(8*(19 - i)))));
            byte hi = byte(uint8(b) / 16);
            byte lo = byte(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);            
        }
        return string(s);
    }
    */

    /* Utility function convert uint to str */
    function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (_i != 0) {
            bstr[k--] = bytes1(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }


    function setTrustLevel(uint trustLevel) external {
        if(trustLevel > 0)
            TRUST_LEVEL = trustLevel;

        //require(false, uint2str(TRUST_LEVEL));
    }

    function setUnTrustLevel(uint unTrustLevel) external {
        if(unTrustLevel > 0)
            UNTRUST_LEVEL = unTrustLevel;
    }

    function setTrustAmount(uint amount) external {
        amountTrust = amount;
    }

    function setWrongTrustFineAmount(uint amount) external {
        amountWrongTrustFine = amount;
    }

    function setUnTrustAmount(uint amount) external {
        amountUnTrust = amount;
    }

    function setDelayFactor(uint factor) external {
        delayFactor = factor;
    }

    function setDelayUnit(uint delayUnitCode) external {
        if(delayUnitCode == 1)
            delayUnit = 1 seconds;
        else if(delayUnitCode == 2)
            delayUnit = 1 minutes;
        else if(delayUnitCode == 3)
            delayUnit = 1 hours;
        else if(delayUnitCode == 4)
            delayUnit = 1 days;
        else if(delayUnitCode == 5)
            delayUnit = 1 weeks;
    }


    /* function resetStorage() {
        attributes.length = 0;
        signatures.length = 0;
        revocations.length = 0;
    } */

    function randomRange(uint start, uint end) private view returns (uint) {
        uint randomHash = uint(keccak256(abi.encodePacked(block.difficulty , block.timestamp)));
        return start + randomHash % (end - start);
    }

    function createAttribute(string memory attributeType, bytes32 identifier, string memory data/*, string memory datahash*/) public returns (uint attributeID) {
        bool isApproved = true;

        if(!hasJoin[msg.sender]){
            hasJoin[msg.sender] = true;

            uint balance = _token.balanceOf(msg.sender);
            if(balance < amountInitial) {
                _token.transferFrom(_facet, msg.sender, amountInitial - balance);
            }
            isApproved = false;
        }

        /*
        attributeID = attributes.length++;

        Attribute storage attribute = attributes[attributeID];
        
        attribute.owner = msg.sender;
        attribute.attributeType = attributeType;
        attribute.identifier = identifier;
        attribute.data = data;
        //attribute.datahash = datahash;
        */
        Attribute memory attribute = Attribute(msg.sender, attributeType, identifier, data);
        attributes.push(attribute);

        emit AttributeCreated(attributeID, msg.sender, attributeType, identifier, data/*, datahash*/);
    }

    function signAttribute(uint attributeID, uint expiry) public returns (uint signatureID) {
        /*
        signatureID = signatures.length++;
        Signature storage signature = signatures[signatureID];
        signature.signer = msg.sender;
        signature.attributeID = attributeID;
        signature.expiry = expiry;
        signature.trustorCount = 0;
        signature.unTrustorCount = 0;
        */

        address[] memory trustors;
        address[] memory unTrustors;

        Signature memory signature = Signature(msg.sender, attributeID, expiry, 0, 0, trustors, unTrustors);
        signatures.push(signature);

        //Attribute memory attribute = attributes[attributeID];
        //approveAmount(attribute.owner, address(this), amountTrust);
        emit AttributeSigned(signatureID, msg.sender, attributeID, expiry);
    }

    function revokeSignature(uint signatureID) public returns (uint revocationID) {
        if (signatures[signatureID].signer == msg.sender) {
            /*
            revocationID = revocations.length++;
            Revocation storage revocation = revocations[revocationID];
            revocation.signatureID = signatureID;
            */

            Revocation memory revocation = Revocation(signatureID);
            revocations.push(revocation);

            emit SignatureRevoked(revocationID, signatureID);
        }
    }

    function trustSignature(uint signatureID) public returns (bool status) {
        Signature storage signature = signatures[signatureID];

        status = false;

        uint randomDelay = randomUpperLimit;

        mapLastTrustActionCount[msg.sender]++;
        randomDelay = mapLastTrustActionCount[msg.sender];

        // Console.log(randomDelay);

        if(randomDelay > randomLowerLimit) {
            // Console.log("compare randomDelay");
            randomDelay = randomRange(randomLowerLimit + 1, randomUpperLimit);
        }
        
        if(removeDelayCheck || block.timestamp >= (mapLastTrustAction[msg.sender] + (randomDelay * delayFactor * delayUnit))){
            //require(mapTrustor[signature.attributeID][msg.sender]!=true, "You had trusted it before.");
            // Console.log("@in block.timestamp >"); 

            if(mapTrustor[signature.attributeID][msg.sender]!=true) {

                if (signature.trustors.length < TRUST_LEVEL) {
                    
                    // uint trustorID = signature.trustors.length++;
                    signature.trustorCount++;
                    
                    signature.trustors.push(msg.sender);
                    
                    mapTrustor[signature.attributeID][msg.sender] = true;
                    
                    Attribute memory attribute = attributes[signature.attributeID];
                    //approveAmount(attribute.owner, msg.sender, amountTrust);
                    status = true;

                    if(signature.trustors.length >= TRUST_LEVEL) {
                        for (uint i=0; i<signature.trustors.length; i++) {
                            //uint amountPerUntrustor = amountUnTrust/signature.unTrustors.length;
                            // require(false, "after calc per amount");
                            approveAmount(attribute.owner, signature.trustors[i], amountTrust/signature.trustors.length);
                            //require(false, "after approveAmount");
                        }
                        approveAmount(_facet, attribute.owner, amountTrust * 3/2);

                        emit SignatureTrusted(signatureID, signature.attributeID, signature.trustors);
                        // require(false, "after emit signature revoked");
                    }

                    //emit SignatureTrusted(signatureID, signature.attributeID, msg.sender);
                    //require(false, "It is trust");
                }
            }
        }
        mapLastTrustAction[msg.sender] = block.timestamp;

    }


    function unTrustSignature(uint signatureID) public returns (bool status) {
        
        Signature storage signature = signatures[signatureID];
        status = false;
        //require(mapUnTrustor[signature.attributeID][msg.sender]!=true, "You had untrusted it before.");

        uint randomDelay = randomUpperLimit;

        mapLastUnTrustActionCount[msg.sender]++;
        randomDelay = mapLastUnTrustActionCount[msg.sender];
        if(randomDelay > randomLowerLimit) {
            randomDelay = randomRange(randomLowerLimit + 1, randomUpperLimit);
        }

        if (removeDelayCheck || block.timestamp >= (mapLastUnTrustAction[msg.sender] + (randomDelay * delayFactor * delayUnit))) {

            if(mapUnTrustor[signature.attributeID][msg.sender]!=true&&mapTrustor[signature.attributeID][msg.sender]!=true) {
                if (signature.unTrustorCount < UNTRUST_LEVEL) {
                    
                    signature.unTrustorCount++;

                    signature.unTrustors.push(msg.sender);
                    
                    mapUnTrustor[signature.attributeID][msg.sender] = true;
                    
                    Attribute memory attribute = attributes[signature.attributeID];
                    
                    // approveAmount(attribute.owner, msg.sender, amountUnTrust);
                    status = true;
                    if(signature.unTrustors.length >= UNTRUST_LEVEL) {
                        for (uint i=0; i<signature.unTrustors.length; i++) {
                            //uint amountPerUntrustor = amountUnTrust/signature.unTrustors.length;
                            // require(false, "after calc per amount");
                            approveAmount(attribute.owner, signature.unTrustors[i], amountUnTrust/signature.unTrustors.length);
                            //require(false, "after approveAmount");
                        }

                        for (uint i=0; i<signature.trustors.length; i++) {
                            //uint amountPerUntrustor = amountUnTrust/signature.unTrustors.length;
                            // require(false, "after calc per amount");
                            approveAmount(signature.trustors[i], _facet, amountWrongTrustFine);
                            //require(false, "after approveAmount");
                        }

                        emit SignatureRevokedByOthers(signatureID, signature.attributeID, signature.unTrustors);
                        // require(false, "after emit signature revoked");
                    }
                }
                emit SignatureUnTrusted(signatureID, signature.attributeID, signature.unTrustors, signature.unTrustorCount);
                
            }
        }
        mapLastUnTrustAction[msg.sender] = block.timestamp;
        //require(false, "It is untrust");
    }

    function approveAmount(address sender, address recipient, uint256 amount) public returns (bool status) {
        /*
        try feed.getData(token) returns (uint v) {
            return (v, true);
        } catch Error(string memory ) {
            // This is executed in case
            // revert was called inside getData
            // and a reason string was provided.
            errorCount++;
            return (0, false);
        } 
        */
        /*
        status = _token.transferFrom(sender, address(this), amount);
        status = _token.transfer(recipient, amount);
        */
        try _token.transferFrom(sender, address(this), amount) returns (bool _status) { return _status; }
        catch Error (string memory) {}

        try _token.transfer(recipient, amount) returns (bool _status) { return _status; }
        catch Error (string memory) {}

    }
}
