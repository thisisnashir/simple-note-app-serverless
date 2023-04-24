'use strict';

const dynamoDb = require("aws-sdk/clients/dynamodb");
const documentClient = new dynamoDb.DocumentClient({region: 'ap-south-1'});

module.exports.createNote = async (event,context,cb) => {
  try{
    let data = JSON.parse(event.body);
    let params = {
      TableName: "notesTable",
      Item: {
        notesId: data.id,
        title: data.title,
        body: data.body
      },
      ConditionExpression: "attribute_not_exists(notesId)"
    }

    await documentClient.put(params).promise();

    cb(null,{
      statusCode: 201,
      body: JSON.stringify(`A new note has been created with id ${data.id}!`)
    });
  }
  catch(err){
    cb(null,
      {
        statusCode: 500,
        body: err.message});
  }
};

module.exports.updateNote = async (event) => {
  let noteId = event.pathParameters.id;
  return {
    statusCode: 200,
    body: JSON.stringify(`The note with id: ${noteId} has been updated!`)
  };
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