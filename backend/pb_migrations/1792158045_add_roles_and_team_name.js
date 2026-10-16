/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  // Add role select field
  collection.fields.addAt(18, new SelectField({
    name: "role",
    required: false,
    values: ["مدیر ارشد", "رییس هیئت", "رییس کمیته", "مدیر تیم", "ورزشکار"]
  }));

  // Add team_name text field for مدیر تیم (نام تیم)
  collection.fields.addAt(19, new TextField({
    name: "team_name",
    required: false,
  }));

  // Allow authenticated users to view/list registered users
  collection.listRule = "@request.auth.id != ''";
  collection.viewRule = "@request.auth.id != ''";
  collection.updateRule = "@request.auth.role = 'مدیر ارشد' || id = @request.auth.id";

  app.save(collection);

  // Set default role for all existing users to "ورزشکار"
  app.db().newQuery("UPDATE users SET role = 'ورزشکار' WHERE role IS NULL OR role = ''").execute();

  // Set role for user "رضا چگینی" to "مدیر ارشد"
  app.db().newQuery("UPDATE users SET role = 'مدیر ارشد' WHERE (first_name_fa = 'رضا' AND last_name_fa = 'چگینی') OR email = 'rezach91@gmail.com'").execute();
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");

  collection.fields.removeByName("role");
  collection.fields.removeByName("team_name");

  collection.listRule = "id = @request.auth.id";
  collection.viewRule = "id = @request.auth.id";
  collection.updateRule = "id = @request.auth.id";

  return app.save(collection);
});
