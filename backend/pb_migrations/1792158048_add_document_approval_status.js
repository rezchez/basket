/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  collection.fields.add(new SelectField({
    name: "documents_status",
    required: false,
    values: ["pending", "approved", "rejected"],
    maxSelect: 1,
  }));

  collection.fields.add(new TextField({
    name: "documents_reviewed_at",
    required: false,
  }));

  collection.fields.add(new TextField({
    name: "documents_reviewer_name",
    required: false,
  }));

  collection.fields.add(new TextField({
    name: "documents_reject_reason",
    required: false,
  }));

  // Allow self-update, Senior Manager, or Board Chair
  collection.updateRule = "id = @request.auth.id || @request.auth.role = 'مدیر ارشد' || @request.auth.role = 'رییس هیئت'";

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("documents_status");
  collection.fields.removeByName("documents_reviewed_at");
  collection.fields.removeByName("documents_reviewer_name");
  collection.fields.removeByName("documents_reject_reason");
  collection.updateRule = "id = @request.auth.id || @request.auth.role = 'مدیر ارشد'";
  return app.save(collection);
});
