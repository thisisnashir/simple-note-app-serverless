'use strict';

module.exports.createNote = async (event) => {
  return {
    statusCode: 201,
    body: JSON.stringify("A new note has been created!")
  };
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