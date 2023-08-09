pragma solidity ^0.5.16;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract Ethrust {
    IERC20 private _token;
    address private _facet;

    uint constant TRUST_LEVEL = 5;
    uint constant UNTRUST_LEVEL = 5;

    uint256 private amountInitial = 50;
    uint256 private amountTrust = 10;
    uint256 private amountUnTrust = 100;

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
        address attrOwner;
        uint attributeID;
        uint expiry;

        uint trustorCount;
        uint unTrustorCount;
        address[TRUST_LEVEL] trustors;
        address[UNTRUST_LEVEL] unTrustors;
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
    mapping(address => uint256) public mapLastUnTrustAction;

    event AttributeCreated(uint indexed attributeID, address indexed owner, string attributeType, bytes32 indexed identifier, string data/*, string datahash*/);
    event AttributeSigned(uint indexed signatureID, address indexed signer, uint indexed attributeID, uint expiry);
    event SignatureRevoked(uint indexed revocationID, uint indexed signatureID);

    event SignatureTrusted(uint indexed signatureID, uint indexed attributeID, address indexed trustor);
    event SignatureUnTrusted(uint indexed signatureID, uint indexed attributeID, address[UNTRUST_LEVEL] unTrustors, uint count);
    event SignatureRevokedByOthers(uint indexed signatureID, uint indexed attributeID, address[UNTRUST_LEVEL] unTrustors);

    event TokenTransferred(bool status);

    constructor (IERC20 token, address facet) public {
        _token = token;
        _facet = facet;
    }

    /* function resetStorage() {
        attributes.length = 0;
        signatures.length = 0;
        revocations.length = 0;
    } */

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

        //Attribute attribute;
        attributeID = attributes.length++;

        Attribute storage attribute = attributes[attributeID];
        attribute.owner = msg.sender;
        attribute.attributeType = attributeType;
        attribute.identifier = identifier;
        attribute.data = data;
        //attribute.datahash = datahash;

        emit AttributeCreated(attributeID, msg.sender, attributeType, identifier, data/*, datahash*/);
    }

    function signAttribute(uint attributeID, uint expiry) public returns (uint signatureID) {
        signatureID = signatures.length++;
        Signature storage signature = signatures[signatureID];
        signature.signer = msg.sender;
        signature.attributeID = attributeID;
        signature.expiry = expiry;
        signature.trustorCount = 0;
        signature.unTrustorCount = 0;
        //Attribute memory attribute = attributes[attributeID];
        //approveAmount(attribute.owner, address(this), amountTrust);
        emit AttributeSigned(signatureID, msg.sender, attributeID, expiry);
    }

    function revokeSignature(uint signatureID) public returns (uint revocationID) {
        if (signatures[signatureID].signer == msg.sender) {
            revocationID = revocations.length++;
            Revocation storage revocation = revocations[revocationID];
            revocation.signatureID = signatureID;
            emit SignatureRevoked(revocationID, signatureID);
        }
    }

    function trustSignature(uint signatureID) public returns (bool status) {
        Signature storage signature = signatures[signatureID];
        status = false;

        require(now >= (mapLastTrustAction[msg.sender] * 1 days + 1 days));

        //require(mapTrustor[signature.attributeID][msg.sender]!=true, "You had trusted it before.");

        if(mapTrustor[signature.attributeID][msg.sender]!=true) {

            if (signature.trustorCount < TRUST_LEVEL) {
                // uint trustorID = signature.trustors.length++;
                signature.trustorCount++;
                signature.trustors[signature.trustorCount-1] = msg.sender;
                mapTrustor[signature.attributeID][msg.sender] = true;

                Attribute memory attribute = attributes[signature.attributeID];
                approveAmount(attribute.owner, msg.sender, amountTrust);
                status = true;
                emit SignatureTrusted(signatureID, signature.attributeID, msg.sender);
            }
        }
    }


    function unTrustSignature(uint signatureID) public returns (bool status) {
        Signature storage signature = signatures[signatureID];
        status = false;
        //require(mapUnTrustor[signature.attributeID][msg.sender]!=true, "You had untrusted it before.");

        if(mapUnTrustor[signature.attributeID][msg.sender]!=true&&mapTrustor[signature.attributeID][msg.sender]!=true) {
            if (signature.unTrustorCount < UNTRUST_LEVEL) {
                signature.unTrustorCount++;
                signature.unTrustors[signature.unTrustorCount-1] = msg.sender;
                mapUnTrustor[signature.attributeID][msg.sender] = true;

                Attribute memory attribute = attributes[signature.attributeID];
                // approveAmount(attribute.owner, msg.sender, amountUnTrust);
                status = true;
                if(signature.unTrustorCount >= UNTRUST_LEVEL) {
                    for (uint i=0; i<signature.unTrustorCount; i++) {
                        approveAmount(attribute.owner, signature.unTrustors[i], amountUnTrust/signature.unTrustorCount);
                    }
                    emit SignatureRevokedByOthers(signatureID, signature.attributeID, signature.unTrustors);
                }
            }
            emit SignatureUnTrusted(signatureID, signature.attributeID, signature.unTrustors, signature.unTrustorCount);
        }
    }

    function approveAmount(address sender, address recipient, uint256 amount) public returns (bool status) {
        status = _token.transferFrom(sender, address(this), amount);
        status = _token.transfer(recipient, amount);
    }
}
