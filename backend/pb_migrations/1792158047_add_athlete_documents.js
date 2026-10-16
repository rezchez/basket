/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  collection.fields.add(new FileField({
    name: "birth_certificate_photo",
    required: false,
    maxSelect: 1,
    maxSize: 5242880,
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp"
    ],
    thumbs: ["200x200"]
  }));

  collection.fields.add(new FileField({
    name: "national_card_front",
    required: false,
    maxSelect: 1,
    maxSize: 5242880,
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp"
    ],
    thumbs: ["200x200"]
  }));

  collection.fields.add(new FileField({
    name: "national_card_back",
    required: false,
    maxSelect: 1,
    maxSize: 5242880,
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp"
    ],
    thumbs: ["200x200"]
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("birth_certificate_photo");
  collection.fields.removeByName("national_card_front");
  collection.fields.removeByName("national_card_back");
  return app.save(collection);
});
