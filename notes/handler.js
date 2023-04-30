'use strict';

const dynamoDb = require("aws-sdk/clients/dynamodb");
const documentClient = new dynamoDb.DocumentClient({
  region: 'ap-south-1',
  maxRetries: 3,
  httpOptions: {
    timeout: 5000
  }
});
const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;

const send = (statusCode, data) => {
  return { statusCode, body: JSON.stringify(data) };
}

module.exports.createNote = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    let data = JSON.parse(event.body);
    let params = {
      TableName: NOTES_TABLE_NAME,
      Item: {
        notesId: data.id,
        title: data.title,
        body: data.body
      },
      ConditionExpression: "attribute_not_exists(notesId)"
    }

    await documentClient.put(params).promise();

    cb(null, send(201, { message: `A new note has been created with id ${data.id}!` }));
  }
  catch (err) {
    cb(null, send(500, err.message));
  }
};

module.exports.updateNote = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let notesId = event.pathParameters.id;
  let data = JSON.parse(event.body);
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: { notesId },
      UpdateExpression: 'set #title = :title, #body = :body', // we could build the query dynamically
      // like : 'set title = ' + data.title + ...
      // but we are using ExpressionAttributeNames,ExpressionAttributeValues for best practices
      // we are using ExpressionAttributeNames because we do not want to accidentally use reserved dynamoDB keywords
      // we could have used ExpressionAttributeValues only too
      ExpressionAttributeNames: {
        '#title': 'title',
        '#body': 'body'
      },
      ExpressionAttributeValues: {
        ':title': data.title,
        ':body': data.body
      },
      ConditionExpression: "attribute_exists(notesId)"
    };

    await documentClient.update(params).promise();
    cb(null, send(200, data));
  }
  catch (err) {
    cb(null, send(500, err.message));
  }
};

module.exports.deleteNote = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    let notesId = event.pathParameters.id;
    var params = {
      TableName: NOTES_TABLE_NAME,
      Key: { notesId },
      ConditionExpression: "attribute_exists(notesId)"
    };
    await documentClient.delete(params).promise();
    cb(null, send(200, { message: `The note with id: ${notesId} has been deleted!` }));
  }
  catch (err) {
    cb(null, send(500, err.message));
  }

};

module.exports.getAllNotes = async (event, context, cb) => {
  console.log(JSON.stringify(event));
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const params = {
      TableName: NOTES_TABLE_NAME
    };
    const notes = await documentClient.scan(params).promise();
    cb(null, send(200, notes));
  } catch (err) {
    cb(null, send(500, err.message));
  }
};