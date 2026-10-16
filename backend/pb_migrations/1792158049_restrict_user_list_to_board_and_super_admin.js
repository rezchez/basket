/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  // Server-side rule: Only Senior Manager (مدیر ارشد) and Board Chair (رییس هیئت)
  // are permitted to list and view all other users.
  // Regular users can only view their own user record (id = @request.auth.id).
  collection.listRule = "id = @request.auth.id || @request.auth.role = 'مدیر ارشد' || @request.auth.role = 'رییس هیئت'";
  collection.viewRule = "id = @request.auth.id || @request.auth.role = 'مدیر ارشد' || @request.auth.role = 'رییس هیئت'";

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.listRule = "@request.auth.id != ''";
  collection.viewRule = "@request.auth.id != ''";
  return app.save(collection);
});
