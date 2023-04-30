'use strict';

const generatePolicy = (principalId, effect, resource) => {
    let authResponse = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
      let policyDocument = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: effect,
            Resource: resource,
            Action: "execute-api:Invoke",
          },
        ],
      };
      authResponse.policyDocument = policyDocument;
    }
    authResponse.context = {
      foo: "bar",
    };
    console.log(JSON.stringify(authResponse));
    return authResponse;
  };
  

module.exports.authHandler = async(event,context,callback) => {
    var token = event.authorizationToken; // allow or deny
    switch(token){
        case "allow":
            callback(null,generatePolicy("user","allow",event.methodArn));
            break;
        case "deny":
            callback(null,generatePolicy("user","deny",event.methodArn));
            break;
        default:
            callback("Error: Invalid token");
    }
}