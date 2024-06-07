var fs = require('fs');
var web3 = require('web3');

const {Main, BadEtherstNode, GoodEtherstNode, NormalEtherstNode, EtherstNode} = require('../test-includes/etherst-node');

//import { BadEtherstNode, GoodEtherstNode, NormalEtherstNode } from '../test-includes/etherst-node';

const PKIToken = artifacts.require("PKIToken");
const Ethrust = artifacts.require("Ethrust");
//let pki = await PKIToken.deployed();
//let ethrust = await Ethrust.deployed();


const APPROVED_AMOUNT = 50;

const TOTAL_ACCOUNT_COUNT = 100;
const SIM_ACCOUNT_COUNT = 90;

const ATTR_PER_ACCOUNT_MAX = 6;


ACTIVITY_COUNT = SIM_ACCOUNT_COUNT * 2;


GAS_LIMIT = 3000000;


var writableStream = null;



function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}
  

Array.prototype.extend = function (other_array) {
    /* You should include a test to check whether other_array really is an array */
    other_array.forEach(function(v) {this.push(v)}, this);
}


// Shuffle with Fisher-Yates algorithm (aka Knuth)
function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

/* Randomize array in-place using Durstenfeld shuffle algorithm */

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
  
function generateRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

function generateRandomIntInclusiveAndNotIn(min, max, excluded) {
    let no = -1;
    do {
        no = generateRandomIntInclusive(min, max);
    } while(excluded.includes(no))

    return no;
}

function numberGenerator(arr, min, max, total, allowDuplicate) {
    if (arr.length >= total) return;
    let newNumber = NaN;

    if(!allowDuplicate) {
        do {
            newNumber = generateRandomIntInclusive(min, max);
        }
        while (arr.indexOf(newNumber) >= 0)
    } else {
        newNumber = generateRandomIntInclusive(min, max);
    }

    arr.push(newNumber);

    numberGenerator(arr, min, max, total, allowDuplicate);
};


function generateRandomString(size) {
    size = 0 - size
    return Math.random().toString(36).slice(size);
}


function generateRandomAttribute() {
    let randomType = generateRandomString(5);

    let randomData = generateRandomString(10).repeat(10);

    let randomIdentifier = generateRandomIntInclusive(1, 5000);
    randomIdentifier = web3.utils.fromAscii(String(randomIdentifier));

    let randomProof = (generateRandomIntInclusive(1, 5000) % 2 == 1);

    randomAttribute = new Array();
    randomAttribute["type"] = randomType;
    randomAttribute["id"] = randomIdentifier;
    randomAttribute["data"] = randomData;
    randomAttribute["has_proof"] = randomProof;

    return randomAttribute;
}
/*
async function showBalance(pki, accounts, i) {
    let bal = await pki.balanceOf(accounts[i]);
    console.log("Balance of accounts [" + i + "]," + bal.toString());
}

async function showAllBalances(pki, accounts) {
    for(let i=0; i<accounts.length; ++i) {
        await showBalance(pki, accounts, i);
    }
    console.log("Done showBalances");
}
*/

async function writeBalance(node) {
    let bal = await node.getPkiBalance();
    console.log(`${node.getAccount()}, ${node.node_type}, ${bal}`);

    // write to stream
    writableStream.write(`\n${node.node_type}, ${bal}`);
}


async function increaseAllowance(node, amount) {
    await node.increaseAllowance(amount);
}


async function increaseAllowances(nodes, amount) {

    let promises = nodes.map(node => increaseAllowance(node, amount));

    await Promise.all(promises);

    console.log("Increase " + nodes.length + " allowances with amount " + amount);

}


async function createAttribute(node, attrType, i, data) {
    let id = web3.utils.fromAscii(String(i));
    await node.createAttribute(attrType, id, data);
}


