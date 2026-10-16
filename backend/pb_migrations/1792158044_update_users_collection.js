/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  // Define fields to add
  collection.fields.addAt(10, new SelectField({
    name: "gender",
    required: true,
    values: ["male", "female"]
  }));

  collection.fields.addAt(11, new TextField({
    name: "first_name_fa",
    required: true,
  }));

  collection.fields.addAt(12, new TextField({
    name: "last_name_fa",
    required: true,
  }));

  collection.fields.addAt(13, new TextField({
    name: "first_name_en",
    required: true,
  }));

  collection.fields.addAt(14, new TextField({
    name: "last_name_en",
    required: true,
  }));

  collection.fields.addAt(15, new TextField({
    name: "national_id",
    required: true,
  }));

  collection.fields.addAt(16, new SelectField({
    name: "region_county",
    required: true,
    values: [
      "Tehran", "Shemiranat", "Rey", "Eslamshahr", "Shahriar",
      "Varamin", "Damavand", "Firoozkooh", "Pakdasht", "Pardis",
      "Qarchak", "Robat Karim", "Malard", "Baharestan", "Pishva", "Qods"
    ]
  }));

  collection.fields.addAt(17, new TextField({
    name: "club",
    required: false,
  }));

  // Add unique index for national_id
  collection.indexes.push("CREATE UNIQUE INDEX idx_users_national_id ON users (national_id)");

  // API Rules:
  // Create: Public signup allowed ("")
  // Read / Update / Delete: Restricted to authenticated user owning record ("id = @request.auth.id")
  collection.listRule = "id = @request.auth.id";
  collection.viewRule = "id = @request.auth.id";
  collection.createRule = "";
  collection.updateRule = "id = @request.auth.id";
  collection.deleteRule = "id = @request.auth.id";

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");

  collection.fields.removeByName("gender");
  collection.fields.removeByName("first_name_fa");
  collection.fields.removeByName("last_name_fa");
  collection.fields.removeByName("first_name_en");
  collection.fields.removeByName("last_name_en");
  collection.fields.removeByName("national_id");
  collection.fields.removeByName("region_county");
  collection.fields.removeByName("club");

  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_users_national_id"));

  return app.save(collection);
})
