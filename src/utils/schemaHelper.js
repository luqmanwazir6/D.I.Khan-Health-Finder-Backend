/**
 * Helper to configure schema toJSON transforms across all Mongoose models.
 * Ensures:
 * - string `id` is serialized
 * - `_id` is removed
 * - `__v` is removed
 * - sensitive fields (like password) are stripped
 *
 * @param {import('mongoose').Schema} schema
 * @param {Array<string>} [stripFields=[]]
 */
export function configureSchemaTransform(schema, stripFields = []) {
  schema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }
      delete ret.__v;

      for (const field of stripFields) {
        delete ret[field];
      }

      return ret;
    }
  });

  schema.set('toObject', {
    virtuals: true,
    transform: (doc, ret) => {
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }
      delete ret.__v;
      return ret;
    }
  });
}

export default {
  configureSchemaTransform
};