async function createAttributes(nodes) {
    attrType = "id";
    data = "somedata";

    let promises = nodes.map((node, i) => createAttribute(node, attrType, i, data));

    let results = await Promise.all(promises);


}

async function createAndSignAttribute(node, attrType, i, data) {
    let id = web3.utils.fromAscii(String(i));
    let attrId = await node.createAttribute(attrType, id, data);
    let signatureId = await node.signAttribute(attrId);
    return signatureId;
}

async function createAndSignAttributes(nodes) {
    attrType = "id";
    data = "somedata";

    let promises = nodes.map((node, i) => createAndSignAttribute(node, attrType, i, data));

    let results = await Promise.all(promises);
}


async function addAndSignAttribute() {
    account = this.account;
    a = generateRandomAttribute();
    let attr = await this.ethrust.createAttribute(a['type'], /* a['has_proof'],*/ a['id'], a['data'], {"from": account});

    attrId = attr.logs[0].args['attributeID'];
    let expiry = new Date().setFullYear(new Date().getFullYear() + 1)
    let signature = await this.ethrust.signAttribute(attrId, expiry, {"from": account});

    if(!Array.isArray(this.ethrust.accounts[account]['attrIDs'])) {
        this.ethrust.accounts[account]['attrIDs'] = new Array();
    }
    if(!Array.isArray(this.ethrust.accounts[account]['signIDs'])) {
        this.ethrust.accounts[account]['signIDs'] = new Array();
    }

    this.ethrust.accounts[account]['attrIDs'].push(attr.logs[0].args['attributeID']);
    this.ethrust.accounts[account]['signIDs'].push(signature.logs[0].args['signatureID']);

    return signature;
}

async function trustSignature(ethrust, account, signatureID) {

    let status = await ethrust.trustSignature(signatureID, {"from": account});

    return status;
}

async function unTrustSignature(ethrust, account, signatureID) {
    let status = await ethrust.unTrustSignature(signatureID, {"from": account});

    return status;
}

function getRandomSignatureID(ethrust, accounts, account) {

    let randomIndex = -1;
    do {
        randomIndex = generateRandomIntInclusive(0, ethrust.arrAccounts.length - 1);
    } while(accounts[randomIndex]==account)

    let randomSignIndex = generateRandomIntInclusive(0, ethrust.accounts[ethrust.arrAccounts[randomIndex]]['signIDs'].length - 1);

    let signatureID = ethrust.accounts[ethrust.arrAccounts[randomIndex]]['signIDs'][randomSignIndex]

    let data = new Map();
    data.set('account', randomIndex);
    data.set('signatureID', signatureID);
    return data;
}


async function doTrustSignature(ethrust, accounts, account) {
    let data = getRandomSignatureID(ethrust, accounts, account);
    console.log(`${account} trust signature ${data.get('signatureID')} of account[${data.get('account')}]`);
    return await trustSignature(ethrust, account, data.get('signatureID'));
}

async function doUnTrustSignature(ethrust, accounts, account) {
    let data = getRandomSignatureID(ethrust, accounts, account);
    console.log(`${account} untrust signature ${data.get('signatureID')} of account[${data.get('account')}]`);

    return await unTrustSignature(ethrust, account, data.get('signatureID'));
}


async function randomActivities(pki, ethrust, accounts) {

    let activities = [trustSignature, unTrustSignature];

    let activityIndex = [];

    numberGenerator(activityIndex, 0, activities.length-1, ACTIVITY_COUNT, true);

    //console.log(activityIndex);

    let randomActivities = [];
    for(let i=0; i < activityIndex.length; ++i) {
        randomActivities.push(activities[activityIndex[i]]);
    }
    //console.log(randomActivities);

    let promises = randomActivities.map(activityHandler, {pki: pki, ethrust: ethrust, accounts: accounts });
    await Promise.all(promises);

}


