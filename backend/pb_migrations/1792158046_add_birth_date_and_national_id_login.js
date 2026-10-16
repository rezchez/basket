/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  // 1. Add birth_date field
  collection.fields.addAt(20, new TextField({
    name: "birth_date",
    required: false,
  }));

  // 2. Allow both email and national_id for password authentication
  collection.passwordAuth.identityFields = ["email", "national_id"];

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("birth_date");
  collection.passwordAuth.identityFields = ["email"];
  return app.save(collection);
});
