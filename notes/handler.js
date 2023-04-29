'use strict';

const dynamoDb = require("aws-sdk/clients/dynamodb");
const documentClient = new dynamoDb.DocumentClient({region: 'ap-south-1'});
const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;

const send = (statusCode,data) => 
{
  return {statusCode, body: JSON.stringify(data)};
}

module.exports.createNote = async (event,context,cb) => {
  try{
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

    cb(null,send(201,`A new note has been created with id ${data.id}!`));
  }
  catch(err){
    cb(null,send(500,err.message));
  }
};

module.exports.updateNote = async (event,context,cb) => {
  let notesId = event.pathParameters.id;
  let data = JSON.parse(event.body);
  try{
    const params = {
      TableName : NOTES_TABLE_NAME,
      Key: {notesId},
      UpdateExpression: 'set #title = :title, #body = :body', // we could build the query dynamically
            // like : 'set title = ' + data.title + ...
            // but we are using ExpressionAttributeNames,ExpressionAttributeValues for best practices
            // we are using ExpressionAttributeNames because we do not want to accidentally use reserved dynamoDB keywords
            // we could have used ExpressionAttributeValues only too
      ExpressionAttributeNames:{
        '#title' : 'title',
        '#body' : 'body'
      },
      ExpressionAttributeValues:{
        ':title': data.title,
        ':body': data.body
      },
      ConditionExpression: "attribute_exists(notesId)"
    };

    await documentClient.update(params).promise();
    cb(null,send(201,data));
    }
  catch(err){
    cb(null,send(500,err.message));
    }
};

module.exports.deleteNote = async (event) => {
  let noteId = event.pathParameters.id;
  return {
    statusCode: 200,
    body: JSON.stringify(`The note with id: ${noteId} has been deleted successfully!`)
  };
};

module.exports.getAllNotes = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify("Here are all the notes you requested!")
  };
};