async function activityHandler(activity) {
    pki = this.pki;
    ethrust = this.ethrust;
    accounts = this.accounts;

    let randomIndex = generateRandomIntInclusive(1, accounts.length - 1);
        
    account = accounts[randomIndex];
    //console.log(activity);

    switch(activity.name) {
        case 'addAndSignAttribute':
            //doAddAndSignAttribute(pki, ethrust, accounts, account);
            break;
        case 'trustSignature':
            doTrustSignature(ethrust, accounts, account);
            break;
        case 'unTrustSignature':
            doUnTrustSignature(ethrust, accounts, account);
            break;
    }

}

/*
let attributeIds = []
let signatureIds = []
*/

async function nodeActivityOld(all, bad, good, normal, nonBad, me) {
    await delay(1000);
    // trust badnodes
    // trust any nodes
    // randomly untrust any non bad nodes
    let rand = null;
    let targetNode = null;
    // let signatureId = null; 
    // const nonBad = good.concat(normal);
    const activities = ['trustSignature', 'untrustSignature'];
    rand = generateRandomIntInclusive(0, activities.length - 1);

    //console.log(`@nodeActivity: rand : ${rand}`);
    switch(activities[rand]) {
        case 'trustSignature':
            if(me.node_type == 'B') {
                // find bad Node
                do {
                    rand = generateRandomIntInclusive(0, all.length - 1);
                    targetNode = all[rand];
                    // console.log(`@nodeActivity: ${targetNode.account} vs ${me.account}`)
                } while(targetNode.account != me.account)
            }
            else if(me.node_type == 'N'||me.node_type == 'G') {
                rand = generateRandomIntInclusive(0, nonBad.length - 1);
                targetNode = nonBad[rand];
            }
            var [signatureId] = targetNode.signaturesMap.values();
            return await me.trustNode(signatureId);
            // return await trustSignature(ethrust, account, data.get('signatureID'));
            //break;
        case 'unTrustSignature':
            if(me.node_type == 'B') {
                // find non bad Node
                rand = generateRandomIntInclusive(0, nonBad.length - 1);
                targetNode = nonBad[rand];
            }
            else if(me.node_type == 'N'||me.node_type == 'G') {
                // find bad Node                
                rand = generateRandomIntInclusive(0, bad.length - 1);
                targetNode = bad[rand];
            }

            var [signatureId] = targetNode.signaturesMap.values();
            return await me.untrustNode(signatureId);
            // return await untrustSignature(ethrust, account, data.get('signatureID'));
            //break;
    }

}

async function doRandomActivity(me, target, activities, signatureId){

    //const activities = ['trustSignature', 'untrustSignature'];
    rand = generateRandomIntInclusive(0, activities.length - 1);
    //console.log(`@nodeActivity: rand : ${rand}`);
    activity = activities[rand];
    

    if(activity.length > 0)
        console.log(`(${me.getAccount()}) ${me.node_type} ${activity} on ${target.node_type} (${target.getAccount()})`);
    else
        console.log(`(${me.getAccount()}) ${me.node_type} do nothing on ${target.node_type} (${target.getAccount()})`);

    if(activity == 'trust') {
        return await me.trustNode(signatureId);
    }
    else if(activity == 'untrust') {
        return await me.untrustNode(signatureId);
    }
    return await new Promise(r => setTimeout(r, 100));
}

async function nodeActivity(a /* actor index */, j /*target index */, all /* all nodes */) {
    var me = all[a];
    var target = all[j]; 
    /* same node */
    if(me.getAccount() == target.getAccount()) return await new Promise(r => setTimeout(r, 100));
    //await delay(1000);
    // trust badnodes
    // trust any nodes
    // randomly delay 
    let rand = null;
    rand = generateRandomIntInclusive(1, 10);
    await delay(rand*100);

    // let targetNode = null;
    // let signatureId = null; 
    // const nonBad = good.concat(normal);
    // const activities = ['trustSignature', 'untrustSignature'];
    // rand = generateRandomIntInclusive(0, activities.length - 1);
    // console.log(`@nodeActivity: rand : ${rand}`);

    
    var [signatureId] = target.signaturesMap.values();
    var targetType = target.node_type;
    

    switch(me.node_type) { // current note is ?
        case 'B':
            switch(targetType) { /* target node is ? */
                case 'B':
                    console.log(`(${me.getAccount()}) ${me.node_type} trust on ${target.node_type} (${target.getAccount()})`);
                    return await me.trustNode(signatureId);
                case 'N':
                    return await doRandomActivity(me, target, ['trust' ,'untrust'], signatureId);
                case 'G':
                    console.log(`(${me.getAccount()}) ${me.node_type} untrust on ${target.node_type} (${target.getAccount()})`);
                    
                    return await me.untrustNode(signatureId);
            }
            break;
        case 'N': /* If this is a normal node */
            switch(targetType) { /* target node is ? */
                case 'B': /* normal on bad node */
                    return await doRandomActivity(me, target, ['untrust', 'untrust', 'untrust', ''], signatureId);
                    // return await trustSignature(ethrust, account, data.get('signatureID'));
                    //break;
                case 'N':
                    return await doRandomActivity(me, target, ['trust', 'untrust', '', ''], signatureId);
                case 'G':
                    return await doRandomActivity(me, target, ['trust', 'trust', ''], signatureId);
                    // return await untrustSignature(ethrust, account, data.get('signatureID'));
                    //break;
            }
            break;
        case 'G':
            switch(targetType) { /* target node is ? */
                case 'B':
                    console.log(`(${me.getAccount()}) ${me.node_type} untrust on ${target.node_type} (${target.getAccount()})`);
                    return await me.untrustNode(signatureId);
                    // return await trustSignature(ethrust, account, data.get('signatureID'));
                    //break;
                case 'N': /* G node on N node */
                    // return await doRandomActivity(me, target, ['trust', 'trust', ''], signatureId);
                    console.log(`(${me.getAccount()}) ${me.node_type} trust on ${target.node_type} (${target.getAccount()})`);
                    return await me.trustNode(signatureId);

                case 'G':
                    console.log(`(${me.getAccount()}) ${me.node_type} trust on ${target.node_type} (${target.getAccount()})`);
                    return await me.trustNode(signatureId);
                    // return await untrustSignature(ethrust, account, data.get('signatureID'));
                    //break;
            }
            break;
    }
    

}


async function simulateActivities(all, bad, good, normal) {
    let count = 1;
    let badCount = 0;
    let goodCount = 0;
    let normalCount = 0;
    let actNodes = new Array();
    const nonBad = good.concat(normal);

    // Bad nodes - prepare bad activity 
    // Normal nodes - 
    // Good nodes -
    //let i = 0;
   
    shuffleArray(all);

    console.log("@simulateActivities: Before start nodeActivity");

    let promises = null;
    let all_promises = new Array();

    for(var j=0; j < all.length; ++j) {
        var actors = new Array();
        for(var k=0; k < all.length; ++k)
            actors.push(k);

        shuffleArray(actors);
        
        promises = actors.map((a, i) =>  nodeActivity(a, j, all).catch((e) => {
            console.error("nodeActivity Error: " + e );
        })); 
        //promises = all.map((node, i) => nodeActivity(node, i, j, all));
        all_promises = all_promises.concat(promises);
    }
    let results = await Promise.allSettled(all_promises).then((results) => results.forEach((result, i) => console.log(i.toString() + ": " + result.status)));

    promises = all.map((node, i) => writeBalance(node));
    results = await Promise.all(promises);

}



contract("Simulation", async accounts => {
    it("Start simulation", async () => {
        //let account = web3.eth.accounts.create();
        //accounts.push(account.address);
        /*
        let accountIndex = [];
        let result = [];
       //numberGenerator(result, 2, 10, 6, myIndex);


       //for(let i=0; i < 10; ++i) {
           numberGenerator(accountIndex, 1, 9, 10,[]);
         //  result.extend(accountIndex);
        //}

    

       console.log(accountIndex);
       */

        let trustLevel = parseInt(process.env.ETHERST_TRUST_LEVEL);
        let untrustLevel = parseInt(process.env.ETHERST_UNTRUST_LEVEL);

        let trustAmount = parseInt(process.env.ETHERST_TRUST_AMOUNT);
        let untrustAmount = parseInt(process.env.ETHERST_UNTRUST_AMOUNT);

        let totalNodes = parseInt(process.env.TOTAL_NODES);
        let badPercent = parseInt(process.env.BAD_PERCENT);
        let goodPercent = parseInt(process.env.GOOD_PERCENT);
        let normalPercent = 100 - badPercent - goodPercent;

        console.log("Trust Level : " + trustLevel);
        writableStream = fs.createWriteStream("./output/sim_diff_levels/result/trust-" + trustLevel + "_untrust-" + untrustLevel + "_totalNodes-" + totalNodes + "_badPercent-" + badPercent + "_goodPercent-" + goodPercent + ".csv");

        writableStream.write("\nTrust Level :" + trustLevel);
        writableStream.write("\nUnTrust Level :" + untrustLevel);
        writableStream.write("\nAmount Trust :" + trustAmount);
        writableStream.write("\nAmount Untrust :" + untrustAmount);
        writableStream.write("\nTotal nodes: " + totalNodes);
        writableStream.write("\nBad Percent: " + badPercent);
        writableStream.write("\nGood Percent: " + goodPercent);
        writableStream.write("\nNormal Percent: " + normalPercent);

        // writableStream.end();
        // writableStream.close();
        
        let pki = await PKIToken.deployed();       
        let ethrust = await Ethrust.deployed();
        Main.etherst = ethrust;
        Main.pki = pki;

        // Create a Map to keep the accounts related simulation data such as attribute
        // ethrust.accounts = new Map();
        // ethrust.arrAccounts = new Array();

        // Initialise the account[0] as facet
        let result = null;
        result = await Main.etherst.setTrustLevel(trustLevel);
        result = await Main.etherst.setUnTrustLevel(untrustLevel);
        result = await Main.etherst.setTrustAmount(trustAmount);
        result = await Main.etherst.setUnTrustAmount(untrustAmount);
        result = await Main.etherst.setDelayFactor(0);

        let status = await pki.increaseAllowance(ethrust.address, 100000, {"from": accounts[0]});

        //let myAccounts = [];
        //let accountIndex = []

        let allNodes = null;
        let badNodes = new Array();
        let goodNodes = new Array();
        let normalNodes = new Array();

        let badNodeCount =  Math.floor(totalNodes * badPercent / 100);
        let goodNodeCount =  Math.floor(totalNodes * goodPercent / 100);

        let normalNodeCount = totalNodes - badNodeCount - goodNodeCount;

        let a = 1;
        let node = null;
        for(i=0; i< badNodeCount; ++i) {
            node = new BadEtherstNode(accounts[a++]);
            //nodes.push(node);
            badNodes.push(node);
            //allNodes.push(node);
        }

        for(i=0; i< goodNodeCount; ++i) {
            node = new GoodEtherstNode(accounts[a++]);
            goodNodes.push(node);
            //allNodes.push(node);
        }

        for(i=0; i< normalNodeCount; ++i) {
            node = new NormalEtherstNode(accounts[a++])
            normalNodes.push(node);
            //allNodes.push(node);
        }


        allNodes = badNodes.concat(goodNodes, normalNodes);
        console.log(`Total Accounts :  ${accounts.length}`);
        console.log(`Total Nodes :  ${allNodes.length}`);

        shuffleArray(allNodes);
        // console.log(nodes);


        // increase the transfer allowance for each node with amount = APPROVED_AMOUNT
        await increaseAllowances(allNodes, APPROVED_AMOUNT);

        // Each node create an attribute and sign it
        await createAndSignAttributes(allNodes);

        // start simulation
        await simulateActivities(allNodes, badNodes, goodNodes, normalNodes);

        // Write Stream
        writableStream.end();
        writableStream.close();


        /*
        let attrId = badNodes[1].attributes[0];
        badNodes[0].trustNode(badNodes[1].signaturesMap[attrId]);
        */




    /*

       // Prepare random accounts
       numberGenerator(accountIndex, 1, TOTAL_ACCOUNT_COUNT - 1, SIM_ACCOUNT_COUNT , false);


       console.log("Accounts : " + accountIndex.toString());
       for(let i=0; i<accountIndex.length; ++i) {
           myAccounts.push(accounts[accountIndex[i]]);
       }

       for(let i=0; i<accountIndex.length; ++i) {
           let account = myAccounts[i];
           if(!Array.isArray(ethrust.accounts[account])) {
               ethrust.accounts[account] = new Array();
               ethrust.arrAccounts.push(account);
           }
       }

       await increaseAllowances(pki, ethrust, myAccounts);

       // All accounts except facet (accounts[0]), create attributes
       let data = await createAttributes(ethrust, myAccounts);
       //let data = await createAttributes(ethrust, accounts.slice(1));

       for(let i=0; i<accountIndex.length; ++i) {
           console.log(`${myAccounts[i]}  : ${ethrust.accounts[myAccounts[i]]}`);
           console.log(ethrust.accounts[myAccounts[i]]);
       }

       // Start random activities
       await randomActivities(pki, ethrust, accounts);

       await showAllBalances(pki, myAccounts);
       */
     });

    /*
  it("should add an attribute from account[2]", async () => {

    let pki = await PKIToken.deployed();
    let ethrust = await Ethrust.deployed();

    // increase allowance for accounts[0] (facet of PKIToken)
    let accounts = await web3.eth.getAccounts();

    let status = await pki.increaseAllowance(ethrust.address, 100000, {"from": accounts[0]});

    let attrId = await ethrust.createAttribute("IC", "0x1", "000101-04-5876", "testhash1", {"from": accounts[2]});
    //console.log(attrId);

    let balance = await pki.balanceOf(accounts[2]);
    console.log(balance.toString());
    console.log(attrId.logs[0].args['attributeID'].toString());
    assert.equal(attrId.logs[0].args['data'], "000101-04-5876");
  });
  */
/*
  it("Add attribute and sign it", async () => {
      let pki = await PKIToken.deployed();
      let ethrust = await Ethrust.deployed();

      // increase allowance for accounts[0] (facet of PKIToken)
      let accounts = await web3.eth.getAccounts();

      let status = await pki.increaseAllowance(ethrust.address, 100000, {"from": accounts[0]});

      let attrId = await ethrust.createAttribute("IC", "0x1", "000101-04-5876", "testhash1", {"from": accounts[2]});

      attrId = attrId.logs[0].args['attributeID'];
      let expiry = new Date().setFullYear(new Date().getFullYear() + 1)
      let signatureId = await ethrust.signAttribute(attrId, expiry, {"from": accounts[2]});

      signatureId = signatureId.logs[0].args['signatureID'];
      assert.equal(signatureId >= 0, true);
  });
*/
/*
  it("Add attribute, sign it, trusted by another account", async () => {

      const APPROVED_AMOUNT = 50;
      let pki = await PKIToken.deployed();
      let ethrust = await Ethrust.deployed();

      // increase allowance for accounts[0] (facet of PKIToken)
      let accounts = await web3.eth.getAccounts();

      let status = await pki.increaseAllowance(ethrust.address, 100000, {"from": accounts[0]});

      // Increase allowance
      // need to issue from here, cannot be in Ethrust (because caller is always Ethrust if call from Ethrust)
      status = await pki.increaseAllowance(ethrust.address, APPROVED_AMOUNT, {"from": accounts[2]});
      status = await pki.increaseAllowance(ethrust.address, APPROVED_AMOUNT, {"from": accounts[3]});

      let attrId = await ethrust.createAttribute("IC", "0x1", "000101-04-5876", "testhash1", {"from": accounts[2]});

      console.log(attrId.logs[0]);

      attrId = attrId.logs[0].args['attributeID'];
      let expiry = new Date().setFullYear(new Date().getFullYear() + 1)
      let signatureId = await ethrust.signAttribute(attrId, expiry, {"from": accounts[2]});

      // console.log("whole logs[0].args");
      // console.log(signatureId.logs[0].args);
      // console.log("whole logs[0].args[signatureID]");
      //
      // console.log(signatureId.logs[0].args['signatureID']);
      //
      // console.log("signatureID");
      signatureId = signatureId.logs[0].args['signatureID'];

      // Trust from account[3]
      status = await ethrust.trustSignature(signatureId, {"from": accounts[3]});

      console.log(status);
      // Retrust
      //status = await ethrust.trustSignature(signatureId, {"from": accounts[3]});
      console.log(status.logs[0]);


      status = await ethrust.unTrustSignature(signatureId, {"from": accounts[4]});

      console.log("untrust by account[4], balance of accounts[4]");

      let bal = await pki.balanceOf(accounts[4]);
      console.log("Balance of accounts [4]: " + bal.toString());


      console.log(status.logs[0]);

      status = await ethrust.unTrustSignature(signatureId, {"from": accounts[5]});
      console.log("untrust by account[5]");
      bal = await pki.balanceOf(accounts[5]);
      console.log("Balance of accounts [5]: " + bal.toString());



      console.log(status.logs[0]);

      showAllBalances(pki, accounts);


      assert.equal(signatureId >= 0, true);
  });

*/
/*
  it("Start simulations", async () => {

      console.log("random create 50 attributes from different accounts");
      let pki = await PKIToken.deployed();
      let ethrust = await Ethrust.deployed();

      // increase allowance for accounts[0] (facet of PKIToken)
      let accounts = await web3.eth.getAccounts();

      let status = await pki.increaseAllowance(ethrust.address, 100000, {"from": accounts[0]});

      // Increase allowance
      // need to issue from here, cannot be in Ethrust (because caller is always Ethrust if call from Ethrust)
      //status = await pki.increaseAllowance(ethrust.address, APPROVED_AMOUNT, {"from": accounts[2]});
      //status = await pki.increaseAllowance(ethrust.address, APPROVED_AMOUNT, {"from": accounts[3]});

      let result = await createAttributes(ethrust, accounts);

      console.log(result);

  });

*/

  /*
  it("should send coin correctly", async () => {
    // Get initial balances of first and second account.
    let account_one = accounts[0];
    let account_two = accounts[1];

    let amount = 10;

    let instance = await PKIToken.deployed();
    let pki = instance;

    let balance = await pki.getBalance.call(account_one);
    let account_one_starting_balance = balance.toNumber();

    balance = await pki.getBalance.call(account_two);
    let account_two_starting_balance = balance.toNumber();
    await pki.sendCoin(account_two, amount, { from: account_one });

    balance = await pki.getBalance.call(account_one);
    let account_one_ending_balance = balance.toNumber();

    balance = await pki.getBalance.call(account_two);
    let account_two_ending_balance = balance.toNumber();

    assert.equal(
      account_one_ending_balance,
      account_one_starting_balance - amount,
      "Amount wasn't correctly taken from the sender"
    );
    assert.equal(
      account_two_ending_balance,
      account_two_starting_balance + amount,
      "Amount wasn't correctly sent to the receiver"
    );
  });
  */
});
